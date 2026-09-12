const db = require('../models/db');

// Server-side calculation and stock verification
exports.calculateCheckout = (req, res, next) => {
  try {
    const { items = [], coupon_code = null, shipping_address = null } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for checkout.'
      });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];
    const stockErrors = [];

    for (const reqItem of items) {
      const product = db.findById('products', reqItem.product_id);
      if (!product || product.status !== 'active') {
        stockErrors.push(`Product "${reqItem.product_name || reqItem.product_id}" is currently unavailable.`);
        continue;
      }

      let unitPrice = parseFloat(product.price);
      let availableStock = product.stock;
      let variantInfo = null;

      if (reqItem.variant_id) {
        const variant = db.findById('product_variants', reqItem.variant_id);
        if (variant) {
          unitPrice = parseFloat(variant.price);
          availableStock = variant.stock;
          variantInfo = { size: variant.size, color: variant.color, sku: variant.sku };
        }
      }

      const qty = Math.max(1, parseInt(reqItem.quantity, 10) || 1);
      if (qty > availableStock) {
        stockErrors.push(`Only ${availableStock} units available for "${product.name}".`);
      }

      const itemTotal = unitPrice * qty;
      calculatedSubtotal += itemTotal;

      const images = db.filter('product_images', img => img.product_id === product.id);
      const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url || '';

      validatedItems.push({
        product_id: product.id,
        variant_id: reqItem.variant_id || null,
        product_name: product.name,
        product_image: primaryImage,
        sku: variantInfo?.sku || product.sku,
        variant_info: variantInfo,
        price: unitPrice,
        quantity: qty,
        total: itemTotal,
        stock: availableStock
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock validation failed.',
        errors: stockErrors
      });
    }

    // Free shipping above ₹999 or flat ₹99
    let shippingFee = calculatedSubtotal >= 999 || calculatedSubtotal === 0 ? 0 : 99;

    // Coupon discount calculation on server
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const coupon = db.findOne('coupons', c => c.code.toUpperCase() === coupon_code.toUpperCase().trim());
      if (coupon && coupon.status === 'active' && new Date(coupon.expiry_date) >= new Date()) {
        const minOrder = parseFloat(coupon.minimum_order || 0);
        if (calculatedSubtotal >= minOrder) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (calculatedSubtotal * parseFloat(coupon.discount_value)) / 100;
            if (coupon.maximum_discount && discountAmount > parseFloat(coupon.maximum_discount)) {
              discountAmount = parseFloat(coupon.maximum_discount);
            }
          } else {
            discountAmount = parseFloat(coupon.discount_value);
          }
          discountAmount = Math.min(discountAmount, calculatedSubtotal);
          discountAmount = Math.round(discountAmount * 100) / 100;
          appliedCoupon = coupon.code;
        }
      }
    }

    // 5% standard GST / Tax on discounted subtotal
    const taxableAmount = Math.max(0, calculatedSubtotal - discountAmount);
    const tax = Math.round((taxableAmount * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + shippingFee + tax) * 100) / 100;

    res.json({
      success: true,
      data: {
        items: validatedItems,
        subtotal: Math.round(calculatedSubtotal * 100) / 100,
        discount: discountAmount,
        coupon_code: appliedCoupon,
        shipping_fee: shippingFee,
        tax: tax,
        total: grandTotal,
        currency: 'INR'
      }
    });
  } catch (err) {
    next(err);
  }
};
