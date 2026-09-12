const db = require('../models/db');

// List user addresses
exports.getAddresses = (req, res, next) => {
  try {
    const addresses = db.filter('addresses', a => a.user_id === req.user.id)
      .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

// Add Address
exports.addAddress = (req, res, next) => {
  try {
    const { name, phone, address_line_1, address_line_2, city, state, postal_code, country = 'India', address_type = 'Home', is_default = false } = req.body;

    if (!name || !phone || !address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, address line 1, city, state, and postal code are required.'
      });
    }

    // If marked default, unset other defaults
    if (is_default) {
      const userAddrs = db.filter('addresses', a => a.user_id === req.user.id);
      userAddrs.forEach(a => db.update('addresses', a.id, { is_default: false }));
    }

    // If first address, auto make it default
    const count = db.filter('addresses', a => a.user_id === req.user.id).length;
    const shouldBeDefault = is_default || count === 0;

    const newAddress = db.insert('addresses', {
      user_id: req.user.id,
      name: name.trim(),
      phone: phone.trim(),
      address_line_1: address_line_1.trim(),
      address_line_2: (address_line_2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postal_code.trim(),
      country: country.trim(),
      address_type,
      is_default: shouldBeDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      data: newAddress
    });
  } catch (err) {
    next(err);
  }
};

// Update Address
exports.updateAddress = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.findOne('addresses', a => a.id === id && a.user_id === req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    if (req.body.is_default) {
      const userAddrs = db.filter('addresses', a => a.user_id === req.user.id);
      userAddrs.forEach(a => db.update('addresses', a.id, { is_default: false }));
    }

    const updated = db.update('addresses', id, req.body);
    res.json({
      success: true,
      message: 'Address updated.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Delete Address
exports.deleteAddress = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.findOne('addresses', a => a.id === id && a.user_id === req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    db.delete('addresses', id);
    res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
