const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

// Validate and Calculate Coupon Discount
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    let coupon = null;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('coupons')
          .select('*')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (!error && data) {
          coupon = data;
        }
      } catch (sbErr) {
        console.warn('[couponController] Supabase coupon fetch fallback:', sbErr.message);
      }
    }

    if (!coupon) {
      coupon = db.findOne('coupons', c => c.code.toUpperCase() === cleanCode);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    if (coupon.status && coupon.status.toLowerCase() !== 'active') {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    const orderSubtotal = parseFloat(subtotal) || 0;
    if (coupon.minimum_order && orderSubtotal < parseFloat(coupon.minimum_order)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minimum_order} required for coupon ${coupon.code}.`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderSubtotal * parseFloat(coupon.discount_value)) / 100;
      if (coupon.maximum_discount && discountAmount > parseFloat(coupon.maximum_discount)) {
        discountAmount = parseFloat(coupon.maximum_discount);
      }
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    discountAmount = Math.min(discountAmount, orderSubtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You save ₹${discountAmount}.`,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        description: coupon.description
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all coupons
exports.getCoupons = async (req, res, next) => {
  try {
    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client.from('coupons').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, data });
      }
    }

    const coupons = db.findAll('coupons').sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

// Admin: Create Coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, usage_limit, times_used, status } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, type, and value are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const usedCount = parseInt(times_used, 10) || 0;
    const limitVal = usage_limit !== undefined && usage_limit !== '' && usage_limit !== null ? parseInt(usage_limit, 10) : 100;
    const cpnStatus = status ? status.toLowerCase().trim() : 'active';
    const expiryIso = expiry_date ? new Date(expiry_date).toISOString() : new Date(Date.now() + 365*24*3600*1000).toISOString();

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const { data: newCoupon, error } = await client
        .from('coupons')
        .upsert({
          code: cleanCode,
          description: description || '',
          discount_type,
          discount_value: parseFloat(discount_value),
          minimum_order: minimum_order ? parseFloat(minimum_order) : 0,
          maximum_discount: maximum_discount ? parseFloat(maximum_discount) : null,
          expiry_date: expiryIso,
          usage_limit: limitVal,
          times_used: usedCount,
          status: cpnStatus
        }, { onConflict: 'code' })
        .select()
        .single();

      if (!error && newCoupon) {
        // Also update local db
        db.insert('coupons', newCoupon);
        return res.status(201).json({ success: true, message: 'Coupon created in Supabase.', data: newCoupon });
      } else if (error) {
        console.error('[couponController] Supabase insert error:', error);
      }
    }

    const existing = db.findOne('coupons', c => c.code.toUpperCase() === cleanCode);
    if (existing) {
      const updated = db.update('coupons', existing.id, {
        description: description || '',
        discount_type,
        discount_value: parseFloat(discount_value),
        minimum_order: minimum_order ? parseFloat(minimum_order) : 0,
        maximum_discount: maximum_discount ? parseFloat(maximum_discount) : null,
        expiry_date: expiryIso,
        usage_limit: limitVal,
        times_used: usedCount,
        status: cpnStatus
      });
      return res.status(200).json({ success: true, message: 'Coupon updated.', data: updated });
    }

    const newCoupon = db.insert('coupons', {
      code: cleanCode,
      description: description || '',
      discount_type,
      discount_value: parseFloat(discount_value),
      minimum_order: minimum_order ? parseFloat(minimum_order) : 0,
      maximum_discount: maximum_discount ? parseFloat(maximum_discount) : null,
      expiry_date: expiryIso,
      usage_limit: limitVal,
      times_used: usedCount,
      status: cpnStatus
    });

    res.status(201).json({ success: true, message: 'Coupon created.', data: newCoupon });
  } catch (err) {
    next(err);
  }
};

// Admin: Update Coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const cleanPayload = {};
    if (payload.times_used !== undefined) cleanPayload.times_used = parseInt(payload.times_used, 10) || 0;
    if (payload.usage_limit !== undefined && payload.usage_limit !== '') {
      cleanPayload.usage_limit = parseInt(payload.usage_limit, 10) || null;
    }
    if (payload.discount_value !== undefined) cleanPayload.discount_value = parseFloat(payload.discount_value);
    if (payload.minimum_order !== undefined) cleanPayload.minimum_order = parseFloat(payload.minimum_order) || 0;
    if (payload.maximum_discount !== undefined) cleanPayload.maximum_discount = parseFloat(payload.maximum_discount) || null;
    if (payload.discount_type) cleanPayload.discount_type = payload.discount_type;
    if (payload.description !== undefined) cleanPayload.description = payload.description;
    if (payload.code) cleanPayload.code = payload.code.toUpperCase().trim();
    if (payload.status) cleanPayload.status = payload.status.toLowerCase().trim();
    if (payload.expiry_date) cleanPayload.expiry_date = new Date(payload.expiry_date).toISOString();

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      let data = null;
      let error = null;

      // 1. Try updating by ID if it's a UUID
      if (id && id.length > 20) {
        const resById = await client
          .from('coupons')
          .update(cleanPayload)
          .eq('id', id)
          .select();
        data = resById.data;
        error = resById.error;
      }

      // 2. If no matching ID, try updating by code
      if ((!data || data.length === 0) && cleanPayload.code) {
        const resByCode = await client
          .from('coupons')
          .update(cleanPayload)
          .eq('code', cleanPayload.code)
          .select();
        data = resByCode.data;
        error = resByCode.error;
      }

      // 3. If still not in Supabase, upsert by code
      if ((!data || data.length === 0) && cleanPayload.code) {
        const resUpsert = await client
          .from('coupons')
          .upsert({ ...cleanPayload }, { onConflict: 'code' })
          .select();
        data = resUpsert.data;
        error = resUpsert.error;
      }

      if (!error && data && data.length > 0) {
        return res.json({ success: true, message: 'Coupon updated in Supabase.', data: data[0] });
      }
    }

    const updated = db.update('coupons', id, cleanPayload) || (cleanPayload.code ? db.findOne('coupons', c => c.code.toUpperCase() === cleanPayload.code) : null);
    if (!updated && cleanPayload.code) {
      const created = db.insert('coupons', { id, ...cleanPayload });
      return res.json({ success: true, message: 'Coupon created.', data: created });
    }
    if (!updated) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete Coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      if (id && id.length > 20) {
        await client.from('coupons').delete().eq('id', id);
      }
      // Also delete by code if id might be a code or slug
      await client.from('coupons').delete().eq('code', id.toUpperCase().trim());
      return res.json({ success: true, message: 'Coupon deleted from Supabase.' });
    }

    const deleted = db.delete('coupons', id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
};
