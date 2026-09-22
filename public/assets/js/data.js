/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

// Centralized image URL resolver: delegates to ProductImageService
function resolveSafeAssetUrl(url) {
  if (typeof window !== 'undefined' && window.ProductImageService) {
    return window.ProductImageService.getProductImageUrl(url);
  }
  if (!url || typeof url !== 'string') return '/assets/images/krishna-logo.jpg';
  const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  if (match) {
    return `/api/product-images/${match[1]}`;
  }
  return url;
}

const HARINAMA_AUTHENTIC_PRODUCTS = [];

const HARINAMA_BASE_AUTHENTIC_COLLECTIONS = [];

// Dynamic Category Counts based on Database Categories & Products
function computeCategoryCounts(productsList = [], dbCategories = null) {
  let catList = [];
  if (Array.isArray(dbCategories) && dbCategories.length > 0) {
    catList = [...dbCategories];
  } else {
    try {
      const cached = localStorage.getItem('hn_admin_categories') || localStorage.getItem('hn_live_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) catList = parsed;
      }
    } catch (_) {}
  }
  if (catList.length === 0) {
    return [];
  }

  // Separate "All Products" from custom categories so we can sort by sort_order
  const nonAllCats = catList.filter(c => c.slug !== 'all-products' && c.id !== 'cat-all');
  
  // Sort categories strictly by sort_order ascending (1, 2, 3...)
  nonAllCats.sort((a, b) => {
    const orderA = a.sort_order !== undefined && a.sort_order !== null && !isNaN(Number(a.sort_order)) ? Number(a.sort_order) : 9999;
    const orderB = b.sort_order !== undefined && b.sort_order !== null && !isNaN(Number(b.sort_order)) ? Number(b.sort_order) : 9999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });

  catList = [
    { id: 'cat-all', name: 'All Products', slug: 'all-products', desc: 'Browse all divine items.', image: '/assets/images/cat_keychains.jpg', sort_order: -1 },
    ...nonAllCats
  ];

  return catList.map(c => {
    if (c.slug === 'all-products' || c.id === 'cat-all') {
      return { ...c, count: productsList.length, product_count: productsList.length };
    }
    const count = productsList.filter(p => 
      (p.category_id && p.category_id === c.id) ||
      (p.category && p.category.toLowerCase() === (c.name || '').toLowerCase()) || 
      (p.category_slug && p.category_slug.toLowerCase() === (c.slug || '').toLowerCase()) ||
      (p.category && (c.name || '').length > 3 && p.category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]))
    ).length;
    return { ...c, count, product_count: count, sort_order: c.sort_order !== undefined && c.sort_order !== null ? Number(c.sort_order) : 0 };
  });
}

// Universal Safe Application Storage Purge (Leaves All Authentication Tokens Untouched)
(function purgeObsoleteCatalogStorage() {
  try {
    const obsoleteKeys = [
      'hn_live_products',
      'harinama_admin_products',
      'hn_admin_categories',
      'hn_live_categories'
    ];
    obsoleteKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    ['harinama_admin_orders', 'hn_orders', 'hn_admin_orders', 'hn_recent_orders'].forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
  } catch (_) {}
})();

const HARINAMA_DATA = {
  products: [...HARINAMA_AUTHENTIC_PRODUCTS],
  categories: computeCategoryCounts(HARINAMA_AUTHENTIC_PRODUCTS, HARINAMA_BASE_AUTHENTIC_COLLECTIONS),
  isLoaded: false
};

// Backwards compatibility alias
const CRESCENDO_DATA = HARINAMA_DATA;

// Universal Product Resolver
HARINAMA_DATA.getProductById = function(id) {
  if (!id) return null;
  const cleanId = String(id).trim().toLowerCase();
  return HARINAMA_DATA.products.find(p => 
    String(p.id).toLowerCase() === cleanId || 
    String(p.slug).toLowerCase() === cleanId || 
    String(p.sku || '').toLowerCase() === cleanId
  ) || null;
};

HARINAMA_DATA.getProductBySlug = function(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).trim().toLowerCase();
  return HARINAMA_DATA.products.find(p => String(p.slug).toLowerCase() === cleanSlug) || null;
};

