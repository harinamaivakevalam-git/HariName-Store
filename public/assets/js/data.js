/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

// Asset URL resolver: maps Supabase storage URLs to local bundled assets (avoids Indian ISP censorship of *.supabase.co)
function resolveSafeAssetUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(products|categories)\/([^/?#]+)/);
  if (match) {
    return `/assets/images/${match[1]}/${match[2]}`;
  }
  return url;
}

const HARINAMA_AUTHENTIC_PRODUCTS = [
  {
    id: "8ff21c2a-e054-43b8-abad-0bd414e39a88",
    name: "Lord Jagannath Devotional Keychain | Spiritual Blessings & Protection | Harinamastore",
    title: "Lord Jagannath Devotional Keychain | Spiritual Blessings & Protection | Harinamastore",
    slug: "lord-jagannath-devotional-keychain-spiritual-blessings-protection-harinamastore-2476",
    description: "Carry a reminder of devotion wherever you go. This beautifully crafted Lord Jagannath-inspired keychain features vibrant traditional colors, expressive eyes, and detailed devotional artwork. A meaningful accessory for your keys, bags, backpacks, or as a spiritual gift for someone special.",
    short_description: "Carry a reminder of devotion wherever you go. This beautifully crafted Lord Jagannath-inspired keychain features vibrant traditional colors, expressive eyes, an",
    price: 99,
    compare_price: 149,
    old_price: 149,
    sku: "HN-PROD-252476",
    stock: 5,
    category: "Krishna Keychains",
    category_name: "Krishna Keychains",
    category_id: "5f5c9b9e-ef4e-4d7f-ada8-b6548116fa32",
    category_slug: "krishna-keychains",
    brand_name: "HariNama Crafts",
    brand_slug: "",
    material: "Artwork",
    status: "active",
    featured: false,
    trending: false,
    rating: 5,
    reviews_count: 1,
    primary_image: "/assets/images/products/1789769234495-jly30m9.jpeg",
    image: "/assets/images/products/1789769234495-jly30m9.jpeg",
    secondary_image: "/assets/images/products/1789769243396-lr00hkq.jpeg",
    gallery: [
      "/assets/images/products/1789769234495-jly30m9.jpeg",
      "/assets/images/products/1789769243396-lr00hkq.jpeg",
      "/assets/images/products/1789769217722-5uwrf3c.jpeg",
      "/assets/images/products/1789769219922-3ckakqi.jpeg"
    ],
    images: [
      "/assets/images/products/1789769234495-jly30m9.jpeg",
      "/assets/images/products/1789769243396-lr00hkq.jpeg",
      "/assets/images/products/1789769217722-5uwrf3c.jpeg",
      "/assets/images/products/1789769219922-3ckakqi.jpeg"
    ],
    in_stock: true,
    created_at: "2026-09-18T22:07:33.571172+00:00"
  }
];

const HARINAMA_BASE_AUTHENTIC_COLLECTIONS = [
  {
    id: "5f5c9b9e-ef4e-4d7f-ada8-b6548116fa32",
    name: "Krishna Keychains",
    slug: "krishna-keychains",
    desc: "Sacred handcrafted Krishna, Jagannath & Mahamantra keychains.",
    image: "/assets/images/categories/1789768086568-hlj4uh3.png",
    image_url: "/assets/images/categories/1789768086568-hlj4uh3.png"
  },
  {
    id: "a8686346-2099-4f6f-9214-0ec187c2e632",
    name: "Devotional Keychains",
    slug: "devotional-keychains",
    desc: "Handcrafted acrylic, enamel, and brass devotional keychains.",
    image: "/assets/images/cat_keychains.jpg",
    image_url: "/assets/images/cat_keychains.jpg"
  },
  {
    id: "bff75ab7-217f-4bf2-95a1-9e8d2d850279",
    name: "Japa Mala & Prayer Beads",
    slug: "japa-mala-prayer-beads",
    desc: "Authentic Vrindavan Tulasi & Neem meditation prayer beads.",
    image: "/assets/images/categories/1789749775631-xv9hxvd.png",
    image_url: "/assets/images/categories/1789749775631-xv9hxvd.png"
  },
  {
    id: "bdfb6c50-8436-4546-96f7-007577b855ba",
    name: "Japa & Chanting",
    slug: "japa-chanting",
    desc: "Authentic meditation prayer beads and japa accessories.",
    image: "/assets/images/cat_japa_malas.jpg",
    image_url: "/assets/images/cat_japa_malas.jpg"
  },
  {
    id: "7b831506-0f28-434c-89ce-5312bb2169e8",
    name: "Books",
    slug: "books",
    desc: "Sacred Vedic texts, Bhagavad Gita As It Is, and spiritual wisdom.",
    image: "/assets/images/categories/1789766294158-jdgclgj.png",
    image_url: "/assets/images/categories/1789766294158-jdgclgj.png"
  },
  {
    id: "585c4ce8-3722-4070-bd8d-61076436c946",
    name: "Gift Sets & Bundles",
    slug: "gift-sets",
    desc: "Curated spiritual gift hampers, unboxing collections & puja sets.",
    image: "/assets/images/cat_spiritual_gifts.jpg",
    image_url: "/assets/images/cat_spiritual_gifts.jpg"
  }
];

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
    catList = [...HARINAMA_BASE_AUTHENTIC_COLLECTIONS];
  }

  // Ensure "All Products" is at the start if categories exist
  if (catList.length > 0 && !catList.some(c => c.slug === 'all-products' || c.id === 'cat-all')) {
    catList = [
      { id: 'cat-all', name: 'All Products', slug: 'all-products', desc: 'Browse all divine items.', image: '/assets/images/cat_keychains.jpg' },
      ...catList
    ];
  }

  return catList.map(c => {
    if (c.slug === 'all-products' || c.id === 'cat-all') {
      return { ...c, count: productsList.length };
    }
    const count = productsList.filter(p => 
      (p.category_id && p.category_id === c.id) ||
      (p.category && p.category.toLowerCase() === (c.name || '').toLowerCase()) || 
      (p.category_slug && p.category_slug.toLowerCase() === (c.slug || '').toLowerCase()) ||
      (p.category && (c.name || '').length > 3 && p.category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]))
    ).length;
    return { ...c, count };
  });
}

