/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

const HARINAMA_AUTHENTIC_PRODUCTS = [];

function computeCategoryCounts(productsList) {
  const catNames = [
    { id: 'cat-all', name: 'All Products', slug: 'all-products', desc: 'Browse all divine items.', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
    { id: 'c0000001-0000-0000-0000-000000000001', name: 'Devotional Keychains', slug: 'devotional-keychains', desc: 'Carry Krishna with you everywhere.', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
    { id: 'c0000001-0000-0000-0000-000000000002', name: 'Sacred Books & Shastras', slug: 'sacred-books', desc: 'Transcendental literature and timeless wisdom.', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
    { id: 'c0000001-0000-0000-0000-000000000003', name: 'Japa & Chanting', slug: 'japa-chanting', desc: 'Authentic malas, japa bags, and chanting accessories.', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80' },
    { id: 'c0000001-0000-0000-0000-000000000004', name: 'Gift Sets & Bundles', slug: 'gift-sets', desc: 'Thoughtfully curated gift sets with sacred significance.', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' }
  ];

  return catNames.map(c => {
    if (c.slug === 'all-products' || c.id === 'cat-all') {
      return { ...c, count: productsList.length };
    }
    const count = productsList.filter(p => 
      p.category === c.name || 
      p.category_slug === c.slug ||
      (p.category && p.category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]))
    ).length;
    return { ...c, count };
  });
}

// Get initial cached products if admin modified them
function getInitialProducts() {
  try {
    const saved = localStorage.getItem('hn_live_products') || localStorage.getItem('harinama_admin_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...HARINAMA_AUTHENTIC_PRODUCTS];
}

const initialProducts = getInitialProducts();

const HARINAMA_DATA = {
  products: initialProducts,
  categories: computeCategoryCounts(initialProducts)
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

  // Check admin local updates first
  try {
    const savedAdmin = localStorage.getItem('hn_live_products') || localStorage.getItem('harinama_admin_products');
    if (savedAdmin) {
      const parsed = JSON.parse(savedAdmin);
      if (Array.isArray(parsed) && parsed.length > 0) {
        HARINAMA_DATA.products = parsed;
        HARINAMA_DATA.categories = computeCategoryCounts(parsed);
      }
    }
  } catch (e) {}

  let databaseLoaded = false;

  // 1. Try Backend Express API
  try {
    const [prodRes, catRes] = await Promise.allSettled([
      fetch('/api/products?limit=100').then(r => r.json()),
      fetch('/api/categories').then(r => r.json())
    ]);

    if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
      HARINAMA_DATA.products = prodRes.value.data.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        title: p.title || p.name,
        slug: p.slug,
        category: p.category_name || p.category || 'Devotional Items',
        category_slug: p.category_slug || '',
        material: p.material || 'Standard',
        price: parseFloat(p.price) || 0,
        old_price: p.compare_price ? parseFloat(p.compare_price) : null,
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        stock: p.stock !== undefined ? p.stock : 25,
        rating: parseFloat(p.rating) || 5.0,
        reviews_count: p.reviews_count || 0,
        image: p.primary_image || p.image,
        primary_image: p.primary_image || p.image,
        gallery: (p.images && p.images.length > 0) ? p.images.map(img => (typeof img === 'string' ? img : (img.image_url || img.url))) : [p.primary_image || p.image],
        description: p.description || '',
        featured: Boolean(p.featured),
        trending: Boolean(p.trending)
      }));
      HARINAMA_DATA.categories = computeCategoryCounts(HARINAMA_DATA.products);
      databaseLoaded = true;
    }
  } catch (e) {}

  // 2. Direct Supabase Query
  if (!databaseLoaded) {
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        const sb = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = sb;

        const { data, error } = await sb
          .from('products')
          .select('*, product_images(*), categories(id, name, slug)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          HARINAMA_DATA.products = data.map(p => {
            const imgList = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.image_url);
            const img = imgList[0] || p.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
            return {
              id: p.id,
              sku: p.sku,
              name: p.name,
              title: p.title || p.name,
              slug: p.slug,
              category: p.categories?.name || p.category || 'Devotional Items',
              category_slug: p.categories?.slug || 'devotional-keychains',
              material: p.material || 'Standard',
              price: parseFloat(p.price) || 0,
              old_price: p.compare_price ? parseFloat(p.compare_price) : null,
              compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
              stock: p.stock !== undefined ? p.stock : 25,
              rating: parseFloat(p.rating) || 5.0,
              reviews_count: p.reviews_count || 0,
              image: img,
              primary_image: img,
              images: imgList.length > 0 ? imgList : [img],
              gallery: imgList.length > 0 ? imgList : [img],
              description: p.description || '',
              featured: Boolean(p.featured),
              trending: Boolean(p.trending)
            };
          });
          HARINAMA_DATA.categories = computeCategoryCounts(HARINAMA_DATA.products);
          databaseLoaded = true;
        }
      }
    } catch (sbE) {
      console.warn('[HARINAMA_DATA] Supabase fetch notice:', sbE);
    }
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

  const SUPABASE_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';

  // 1. Try Backend API
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
      }
    }
  } catch (e) {}

  // 2. Direct Supabase Query
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      const sb = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = sb;

      const { data: coupon, error } = await sb
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && coupon) {
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          return { valid: false, message: `Coupon ${code} has expired.` };
        }
        if (coupon.min_order_amount && subtotal < parseFloat(coupon.min_order_amount)) {
          return { valid: false, message: `Minimum order amount of ₹${coupon.min_order_amount} required.` };
        }
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = Math.round((subtotal * parseFloat(coupon.discount_value)) / 100);
          if (coupon.max_discount_amount) {
            discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
          }
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        return {
          valid: true,
          code: coupon.code,
          discount,
          discountType: coupon.discount_type,
          discountValue: parseFloat(coupon.discount_value),
          message: `Sacred Coupon ${coupon.code} applied! ₹${discount} discount.`
        };
      }
    }
  } catch (sbE) {}

  // 3. Fallback standard coupons
  const defaultCoupons = {
    'HAREKRISHNA': { type: 'percentage', val: 10, min: 199, desc: '10% off for all devotees' },
    'VRINDAVAN': { type: 'flat', val: 50, min: 299, desc: '₹50 off holy items' },
    'PRABHUPADA': { type: 'percentage', val: 15, min: 499, desc: '15% off shastra books' },
    'FIRST10': { type: 'percentage', val: 10, min: 99, desc: '10% off first order' }
  };

  const found = defaultCoupons[code];
  if (found) {
    if (subtotal < found.min) {
      return { valid: false, message: `Minimum order amount of ₹${found.min} required for ${code}.` };
    }
    const discount = found.type === 'percentage' ? Math.round((subtotal * found.val) / 100) : found.val;
    return {
      valid: true,
      code,
      discount,
      discountType: found.type,
      discountValue: found.val,
      message: `Coupon ${code} applied! ₹${discount} discount.`
    };
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
