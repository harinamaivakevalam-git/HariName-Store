const db = require('../models/db');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Helper to resolve product ID (handles Supabase UUID, prod-xxx IDs, and slugs)
const resolveProductId = async (identifier) => {
  if (!identifier) return null;

  if (isSupabaseConfigured && supabaseAdmin) {
    // Check if valid UUID or lookup by slug or id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let query = supabaseAdmin.from('products').select('id, name, rating, reviews_count');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.or(`slug.eq.${identifier},sku.eq.${identifier}`);
    }
    const { data: prod } = await query.maybeSingle();
    if (prod) return prod;
  }

  // Fallback to local memory db
  const localProd = db.findById('products', identifier) || db.findOne('products', p => p.slug === identifier);
  return localProd || null;
};

// Get Reviews for Product
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (isSupabaseConfigured && supabaseAdmin) {
      const prod = await resolveProductId(productId);
      const targetId = prod ? prod.id : productId;

      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, status, created_at, profiles:user_id(name, avatar_url)')
        .eq('product_id', targetId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && reviews && reviews.length > 0) {
        const formatted = reviews.map(r => ({
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          is_verified_purchase: r.is_verified_purchase,
          created_at: r.created_at,
          user_name: r.profiles?.name || 'Devotee Customer',
          user_avatar: r.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
        }));
        return res.json({ success: true, data: formatted });
      }
    }

    // Local DB fallback
    const reviews = db.filter('reviews', r => (r.product_id === productId || r.product_id === 'prod-001') && r.status === 'approved')
      .map(r => {
        const user = db.findById('users', r.user_id);
        return {
          ...r,
          user_name: user ? user.name : 'Devotee Customer',
          user_avatar: user ? user.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// Create Product Review
exports.createReview = async (req, res, next) => {
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

    if (isSupabaseConfigured && supabaseAdmin) {
      const prod = await resolveProductId(product_id);
      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      // Check if user already reviewed this product
      const { data: existing } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('product_id', prod.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a review for this product.'
        });
      }

      // Insert new review into Supabase
      const { data: newReview, error: insertErr } = await supabaseAdmin
        .from('reviews')
        .insert({
          product_id: prod.id,
          user_id: userId,
          rating: ratingNum,
          title: (title || '').trim(),
          comment: comment.trim(),
          is_verified_purchase: true,
          status: 'approved'
        })
        .select('*, profiles:user_id(name, avatar_url)')
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      // Recalculate average product rating and update products table
      const { data: allApproved } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('product_id', prod.id)
        .eq('status', 'approved');

      if (allApproved && allApproved.length > 0) {
        const avg = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;
        await supabaseAdmin
          .from('products')
          .update({
            rating: Math.round(avg * 10) / 10,
            reviews_count: allApproved.length
          })
          .eq('id', prod.id);
      }

      // Also mirror to memory db
      db.insert('reviews', {
        product_id: prod.id,
        user_id: userId,
        rating: ratingNum,
        title: (title || '').trim(),
        comment: comment.trim(),
        is_verified_purchase: true,
        status: 'approved'
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your sacred review has been published. 🌸',
        data: {
          ...newReview,
          user_name: newReview.profiles?.name || req.user.name || 'Devotee Customer',
          user_avatar: newReview.profiles?.avatar_url || req.user.avatar || null
        }
      });
    }

    // Local DB fallback
    const product = db.findById('products', product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existing = db.findOne('reviews', r => r.user_id === userId && r.product_id === product_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.'
      });
    }

    const newReview = db.insert('reviews', {
      product_id,
      user_id: userId,
      rating: ratingNum,
      title: (title || '').trim(),
      comment: comment.trim(),
      is_verified_purchase: true,
      status: 'approved'
    });

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
exports.adminGetReviews = async (req, res, next) => {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, status, created_at, products(name), profiles:user_id(name, email)')
        .order('created_at', { ascending: false });

      if (!error && reviews) {
        const formatted = reviews.map(r => ({
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          status: r.status,
          created_at: r.created_at,
          product_name: r.products?.name || 'Devotional Product',
          user_name: r.profiles?.name || 'Customer',
          user_email: r.profiles?.email || ''
        }));
        return res.json({ success: true, data: formatted });
      }
    }

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
exports.adminModerateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        return res.json({ success: true, message: `Review status updated to ${status}.`, data: updated });
      }
    }

    const updated = db.update('reviews', id, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Review not found.' });

    res.json({ success: true, message: `Review status updated to ${status}.`, data: updated });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete review
exports.adminDeleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id);
      if (!error) {
        return res.json({ success: true, message: 'Review deleted successfully.' });
      }
    }

    const review = db.findById('reviews', id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    db.delete('reviews', id);
    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
