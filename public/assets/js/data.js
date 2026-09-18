/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

const HARINAMA_AUTHENTIC_PRODUCTS = [
  {
    id: 'prod-001',
    sku: 'HN-FLUTE-001',
    name: 'Krishna Flute Keychain',
    title: 'Krishna Flute Keychain',
    slug: 'krishna-flute-keychain',
    category: 'Keychains',
    category_slug: 'keychains',
    material: 'Brass & Enamel',
    price: 499,
    compare_price: 699,
    old_price: 699,
    stock: 50,
    rating: 5.0,
    reviews_count: 38,
    image: '/assets/images/cat_keychains.jpg',
    primary_image: '/assets/images/cat_keychains.jpg',
    images: ['/assets/images/cat_keychains.jpg'],
    gallery: ['/assets/images/cat_keychains.jpg'],
    description: 'Exquisite solid cast brass Krishna flute keychain with sacred peacock feather charm and Hare Krishna engraved gold pendant.',
    featured: true,
    trending: true
  },
  {
    id: 'prod-002',
    sku: 'HN-MALA-002',
    name: 'Authentic Tulsi Japa Mala (108 Beads)',
    title: 'Authentic Tulsi Japa Mala (108 Beads)',
    slug: 'authentic-tulsi-japa-mala-108',
    category: 'Tulsi Japa Mala',
    category_slug: 'tulsi-japa-mala',
    material: 'Authentic Tulsi Wood',
    price: 699,
    compare_price: 899,
    old_price: 899,
    stock: 45,
    rating: 5.0,
    reviews_count: 52,
    image: '/assets/images/cat_japa_malas.jpg',
    primary_image: '/assets/images/cat_japa_malas.jpg',
    images: ['/assets/images/cat_japa_malas.jpg'],
    gallery: ['/assets/images/cat_japa_malas.jpg'],
    description: 'Sacred 108 beads Vrindavan Tulsi Japa Mala with hand-carved guru bead and cotton tassel for divine chanting.',
    featured: true,
    trending: true
  },
  {
    id: 'prod-003',
    sku: 'HN-GITA-003',
    name: 'Bhagavad Gita As It Is (Deluxe Edition)',
    title: 'Bhagavad Gita As It Is (Deluxe Edition)',
    slug: 'bhagavad-gita-as-it-is-deluxe',
    category: 'Spiritual Books',
    category_slug: 'spiritual-books',
    material: 'Hardcover Gold Embossed',
    price: 399,
    compare_price: 550,
    old_price: 550,
    stock: 60,
    rating: 5.0,
    reviews_count: 94,
    image: '/assets/images/cat_books.jpg',
    primary_image: '/assets/images/cat_books.jpg',
    images: ['/assets/images/cat_books.jpg'],
    gallery: ['/assets/images/cat_books.jpg'],
    description: 'Complete deluxe edition of Bhagavad Gita As It Is with original Sanskrit text, Roman transliteration, and elaborate purports.',
    featured: true,
    trending: true
  },
  {
    id: 'prod-004',
    sku: 'HN-DEITY-004',
    name: 'Radha Krishna Brass Deity Set (7 Inches)',
    title: 'Radha Krishna Brass Deity Set (7 Inches)',
    slug: 'radha-krishna-brass-deity-set',
    category: 'Deity Statues',
    category_slug: 'deity-statues',
    material: 'Solid Polished Brass',
    price: 4499,
    compare_price: 5999,
    old_price: 5999,
    stock: 12,
    rating: 4.9,
    reviews_count: 34,
    image: '/assets/images/cat_deity_statues.jpg',
    primary_image: '/assets/images/cat_deity_statues.jpg',
    images: ['/assets/images/cat_deity_statues.jpg'],
    gallery: ['/assets/images/cat_deity_statues.jpg'],
    description: 'Exquisite hand-sculpted Radha Krishna brass deity murti set with intricate facial features and peaceful divine smiles.',
    featured: true,
    trending: false
  },
  {
    id: 'prod-005',
    sku: 'HN-BAG-005',
    name: 'Embroidered Silk Japa Bead Bag',
    title: 'Embroidered Silk Japa Bead Bag',
    slug: 'embroidered-silk-japa-bead-bag',
    category: 'Japa Bags',
    category_slug: 'japa-bags',
    material: 'Raw Silk & Cotton',
    price: 349,
    compare_price: 499,
    old_price: 499,
    stock: 60,
    rating: 4.8,
    reviews_count: 29,
    image: '/assets/images/cat_japa_bags.jpg',
    primary_image: '/assets/images/cat_japa_bags.jpg',
    images: ['/assets/images/cat_japa_bags.jpg'],
    gallery: ['/assets/images/cat_japa_bags.jpg'],
    description: 'Handcrafted embroidered cotton and silk sacred bead bag for comfortable daily japa chanting and bead protection.',
    featured: false,
    trending: true
  },
  {
    id: 'prod-006',
    sku: 'HN-GIFT-006',
    name: 'Devotional Keepsake Spiritual Gift Box',
    title: 'Devotional Keepsake Spiritual Gift Box',
    slug: 'devotional-keepsake-spiritual-gift-box',
    category: 'Spiritual Gifts',
    category_slug: 'spiritual-gifts',
    material: 'Curated Gift Hamper',
    price: 1299,
    compare_price: 1799,
    old_price: 1799,
    stock: 25,
    rating: 5.0,
    reviews_count: 47,
    image: '/assets/images/cat_spiritual_gifts.jpg',
    primary_image: '/assets/images/cat_spiritual_gifts.jpg',
    images: ['/assets/images/cat_spiritual_gifts.jpg'],
    gallery: ['/assets/images/cat_spiritual_gifts.jpg'],
    description: 'A curated spiritual keepsake box featuring authentic Vrindavan Tulsi beads, sacred Krishna keychain, and devotional mantra card.',
    featured: true,
    trending: true
  }
];

