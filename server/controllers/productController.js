const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// Normalize product from Supabase relational queries
const normalizeSupabaseProduct = (p) => {
  const images = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const variants = p.product_variants || [];
  const category = p.categories || null;
  const brand = p.brands || null;

  const primaryImage = images.find(img => img.is_primary)?.image_url ||
    images[0]?.image_url ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const secondaryImage = images.find(img => !img.is_primary)?.image_url || primaryImage;

  const price = parseFloat(p.price) || 0;
  const comparePrice = p.compare_price ? parseFloat(p.compare_price) : null;
  const discountPercent = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return {
    id: p.id,
    name: p.name,
    title: p.title || p.name,
    slug: p.slug,
    description: p.description,
    short_description: p.short_description || '',
    price,
    compare_price: comparePrice,
    old_price: comparePrice,
    sku: p.sku,
    stock: p.stock !== undefined ? p.stock : 10,
    category_id: p.category_id,
    brand_id: p.brand_id,
    material: p.material || null,
    status: p.status || 'active',
    featured: Boolean(p.featured),
    trending: Boolean(p.trending),
    rating: parseFloat(p.rating) || 5.0,
    reviews_count: p.reviews_count || 0,
    specifications: p.specifications || {},
    tags: Array.isArray(p.tags) ? p.tags : [],
    primary_image: primaryImage,
    secondary_image: secondaryImage,
    image: primaryImage,
    gallery: images.map(img => img.image_url),
    images,
    variants,
    category: category ? category.name : 'General',
    category_name: category ? category.name : 'General',
    category_slug: category ? category.slug : '',
    brand_name: brand ? brand.name : 'HariNama Crafts',
    brand_slug: brand ? brand.slug : '',
    discount_percent: discountPercent,
    in_stock: (p.stock || 0) > 0,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
};

// Helper to hydrate product from local mock db
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

  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return {
    ...product,
    primary_image: primaryImage,
    secondary_image: secondaryImage,
    image: primaryImage,
    old_price: product.compare_price,
    gallery: images.map(img => img.image_url),
    images,
    variants,
    category: category ? category.name : 'General',
    category_name: category ? category.name : 'General',
    category_slug: category ? category.slug : '',
    brand_name: brand ? brand.name : 'HariNama Crafts',
    brand_slug: brand ? brand.slug : '',
    discount_percent: discountPercent,
    in_stock: product.stock > 0
  };
};

