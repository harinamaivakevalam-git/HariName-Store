const db = require('../models/db');

// Validate and Calculate Coupon Discount
exports.validateCoupon = (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = db.findOne('coupons', c => c.code.toUpperCase() === code.toUpperCase().trim());

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    if (coupon.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
    }

    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    const orderSubtotal = parseFloat(subtotal);
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
exports.getCoupons = (req, res, next) => {
  try {
    const coupons = db.findAll('coupons').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

// Admin: Create Coupon
exports.createCoupon = (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, usage_limit } = req.body;

    if (!code || !discount_type || discount_value === undefined || !expiry_date) {
      return res.status(400).json({ success: false, message: 'Code, type, value, and expiry date are required.' });
    }

    const existing = db.findOne('coupons', c => c.code.toUpperCase() === code.toUpperCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    const newCoupon = db.insert('coupons', {
      code: code.toUpperCase().trim(),
      description: description || '',
      discount_type,
      discount_value: parseFloat(discount_value),
      minimum_order: minimum_order ? parseFloat(minimum_order) : 0,
      maximum_discount: maximum_discount ? parseFloat(maximum_discount) : null,
      expiry_date: new Date(expiry_date).toISOString(),
      usage_limit: usage_limit ? parseInt(usage_limit, 10) : 100,
      times_used: 0,
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Coupon created.', data: newCoupon });
  } catch (err) {
    next(err);
  }
};

// Admin: Update Coupon
exports.updateCoupon = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = db.update('coupons', id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete Coupon
exports.deleteCoupon = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = db.delete('coupons', id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
};
