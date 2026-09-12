const db = require('../models/db');

exports.getBrands = (req, res, next) => {
  try {
    const brands = db.findAll('brands').filter(b => b.status === 'active');
    res.json({ success: true, data: brands });
  } catch (err) {
    next(err);
  }
};

exports.createBrand = (req, res, next) => {
  try {
    const { name, logo, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Brand name is required.' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const brand = db.insert('brands', { name, slug, logo: logo || '', description: description || '', status: 'active' });
    res.status(201).json({ success: true, message: 'Brand created successfully.', data: brand });
  } catch (err) {
    next(err);
  }
};

exports.updateBrand = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = db.update('brands', id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Brand not found.' });
    res.json({ success: true, message: 'Brand updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteBrand = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = db.delete('brands', id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Brand not found.' });
    res.json({ success: true, message: 'Brand deleted.' });
  } catch (err) {
    next(err);
  }
};