// Get Filtered & Paginated Products
exports.getProducts = async (req, res, next) => {
  try {
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

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    // Try Supabase PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('products')
          .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)', { count: 'exact' })
          .neq('status', 'archived')
          .neq('status', 'deleted');

        // Non-admin users only see active products
        if (!req.user || req.user.role !== 'admin') {
          query = query.eq('status', 'active');
        }

        // Category filter
        if (category && category !== 'all-products') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
          if (isUuid) {
            query = query.eq('category_id', category);
          } else {
            const { data: catRecord } = await supabase.from('categories').select('id').eq('slug', category).single();
            if (catRecord) {
              query = query.eq('category_id', catRecord.id);
            }
          }
        }

        // Brand filter
        if (brand) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand);
          if (isUuid) {
            query = query.eq('brand_id', brand);
          } else {
            const { data: brRecord } = await supabase.from('brands').select('id').eq('slug', brand).single();
            if (brRecord) {
              query = query.eq('brand_id', brRecord.id);
            }
          }
        }

        // Price range
        if (min_price) query = query.gte('price', parseFloat(min_price));
        if (max_price) query = query.lte('price', parseFloat(max_price));

        // Rating
        if (rating) query = query.gte('rating', parseFloat(rating));

        // Stock
        if (in_stock === 'true' || in_stock === true) query = query.gt('stock', 0);

        // Featured & Trending
        if (featured === 'true') query = query.eq('featured', true);
        if (trending === 'true') query = query.eq('trending', true);

        // Search
        if (search) {
          const term = search.trim();
          query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`);
        }

        // Sorting
        switch (sort) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'popular':
            query = query.order('reviews_count', { ascending: false });
            break;
          case 'featured':
          default:
            query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
            break;
        }

        // Pagination
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (!error && data) {
          let list = data.map(normalizeSupabaseProduct);
          if (has_discount === 'true') {
            list = list.filter(p => p.compare_price && p.compare_price > p.price);
          }

          const total = count !== null ? count : list.length;
          return res.json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            data: list
          });
        }
      } catch (sbErr) {
        console.warn('[productController] Supabase query failed, using local fallback:', sbErr.message);
      }
    }

    // Fallback: Local database store
    let products = db.findAll('products');

    if (!req.user || req.user.role !== 'admin') {
      products = products.filter(p => p.status === 'active');
    }

    if (category && category !== 'all-products') {
      const cat = db.findOne('categories', c => c.slug === category || c.id === category);
      if (cat) products = products.filter(p => p.category_id === cat.id);
    }

    if (brand) {
      const br = db.findOne('brands', b => b.slug === brand || b.id === brand);
      if (br) products = products.filter(p => p.brand_id === br.id);
    }

    if (min_price) products = products.filter(p => Number(p.price) >= Number(min_price));
    if (max_price) products = products.filter(p => Number(p.price) <= Number(max_price));
    if (rating) products = products.filter(p => Number(p.rating) >= Number(rating));
    if (in_stock === 'true' || in_stock === true) products = products.filter(p => p.stock > 0);
    if (has_discount === 'true') products = products.filter(p => p.compare_price && p.compare_price > p.price);
    if (featured === 'true') products = products.filter(p => p.featured);
    if (trending === 'true') products = products.filter(p => p.trending);

    if (search) {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

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

    const total = products.length;
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
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        let query = supabase
          .from('products')
          .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug), reviews(*, profiles(id, name, avatar_url))');

        if (isUuid) {
          query = query.or(`slug.eq.${slug},id.eq.${slug}`);
        } else {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.single();

        if (!error && data) {
          const normalized = normalizeSupabaseProduct(data);
          const reviews = (data.reviews || [])
            .filter(r => r.status === 'approved' || !r.status)
            .map(r => ({
              id: r.id,
              user_id: r.user_id,
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              created_at: r.created_at,
              user_name: r.profiles ? r.profiles.name : 'Devotee Customer',
              user_avatar: r.profiles ? r.profiles.avatar_url : null
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return res.json({
            success: true,
            data: {
              ...normalized,
              reviews
            }
          });
        }
      } catch (sbErr) {
        console.warn('[productController] Supabase getProductBySlug fallback:', sbErr.message);
      }
    }

    // Local fallback
    const product = db.findOne('products', p => p.slug === slug || p.id === slug);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
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
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)')
          .eq('status', 'active')
          .eq('featured', true)
          .limit(8);

        if (!error && data) {
          return res.json({
            success: true,
            data: data.map(normalizeSupabaseProduct)
          });
        }
      } catch (sbErr) {
        console.warn('[productController] getFeaturedProducts fallback:', sbErr.message);
      }
    }

    const products = db.filter('products', p => p.status === 'active' && p.featured)
      .slice(0, 8)
      .map(hydrateProduct);

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// Get Trending Products
exports.getTrendingProducts = async (req, res, next) => {
  try {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)')
          .eq('status', 'active')
          .eq('trending', true)
          .limit(8);

        if (!error && data) {
          return res.json({
            success: true,
            data: data.map(normalizeSupabaseProduct)
          });
        }
      } catch (sbErr) {
        console.warn('[productController] getTrendingProducts fallback:', sbErr.message);
      }
    }

    const products = db.filter('products', p => p.status === 'active' && p.trending)
      .slice(0, 8)
      .map(hydrateProduct);

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// Get Related Products
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let currQuery = supabase.from('products').select('id, category_id, brand_id');
        if (isUuid) {
          currQuery = currQuery.or(`id.eq.${id},slug.eq.${id}`);
        } else {
          currQuery = currQuery.eq('slug', id);
        }
        const { data: current } = await currQuery.single();

        if (current) {
          const { data: related } = await supabase
            .from('products')
            .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)')
            .eq('status', 'active')
            .neq('id', current.id)
            .or(`category_id.eq.${current.category_id},brand_id.eq.${current.brand_id}`)
            .limit(4);

          if (related && related.length > 0) {
            return res.json({
              success: true,
              data: related.map(normalizeSupabaseProduct)
            });
          }
        }
      } catch (sbErr) {
        console.warn('[productController] getRelatedProducts fallback:', sbErr.message);
      }
    }

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
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description = '',
      short_description,
      price,
      compare_price,
      sku,
      stock = 25,
      category_id,
      brand_id,
      material,
      status = 'active',
      featured,
      trending,
      specifications = {},
      tags = [],
      images = [],
      variants = []
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required fields.'
      });
    }

    const finalSku = sku || req.body.sku || `HN-PROD-${Date.now().toString().slice(-6)}`;
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const finalSpecs = typeof specifications === 'object' && specifications !== null ? { ...specifications } : {};
    if (material) finalSpecs.material = material;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const { data: existing } = await client.from('products').select('id').eq('slug', slug).single();
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      // Map category name to UUID if needed
      let resolvedCatId = category_id;
      const isCatUuid = resolvedCatId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedCatId);
      if (!isCatUuid) {
        const catName = resolvedCatId || req.body.category_name || req.body.category;
        if (catName) {
          const { data: catRec } = await client
            .from('categories')
            .select('id')
            .or(`name.ilike.%${catName}%,slug.ilike.%${catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}%`)
            .maybeSingle();
          if (catRec) resolvedCatId = catRec.id;
          else resolvedCatId = null;
        } else {
          resolvedCatId = null;
        }
      }

      const numPrice = parseFloat(price) || 0;
      let rawCompare = compare_price !== undefined ? compare_price : (req.body.old_price !== undefined ? req.body.old_price : null);
      let numCompare = rawCompare ? parseFloat(rawCompare) : null;
      if (numCompare !== null && (isNaN(numCompare) || numCompare <= numPrice)) {
        numCompare = null;
      }

      const isBrandUuid = brand_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand_id);

      const { data: newProd, error } = await client
        .from('products')
        .insert({
          name,
          slug,
          description: description || name,
          short_description: short_description || (description ? description.slice(0, 160) : ''),
          price: numPrice,
          compare_price: numCompare,
          sku: finalSku,
          stock: parseInt(stock, 10) || 0,
          category_id: resolvedCatId || null,
          brand_id: isBrandUuid ? brand_id : null,
          status: status || 'active',
          featured: Boolean(featured),
          trending: Boolean(trending),
          specifications: finalSpecs,
          tags: Array.isArray(tags) ? tags : []
        })
        .select()
        .single();

      if (!error && newProd) {
        // Insert images
        const allImages = Array.isArray(images) && images.length > 0
          ? images
          : (Array.isArray(req.body.gallery) && req.body.gallery.length > 0
            ? req.body.gallery
            : (req.body.image ? [req.body.image] : []));
        if (allImages.length > 0) {
          const imgRows = allImages.map((img, idx) => ({
            product_id: newProd.id,
            image_url: typeof img === 'string' ? img : (img.image_url || img.url),
            alt_text: name,
            sort_order: idx + 1,
            is_primary: idx === 0
          }));
          await client.from('product_images').insert(imgRows);
        }

        // Insert variants
        if (Array.isArray(variants) && variants.length > 0) {
          const varRows = variants.map(v => ({
            product_id: newProd.id,
            sku: v.sku || `${sku}-${v.size || v.color || 'V'}`,
            size: v.size || null,
            color: v.color || null,
            weight: v.weight || null,
            price: v.price ? parseFloat(v.price) : parseFloat(price),
            stock: v.stock ? parseInt(v.stock, 10) : 10
          }));
          await client.from('product_variants').insert(varRows);
        }

        const { data: fullProduct } = await client
          .from('products')
          .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)')
          .eq('id', newProd.id)
          .single();

        return res.status(201).json({
          success: true,
          message: 'Product created successfully in Supabase.',
          data: fullProduct ? normalizeSupabaseProduct(fullProduct) : newProd
        });
      }
    }

    // Local fallback
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
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      
      // Resolve target product in Supabase by UUID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = client.from('products').select('id, name, slug');
      if (isUuid) {
        query = query.or(`id.eq.${id},slug.eq.${id}`);
      } else {
        query = query.eq('slug', id);
      }
      const { data: targetRecord } = await query.maybeSingle();
      const targetId = targetRecord ? targetRecord.id : (isUuid ? id : null);

      if (targetId) {
        // Map category if provided as name or non-UUID
        let categoryId = req.body.category_id;
        const isCatUuid = categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
        if (!isCatUuid) {
          const catName = categoryId || req.body.category_name || req.body.category;
          if (catName) {
            const { data: catRec } = await client
              .from('categories')
              .select('id')
              .or(`name.ilike.%${catName}%,slug.ilike.%${catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}%`)
              .maybeSingle();
            if (catRec) categoryId = catRec.id;
            else categoryId = null;
          } else {
            categoryId = null;
          }
        }

        const allowedCols = [
          'name', 'slug', 'description', 'short_description',
          'price', 'compare_price', 'sku', 'stock', 'category_id',
          'brand_id', 'status', 'featured', 'trending',
          'rating', 'reviews_count', 'specifications', 'tags', 'updated_at'
        ];

        const updates = { updated_at: new Date().toISOString() };
        for (const col of allowedCols) {
          if (req.body[col] !== undefined) updates[col] = req.body[col];
        }

        if (req.body.material) {
          updates.specifications = {
            ...(typeof updates.specifications === 'object' && updates.specifications !== null ? updates.specifications : {}),
            material: req.body.material
          };
        }

        if (categoryId) updates.category_id = categoryId;
        if (updates.price !== undefined) updates.price = parseFloat(updates.price);
        if (req.body.old_price !== undefined && updates.compare_price === undefined) {
          updates.compare_price = req.body.old_price ? parseFloat(req.body.old_price) : null;
        } else if (updates.compare_price !== undefined) {
          updates.compare_price = updates.compare_price ? parseFloat(updates.compare_price) : null;
        }

        const effectivePrice = updates.price !== undefined ? updates.price : (targetRecord ? parseFloat(targetRecord.price) : 0);
        let effectiveCompare = updates.compare_price !== undefined 
          ? updates.compare_price 
          : (targetRecord && targetRecord.compare_price ? parseFloat(targetRecord.compare_price) : null);

        if (effectiveCompare !== null && (isNaN(effectiveCompare) || effectiveCompare <= effectivePrice)) {
          updates.compare_price = null;
        } else if (updates.compare_price !== undefined) {
          updates.compare_price = effectiveCompare;
        }
        if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);
        if (updates.featured !== undefined) updates.featured = Boolean(updates.featured);
        if (updates.trending !== undefined) updates.trending = Boolean(updates.trending);

        const { data: updated, error } = await client
          .from('products')
          .update(updates)
          .eq('id', targetId)
          .select()
          .single();

        if (!error && updated) {
          // Handle images update
          const imagesList = Array.isArray(req.body.images) && req.body.images.length > 0
            ? req.body.images
            : (Array.isArray(req.body.gallery) && req.body.gallery.length > 0
              ? req.body.gallery
              : (req.body.image ? [req.body.image] : null));
          if (imagesList && imagesList.length > 0) {
            await client.from('product_images').delete().eq('product_id', targetId);
            const imgRows = imagesList.map((img, idx) => ({
              product_id: targetId,
              image_url: typeof img === 'string' ? img : (img.image_url || img.url),
              alt_text: updated.name,
              sort_order: idx + 1,
              is_primary: idx === 0
            }));
            await client.from('product_images').insert(imgRows);
          }

          const { data: fullProduct } = await client
            .from('products')
            .select('*, product_images(*), product_variants(*), categories(id, name, slug), brands(id, name, slug)')
            .eq('id', targetId)
            .single();

          return res.json({
            success: true,
            message: 'Product updated successfully in Supabase database.',
            data: fullProduct ? normalizeSupabaseProduct(fullProduct) : updated
          });
        } else if (error) {
          console.warn('[productController] Supabase update error:', error.message);
        }
      }
    }

    // Local fallback
    const existing = db.findById('products', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updates = { ...req.body };
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.compare_price) updates.compare_price = parseFloat(updates.compare_price);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);

    const updated = db.update('products', id, updates);

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
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let targetId = isUuid ? id : null;

      if (!targetId) {
        const { data: rec } = await client.from('products').select('id, name, slug').eq('slug', id).maybeSingle();
        if (rec) targetId = rec.id;
      }

      if (targetId) {
        const SYSTEM_ARCHIVE_ID = '00000000-0000-0000-0000-000000000000';

        // 1. Delete associated child records
        try { await client.from('cart_items').delete().eq('product_id', targetId); } catch (_) {}
        try { await client.from('wishlist_items').delete().eq('product_id', targetId); } catch (_) {}
        try { await client.from('reviews').delete().eq('product_id', targetId); } catch (_) {}
        try { await client.from('product_images').delete().eq('product_id', targetId); } catch (_) {}
        try { await client.from('product_variants').delete().eq('product_id', targetId); } catch (_) {}

        // 2. Unlink or re-point order_items to System Archive ID so historical customer orders are preserved
        try {
          // Check if orders reference this product
          const { data: orderRefs } = await client.from('order_items').select('id').eq('product_id', targetId).limit(1);
          if (orderRefs && orderRefs.length > 0) {
            // Ensure system archive placeholder exists
            await client.from('products').upsert({
              id: SYSTEM_ARCHIVE_ID,
              name: 'Archived Product Placeholder',
              slug: 'system-archived-placeholder',
              sku: 'HN-ARCHIVED-000000',
              description: 'System placeholder for historical order preservation.',
              price: 0,
              stock: 0,
              status: 'archived'
            }, { onConflict: 'id' });

            // Re-point order items to archive placeholder
            await client.from('order_items').update({ product_id: SYSTEM_ARCHIVE_ID }).eq('product_id', targetId);
          }
        } catch (linkErr) {
          console.warn('[productController] Order item preservation notice:', linkErr);
        }

        // 3. Perform hard delete of product
        const { error: delError } = await client.from('products').delete().eq('id', targetId);

        if (!delError) {
          db.delete('products', targetId);
          db.delete('products', id);
          return res.json({ success: true, message: 'Product deleted permanently from database.' });
        }

        // 4. Fallback archive if deletion was blocked
        console.warn(`[productController] Hard delete notice (${delError.message}), archiving product...`);
        const { error: archError } = await client
          .from('products')
          .update({
            status: 'archived',
            stock: 0,
            featured: false,
            trending: false,
            slug: `${id}-archived-${Date.now()}`
          })
          .eq('id', targetId);

        if (!archError) {
          db.delete('products', targetId);
          db.delete('products', id);
          return res.json({
            success: true,
            message: 'Product removed from catalog.'
          });
        }
      }
    }

    const deleted = db.delete('products', id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const images = db.filter('product_images', img => img.product_id === id);
    images.forEach(img => db.delete('product_images', img.id));

    const variants = db.filter('product_variants', v => v.product_id === id);
    variants.forEach(v => db.delete('product_variants', v.id));

    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
