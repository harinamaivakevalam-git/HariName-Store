/**
 * Fulfillment Service for Harinama Store
 * Orchestrates automatic Shiprocket shipment creation, idempotency checks,
 * remote order discovery, AWB assignment, and Supabase synchronization.
 */

const shiprocketService = require('./shiprocketService');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

// In-memory mutex to prevent concurrent duplicate processing for the same order
const activeFulfillments = new Map();

/**
 * Helper to fetch complete order with line items from Supabase or local DB
 */
async function fetchCompleteOrder(identifier) {
  if (!identifier) return null;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let q = supabaseAdmin.from('orders').select('*, order_items(*), payments(*)');
      if (isUuid) q = q.eq('id', identifier);
      else q = q.or(`order_number.eq.${identifier},awb_code.eq.${identifier},shiprocket_order_id.eq.${identifier}`);

      const { data: dbOrder, error } = await q.maybeSingle();
      if (!error && dbOrder) {
        return {
          ...dbOrder,
          items: dbOrder.order_items || []
        };
      }
    } catch (sbErr) {
      console.warn('[FulfillmentService] Supabase fetch warning:', sbErr.message);
    }
  }

  // Fallback to local DB
  const localOrder = db.findOne('orders', o =>
    o.id === identifier ||
    o.order_number === identifier ||
    o.awb_code === identifier ||
    o.shiprocket_order_id === identifier
  );

  if (localOrder) {
    const items = db.filter('order_items', oi => oi.order_id === localOrder.id);
    return { ...localOrder, items };
  }

  return null;
}

/**
 * Helper to persist updates to Supabase & local DB
 */
async function persistOrderUpdates(orderId, updates) {
  const finalUpdates = {
    ...updates,
    shipping_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin
        .from('orders')
        .update(finalUpdates)
        .eq('id', orderId);
    } catch (sbErr) {
      console.warn('[FulfillmentService] Supabase update warning:', sbErr.message);
    }
  }

  // 2. Local DB
  try {
    const localOrder = db.findById('orders', orderId) || db.findOne('orders', o => o.order_number === orderId);
    if (localOrder) {
      db.update('orders', localOrder.id, finalUpdates);
    }
  } catch (_) {}
}

/**
 * Main Fulfillment Orchestration Function
 * Safe, idempotent, non-blocking, comprehensive logging
 */