// Universal Immediate Purge for legacy dummy test data
(function purgeLegacyDummyStorage() {
  try {
    const dummyIds = ['HN-2026-98124', 'HN-2026-88219', 'HN-2026-77312', 'HN-2026-66415', 'HN-2026-55102', 'HN-2026-44298'];
    ['harinama_admin_orders', 'hn_orders', 'hn_admin_orders', 'hn_recent_orders'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(o => o && !dummyIds.includes(o.id) && !dummyIds.includes(o.order_number));
            if (valid.length > 0) localStorage.setItem(key, JSON.stringify(valid));
            else localStorage.removeItem(key);
          }
        } catch (_) {
          localStorage.removeItem(key);
        }
      }
    });

    // Clean mock products from storage
    const prodKey = 'hn_live_products';
    const storedProds = localStorage.getItem(prodKey);
    if (storedProds) {
      try {
        const parsedP = JSON.parse(storedProds);
        if (Array.isArray(parsedP)) {
          const validP = parsedP.filter(p => p && p.id && !p.id.startsWith('prod-'));
          if (validP.length > 0) localStorage.setItem(prodKey, JSON.stringify(validP));
          else localStorage.removeItem(prodKey);
        }
      } catch (_) {
        localStorage.removeItem(prodKey);
      }
    }
  } catch (_) {}
})();

// Get initial cached products & categories
function getInitialProducts() {
  try {
    const saved = localStorage.getItem('hn_live_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(p => p && p.id && !p.id.startsWith('prod-'));
        if (valid.length > 0) return valid;
      }
    }
  } catch (e) {}
  return [...HARINAMA_AUTHENTIC_PRODUCTS];
}

