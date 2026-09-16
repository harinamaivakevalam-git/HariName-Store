const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

if (!isSupabaseConfigured || !supabaseAdmin) {
  console.error('Supabase is not configured. Exiting.');
  process.exit(1);
}

const CAT_MAP = {
  'Devotional Keychains': 'c0000001-0000-0000-0000-000000000001',
  'devotional-keychains': 'c0000001-0000-0000-0000-000000000001',
  'Sacred Books & Shastras': 'c0000001-0000-0000-0000-000000000002',
  'sacred-books': 'c0000001-0000-0000-0000-000000000002',
  'Japa & Chanting': 'c0000001-0000-0000-0000-000000000003',
  'japa-chanting': 'c0000001-0000-0000-0000-000000000003',
  'Gift Sets & Bundles': 'c0000001-0000-0000-0000-000000000004',
  'gift-sets': 'c0000001-0000-0000-0000-000000000004'
};

const BRAND_MAP = {
  'Devotional Keychains': 'b0000001-0000-0000-0000-000000000001',
  'Sacred Books & Shastras': 'b0000001-0000-0000-0000-000000000002',
  'Japa & Chanting': 'b0000001-0000-0000-0000-000000000003',
  'Gift Sets & Bundles': 'b0000001-0000-0000-0000-000000000001'
};

