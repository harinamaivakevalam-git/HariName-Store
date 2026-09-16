/**
 * HARINAMA STORE - Centralized Product Catalog & Categories Data
 * Complete Devotional Store: Sacred Books, Japa Malas, Keychains, Deities & Gift Sets
 */

const HARINAMA_DATA = {
  categories: [
    {
      id: 'cat-all',
      name: 'All Products',
      slug: 'all-products',
      count: 16
    },
    {
      id: 'cat-keychains',
      name: 'Devotional Keychains',
      slug: 'devotional-keychains',
      count: 8
    },
    {
      id: 'cat-books',
      name: 'Sacred Books & Shastras',
      slug: 'sacred-books',
      count: 3
    },
    {
      id: 'cat-japa',
      name: 'Japa & Chanting',
      slug: 'japa-chanting',
      count: 3
    },
    {
      id: 'cat-gifts',
      name: 'Gift Sets & Bundles',
      slug: 'gift-sets',
      count: 2
    }
  ],

  products: [
    // 1. Flagship Keychains
    {
      id: 'prod-001',
      name: 'Peacock Feather',
      title: 'Peacock Feather Keychain',
      slug: 'peacock-feather-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Acrylic',
      price: 99.00,
      old_price: 149.00,
      rating: 4.9,
      reviews_count: 24,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=800&q=80'
      ],
      description: "A beautiful symbol of Krishna's divine presence. Carry this peacock feather keychain as a daily reminder of His love and protection.",
      specifications: {
        'Material': 'Premium Hard Acrylic / High-Gloss Resin',
        'Ring & Chain': 'Solid Brass Gold Finish with Secure Clasp',
        'Dimensions': '6.5 cm x 3.2 cm',
        'Origin': 'Handcrafted in Vrindavan Dham'
      },
      stock: 45,
      featured: true
    },
    {
      id: 'prod-002',
      name: 'Krishna Flute',
      title: 'Krishna Flute Keychain (Solid Brass)',
      slug: 'krishna-flute-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Metal',
      price: 129.00,
      old_price: 179.00,
      rating: 4.8,
      reviews_count: 16,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      ],
      description: "The melodious Bansuri of Lord Krishna crafted in pure polished brass. Keeps the divine music of the spirit in your everyday walk.",
      specifications: {
        'Material': '100% Solid Cast Brass',
        'Finish': 'Polished Antique Gold with Ghungroo bells',
        'Length': '7.5 cm',
        'Origin': 'Artisan Crafted in Mathura'
      },
      stock: 32,
      featured: true
    },
    {
      id: 'prod-003',
      name: 'Maha-Mantra',
      title: 'Maha-Mantra Keychain (Hare Krishna)',
      slug: 'maha-mantra-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Metal',
      price: 149.00,
      old_price: 199.00,
      rating: 5.0,
      reviews_count: 52,
      image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Carry the Maha-Mantra with you. A simple everyday reminder to pause, remember Krishna, and chant. Deep navy enamel with gold lettering.",
      specifications: {
        'Material': 'Enamelled Brass & Gold Alloy',
        'Text Front': 'Hare Krishna with Peacock Feather Motif',
        'Text Back': 'Complete 16-word Maha-Mantra',
        'Diameter': '4.0 cm circular medallion'
      },
      stock: 60,
      featured: true
    },
    {
      id: 'prod-004',
      name: 'Radhe Radhe',
      title: 'Radhe Radhe Enamel Keychain',
      slug: 'radhe-radhe-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Acrylic',
      price: 129.00,
      old_price: 169.00,
      rating: 4.9,
      reviews_count: 31,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Infused with the sweet chanting vibrations of Vrindavan Dham. Soft pastel rose and gold enamel finish.",
      specifications: {
        'Material': 'High Grade Enamel & Acrylic',
        'Color': 'Pastel Rose & Gold',
        'Diameter': '3.8 cm'
      },
      stock: 28,
      featured: true
    },
    {
      id: 'prod-005',
      name: 'Krishna Silhouette',
      title: 'Krishna Silhouette Keychain',
      slug: 'krishna-silhouette-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Acrylic',
      price: 129.00,
      old_price: 179.00,
      rating: 4.8,
      reviews_count: 27,
      image: 'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Iconic midnight blue silhouette of Sri Krishna playing flute with gold border trim.",
      specifications: {
        'Material': 'Laser Cut Gloss Acrylic',
        'Color': 'Midnight Blue & Gold',
        'Height': '5.8 cm'
      },
      stock: 40,
      featured: true
    },
    {
      id: 'prod-006',
      name: 'Radha Lotus',
      title: 'Radha Lotus Keychain',
      slug: 'radha-lotus-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Metal',
      price: 129.00,
      old_price: 179.00,
      rating: 4.9,
      reviews_count: 19,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Golden lotus flower engraving representing Srimati Radharani's pure devotion and compassion.",
      specifications: {
        'Material': 'Solid Brass with Pink Lotus Inlay',
        'Dimensions': '4.2 cm x 3.8 cm'
      },
      stock: 35,
      featured: true
    },
    {
      id: 'prod-007',
      name: 'Govinda Sandalwood',
      title: 'Govinda Sacred Wood Keychain',
      slug: 'govinda-wooden-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Wood',
      price: 129.00,
      old_price: 169.00,
      rating: 4.8,
      reviews_count: 18,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Carved from natural fragrant sandalwood with 'Govinda' calligraphy in ancient Devanagari script.",
      specifications: {
        'Material': 'Natural Sacred Sandalwood',
        'Dimensions': '4.5 cm x 3.0 cm'
      },
      stock: 25,
      featured: false
    },
    {
      id: 'prod-008',
      name: 'Lotus Bloom',
      title: 'Lotus Bloom Keychain',
      slug: 'lotus-bloom-keychain',
      category: 'Devotional Keychains',
      category_slug: 'devotional-keychains',
      material: 'Acrylic',
      price: 99.00,
      old_price: 139.00,
      rating: 4.9,
      reviews_count: 22,
      image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Symbol of purity, transcendental devotion, and detachment from material illusion.",
      specifications: {
        'Material': 'Multi-layer Enamel & Acrylic',
        'Diameter': '3.5 cm'
      },
      stock: 50,
      featured: false
    },

    // 2. Sacred Books & Shastras
    {
      id: 'prod-011',
      name: 'Bhagavad Gita As It Is',
      title: 'Bhagavad Gita As It Is (Deluxe Hardbound Edition)',
      slug: 'bhagavad-gita-as-it-is-deluxe',
      category: 'Sacred Books & Shastras',
      category_slug: 'sacred-books',
      material: 'Hardbound Book',
      price: 349.00,
      old_price: 499.00,
      rating: 5.0,
      reviews_count: 148,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      ],
      description: "The complete Sanskrit text, Roman transliteration, word-for-word English equivalences, translation, and elaborate purports by A.C. Bhaktivedanta Swami Prabhupada.",
      specifications: {
        'Pages': '900+ Pages with color plates',
        'Binding': 'Gold Embossed Deluxe Hardcover',
        'Language': 'English / Sanskrit'
      },
      stock: 40,
      featured: true
    },
    {
      id: 'prod-012',
      name: 'Teachings of Queen Kunti',
      title: 'Teachings of Queen Kunti (Spiritual Classics)',
      slug: 'teachings-of-queen-kunti',
      category: 'Sacred Books & Shastras',
      category_slug: 'sacred-books',
      material: 'Paperback',
      price: 199.00,
      old_price: 275.00,
      rating: 4.9,
      reviews_count: 36,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Queen Kunti's heartfelt prayers of surrender, bhakti, and divine shelter amidst life's greatest tribulations.",
      specifications: {
        'Author': 'A.C. Bhaktivedanta Swami Prabhupada',
        'Pages': '240 Pages'
      },
      stock: 25,
      featured: false
    },
    {
      id: 'prod-013',
      name: 'Sri Isopanisad',
      title: 'Sri Isopanisad — The Knowledge That Brings One Nearer to the Supreme',
      slug: 'sri-isopanisad',
      category: 'Sacred Books & Shastras',
      category_slug: 'sacred-books',
      material: 'Pocket Book',
      price: 120.00,
      old_price: 160.00,
      rating: 5.0,
      reviews_count: 44,
      image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80'
      ],
      description: "One of the topmost Upanishads establishing the divine personality and universal ownership of Krishna.",
      specifications: {
        'Pages': '160 Pages',
        'Format': 'Pocket Devotional Edition'
      },
      stock: 35,
      featured: false
    },

    // 3. Japa & Chanting Essentials
    {
      id: 'prod-014',
      name: 'Neem Japa Mala',
      title: 'Sacred Neem Japa Mala (108 Chanting Beads)',
      slug: 'sacred-neem-japa-mala',
      category: 'Japa & Chanting',
      category_slug: 'japa-chanting',
      material: 'Sacred Neem Wood',
      price: 199.00,
      old_price: 280.00,
      rating: 5.0,
      reviews_count: 89,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Hand-carved 108 beads from sacred Neem wood with Meru bead and counter tassel. Perfect for daily Maha-Mantra japa.",
      specifications: {
        'Beads Count': '108 + 1 Guru Bead',
        'Cord': 'Durable Pure Cotton Twine',
        'Origin': 'Mayapur Dham'
      },
      stock: 50,
      featured: true
    },
    {
      id: 'prod-015',
      name: 'Embroidered Bead Bag',
      title: 'Embroidered Hare Krishna Japa Bead Bag (Gomukhi)',
      slug: 'embroidered-japa-bead-bag',
      category: 'Japa & Chanting',
      category_slug: 'japa-chanting',
      material: 'Pure Cotton',
      price: 149.00,
      old_price: 220.00,
      rating: 4.9,
      reviews_count: 62,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Traditional cotton Gomukhi japa bag with Hare Krishna Maha-Mantra embroidered in gold thread. Features inner zipper pocket for counting beads.",
      specifications: {
        'Material': '100% Breathable Cotton',
        'Color': 'Saffron / Navy with Gold Zari'
      },
      stock: 45,
      featured: true
    },
    {
      id: 'prod-016',
      name: 'Tulasi Japa Mala (Silver Caps)',
      title: 'Authentic Vrindavan Tulasi Japa Mala with Silver Caps',
      slug: 'vrindavan-tulasi-japa-mala',
      category: 'Japa & Chanting',
      category_slug: 'japa-chanting',
      material: 'Sacred Tulasi Wood',
      price: 499.00,
      old_price: 699.00,
      rating: 5.0,
      reviews_count: 58,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Made from naturally seasoned Vrindavan Tulasi stems, hand-knotted between each bead with sterling silver caps on the Guru bead.",
      specifications: {
        'Material': 'Vrindavan Tulasi Wood & 925 Silver',
        'Beads': '108 Knotted Beads'
      },
      stock: 18,
      featured: true
    },

    // 4. Gift Sets & Bundles
    {
      id: 'prod-009',
      name: '3-Keychain Gift Set',
      title: '3-Keychain Devotional Gift Set',
      slug: '3-keychain-gift-set',
      category: 'Gift Sets & Bundles',
      category_slug: 'gift-sets',
      material: 'Metal & Acrylic',
      price: 299.00,
      old_price: 357.00,
      save_amount: 58,
      rating: 5.0,
      reviews_count: 42,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Includes Peacock Feather, Maha-Mantra, and Krishna Flute in a luxury satin-lined gift box with holy blessings card.",
      specifications: {
        'Set Contains': '3 Mastercrafted Keychains',
        'Packaging': 'Deluxe Gold Embossed Gift Box'
      },
      stock: 20,
      featured: true
    },
    {
      id: 'prod-010',
      name: '5-Keychain Collection',
      title: '5-Keychain Complete Collection Set',
      slug: '5-keychain-collection-set',
      category: 'Gift Sets & Bundles',
      category_slug: 'gift-sets',
      material: 'Metal & Acrylic',
      price: 499.00,
      old_price: 645.00,
      save_amount: 146,
      rating: 5.0,
      reviews_count: 64,
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      ],
      description: "Complete Harinama reminder gift box containing all 5 flagship designs: Peacock Feather, Maha-Mantra, Flute, Radhe Radhe, and Radha Lotus.",
      specifications: {
        'Set Contains': '5 Flagship Keychains',
        'Packaging': 'Collector Wood Finish Display Box'
      },
      stock: 15,
      featured: true
    }
  ]
};

