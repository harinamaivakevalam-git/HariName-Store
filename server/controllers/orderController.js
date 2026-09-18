const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const shiprocketService = require('../services/shiprocketService');

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

    const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round((taxableAmount * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + shippingFee + tax) * 100) / 100;

    const orderNumber = generateOrderNumber();
    const isOnlinePaid = ['razorpay', 'stripe'].includes(payment_method);
    const trackingNum = `HN-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingUrl = `/order-tracking.html?order=${orderNumber}`;

    // 3. Optional Automatic Shiprocket Shipment Creation (Zero Interruption)
    const srData = {
      shiprocket_order_id: null,
      shiprocket_shipment_id: null,
      awb_code: null,
      courier_name: 'India Post Speed Post',
      shipping_status: 'NOT_CREATED',
      shipping_status_code: null,
      shipping_label_url: null,
      shipping_manifest_url: null,
      pickup_status: 'NOT_REQUESTED',
      pickup_scheduled_date: null,
      tracking_history: [
        {
          date: new Date().toISOString(),
          status: 'ORDER_PLACED',
          location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
          activity: 'Order placed & confirmed'
        }
      ]
    };

    if (shiprocketService.isConfigured()) {
      try {
        const srRes = await shiprocketService.createOrder({
          order_number: orderNumber,
          shipping_address,
          billing_address,
          payment_method,
          subtotal,
          discount: discountAmount,
          shipping_fee: shippingFee,
          items: orderItemsToCreate,
          created_at: new Date().toISOString()
        });

        if (srRes && srRes.data) {
          srData.shiprocket_order_id = String(srRes.data.order_id);
          srData.shiprocket_shipment_id = String(srRes.data.shipment_id);
          srData.shipping_status = 'ORDER_CREATED';
          srData.shipping_status_code = String(srRes.data.status_code || '');
          srData.tracking_history.push({
            date: new Date().toISOString(),
            status: 'ORDER_CREATED',
            location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
            activity: 'Shipment created with Shiprocket'
          });

          // Attempt AWB assignment
          try {
            const awbRes = await shiprocketService.assignAwb(srRes.data.shipment_id);
            if (awbRes && awbRes.data && awbRes.data.awb_code) {
              srData.awb_code = awbRes.data.awb_code;
              srData.courier_name = awbRes.data.courier_name || 'Shiprocket Courier';
              srData.shipping_status = 'AWB_ASSIGNED';
              srData.tracking_history.push({
                date: new Date().toISOString(),
                status: 'AWB_ASSIGNED',
                location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'),
                activity: `AWB ${awbRes.data.awb_code} assigned with ${srData.courier_name}`
              });
            }
          } catch (awbErr) {
            console.warn('[Order Creation] Auto AWB assignment deferred:', awbErr.message);
          }
        }
      } catch (srErr) {
        console.warn('[Order Creation] Shiprocket auto-creation deferred:', srErr.message);
      }
    }

    let createdOrderRecord = null;

    // 4. Supabase Database Insertion
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const orderPayload = {
          order_number: orderNumber,
          user_id: userId || null,
          guest_name: !userId ? shipping_address.name : null,
          guest_email: !userId ? (shipping_address.email || 'guest@harinama.com') : null,
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
          tracking_number: srData.awb_code || trackingNum,
          tracking_url: trackingUrl,
          notes: notes || '',
          shiprocket_order_id: srData.shiprocket_order_id,
          shiprocket_shipment_id: srData.shiprocket_shipment_id,
          awb_code: srData.awb_code,
          courier_name: srData.courier_name,
          shipping_status: srData.shipping_status,
          shipping_status_code: srData.shipping_status_code,
          shipping_label_url: srData.shipping_label_url,
          shipping_manifest_url: srData.shipping_manifest_url,
          pickup_status: srData.pickup_status,
          pickup_scheduled_date: srData.pickup_scheduled_date,
          tracking_history: srData.tracking_history,
          shipping_updated_at: new Date().toISOString()
        };

        const { data: dbOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (orderErr) {
          console.warn('[Database] Supabase order insert failed, saving to local store:', orderErr.message);
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

          // Calculate actual transaction ID from payment details if provided
          const actualTxnId = transaction_id || payment_details.razorpay_payment_id || `txn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

          // Insert payment record
          await supabaseAdmin.from('payments').insert({
            order_id: dbOrder.id,
            payment_provider: payment_method,
            transaction_id: actualTxnId,
            amount: grandTotal,
            currency: 'INR',
            status: isOnlinePaid ? 'captured' : 'pending'
          });

          // Increment coupon usage in Supabase
          if (matchedCouponObj && matchedCouponObj.id) {
            try {
              await supabaseAdmin
                .from('coupons')
                .update({ times_used: matchedCouponObj.times_used + 1 })
                .eq('id', matchedCouponObj.id);
            } catch (cpnErr) {
              console.warn('[Database] Failed to increment coupon usage in Supabase:', cpnErr);
            }
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

    const actualTxnId = transaction_id || payment_details.razorpay_payment_id || `txn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Always mirror in-memory for zero-latency local lookups
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
      tracking_number: srData.awb_code || trackingNum,
      tracking_url: trackingUrl,
      notes: notes || '',
      shiprocket_order_id: srData.shiprocket_order_id,
      shiprocket_shipment_id: srData.shiprocket_shipment_id,
      awb_code: srData.awb_code,
      courier_name: srData.courier_name,
      shipping_status: srData.shipping_status,
      shipping_status_code: srData.shipping_status_code,
      shipping_label_url: srData.shipping_label_url,
      shipping_manifest_url: srData.shipping_manifest_url,
      pickup_status: srData.pickup_status,
      pickup_scheduled_date: srData.pickup_scheduled_date,
      tracking_history: srData.tracking_history,
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
      transaction_id: actualTxnId,
      amount: grandTotal,
      currency: 'INR',
      status: isOnlinePaid ? 'captured' : 'pending'
    });

    if (matchedCouponObj && matchedCouponObj.source === 'db') {
      const cpnRec = db.findById('coupons', matchedCouponObj.id);
      if (cpnRec) {
        db.update('coupons', matchedCouponObj.id, { times_used: (cpnRec.times_used || 0) + 1 });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Hare Krishna. 🌸',
      data: {
        order_id: createdOrderRecord ? createdOrderRecord.id : localOrder.id,
        order_number: orderNumber,
        total: grandTotal,
        order_status: 'confirmed',
        payment_status: isOnlinePaid ? 'paid' : 'pending',
        shipping_status: srData.shipping_status,
        shiprocket_order_id: srData.shiprocket_order_id,
        awb_code: srData.awb_code,
        courier_name: srData.courier_name,
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
              courier: o.courier_name || o.courier || 'India Post Speed Post',
              courier_name: o.courier_name || o.courier || 'India Post Speed Post',
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
          courier: lo.courier_name || lo.courier || 'India Post Speed Post',
          courier_name: lo.courier_name || lo.courier || 'India Post Speed Post',
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
      pickup_status
    } = req.body;

    const updates = {};
    if (order_status) updates.order_status = order_status.toLowerCase();
    if (payment_status) updates.payment_status = payment_status.toLowerCase();
    if (shipping_status) updates.shipping_status = shipping_status.toUpperCase();
    if (tracking_number) updates.tracking_number = tracking_number;
    if (awb_code) {
      updates.awb_code = awb_code;
      if (!updates.tracking_number) updates.tracking_number = awb_code;
    }
    if (tracking_url) updates.tracking_url = tracking_url;
    if (notes) updates.notes = notes;
    if (courier || courier_name) {
      updates.courier = courier || courier_name;
      updates.courier_name = courier || courier_name;
    }
    if (shiprocket_order_id) updates.shiprocket_order_id = shiprocket_order_id;
    if (shiprocket_shipment_id) updates.shiprocket_shipment_id = shiprocket_shipment_id;
    if (shipping_label_url) updates.shipping_label_url = shipping_label_url;
    if (pickup_status) updates.pickup_status = pickup_status;
    updates.shipping_updated_at = new Date().toISOString();
    updates.updated_at = new Date().toISOString();

    // 1. Update in Supabase if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let q = supabaseAdmin.from('orders').update(updates);
        if (isUuid) q = q.eq('id', id);
        else q = q.eq('order_number', id);
        await q;
      } catch (sbErr) {
        console.warn('[adminUpdateOrderStatus] Supabase update notice:', sbErr.message);
      }
    }

    // 2. Update local database
    let order = db.findById('orders', id) || db.findOne('orders', o => o.order_number === id);
    let updated = null;
    if (order) {
      updated = db.update('orders', order.id, updates);

      // Notify Customer
      if (order_status && order.user_id) {
        db.insert('notifications', {
          user_id: order.user_id,
          title: `Order #${order.order_number} Update`,
          message: `Your order status changed to "${order_status.replace(/_/g, ' ').toUpperCase()}".`,
          type: 'order',
          link: `/order-tracking.html?order=${order.order_number}`,
          is_read: false
        });
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully.',
      data: updated || { id, ...updates }
    });
  } catch (err) {
    next(err);
  }
};
