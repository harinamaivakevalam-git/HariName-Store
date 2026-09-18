const { supabase, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

// Helper to resolve product from Supabase or local store
const resolveProduct = async (productId) => {
  if (!productId) return null;
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      let q = supabase.from('products').select('*, product_images(*)');
      if (isUuid) q = q.or(`id.eq.${productId},slug.eq.${productId}`);
      else q = q.eq('slug', productId);
      const { data, error } = await q.maybeSingle();
      if (!error && data) {
        const images = (data.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || '';
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          price: parseFloat(data.price),
          compare_price: data.compare_price ? parseFloat(data.compare_price) : null,
          stock: data.stock !== undefined ? data.stock : 10,
          status: data.status || 'active',
          primary_image: primaryImage,
          image: primaryImage
        };
      }
    } catch (_) {}
  }
  return db.findById('products', productId) || db.findOne('products', p => p.slug === productId);
};

// Helper to get or create cart
const getOrCreateCart = (userId, sessionId) => {
  let cart = null;
  if (userId) {
    cart = db.findOne('carts', c => c.user_id === userId);
  } else if (sessionId) {
    cart = db.findOne('carts', c => c.session_id === sessionId);
  }

  if (!cart) {
    cart = db.insert('carts', {
      user_id: userId || null,
      session_id: sessionId || null
    });
  }
  return cart;
};

// Helper to format and hydrate cart response
const formatCartResponse = async (cart) => {
  const items = db.filter('cart_items', ci => ci.cart_id === cart.id);

  let subtotal = 0;
  let totalItems = 0;

  const formattedItems = (await Promise.all(items.map(async (item) => {
    const product = await resolveProduct(item.product_id);
    if (!product) return null;

    const variant = item.variant_id ? db.findById('product_variants', item.variant_id) : null;
    const primaryImage = product.primary_image || product.image || '';

    const unitPrice = variant ? parseFloat(variant.price) : parseFloat(product.price);
    const itemTotal = unitPrice * item.quantity;
    const availableStock = variant ? variant.stock : product.stock;

    subtotal += itemTotal;
    totalItems += item.quantity;

    return {
      id: item.id,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: primaryImage,
      variant_id: item.variant_id,
      variant_info: variant ? { size: variant.size, color: variant.color, sku: variant.sku } : null,
      price: unitPrice,
      quantity: item.quantity,
      item_total: itemTotal,
      stock: availableStock,
      is_available: availableStock >= item.quantity
    };
  }))).filter(Boolean);

  return {
    cart_id: cart.id,
    items: formattedItems,
    items_count: totalItems,
    subtotal: Math.round(subtotal * 100) / 100,
    estimated_shipping: subtotal >= 999 || subtotal === 0 ? 0 : 99,
    estimated_tax: Math.round((subtotal * 0.05) * 100) / 100,
    estimated_total: Math.round((subtotal + (subtotal >= 999 || subtotal === 0 ? 0 : 99) + (subtotal * 0.05)) * 100) / 100
  };
};

// Get Cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    const cart = getOrCreateCart(userId, sessionId);
    const data = await formatCartResponse(cart);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

// Add to Cart
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { product_id, variant_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await resolveProduct(product_id);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable.' });
    }

    let availableStock = product.stock;
    if (variant_id) {
      const variant = db.findById('product_variants', variant_id);
      if (!variant) {
        return res.status(404).json({ success: false, message: 'Selected variant not found.' });
      }
      availableStock = variant.stock;
    }

    if (availableStock <= 0) {
      return res.status(400).json({ success: false, message: 'Item is currently out of stock.' });
    }

    const cart = getOrCreateCart(userId, sessionId);
    const existingItem = db.findOne('cart_items', ci => 
      ci.cart_id === cart.id && 
      (ci.product_id === product.id || ci.product_id === product_id) && 
      (variant_id ? ci.variant_id === variant_id : !ci.variant_id)
    );

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    if (existingItem) {
      const newQty = existingItem.quantity + qtyToAdd;
      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${availableStock} items in stock.`
        });
      }
      db.update('cart_items', existingItem.id, { quantity: newQty });
    } else {
      if (qtyToAdd > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qtyToAdd}. Only ${availableStock} items in stock.`
        });
      }
      db.insert('cart_items', {
        cart_id: cart.id,
        product_id: product.id,
        variant_id: variant_id || null,
        quantity: qtyToAdd
      });
    }

    const data = await formatCartResponse(cart);
    res.json({
      success: true,
      message: `Added "${product.name}" to your cart! 🛍️`,
      data
    });
  } catch (err) {
    next(err);
  }
};

// Update Quantity
exports.updateQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const item = db.findById('cart_items', itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const cart = db.findById('carts', item.cart_id);

    if (qty <= 0) {
      db.delete('cart_items', itemId);
      const data = await formatCartResponse(cart);
      return res.json({
        success: true,
        message: 'Item removed from cart.',
        data
      });
    }

    const product = await resolveProduct(item.product_id);
    let availableStock = product ? product.stock : 0;
    if (item.variant_id) {
      const variant = db.findById('product_variants', item.variant_id);
      if (variant) availableStock = variant.stock;
    }

    if (qty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${availableStock}).`
      });
    }

    db.update('cart_items', itemId, { quantity: qty });
    const data = await formatCartResponse(cart);

    res.json({
      success: true,
      message: 'Cart updated.',
      data
    });
  } catch (err) {
    next(err);
  }
};

// Remove Item from Cart
exports.removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = db.findById('cart_items', itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const cart = db.findById('carts', item.cart_id);
    db.delete('cart_items', itemId);
    const data = await formatCartResponse(cart);

    res.json({
      success: true,
      message: 'Item removed from cart.',
      data
    });
  } catch (err) {
    next(err);
  }
};

// Merge Guest Cart into User Cart on Login
exports.mergeCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.json({ success: true, message: 'No guest session provided.' });
    }

    const guestCart = db.findOne('carts', c => c.session_id === sessionId);
    if (!guestCart) {
      const userCart = getOrCreateCart(userId, null);
      const data = await formatCartResponse(userCart);
      return res.json({ success: true, data });
    }

    const userCart = getOrCreateCart(userId, null);
    const guestItems = db.filter('cart_items', ci => ci.cart_id === guestCart.id);

    guestItems.forEach(gItem => {
      const existing = db.findOne('cart_items', ci => 
        ci.cart_id === userCart.id && 
        ci.product_id === gItem.product_id && 
        ci.variant_id === gItem.variant_id
      );

      if (existing) {
        db.update('cart_items', existing.id, { quantity: existing.quantity + gItem.quantity });
      } else {
        db.insert('cart_items', {
          cart_id: userCart.id,
          product_id: gItem.product_id,
          variant_id: gItem.variant_id,
          quantity: gItem.quantity
        });
      }
      db.delete('cart_items', gItem.id);
    });

    db.delete('carts', guestCart.id);
    const data = await formatCartResponse(userCart);

    res.json({
      success: true,
      message: 'Cart merged successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
};

// Clear Cart
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    const cart = getOrCreateCart(userId, sessionId);
    const items = db.filter('cart_items', ci => ci.cart_id === cart.id);
    items.forEach(item => db.delete('cart_items', item.id));

    const data = await formatCartResponse(cart);
    res.json({
      success: true,
      message: 'Cart cleared.',
      data
    });
  } catch (err) {
    next(err);
  }
};