async function processOrderFulfillment(orderOrIdentifier, options = {}) {
  const identifier = typeof orderOrIdentifier === 'string'
    ? orderOrIdentifier
    : (orderOrIdentifier?.order_number || orderOrIdentifier?.id);

  if (!identifier) {
    return { success: false, message: 'Invalid order identifier provided.' };
  }

  // Concurrency lock: If this order is already being processed, wait for existing promise
  if (activeFulfillments.has(identifier)) {
    console.log(`[SHIPROCKET_DUPLICATE_DETECTED] Order ${identifier} is currently being fulfilled. Awaiting result.`);
    return activeFulfillments.get(identifier);
  }

  const fulfillmentPromise = (async () => {
    try {
      console.log(`[SHIPROCKET_CREATE_STARTED] Processing fulfillment for order ${identifier}...`);

      const order = typeof orderOrIdentifier === 'object' && orderOrIdentifier.shipping_address
        ? orderOrIdentifier
        : await fetchCompleteOrder(identifier);

      if (!order) {
        console.error(`[SHIPROCKET_CREATE_FAILED] Order not found: ${identifier}`);
        return { success: false, message: 'Order record not found.' };
      }

      // Strict Test / Wallet Protection Guard:
      // When SHIPROCKET_LIVE_DISPATCH is not 'true' (default: false), completely skip sending to Shiprocket
      // to protect wallet money during testing while still giving immediate order confirmation.
      const isLiveDispatchEnabled = process.env.SHIPROCKET_LIVE_DISPATCH === 'true' && process.env.DISABLE_SHIPROCKET_ORDERS !== 'true';
      const isTestOrder = (order.order_number && String(order.order_number).toUpperCase().includes('TEST')) || process.env.NODE_ENV === 'test';

      if ((!isLiveDispatchEnabled && !options.force) || isTestOrder) {
        console.log(`[SHIPROCKET_WALLET_PROTECTION] Safe testing mode active (SHIPROCKET_LIVE_DISPATCH=${process.env.SHIPROCKET_LIVE_DISPATCH || 'false'}). Skipping Shiprocket order creation for ${order.order_number} to prevent wallet deduction. Order confirmed locally!`);
        return {
          success: true,
          mock: true,
          data: {
            order_id: order.order_number,
            shipping_status: 'MOCK_TEST',
            message: 'Order confirmed successfully. Shiprocket live dispatch disabled for testing to protect wallet balance.'
          }
        };
      }

      // Check payment status rule:
      // For prepaid orders (non-COD), payment must be 'paid' before creating Shiprocket shipment
      const isCod = String(order.payment_method || '').toLowerCase() === 'cod';
      const isPaid = String(order.payment_status || '').toLowerCase() === 'paid';

      if (!isCod && !isPaid && !options.force) {
        console.log(`[SHIPROCKET_CREATE_DEFERRED] Order ${order.order_number} payment is pending (${order.payment_status}). Shipping deferred until payment.`);
        return {
          success: false,
          deferred: true,
          message: 'Shipping deferred until payment confirmation.'
        };
      }

      // 1. Idempotency Check (Local / Database level)
      if (order.shiprocket_order_id && order.shiprocket_shipment_id) {
        console.log(`[SHIPROCKET_DUPLICATE_DETECTED] Order ${order.order_number} already fulfilled (Shiprocket Order: ${order.shiprocket_order_id}, Shipment: ${order.shiprocket_shipment_id}).`);
        return {
          success: true,
          duplicated: true,
          data: {
            order_id: order.order_number,
            shiprocket_order_id: order.shiprocket_order_id,
            shiprocket_shipment_id: order.shiprocket_shipment_id,
            awb_code: order.awb_code,
            courier_name: order.courier_name,
            shipping_status: order.shipping_status || 'ORDER_CREATED'
          }
        };
      }

      // 2. Remote Duplicate Check (Shiprocket API search)
      // Handles recovery if server previously created order in Shiprocket but crashed before saving DB
      const remoteExisting = await shiprocketService.searchOrder(order.order_number);
      if (remoteExisting && remoteExisting.order_id) {
        console.log(`[SHIPROCKET_DUPLICATE_DETECTED] Discovered existing Shiprocket order remotely for ${order.order_number} (SR ID: ${remoteExisting.order_id}, Shipment: ${remoteExisting.shipment_id}). Linking to database.`);

        const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
        currentHistory.push({
          date: new Date().toISOString(),
          status: 'ORDER_CREATED',
          location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'),
          activity: 'Shipment synchronized from Shiprocket'
        });

        const updates = {
          shiprocket_order_id: String(remoteExisting.order_id),
          shiprocket_shipment_id: remoteExisting.shipment_id ? String(remoteExisting.shipment_id) : null,
          shipping_status: remoteExisting.awb_code ? 'AWB_ASSIGNED' : 'ORDER_CREATED',
          shipping_status_code: String(remoteExisting.status_code || '1'),
          awb_code: remoteExisting.awb_code || order.awb_code || null,
          courier_name: remoteExisting.courier_name || order.courier_name || (remoteExisting.awb_code ? 'Shiprocket Express Partner' : 'Shiprocket / Delivery Partner'),
          tracking_history: currentHistory
        };

        await persistOrderUpdates(order.id, updates);

        return {
          success: true,
          duplicated: true,
          data: {
            order_id: order.order_number,
            ...updates
          }
        };
      }

      // 3. Check Shiprocket configuration
      if (!shiprocketService.isConfigured()) {
        console.warn(`[SHIPROCKET_CREATE_FAILED] Shiprocket credentials not configured in environment for ${order.order_number}.`);
        await persistOrderUpdates(order.id, { shipping_status: 'FAILED' });
        return {
          success: false,
          message: 'Shiprocket credentials are not configured in environment.'
        };
      }

      // 4. Create Order in Shiprocket
      const srRes = await shiprocketService.createOrder(order);

      // 5. Strict Response Verification (Never rely solely on HTTP 200)
      if (!srRes || !srRes.data || !srRes.data.order_id || !srRes.data.shipment_id) {
        throw new Error('Shiprocket response did not contain required order_id and shipment_id.');
      }

      console.log(`[SHIPROCKET_CREATE_SUCCESS] Order ${order.order_number} -> SR Order ID: ${srRes.data.order_id}, Shipment ID: ${srRes.data.shipment_id}`);

      const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
      currentHistory.push({
        date: new Date().toISOString(),
        status: 'ORDER_CREATED',
        location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'),
        activity: 'Shipment created with Shiprocket'
      });

      const updates = {
        shiprocket_order_id: String(srRes.data.order_id),
        shiprocket_shipment_id: String(srRes.data.shipment_id),
        shipping_status: 'ORDER_CREATED',
        shipping_status_code: String(srRes.data.status_code || '1'),
        awb_code: srRes.data.awb_code || null,
        courier_name: srRes.data.courier_name || order.courier_name || (srRes.data.awb_code ? 'Shiprocket Express Partner' : 'Shiprocket / Delivery Partner'),
        tracking_history: currentHistory
      };

      // 6. Attempt Automatic AWB Assignment (Instant courier allocation)
      if (!updates.awb_code && srRes.data.shipment_id) {
        try {
          console.log(`[Shiprocket Fulfillment] Attempting automatic AWB assignment for shipment ${srRes.data.shipment_id}...`);
          const awbRes = await shiprocketService.assignAwb(srRes.data.shipment_id);
          if (awbRes && awbRes.data && awbRes.data.awb_code) {
            updates.awb_code = awbRes.data.awb_code;
            updates.courier_name = awbRes.data.courier_name || updates.courier_name;
            updates.shipping_status = 'AWB_ASSIGNED';
            updates.tracking_history.push({
              date: new Date().toISOString(),
              status: 'AWB_ASSIGNED',
              location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'),
              activity: `AWB ${awbRes.data.awb_code} assigned with ${updates.courier_name}`
            });
            console.log(`[Shiprocket Fulfillment] AWB ${awbRes.data.awb_code} assigned with ${updates.courier_name}`);
          }
        } catch (awbErr) {
          console.warn(`[Shiprocket Fulfillment] Auto AWB assignment deferred for ${order.order_number}:`, awbErr.message);
        }
      }

      await persistOrderUpdates(order.id, updates);

      return {
        success: true,
        data: {
          order_id: order.order_number || order.id,
          shiprocket_order_id: updates.shiprocket_order_id,
          shiprocket_shipment_id: updates.shiprocket_shipment_id,
          awb_code: updates.awb_code,
          courier_name: updates.courier_name,
          shipping_status: updates.shipping_status
        }
      };
    } catch (err) {
      console.error(`[SHIPROCKET_CREATE_FAILED] Order: ${identifier}, Reason: ${err.message}`);

      // Customer order remains 100% safe in Supabase; mark shipping as FAILED for admin retry
      try {
        const order = await fetchCompleteOrder(identifier);
        if (order) {
          const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
          currentHistory.push({
            date: new Date().toISOString(),
            status: 'SHIPPING_FAILED',
            location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'),
            activity: `Shipping creation failed: ${err.message}`
          });

          await persistOrderUpdates(order.id, {
            shipping_status: 'FAILED',
            tracking_history: currentHistory
          });
        }
      } catch (_) {}

      return {
        success: false,
        message: err.message || 'Shiprocket shipping creation failed.'
      };
    } finally {
      activeFulfillments.delete(identifier);
    }
  })();

  activeFulfillments.set(identifier, fulfillmentPromise);
  return fulfillmentPromise;
}

module.exports = {
  processOrderFulfillment,
  fetchCompleteOrder,
  persistOrderUpdates
};
