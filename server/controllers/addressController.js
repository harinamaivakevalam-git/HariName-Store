const db = require('../models/db');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// List user addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    let addresses = [];

    // Try Supabase 'addresses' table first if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: sbAddrs, error } = await supabaseAdmin
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        if (!error && Array.isArray(sbAddrs) && sbAddrs.length > 0) {
          addresses = sbAddrs;
        }
      } catch (_) {}
    }

    // Fallback / merge with local database
    if (addresses.length === 0) {
      addresses = db.filter('addresses', a => a.user_id === userId || (userEmail && a.email === userEmail))
        .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    }

    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

// Add Address
exports.addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { name, phone, address_line_1, address_line_2, city, state, postal_code, country = 'India', address_type = 'Home', is_default = false } = req.body;

    if (!name || !phone || !address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, address line 1, city, state, and postal code are required.'
      });
    }

    // Enforce maximum 5 addresses limit
    const userAddrs = db.filter('addresses', a => a.user_id === userId || (userEmail && a.email === userEmail));
    if (userAddrs.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum limit of 5 saved addresses. Please remove an existing address to add a new one.'
      });
    }

    // If marked default, unset other defaults
    if (is_default) {
      userAddrs.forEach(a => db.update('addresses', a.id, { is_default: false }));
    }

    // If first address, auto make it default
    const count = userAddrs.length;
    const shouldBeDefault = is_default || count === 0;

    const newAddressData = {
      user_id: userId,
      email: userEmail,
      name: name.trim(),
      phone: phone.trim(),
      address_line_1: address_line_1.trim(),
      address_line_2: (address_line_2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postal_code.trim(),
      country: country.trim(),
      address_type,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newAddress = db.insert('addresses', newAddressData);

    // Sync to Supabase table & user metadata if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        if (shouldBeDefault) {
          await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', userId);
        }
        await supabaseAdmin.from('addresses').insert({
          id: newAddress.id,
          ...newAddressData
        });
      } catch (_) {}
    }

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
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const existing = db.findOne('addresses', a => String(a.id) === String(id) && (a.user_id === userId || (userEmail && a.email === userEmail)));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    if (req.body.is_default) {
      const userAddrs = db.filter('addresses', a => a.user_id === userId || (userEmail && a.email === userEmail));
      userAddrs.forEach(a => db.update('addresses', a.id, { is_default: false }));
    }

    const updated = db.update('addresses', existing.id, {
      ...req.body,
      updated_at: new Date().toISOString()
    });

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        if (req.body.is_default) {
          await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', userId);
        }
        await supabaseAdmin.from('addresses').update(req.body).eq('id', id);
      } catch (_) {}
    }

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
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const existing = db.findOne('addresses', a => String(a.id) === String(id) && (a.user_id === userId || (userEmail && a.email === userEmail)));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    db.delete('addresses', existing.id);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('addresses').delete().eq('id', id);
      } catch (_) {}
    }

    res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
