/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

const HARINAMA_AUTHENTIC_PRODUCTS = [];

const HARINAMA_BASE_AUTHENTIC_COLLECTIONS = [];

// Dynamic Category Counts based on Database Categories & Products
function computeCategoryCounts(productsList = [], dbCategories = null) {
  let catList = [];
  if (Array.isArray(dbCategories) && dbCategories.length > 0) {
    catList = [...dbCategories];
  } else {
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
      p.category_id === c.id ||
      p.category === c.name || 
      p.category_slug === c.slug ||
      (p.category && p.category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]))
    ).length;
    return { ...c, count };
  });
}

// Universal Immediate Purge for legacy dummy test data (orders, mock products, mock categories)
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

    // Clean mock products and categories from storage
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

// Get initial cached products if admin modified them
function getInitialProducts() {
  try {
    const saved = localStorage.getItem('hn_live_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => p && p.id && !p.id.startsWith('prod-'));
      }
    }
  } catch (e) {}
  return [];
}

const initialProducts = getInitialProducts();

const HARINAMA_DATA = {
  products: initialProducts,
  categories: computeCategoryCounts(initialProducts),
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

  let databaseLoaded = false;
  let fetchedProducts = [];
  let fetchedCategories = null;

  // 1. Try Backend Express API
  try {
    const [prodRes, catRes] = await Promise.allSettled([
      fetch('/api/products?limit=100').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/categories').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const resolveCategoryImage = (c) => {
      if (c.image_url && !c.image_url.includes('unsplash.com')) return c.image_url;
      if (c.image && !c.image.includes('unsplash.com')) return c.image;
      const s = ((c.slug || '') + ' ' + (c.name || '')).toLowerCase();
      if (s.includes('mala') || s.includes('japa-mala')) return '/assets/images/cat_japa_malas.jpg';
      if (s.includes('keychain')) return '/assets/images/cat_keychains.jpg';
      if (s.includes('book') || s.includes('gita') || s.includes('shastra')) return '/assets/images/cat_books.jpg';
      if (s.includes('statue') || s.includes('deity') || s.includes('murti')) return '/assets/images/cat_deity_statues.jpg';
      if (s.includes('bag')) return '/assets/images/cat_japa_bags.jpg';
      if (s.includes('gift')) return '/assets/images/cat_spiritual_gifts.jpg';
      return '/assets/images/cat_keychains.jpg';
    };

    if (catRes.status === 'fulfilled' && catRes.value && catRes.value.success && Array.isArray(catRes.value.data)) {
      fetchedCategories = catRes.value.data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        desc: c.description || 'Sacred collection',
        image: resolveCategoryImage(c)
      }));
    }

    if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data)) {
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
        image: p.primary_image || p.image || (p.images && p.images[0]) || '',
        primary_image: p.primary_image || p.image || (p.images && p.images[0]) || '',
        images: (p.images && p.images.length > 0) ? p.images.map(img => (typeof img === 'string' ? img : (img.image_url || img.url))) : (p.primary_image ? [p.primary_image] : []),
        gallery: (p.images && p.images.length > 0) ? p.images.map(img => (typeof img === 'string' ? img : (img.image_url || img.url))) : (p.primary_image ? [p.primary_image] : []),
        description: p.description || '',
        featured: Boolean(p.featured),
        trending: Boolean(p.trending)
      }));
      HARINAMA_DATA.products = fetchedProducts;
      HARINAMA_DATA.categories = computeCategoryCounts(fetchedProducts, fetchedCategories);
      HARINAMA_DATA.isLoaded = true;
      databaseLoaded = true;
    }
  } catch (e) {}

  // 2. Fallback to authentic baseline if API was offline
  if (!databaseLoaded) {
    if (!fetchedProducts || fetchedProducts.length === 0) {
      fetchedProducts = [...HARINAMA_AUTHENTIC_PRODUCTS];
    }
    if (!fetchedCategories || fetchedCategories.length === 0) {
      fetchedCategories = [...HARINAMA_BASE_AUTHENTIC_COLLECTIONS];
    }
    HARINAMA_DATA.products = fetchedProducts;
    HARINAMA_DATA.categories = computeCategoryCounts(fetchedProducts, fetchedCategories);
    HARINAMA_DATA.isLoaded = true;
  }

  // Save active products so other tabs read seamlessly
  try {
    localStorage.setItem('hn_live_products', JSON.stringify(HARINAMA_DATA.products));
  } catch (e) {}

  // Notify all storefront listeners
  window.dispatchEvent(new CustomEvent('hn:catalog-loaded', {
    detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
  }));
};

// Dynamic Coupon Validator against live database
HARINAMA_DATA.validateCoupon = async function(rawCode, subtotal = 0) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  // 1. Try Backend API (fast and secure)
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
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
          message: `Coupon ${json.data.code} applied! ₹${json.data.discount_amount || json.data.discount} discount.`
        };
      } else if (json.message) {
        return { valid: false, message: json.message };
      }
    }
  } catch (e) {}

  // 2. Local fallback for WELCOME10, HAREKRISHNA
  if (code === 'WELCOME10') {
    const discount = Math.round(subtotal * 0.10);
    return { valid: true, code: 'WELCOME10', discount, discountType: 'percentage', discountValue: 10, message: `Coupon WELCOME10 applied! ₹${discount} discount.` };
  }
  if (code === 'HAREKRISHNA') {
    const discount = 108;
    return { valid: true, code: 'HAREKRISHNA', discount, discountType: 'fixed', discountValue: 108, message: `Coupon HAREKRISHNA applied! ₹108 discount.` };
  }
  return { valid: false, message: 'Invalid or expired coupon code.' };
};

// Listen for storage events from Admin Portal across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'hn_live_products' || e.key === 'harinama_admin_products') {
    try {
      const updated = JSON.parse(e.newValue);
      if (Array.isArray(updated) && updated.length > 0) {
        HARINAMA_DATA.products = updated;
        HARINAMA_DATA.categories = computeCategoryCounts(updated);
        window.dispatchEvent(new CustomEvent('hn:catalog-loaded', {
          detail: { products: HARINAMA_DATA.products, categories: HARINAMA_DATA.categories }
        }));
      }
    } catch (_) {}
  }
});

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