const HARINAMA_BASE_AUTHENTIC_COLLECTIONS = [
  { id: 'c0000001-0000-0000-0000-000000000001', name: 'Japa Malas', slug: 'japa-malas', desc: 'Authentic Vrindavan Tulasi & Neem meditation prayer beads.', image: '/assets/images/cat_japa_malas.jpg' },
  { id: 'c0000001-0000-0000-0000-000000000002', name: 'Keychains', slug: 'keychains', desc: 'Handcrafted acrylic, enamel, and brass devotional keychains.', image: '/assets/images/cat_keychains.jpg' },
  { id: 'c0000001-0000-0000-0000-000000000003', name: 'Books', slug: 'books', desc: 'Authentic Vedic scriptures, Bhagavad Gita, and sacred philosophy.', image: '/assets/images/cat_books.jpg' },
  { id: 'c0000001-0000-0000-0000-000000000004', name: 'Deity Statues', slug: 'deity-statues', desc: 'Exquisite brass and marble finish sacred deity statues.', image: '/assets/images/cat_deity_statues.jpg' },
  { id: 'c0000001-0000-0000-0000-000000000005', name: 'Japa Bags', slug: 'japa-bags', desc: 'Embroidered cotton and silk sacred bead bags for chanting.', image: '/assets/images/cat_japa_bags.jpg' },
  { id: 'c0000001-0000-0000-0000-000000000006', name: 'Spiritual Gifts', slug: 'spiritual-gifts', desc: 'Curated spiritual gift hampers, keepsakes and divine gifts.', image: '/assets/images/cat_spiritual_gifts.jpg' }
];

// Dynamic Category Counts based on Database Categories & Products
function computeCategoryCounts(productsList, dbCategories = null) {
  let catList = [];
  if (Array.isArray(dbCategories) && dbCategories.length > 0) {
    catList = [...dbCategories];
  } else {
    catList = [...HARINAMA_BASE_AUTHENTIC_COLLECTIONS];
  }

  // Ensure "All Products" is at the start
  if (!catList.some(c => c.slug === 'all-products' || c.id === 'cat-all')) {
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

// Get initial cached products if admin modified them
function getInitialProducts() {
  try {
    const saved = localStorage.getItem('hn_live_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...HARINAMA_AUTHENTIC_PRODUCTS];
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
      fetch('/api/products?limit=100').then(r => r.json()),
      fetch('/api/categories').then(r => r.json())
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

  // 2. Direct Supabase Query fallback
  if (!databaseLoaded) {
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        const sb = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = sb;

        const [prodResult, catResult] = await Promise.allSettled([
          sb.from('products').select('*, product_images(*), categories(id, name, slug)').order('created_at', { ascending: false }),
          sb.from('categories').select('*').eq('status', 'active').order('sort_order', { ascending: true })
        ]);

        if (catResult.status === 'fulfilled' && !catResult.value.error && Array.isArray(catResult.value.data)) {
          fetchedCategories = catResult.value.data.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            desc: c.description || 'Sacred collection',
            image: resolveCategoryImage(c)
          }));
        }

        if (prodResult.status === 'fulfilled' && !prodResult.value.error && Array.isArray(prodResult.value.data)) {
          const data = prodResult.value.data;
          fetchedProducts = data.map(p => {
            const imgList = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.image_url);
            const img = imgList[0] || p.primary_image || '';
            return {
              id: p.id,
              sku: p.sku,
              name: p.name,
              title: p.title || p.name,
              slug: p.slug,
              category: p.categories?.name || p.category || 'Devotional Items',
              category_id: p.category_id || p.categories?.id,
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
              images: imgList.length > 0 ? imgList : (img ? [img] : []),
              gallery: imgList.length > 0 ? imgList : (img ? [img] : []),
              description: p.description || '',
              featured: Boolean(p.featured),
              trending: Boolean(p.trending)
            };
          });
          HARINAMA_DATA.products = fetchedProducts;
          HARINAMA_DATA.categories = computeCategoryCounts(fetchedProducts, fetchedCategories);
          HARINAMA_DATA.isLoaded = true;
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
