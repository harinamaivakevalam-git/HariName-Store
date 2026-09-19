const db = require('../models/db');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Helper to resolve product ID (handles Supabase UUID, prod-xxx IDs, and slugs)
const resolveProductId = async (identifier) => {
  if (!identifier) return null;

  if (isSupabaseConfigured && supabaseAdmin) {
    // Check if valid UUID or lookup by slug, sku, or name
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      const { data: prod } = await supabaseAdmin.from('products').select('id, name, rating, reviews_count').eq('id', identifier).maybeSingle();
      if (prod) return prod;
    } else {
      const { data: prod } = await supabaseAdmin.from('products').select('id, name, rating, reviews_count').or(`slug.eq.${identifier},sku.eq.${identifier}`).maybeSingle();
      if (prod) return prod;

      const { data: fuzzyProd } = await supabaseAdmin.from('products').select('id, name, rating, reviews_count').ilike('name', `%${identifier}%`).maybeSingle();
      if (fuzzyProd) return fuzzyProd;
    }

    // Default to first active catalog product
    const { data: defaultProd } = await supabaseAdmin.from('products').select('id, name, rating, reviews_count').neq('id', '00000000-0000-0000-0000-000000000000').limit(1).maybeSingle();
    if (defaultProd) return defaultProd;
  }

  // Fallback to local memory db
  const localProd = db.findById('products', identifier) || db.findOne('products', p => p.slug === identifier) || db.findAll('products')[0];
  return localProd || null;
};