// Async Fresh Product Fetcher (Guarantees fresh database state for single product views)
HARINAMA_DATA.fetchProductBySlug = async function(slugOrId) {
  if (!slugOrId) return null;
  const clean = String(slugOrId).trim();

  function getBackendUrl(path) {
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'file:') return 'http://localhost:5000' + path;
      const { hostname, port } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '5000') return path;
        return 'http://localhost:5000' + path;
      }
      return path;
    }
    return 'http://localhost:5000' + path;
  }

  // 1. Try Backend Express API with cache: 'no-store'
  try {
    const res = await fetch(getBackendUrl(`/api/products/${encodeURIComponent(clean)}`), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn('[data.js] fetchProductBySlug backend notice:', e);
  }

  // 2. Direct Supabase REST API Fallback (Works on any deployed domain without Express server)
  try {
    const SUPABASE_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';
    const sbHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Accept': 'application/json'
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    const hyphenSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    let restUrl = `${SUPABASE_URL}/rest/v1/products?select=*,product_images(*),categories(id,name,slug)&status=neq.archived`;
    if (isUuid) {
      restUrl += `&or=(id.eq.${clean},slug.eq.${encodeURIComponent(clean)})`;
    } else {
      restUrl += `&or=(slug.eq.${encodeURIComponent(clean)},slug.eq.${encodeURIComponent(hyphenSlug)})`;
    }

    const restRes = await fetch(restUrl, { headers: sbHeaders }).then(r => r.ok ? r.json() : null).catch(() => null);
    let data = (Array.isArray(restRes) && restRes.length > 0) ? restRes[0] : null;

    if (!data) {
      const fuzzyRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,product_images(*),categories(id,name,slug)&status=neq.archived&or=(sku.eq.${encodeURIComponent(clean)},slug.ilike.*${encodeURIComponent(hyphenSlug)}*,name.ilike.*${encodeURIComponent(clean)}*)&limit=1`, { headers: sbHeaders })
        .then(r => r.ok ? r.json() : null).catch(() => null);
      data = (Array.isArray(fuzzyRes) && fuzzyRes.length > 0) ? fuzzyRes[0] : null;
    }

    if (data) {
      const rawImgs = (data.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const imgs = rawImgs.map(img => resolveSafeAssetUrl(img.image_url || img.url)).filter(Boolean);
      const primaryImg = imgs[0] || resolveSafeAssetUrl(data.image_url || data.image || '');
      return {
        id: data.id,
        sku: data.sku || `HN-${(data.id || '').slice(0, 6)}`,
        name: data.name || data.title,
        title: data.title || data.name,
        slug: data.slug,
        category: data.categories?.name || data.category || 'General',
        category_id: data.category_id || null,
        category_slug: data.categories?.slug || '',
        material: (data.specifications && data.specifications.material) || data.material || 'Standard',
        price: parseFloat(data.price) || 0,
        old_price: data.compare_price ? parseFloat(data.compare_price) : null,
        compare_price: data.compare_price ? parseFloat(data.compare_price) : null,
        stock: data.stock !== undefined ? data.stock : 25,
        rating: parseFloat(data.rating) || 5.0,
        reviews_count: data.reviews_count || 0,
        image: primaryImg,
        primary_image: primaryImg,
        images: imgs.length > 0 ? imgs : (primaryImg ? [primaryImg] : []),
        gallery: imgs.length > 0 ? imgs : (primaryImg ? [primaryImg] : []),
        description: data.description || '',
        featured: Boolean(data.featured),
        trending: Boolean(data.trending)
      };
    }
  } catch (sbErr) {
    console.warn('[data.js] fetchProductBySlug Supabase notice:', sbErr);
  }

  return (typeof findCatalogProduct === 'function' ? findCatalogProduct(clean) : null) || HARINAMA_DATA.getProductBySlug(clean) || HARINAMA_DATA.getProductById(clean);
};

// Dynamic Sync with Live Database (Backend Express API & Direct Supabase Fallback)
let _isCatalogSyncing = false;
let _lastCatalogSyncTime = 0;

HARINAMA_DATA.syncWithApi = async function(forceRefresh = false) {
  const now = Date.now();
  // Throttle non-forced syncs within 2 seconds or if already syncing
  if (_isCatalogSyncing && !forceRefresh) return;
  if (!forceRefresh && (now - _lastCatalogSyncTime < 2000)) return;

  _isCatalogSyncing = true;
  _lastCatalogSyncTime = now;

  const SUPABASE_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';

  let fetchedProducts = [];
  let fetchedCategories = [];
  let categoriesLoaded = false;
  let productsLoaded = false;

  function getBackendUrl(path) {
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'file:') return 'http://localhost:5000' + path;
      const { hostname, port } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '5000') return path;
        return 'http://localhost:5000' + path;
      }
      return path;
    }
    return 'http://localhost:5000' + path;
  }

  const resolveCategoryImage = (c) => {
    if (c.image_url && c.image_url.trim()) return resolveSafeAssetUrl(c.image_url);
    if (c.image && c.image.trim()) return resolveSafeAssetUrl(c.image);
    const s = ((c.slug || '') + ' ' + (c.name || '')).toLowerCase();
    if (s.includes('mala') || s.includes('japa')) return '/assets/images/cat_japa_malas.jpg';
    if (s.includes('keychain')) return '/assets/images/cat_keychains.jpg';
    if (s.includes('book') || s.includes('gita') || s.includes('shastra')) return '/assets/images/cat_books.jpg';
    if (s.includes('statue') || s.includes('deity') || s.includes('murti')) return '/assets/images/cat_deity_statues.jpg';
    if (s.includes('bag')) return '/assets/images/cat_japa_bags.jpg';
    if (s.includes('gift')) return '/assets/images/cat_spiritual_gifts.jpg';
    return '/assets/images/cat_keychains.jpg';
  };

  // Safe fetch helper with timeout and cache: 'no-store'
  function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const fetchOptions = {
      cache: 'no-store',
      ...options
    };
    if (typeof AbortController === 'undefined') return fetch(url, fetchOptions);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...fetchOptions, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  // 1. LIVE BACKEND EXPRESS API (Primary Live Database Source)
  try {
    const [prodRes, catRes] = await Promise.allSettled([
      fetchWithTimeout(getBackendUrl('/api/products?limit=100'), {}, 8000).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchWithTimeout(getBackendUrl('/api/categories'), {}, 8000).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (catRes.status === 'fulfilled' && catRes.value && catRes.value.success && Array.isArray(catRes.value.data) && catRes.value.data.length > 0) {
      fetchedCategories = catRes.value.data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        desc: c.description || 'Sacred collection',
        image: resolveSafeAssetUrl(resolveCategoryImage(c)),
        image_url: resolveSafeAssetUrl(resolveCategoryImage(c)),
        sort_order: c.sort_order !== undefined && c.sort_order !== null && !isNaN(Number(c.sort_order)) ? Number(c.sort_order) : 0,
        status: c.status,
        product_count: c.product_count || 0
      }));
      categoriesLoaded = true;
    }

    if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
      fetchedProducts = prodRes.value.data.map(p => ({
        id: p.id,
        sku: p.sku || `HN-${(p.id || '').slice(0, 6)}`,
        name: p.name || p.title,
        title: p.title || p.name,
        slug: p.slug,
        category: p.category_name || p.category || 'Devotional Items',
        category_id: p.category_id,
        category_slug: p.category_slug || '',
        material: p.material || (p.specifications && p.specifications.material) || 'Standard',
        price: parseFloat(p.price) || 0,
        old_price: p.compare_price ? parseFloat(p.compare_price) : null,
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        stock: p.stock !== undefined ? p.stock : 25,
        rating: parseFloat(p.rating) || 5.0,
        reviews_count: p.reviews_count || 0,
        image: resolveSafeAssetUrl(p.primary_image || p.image || (p.images && p.images[0]) || ''),
        primary_image: resolveSafeAssetUrl(p.primary_image || p.image || (p.images && p.images[0]) || ''),
        images: (p.images && p.images.length > 0) ? p.images.map(img => resolveSafeAssetUrl(typeof img === 'string' ? img : (img.image_url || img.url))) : (p.primary_image ? [resolveSafeAssetUrl(p.primary_image)] : []),
        gallery: (p.images && p.images.length > 0) ? p.images.map(img => resolveSafeAssetUrl(typeof img === 'string' ? img : (img.image_url || img.url))) : (p.primary_image ? [resolveSafeAssetUrl(p.primary_image)] : []),
        description: p.description || '',
        featured: Boolean(p.featured),
        trending: Boolean(p.trending)
      }));
      productsLoaded = true;
    }
  } catch (e) {
    console.warn('[data.js] Live Express API notice:', e);
  }

  // 2. LIVE SUPABASE DIRECT REST API FALLBACK (If Express is unreachable)
  if (!productsLoaded || !categoriesLoaded) {
    const sbHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };

    try {
      if (!categoriesLoaded) {
        const catRes = await fetchWithTimeout(
          SUPABASE_URL + '/rest/v1/categories?status=neq.archived&order=sort_order.asc,name.asc',
          { headers: sbHeaders },
          8000
        ).then(r => r.ok ? r.json() : null).catch(() => null);

        if (Array.isArray(catRes) && catRes.length > 0) {
          fetchedCategories = catRes.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            desc: c.description || 'Sacred collection',
            image: resolveSafeAssetUrl(resolveCategoryImage(c)),
            image_url: resolveSafeAssetUrl(resolveCategoryImage(c)),
            sort_order: c.sort_order !== undefined && c.sort_order !== null && !isNaN(Number(c.sort_order)) ? Number(c.sort_order) : 0,
            status: c.status,
            product_count: 0
          }));
          categoriesLoaded = true;
        }
      }

      if (!productsLoaded) {
        const prodRes = await fetchWithTimeout(
          SUPABASE_URL + '/rest/v1/products?status=eq.active&order=created_at.desc&select=*,product_images(*),categories(id,name,slug)&limit=100',
          { headers: sbHeaders },
          8000
        ).then(r => r.ok ? r.json() : null).catch(() => null);

        if (Array.isArray(prodRes) && prodRes.length > 0) {
          fetchedProducts = prodRes.map(p => {
            const rawImgs = (p.product_images || []).sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return (a.sort_order || 0) - (b.sort_order || 0);
            });
            const imgs = rawImgs.map(img => resolveSafeAssetUrl(img.image_url || img.url)).filter(Boolean);
            const primaryImg = imgs[0] || resolveSafeAssetUrl(p.image_url || p.image || '');
            return {
              id: p.id,
              sku: p.sku || `HN-${(p.id || '').slice(0, 6)}`,
              name: p.name || p.title,
              title: p.title || p.name,
              slug: p.slug,
              category: p.categories?.name || p.category_name || p.category || 'General',
              category_id: p.category_id || null,
              category_slug: p.categories?.slug || '',
              material: (p.specifications && p.specifications.material) || p.material || 'Standard',
              price: parseFloat(p.price) || 0,
              old_price: p.compare_price ? parseFloat(p.compare_price) : null,
              compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
              stock: p.stock !== undefined ? p.stock : 25,
              rating: parseFloat(p.rating) || 5.0,
              reviews_count: p.reviews_count || 0,
              image: primaryImg,
              primary_image: primaryImg,
              images: imgs.length > 0 ? imgs : (primaryImg ? [primaryImg] : []),
              gallery: imgs.length > 0 ? imgs : (primaryImg ? [primaryImg] : []),
              description: p.description || '',
              featured: Boolean(p.featured),
              trending: Boolean(p.trending)
            };
          });
          productsLoaded = true;
        }
      }
    } catch (restErr) {
      console.warn('[data.js] Supabase direct fallback notice:', restErr);
    }
  }

  // 3. Fallback only if network was completely offline
  if (!productsLoaded || fetchedProducts.length === 0) {
    if (forceRefresh || !HARINAMA_DATA.isLoaded) {
      fetchedProducts = (HARINAMA_DATA.products && HARINAMA_DATA.products.length > 0) ? HARINAMA_DATA.products : [...HARINAMA_AUTHENTIC_PRODUCTS];
    } else {
      fetchedProducts = HARINAMA_DATA.products;
    }
  }

  if (!categoriesLoaded || fetchedCategories.length === 0) {
    fetchedCategories = (HARINAMA_DATA.categories && HARINAMA_DATA.categories.length > 0) ? HARINAMA_DATA.categories : [...HARINAMA_BASE_AUTHENTIC_COLLECTIONS];
  }

  // Apply to in-memory global state (NOT to localStorage)
  HARINAMA_DATA.products = fetchedProducts;
  HARINAMA_DATA.categories = computeCategoryCounts(fetchedProducts, fetchedCategories);
  HARINAMA_DATA.isLoaded = true;
  _isCatalogSyncing = false;

  // Dispatch events to all active pages
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('hn:catalog-loaded', {
        detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
      }));
      window.dispatchEvent(new CustomEvent('hn:catalog-changed', {
        detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
      }));
    } catch (_) {}
  }
};

// Safe Catalog Cache Refresh: Refetches live products without ever touching Auth Tokens or User Sessions
HARINAMA_DATA.refreshCatalog = async function() {
  try {
    await HARINAMA_DATA.syncWithApi(true);
    return { success: true, count: HARINAMA_DATA.products.length };
  } catch (err) {
    console.warn('[data.js] Catalog refresh notice:', err);
    return { success: false, error: err.message };
  }
};

// Safe Cache Clear: Clears ONLY application temporary data without logging the devotee out
HARINAMA_DATA.clearStorefrontCatalogCache = function() {
  try {
    localStorage.removeItem('hn_live_products');
    localStorage.removeItem('hn_live_categories');
    localStorage.removeItem('hn_admin_categories');
    HARINAMA_DATA.syncWithApi(true);
    return true;
  } catch (_) {
    return false;
  }
};

// Dynamic Coupon Validator against live database
HARINAMA_DATA.validateCoupon = async function(rawCode, subtotal = 0) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  // Check if coupon was deleted by store admin
  try {
    const deletedRaw = localStorage.getItem('hn_deleted_coupons');
    if (deletedRaw) {
      const deletedList = JSON.parse(deletedRaw);
      if (Array.isArray(deletedList) && deletedList.includes(code)) {
        return { valid: false, message: `Coupon "${code}" is invalid or has expired.` };
      }
    }
  } catch (_) {}

  const orderSubtotal = parseFloat(subtotal) || 0;

  function getBackendUrl(path) {
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'file:') return 'http://localhost:5000' + path;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (window.location.port === '5000') return path;
        return 'http://localhost:5000' + path;
      }
      return path;
    }
    return 'http://localhost:5000' + path;
  }

  // 1. Try Backend API
  try {
    const res = await fetch(getBackendUrl('/api/coupons/validate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: orderSubtotal })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          valid: true,
          code: json.data.code,
          discount: parseFloat(json.data.discount_amount || json.data.discount || 0),
          discountType: json.data.discount_type,
          discountValue: parseFloat(json.data.discount_value),
          message: json.message || `Coupon "${json.data.code}" applied! Saved ₹${json.data.discount_amount || json.data.discount}.`
        };
      } else if (json.message) {
        return { valid: false, message: json.message };
      }
    }
  } catch (e) {
    console.warn('[validateCoupon] API notice:', e);
  }

  // 2. Direct Supabase Query Fallback
  try {
    const sb = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
    if (sb) {
      const { data: cpn, error } = await sb.from('coupons').select('*').ilike('code', code).maybeSingle();
      if (!error && cpn) {
        if (cpn.status && cpn.status.toLowerCase() !== 'active') {
          return { valid: false, message: `Coupon "${cpn.code}" is no longer active.` };
        }
        if (cpn.expiry_date && new Date(cpn.expiry_date) < new Date()) {
          return { valid: false, message: `Coupon "${cpn.code}" has expired.` };
        }
        if (cpn.usage_limit && cpn.times_used >= cpn.usage_limit) {
          return { valid: false, message: `Coupon "${cpn.code}" has reached its maximum usage limit.` };
        }
        if (cpn.minimum_order && orderSubtotal < parseFloat(cpn.minimum_order)) {
          return { valid: false, message: `Minimum order of ₹${cpn.minimum_order} required for coupon "${cpn.code}".` };
        }
        let discount = 0;
        if (cpn.discount_type === 'percentage') {
          discount = (orderSubtotal * parseFloat(cpn.discount_value)) / 100;
          if (cpn.maximum_discount && discount > parseFloat(cpn.maximum_discount)) {
            discount = parseFloat(cpn.maximum_discount);
          }
        } else {
          discount = parseFloat(cpn.discount_value);
        }
        discount = Math.min(discount, orderSubtotal);
        discount = Math.round(discount * 100) / 100;
        return {
          valid: true,
          code: cpn.code,
          discount,
          discountType: cpn.discount_type,
          discountValue: parseFloat(cpn.discount_value),
          message: `Coupon "${cpn.code}" applied! Saved ₹${discount}.`
        };
      }
    }
  } catch (sbErr) {
    console.warn('[validateCoupon] Supabase direct notice:', sbErr);
  }

  // 3. Check Local Cache (from Admin Coupons)
  try {
    const cached = localStorage.getItem('hn_admin_coupons');
    if (cached) {
      const list = JSON.parse(cached);
      const cpn = Array.isArray(list) ? list.find(item => (item.code || '').toUpperCase() === code) : null;
      if (cpn) {
        if (cpn.status && cpn.status.toLowerCase() !== 'active') {
          return { valid: false, message: `Coupon "${cpn.code}" is not active.` };
        }
        if (cpn.expiry && new Date(cpn.expiry) < new Date()) {
          return { valid: false, message: `Coupon "${cpn.code}" has expired.` };
        }
        if (cpn.min && orderSubtotal < parseFloat(cpn.min)) {
          return { valid: false, message: `Minimum order of ₹${cpn.min} required for coupon "${cpn.code}".` };
        }
        let discount = 0;
        if (cpn.type === 'percentage') {
          discount = (orderSubtotal * parseFloat(cpn.value)) / 100;
        } else {
          discount = parseFloat(cpn.value);
        }
        discount = Math.min(discount, orderSubtotal);
        discount = Math.round(discount * 100) / 100;
        return {
          valid: true,
          code: cpn.code,
          discount,
          discountType: cpn.type,
          discountValue: parseFloat(cpn.value),
          message: `Coupon "${cpn.code}" applied! Saved ₹${discount}.`
        };
      }
    }
  } catch (_) {}

  return { valid: false, message: 'Invalid or expired coupon code.' };
};

// Real-time Singleton Supabase Channel Subscription (Memory Protected)
let _supabaseRealtimeChannel = null;
let _realtimeDebounceTimer = null;

function setupSupabaseRealtimeSync() {
  if (typeof window === 'undefined') return;
  if (_supabaseRealtimeChannel) return; // Singleton protection

  const SUPABASE_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';

  const sb = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
  if (!sb || typeof sb.channel !== 'function') return;

  try {
    _supabaseRealtimeChannel = sb.channel('hn-catalog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        clearTimeout(_realtimeDebounceTimer);
        _realtimeDebounceTimer = setTimeout(() => {
          HARINAMA_DATA.syncWithApi(true);
        }, 1500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        clearTimeout(_realtimeDebounceTimer);
        _realtimeDebounceTimer = setTimeout(() => {
          HARINAMA_DATA.syncWithApi(true);
        }, 1500);
      })
      .subscribe();

    // Cleanup on window unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
      if (_supabaseRealtimeChannel && sb) {
        try { sb.removeChannel(_supabaseRealtimeChannel); } catch (_) {}
        _supabaseRealtimeChannel = null;
      }
    });
  } catch (err) {
    console.warn('[data.js] Supabase Realtime notice:', err);
  }
}

// Cross-tab Synchronization with Loop Prevention
let _lastBroadcastReceivedTime = 0;
if (typeof window !== 'undefined') {
  // 1. BroadcastChannel API
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('hn_catalog_channel');
      bc.onmessage = (event) => {
        const now = Date.now();
        if (now - _lastBroadcastReceivedTime > 2000 && event.data && (event.data.type === 'CATALOG_INVALIDATED' || event.data.type === 'PRODUCT_UPDATED')) {
          _lastBroadcastReceivedTime = now;
          HARINAMA_DATA.syncWithApi(true);
        }
      };
      window._hn_catalog_broadcast = bc;
    } catch (_) {}
  }

  // 2. Storage event fallback for cross-tab sync
  window.addEventListener('storage', (e) => {
    const now = Date.now();
    if (now - _lastBroadcastReceivedTime > 2000 && (e.key === 'hn_catalog_sync_timestamp' || e.key === 'hn_catalog_invalidated')) {
      _lastBroadcastReceivedTime = now;
      HARINAMA_DATA.syncWithApi(true);
    }
  });
}

// Global broadcast trigger for Admin portal actions
HARINAMA_DATA.broadcastCatalogChange = function() {
  if (typeof window === 'undefined') return;
  try {
    if (window._hn_catalog_broadcast) {
      window._hn_catalog_broadcast.postMessage({ type: 'CATALOG_INVALIDATED', timestamp: Date.now() });
    }
    localStorage.setItem('hn_catalog_sync_timestamp', String(Date.now()));
  } catch (_) {}
  HARINAMA_DATA.syncWithApi(true);
};

// Auto-trigger sync and Realtime listener on load
if (typeof document !== 'undefined') {
  const onReady = () => {
    HARINAMA_DATA.syncWithApi();
    setTimeout(setupSupabaseRealtimeSync, 1500);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
}

if (typeof window !== 'undefined') {
  window.HARINAMA_DATA = HARINAMA_DATA;
  window.CRESCENDO_DATA = CRESCENDO_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HARINAMA_DATA, CRESCENDO_DATA, HARINAMA_AUTHENTIC_PRODUCTS };
}
