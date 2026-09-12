const db = require('../server/models/db');

console.log('[Seed] Re-initializing and seeding HariNama Store database...');
db.seedInitialData();
console.log('[Seed] Seed complete!');
console.log(`[Seed] Loaded:
- ${db.findAll('users').length} Users
- ${db.findAll('categories').length} Categories
- ${db.findAll('brands').length} Brands
- ${db.findAll('products').length} Products
- ${db.findAll('coupons').length} Coupons
- ${db.findAll('reviews').length} Reviews
`);
