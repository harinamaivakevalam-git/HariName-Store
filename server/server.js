const express = require('express');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const { helmetConfig, corsOptions, apiLimiter } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmetConfig);
app.use(require('cors')(corsOptions));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Static Uploads & Public Assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Supabase Storage Same-Domain Image Proxy (Bypasses Indian ISP DNS drops & QUIC resets)
const { proxyProductImage } = require('./controllers/imageProxyController');
app.get([
  '/api/product-images/*',
  '/storage/v1/object/public/*',
  '/api/storage/*'
], proxyProductImage);

app.use(express.static(path.join(__dirname, '../public')));

// Mount API Endpoints
app.use('/api', apiLimiter, apiRoutes);

// Temporary seed endpoint (uses server's existing Supabase connection)
app.post('/api/internal/seed-products', async (req, res) => {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return res.json({ success: false, message: 'Supabase not configured' });
    }

    const PRODUCTS = [
      { name: 'Peacock Feather', title: 'Peacock Feather Keychain', slug: 'peacock-feather-keychain', description: 'A timeless devotional keychain inspired by Sri Krishna\'s crown feather.', short_description: 'Double-sided HD acrylic with gold keyring.', price: 99, compare_price: 149, sku: 'HN-KC-001', stock: 120, cat_slug: 'devotional-keychains', material: 'Acrylic', featured: true, trending: true, rating: 4.9, reviews_count: 24, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Krishna Flute', title: 'Krishna Flute Keychain', slug: 'krishna-flute-keychain', description: 'Delicate Krishna flute (Venu) keychain with tiny peacock feather charm.', short_description: 'Solid zinc alloy with antique gold plating.', price: 129, compare_price: 199, sku: 'HN-KC-002', stock: 85, cat_slug: 'devotional-keychains', material: 'Metal', featured: true, trending: true, rating: 4.8, reviews_count: 19, img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80' },
      { name: 'Maha-Mantra', title: 'Maha-Mantra Keychain (Hare Krishna)', slug: 'maha-mantra-keychain', description: 'The sacred 16-word Maha-Mantra engraved in Devanagari and English.', short_description: 'Dual-sided Hindi & English sacred mantra engraving.', price: 149, compare_price: 229, sku: 'HN-KC-003', stock: 60, cat_slug: 'devotional-keychains', material: 'Metal', featured: true, trending: true, rating: 5.0, reviews_count: 42, img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80' },
      { name: 'Radhe Radhe', title: 'Radhe Radhe Enamel Keychain', slug: 'radhe-radhe-enamel-keychain', description: 'Vibrant hard enamel keychain with sweet "Radhe Radhe" calligraphy.', short_description: 'Hard enamel with bright colors & protective clear gloss.', price: 129, compare_price: 189, sku: 'HN-KC-004', stock: 95, cat_slug: 'devotional-keychains', material: 'Acrylic', featured: true, trending: false, rating: 4.9, reviews_count: 16, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Baby Krishna (Makhan Chor)', title: 'Baby Krishna Keychain', slug: 'baby-krishna-keychain', description: 'Adorable Bal Krishna holding butter pot charm keychain.', short_description: 'Cut-out acrylic with double-sided glossy finish.', price: 99, compare_price: 149, sku: 'HN-KC-005', stock: 110, cat_slug: 'devotional-keychains', material: 'Acrylic', featured: true, trending: false, rating: 4.7, reviews_count: 11, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Bhagavad Gita As It Is', title: 'Bhagavad Gita As It Is (Deluxe Edition)', slug: 'bhagavad-gita-as-it-is', description: 'Definitive English edition by A.C. Bhaktivedanta Swami Prabhupada.', short_description: 'Deluxe hardbound, 900+ pages with color plates.', price: 299, compare_price: 450, sku: 'HN-BK-001', stock: 50, cat_slug: 'sacred-books', material: 'Hardbound Book', featured: true, trending: true, rating: 5.0, reviews_count: 128, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Authentic Tulasi Japa Mala', title: 'Tulasi Japa Mala (108 Beads)', slug: 'authentic-tulasi-japa-mala', description: 'Sacred 108-bead Tulasi wood Japa Mala hand-carved in Vrindavan.', short_description: '108 hand-carved Tulasi beads with cotton japa bag.', price: 349, compare_price: 499, sku: 'HN-JP-001', stock: 40, cat_slug: 'japa-chanting', material: 'Wood', featured: true, trending: true, rating: 4.9, reviews_count: 87, img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80' },
      { name: 'Devotee Gift Set', title: 'Devotee Gift Set (4 Keychains + Blessed Bag)', slug: 'devotee-gift-set-bundle', description: 'Complete 4-keychain gift bundle in gold-embossed devotional box.', short_description: 'Complete 4-piece keychain set in gift packaging.', price: 399, compare_price: 599, sku: 'HN-GS-001', stock: 30, cat_slug: 'gift-sets', material: 'Multi-Material', featured: true, trending: true, rating: 5.0, reviews_count: 34, img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' }
    ];

    // Get category map
    const { data: cats } = await supabaseAdmin.from('categories').select('id,slug');
    const catMap = {};
    (cats || []).forEach(c => { catMap[c.slug] = c.id; });

    // Get first brand
    const { data: brands } = await supabaseAdmin.from('brands').select('id');
    const brandId = brands?.[0]?.id || null;

    const results = [];
    for (const p of PRODUCTS) {
      const catId = catMap[p.cat_slug] || catMap['devotional-keychains'] || catMap['krishna-keychains'] || Object.values(catMap)[0];
      const { data, error } = await supabaseAdmin.from('products').upsert({
        name: p.name, title: p.title, slug: p.slug, description: p.description,
        short_description: p.short_description, price: p.price, compare_price: p.compare_price,
        sku: p.sku, stock: p.stock, category_id: catId, brand_id: brandId,
        material: p.material, status: 'active', featured: p.featured, trending: p.trending,
        rating: p.rating, reviews_count: p.reviews_count
      }, { onConflict: 'slug' }).select('id,name');

      if (error) {
        results.push({ name: p.name, error: error.message });
      } else if (data?.[0]) {
        // Add image
        await supabaseAdmin.from('product_images').delete().eq('product_id', data[0].id);
        await supabaseAdmin.from('product_images').insert({
          product_id: data[0].id, image_url: p.img, alt_text: p.title, sort_order: 1, is_primary: true
        });
        results.push({ name: p.name, id: data[0].id, ok: true });
      }
    }

    // Verify
    const { data: allActive } = await supabaseAdmin.from('products').select('id,name').eq('status', 'active');
    res.json({ success: true, seeded: results, totalActive: allActive?.length || 0 });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Fallback for HTML page routes (clean URLs without .html extension)
const htmlPages = [
  '', 'index', 'shop', 'product', 'product-details', 'products', 'collections',
  'cart', 'checkout', 'order-success', 'order-tracking', 'orders',
  'account', 'auth', 'login', 'register', 'forgot-password', 'wishlist', 'addresses',
  'about', 'contact', 'faq', 'terms',
  'admin', 'admin-products', 'admin-orders', 'admin-categories', 'admin-coupons',
  'admin-customers', 'admin-reviews', 'admin-analytics', 'admin-settings', 'admin-homepage'
];

htmlPages.forEach(page => {
  const route = page === '' || page === 'index' ? '/' : `/${page}`;
  const file = page === '' ? 'index' : page;
  if (route !== '/') {
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, `../public/${file}.html`)));
  } else {
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
  }
});

// Catch 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  let currentPort = parseInt(PORT, 10);

  const startServer = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`
=====================================================
   🌸 HariNama Store - Commercial Server Live 🌸
=====================================================
   URL:         http://localhost:${portToTry}
   API Base:    http://localhost:${portToTry}/api
   Storefront:  http://localhost:${portToTry}/index.html
   Admin:       http://localhost:${portToTry}/admin.html
   Environment: ${process.env.NODE_ENV || 'development'}
=====================================================
      `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Server] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        startServer(portToTry + 1);
      } else {
        console.error('[Server] Fatal listen error:', err);
      }
    });
  };

  startServer(currentPort);
}

module.exports = app;
