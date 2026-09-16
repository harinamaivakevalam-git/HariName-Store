/**
 * HARINAMA STORE - Centralized Product Catalog & Categories Data
 * 100% Live Database-Driven Catalog (No hardcoded dummy products)
 */

const HARINAMA_DATA = {
  categories: [],
  products: []
};

// Expose alias for backwards compatibility
const CRESCENDO_DATA = HARINAMA_DATA;

// Universal Product Resolver (by database UUID, slug, or SKU)
HARINAMA_DATA.getProductById = function(id) {
  if (!id) return null;
  const cleanId = String(id).trim().toLowerCase();
  return HARINAMA_DATA.products.find(p => 
    String(p.id).toLowerCase() === cleanId || 
    String(p.slug).toLowerCase() === cleanId || 
    String(p.legacy_id || '').toLowerCase() === cleanId
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

  // 1. Clean up stale browser storage so it never overrides database
  try {
    localStorage.removeItem('harinama_admin_products');
    localStorage.removeItem('harinama_admin_categories');
    localStorage.removeItem('harinama_admin_coupons');
  } catch (e) {}

  let databaseLoaded = false;

  // 2. Fetch live from Backend API
  try {
    const [prodRes, catRes] = await Promise.allSettled([
      fetch('/api/products?limit=100').then(r => r.json()),
      fetch('/api/categories').then(r => r.json())
    ]);

    if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data)) {
      HARINAMA_DATA.products = prodRes.value.data.map((p, idx) => ({
        id: p.id,
        legacy_id: p.sku || `prod-${String(idx + 1).padStart(3, '0')}`,
        name: p.name,
        title: p.title || p.name,
        slug: p.slug,
        category: p.category_name || p.category || 'Devotional Items',
        category_slug: p.category_slug || '',
        material: p.material || 'Sacred Material',
        price: parseFloat(p.price) || 0,
        old_price: p.compare_price ? parseFloat(p.compare_price) : null,
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        save_amount: (p.compare_price && p.compare_price > p.price) ? Math.round(p.compare_price - p.price) : 0,
        rating: parseFloat(p.rating) || 5.0,
        reviews_count: p.reviews_count || 0,
        image: p.primary_image || p.image,
        primary_image: p.primary_image || p.image,
        secondary_image: p.secondary_image || p.primary_image || p.image,
        gallery: (p.images && p.images.length > 0) ? p.images.map(img => (typeof img === 'string' ? img : (img.image_url || img.url))) : [p.primary_image || p.image],
        description: p.description || '',
        short_description: p.short_description || '',
        specifications: p.specifications || {},
        stock: p.stock !== undefined ? p.stock : 10,
        featured: Boolean(p.featured),
        trending: Boolean(p.trending),
        variants: p.variants || []
      }));
      databaseLoaded = true;
    }

    if (catRes.status === 'fulfilled' && catRes.value && catRes.value.success && Array.isArray(catRes.value.data)) {
      const allCount = HARINAMA_DATA.products.length;
      HARINAMA_DATA.categories = [
        { id: 'cat-all', name: 'All Products', slug: 'all-products', count: allCount },
        ...catRes.value.data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c.product_count !== undefined ? c.product_count : (c.count || 0),
          desc: c.description || '',
          image: c.image || c.image_url
        }))
      ];
    }
  } catch (apiErr) {
    console.warn('[HARINAMA_DATA] API fetch notice, trying direct Supabase query:', apiErr);
  }

  // 3. Direct Supabase client query fallback
  if (!databaseLoaded) {
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        const sb = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = sb;

        const [prodSbRes, catSbRes] = await Promise.allSettled([
          sb.from('products').select('*, product_images(*), categories(id, name, slug)').eq('status', 'active').order('created_at', { ascending: false }),
          sb.from('categories').select('*').eq('status', 'active').order('sort_order', { ascending: true })
        ]);

        if (prodSbRes.status === 'fulfilled' && !prodSbRes.value.error && Array.isArray(prodSbRes.value.data)) {
          HARINAMA_DATA.products = prodSbRes.value.data.map((p, idx) => {
            const imgList = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.image_url);
            const img = imgList[0] || p.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
            return {
              id: p.id,
              legacy_id: p.sku || `prod-${String(idx + 1).padStart(3, '0')}`,
              name: p.name,
              title: p.title || p.name,
              slug: p.slug,
              category: p.categories?.name || 'Devotional Items',
              category_slug: p.categories?.slug || 'devotional-keychains',
              material: p.material || 'Sacred Material',
              price: parseFloat(p.price) || 0,
              old_price: p.compare_price ? parseFloat(p.compare_price) : null,
              compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
              rating: parseFloat(p.rating) || 5.0,
              reviews_count: p.reviews_count || 0,
              image: img,
              primary_image: img,
              gallery: imgList.length > 0 ? imgList : [img],
              description: p.description || '',
              stock: p.stock !== undefined ? p.stock : 25,
              featured: Boolean(p.featured),
              trending: Boolean(p.trending)
            };
          });
          databaseLoaded = true;
        }

        if (catSbRes.status === 'fulfilled' && !catSbRes.value.error && Array.isArray(catSbRes.value.data)) {
          HARINAMA_DATA.categories = [
            { id: 'cat-all', name: 'All Products', slug: 'all-products', count: HARINAMA_DATA.products.length },
            ...catSbRes.value.data.map(c => {
              const count = HARINAMA_DATA.products.filter(p => p.category === c.name || p.category_slug === c.slug).length;
              return {
                id: c.id,
                name: c.name,
                slug: c.slug,
                count: count,
                desc: c.description || '',
                image: c.image
              };
            })
          ];
        }
      }
    } catch (sbE) {
      console.warn('[HARINAMA_DATA] Direct Supabase query error:', sbE);
    }
  }

  // Notify pages that live catalog data is ready
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
        // Expiry check
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          return { valid: false, message: `Coupon ${code} has expired.` };
        }

        // Minimum order check
        const minOrder = parseFloat(coupon.minimum_order) || 0;
        if (subtotal > 0 && subtotal < minOrder) {
          return { valid: false, message: `Minimum order of ₹${minOrder} required for coupon ${code}.` };
        }

        let discount = 0;
        const discVal = parseFloat(coupon.discount_value) || 0;
        if (coupon.discount_type === 'percentage') {
          discount = Math.round((subtotal * discVal) / 100);
          if (coupon.maximum_discount && discount > parseFloat(coupon.maximum_discount)) {
            discount = parseFloat(coupon.maximum_discount);
          }
        } else {
          discount = discVal;
        }

        if (subtotal > 0 && discount > subtotal) {
          discount = subtotal;
        }

        return {
          valid: true,
          code: coupon.code,
          discount: discount,
          discountType: coupon.discount_type,
          discountValue: discVal,
          message: `Coupon ${coupon.code} applied! ₹${discount} discount.`
        };
      }
    }
  } catch (sbErr) {}

  return { valid: false, message: `Invalid or expired coupon code "${code}".` };
};

// Helper for finding product across the store
function findCatalogProduct(idOrSlug) {
  return HARINAMA_DATA.getProductById(idOrSlug) || HARINAMA_DATA.getProductBySlug(idOrSlug);
}
window.findCatalogProduct = findCatalogProduct;

// Immediately invoke API sync in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HARINAMA_DATA.syncWithApi());
  } else {
    HARINAMA_DATA.syncWithApi();
  }
}
