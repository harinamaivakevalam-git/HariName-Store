/**
 * HARINAMA STORE - Centralized Product Catalog & Live Database Sync
 * Pre-seeded with authentic store catalog and synced in real-time with Supabase PostgreSQL & Admin Portal.
 */

const HARINAMA_AUTHENTIC_PRODUCTS = [
  {
    id: 'a0000001-0000-0000-0000-000000000012',
    name: '3-Keychain Gift Set',
    title: '3-Keychain Devotional Gift Set',
    slug: '3-keychain-gift-set',
    category: 'Gift Sets & Bundles',
    category_slug: 'gift-sets',
    sku: 'HN-GS-001',
    material: 'Metal & Acrylic',
    price: 299.00,
    old_price: 357.00,
    compare_price: 357.00,
    stock: 20,
    rating: 5.0,
    reviews_count: 42,
    featured: true,
    trending: true,
    status: 'active',
    description: "Includes Peacock Feather, Maha-Mantra, and Krishna Flute in a luxury satin-lined gift box with holy blessings card.",
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000016',
    name: 'Neem Japa Mala',
    title: 'Sacred Neem Japa Mala (108 Chanting Beads)',
    slug: 'sacred-neem-japa-mala',
    category: 'Japa & Chanting',
    category_slug: 'japa-chanting',
    sku: 'HN-JP-001',
    material: 'Sacred Neem Wood',
    price: 199.00,
    old_price: 280.00,
    compare_price: 280.00,
    stock: 50,
    rating: 5.0,
    reviews_count: 89,
    featured: true,
    trending: true,
    status: 'active',
    description: "Hand-carved 108 beads from sacred Neem wood with Meru bead and counter tassel. Perfect for daily Maha-Mantra japa.",
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000017',
    name: 'Embroidered Bead Bag',
    title: 'Embroidered Hare Krishna Japa Bead Bag (Gomukhi)',
    slug: 'embroidered-japa-bead-bag',
    category: 'Japa & Chanting',
    category_slug: 'japa-chanting',
    sku: 'HN-JP-002',
    material: 'Pure Cotton',
    price: 149.00,
    old_price: 220.00,
    compare_price: 220.00,
    stock: 45,
    rating: 4.9,
    reviews_count: 62,
    featured: true,
    trending: false,
    status: 'active',
    description: "Traditional cotton Gomukhi japa bag with Hare Krishna Maha-Mantra embroidered in gold thread. Features inner zipper pocket.",
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000015',
    name: 'Sri Isopanisad',
    title: 'Sri Isopanisad — The Knowledge That Brings One Nearer to the Supreme',
    slug: 'sri-isopanisad',
    category: 'Sacred Books & Shastras',
    category_slug: 'sacred-books',
    sku: 'HN-BK-003',
    material: 'Pocket Book',
    price: 120.00,
    old_price: 160.00,
    compare_price: 160.00,
    stock: 35,
    rating: 5.0,
    reviews_count: 44,
    featured: false,
    trending: false,
    status: 'active',
    description: "One of the topmost Upanishads establishing the divine personality and universal ownership of Krishna.",
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000014',
    name: 'Teachings of Queen Kunti',
    title: 'Teachings of Queen Kunti (Spiritual Classics)',
    slug: 'teachings-of-queen-kunti',
    category: 'Sacred Books & Shastras',
    category_slug: 'sacred-books',
    sku: 'HN-BK-002',
    material: 'Paperback',
    price: 199.00,
    old_price: 275.00,
    compare_price: 275.00,
    stock: 25,
    rating: 4.9,
    reviews_count: 36,
    featured: false,
    trending: false,
    status: 'active',
    description: "Queen Kunti's heartfelt prayers of surrender, bhakti, and divine shelter amidst life's greatest tribulations.",
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000013',
    name: '5-Keychain Collection',
    title: '5-Keychain Complete Collection Set',
    slug: '5-keychain-collection-set',
    category: 'Gift Sets & Bundles',
    category_slug: 'gift-sets',
    sku: 'HN-GS-002',
    material: 'Metal & Acrylic',
    price: 499.00,
    old_price: 645.00,
    compare_price: 645.00,
    stock: 15,
    rating: 5.0,
    reviews_count: 64,
    featured: true,
    trending: true,
    status: 'active',
    description: "Complete Harinama reminder gift box containing all 5 flagship designs: Peacock Feather, Maha-Mantra, Flute, Radhe Radhe, and Radha Lotus.",
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Peacock Feather',
    title: 'Peacock Feather Keychain',
    slug: 'peacock-feather-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-001',
    material: 'Acrylic',
    price: 99.00,
    old_price: 149.00,
    compare_price: 149.00,
    stock: 45,
    rating: 4.9,
    reviews_count: 24,
    featured: true,
    trending: true,
    status: 'active',
    description: "A beautiful symbol of Krishna's divine presence. Carry this peacock feather keychain as a daily reminder of His love and protection.",
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    name: 'Krishna Flute',
    title: 'Krishna Flute Keychain (Solid Brass)',
    slug: 'krishna-flute-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-002',
    material: 'Metal',
    price: 129.00,
    old_price: 179.00,
    compare_price: 179.00,
    stock: 32,
    rating: 4.8,
    reviews_count: 16,
    featured: true,
    trending: false,
    status: 'active',
    description: "The melodious Bansuri of Lord Krishna crafted in pure polished brass. Keeps the divine music of the spirit in your everyday walk.",
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    name: 'Maha-Mantra',
    title: 'Maha-Mantra Keychain (Hare Krishna)',
    slug: 'maha-mantra-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-003',
    material: 'Metal',
    price: 149.00,
    old_price: 199.00,
    compare_price: 199.00,
    stock: 60,
    rating: 5.0,
    reviews_count: 31,
    featured: true,
    trending: true,
    status: 'active',
    description: "Engraved with the transcendental 16 words: Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare / Hare Rama, Hare Rama, Rama Rama, Hare Hare.",
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    name: 'Radhe Radhe',
    title: 'Radhe Radhe Enamel Keychain',
    slug: 'radhe-radhe-enamel-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-004',
    material: 'Enamel',
    price: 129.00,
    old_price: 169.00,
    compare_price: 169.00,
    stock: 28,
    rating: 4.9,
    reviews_count: 19,
    featured: false,
    trending: true,
    status: 'active',
    description: "Call upon the queen of Vrindavan, Srimati Radharani. Vibrant hard enamel calligraphy with glossy protective clearcoat.",
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000005',
    name: 'Baby Krishna (Makhan Chor)',
    title: 'Baby Krishna Makhan Chor Keychain',
    slug: 'baby-krishna-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-005',
    material: 'Acrylic',
    price: 99.00,
    old_price: 149.00,
    compare_price: 149.00,
    stock: 35,
    rating: 4.8,
    reviews_count: 14,
    featured: false,
    trending: false,
    status: 'active',
    description: "Adorable Gopal with his butter pot! Hand-drawn devotional illustration sealed inside diamond-cut crystal acrylic.",
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000006',
    name: 'Bhagavad Gita As It Is',
    title: 'Bhagavad Gita As It Is (Deluxe Hardbound Edition)',
    slug: 'bhagavad-gita-as-it-is',
    category: 'Sacred Books & Shastras',
    category_slug: 'sacred-books',
    sku: 'HN-BK-001',
    material: 'Hardbound Book',
    price: 299.00,
    old_price: 499.00,
    compare_price: 499.00,
    stock: 40,
    rating: 5.0,
    reviews_count: 148,
    featured: true,
    trending: true,
    status: 'active',
    description: "The complete Sanskrit text, Roman transliteration, word-for-word English equivalences, translation, and elaborate purports by A.C. Bhaktivedanta Swami Prabhupada.",
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000009',
    name: 'Radha Krishna Silhouette',
    title: 'Radha Krishna Silhouette Cutout Keychain',
    slug: 'radha-krishna-silhouette-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-006',
    material: 'Wood',
    price: 119.00,
    old_price: 159.00,
    compare_price: 159.00,
    stock: 22,
    rating: 4.7,
    reviews_count: 11,
    featured: false,
    trending: false,
    status: 'active',
    description: "Intricate laser-cut silhouette of the Divine Couple standing beneath the sacred Kadamba tree in Vrindavan.",
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000010',
    name: 'Govinda Sacred Wood',
    title: 'Govinda Sacred Wood Keychain',
    slug: 'govinda-wooden-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-007',
    material: 'Wood',
    price: 129.00,
    old_price: 169.00,
    compare_price: 169.00,
    stock: 25,
    rating: 4.8,
    reviews_count: 18,
    featured: false,
    trending: false,
    status: 'active',
    description: "Carved from natural fragrant sandalwood with 'Govinda' calligraphy in ancient Devanagari script.",
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000011',
    name: 'Lotus Bloom',
    title: 'Lotus Bloom Keychain',
    slug: 'lotus-bloom-keychain',
    category: 'Devotional Keychains',
    category_slug: 'devotional-keychains',
    sku: 'HN-KC-008',
    material: 'Acrylic',
    price: 99.00,
    old_price: 139.00,
    compare_price: 139.00,
    stock: 50,
    rating: 4.9,
    reviews_count: 22,
    featured: false,
    trending: false,
    status: 'active',
    description: "Symbol of purity, transcendental devotion, and detachment from material illusion.",
    image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'a0000001-0000-0000-0000-000000000007',
    name: 'Authentic Tulasi Japa Mala',
    title: 'Authentic Vrindavan Tulasi Japa Mala with Silver Caps',
    slug: 'authentic-tulasi-japa-mala',
    category: 'Japa & Chanting',
    category_slug: 'japa-chanting',
    sku: 'HN-JP-003',
    material: 'Sacred Tulasi Wood',
    price: 249.00,
    old_price: 350.00,
    compare_price: 350.00,
    stock: 30,
    rating: 5.0,
    reviews_count: 51,
    featured: true,
    trending: false,
    status: 'active',
    description: "Hand-turned 108 beads from auspicious Tulasi wood grown in Vrindavan Dham. Finished with ornate silver end caps.",
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    primary_image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

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
