const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '../../database/data.json');

class DatabaseStore {
  constructor() {
    this.data = {
      users: [],
      categories: [],
      brands: [],
      products: [],
      product_images: [],
      product_variants: [],
      carts: [],
      cart_items: [],
      wishlists: [],
      addresses: [],
      coupons: [],
      orders: [],
      order_items: [],
      payments: [],
      reviews: [],
      notifications: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.warn('[DatabaseStore] Error loading data.json, re-seeding:', err.message);
      this.seedInitialData();
    }
  }

  save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DatabaseStore] Error saving data.json:', err.message);
    }
  }

  seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminPassword = bcrypt.hashSync('admin123', salt);
    const userPassword = bcrypt.hashSync('user123', salt);

    const adminId = 'a1111111-1111-4111-8111-111111111111';
    const customerId = 'c2222222-2222-4222-8222-222222222222';

    // Users
    this.data.users = [
      {
        id: adminId,
        name: 'HariNama Admin',
        email: 'admin@harinama.com',
        password_hash: adminPassword,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: customerId,
        name: 'Gauranga Das',
        email: 'user@harinama.com',
        password_hash: userPassword,
        phone: '+91 91234 56789',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        role: 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Categories
    const catBooks = 'cat-001';
    const catMala = 'cat-002';
    const catApparel = 'cat-003';
    const catPuja = 'cat-004';
    const catWellness = 'cat-005';
    const catMusic = 'cat-006';

    this.data.categories = [
      {
        id: 'cat-krishna',
        name: 'Krishna Collection',
        slug: 'krishna-collection',
        description: 'Authentic Krishna silhouetted, flute, and peacock feather keychains.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 1
      },
      {
        id: 'cat-radha',
        name: 'Radha Collection',
        slug: 'radha-collection',
        description: 'Pastel Radhe Radhe and blooming lotus devotional keychains.',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 2
      },
      {
        id: 'cat-mantra',
        name: 'Maha-Mantra Collection',
        slug: 'maha-mantra-collection',
        description: 'Enamelled brass medallions featuring the complete 16-word Maha-Mantra.',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 3
      },
      {
        id: 'cat-gifts',
        name: 'Gift Sets',
        slug: 'gift-sets',
        description: 'Deluxe gift collections and multi-keychain boxes with holy blessings card.',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 4
      },
      {
        id: catBooks,
        name: 'Sacred Books & Scriptures',
        slug: 'sacred-books',
        description: 'Authentic translations and commentaries of ancient Vedic scriptures, Bhagavad Gita, and philosophy.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 5
      },
      {
        id: catMala,
        name: 'Japa Mala & Beads',
        slug: 'japa-mala-beads',
        description: 'Handcrafted authentic Tulasi, Neem, Sandalwood, and Rosewood prayer beads with handcrafted japa bags.',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        sort_order: 6
      }
    ];

    // Brands
    const brandBBT = 'br-001';
    const brandVrindavan = 'br-002';
    const brandMayapur = 'br-003';
    const brandVedaSoul = 'br-004';

    this.data.brands = [
      { id: brandBBT, name: 'Bhaktivedanta Book Trust', slug: 'bbt', logo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80', status: 'active' },
      { id: brandVrindavan, name: 'Vrindavan Naturals', slug: 'vrindavan-naturals', logo: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80', status: 'active' },
      { id: brandMayapur, name: 'Mayapur Handlooms', slug: 'mayapur-handlooms', logo: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80', status: 'active' },
      { id: brandVedaSoul, name: 'VedaSoul Crafts', slug: 'vedasoul-crafts', logo: 'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=200&q=80', status: 'active' }
    ];

    // Products
    this.data.products = [
      {
        id: 'prod-001',
        name: 'Srimad Bhagavad Gita As It Is (Deluxe Edition)',
        slug: 'bhagavad-gita-as-it-is-deluxe',
        description: 'The largest-selling, most comprehensive edition of the Bhagavad Gita in the world with original Sanskrit text, Roman transliteration, English equivalents, lucid translation, and elaborate purports by A.C. Bhaktivedanta Swami Prabhupada.',
        short_description: 'Complete 700 verses with elaborate commentary, Sanskrit text and full-color classical illustrations.',
        price: 899.00,
        compare_price: 1299.00,
        sku: 'BK-BG-DLX-01',
        stock: 50,
        category_id: catBooks,
        brand_id: brandBBT,
        status: 'active',
        featured: true,
        trending: true,
        rating: 4.9,
        reviews_count: 148,
        specifications: {
          "Author": "A.C. Bhaktivedanta Swami Prabhupada",
          "Pages": "924 Pages",
          "Language": "English & Sanskrit",
          "Cover": "Hardbound with Gold Foil Embossing",
          "Illustrations": "48 Full-color Plates"
        },
        tags: ['Gita', 'Philosophy', 'Scripture', 'Bestseller'],
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-002',
        name: 'Authentic Vrindavan Tulasi Japa Mala (108 Beads)',
        slug: 'authentic-tulasi-japa-mala-108',
        description: 'Specially hand-carved from sacred Vrindavan wood, each bead is selected for uniform shape and smoothness. Strung on durable silk thread with traditional hand-tied knots between each bead for optimal meditation flow.',
        short_description: '108 hand-carved Tulasi beads with Guru bead, silk tassel, and pure copper capping.',
        price: 1250.00,
        compare_price: 1699.00,
        sku: 'ML-TLS-108-01',
        stock: 35,
        category_id: catMala,
        brand_id: brandVrindavan,
        status: 'active',
        featured: true,
        trending: true,
        rating: 4.8,
        reviews_count: 92,
        specifications: {
          "Bead Count": "108 + 1 Guru Bead",
          "Bead Diameter": "8mm to 10mm Graduated",
          "Origin": "Vrindavan Dham",
          "Thread": "Reinforced Natural Silk",
          "Free Gift": "Embroidered Cotton Bead Bag"
        },
        tags: ['Tulasi', 'Japa', 'Meditation', 'Prayer Beads'],
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-003',
        name: 'Pure Ahimsa Silk Kurta & Handloom Dhoti Set',
        slug: 'ahimsa-silk-kurta-dhoti-set',
        description: 'Hand-spun cruelty-free Ahimsa silk crafted by traditional Mayapur artisans. Light, breathable, and deeply auspicious for spiritual festivals, temple ceremonies, and daily devotion.',
        short_description: 'Pure handloom raw silk blend with subtle zari borders and tailored comfortable fit.',
        price: 2899.00,
        compare_price: 3899.00,
        sku: 'AP-SLK-SET-01',
        stock: 22,
        category_id: catApparel,
        brand_id: brandMayapur,
        status: 'active',
        featured: true,
        trending: false,
        rating: 4.9,
        reviews_count: 45,
        specifications: {
          "Fabric": "100% Ahimsa Silk & Khadi Cotton",
          "Care": "Dry Clean or Gentle Handwash",
          "Set Contains": "1 Kurta + 1 4.5m Dhoti with Angavastram",
          "Color": "Natural Golden Sandalwood / Ivory"
        },
        tags: ['Apparel', 'Kurta', 'Dhoti', 'Ahimsa Silk'],
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-004',
        name: 'Solid Brass 5-Step Pancha Pradipa Aarti Lamp',
        slug: 'solid-brass-pancha-pradipa-aarti-lamp',
        description: 'Exquisite hand-cast heavy brass Pancha Pradipa lamp. Features traditional peacock handle and five tiered flame holders designed to retain warm clarified butter (ghee) or sesame oil during arati.',
        short_description: 'Heavily weighted solid virgin brass with ornate hand-engraved peacock handle.',
        price: 1599.00,
        compare_price: 2199.00,
        sku: 'PJ-BRS-LMP-01',
        stock: 18,
        category_id: catPuja,
        brand_id: brandVedaSoul,
        status: 'active',
        featured: true,
        trending: true,
        rating: 4.7,
        reviews_count: 38,
        specifications: {
          "Material": "100% Solid Brass (Virgin Casting)",
          "Weight": "1.25 Kilograms",
          "Dimensions": "8.5 inches x 6 inches",
          "Finish": "Antique Lustre Polish"
        },
        tags: ['Puja', 'Aarti', 'Brass', 'Altar Decor'],
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-005',
        name: 'Pure Vrindavan Chandan Sandalwood Paste & Stone',
        slug: 'pure-vrindavan-sandalwood-paste-stone',
        description: 'Sustainably sourced old-growth Mysore sandalwood block paired with a natural granite rubbing stone (Chandan pata). Delivers an intoxicating celestial aroma and deep cooling sensation when applied as tilak.',
        short_description: 'Authentic 100g Sandalwood root piece + Traditional hand-carved stone slab.',
        price: 799.00,
        compare_price: 999.00,
        sku: 'WL-CHND-100-01',
        stock: 40,
        category_id: catWellness,
        brand_id: brandVrindavan,
        status: 'active',
        featured: false,
        trending: true,
        rating: 4.9,
        reviews_count: 67,
        specifications: {
          "Contents": "100g Sandalwood Log + 4-inch Granite Pata",
          "Aroma Profile": "Sweet, woody, therapeutic calming scent",
          "Use": "Tilak, Puja Offering, Meditation Aid"
        },
        tags: ['Chandan', 'Sandalwood', 'Tilak', 'Wellness'],
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-006',
        name: 'Hand-Beaten Bell Metal Bengali Kartals (Medium)',
        slug: 'hand-beaten-bell-metal-bengali-kartals',
        description: 'Forged from authentic Kansa (bell metal bronze alloy) by multi-generational metalsmiths in Nabadwip. Produces a sustained, crystal-clear, melodious ringing pitch essential for sankirtan and home bhajan.',
        short_description: 'Hand-forged resonant Bell Metal cymbals with braided cotton cords.',
        price: 1450.00,
        compare_price: 1899.00,
        sku: 'MS-KRT-BLM-01',
        stock: 25,
        category_id: catMusic,
        brand_id: brandVedaSoul,
        status: 'active',
        featured: true,
        trending: true,
        rating: 4.8,
        reviews_count: 51,
        specifications: {
          "Alloy": "78% Copper, 22% Tin (Traditional Kansa)",
          "Diameter": "3.5 inches per cup",
          "Weight": "580 grams pair",
          "Tone": "High Bright Resonance (Sankirtan standard)"
        },
        tags: ['Kartals', 'Kirtan', 'Instruments', 'Sankirtan'],
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-007',
        name: 'Srimad Bhagavatam 18-Volume Complete Set',
        slug: 'srimad-bhagavatam-18-volume-complete-set',
        description: 'The encyclopedic masterpiece of transcendental wisdom composed by Sage Vyasadeva. Contains the complete 12 Cantos with full transliterations, translations, and purports.',
        short_description: '18 deluxe hardbound volumes with gold gilded edges and silk ribbon bookmarks.',
        price: 14999.00,
        compare_price: 18500.00,
        sku: 'BK-SB-SET-18',
        stock: 8,
        category_id: catBooks,
        brand_id: brandBBT,
        status: 'active',
        featured: true,
        trending: false,
        rating: 5.0,
        reviews_count: 88,
        specifications: {
          "Volumes": "18 Hardcover Books",
          "Language": "English & Sanskrit",
          "Publisher": "Bhaktivedanta Book Trust",
          "Weight": "16.5 Kilograms"
        },
        tags: ['Bhagavatam', 'Scripture', 'Books', 'Collector Set'],
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-008',
        name: 'Organic Vedic A2 Gir Cow Ghee (Glass Jar 1000ml)',
        slug: 'organic-vedic-a2-gir-cow-ghee-1000ml',
        description: 'Cultured using the traditional Vedic Bilona method from curd of free-grazing indigenous Gir cows. Golden, granular, aromatic, and rich in medicinal nutrients and natural antioxidants.',
        short_description: 'Handmade Bilona cultured A2 ghee in airtight UV-protective glass jar.',
        price: 1850.00,
        compare_price: 2200.00,
        sku: 'WL-GHE-A2-1000',
        stock: 30,
        category_id: catWellness,
        brand_id: brandVrindavan,
        status: 'active',
        featured: false,
        trending: true,
        rating: 4.9,
        reviews_count: 114,
        specifications: {
          "Volume": "1000 ml / 1 Litre",
          "Method": "Vedic Wooden Bilona Churned",
          "Cow Breed": "Desi Gir Cows (Grass Fed)",
          "Packaging": "Heavy Glass Jar"
        },
        tags: ['A2 Ghee', 'Ayurveda', 'Bilona', 'Wellness'],
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-009',
        name: 'Embroidered Silk Harinama Japa Bead Bag',
        slug: 'embroidered-silk-harinama-japa-bead-bag',
        description: 'Beautifully embroidered with Maha-Mantra and sacred lotus motifs. Features soft inner lining, sturdy index finger hole, inner zippered pocket for counter beads, and adjustable strap.',
        short_description: 'Velvet silk exterior with gold thread embroidery and counter pouch.',
        price: 349.00,
        compare_price: 499.00,
        sku: 'ML-BAG-SLK-01',
        stock: 60,
        category_id: catMala,
        brand_id: brandMayapur,
        status: 'active',
        featured: false,
        trending: false,
        rating: 4.7,
        reviews_count: 29,
        specifications: {
          "Material": "Raw Silk & Velvet",
          "Color Options": "Royal Saffron, Deep Blue, Emerald",
          "Features": "Index hole, counter zipper, strap"
        },
        tags: ['Japa Bag', 'Mala Bag', 'Accessories'],
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-010',
        name: 'Handcrafted Radha Krishna Brass Deity Set (7 Inches)',
        slug: 'handcrafted-radha-krishna-brass-deity-set-7-inch',
        description: 'Hand-sculpted in fine brass by heritage artisans with intricate facial features, ornaments, and peaceful divine smiles. Includes detachable flute and decorative peacock crown.',
        short_description: '7-inch pair of brass Sri Sri Radha Krishna with polished finish.',
        price: 4499.00,
        compare_price: 5999.00,
        sku: 'PJ-RK-7IN-01',
        stock: 12,
        category_id: catPuja,
        brand_id: brandVedaSoul,
        status: 'active',
        featured: true,
        trending: true,
        rating: 4.9,
        reviews_count: 34,
        specifications: {
          "Height": "7.0 Inches (18 cm)",
          "Net Weight": "2.4 Kilograms (Pair)",
          "Material": "Solid Brass with protective coating"
        },
        tags: ['Deity', 'Radha Krishna', 'Brass', 'Altar'],
        created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-011',
        name: 'Natural Vrindavan Kasturi & Rose Temple Dhoop Cones',
        slug: 'natural-vrindavan-kasturi-rose-dhoop-cones',
        description: '100% charcoal-free, made from sacred temple flower petals, cow dung ash, pure kasturi essential oils, and natural resins. Long lasting burning time of 40 minutes per cone with zero toxic smoke.',
        short_description: 'Box of 40 jumbo cones with ceramic burner plate. Pure aroma.',
        price: 299.00,
        compare_price: 399.00,
        sku: 'WL-DHP-40-01',
        stock: 80,
        category_id: catWellness,
        brand_id: brandVrindavan,
        status: 'active',
        featured: false,
        trending: false,
        rating: 4.6,
        reviews_count: 57,
        specifications: {
          "Count": "40 Luxury Dhoop Cones",
          "Burn Time": "35-45 Minutes",
          "Fragrance": "Vrindavan Kasturi & Damascus Rose",
          "Charcoal Free": "Yes (100% Organic)"
        },
        tags: ['Incense', 'Dhoop', 'Organic', 'Aroma'],
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-012',
        name: 'Authentic Clay Khol / Mridanga (Traditional Bengali)',
        slug: 'authentic-clay-khol-mridanga-traditional',
        description: 'Mastercrafted Bengali Khol with natural cured earthen body and double buffalo leather heads tuned for deep resonant bass (bayan) and sharp, crisp treble (dayan). Comes with padded gig bag.',
        short_description: 'Professional grade clay Mridanga with strap and deluxe travel bag.',
        price: 7800.00,
        compare_price: 9500.00,
        sku: 'MS-MRD-CLY-01',
        stock: 5,
        category_id: catMusic,
        brand_id: brandMayapur,
        status: 'active',
        featured: true,
        trending: false,
        rating: 4.8,
        reviews_count: 19,
        specifications: {
          "Body": "Terracotta Earthen Baked Clay",
          "Heads": "Triple layered buffalo and goat hide",
          "Tuning": "C / C# concert standard",
          "Includes": "Heavy Padded Gig Bag & Shoulder Belt"
        },
        tags: ['Mridanga', 'Khol', 'Kirtan', 'Instruments'],
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Product Images
    this.data.product_images = [
      { id: 'img-001', product_id: 'prod-001', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', alt_text: 'Bhagavad Gita Deluxe Book Cover', sort_order: 1, is_primary: true },
      { id: 'img-002', product_id: 'prod-001', image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', alt_text: 'Bhagavad Gita Open Pages and Sanskrit Text', sort_order: 2, is_primary: false },
      { id: 'img-003', product_id: 'prod-002', image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80', alt_text: 'Tulasi Japa Mala Beads 108', sort_order: 1, is_primary: true },
      { id: 'img-004', product_id: 'prod-002', image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', alt_text: 'Tulasi Japa Mala Close up Beads', sort_order: 2, is_primary: false },
      { id: 'img-005', product_id: 'prod-003', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', alt_text: 'Ahimsa Silk Kurta and Dhoti Set', sort_order: 1, is_primary: true },
      { id: 'img-006', product_id: 'prod-004', image_url: 'https://images.unsplash.com/photo-1609137144822-0d198f2371a5?auto=format&fit=crop&w=800&q=80', alt_text: 'Brass Pancha Pradipa Aarti Lamp', sort_order: 1, is_primary: true },
      { id: 'img-007', product_id: 'prod-005', image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', alt_text: 'Pure Vrindavan Chandan and Stone', sort_order: 1, is_primary: true },
      { id: 'img-008', product_id: 'prod-006', image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', alt_text: 'Bell Metal Bengali Kartals', sort_order: 1, is_primary: true },
      { id: 'img-009', product_id: 'prod-007', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', alt_text: 'Srimad Bhagavatam Complete Set', sort_order: 1, is_primary: true },
      { id: 'img-010', product_id: 'prod-008', image_url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80', alt_text: 'Organic A2 Gir Cow Ghee Jar', sort_order: 1, is_primary: true },
      { id: 'img-011', product_id: 'prod-009', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', alt_text: 'Embroidered Japa Bead Bag', sort_order: 1, is_primary: true },
      { id: 'img-012', product_id: 'prod-010', image_url: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=800&q=80', alt_text: 'Radha Krishna Brass Deity Set', sort_order: 1, is_primary: true },
      { id: 'img-013', product_id: 'prod-011', image_url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80', alt_text: 'Kasturi Rose Dhoop Cones', sort_order: 1, is_primary: true },
      { id: 'img-014', product_id: 'prod-012', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80', alt_text: 'Clay Khol Mridanga Instrument', sort_order: 1, is_primary: true }
    ];

    // Product Variants (for apparel, mala size, etc.)
    this.data.product_variants = [
      { id: 'var-001', product_id: 'prod-003', sku: 'AP-SLK-M-IVR', size: 'M (38-40)', color: 'Ivory Sandal', price: 2899.00, stock: 8 },
      { id: 'var-002', product_id: 'prod-003', sku: 'AP-SLK-L-IVR', size: 'L (42-44)', color: 'Ivory Sandal', price: 2899.00, stock: 9 },
      { id: 'var-003', product_id: 'prod-003', sku: 'AP-SLK-XL-GLD', size: 'XL (46)', color: 'Golden Saffron', price: 2999.00, stock: 5 },
      { id: 'var-004', product_id: 'prod-002', sku: 'ML-TLS-8MM', size: '8mm Regular', color: 'Natural Tulasi', price: 1250.00, stock: 20 },
      { id: 'var-005', product_id: 'prod-002', sku: 'ML-TLS-10MM', size: '10mm Bold', color: 'Natural Tulasi', price: 1450.00, stock: 15 }
    ];

    // Coupons
    this.data.coupons = [
      {
        id: 'cp-001',
        code: 'WELCOME10',
        description: 'Flat 10% discount on your first spiritual purchase.',
        discount_type: 'percentage',
        discount_value: 10.00,
        minimum_order: 499.00,
        maximum_discount: 500.00,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 180 * 86400000).toISOString(),
        usage_limit: 500,
        times_used: 12,
        status: 'active'
      },
      {
        id: 'cp-002',
        code: 'FESTIVE20',
        description: 'Special 20% off for holy festivals on orders above ₹1500.',
        discount_type: 'percentage',
        discount_value: 20.00,
        minimum_order: 1500.00,
        maximum_discount: 1000.00,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 60 * 86400000).toISOString(),
        usage_limit: 250,
        times_used: 48,
        status: 'active'
      },
      {
        id: 'cp-003',
        code: 'HARINAMA100',
        description: 'Flat ₹100 instant discount on orders above ₹999.',
        discount_type: 'fixed',
        discount_value: 100.00,
        minimum_order: 999.00,
        maximum_discount: 100.00,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 90 * 86400000).toISOString(),
        usage_limit: 1000,
        times_used: 89,
        status: 'active'
      }
    ];

    // Sample Address for Demo Customer
    this.data.addresses = [
      {
        id: 'addr-001',
        user_id: customerId,
        name: 'Gauranga Das',
        phone: '+91 91234 56789',
        address_line_1: 'Flat 402, Radharani Kripa Apartments',
        address_line_2: 'Near ISKCON Temple Road, Raman Reti',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        postal_code: '281121',
        country: 'India',
        address_type: 'Home',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample Reviews
    this.data.reviews = [
      {
        id: 'rev-001',
        product_id: 'prod-001',
        user_id: customerId,
        rating: 5,
        title: 'Life changing scripture with immaculate commentary',
        comment: 'Srila Prabhupadas purports make each verse crystal clear. The gold gilded cover and illustrations are breathtakingly beautiful.',
        is_verified_purchase: true,
        status: 'approved',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'rev-002',
        product_id: 'prod-002',
        user_id: customerId,
        rating: 5,
        title: 'Authentic pure Tulasi aroma and smooth finish',
        comment: 'Very pleasant in hands. The beads glide effortlessly while chanting the Mahamantra. Highly recommend!',
        is_verified_purchase: true,
        status: 'approved',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'rev-003',
        product_id: 'prod-006',
        user_id: customerId,
        rating: 5,
        title: 'Pure bell metal ringing tone',
        comment: 'The sweet sustain of these kartals elevates our home sankirtan completely. Supreme quality.',
        is_verified_purchase: true,
        status: 'approved',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ];

    // Sample Wishlist
    this.data.wishlists = [
      { id: 'wl-001', user_id: customerId, product_id: 'prod-004', created_at: new Date().toISOString() },
      { id: 'wl-002', user_id: customerId, product_id: 'prod-007', created_at: new Date().toISOString() }
    ];

    // Sample Orders
    const sampleOrder1Id = 'ord-001';
    this.data.orders = [
      {
        id: sampleOrder1Id,
        order_number: 'HN-2026-98124',
        user_id: customerId,
        subtotal: 2149.00,
        discount: 214.90,
        coupon_code: 'WELCOME10',
        shipping_fee: 0.00,
        tax: 96.70,
        total: 2030.80,
        payment_status: 'paid',
        payment_method: 'razorpay',
        order_status: 'delivered',
        shipping_address: this.data.addresses[0],
        billing_address: this.data.addresses[0],
        tracking_number: 'ECOM-EXP-772910',
        tracking_url: 'https://harinama.store/track/HN-2026-98124',
        notes: 'Delivered safely with blessings.',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 86400000).toISOString()
      }
    ];

    this.data.order_items = [
      {
        id: 'oi-001',
        order_id: sampleOrder1Id,
        product_id: 'prod-001',
        product_name: 'Srimad Bhagavad Gita As It Is (Deluxe Edition)',
        product_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        sku: 'BK-BG-DLX-01',
        quantity: 1,
        price: 899.00,
        total: 899.00,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString()
      },
      {
        id: 'oi-002',
        order_id: sampleOrder1Id,
        product_id: 'prod-002',
        product_name: 'Authentic Vrindavan Tulasi Japa Mala (108 Beads)',
        product_image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80',
        sku: 'ML-TLS-108-01',
        quantity: 1,
        price: 1250.00,
        total: 1250.00,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString()
      }
    ];

    this.data.payments = [
      {
        id: 'pay-001',
        order_id: sampleOrder1Id,
        payment_provider: 'razorpay',
        transaction_id: 'pay_sim_98274102941',
        payment_order_id: 'order_sim_88192731',
        amount: 2030.80,
        currency: 'INR',
        status: 'captured',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 86400000).toISOString()
      }
    ];

    // Notifications
    this.data.notifications = [
      {
        id: 'notif-001',
        user_id: customerId,
        title: 'Order Delivered Successfully 🎉',
        message: 'Your order #HN-2026-98124 containing Bhagavad Gita and Tulasi Mala has been delivered.',
        type: 'order',
        link: '/order-tracking.html?order=HN-2026-98124',
        is_read: false,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'notif-002',
        user_id: customerId,
        title: 'Special Holy Festival Discount Available 🌸',
        message: 'Use coupon code FESTIVE20 for 20% off on all divine Puja & Altar items!',
        type: 'promo',
        link: '/shop.html?category=puja-altar-decor',
        is_read: true,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      }
    ];

    this.save();
    console.log('[DatabaseStore] Initial seed data created successfully.');
  }

  // Generic helpers
  findAll(collection) {
    return [...(this.data[collection] || [])];
  }

  findById(collection, id) {
    return (this.data[collection] || []).find(item => item.id === id) || null;
  }

  findOne(collection, predicate) {
    return (this.data[collection] || []).find(predicate) || null;
  }

  filter(collection, predicate) {
    return (this.data[collection] || []).filter(predicate);
  }

  insert(collection, item) {
    if (!this.data[collection]) this.data[collection] = [];
    const record = {
      id: item.id || uuidv4(),
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
    this.data[collection].push(record);
    this.save();
    return record;
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data[collection][index];
  }

  delete(collection, id) {
    if (!this.data[collection]) return false;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this.save();
    return true;
  }
}

const db = new DatabaseStore();

module.exports = db;
