const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// Helper to generate professional order number: HN-YYYY-XXXXX
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `HN-${year}-${randomNum}`;
};

// Create New Order
exports.createOrder = (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      items = [],
      shipping_address,
      billing_address,
      payment_method = 'cod',
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
      const product = db.findById('products', item.product_id);
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product_name || item.product_id}" is no longer available.`
        });
      }

      let unitPrice = parseFloat(product.price);
      let availableStock = product.stock;
      let variant = null;

      if (item.variant_id) {
        variant = db.findById('product_variants', item.variant_id);
        if (variant) {
          unitPrice = parseFloat(variant.price);
          availableStock = variant.stock;
        }
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${qty}.`
        });
      }

      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      const images = db.filter('product_images', img => img.product_id === product.id);
      const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || '';

      orderItemsToCreate.push({
        product_id: product.id,
        variant_id: item.variant_id || null,
        product_name: product.name,
        product_image: primaryImage,
        sku: variant ? variant.sku : product.sku,
        variant_info: variant ? { size: variant.size, color: variant.color, sku: variant.sku } : null,
        quantity: qty,
        price: unitPrice,
        total: itemTotal
      });
    }

    // 2. Coupon Discount Calculation
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
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

          // Increment coupon usage
          db.update('coupons', coupon.id, { times_used: (coupon.times_used || 0) + 1 });
        }
      }
    }

    const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round((taxableAmount * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + shippingFee + tax) * 100) / 100;

    // 3. Atomically decrement stock
    orderItemsToCreate.forEach(item => {
      const product = db.findById('products', item.product_id);
      if (product) {
        db.update('products', product.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
      if (item.variant_id) {
        const variant = db.findById('product_variants', item.variant_id);
        if (variant) {
          db.update('product_variants', variant.id, { stock: Math.max(0, variant.stock - item.quantity) });
        }
      }
    });

    // 4. Create Order record
    const orderNumber = generateOrderNumber();
    const isOnlinePaid = ['razorpay', 'stripe'].includes(payment_method);

    const newOrder = db.insert('orders', {
      order_number: orderNumber,
      user_id: userId || 'c2222222-2222-4222-8222-222222222222', // Customer fallback for guest
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
      tracking_number: `HN-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      tracking_url: `/order-tracking.html?order=${orderNumber}`,
      notes: notes || ''
    });

    // 5. Create Order Items
    orderItemsToCreate.forEach(oi => {
      db.insert('order_items', {
        order_id: newOrder.id,
        ...oi
      });
    });

    // 6. Record Payment
    db.insert('payments', {
      order_id: newOrder.id,
      payment_provider: payment_method,
      transaction_id: `txn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      amount: grandTotal,
      currency: 'INR',
      status: isOnlinePaid ? 'captured' : 'pending'
    });

    // 7. Clear User Cart if logged in
    if (userId) {
      const userCart = db.findOne('carts', c => c.user_id === userId);
      if (userCart) {
        const cartItems = db.filter('cart_items', ci => ci.cart_id === userCart.id);
        cartItems.forEach(ci => db.delete('cart_items', ci.id));
      }

      // Add Notification
      db.insert('notifications', {
        user_id: userId,
        title: `Order Placed: #${orderNumber} 📦`,
        message: `Thank you for your order! Total amount: ₹${grandTotal}. Track your shipment anytime.`,
        type: 'order',
        link: `/order-tracking.html?order=${orderNumber}`,
        is_read: false
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Hare Krishna.',
      data: {
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        total: newOrder.total,
        order_status: newOrder.order_status,
        payment_status: newOrder.payment_status,
        tracking_url: newOrder.tracking_url,
        items: orderItemsToCreate
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Logged In User's Orders
exports.getUserOrders = (req, res, next) => {
  try {
    const orders = db.filter('orders', o => o.user_id === req.user.id)
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