function getInitialCategories() {
  try {
    const saved = localStorage.getItem('hn_admin_categories') || localStorage.getItem('hn_live_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...HARINAMA_BASE_AUTHENTIC_COLLECTIONS];
}

const initialProducts = getInitialProducts();
const initialCategories = getInitialCategories();

const HARINAMA_DATA = {
  products: initialProducts,
  categories: computeCategoryCounts(initialProducts, initialCategories),
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

// Dynamic Sync with Live Supabase & Admin API
HARINAMA_DATA.syncWithApi = async function() {
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

  // 1. Try Backend Express API
  try {
    const [prodRes, catRes] = await Promise.allSettled([
      fetch(getBackendUrl('/api/products?limit=100')).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(getBackendUrl('/api/categories')).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (catRes.status === 'fulfilled' && catRes.value && catRes.value.success && Array.isArray(catRes.value.data) && catRes.value.data.length > 0) {
      fetchedCategories = catRes.value.data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        desc: c.description || 'Sacred collection',
        image: resolveSafeAssetUrl(resolveCategoryImage(c)),
        image_url: resolveSafeAssetUrl(resolveCategoryImage(c)),
        product_count: c.product_count || 0
      }));
      categoriesLoaded = true;
    }

    if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
      fetchedProducts = prodRes.value.data.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        title: p.title || p.name,
        slug: p.slug,
        category: p.category_name || p.category || 'Devotional Items',
        category_id: p.category_id,
        category_slug: p.category_slug || '',
        material: p.material || 'Standard',
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
    console.warn('[data.js] API fetch notice:', e);
  }

  // 2. Static JSON Catalog Fallback (Works on static hosting, CDNs, offline — instant & reliable)
  if (!productsLoaded || !categoriesLoaded) {
    try {
      const [prodJsonRes, catJsonRes] = await Promise.allSettled([
        fetch('/assets/data/products.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/assets/data/categories.json').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (catJsonRes.status === 'fulfilled' && Array.isArray(catJsonRes.value) && catJsonRes.value.length > 0) {
        fetchedCategories = catJsonRes.value.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          desc: c.description || 'Sacred collection',
          image: resolveSafeAssetUrl(resolveCategoryImage(c)),
          image_url: resolveSafeAssetUrl(resolveCategoryImage(c)),
          product_count: 0
        }));
        categoriesLoaded = true;
      }

      if (prodJsonRes.status === 'fulfilled' && Array.isArray(prodJsonRes.value) && prodJsonRes.value.length > 0) {
        fetchedProducts = prodJsonRes.value.map(p => {
          const imgs = (p.product_images || []).map(img => resolveSafeAssetUrl(img.image_url || img.url));
          const primaryImg = resolveSafeAssetUrl(imgs[0] || p.primary_image || p.image_url || p.image || '');
          return {
            id: p.id,
            sku: p.sku || `HN-${(p.id || '').slice(0, 6)}`,
            name: p.name || p.title,
            title: p.title || p.name,
            slug: p.slug,
            category: p.categories?.name || p.category_name || p.category || 'Krishna Keychains',
            category_id: p.category_id,
            category_slug: p.categories?.slug || p.category_slug || '',
            material: (p.specifications && p.specifications.material) || p.material || 'Artwork',
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
    } catch (jsonErr) {
      console.warn('[data.js] Static JSON fallback notice:', jsonErr);
    }
  }

  // 2. Direct Supabase REST API Fallback (no JS client needed — works everywhere)
  if (!productsLoaded || !categoriesLoaded) {
    const sbHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch categories directly via REST if not loaded
      if (!categoriesLoaded) {
        const catRes = await fetch(
          SUPABASE_URL + '/rest/v1/categories?status=neq.archived&order=name',
          { headers: sbHeaders }
        ).then(r => r.ok ? r.json() : null).catch(() => null);

        if (Array.isArray(catRes) && catRes.length > 0) {
          fetchedCategories = catRes.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            desc: c.description || 'Sacred collection',
            image: resolveCategoryImage(c),
            image_url: resolveCategoryImage(c),
            product_count: 0
          }));
          categoriesLoaded = true;
        }
      }

      // Fetch products directly via REST if not loaded
      if (!productsLoaded) {
        const prodRes = await fetch(
          SUPABASE_URL + '/rest/v1/products?status=eq.active&order=created_at.desc&select=*,product_images(*),categories(id,name,slug)',
          { headers: sbHeaders }
        ).then(r => r.ok ? r.json() : null).catch(() => null);

        if (Array.isArray(prodRes) && prodRes.length > 0) {
          fetchedProducts = prodRes.map(p => {
            const imgs = (p.product_images || []).map(img => img.image_url || img.url);
            const primaryImg = imgs[0] || p.image_url || p.image || '';
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
      console.warn('[data.js] Supabase REST fallback notice:', restErr);
    }
  }

  // 3. Supabase JS Client Fallback (if REST also failed and JS client is available)
  if ((!categoriesLoaded || !productsLoaded) && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Fetch categories if not loaded
      if (!categoriesLoaded) {
        const { data: sbCats, error: cErr } = await sbClient
          .from('categories')
          .select('*')
          .neq('status', 'archived')
          .order('name');

        if (!cErr && Array.isArray(sbCats) && sbCats.length > 0) {
          fetchedCategories = sbCats.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            desc: c.description || 'Sacred collection',
            image: resolveCategoryImage(c),
            image_url: resolveCategoryImage(c),
            product_count: 0
          }));
          categoriesLoaded = true;
        }
      }

      // Fetch products if not loaded
      if (!productsLoaded) {
        const { data: sbProds, error: pErr } = await sbClient
          .from('products')
          .select('*, product_images(*), categories(id, name, slug)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!pErr && Array.isArray(sbProds)) {
          fetchedProducts = sbProds.map(p => {
            const imgs = (p.product_images || []).map(img => img.image_url || img.url);
            const primaryImg = imgs[0] || p.image_url || p.image || '';
            return {
              id: p.id,
              sku: p.sku || `HN-${p.id.slice(0, 6)}`,
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
    } catch (_) {}
  }

  // 3. Cache fallback for categories if still empty
  if (!categoriesLoaded || fetchedCategories.length === 0) {
    try {
      const cached = localStorage.getItem('hn_admin_categories') || localStorage.getItem('hn_live_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fetchedCategories = parsed;
          categoriesLoaded = true;
        }
      }
    } catch (_) {}
  }

  // Apply to global state
  HARINAMA_DATA.products = fetchedProducts;
  HARINAMA_DATA.categories = computeCategoryCounts(fetchedProducts, fetchedCategories);
  HARINAMA_DATA.isLoaded = true;

  // Persist live categories and products
  if (typeof window !== 'undefined') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hn_live_products', JSON.stringify(HARINAMA_DATA.products));
        localStorage.setItem('hn_live_categories', JSON.stringify(HARINAMA_DATA.categories));
      }
    } catch (e) {}

    // Notify all storefront listeners
    try {
      window.dispatchEvent(new CustomEvent('hn:catalog-loaded', {
        detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
      }));
    } catch (_) {}
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

  // 4. Default baseline fallback
  if (code === 'WELCOME10') {
    if (orderSubtotal < 1000) {
      return { valid: false, message: 'Minimum order amount of ₹1000 required for coupon WELCOME10.' };
    }
    const discount = Math.round(orderSubtotal * 0.10);
    return { valid: true, code: 'WELCOME10', discount, discountType: 'percentage', discountValue: 10, message: `Coupon WELCOME10 applied! Saved ₹${discount}.` };
  }
  if (code === 'KRISHNA50') {
    if (orderSubtotal < 249) {
      return { valid: false, message: 'Minimum order amount of ₹249 required for coupon KRISHNA50.' };
    }
    return { valid: true, code: 'KRISHNA50', discount: 50, discountType: 'fixed', discountValue: 50, message: 'Coupon KRISHNA50 applied! Saved ₹50.' };
  }

  return { valid: false, message: 'Invalid or expired coupon code.' };
};

// Listen for storage events from Admin Portal across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'hn_live_products' || e.key === 'harinama_admin_products' || e.key === 'hn_admin_categories' || e.key === 'hn_live_categories') {
      try {
        let products = HARINAMA_DATA.products;
        let categories = HARINAMA_DATA.categories;
        if (e.key === 'hn_live_products' || e.key === 'harinama_admin_products') {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 0) products = updated;
        }
        if (e.key === 'hn_admin_categories' || e.key === 'hn_live_categories') {
          const updatedCats = JSON.parse(e.newValue);
          if (Array.isArray(updatedCats) && updatedCats.length > 0) categories = updatedCats;
        }
        HARINAMA_DATA.products = products;
        HARINAMA_DATA.categories = computeCategoryCounts(products, categories);
        window.dispatchEvent(new CustomEvent('hn:catalog-loaded', {
          detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
        }));
      } catch (_) {}
    }
  });
}

// Auto-trigger sync on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      HARINAMA_DATA.syncWithApi();
    });
  } else {
    HARINAMA_DATA.syncWithApi();
  }
}

if (typeof window !== 'undefined') {
  window.HARINAMA_DATA = HARINAMA_DATA;
  window.CRESCENDO_DATA = CRESCENDO_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HARINAMA_DATA, CRESCENDO_DATA, HARINAMA_AUTHENTIC_PRODUCTS };
}
