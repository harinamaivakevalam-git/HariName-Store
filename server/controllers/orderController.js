const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const shiprocketService = require('../services/shiprocketService');
const { processOrderFulfillment } = require('../services/fulfillmentService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// Helper to generate professional order number: HN-YYYY-XXXXX
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `HN-${year}-${randomNum}`;
};

// Create New Order
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      items = [],
      shipping_address,
      billing_address,
      payment_method = 'cod',
      payment_details = {},
      transaction_id = null,
      coupon_code = null,
      notes = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to place an order.' });
    }

    if (!shipping_address || !shipping_address.name || !shipping_address.phone || !shipping_address.address_line_1) {
      return res.status(400).json({ success: false, message: 'Valid shipping address is required.' });
    }

    // 1. Calculate and validate pricing on the server
    let subtotal = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      let product = null;
      let unitPrice = parseFloat(item.price) || 0;

      if (isSupabaseConfigured && supabaseAdmin) {
        const isUuid = item.product_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id);
        let q = supabaseAdmin.from('products').select('*');
        if (isUuid) {
          q = q.eq('id', item.product_id);
        } else if (item.product_id) {
          q = q.or(`slug.eq.${item.product_id},sku.eq.${item.product_id}`);
        } else if (item.product_name) {
          q = q.ilike('name', `%${item.product_name}%`);
        }
        const { data: dbProd } = await q.maybeSingle();
        if (dbProd) product = dbProd;
      }

      if (!product && item.product_id) {
        product = db.findById('products', item.product_id) || db.findOne('products', p => p.slug === item.product_id || p.sku === item.product_id);
      }

      if (product) {
        if (product.status === 'inactive' || product.status === 'archived') {
          return res.status(400).json({
            success: false,
            message: `Product "${item.product_name || product.name || item.product_id}" is currently inactive.`
          });
        }
        unitPrice = parseFloat(product.price) || unitPrice;
      }

      const qty = Math.max(1, parseInt(item.quantity || item.qty, 10) || 1);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      const primaryImage = (product && (product.image || product.primary_image)) || item.product_image || item.image || '';
      const prodName = (product && (product.name || product.title)) || item.product_name || item.name || 'Sacred Devotional Item';
      const prodSku = (product && product.sku) || item.sku || `HN-SKU-${Date.now().toString().slice(-4)}`;

      orderItemsToCreate.push({
        product_id: (product && product.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id)) ? product.id : null,
        variant_id: null,
        product_name: prodName,
        product_image: primaryImage,
        sku: prodSku,
        variant_info: item.material ? { material: item.material } : null,
        quantity: qty,
        price: unitPrice,
        total: itemTotal
      });
    }

    // 2. Coupon Discount Calculation
    let discountAmount = 0;
    let appliedCoupon = null;
    let matchedCouponObj = null;

    if (coupon_code) {
      const cleanCpnCode = coupon_code.toUpperCase().trim();
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data: cpn } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .ilike('code', cleanCpnCode)
          .maybeSingle();

        const isExpired = cpn && cpn.expiry_date && new Date(cpn.expiry_date) < new Date();
        const isLimitReached = cpn && cpn.usage_limit && (cpn.times_used || 0) >= cpn.usage_limit;
        const isActive = cpn && (!cpn.status || cpn.status.toLowerCase() === 'active');

        if (cpn && isActive && !isExpired && !isLimitReached) {
          const minOrder = parseFloat(cpn.minimum_order || 0);
          if (subtotal >= minOrder) {
            if (cpn.discount_type === 'percentage') {
              discountAmount = (subtotal * parseFloat(cpn.discount_value)) / 100;
              if (cpn.maximum_discount && discountAmount > parseFloat(cpn.maximum_discount)) {
                discountAmount = parseFloat(cpn.maximum_discount);
              }
            } else {
              discountAmount = parseFloat(cpn.discount_value);
            }
            discountAmount = Math.min(discountAmount, subtotal);
            appliedCoupon = cpn.code;
            matchedCouponObj = { source: 'supabase', id: cpn.id, code: cpn.code, times_used: cpn.times_used || 0 };
          }
        }
      }

      if (!matchedCouponObj) {
        const coupon = db.findOne('coupons', c => c.code.toUpperCase() === cleanCpnCode);
        const isExpired = coupon && coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
        const isLimitReached = coupon && coupon.usage_limit && (coupon.times_used || 0) >= coupon.usage_limit;
        const isActive = coupon && (!coupon.status || coupon.status.toLowerCase() === 'active');

        if (coupon && isActive && !isExpired && !isLimitReached) {
          const minOrder = parseFloat(coupon.minimum_order || 0);
          if (subtotal >= minOrder) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
              if (coupon.maximum_discount && discountAmount > parseFloat(coupon.maximum_discount)) {
                discountAmount = parseFloat(coupon.maximum_discount);
              }
            } else {
              discountAmount = parseFloat(coupon.discount_value);
            }
            discountAmount = Math.min(discountAmount, subtotal);
            appliedCoupon = coupon.code;
            matchedCouponObj = { source: 'db', id: coupon.id, code: coupon.code, times_used: coupon.times_used || 0 };
          }
        }
      }
    }

    const shippingFee = (req.body.shipping_fee !== undefined && req.body.shipping_fee !== null)
      ? parseFloat(req.body.shipping_fee)
      : (req.body.shipping !== undefined ? parseFloat(req.body.shipping) : (subtotal >= 999 || subtotal === 0 ? 0 : 0));
    const chargeableWeight = req.body.chargeable_weight ? parseFloat(req.body.chargeable_weight) : 0.05;
    const courierName = req.body.courier_name || req.body.courier || null;
    const shippingRateResponse = req.body.shipping_rate_response || null;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round((taxableAmount * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + shippingFee + tax) * 100) / 100;

    const orderNumber = (req.body.order_number && String(req.body.order_number).startsWith('HN-'))
      ? req.body.order_number
      : generateOrderNumber();

    const isOnlinePaid = ['razorpay', 'stripe'].includes(payment_method) && 
      Boolean(transaction_id || payment_details?.razorpay_payment_id || req.body.payment_status === 'paid' || req.body.is_paid || payment_details?.id);
    const trackingNum = `HN-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingUrl = `/order-tracking.html?order=${orderNumber}`;

    // 1. Check if this exact order number was already created (Idempotency check)
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: existingSbOrder } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (existingSbOrder) {
          console.log(`[Order Creation] Order ${orderNumber} already exists in Supabase. Checking fulfillment status.`);

          // If items are missing in DB, insert them
          if ((!existingSbOrder.order_items || existingSbOrder.order_items.length === 0) && orderItemsToCreate.length > 0) {
            try {
              const itemsPayload = orderItemsToCreate.map(oi => ({
                order_id: existingSbOrder.id,
                product_id: oi.product_id,
                product_name: oi.product_name,
                product_image: oi.product_image,
                sku: oi.sku,
                variant_info: oi.variant_info,
                quantity: oi.quantity,
                price: oi.price,
                total: oi.total
              }));
              await supabaseAdmin.from('order_items').insert(itemsPayload);
              existingSbOrder.order_items = itemsPayload;
            } catch (itErr) {
              console.warn('[Order Creation] Supabase order_items backfill note:', itErr.message);
            }
          }

          // If Shiprocket order was not created yet and payment is confirmed or COD, fulfill now!
          if (!existingSbOrder.shiprocket_order_id && (isCod || isOnlinePaid || existingSbOrder.payment_status === 'paid' || existingSbOrder.payment_method === 'cod')) {
            try {
              console.log(`[Order Creation] Automatically fulfilling existing order ${orderNumber} to Shiprocket...`);
              const fRes = await processOrderFulfillment({
                ...existingSbOrder,
                shipping_address: existingSbOrder.shipping_address || shipping_address,
                billing_address: existingSbOrder.billing_address || billing_address || shipping_address,
                items: (existingSbOrder.order_items && existingSbOrder.order_items.length > 0) ? existingSbOrder.order_items : orderItemsToCreate,
                subtotal: existingSbOrder.subtotal || subtotal,
                discount: existingSbOrder.discount || discountAmount,
                shipping_fee: existingSbOrder.shipping_fee || shippingFee
              });

              if (fRes && fRes.data) {
                existingSbOrder.shiprocket_order_id = fRes.data.shiprocket_order_id;
                existingSbOrder.shiprocket_shipment_id = fRes.data.shiprocket_shipment_id;
                existingSbOrder.shipping_status = fRes.data.shipping_status;
                existingSbOrder.awb_code = fRes.data.awb_code;
                existingSbOrder.courier_name = fRes.data.courier_name;
              }
            } catch (fulfillErr) {
              console.warn(`[Order Creation] Fulfillment attempt on existing order ${orderNumber}:`, fulfillErr.message);
            }
          }

          return res.status(200).json({
            success: true,
            message: 'Order processed successfully.',
            data: {
              order_id: existingSbOrder.id,
              order_number: existingSbOrder.order_number,
              total: existingSbOrder.total,
              order_status: existingSbOrder.order_status,
              payment_status: existingSbOrder.payment_status,
              shipping_status: existingSbOrder.shipping_status || 'ORDER_CREATED',
              shiprocket_order_id: existingSbOrder.shiprocket_order_id,
              shiprocket_shipment_id: existingSbOrder.shiprocket_shipment_id,
              awb_code: existingSbOrder.awb_code,
              courier_name: existingSbOrder.courier_name,
              tracking_url: existingSbOrder.tracking_url || trackingUrl,
              items: existingSbOrder.order_items || []
            }
          });
        }
      } catch (checkErr) {
        console.warn('[Order Creation] Idempotency check note:', checkErr.message);
      }
    }

    const actualTxnId = transaction_id || payment_details.razorpay_payment_id || (isOnlinePaid ? `txn_${Date.now()}` : null);

    const initialHistory = [
      {
        date: new Date().toISOString(),
        status: 'ORDER_PLACED',
        location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'),
        activity: 'Order placed & confirmed'
      }
    ];

    let createdOrderRecord = null;

    // 2. Insert Order into Supabase Database
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let validUserId = null;
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          const { data: userExists } = await supabaseAdmin.from('users').select('id').eq('id', userId).maybeSingle();
          if (userExists) validUserId = userId;
        }

        const orderPayload = {
          order_number: orderNumber,
          user_id: validUserId,
          guest_name: !validUserId ? shipping_address.name : null,
          guest_email: !validUserId ? (shipping_address.email || 'guest@harinama.com') : null,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discountAmount * 100) / 100,
          coupon_code: appliedCoupon,
          shipping_fee: shippingFee,
          tax: tax,
          total: grandTotal,
          payment_status: isOnlinePaid ? 'paid' : 'pending',
          payment_method,
          order_status: 'confirmed',
          shipping_address,
          billing_address: billing_address || shipping_address,
          tracking_number: trackingNum,
          tracking_url: trackingUrl,
          notes: notes || '',
          shiprocket_order_id: null,
          shiprocket_shipment_id: null,
          awb_code: null,
          courier_name: courierName,
          chargeable_weight: chargeableWeight,
          shipping_provider: 'shiprocket',
          shipping_rate_response: shippingRateResponse,
          shipping_status: 'NOT_CREATED',
          shipping_status_code: null,
          shipping_label_url: null,
          shipping_manifest_url: null,
          pickup_status: 'NOT_REQUESTED',
          pickup_scheduled_date: null,
          tracking_history: initialHistory,
          shipping_updated_at: new Date().toISOString()
        };

        let { data: dbOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (orderErr && (orderErr.message.includes('column') || orderErr.message.includes('schema cache'))) {
          // Retry insertion with core schema columns in case new migration is pending on remote DB
          const { chargeable_weight, shipping_provider, shipping_rate_response, ...corePayload } = orderPayload;
          const retryRes = await supabaseAdmin.from('orders').insert(corePayload).select().single();
          if (!retryRes.error && retryRes.data) {
            dbOrder = retryRes.data;
            orderErr = null;
          }
        }

        if (orderErr) {
          console.warn('[Database] Supabase order insert error, saving to local store:', orderErr.message);
        } else if (dbOrder) {
          createdOrderRecord = dbOrder;

          // Insert order items
          const itemsPayload = orderItemsToCreate.map(oi => ({
            order_id: dbOrder.id,
            product_id: oi.product_id,
            product_name: oi.product_name,
            product_image: oi.product_image,
            sku: oi.sku,
            variant_info: oi.variant_info,
            quantity: oi.quantity,
            price: oi.price,
            total: oi.total
          }));

          await supabaseAdmin.from('order_items').insert(itemsPayload);

          // Insert payment record
          await supabaseAdmin.from('payments').insert({
            order_id: dbOrder.id,
            payment_provider: payment_method,
            transaction_id: actualTxnId || `cod_${Date.now()}`,
            amount: grandTotal,
            currency: 'INR',
            status: isOnlinePaid ? 'captured' : 'pending'
          });

          // Increment coupon usage
          if (matchedCouponObj && matchedCouponObj.id) {
            try {
              await supabaseAdmin
                .from('coupons')
                .update({ times_used: matchedCouponObj.times_used + 1 })
                .eq('id', matchedCouponObj.id);
            } catch (cpnErr) {}
          }
        }
      } catch (sbErr) {
        console.warn('[Database] Supabase transaction failed:', sbErr.message);
      }
    }

    if (matchedCouponObj) {
      try {
        const localCpn = db.findOne('coupons', c => c.code.toUpperCase() === (appliedCoupon || '').toUpperCase());
        if (localCpn) {
          db.update('coupons', localCpn.id, { times_used: (localCpn.times_used || 0) + 1 });
        }
      } catch (_) {}
    }

    // Always mirror in-memory / local DB
    const localOrder = db.insert('orders', {
      order_number: orderNumber,
      user_id: userId || 'c2222222-2222-4222-8222-222222222222',
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      coupon_code: appliedCoupon,
      shipping_fee: shippingFee,
      tax: tax,
      total: grandTotal,
      payment_status: isOnlinePaid ? 'paid' : 'pending',
      payment_method,
      order_status: 'confirmed',
      shipping_address,
      billing_address: billing_address || shipping_address,
      tracking_number: trackingNum,
      tracking_url: trackingUrl,
      notes: notes || '',
      shiprocket_order_id: null,
      shiprocket_shipment_id: null,
      awb_code: null,
      courier_name: courierName,
      chargeable_weight: chargeableWeight,
      shipping_provider: 'shiprocket',
      shipping_rate_response: shippingRateResponse,
      shipping_status: 'NOT_CREATED',
      shipping_status_code: null,
      shipping_label_url: null,
      shipping_manifest_url: null,
      pickup_status: 'NOT_REQUESTED',
      pickup_scheduled_date: null,
      tracking_history: initialHistory,
      shipping_updated_at: new Date().toISOString()
    });

    orderItemsToCreate.forEach(oi => {
      db.insert('order_items', {
        order_id: localOrder.id,
        ...oi
      });
    });

    db.insert('payments', {
      order_id: localOrder.id,
      payment_provider: payment_method,
      transaction_id: actualTxnId || `cod_${Date.now()}`,
      amount: grandTotal,
      currency: 'INR',
      status: isOnlinePaid ? 'captured' : 'pending'
    });

    console.log(`[ORDER_CREATED] Sacred Order created: ${orderNumber} (Total: ₹${grandTotal}, Payment: ${payment_method}/${isOnlinePaid ? 'paid' : 'pending'})`);

    // 3. Automatic Shiprocket Fulfillment Trigger (Zero Customer Friction)
    // Run automatically for COD or Prepaid orders
    let fulfillmentResult = null;
    const isCod = payment_method.toLowerCase() === 'cod';

    if (isCod || isOnlinePaid) {
      try {
        const orderForFulfillment = {
          ...(createdOrderRecord || localOrder),
          shipping_address,
          billing_address: billing_address || shipping_address,
          items: orderItemsToCreate,
          subtotal,
          discount: discountAmount,
          shipping_fee: shippingFee
        };

        fulfillmentResult = await processOrderFulfillment(orderForFulfillment);
      } catch (fulfillErr) {
        console.warn(`[Order Controller] Automatic fulfillment notice for ${orderNumber}:`, fulfillErr.message);
      }
    }

    const finalShippingStatus = fulfillmentResult?.data?.shipping_status || (fulfillmentResult?.success ? 'ORDER_CREATED' : 'NOT_CREATED');
    const finalSrOrderId = fulfillmentResult?.data?.shiprocket_order_id || null;
    const finalAwb = fulfillmentResult?.data?.awb_code || null;
    const finalCourier = fulfillmentResult?.data?.courier_name || createdOrderRecord?.courier_name || (finalAwb ? 'Shiprocket Express Partner' : (finalSrOrderId ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner'));

    // 4. Asynchronous Devotional Order Confirmation Email
    try {
      const emailPayload = {
        ...(createdOrderRecord || localOrder),
        order_number: orderNumber,
        shipping_address,
        billing_address: billing_address || shipping_address,
        items: orderItemsToCreate,
        subtotal,
        discount: discountAmount,
        shipping_fee: shippingFee,
        total: grandTotal,
        payment_method,
        payment_status: isOnlinePaid ? 'paid' : 'pending'
      };
      sendOrderConfirmationEmail(emailPayload).catch(e => {
        console.warn(`[Order Controller] Email notice for ${orderNumber}:`, e.message);
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Hare Krishna. 🌸',
      data: {
        order_id: createdOrderRecord ? createdOrderRecord.id : localOrder.id,
        order_number: orderNumber,
        total: grandTotal,
        order_status: 'confirmed',
        payment_status: isOnlinePaid ? 'paid' : 'pending',
        shipping_status: finalShippingStatus,
        shiprocket_order_id: finalSrOrderId,
        awb_code: finalAwb,
        courier_name: finalCourier,
        tracking_url: trackingUrl,
        items: orderItemsToCreate
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Logged In User's Orders
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: sbOrders, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && sbOrders && sbOrders.length > 0) {
        const formatted = sbOrders.map(order => ({
          ...order,
          items: order.order_items || [],
          items_count: (order.order_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)
        }));
        return res.json({ success: true, data: formatted });
      }
    }

    const orders = db.filter('orders', o => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const ordersWithItems = orders.map(order => {
      const items = db.filter('order_items', oi => oi.order_id === order.id);
      return {
        ...order,
        items,
        items_count: items.reduce((acc, i) => acc + i.quantity, 0)
      };
    });

    res.json({
      success: true,
      data: ordersWithItems
    });
  } catch (err) {
    next(err);
  }
};

// Get Order Details by Order Number or ID
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let order = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        let q = supabaseAdmin.from('orders').select('*, order_items(*), payments(*)');
        if (isUuid) q = q.eq('id', identifier);
        else q = q.or(`order_number.eq.${identifier},awb_code.eq.${identifier}`);

        const { data: dbOrder } = await q.maybeSingle();
        if (dbOrder) {
          order = {
            ...dbOrder,
            items: dbOrder.order_items || [],
            payments: dbOrder.payments || []
          };
        }
      } catch (sbErr) {
        console.warn('[getOrderDetails] Supabase fetch warning:', sbErr.message);
      }
    }

    if (!order) {
      order = db.findOne('orders', o => o.order_number === identifier || o.id === identifier || o.awb_code === identifier);
      if (order) {
        order.items = db.filter('order_items', oi => oi.order_id === order.id);
        order.payments = db.filter('payments', p => p.order_id === order.id);
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check authorization: must be order owner or admin if authenticated
    if (req.user && req.user.role !== 'admin' && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    const items = order.items || [];
    const payments = order.payments || [];
    const user = order.user_id ? db.findById('users', order.user_id) : null;
    const shipAddr = order.shipping_address || {};

    // Build timeline stages
    const statuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = statuses.indexOf(order.order_status);
    const timeline = statuses.map((st, idx) => ({
      status: st,
      label: st.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      completed: currentIdx >= idx && order.order_status !== 'cancelled',
      active: order.order_status === st,
      date: currentIdx >= idx ? (order.updated_at || order.created_at) : null
    }));

    res.json({
      success: true,
      data: {
        ...order,
        customer: {
          name: shipAddr.name || (user ? user.name : 'Customer'),
          email: shipAddr.email || (user ? user.email : '—'),
          phone: shipAddr.phone || (user ? user.phone : '—')
        },
        items,
        payments,
        timeline,
        tracking_history: order.tracking_history || []
      }
    });
  } catch (err) {
    next(err);
  }
};

// Cancel Order
exports.cancelOrder = (req, res, next) => {
  try {
    const { id } = req.params;
    const order = db.findById('orders', id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
    }

    if (['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in its current stage (${order.order_status}).`
      });
    }

    // Restock items
    const items = db.filter('order_items', oi => oi.order_id === order.id);
    items.forEach(oi => {
      const product = db.findById('products', oi.product_id);
      if (product) {
        db.update('products', product.id, { stock: product.stock + oi.quantity });
      }
    });

    const updated = db.update('orders', order.id, {
      order_status: 'cancelled',
      payment_status: order.payment_status === 'paid' ? 'refunded' : 'cancelled'
    });

    res.json({
      success: true,
      message: 'Order has been successfully cancelled and refunded.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get All Orders with Filters
exports.adminGetOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    let orders = [];

    // 1. Fetch from Supabase if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin
          .from('orders')
          .select('*, order_items(*), payments(*)')
          .order('created_at', { ascending: false });

        const { data: sbOrders, error: sbErr } = await q;
        if (!sbErr && sbOrders && sbOrders.length > 0) {
          orders = sbOrders.map(o => {
            const rawItems = o.order_items || [];
            const mappedItems = rawItems.map(item => ({
              id: item.id,
              name: item.product_name,
              qty: item.quantity,
              price: parseFloat(item.price),
              total: parseFloat(item.total),
              image: item.product_image || ''
            }));
            const shipAddr = o.shipping_address || {};
            const fullAddress = typeof shipAddr === 'string' 
              ? shipAddr 
              : `${shipAddr.address_line_1 || ''}, ${shipAddr.city || ''}, ${shipAddr.state || ''} ${shipAddr.postal_code || shipAddr.pin || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');

            return {
              id: o.order_number || o.id,
              db_id: o.id,
              order_number: o.order_number,
              date: new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              created_at: o.created_at,
              customer: shipAddr.name || o.guest_name || 'Devotee Customer',
              phone: shipAddr.phone || '—',
              email: shipAddr.email || o.guest_email || '—',
              address: fullAddress || '—',
              shipping_address: shipAddr,
              items: mappedItems,
              subtotal: parseFloat(o.subtotal) || 0,
              shipping: parseFloat(o.shipping_fee) || 0,
              discount: parseFloat(o.discount) || 0,
              tax: parseFloat(o.tax) || 0,
              total: parseFloat(o.total) || 0,
              payment_method: o.payment_method || 'UPI',
              payment_status: o.payment_status || 'Paid',
              status: (o.order_status ? o.order_status.charAt(0).toUpperCase() + o.order_status.slice(1) : 'Confirmed'),
              courier: o.courier_name || o.courier || (o.awb_code ? 'Shiprocket Express Partner' : (o.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner')),
              courier_name: o.courier_name || o.courier || (o.awb_code ? 'Shiprocket Express Partner' : (o.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner')),
              tracking_number: o.awb_code || o.tracking_number || '',
              awb_code: o.awb_code || '',
              shiprocket_order_id: o.shiprocket_order_id || '',
              shiprocket_shipment_id: o.shiprocket_shipment_id || '',
              shipping_status: o.shipping_status || 'NOT_CREATED',
              shipping_status_code: o.shipping_status_code || '',
              shipping_label_url: o.shipping_label_url || '',
              shipping_manifest_url: o.shipping_manifest_url || '',
              pickup_status: o.pickup_status || 'NOT_REQUESTED',
              tracking_history: o.tracking_history || [],
              tracking_url: o.tracking_url || '',
              notes: o.notes || ''
            };
          });
        }
      } catch (err) {
        console.warn('[adminGetOrders] Supabase fetch error, fallback to local:', err.message);
      }
    }

    // 2. Fetch and merge from local in-memory/file database
    const localOrders = db.findAll('orders').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const seenOrderNums = new Set(orders.map(o => o.order_number || o.id));

    for (const lo of localOrders) {
      const num = lo.order_number || lo.id;
      if (!seenOrderNums.has(num)) {
        seenOrderNums.add(num);
        const items = db.filter('order_items', oi => oi.order_id === lo.id);
        const mappedItems = items.map(i => ({
          id: i.id,
          name: i.product_name,
          qty: i.quantity,
          price: parseFloat(i.price),
          total: parseFloat(i.total),
          image: i.product_image || ''
        }));
        const user = db.findById('users', lo.user_id);
        const shipAddr = lo.shipping_address || {};
        const fullAddress = typeof shipAddr === 'string'
          ? shipAddr
          : `${shipAddr.address_line_1 || ''}, ${shipAddr.city || ''}, ${shipAddr.state || ''} ${shipAddr.postal_code || shipAddr.pin || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');

        orders.push({
          id: num,
          db_id: lo.id,
          order_number: num,
          date: new Date(lo.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          created_at: lo.created_at,
          customer: shipAddr.name || (user ? user.name : 'Customer'),
          phone: shipAddr.phone || (user ? user.phone : '—'),
          email: shipAddr.email || (user ? user.email : '—'),
          address: fullAddress || '—',
          shipping_address: shipAddr,
          items: mappedItems,
          subtotal: parseFloat(lo.subtotal) || 0,
          shipping: parseFloat(lo.shipping_fee) || 0,
          discount: parseFloat(lo.discount) || 0,
          tax: parseFloat(lo.tax) || 0,
          total: parseFloat(lo.total) || 0,
          payment_method: lo.payment_method || 'COD',
          payment_status: lo.payment_status || 'Pending',
          status: (lo.order_status ? lo.order_status.charAt(0).toUpperCase() + lo.order_status.slice(1) : 'Confirmed'),
          courier: lo.courier_name || lo.courier || (lo.awb_code ? 'Shiprocket Express Partner' : (lo.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner')),
          courier_name: lo.courier_name || lo.courier || (lo.awb_code ? 'Shiprocket Express Partner' : (lo.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner')),
          tracking_number: lo.awb_code || lo.tracking_number || '',
          awb_code: lo.awb_code || '',
          shiprocket_order_id: lo.shiprocket_order_id || '',
          shiprocket_shipment_id: lo.shiprocket_shipment_id || '',
          shipping_status: lo.shipping_status || 'NOT_CREATED',
          shipping_status_code: lo.shipping_status_code || '',
          shipping_label_url: lo.shipping_label_url || '',
          shipping_manifest_url: lo.shipping_manifest_url || '',
          pickup_status: lo.pickup_status || 'NOT_REQUESTED',
          tracking_history: lo.tracking_history || [],
          tracking_url: lo.tracking_url || '',
          notes: lo.notes || ''
        });
      }
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    // 3. Filter by status if requested
    if (status && status !== 'all') {
      const s = status.toLowerCase();
      orders = orders.filter(o => o.status.toLowerCase() === s);
    }

    // 4. Search filter
    if (search) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customer && o.customer.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q)) ||
        (o.awb_code && o.awb_code.toLowerCase().includes(q)) ||
        (o.shiprocket_order_id && o.shiprocket_order_id.toLowerCase().includes(q))
      );
    }

    const total = orders.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const paginated = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: paginated
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update Order Status & Fulfillment Tracking
exports.adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      order_status,
      payment_status,
      shipping_status,
      tracking_number,
      awb_code,
      tracking_url,
      notes,
      courier,
      courier_name,
      shiprocket_order_id,
      shiprocket_shipment_id,
      shipping_label_url,
      pickup_status,
      payment_method
    } = req.body;

    const normalizeOrderStatus = (status) => {
      if (!status) return undefined;
      const s = String(status).toLowerCase().trim();
      if (s.includes('dispatch') || s.includes('transit') || s.includes('shipped') || s.includes('ship')) return 'shipped';
      if (s.includes('pack')) return 'packed';
      if (s.includes('deliv')) return 'delivered';
      if (s.includes('cancel')) return 'cancelled';
      if (s.includes('process')) return 'processing';
      if (s.includes('return')) return 'returned';
      if (s.includes('refund')) return 'refunded';
      if (s.includes('pending')) return 'pending';
      if (s.includes('confirm')) return 'confirmed';
      return s;
    };

    const normalizePaymentStatus = (status) => {
      if (!status) return undefined;
      const s = String(status).toLowerCase().trim();
      if (s.includes('paid')) return 'paid';
      if (s.includes('refund')) return 'refunded';
      if (s.includes('fail')) return 'failed';
      if (s.includes('cancel')) return 'cancelled';
      return 'pending';
    };

    const normOrderStatus = normalizeOrderStatus(order_status);
    const normPaymentStatus = normalizePaymentStatus(payment_status);

    const updates = {};
    if (normOrderStatus) updates.order_status = normOrderStatus;
    if (normPaymentStatus) updates.payment_status = normPaymentStatus;
    if (shipping_status) updates.shipping_status = shipping_status.toUpperCase();
    if (tracking_number) updates.tracking_number = tracking_number;
    if (awb_code) {
      updates.awb_code = awb_code;
      if (!updates.tracking_number) updates.tracking_number = awb_code;
    }
    if (tracking_url) updates.tracking_url = tracking_url;
    if (notes !== undefined) updates.notes = notes;
    if (courier || courier_name) {
      updates.courier = courier || courier_name;
      updates.courier_name = courier || courier_name;
    }
    if (payment_method) updates.payment_method = payment_method;
    if (shiprocket_order_id) updates.shiprocket_order_id = shiprocket_order_id;
    if (shiprocket_shipment_id) updates.shiprocket_shipment_id = shiprocket_shipment_id;
    if (shipping_label_url) updates.shipping_label_url = shipping_label_url;
    if (pickup_status) updates.pickup_status = pickup_status;

    // 1. Update in Supabase if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        // Find existing order in Supabase
        let existingSbOrder = null;
        if (isUuid) {
          const { data } = await supabaseAdmin.from('orders').select('*').eq('id', id).maybeSingle();
          existingSbOrder = data;
        } else {
          const { data } = await supabaseAdmin.from('orders').select('*').eq('order_number', id).maybeSingle();
          existingSbOrder = data;
        }
        if (!existingSbOrder) {
          const { data } = await supabaseAdmin.from('orders').select('*').or(`id.eq.${id},order_number.eq.${id}`).maybeSingle();
          existingSbOrder = data;
        }

        // Build clean address JSONB
        let currentShipAddr = {};
        if (existingSbOrder && existingSbOrder.shipping_address) {
          currentShipAddr = typeof existingSbOrder.shipping_address === 'object' ? existingSbOrder.shipping_address : {};
        }

        const customerName = req.body.customer || req.body.guest_name || currentShipAddr.name || 'Customer';
        const customerPhone = req.body.phone || req.body.guest_phone || currentShipAddr.phone || '';
        const customerEmail = req.body.email || req.body.guest_email || currentShipAddr.email || '';
        const addressText = req.body.address || (typeof req.body.shipping_address === 'string' ? req.body.shipping_address : (req.body.shipping_address?.address_line_1 || currentShipAddr.address_line_1 || currentShipAddr.address || ''));

        const mergedShippingAddress = {
          ...currentShipAddr,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address_line_1: addressText,
          address: addressText
        };

        const sbUpdates = {
          shipping_address: mergedShippingAddress,
          updated_at: new Date().toISOString()
        };

        if (normOrderStatus) sbUpdates.order_status = normOrderStatus;
        if (normPaymentStatus) sbUpdates.payment_status = normPaymentStatus;
        if (payment_method) sbUpdates.payment_method = payment_method;
        if (tracking_number || awb_code) {
          sbUpdates.tracking_number = tracking_number || awb_code;
          sbUpdates.awb_code = awb_code || tracking_number;
        }
        if (courier_name || courier) sbUpdates.courier_name = courier_name || courier;
        if (notes !== undefined) sbUpdates.notes = notes;
        if (shipping_status) sbUpdates.shipping_status = shipping_status.toUpperCase();
        if (tracking_url) sbUpdates.tracking_url = tracking_url;
        if (shipping_label_url) sbUpdates.shipping_label_url = shipping_label_url;
        if (pickup_status) sbUpdates.pickup_status = pickup_status;
        if (shiprocket_order_id) sbUpdates.shiprocket_order_id = shiprocket_order_id;
        if (shiprocket_shipment_id) sbUpdates.shiprocket_shipment_id = shiprocket_shipment_id;

        const targetColumn = (existingSbOrder && existingSbOrder.id) ? 'id' : (isUuid ? 'id' : 'order_number');
        const targetValue = (existingSbOrder && existingSbOrder.id) ? existingSbOrder.id : id;

        const { error: sbUpdateErr } = await supabaseAdmin
          .from('orders')
          .update(sbUpdates)
          .eq(targetColumn, targetValue);

        if (sbUpdateErr) {
          console.warn('[adminUpdateOrderStatus] Supabase full update notice:', sbUpdateErr.message);
          // Fallback retry with core columns only
          const coreUpdates = {
            order_status: sbUpdates.order_status,
            payment_status: sbUpdates.payment_status,
            shipping_address: sbUpdates.shipping_address,
            tracking_number: sbUpdates.tracking_number,
            notes: sbUpdates.notes,
            updated_at: sbUpdates.updated_at
          };
          await supabaseAdmin.from('orders').update(coreUpdates).eq(targetColumn, targetValue);
        }
      } catch (sbErr) {
        console.warn('[adminUpdateOrderStatus] Supabase update notice:', sbErr.message);
      }
    }

    // 2. Update local database
    let order = db.findById('orders', id) || db.findOne('orders', o => o.order_number === id);
    let updated = null;
    if (order) {
      if (req.body.customer || req.body.guest_name) updates.customer = req.body.customer || req.body.guest_name;
      if (req.body.phone || req.body.guest_phone) updates.phone = req.body.phone || req.body.guest_phone;
      if (req.body.email || req.body.guest_email) updates.email = req.body.email || req.body.guest_email;
      if (req.body.address) updates.address = req.body.address;

      updated = db.update('orders', order.id, updates);

      // Notify Customer if user_id exists
      if (normOrderStatus && order.user_id) {
        db.insert('notifications', {
          user_id: order.user_id,
          title: `Order #${order.order_number} Update`,
          message: `Your order status changed to "${normOrderStatus.replace(/_/g, ' ').toUpperCase()}".`,
          type: 'order',
          link: `/order-tracking.html?order=${order.order_number}`,
          is_read: false
        });
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully in database.',
      data: updated || { id, ...updates }
    });
  } catch (err) {
    next(err);
  }
};

// Generate & Download Order Tax Invoice (HTML / PDF Print / JSON)
exports.getOrderInvoice = async (req, res, next) => {
  try {
    const rawId = (req.params.identifier || '').trim();
    const identifier = decodeURIComponent(rawId).replace(/^#/, '').replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').trim();
    let order = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        let q = supabaseAdmin.from('orders').select('*, order_items(*), payments(*)');
        if (isUuid) q = q.eq('id', identifier);
        else q = q.eq('order_number', identifier);

        let { data: sbOrder } = await q.maybeSingle();
        if (!sbOrder && !isUuid) {
          // Fallback to ilike match in case prefix differed
          const { data: fuzzyOrders } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*), payments(*)')
            .ilike('order_number', `%${identifier.replace(/^HN-/, '')}%`)
            .limit(1);
          if (Array.isArray(fuzzyOrders) && fuzzyOrders.length > 0) {
            sbOrder = fuzzyOrders[0];
          }
        }
        if (sbOrder) order = sbOrder;
      } catch (sbE) {
        console.warn('[getOrderInvoice] Supabase fetch error:', sbE.message);
      }
    }

    if (!order) {
      const localOrd = db.findById('orders', identifier) || db.findOne('orders', o => o.order_number === identifier);
      if (localOrd) {
        const items = db.filter('order_items', oi => oi.order_id === localOrd.id);
        const payments = db.filter('payments', p => p.order_id === localOrd.id);
        order = { ...localOrd, order_items: items, payments };
      }
    }

    if (!order) {
      return res.status(404).send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>Invoice Not Found</h2>
            <p>Order ${identifier} was not found in the records.</p>
            <a href="/index.html">Return to Harinama Store</a>
          </body>
        </html>
      `);
    }

    const shipAddr = order.shipping_address || {};
    const items = order.order_items || order.items || [];
    const customerName = shipAddr.name || order.guest_name || 'Valued Devotee';
    const customerPhone = shipAddr.phone || '—';
    const customerEmail = shipAddr.email || order.guest_email || '—';
    const addressLine = `${shipAddr.address_line_1 || ''}${shipAddr.village ? ', ' + shipAddr.village : ''}, ${shipAddr.city || ''}, ${shipAddr.state || ''} - ${shipAddr.pin || ''}`;

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
    const paymentBadgeText = isPaid ? 'PAID (PREPAID)' : 'CASH ON DELIVERY (PENDING)';
    const paymentBadgeColor = isPaid ? '#15803D' : '#D97706';

    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const shippingFee = Number(order.shipping_fee || 0);
    const tax = Number(order.tax || 0);
    const total = Number(order.total || 0);

    const invoiceNo = `INV-${(order.order_number || order.id || '').replace(/^HN-/, '')}`;

    if (req.query.format === 'json') {
      return res.json({
        success: true,
        data: {
          invoice_number: invoiceNo,
          order_number: order.order_number,
          order_date: orderDate,
          customer: { name: customerName, phone: customerPhone, email: customerEmail, address: addressLine },
          items,
          pricing: { subtotal, discount, shipping_fee: shippingFee, tax, total },
          shipping: {
            status: order.shipping_status || 'CONFIRMED',
            courier: order.courier_name || (order.awb_code ? 'Shiprocket Express Partner' : (order.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner')),
            awb_code: order.awb_code || '—',
            tracking_number: order.tracking_number || '—'
          }
        }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${order.order_number} | Harinama Store</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0F1E36;
      --gold: #C59B27;
      --gold-dark: #9A771C;
      --border: #E2E8F0;
      --text: #1E293B;
      --text-muted: #64748B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F8FAFC;
      color: var(--text);
      padding: 30px 15px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(15, 30, 54, 0.06);
      padding: 40px;
      position: relative;
    }
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-gold {
      background: linear-gradient(135deg, #C59B27, #9A771C);
      color: #FFFFFF;
      border: none;
    }
    .btn-gold:hover { opacity: 0.92; transform: translateY(-1px); }
    .btn-outline {
      background: transparent;
      color: var(--primary);
      border: 1px solid var(--border);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #F1F5F9;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .store-brand {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 0.5px;
    }
    .store-tagline {
      font-size: 12px;
      color: var(--gold-dark);
      font-weight: 600;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .store-details {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 8px;
      line-height: 1.4;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--gold);
    }
    .invoice-meta-item {
      font-size: 13px;
      margin-top: 4px;
      color: var(--text);
    }
    .invoice-meta-item span {
      color: var(--text-muted);
    }
    .badge-status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #FFFFFF;
      background: ${paymentBadgeColor};
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      background: #F8FAFC;
      border-radius: 8px;
      padding: 16px 20px;
      border: 1px solid #EDF2F7;
    }
    .section-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--gold-dark);
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .section-content {
      font-size: 13px;
      line-height: 1.45;
      color: var(--text);
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.invoice-table th {
      background: #0F1E36;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 14px;
      text-align: left;
    }
    table.invoice-table th.text-right { text-align: right; }
    table.invoice-table td {
      padding: 14px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      vertical-align: middle;
    }
    table.invoice-table td.text-right { text-align: right; }
    .item-title {
      font-weight: 600;
      color: var(--primary);
    }
    .item-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .summary-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-table {
      width: 320px;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 6px 0;
      font-size: 13px;
    }
    .summary-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    .summary-table tr.total-row td {
      border-top: 2px solid var(--primary);
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: var(--primary);
    }
    .blessing-footer {
      border-top: 1px dashed var(--border);
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .blessing-quote {
      font-family: 'Cinzel', serif;
      font-style: italic;
      color: var(--primary);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .no-print { display: none !important; }
      .invoice-container { box-shadow: none; border: none; padding: 20px 0; }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>

  <div class="no-print">
    <a href="javascript:history.back()" class="btn btn-outline">← Back to Store</a>
    <div style="display: flex; gap: 10px;">
      <button onclick="downloadPDF()" class="btn btn-gold" id="btn-download-pdf">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 4px;"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
        Download PDF (.pdf)
      </button>
      <button onclick="window.print()" class="btn btn-outline">
        🖨️ Print Invoice
      </button>
    </div>
  </div>

  <div class="invoice-container" id="invoice-doc">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="store-brand">HARINAMA STORE</div>
        <div class="store-tagline">Devotional Keepsakes & Sacred Scriptures</div>
        <div class="store-details">
          Radha Raman Marg, Vrindavan, Mathura, UP - 281121<br>
          GSTIN: 09AAAPH1234F1Z5 | PAN: AAAPH1234F<br>
          WhatsApp: +91 79937 91014 | Email: harinamaivakevalam@gmail.com
        </div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-meta-item"><span>Invoice No:</span> <strong>${invoiceNo}</strong></div>
        <div class="invoice-meta-item"><span>Order No:</span> <strong>${order.order_number}</strong></div>
        <div class="invoice-meta-item"><span>Order Date:</span> ${orderDate}</div>
        <div><span class="badge-status">${paymentBadgeText}</span></div>
      </div>
    </div>

    <!-- Customer & Dispatch Details -->
    <div class="section-grid">
      <div>
        <div class="section-heading">Billed & Shipped To</div>
        <div class="section-content">
          <strong>${customerName}</strong><br>
          ${addressLine}<br>
          Phone: ${customerPhone}<br>
          Email: ${customerEmail}
        </div>
      </div>
      <div>
        <div class="section-heading">Shipping & Courier Details</div>
        <div class="section-content">
          <strong>Courier:</strong> ${order.courier_name || (order.awb_code ? 'Shiprocket Express Partner' : (order.shiprocket_order_id ? 'Shiprocket / Delivery Partner' : 'Assigned Delivery Partner'))}<br>
          <strong>AWB Code:</strong> ${order.awb_code || 'Assigned on Dispatch'}<br>
          <strong>Tracking No:</strong> ${order.tracking_number || order.order_number}<br>
          <strong>Payment Mode:</strong> ${(order.payment_method || 'Online').toUpperCase()}
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Sacred Product Description</th>
          <th style="width: 80px;" class="text-right">Qty</th>
          <th style="width: 100px;" class="text-right">Unit Price</th>
          <th style="width: 110px;" class="text-right">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const qty = it.quantity || it.qty || 1;
          const price = Number(it.price || 0);
          const itemTotal = price * qty;
          const mat = it.variant_info?.material || it.material || 'Devotional Standard';
          return `
            <tr>
              <td>${idx + 1}</td>
              <td>
                <div class="item-title">${it.product_name || it.name || 'Sacred Devotional Item'}</div>
                <div class="item-sub">SKU: ${it.sku || 'HN-SKU-SACRED'} • Material: ${mat}</div>
              </td>
              <td class="text-right">${qty}</td>
              <td class="text-right">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td class="text-right"><strong>₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Pricing Summary -->
    <div class="summary-wrapper">
      <table class="summary-table">
        <tr>
          <td>Item Subtotal:</td>
          <td>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
        ${discount > 0 ? `
        <tr style="color: #15803D;">
          <td>Holy Coupon Discount:</td>
          <td>-₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>` : ''}
        <tr>
          <td>Sacred Packaging & Dispatch:</td>
          <td>${shippingFee === 0 ? 'FREE' : '₹' + shippingFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>GST (5% Inclusive):</td>
          <td>₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr class="total-row">
          <td>Grand Total:</td>
          <td>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <!-- Blessing Footer -->
    <div class="blessing-footer">
      <div class="blessing-quote">"Hare Krishna Hare Krishna Krishna Krishna Hare Hare | Hare Rama Hare Rama Rama Rama Hare Hare"</div>
      <div>Thank you for choosing Harinama Store. May Sri Sri Radha Shyamasundara bring peace, devotion, and auspiciousness to your home. 🌸</div>
      <div style="margin-top: 6px; font-size: 11px; color: #94A3B8;">This is a computer-generated tax invoice and requires no physical signature.</div>
    </div>
  </div>

  <script>
    function downloadPDF() {
      const btn = document.getElementById('btn-download-pdf');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Generating PDF...';
      btn.disabled = true;

      const element = document.getElementById('invoice-doc');
      const opt = {
        margin: [8, 8, 8, 8],
        filename: 'Harinama-Store-Invoice-${order.order_number}.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }).catch(() => {
        window.print();
        btn.innerHTML = originalText;
        btn.disabled = false;
      });
    }

    if (window.location.search.includes('download=pdf') || window.location.search.includes('download=true')) {
      window.onload = function() {
        setTimeout(downloadPDF, 400);
      };
    } else if (window.location.search.includes('print=true')) {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 400);
      };
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

// Admin Delete Single Order (Deletes from Supabase and local store)
exports.adminDeleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // 1. Delete from Supabase if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let q = supabaseAdmin.from('orders');
        if (isUuid) {
          await supabaseAdmin.from('order_items').delete().eq('order_id', id);
          await supabaseAdmin.from('payments').delete().eq('order_id', id);
          await q.delete().eq('id', id);
        } else {
          const { data: found } = await supabaseAdmin.from('orders').select('id').eq('order_number', id).maybeSingle();
          if (found && found.id) {
            await supabaseAdmin.from('order_items').delete().eq('order_id', found.id);
            await supabaseAdmin.from('payments').delete().eq('order_id', found.id);
            await q.delete().eq('id', found.id);
          }
        }
      } catch (err) {
        console.warn('[adminDeleteOrder] Supabase delete notice:', err.message);
      }
    }

    // 2. Delete from local database
    const localOrder = db.findById('orders', id) || db.findOne('orders', o => o.order_number === id);
    if (localOrder) {
      db.delete('orders', localOrder.id);
      const items = db.find('order_items', i => i.order_id === localOrder.id);
      items.forEach(i => db.delete('order_items', i.id));
      const payments = db.find('payments', p => p.order_id === localOrder.id);
      payments.forEach(p => db.delete('payments', p.id));
    }

    res.json({ success: true, message: `Order ${id} deleted successfully.` });
  } catch (err) {
    next(err);
  }
};

// Admin Clear All Test Orders (Wipes all orders from Supabase and local database)
exports.adminClearAllOrders = async (req, res, next) => {
  try {
    // 1. Clear Supabase orders if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('[adminClearAllOrders] Supabase clear notice:', err.message);
      }
    }

    // 2. Clear local store
    db.data.orders = [];
    db.data.order_items = [];
    db.data.payments = [];
    db.save();

    res.json({ success: true, message: 'All orders cleared successfully from database.' });
  } catch (err) {
    next(err);
  }
};
