const db = require('../models/db');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Helper to hydrate product for wishlist
const hydrateProductBasic = (product) => {
  const images = db.filter('product_images', img => img.product_id === product.id);
  const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || product.image || product.primary_image || '';
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_price: product.compare_price,
    image: primaryImage,
    stock: product.stock !== undefined ? product.stock : 25,
    rating: product.rating || 5.0,
    in_stock: (product.stock !== undefined ? product.stock : 25) > 0
  };
};

// Get User's Wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: wishData, error } = await supabaseAdmin
          .from('wishlists')
          .select('id, created_at, product_id, products(*, product_images(*))')
          .eq('user_id', userId);

        if (!error && Array.isArray(wishData)) {
          const items = wishData.map(w => {
            if (!w.products) return null;
            const p = w.products;
            const images = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            const primaryImg = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || p.image_url || '';
            return {
              wishlist_id: w.id,
              added_at: w.created_at,
              product: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: parseFloat(p.price) || 0,
                compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
                image: primaryImg,
                stock: p.stock !== undefined ? p.stock : 25,
                rating: parseFloat(p.rating) || 5.0,
                in_stock: (p.stock || 0) > 0
              }
            };
          }).filter(Boolean);

          return res.json({
            success: true,
            data: items,
            count: items.length
          });
        }
      } catch (sbErr) {
        console.warn('[wishlistController] Supabase getWishlist fallback:', sbErr.message);
      }
    }

    const wishlistItems = db.filter('wishlists', w => w.user_id === userId);

    const items = wishlistItems.map(w => {
      const product = db.findById('products', w.product_id);
      if (!product) return null;
      return {
        wishlist_id: w.id,
        added_at: w.created_at,
        product: hydrateProductBasic(product)
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (err) {
    next(err);
  }
};

// Toggle Wishlist Item (Add if not present, remove if present)
exports.toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    let product = null;
    if (isSupabaseConfigured && supabaseAdmin) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product_id);
      let q = supabaseAdmin.from('products').select('*');
      if (isUuid) q = q.eq('id', product_id);
      else q = q.or(`slug.eq.${product_id},sku.eq.${product_id}`);
      const { data: dbProd } = await q.maybeSingle();
      if (dbProd) product = dbProd;
    }

    if (!product) {
      product = db.findById('products', product_id) || db.findOne('products', p => p.slug === product_id || p.sku === product_id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existing = db.findOne('wishlists', w => w.user_id === userId && w.product_id === product_id);

    if (existing) {
      db.delete('wishlists', existing.id);
      return res.json({
        success: true,
        action: 'removed',
        message: `Removed "${product.name}" from your wishlist.`,
        is_in_wishlist: false
      });
    } else {
      db.insert('wishlists', {
        user_id: userId,
        product_id
      });
      return res.json({
        success: true,
        action: 'added',
        message: `Added "${product.name}" to your wishlist! 💖`,
        is_in_wishlist: true
      });
    }
  } catch (err) {
    next(err);
  }
};

// Remove from Wishlist
exports.removeFromWishlist = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const item = db.findOne('wishlists', w => w.user_id === userId && (w.product_id === productId || w.id === productId));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in wishlist.' });
    }

    db.delete('wishlists', item.id);
    res.json({
      success: true,
      message: 'Item removed from wishlist.'
    });
  } catch (err) {
    next(err);
  }
};
