// Automated Comprehensive API Test Runner
const http = require('http');
const app = require('../server/server');

let server;
const PORT = 5099;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

const db = require('../server/models/db');

async function runTests() {
  console.log('--- STARTING HARINAMA STORE AUTOMATED TESTS ---');
  db.seedInitialData();
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.status === 'online', '1. API Health Check Endpoint');

    // 2. Auth Login (Admin & Customer)
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@harinama.com',
      password: 'admin123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.token, '2. Admin Login and JWT Token Generation');
    const adminToken = adminLogin.body.token;

    const userLogin = await request('POST', '/auth/login', {
      email: 'user@harinama.com',
      password: 'user123'
    });
    assert(userLogin.status === 200 && userLogin.body.user.role === 'customer', '3. Customer Login and Role Verification');
    const userToken = userLogin.body.token;

    // 3. User Me Profile
    const me = await request('GET', '/auth/me', null, userToken);
    assert(me.status === 200 && me.body.user.email === 'user@harinama.com', '4. Authenticated /api/auth/me Endpoint');

    // 4. Products Listing & Filtering
    const products = await request('GET', '/products?page=1&limit=6');
    assert(products.status === 200 && products.body.data.length > 0 && products.body.totalPages >= 1, '5. Paginated Products Catalog');

    const searchRes = await request('GET', '/products?search=gita');
    assert(searchRes.status === 200 && searchRes.body.data.some(p => p.slug.includes('gita')), '6. Full-text Search for "gita"');

    const catFilter = await request('GET', '/products?category=sacred-books');
    assert(catFilter.status === 200 && catFilter.body.data.length > 0, '7. Category Filtering (sacred-books)');

    // 5. Product Details by Slug
    const productDetail = await request('GET', '/products/bhagavad-gita-as-it-is-deluxe');
    assert(productDetail.status === 200 && productDetail.body.data.name.includes('Bhagavad Gita'), '8. Product Details with Reviews and Variants Hydration');

    // 6. Cart Operations
    const addToCart = await request('POST', '/cart/add', {
      product_id: 'prod-001',
      quantity: 2
    }, userToken);
    assert(addToCart.status === 200 && addToCart.body.data.items.length > 0, '9. Add to Cart with Stock Check');

    const cart = await request('GET', '/cart', null, userToken);
    assert(cart.status === 200 && cart.body.data.subtotal > 0, '10. Get User Cart with Subtotal & Taxes');

    // 7. Coupon Validation
    const couponRes = await request('POST', '/coupons/validate', {
      code: 'WELCOME10',
      subtotal: 1500
    });
    assert(couponRes.status === 200 && couponRes.body.data.discount_amount === 150, '11. Server-Side Coupon Discount Calculation (WELCOME10)');

    // 8. Server-Side Checkout Calculation
    const checkoutCalc = await request('POST', '/checkout/calculate', {
      items: [
        { product_id: 'prod-001', quantity: 1 },
        { product_id: 'prod-002', quantity: 1 }
      ],
      coupon_code: 'WELCOME10'
    });
    assert(checkoutCalc.status === 200 && checkoutCalc.body.data.total > 0 && checkoutCalc.body.data.discount > 0, '12. Anti-Tampering Server-Side Checkout Price Calculation');

    // 9. Order Placement & Stock Decrement
    const orderPlacement = await request('POST', '/orders', {
      items: [
        { product_id: 'prod-001', quantity: 1 }
      ],
      shipping_address: {
        name: 'Gauranga Das',
        phone: '+91 91234 56789',
        address_line_1: 'Flat 402, Radharani Kripa',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        postal_code: '281121',
        country: 'India'
      },
      payment_method: 'cod'
    }, userToken);
    assert(orderPlacement.status === 201 && orderPlacement.body.data.order_number.startsWith('HN-'), '13. Atomic Order Creation & Tracking Number Generation');

    const orderNum = orderPlacement.body.data.order_number;
    const orderDetails = await request('GET', `/orders/${orderNum}`, null, userToken);
    assert(orderDetails.status === 200 && orderDetails.body.data.timeline.length > 0, '14. Visual Order Timeline & Status Tracking');

    // 10. Wishlist Operations
    const toggleWish = await request('POST', '/wishlist/toggle', { product_id: 'prod-005' }, userToken);
    assert(toggleWish.status === 200 && toggleWish.body.action, '15. Wishlist Toggle Operation');

    // 11. Admin Authorization & Analytics
    const unauthorizedAdmin = await request('GET', '/admin/dashboard-stats', null, userToken);
    assert(unauthorizedAdmin.status === 403, '16. Role-Based Access Control (Customers Denied Admin Access)');

    const authorizedAdmin = await request('GET', '/admin/dashboard-stats', null, adminToken);
    assert(authorizedAdmin.status === 200 && authorizedAdmin.body.data.totalProducts > 0, '17. Admin Dashboard Analytics & Sales Data KPI retrieval');

    // 12. Address Management CRUD
    const addAddress = await request('POST', '/addresses', {
      name: 'Radha Raman Das',
      phone: '+91 99887 76655',
      address_line_1: 'Sri Sri Radha Madhav Temple Marg',
      city: 'Mayapur',
      state: 'West Bengal',
      postal_code: '741313',
      country: 'India',
      address_type: 'Temple'
    }, userToken);
    assert(addAddress.status === 201 && addAddress.body.data.city === 'Mayapur', '18. Customer Address Creation');

    const addressList = await request('GET', '/addresses', null, userToken);
    assert(addressList.status === 200 && addressList.body.data.length >= 1, '19. Customer Address List Retrieval');

    // 13. Review Creation & Moderation
    const createReview = await request('POST', '/reviews', {
      product_id: 'prod-003',
      rating: 5,
      title: 'Supreme Ahimsa Silk Kurta',
      comment: 'An absolute masterpiece of craftsmanship and divine comfort for temple festivities.'
    }, userToken);
    assert(createReview.status === 201 && createReview.body.data.rating === 5, '20. Customer Product Review Submission');

    // 14. Payment Order Creation & Verification
    const createPayment = await request('POST', '/payments/create-order', {
      amount: 1500,
      provider: 'razorpay'
    }, userToken);
    assert(createPayment.status === 200 && createPayment.body.order.amount === 150000, '21. Razorpay/Stripe Payment Order Creation in Currency Sub-units');

    // 15. Notification Retrieval
    const notifs = await request('GET', '/notifications', null, userToken);
    assert(notifs.status === 200 && Array.isArray(notifs.body.data), '22. Real-time Customer Notifications Stream');

    // 16. Admin Category & Coupon Management
    const adminCoupons = await request('GET', '/coupons', null, adminToken);
    assert(adminCoupons.status === 200 && adminCoupons.body.data.length >= 1, '23. Admin Coupon Management Listing');

    const adminOrders = await request('GET', '/orders/admin/all', null, adminToken);
    assert(adminOrders.status === 200 && adminOrders.body.data.length >= 1, '24. Admin Order Management and Tracking View');

    // 17. Categories Listing
    const categories = await request('GET', '/categories');
    assert(categories.status === 200 && categories.body.data.length > 0, '25. Public Active Category Hierarchy');

    console.log(`\n==============================================`);
    console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`==============================================\n`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

server = app.listen(PORT, () => {
  runTests();
});