const products = [
  // 1. Peacock Feather
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Peacock Feather',
    title: 'Peacock Feather Keychain',
    slug: 'peacock-feather-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-001',
    material: 'Acrylic',
    price: 99.00,
    compare_price: 149.00,
    stock: 45,
    rating: 4.9,
    reviews_count: 24,
    featured: true,
    trending: true,
    status: 'active',
    description: "A beautiful symbol of Krishna's divine presence. Carry this peacock feather keychain as a daily reminder of His love and protection.",
    specifications: {
      'Material': 'Premium Hard Acrylic / High-Gloss Resin',
      'Ring & Chain': 'Solid Brass Gold Finish with Secure Clasp',
      'Dimensions': '6.5 cm x 3.2 cm',
      'Origin': 'Handcrafted in Vrindavan Dham'
    },
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=800&q=80'
    ]
  },
  // 2. Krishna Flute
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    name: 'Krishna Flute',
    title: 'Krishna Flute Keychain (Solid Brass)',
    slug: 'krishna-flute-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-002',
    material: 'Metal',
    price: 129.00,
    compare_price: 179.00,
    stock: 32,
    rating: 4.8,
    reviews_count: 16,
    featured: true,
    trending: false,
    status: 'active',
    description: "The melodious Bansuri of Lord Krishna crafted in pure polished brass. Keeps the divine music of the spirit in your everyday walk.",
    specifications: {
      'Material': '100% Solid Cast Brass',
      'Finish': 'Polished Antique Gold with Ghungroo bells',
      'Length': '7.5 cm',
      'Origin': 'Artisan Crafted in Mathura'
    },
    images: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 3. Maha-Mantra
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    name: 'Maha-Mantra',
    title: 'Maha-Mantra Keychain (Hare Krishna)',
    slug: 'maha-mantra-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-003',
    material: 'Metal',
    price: 149.00,
    compare_price: 199.00,
    stock: 60,
    rating: 5.0,
    reviews_count: 31,
    featured: true,
    trending: true,
    status: 'active',
    description: "Engraved with the transcendental 16 words: Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare / Hare Rama, Hare Rama, Rama Rama, Hare Hare.",
    specifications: {
      'Material': 'Laser-Engraved Stainless Steel & Brass Trim',
      'Script': 'Devanagari Sanskrit & English Phonetic',
      'Weight': '38 grams'
    },
    images: [
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 4. Radhe Radhe
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    name: 'Radhe Radhe',
    title: 'Radhe Radhe Enamel Keychain',
    slug: 'radhe-radhe-enamel-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-004',
    material: 'Enamel',
    price: 129.00,
    compare_price: 169.00,
    stock: 28,
    rating: 4.9,
    reviews_count: 19,
    featured: false,
    trending: true,
    status: 'active',
    description: "Call upon the queen of Vrindavan, Srimati Radharani. Vibrant hard enamel calligraphy with glossy protective clearcoat.",
    specifications: {
      'Material': 'Cloisonné Hard Enamel with 18k Gold Plating',
      'Dimensions': '5.0 cm x 3.0 cm'
    },
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 5. Baby Krishna (Makhan Chor)
  {
    id: 'a0000001-0000-0000-0000-000000000005',
    name: 'Baby Krishna (Makhan Chor)',
    title: 'Baby Krishna Makhan Chor Keychain',
    slug: 'baby-krishna-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-005',
    material: 'Acrylic',
    price: 99.00,
    compare_price: 149.00,
    stock: 35,
    rating: 4.8,
    reviews_count: 14,
    featured: false,
    trending: false,
    status: 'active',
    description: "Adorable Gopal with his butter pot! Hand-drawn devotional illustration sealed inside diamond-cut crystal acrylic.",
    specifications: {
      'Material': 'Diamond-Cut Optical Acrylic',
      'Thickness': '4 mm Extra Durable'
    },
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 6. Radha Krishna Silhouette
  {
    id: 'a0000001-0000-0000-0000-000000000009',
    name: 'Radha Krishna Silhouette',
    title: 'Radha Krishna Silhouette Cutout Keychain',
    slug: 'radha-krishna-silhouette-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-006',
    material: 'Wood',
    price: 119.00,
    compare_price: 159.00,
    stock: 22,
    rating: 4.7,
    reviews_count: 11,
    featured: false,
    trending: false,
    status: 'active',
    description: "Intricate laser-cut silhouette of the Divine Couple standing beneath the sacred Kadamba tree in Vrindavan.",
    specifications: {
      'Material': 'Natural Sheesham Rosewood & Brass Ring',
      'Dimensions': '6.0 cm x 4.0 cm'
    },
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 7. Govinda Sacred Wood Keychain
  {
    id: 'a0000001-0000-0000-0000-000000000010',
    name: 'Govinda Sacred Wood',
    title: 'Govinda Sacred Wood Keychain',
    slug: 'govinda-wooden-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-007',
    material: 'Wood',
    price: 129.00,
    compare_price: 169.00,
    stock: 25,
    rating: 4.8,
    reviews_count: 18,
    featured: false,
    trending: false,
    status: 'active',
    description: "Carved from natural fragrant sandalwood with 'Govinda' calligraphy in ancient Devanagari script.",
    specifications: {
      'Material': 'Natural Sacred Sandalwood',
      'Dimensions': '4.5 cm x 3.0 cm'
    },
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 8. Lotus Bloom Keychain
  {
    id: 'a0000001-0000-0000-0000-000000000011',
    name: 'Lotus Bloom',
    title: 'Lotus Bloom Keychain',
    slug: 'lotus-bloom-keychain',
    category_id: CAT_MAP['Devotional Keychains'],
    brand_id: BRAND_MAP['Devotional Keychains'],
    sku: 'HN-KC-008',
    material: 'Acrylic',
    price: 99.00,
    compare_price: 139.00,
    stock: 50,
    rating: 4.9,
    reviews_count: 22,
    featured: false,
    trending: false,
    status: 'active',
    description: "Symbol of purity, transcendental devotion, and detachment from material illusion.",
    specifications: {
      'Material': 'Multi-layer Enamel & Acrylic',
      'Diameter': '3.5 cm'
    },
    images: [
      'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 9. 3-Keychain Gift Set
  {
    id: 'a0000001-0000-0000-0000-000000000012',
    name: '3-Keychain Gift Set',
    title: '3-Keychain Devotional Gift Set',
    slug: '3-keychain-gift-set',
    category_id: CAT_MAP['Gift Sets & Bundles'],
    brand_id: BRAND_MAP['Gift Sets & Bundles'],
    sku: 'HN-GS-001',
    material: 'Metal & Acrylic',
    price: 299.00,
    compare_price: 357.00,
    stock: 20,
    rating: 5.0,
    reviews_count: 42,
    featured: true,
    trending: true,
    status: 'active',
    description: "Includes Peacock Feather, Maha-Mantra, and Krishna Flute in a luxury satin-lined gift box with holy blessings card.",
    specifications: {
      'Set Contains': '3 Mastercrafted Keychains',
      'Packaging': 'Deluxe Gold Embossed Gift Box'
    },
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 10. 5-Keychain Collection Set
  {
    id: 'a0000001-0000-0000-0000-000000000013',
    name: '5-Keychain Collection',
    title: '5-Keychain Complete Collection Set',
    slug: '5-keychain-collection-set',
    category_id: CAT_MAP['Gift Sets & Bundles'],
    brand_id: BRAND_MAP['Gift Sets & Bundles'],
    sku: 'HN-GS-002',
    material: 'Metal & Acrylic',
    price: 499.00,
    compare_price: 645.00,
    stock: 15,
    rating: 5.0,
    reviews_count: 64,
    featured: true,
    trending: true,
    status: 'active',
    description: "Complete Harinama reminder gift box containing all 5 flagship designs: Peacock Feather, Maha-Mantra, Flute, Radhe Radhe, and Radha Lotus.",
    specifications: {
      'Set Contains': '5 Flagship Keychains',
      'Packaging': 'Collector Wood Finish Display Box'
    },
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 11. Bhagavad Gita As It Is
  {
    id: 'a0000001-0000-0000-0000-000000000006',
    name: 'Bhagavad Gita As It Is',
    title: 'Bhagavad Gita As It Is (Deluxe Hardbound Edition)',
    slug: 'bhagavad-gita-as-it-is',
    category_id: CAT_MAP['Sacred Books & Shastras'],
    brand_id: BRAND_MAP['Sacred Books & Shastras'],
    sku: 'HN-BK-001',
    material: 'Hardbound Book',
    price: 299.00,
    compare_price: 499.00,
    stock: 40,
    rating: 5.0,
    reviews_count: 148,
    featured: true,
    trending: true,
    status: 'active',
    description: "The complete Sanskrit text, Roman transliteration, word-for-word English equivalences, translation, and elaborate purports by A.C. Bhaktivedanta Swami Prabhupada.",
    specifications: {
      'Pages': '900+ Pages with color plates',
      'Binding': 'Gold Embossed Deluxe Hardcover',
      'Language': 'English / Sanskrit'
    },
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 12. Teachings of Queen Kunti
  {
    id: 'a0000001-0000-0000-0000-000000000014',
    name: 'Teachings of Queen Kunti',
    title: 'Teachings of Queen Kunti (Spiritual Classics)',
    slug: 'teachings-of-queen-kunti',
    category_id: CAT_MAP['Sacred Books & Shastras'],
    brand_id: BRAND_MAP['Sacred Books & Shastras'],
    sku: 'HN-BK-002',
    material: 'Paperback',
    price: 199.00,
    compare_price: 275.00,
    stock: 25,
    rating: 4.9,
    reviews_count: 36,
    featured: false,
    trending: false,
    status: 'active',
    description: "Queen Kunti's heartfelt prayers of surrender, bhakti, and divine shelter amidst life's greatest tribulations.",
    specifications: {
      'Author': 'A.C. Bhaktivedanta Swami Prabhupada',
      'Pages': '240 Pages'
    },
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 13. Sri Isopanisad
  {
    id: 'a0000001-0000-0000-0000-000000000015',
    name: 'Sri Isopanisad',
    title: 'Sri Isopanisad — The Knowledge That Brings One Nearer to the Supreme',
    slug: 'sri-isopanisad',
    category_id: CAT_MAP['Sacred Books & Shastras'],
    brand_id: BRAND_MAP['Sacred Books & Shastras'],
    sku: 'HN-BK-003',
    material: 'Pocket Book',
    price: 120.00,
    compare_price: 160.00,
    stock: 35,
    rating: 5.0,
    reviews_count: 44,
    featured: false,
    trending: false,
    status: 'active',
    description: "One of the topmost Upanishads establishing the divine personality and universal ownership of Krishna.",
    specifications: {
      'Pages': '160 Pages',
      'Format': 'Pocket Devotional Edition'
    },
    images: [
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 14. Neem Japa Mala
  {
    id: 'a0000001-0000-0000-0000-000000000016',
    name: 'Neem Japa Mala',
    title: 'Sacred Neem Japa Mala (108 Chanting Beads)',
    slug: 'sacred-neem-japa-mala',
    category_id: CAT_MAP['Japa & Chanting'],
    brand_id: BRAND_MAP['Japa & Chanting'],
    sku: 'HN-JP-001',
    material: 'Sacred Neem Wood',
    price: 199.00,
    compare_price: 280.00,
    stock: 50,
    rating: 5.0,
    reviews_count: 89,
    featured: true,
    trending: true,
    status: 'active',
    description: "Hand-carved 108 beads from sacred Neem wood with Meru bead and counter tassel. Perfect for daily Maha-Mantra japa.",
    specifications: {
      'Beads Count': '108 + 1 Guru Bead',
      'Cord': 'Durable Pure Cotton Twine',
      'Origin': 'Mayapur Dham'
    },
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 15. Embroidered Bead Bag
  {
    id: 'a0000001-0000-0000-0000-000000000017',
    name: 'Embroidered Bead Bag',
    title: 'Embroidered Hare Krishna Japa Bead Bag (Gomukhi)',
    slug: 'embroidered-japa-bead-bag',
    category_id: CAT_MAP['Japa & Chanting'],
    brand_id: BRAND_MAP['Japa & Chanting'],
    sku: 'HN-JP-002',
    material: 'Pure Cotton',
    price: 149.00,
    compare_price: 220.00,
    stock: 45,
    rating: 4.9,
    reviews_count: 62,
    featured: true,
    trending: false,
    status: 'active',
    description: "Traditional cotton Gomukhi japa bag with Hare Krishna Maha-Mantra embroidered in gold thread. Features inner zipper pocket for counting beads.",
    specifications: {
      'Material': '100% Breathable Cotton',
      'Color': 'Saffron / Navy with Gold Zari'
    },
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    ]
  },
  // 16. Authentic Vrindavan Tulasi Japa Mala
  {
    id: 'a0000001-0000-0000-0000-000000000007',
    name: 'Authentic Tulasi Japa Mala',
    title: 'Authentic Vrindavan Tulasi Japa Mala with Silver Caps',
    slug: 'authentic-tulasi-japa-mala',
    category_id: CAT_MAP['Japa & Chanting'],
    brand_id: BRAND_MAP['Japa & Chanting'],
    sku: 'HN-JP-003',
    material: 'Sacred Tulasi Wood',
    price: 349.00,
    compare_price: 499.00,
    stock: 18,
    rating: 5.0,
    reviews_count: 58,
    featured: true,
    trending: true,
    status: 'active',
    description: "Made from naturally seasoned Vrindavan Tulasi stems, hand-knotted between each bead with sterling silver caps on the Guru bead.",
    specifications: {
      'Material': 'Vrindavan Tulasi Wood & 925 Silver',
      'Beads': '108 Knotted Beads'
    },
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

async function seedCatalog() {
  console.log(`Starting catalog sync for ${products.length} products into Supabase...`);

  for (const p of products) {
    const { images, ...productData } = p;

    // Check if product exists by slug or id
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .or(`slug.eq.${p.slug},id.eq.${p.id}`)
      .maybeSingle();

    let targetId = p.id;
    if (existing) {
      targetId = existing.id;
      const { error: updateErr } = await supabaseAdmin
        .from('products')
        .update({
          name: productData.name,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          compare_price: productData.compare_price,
          stock: productData.stock,
          material: productData.material,
          category_id: productData.category_id,
          brand_id: productData.brand_id,
          featured: productData.featured,
          trending: productData.trending,
          rating: productData.rating,
          reviews_count: productData.reviews_count,
          specifications: productData.specifications,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (updateErr) {
        console.error(`Error updating product ${p.name}:`, updateErr.message);
      } else {
        console.log(`Updated product: ${p.name} (${targetId})`);
      }
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('products')
        .insert({
          id: p.id,
          name: productData.name,
          title: productData.title,
          slug: productData.slug,
          sku: productData.sku,
          description: productData.description,
          price: productData.price,
          compare_price: productData.compare_price,
          stock: productData.stock,
          material: productData.material,
          category_id: productData.category_id,
          brand_id: productData.brand_id,
          featured: productData.featured,
          trending: productData.trending,
          rating: productData.rating,
          reviews_count: productData.reviews_count,
          specifications: productData.specifications,
          status: 'active'
        });

      if (insertErr) {
        console.error(`Error inserting product ${p.name}:`, insertErr.message);
      } else {
        console.log(`Inserted new product: ${p.name} (${targetId})`);
      }
    }

    // Upsert primary image
    if (images && images.length > 0) {
      await supabaseAdmin.from('product_images').delete().eq('product_id', targetId);
      const imgRows = images.map((imgUrl, idx) => ({
        product_id: targetId,
        image_url: imgUrl,
        alt_text: p.name,
        sort_order: idx + 1,
        is_primary: idx === 0
      }));
      await supabaseAdmin.from('product_images').insert(imgRows);
    }
  }

  // Count total products in Supabase
  const { count, error } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Supabase catalog seeding completed! Total products now in database: ${count}`);
}

seedCatalog().then(() => process.exit(0)).catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
