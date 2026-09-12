const db = require('../models/db');

exports.getCategories = (req, res, next) => {
  try {
    const categories = db.findAll('categories')
      .filter(c => c.status === 'active')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => {
        const productCount = db.filter('products', p => p.category_id === c.id && p.status === 'active').length;
        return { ...c, product_count: productCount };
      });

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryBySlug = (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = db.findOne('categories', c => c.slug === slug || c.id === slug);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    const productCount = db.filter('products', p => p.category_id === category.id && p.status === 'active').length;
    res.json({
      success: true,
      data: { ...category, product_count: productCount }
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = (req, res, next) => {
  try {
    const { name, description, image, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCategory = db.insert('categories', {
      name,
      slug,
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      sort_order: parseInt(sort_order, 10) || 0
    });
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = db.update('categories', id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = db.delete('categories', id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
};
