const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

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
      let availableStock = 100;
      let unitPrice = 0;

      if (isSupabaseConfigured && supabaseAdmin) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id);
        let q = supabaseAdmin.from('products').select('*');
        if (isUuid) q = q.eq('id', item.product_id);
        else q = q.or(`slug.eq.${item.product_id},sku.eq.${item.product_id}`);
        const { data: dbProd } = await q.maybeSingle();
        if (dbProd) product = dbProd;
      }

      if (!product) {
        product = db.findById('products', item.product_id) || db.findOne('products', p => p.slug === item.product_id);
      }

      if (!product || product.status === 'inactive' || product.status === 'archived') {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product_name || item.product_id}" is no longer available.`
        });
      }

      unitPrice = parseFloat(product.price);
      availableStock = product.stock != null ? product.stock : 100;

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      const primaryImage = product.image || product.primary_image || item.image || '';

      orderItemsToCreate.push({
        product_id: product.id,
        variant_id: null,
        product_name: product.name || product.title,
        product_image: primaryImage,
        sku: product.sku || 'HN-SKU',
        variant_info: item.material ? { material: item.material } : null,
        quantity: qty,
        price: unitPrice,
        total: itemTotal
      });
    }

    // 2. Coupon Discount Calculation
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data: cpn } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .eq('code', coupon_code.toUpperCase().trim())
          .eq('status', 'active')
          .maybeSingle();
        if (cpn && new Date(cpn.expiry_date) >= new Date()) {
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
          }
        }
      } else {
        const coupon = db.findOne('coupons', c => c.code.toUpperCase() === coupon_code.toUpperCase().trim());
        if (coupon && coupon.status === 'active' && new Date(coupon.expiry_date) >= new Date()) {
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

    let createdOrderRecord = null;

    // 3. Supabase Database Insertion
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
          tracking_number: trackingNum,
          tracking_url: trackingUrl,
          notes: notes || ''
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
        }
      } catch (sbErr) {
        console.warn('[Database] Supabase transaction failed:', sbErr.message);
      }
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
      tracking_number: trackingNum,
      tracking_url: trackingUrl,
      notes: notes || ''
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

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Hare Krishna. 🌸',
      data: {
        order_id: createdOrderRecord ? createdOrderRecord.id : localOrder.id,
        order_number: orderNumber,
        total: grandTotal,
        order_status: 'confirmed',
        payment_status: isOnlinePaid ? 'paid' : 'pending',
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
exports.getOrderDetails = (req, res, next) => {
  try {
    const { identifier } = req.params;
    const order = db.findOne('orders', o => o.order_number === identifier || o.id === identifier);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check authorization: must be order owner or admin
    if (req.user && req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    const items = db.filter('order_items', oi => oi.order_id === order.id);
    const payments = db.filter('payments', p => p.order_id === order.id);
    const user = db.findById('users', order.user_id);

    // Build timeline stages
    const statuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = statuses.indexOf(order.order_status);
    const timeline = statuses.map((st, idx) => ({
      status: st,
      label: st.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      completed: currentIdx >= idx && order.order_status !== 'cancelled',
      active: order.order_status === st,
      date: currentIdx >= idx ? order.updated_at : null
    }));

    res.json({
      success: true,
      data: {
        ...order,
        customer: user ? { name: user.name, email: user.email, phone: user.phone } : null,
        items,
        payments,
        timeline
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
exports.adminGetOrders = (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let orders = db.findAll('orders').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (status && status !== 'all') {
      orders = orders.filter(o => o.order_status === status);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o => 
        o.order_number.toLowerCase().includes(q) ||
        o.shipping_address?.name?.toLowerCase().includes(q) ||
        o.shipping_address?.phone?.includes(q)
      );
    }

    const total = orders.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const paginated = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum).map(order => {
      const items = db.filter('order_items', oi => oi.order_id === order.id);
      const user = db.findById('users', order.user_id);
      return {
        ...order,
        items,
        customer_name: user ? user.name : order.shipping_address?.name || 'Customer'
      };
    });

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
exports.adminUpdateOrderStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status, tracking_number, tracking_url, notes } = req.body;

    const order = db.findById('orders', id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updates = {};
    if (order_status) updates.order_status = order_status;
    if (payment_status) updates.payment_status = payment_status;
    if (tracking_number) updates.tracking_number = tracking_number;
    if (tracking_url) updates.tracking_url = tracking_url;
    if (notes) updates.notes = notes;

    const updated = db.update('orders', id, updates);

    // Notify Customer
    if (order_status) {
      db.insert('notifications', {
        user_id: order.user_id,
        title: `Order #${order.order_number} Update`,
        message: `Your order status changed to "${order_status.replace(/_/g, ' ').toUpperCase()}".`,
        type: 'order',
        link: `/order-tracking.html?order=${order.order_number}`,
        is_read: false
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};
