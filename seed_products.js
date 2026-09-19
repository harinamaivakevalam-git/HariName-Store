/**
 * Seed the 8 original products into Supabase - WITH RETRY LOGIC
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' }, global: { fetch: fetch } }
);

// Retry wrapper
async function withRetry(fn, label, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (e) {
      console.log(`  [Retry ${i+1}/${maxRetries}] ${label}: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  console.log(`  FAILED after ${maxRetries} retries: ${label}`);
  return null;
}

const PRODUCTS = [
  {
    name: 'Peacock Feather', title: 'Peacock Feather Keychain',
    slug: 'peacock-feather-keychain',
    description: 'A timeless devotional keychain inspired by Sri Krishna\'s crown feather. Made from high-grade gloss acrylic with double-sided HD print and polished gold keyring.',
    short_description: 'Double-sided HD acrylic with gold keyring.',
    price: 99.00, compare_price: 149.00, sku: 'HN-KC-001', stock: 120,
    category_slug: 'devotional-keychains',
    material: 'Acrylic', status: 'active', featured: true, trending: true, rating: 4.9, reviews_count: 24,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Krishna Flute', title: 'Krishna Flute Keychain',
    slug: 'krishna-flute-keychain',
    description: 'Delicate Krishna flute (Venu) keychain with tiny peacock feather charm. Solid zinc alloy with antique gold electroplating.',
    short_description: 'Solid zinc alloy with antique gold plating.',
    price: 129.00, compare_price: 199.00, sku: 'HN-KC-002', stock: 85,
    category_slug: 'devotional-keychains',
    material: 'Metal', status: 'active', featured: true, trending: true, rating: 4.8, reviews_count: 19,
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Maha-Mantra', title: 'Maha-Mantra Keychain (Hare Krishna)',
    slug: 'maha-mantra-keychain',
    description: 'The sacred 16-word Maha-Mantra engraved in Devanagari on one side and English on reverse.',
    short_description: 'Dual-sided Hindi & English sacred mantra engraving.',
    price: 149.00, compare_price: 229.00, sku: 'HN-KC-003', stock: 60,
    category_slug: 'devotional-keychains',
    material: 'Metal', status: 'active', featured: true, trending: true, rating: 5.0, reviews_count: 42,
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Radhe Radhe', title: 'Radhe Radhe Enamel Keychain',
    slug: 'radhe-radhe-enamel-keychain',
    description: 'Vibrant hard enamel keychain with sweet "Radhe Radhe" calligraphy, framed by blooming lotus and peacock feathers.',
    short_description: 'Hard enamel with bright colors & protective clear gloss.',
    price: 129.00, compare_price: 189.00, sku: 'HN-KC-004', stock: 95,
    category_slug: 'devotional-keychains',
    material: 'Acrylic', status: 'active', featured: true, trending: false, rating: 4.9, reviews_count: 16,
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Baby Krishna (Makhan Chor)', title: 'Baby Krishna Keychain',
    slug: 'baby-krishna-keychain',
    description: 'Adorable Bal Krishna holding butter pot (Makhan Chor) charm keychain. A reminder of Krishna\'s childhood pastimes.',
    short_description: 'Cut-out acrylic with double-sided glossy finish.',
    price: 99.00, compare_price: 149.00, sku: 'HN-KC-005', stock: 110,
    category_slug: 'devotional-keychains',
    material: 'Acrylic', status: 'active', featured: true, trending: false, rating: 4.7, reviews_count: 11,
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Bhagavad Gita As It Is', title: 'Bhagavad Gita As It Is (Deluxe Edition)',
    slug: 'bhagavad-gita-as-it-is',
    description: 'Definitive English edition of Srimad Bhagavad Gita with Sanskrit verses, transliterations, and purports by A.C. Bhaktivedanta Swami Prabhupada.',
    short_description: 'Deluxe hardbound, 900+ pages with color plates.',
    price: 299.00, compare_price: 450.00, sku: 'HN-BK-001', stock: 50,
    category_slug: 'sacred-books',
    material: 'Hardbound Book', status: 'active', featured: true, trending: true, rating: 5.0, reviews_count: 128,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Authentic Tulasi Japa Mala', title: 'Tulasi Japa Mala (108 Beads)',
    slug: 'authentic-tulasi-japa-mala',
    description: 'Sacred 108-bead Tulasi wood Japa Mala hand-carved in holy Vrindavan. Strung on durable silk thread with traditional hand-tied knots.',
    short_description: '108 hand-carved Tulasi beads with cotton japa bag.',
    price: 349.00, compare_price: 499.00, sku: 'HN-JP-001', stock: 40,
    category_slug: 'japa-chanting',
    material: 'Wood', status: 'active', featured: true, trending: true, rating: 4.9, reviews_count: 87,
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Devotee Gift Set', title: 'Devotee Gift Set (4 Keychains + Blessed Bag)',
    slug: 'devotee-gift-set-bundle',
    description: 'Complete gift bundle containing 4 flagship keychains packaged in a gold-embossed devotional presentation box with Maha-Mantra cards.',
    short_description: 'Complete 4-piece keychain set in gift packaging.',
    price: 399.00, compare_price: 599.00, sku: 'HN-GS-001', stock: 30,
    category_slug: 'gift-sets',
    material: 'Multi-Material', status: 'active', featured: true, trending: true, rating: 5.0, reviews_count: 34,
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
  }
];

async function seed() {
  console.log('=== Seeding HariNama Store Products (with retries) ===\n');
  
  // 1. Test connectivity
  console.log('Testing Supabase connectivity...');
  const testResult = await withRetry(async () => {
    const { data, error } = await sb.from('categories').select('id,slug').limit(1);
    if (error) throw new Error(error.message);
    return data;
  }, 'connectivity test');
  
  if (!testResult) {
    console.log('\nCannot reach Supabase. Network is down. Try again later.');
    process.exit(1);
  }
  console.log('Connected to Supabase!\n');

  // 2. Get existing categories
  console.log('Fetching existing categories...');
  const cats = await withRetry(async () => {
    const { data, error } = await sb.from('categories').select('id,slug,name');
    if (error) throw new Error(error.message);
    return data;
  }, 'fetch categories');
  
  const catMap = {};
  if (cats) cats.forEach(c => { catMap[c.slug] = c.id; });
  console.log('Categories found:', Object.keys(catMap).length);
  Object.entries(catMap).forEach(([slug, id]) => console.log('  ' + slug + ' -> ' + id.substring(0,8) + '...'));

  // 3. Get existing brands  
  console.log('\nFetching existing brands...');
  const brands = await withRetry(async () => {
    const { data, error } = await sb.from('brands').select('id,slug,name');
    if (error) throw new Error(error.message);
    return data;
  }, 'fetch brands');
  
  let defaultBrandId = null;
  if (brands && brands.length > 0) {
    defaultBrandId = brands[0].id;
    console.log('Using brand:', brands[0].name, defaultBrandId.substring(0,8) + '...');
  }

  // 4. Upsert each product one at a time with delay
  console.log('\nUpserting products...');
  let successCount = 0;
  
  for (const prod of PRODUCTS) {
    // Find matching category, fallback to first available
    const categoryId = catMap[prod.category_slug] || catMap['devotional-keychains'] || catMap['krishna-keychains'] || Object.values(catMap)[0];
    
    const productData = {
      name: prod.name,
      title: prod.title,
      slug: prod.slug,
      description: prod.description,
      short_description: prod.short_description,
      price: prod.price,
      compare_price: prod.compare_price,
      sku: prod.sku,
      stock: prod.stock,
      category_id: categoryId,
      brand_id: defaultBrandId,
      material: prod.material,
      status: prod.status,
      featured: prod.featured,
      trending: prod.trending,
      rating: prod.rating,
      reviews_count: prod.reviews_count
    };

    const result = await withRetry(async () => {
      const { data, error } = await sb.from('products').upsert(productData, { onConflict: 'slug' }).select('id,name');
      if (error) throw new Error(error.message);
      return data;
    }, 'upsert ' + prod.name);

    if (result && result[0]) {
      console.log('  OK: ' + result[0].name + ' (id=' + result[0].id.substring(0,8) + '...)');
      
      // Small delay between operations
      await new Promise(r => setTimeout(r, 500));

      // Insert image
      const imgResult = await withRetry(async () => {
        await sb.from('product_images').delete().eq('product_id', result[0].id);
        const { error } = await sb.from('product_images').insert({
          product_id: result[0].id,
          image_url: prod.image_url,
          alt_text: prod.title,
          sort_order: 1,
          is_primary: true
        });
        if (error) throw new Error(error.message);
        return true;
      }, 'image for ' + prod.name);
      
      if (imgResult) console.log('    Image added');
      successCount++;
    }
    
    // Small delay between products
    await new Promise(r => setTimeout(r, 300));
  }

  // 5. Verify
  console.log('\n=== Results: ' + successCount + '/' + PRODUCTS.length + ' products seeded ===');
  
  const verification = await withRetry(async () => {
    const { data, error } = await sb.from('products').select('id,name,status').eq('status', 'active');
    if (error) throw new Error(error.message);
    return data;
  }, 'verification');
  
  if (verification) {
    console.log('Total active products in DB: ' + verification.length);
    verification.forEach(p => console.log('  ' + p.name));
  }
  
  console.log('\nDone!');
}

seed().catch(e => console.error('Fatal:', e));
