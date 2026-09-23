/**
 * Shiprocket Controller
 * Manages API endpoints for Shiprocket connectivity, fulfillment, tracking & webhooks
 */

const shiprocketService = require('../services/shiprocketService');
const db = require('../models/db');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Helper to find order by ID or order_number from Supabase or local store
async function findOrder(identifier) {
  if (!identifier) return null;

  if (isSupabaseConfigured && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let q = supabaseAdmin.from('orders').select('*, order_items(*)');
    if (isUuid) q = q.eq('id', identifier);
    else q = q.or(`order_number.eq.${identifier},awb_code.eq.${identifier},shiprocket_order_id.eq.${identifier}`);

    const { data: dbOrder } = await q.maybeSingle();
    if (dbOrder) {
      return {
        ...dbOrder,
        items: dbOrder.order_items || []
      };
    }
  }

  // Fallback to local in-memory DB
  const localOrder = db.findOne('orders', o =>
    o.id === identifier ||
    o.order_number === identifier ||
    o.awb_code === identifier ||
    o.shiprocket_order_id === identifier ||
    o.tracking_number === identifier
  );

  if (localOrder) {
    const items = db.filter('order_items', oi => oi.order_id === localOrder.id);
    return { ...localOrder, items };
  }

  return null;
}

// Helper to update order across both Supabase and local store
async function updateOrderShipping(orderId, updates) {
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
      console.warn('[ShiprocketController] Supabase update warning:', sbErr.message);
    }
  }

  // 2. Local DB
  const localOrder = db.findById('orders', orderId) || db.findOne('orders', o => o.order_number === orderId);
  if (localOrder) {
    db.update('orders', localOrder.id, finalUpdates);
  }
}

/**
 * 1. Test Connection Endpoint
 * GET /api/shiprocket/test
 */
exports.testConnection = async (req, res) => {
  try {
    const result = await shiprocketService.testConnection();
    if (result.success) {
      return res.json({
        success: true,
        message: 'Shiprocket connected successfully'
      });
    }

    return res.status(400).json({
      success: false,
      message: result.message || 'Shiprocket connection failed'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Shiprocket connection failed'
    });
  }
};

const { processOrderFulfillment } = require('../services/fulfillmentService');

/**
 * 2. Create Shipment for Order (Manual Admin Trigger or Retry)
 * POST /api/shiprocket/create-order
 */
exports.createOrder = async (req, res, next) => {
  try {
    console.log("========== SHIPROCKET CREATE ORDER ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { order_id, order_number } = req.body;
    const identifier = order_id || order_number || req.body.id;

    if (!identifier && !req.body.billing_customer_name) {
      console.error("========== SHIPROCKET ERROR ==========");
      console.error("Message: order_id or order_number is required.");
      return res.status(400).json({ success: false, message: 'order_id or order_number is required.' });
    }

    const result = await processOrderFulfillment(identifier || req.body, { force: true });

    if (result.success) {
      console.log("SHIPROCKET RESPONSE:", JSON.stringify(result.data, null, 2));
      return res.status(200).json({
        success: true,
        message: result.duplicated
          ? 'Shiprocket shipment already exists and has been synchronized.'
          : 'Shiprocket shipment created successfully.',
        data: result.data,
        shiprocket: result.data
      });
    }

    console.error("========== SHIPROCKET ERROR ==========");
    console.error("Message:", result.message);
    return res.status(400).json({
      success: false,
      message: result.message || 'Failed to create shipment on Shiprocket.',
      error: result.message
    });
  } catch (err) {
    console.error("========== SHIPROCKET ERROR ==========");
    console.error("Status:", err.status || err.statusCode || 500);
    console.error("Response:", JSON.stringify(err.shiprocketData || err.response?.data || {}, null, 2));
    console.error("Message:", err.message);
    return res.status(err.status || err.statusCode || 500).json({
      success: false,
      message: 'Shiprocket order creation failed',
      error: err.shiprocketData || err.message
    });
  }
};

/**
 * 2b. Public/Order Checkout Sync to Shiprocket
 * POST /api/shiprocket/sync-order
 */
exports.syncOrder = async (req, res, next) => {
  try {
    const { order_id, order_number } = req.body;
    const identifier = order_id || order_number;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'order_id or order_number is required.' });
    }

    const result = await processOrderFulfillment(identifier);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order synced to Shiprocket successfully.',
        data: result.data
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message || 'Order received, processing fulfillment.',
      data: result.data || null
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * 3. Assign Courier & AWB
 * POST /api/shiprocket/assign-awb
 */
