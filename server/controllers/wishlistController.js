const db = require('../models/db');

// Helper to hydrate product for wishlist
const hydrateProductBasic = (product) => {
  const images = db.filter('product_images', img => img.product_id === product.id);
  const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || '';
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_price: product.compare_price,
    image: primaryImage,
    stock: product.stock,
    rating: product.rating,
    in_stock: product.stock > 0
  };
};

// Get User's Wishlist
exports.getWishlist = (req, res, next) => {
  try {
    const userId = req.user.id;
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
exports.toggleWishlist = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = db.findById('products', product_id);
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
