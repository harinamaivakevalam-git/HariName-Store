const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

exports.getCategories = async (req, res, next) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(id, status)')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        const categories = data.map(c => {
          const productCount = (c.products || []).filter(p => p.status === 'active').length;
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image: c.image_url || c.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            image_url: c.image_url || c.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            status: c.status,
            sort_order: c.sort_order || 0,
            product_count: productCount
          };
        });

        return res.json({
          success: true,
          data: categories
        });
      }
    }

    // Fallback to local db
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

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (isSupabaseConfigured && supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let query = supabase.from('categories').select('*, products(id, status)');
      if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        query = query.eq('slug', slug);
      }
      const { data, error } = await query.single();

      if (!error && data) {
        const productCount = (data.products || []).filter(p => p.status === 'active').length;
        return res.json({
          success: true,
          data: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            image: data.image_url || data.image,
            image_url: data.image_url || data.image,
            status: data.status,
            sort_order: data.sort_order || 0,
            product_count: productCount
          }
        });
      }
    }

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

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, image_url, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }
    let slug = (req.body.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;

      // Check if slug exists
      const { data: existing } = await client.from('categories').select('id').eq('slug', slug).maybeSingle();
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const { data, error } = await client
        .from('categories')
        .insert({
          name,
          slug,
          description: description || '',
          image_url: image_url || image || '/assets/images/cat_keychains.jpg',
          status: 'active',
          sort_order: parseInt(sort_order, 10) || 0
        })
        .select()
        .single();

      if (!error && data) {
        // Also sync to local db
        db.insert('categories', data);
        return res.status(201).json({
          success: true,
          message: 'Category created successfully in Supabase.',
          data
        });
      } else if (error) {
        console.warn('[categoryController] Supabase insert note:', error.message);
      }
    }

    let existingSlug = db.findOne('categories', c => c.slug === slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = db.insert('categories', {
      name,
      slug,
      description: description || '',
      image: image || image_url || '/assets/images/cat_keychains.jpg',
      image_url: image || image_url || '/assets/images/cat_keychains.jpg',
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

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let targetId = null;

      if (isUuid) {
        targetId = id;
      } else {
        const { data: rec } = await client.from('categories').select('id').eq('slug', id).maybeSingle();
        if (rec) targetId = rec.id;
      }

      if (targetId) {
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        delete updates.id;
        delete updates.products;
        if (updates.image && !updates.image_url) {
          updates.image_url = updates.image;
        }

        const { data, error } = await client
          .from('categories')
          .update(updates)
          .eq('id', targetId)
          .select()
          .single();

        if (!error && data) {
          return res.json({ success: true, message: 'Category updated in Supabase.', data });
        }
      }
    }

    const updated = db.update('categories', id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let targetId = null;

      if (isUuid) {
        targetId = id;
      } else {
        const { data: rec } = await client.from('categories').select('id').eq('slug', id).maybeSingle();
        if (rec) targetId = rec.id;
      }

      if (targetId) {
        // 1. Unlink any products currently referencing this category to prevent foreign key errors
        try {
          await client.from('products').update({ category_id: null }).eq('category_id', targetId);
        } catch (unlinkErr) {
          console.warn('[categoryController] Product unlinking notice:', unlinkErr);
        }

        // 2. Delete the category record
        const { error } = await client.from('categories').delete().eq('id', targetId);
        if (!error) {
          db.delete('categories', targetId);
          db.delete('categories', id);
          return res.json({ success: true, message: 'Category deleted successfully from database.' });
        } else {
          console.error('[categoryController] Supabase delete error:', error);
          return res.status(400).json({ success: false, message: error.message });
        }
      }
    }

    const deleted = db.delete('categories', id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
};