// Get Recent Approved Reviews (Storefront / Homepage)
exports.getRecentReviews = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, status, created_at, products(name), profiles:user_id(name, avatar_url)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

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
          product_name: r.products?.name || 'Devotional Product',
          user_name: r.profiles?.name || 'Devotee Customer',
          user_avatar: r.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
        }));
        return res.json({ success: true, data: formatted });
      }
    }

    // Local DB fallback
    const reviews = db.filter('reviews', r => r.status === 'approved')
      .map(r => {
        const product = db.findById('products', r.product_id);
        const user = db.findById('users', r.user_id);
        return {
          ...r,
          product_name: product ? product.name : 'Devotional Product',
          user_name: user ? user.name : 'Devotee Customer',
          user_avatar: user ? user.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
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
    const { product_id, rating, title, comment, user_name, user_email } = req.body;

    if (!product_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating (1-5), and review text are required.'
      });
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const reviewerName = (req.user && req.user.name) || user_name || 'Devotee Customer';
    const reviewerEmail = (req.user && req.user.email) || user_email || 'devotee@harinama.com';

    if (isSupabaseConfigured && supabaseAdmin) {
      const prod = await resolveProductId(product_id);
      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      // Resolve a valid user_id foreign key in profiles table
      let validUserId = null;
      const candidateId = req.user?.id;
      if (candidateId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateId)) {
        const { data: profExists } = await supabaseAdmin.from('profiles').select('id').eq('id', candidateId).maybeSingle();
        if (profExists) {
          validUserId = candidateId;
        } else {
          const { data: newProf } = await supabaseAdmin.from('profiles').insert({
            id: candidateId,
            name: reviewerName,
            email: reviewerEmail,
            role: 'customer'
          }).select('id').maybeSingle();
          if (newProf) validUserId = newProf.id;
        }
      }

      if (!validUserId) {
        // Try finding profile by email
        const { data: profByEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', reviewerEmail.toLowerCase().trim()).maybeSingle();
        if (profByEmail) {
          validUserId = profByEmail.id;
        } else {
          // Use default existing profile or create one
          const { data: fallbackProf } = await supabaseAdmin.from('profiles').select('id').limit(1).maybeSingle();
          validUserId = fallbackProf ? fallbackProf.id : null;
        }
      }

      let newReview = null;
      if (validUserId && prod.id) {
        // Check if user already reviewed this product
        const { data: existing } = await supabaseAdmin
          .from('reviews')
          .select('id')
          .eq('product_id', prod.id)
          .eq('user_id', validUserId)
          .maybeSingle();

        if (existing) {
          // Update existing review
          const { data: updData } = await supabaseAdmin
            .from('reviews')
            .update({
              rating: ratingNum,
              title: (title || '').trim(),
              comment: comment.trim(),
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select('*, profiles:user_id(name, avatar_url)')
            .maybeSingle();
          newReview = updData;
        } else {
          // Insert new review
          const { data: insData, error: insErr } = await supabaseAdmin
            .from('reviews')
            .insert({
              product_id: prod.id,
              user_id: validUserId,
              rating: ratingNum,
              title: (title || '').trim(),
              comment: comment.trim(),
              is_verified_purchase: true,
              status: 'approved'
            })
            .select('*, profiles:user_id(name, avatar_url)')
            .maybeSingle();

          if (!insErr && insData) {
            newReview = insData;
          }
        }

        // Recalculate average product rating and update products table
        try {
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
        } catch (_) {}
      }

      // Mirror in local memory db
      const localReview = db.insert('reviews', {
        product_id: prod.id,
        user_id: validUserId || 'devotee-customer',
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
          ...(newReview || localReview),
          user_name: newReview?.profiles?.name || reviewerName,
          user_avatar: newReview?.profiles?.avatar_url || null
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

// Admin: Create new review directly
exports.adminCreateReview = async (req, res, next) => {
  try {
    const { product_id, user_name, user_email, rating, title, comment, status, is_verified_purchase } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating (1-5) and review comment are required.' });
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const revStatus = ['approved', 'rejected', 'pending'].includes(status) ? status : 'approved';
    const isVerified = is_verified_purchase !== false;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Find or pick a product
      let targetProductId = product_id;
      if (!targetProductId) {
        const { data: anyProd } = await supabaseAdmin.from('products').select('id').limit(1).maybeSingle();
        targetProductId = anyProd ? anyProd.id : null;
      }

      // Find or pick a user profile
      let targetUserId = null;
      if (user_email) {
        const { data: userByEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', user_email.trim().toLowerCase()).maybeSingle();
        if (userByEmail) targetUserId = userByEmail.id;
      }
      if (!targetUserId) {
        const { data: anyUser } = await supabaseAdmin.from('profiles').select('id').limit(1).maybeSingle();
        targetUserId = anyUser ? anyUser.id : 'bd9001e6-f87f-4087-a17a-d7453e7f1b05';
      }

      if (targetProductId && targetUserId) {
        const { data: newRev, error: insertErr } = await supabaseAdmin
          .from('reviews')
          .insert({
            product_id: targetProductId,
            user_id: targetUserId,
            rating: ratingNum,
            title: (title || user_name || 'Heartfelt Review').trim(),
            comment: comment.trim(),
            status: revStatus,
            is_verified_purchase: isVerified
          })
          .select('*, products(name), profiles:user_id(name, email)')
          .single();

        if (!insertErr && newRev) {
          // Recalculate product rating
          try {
            const { data: allApproved } = await supabaseAdmin
              .from('reviews')
              .select('rating')
              .eq('product_id', targetProductId)
              .eq('status', 'approved');

            if (allApproved && allApproved.length > 0) {
              const avg = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;
              await supabaseAdmin.from('products').update({
                rating: Math.round(avg * 10) / 10,
                reviews_count: allApproved.length
              }).eq('id', targetProductId);
            }
          } catch (recalcErr) {}

          return res.status(201).json({
            success: true,
            message: 'Devotee review added successfully.',
            data: {
              id: newRev.id,
              product_id: newRev.product_id,
              user_id: newRev.user_id,
              rating: newRev.rating,
              title: newRev.title,
              comment: newRev.comment,
              status: newRev.status,
              created_at: newRev.created_at,
              product_name: newRev.products?.name || 'Devotional Product',
              user_name: user_name || newRev.profiles?.name || 'Devotee Customer',
              user_email: user_email || newRev.profiles?.email || ''
            }
          });
        }
      }
    }

    // Local DB fallback
    const localReview = db.insert('reviews', {
      product_id: product_id || 'prod-001',
      user_id: 'admin-authorized-session',
      rating: ratingNum,
      title: (title || user_name || 'Devotee Review').trim(),
      comment: comment.trim(),
      status: revStatus,
      is_verified_purchase: isVerified
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data: {
        ...localReview,
        product_name: 'Devotional Product',
        user_name: user_name || 'Devotee Customer',
        user_email: user_email || ''
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update review details
exports.adminUpdateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, status } = req.body;

    const updates = {};
    if (rating !== undefined) updates.rating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    if (title !== undefined) updates.title = title.trim();
    if (comment !== undefined) updates.comment = comment.trim();
    if (status !== undefined && ['approved', 'rejected', 'pending'].includes(status)) updates.status = status;
    updates.updated_at = new Date().toISOString();

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select('*, products(name), profiles:user_id(name, email)')
        .single();

      if (!error && updated) {
        return res.json({
          success: true,
          message: 'Review updated successfully.',
          data: {
            id: updated.id,
            product_id: updated.product_id,
            user_id: updated.user_id,
            rating: updated.rating,
            title: updated.title,
            comment: updated.comment,
            status: updated.status,
            created_at: updated.created_at,
            product_name: updated.products?.name || 'Devotional Product',
            user_name: updated.profiles?.name || 'Devotee Customer',
            user_email: updated.profiles?.email || ''
          }
        });
      }
    }

    const localUpdated = db.update('reviews', id, updates);
    if (!localUpdated) return res.status(404).json({ success: false, message: 'Review not found.' });

    res.json({ success: true, message: 'Review updated successfully.', data: localUpdated });
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
        // Recalculate product rating
        if (updated.product_id) {
          try {
            const { data: allApproved } = await supabaseAdmin
              .from('reviews')
              .select('rating')
              .eq('product_id', updated.product_id)
              .eq('status', 'approved');

            if (allApproved && allApproved.length > 0) {
              const avg = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;
              await supabaseAdmin.from('products').update({
                rating: Math.round(avg * 10) / 10,
                reviews_count: allApproved.length
              }).eq('id', updated.product_id);
            }
          } catch (e) {}
        }

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
      const { data: existing } = await supabaseAdmin.from('reviews').select('product_id').eq('id', id).maybeSingle();
      const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id);
      if (!error) {
        if (existing?.product_id) {
          try {
            const { data: allApproved } = await supabaseAdmin
              .from('reviews')
              .select('rating')
              .eq('product_id', existing.product_id)
              .eq('status', 'approved');

            const avg = allApproved && allApproved.length > 0
              ? allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length
              : 5.0;
            const count = allApproved ? allApproved.length : 0;

            await supabaseAdmin.from('products').update({
              rating: Math.round(avg * 10) / 10,
              reviews_count: count
            }).eq('id', existing.product_id);
          } catch (e) {}
        }
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