// Expose alias for compatibility
const CRESCENDO_DATA = HARINAMA_DATA;

// Retain initial static products for robust fallbacks
HARINAMA_DATA._staticProducts = [...HARINAMA_DATA.products];
HARINAMA_DATA._staticCategories = [...HARINAMA_DATA.categories];

// Dynamic Sync with Live Supabase & Admin API
HARINAMA_DATA.syncWithApi = async function() {
  try {
    const SUPABASE_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';

    // 1. Clean up stale browser storage so it never overrides database
    try {
      localStorage.removeItem('harinama_admin_products');
      localStorage.removeItem('harinama_admin_categories');
      localStorage.removeItem('harinama_admin_coupons');
    } catch (e) {}

    let databaseLoaded = false;

    // 2. Fetch live from Backend API (reads directly from Supabase PostgreSQL)
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        fetch('/api/products?limit=100').then(r => r.json()),
        fetch('/api/categories').then(r => r.json())
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
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

      if (catRes.status === 'fulfilled' && catRes.value && catRes.value.success && Array.isArray(catRes.value.data) && catRes.value.data.length > 0) {
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

          if (prodSbRes.status === 'fulfilled' && !prodSbRes.value.error && Array.isArray(prodSbRes.value.data) && prodSbRes.value.data.length > 0) {
            HARINAMA_DATA.products = prodSbRes.value.data.map(p => {
              const imgList = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.image_url);
              const img = imgList[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
              return {
                id: p.id,
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

          if (catSbRes.status === 'fulfilled' && !catSbRes.value.error && Array.isArray(catSbRes.value.data) && catSbRes.value.data.length > 0) {
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
  } catch (err) {
    console.warn('[HARINAMA_DATA] Could not sync with live API, retaining offline catalog:', err);
  }
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

  // 3. Fallback standard codes
  const fallbackCoupons = {
    'WELCOME10': { type: 'fixed', value: 50, min: 199 },
    'KRISHNA50': { type: 'fixed', value: 50, min: 249 },
    'RADHA100': { type: 'fixed', value: 100, min: 499 },
    'FESTIVAL20': { type: 'percentage', value: 20, min: 299 }
  };

  const fCoupon = fallbackCoupons[code];
  if (fCoupon) {
    if (subtotal > 0 && subtotal < fCoupon.min) {
      return { valid: false, message: `Minimum order of ₹${fCoupon.min} required for coupon ${code}.` };
    }
    const discount = fCoupon.type === 'percentage' ? Math.round((subtotal * fCoupon.value) / 100) : fCoupon.value;
    return {
      valid: true,
      code,
      discount,
      discountType: fCoupon.type,
      discountValue: fCoupon.value,
      message: `Coupon ${code} applied! ₹${discount} discount.`
    };
  }

  return { valid: false, message: `Invalid or expired coupon code "${code}".` };
};

// Immediately invoke API sync in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HARINAMA_DATA.syncWithApi());
  } else {
    HARINAMA_DATA.syncWithApi();
  }
}

