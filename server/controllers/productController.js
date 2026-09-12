const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// Helper to hydrate product with primary image and extra fields
const hydrateProduct = (product) => {
  const images = db.filter('product_images', img => img.product_id === product.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  const variants = db.filter('product_variants', v => v.product_id === product.id);
  const category = db.findById('categories', product.category_id);
  const brand = db.findById('brands', product.brand_id);

  const primaryImage = images.find(img => img.is_primary)?.image_url || 
    images[0]?.image_url || 
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  
  const secondaryImage = images.find(img => !img.is_primary)?.image_url || primaryImage;

  // Calculate discount percentage
  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return {
    ...product,
    primary_image: primaryImage,
    secondary_image: secondaryImage,
    images,
    variants,
    category_name: category ? category.name : 'General',
    category_slug: category ? category.slug : '',
    brand_name: brand ? brand.name : 'HariNama Crafts',
    brand_slug: brand ? brand.slug : '',
    discount_percent: discountPercent,
    in_stock: product.stock > 0
  };
};

// Get Filtered & Paginated Products
exports.getProducts = (req, res, next) => {
  try {
    let products = db.findAll('products');

    const {
      category,
      brand,
      min_price,
      max_price,
      rating,
      in_stock,
      has_discount,
      featured,
      trending,
      search,
      sort = 'featured',
      page = 1,
      limit = 12
    } = req.query;

    // Filter by Status (unless admin requesting)
    if (!req.user || req.user.role !== 'admin') {
      products = products.filter(p => p.status === 'active');
    }

    // Filter by Category
    if (category) {
      const cat = db.findOne('categories', c => c.slug === category || c.id === category);
      if (cat) {
        products = products.filter(p => p.category_id === cat.id);
      }
    }

    // Filter by Brand
    if (brand) {
      const br = db.findOne('brands', b => b.slug === brand || b.id === brand);
      if (br) {
        products = products.filter(p => p.brand_id === br.id);
      }
    }

    // Filter by Price Range
    if (min_price) {
      products = products.filter(p => Number(p.price) >= Number(min_price));
    }
    if (max_price) {
      products = products.filter(p => Number(p.price) <= Number(max_price));
    }

    // Filter by Rating
    if (rating) {
      products = products.filter(p => Number(p.rating) >= Number(rating));
    }

    // Filter by Stock
    if (in_stock === 'true' || in_stock === true) {
      products = products.filter(p => p.stock > 0);
    }

    // Filter by Discount
    if (has_discount === 'true') {
      products = products.filter(p => p.compare_price && p.compare_price > p.price);
    }

    // Filter by Featured
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }

    // Filter by Trending
    if (trending === 'true') {
      products = products.filter(p => p.trending);
    }

    // Search Query (name, description, tags, sku)
    if (search) {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    switch (sort) {
      case 'newest':
        products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'price-asc':
        products.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        products.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating':
        products.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'popular':
        products.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        break;
      case 'featured':
      default:
        products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    // Pagination
    const total = products.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIndex, startIndex + limitNum).map(hydrateProduct);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data: paginatedProducts
    });
  } catch (err) {
    next(err);
  }
};

// Get Product by Slug or ID
exports.getProductBySlug = (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = db.findOne('products', p => p.slug === slug || p.id === slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const hydrated = hydrateProduct(product);
    const reviews = db.filter('reviews', r => r.product_id === product.id && r.status === 'approved')
      .map(r => {
        const user = db.findById('users', r.user_id);
        return {
          ...r,
          user_name: user ? user.name : 'Devotee Customer',
          user_avatar: user ? user.avatar : null
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: {
        ...hydrated,
        reviews
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Featured Products
exports.getFeaturedProducts = (req, res, next) => {
  try {
    const products = db.filter('products', p => p.status === 'active' && p.featured)
      .slice(0, 8)
      .map(hydrateProduct);

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// Get Trending Products
exports.getTrendingProducts = (req, res, next) => {
  try {
    const products = db.filter('products', p => p.status === 'active' && p.trending)
      .slice(0, 8)
      .map(hydrateProduct);

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// Get Related Products
exports.getRelatedProducts = (req, res, next) => {
  try {
    const { id } = req.params;
    const current = db.findById('products', id);

    let related = [];
    if (current) {
      related = db.filter('products', p => 
        p.id !== id && 
        p.status === 'active' && 
        (p.category_id === current.category_id || p.brand_id === current.brand_id)
      ).slice(0, 4);
    }

    if (related.length < 4) {
      const extra = db.filter('products', p => p.id !== id && p.status === 'active' && !related.some(r => r.id === p.id))
        .slice(0, 4 - related.length);
      related = [...related, ...extra];
    }

    res.json({
      success: true,
      data: related.map(hydrateProduct)
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Create Product
exports.createProduct = (req, res, next) => {
  try {
    const {
      name,
      description,
      short_description,
      price,
      compare_price,
      sku,
      stock,
      category_id,
      brand_id,
      featured,
      trending,
      specifications,
      tags,
      images = [],
      variants = []
    } = req.body;

    if (!name || !description || price === undefined || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and SKU are required fields.'
      });
    }

    // Slugify name
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let existingSlug = db.findOne('products', p => p.slug === slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newProduct = db.insert('products', {
      name,
      slug,
      description,
      short_description: short_description || '',
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      sku,
      stock: parseInt(stock, 10) || 0,
      category_id: category_id || null,
      brand_id: brand_id || null,
      status: 'active',
      featured: Boolean(featured),
      trending: Boolean(trending),
      rating: 5.0,
      reviews_count: 0,
      specifications: typeof specifications === 'object' ? specifications : {},
      tags: Array.isArray(tags) ? tags : []
    });

    // Save images
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((imgUrl, idx) => {
        db.insert('product_images', {
          product_id: newProduct.id,
          image_url: typeof imgUrl === 'string' ? imgUrl : imgUrl.image_url,
          alt_text: name,
          sort_order: idx + 1,
          is_primary: idx === 0
        });
      });
    }

    // Save variants
    if (Array.isArray(variants) && variants.length > 0) {
      variants.forEach(v => {
        db.insert('product_variants', {
          product_id: newProduct.id,
          sku: v.sku || `${sku}-${v.size || v.color || 'V'}`,
          size: v.size || null,
          color: v.color || null,
          weight: v.weight || null,
          price: v.price ? parseFloat(v.price) : parseFloat(price),
          stock: v.stock ? parseInt(v.stock, 10) : 10
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: hydrateProduct(newProduct)
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update Product
exports.updateProduct = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.findById('products', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updates = { ...req.body };
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.compare_price) updates.compare_price = parseFloat(updates.compare_price);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);

    const updated = db.update('products', id, updates);

    // If new images provided, sync
    if (Array.isArray(req.body.images)) {
      const oldImages = db.filter('product_images', img => img.product_id === id);
      oldImages.forEach(img => db.delete('product_images', img.id));

      req.body.images.forEach((imgUrl, idx) => {
        db.insert('product_images', {
          product_id: id,
          image_url: typeof imgUrl === 'string' ? imgUrl : imgUrl.image_url,
          alt_text: updated.name,
          sort_order: idx + 1,
          is_primary: idx === 0
        });
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: hydrateProduct(updated)
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete Product
exports.deleteProduct = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = db.delete('products', id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Cascade delete images and variants
    const images = db.filter('product_images', img => img.product_id === id);
    images.forEach(img => db.delete('product_images', img.id));

    const variants = db.filter('product_variants', v => v.product_id === id);
    variants.forEach(v => db.delete('product_variants', v.id));

    res.json({
      success: true,
      message: 'Product and associated assets deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