exports.assignAwb = async (req, res, next) => {
  try {
    const { order_id, shipment_id, courier_id } = req.body;
    const identifier = order_id || shipment_id;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'order_id or shipment_id is required.' });
    }

    const order = await findOrder(identifier);
    const shipId = shipment_id || (order && order.shiprocket_shipment_id);

    if (!shipId) {
      return res.status(400).json({ success: false, message: 'No valid Shiprocket shipment ID found for this order. Create shipment first.' });
    }

    // If AWB already assigned, return it
    if (order && order.awb_code) {
      return res.json({
        success: true,
        message: 'AWB already assigned.',
        data: {
          awb_code: order.awb_code,
          courier_name: order.courier_name,
          shipment_id: shipId
        }
      });
    }

    const awbResult = await shiprocketService.assignAwb(shipId, courier_id);

    if (order) {
      const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
      currentHistory.push({
        date: new Date().toISOString(),
        status: 'AWB_ASSIGNED',
        location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
        activity: `AWB ${awbResult.data.awb_code} assigned with ${awbResult.data.courier_name || 'Courier'}`
      });

      await updateOrderShipping(order.id, {
        awb_code: awbResult.data.awb_code,
        courier_name: awbResult.data.courier_name || order.courier_name,
        shipping_status: 'AWB_ASSIGNED',
        tracking_url: `/order-tracking.html?order=${order.order_number || order.id}`,
        tracking_history: currentHistory
      });
    }

    res.json({
      success: true,
      message: 'AWB assigned successfully.',
      data: awbResult.data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Request Pickup
 * POST /api/shiprocket/pickup
 */
exports.requestPickup = async (req, res, next) => {
  try {
    const { order_id, shipment_id, pickup_date } = req.body;
    const identifier = order_id || shipment_id;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'order_id or shipment_id is required.' });
    }

    const order = await findOrder(identifier);
    const shipId = shipment_id || (order && order.shiprocket_shipment_id);

    if (!shipId) {
      return res.status(400).json({ success: false, message: 'No shipment_id found to request pickup.' });
    }

    if (order && (order.pickup_status === 'PICKUP_REQUESTED' || order.pickup_status === 'PICKED_UP')) {
      return res.json({
        success: true,
        message: 'Pickup has already been requested for this shipment.',
        data: {
          pickup_status: order.pickup_status,
          pickup_scheduled_date: order.pickup_scheduled_date
        }
      });
    }

    const pickupResult = await shiprocketService.requestPickup(shipId, pickup_date);

    if (order) {
      const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
      currentHistory.push({
        date: new Date().toISOString(),
        status: 'PICKUP_REQUESTED',
        location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
        activity: 'Courier pickup requested'
      });

      await updateOrderShipping(order.id, {
        pickup_status: 'PICKUP_REQUESTED',
        pickup_scheduled_date: pickup_date || new Date().toISOString().split('T')[0],
        shipping_status: 'PICKUP_REQUESTED',
        tracking_history: currentHistory
      });
    }

    res.json({
      success: true,
      message: 'Pickup requested successfully.',
      data: pickupResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Generate Label
 * POST /api/shiprocket/label
 */
exports.generateLabel = async (req, res, next) => {
  try {
    const { order_id, shipment_id } = req.body;
    const identifier = order_id || shipment_id;

    const order = await findOrder(identifier);
    const shipId = shipment_id || (order && order.shiprocket_shipment_id);

    if (!shipId) {
      return res.status(400).json({ success: false, message: 'No shipment_id found to generate label.' });
    }

    const labelResult = await shiprocketService.generateLabel(shipId);

    if (order && labelResult.label_url) {
      await updateOrderShipping(order.id, {
        shipping_label_url: labelResult.label_url
      });
    }

    res.json({
      success: true,
      message: 'Shipping label generated successfully.',
      label_url: labelResult.label_url,
      data: labelResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Generate Manifest
 * POST /api/shiprocket/manifest
 */
exports.generateManifest = async (req, res, next) => {
  try {
    const { order_id, shipment_id } = req.body;
    const identifier = order_id || shipment_id;

    const order = await findOrder(identifier);
    const shipId = shipment_id || (order && order.shiprocket_shipment_id);

    if (!shipId) {
      return res.status(400).json({ success: false, message: 'No shipment_id found to generate manifest.' });
    }

    const manifestResult = await shiprocketService.generateManifest(shipId);

    if (order && manifestResult.manifest_url) {
      await updateOrderShipping(order.id, {
        shipping_manifest_url: manifestResult.manifest_url
      });
    }

    res.json({
      success: true,
      message: 'Manifest generated successfully.',
      manifest_url: manifestResult.manifest_url,
      data: manifestResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. Track Shipment by AWB
 * GET /api/shiprocket/track/:awb
 */
exports.trackShipment = async (req, res, next) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'AWB parameter is required.' });
    }

    const trackResult = await shiprocketService.trackAwb(awb);

    // Optionally sync order if matching AWB exists in database
    const order = await findOrder(awb);
    if (order && trackResult.data?.current_status) {
      const normalizedStatus = String(trackResult.data.current_status).toUpperCase().replace(/\s+/g, '_');
      await updateOrderShipping(order.id, {
        shipping_status: normalizedStatus,
        courier_name: trackResult.data.courier_name || order.courier_name,
        tracking_history: trackResult.data.scans || order.tracking_history
      });
    }

    res.json({
      success: true,
      data: trackResult.data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Cancel Shipment
 * POST /api/shiprocket/cancel
 */
exports.cancelShipment = async (req, res, next) => {
  try {
    const { order_id, shiprocket_order_id } = req.body;
    const identifier = order_id || shiprocket_order_id;

    const order = await findOrder(identifier);
    const srOrderId = shiprocket_order_id || (order && order.shiprocket_order_id);

    if (!srOrderId) {
      return res.status(400).json({ success: false, message: 'Shiprocket order ID required to cancel shipment.' });
    }

    const cancelResult = await shiprocketService.cancelOrder(srOrderId);

    if (order) {
      const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
      currentHistory.push({
        date: new Date().toISOString(),
        status: 'CANCELLED',
        location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
        activity: 'Shipment cancelled with Shiprocket'
      });

      await updateOrderShipping(order.id, {
        shipping_status: 'CANCELLED',
        tracking_history: currentHistory
      });
    }

    res.json({
      success: true,
      message: 'Shiprocket shipment cancelled successfully.',
      data: cancelResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. Shiprocket Webhook Receiver
 * POST /api/shiprocket/webhook
 * Public endpoint for receiving real-time tracking events from Shiprocket
 */
exports.handleWebhook = async (req, res) => {
  // Respond quickly with HTTP 200 to Shiprocket
  res.status(200).json({ success: true, message: 'Webhook received' });

  try {
    const payload = req.body || {};
    console.log('[Shiprocket Webhook] Received webhook payload:', JSON.stringify(payload).substring(0, 300));

    // Extract identifiers and status
    const awb = payload.awb || payload.awb_code || payload.AWB;
    const srOrderId = payload.order_id || payload.shiprocket_order_id || payload.channel_order_id;
    const currentStatus = payload.current_status || payload.status || payload.shipment_status;
    const location = payload.location || payload.scan_location || 'Transit Hub';
    const activity = payload.activity || payload.scan_remarks || currentStatus || 'Status update';
    const courierName = payload.courier_name || payload.courier;

    const identifier = awb || srOrderId || payload.order_id;
    if (!identifier) {
      console.warn('[Shiprocket Webhook] No order identifier or AWB found in webhook payload.');
      return;
    }

    const order = await findOrder(identifier);
    if (!order) {
      console.warn(`[Shiprocket Webhook] Order not found for identifier: ${identifier}`);
      return;
    }

    // Map Shiprocket status to normalized status
    const normalizedStatus = String(currentStatus || 'IN_TRANSIT').toUpperCase().replace(/\s+/g, '_');

    // Idempotent history append (check if matching scan already recorded)
    const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
    const eventTime = payload.scan_date_time || payload.date || new Date().toISOString();

    const isDuplicateScan = currentHistory.some(h =>
      h.status === normalizedStatus &&
      (h.activity === activity || h.date === eventTime)
    );

    if (!isDuplicateScan) {
      currentHistory.push({
        date: eventTime,
        status: normalizedStatus,
        location: location,
        activity: activity
      });
    }

    const updates = {
      shipping_status: normalizedStatus,
      tracking_history: currentHistory
    };

    if (courierName && !order.courier_name) {
      updates.courier_name = courierName;
    }
    if (awb && !order.awb_code) {
      updates.awb_code = awb;
    }

    // If delivered, update order_status in sync without changing payment_status
    if (normalizedStatus === 'DELIVERED') {
      updates.order_status = 'delivered';
    } else if (['IN_TRANSIT', 'SHIPPED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(normalizedStatus)) {
      if (order.order_status !== 'delivered' && order.order_status !== 'cancelled') {
        updates.order_status = normalizedStatus === 'OUT_FOR_DELIVERY' ? 'out_for_delivery' : 'shipped';
      }
    }

    await updateOrderShipping(order.id, updates);
    console.log(`[Shiprocket Webhook] Successfully updated shipping status for order ${order.order_number || order.id} to ${normalizedStatus}`);
  } catch (err) {
    console.error('[Shiprocket Webhook Error] Error processing webhook in background:', err.message);
  }
};
