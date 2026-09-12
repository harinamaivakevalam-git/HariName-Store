const db = require('../models/db');

// Get Reviews for Product
exports.getProductReviews = (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = db.filter('reviews', r => r.product_id === productId && r.status === 'approved')
      .map(r => {
        const user = db.findById('users', r.user_id);
        return {
          ...r,
          user_name: user ? user.name : 'Customer',
          user_avatar: user ? user.avatar : null
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// Create Product Review
exports.createReview = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, title, comment } = req.body;

    if (!product_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating (1-5), and review text are required.'
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const product = db.findById('products', product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user already reviewed
    const existing = db.findOne('reviews', r => r.user_id === userId && r.product_id === product_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.'
      });
    }

    // Check if user has purchased this product (Verified Purchase Check)
    const userOrders = db.filter('orders', o => o.user_id === userId && o.order_status !== 'cancelled');
    const orderIds = userOrders.map(o => o.id);
    const hasPurchased = db.findOne('order_items', oi => orderIds.includes(oi.order_id) && oi.product_id === product_id);

    const newReview = db.insert('reviews', {
      product_id,
      user_id: userId,
      rating: ratingNum,
      title: (title || '').trim(),
      comment: comment.trim(),
      is_verified_purchase: Boolean(hasPurchased),
      status: 'approved' // Auto-approved by default
    });

    // Recalculate average product rating
    const allApproved = db.filter('reviews', r => r.product_id === product_id && r.status === 'approved');
    const avgRating = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;

    db.update('products', product_id, {
      rating: Math.round(avgRating * 10) / 10,
      reviews_count: allApproved.length
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      data: newReview
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all reviews
exports.adminGetReviews = (req, res, next) => {
  try {
    const reviews = db.findAll('reviews').map(r => {
      const product = db.findById('products', r.product_id);
      const user = db.findById('users', r.user_id);
      return {
        ...r,
        product_name: product ? product.name : 'Unknown Product',
        user_name: user ? user.name : 'Customer',
        user_email: user ? user.email : ''
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// Admin: Moderate review status
exports.adminModerateReview = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }

    const updated = db.update('reviews', id, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Review not found.' });

    // Recalculate product rating
    const allApproved = db.filter('reviews', r => r.product_id === updated.product_id && r.status === 'approved');
    const avgRating = allApproved.length > 0
      ? allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length
      : 5.0;

    db.update('products', updated.product_id, {
      rating: Math.round(avgRating * 10) / 10,
      reviews_count: allApproved.length
    });

    res.json({ success: true, message: `Review status updated to ${status}.`, data: updated });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete review
exports.adminDeleteReview = (req, res, next) => {
  try {
    const { id } = req.params;
    const review = db.findById('reviews', id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    db.delete('reviews', id);

    // Recalculate product rating
    const allApproved = db.filter('reviews', r => r.product_id === review.product_id && r.status === 'approved');
    const avgRating = allApproved.length > 0
      ? allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length
      : 5.0;

    db.update('products', review.product_id, {
      rating: Math.round(avgRating * 10) / 10,
      reviews_count: allApproved.length
    });

    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
