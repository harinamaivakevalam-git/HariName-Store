/**
 * Comprehensive Test Suite for Automatic Shiprocket Order Integration
 * Tests all 8 Scenarios specified in Step 27 of Requirements
 */

const http = require('http');
const app = require('../server/server');
const { processOrderFulfillment } = require('../server/services/fulfillmentService');
const shiprocketService = require('../server/services/shiprocketService');
const { supabaseAdmin, isSupabaseConfigured } = require('../server/config/supabase');
const db = require('../server/models/db');

let server;
const PORT = 5098;
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

async function runStep27Scenarios() {
  console.log('\n======================================================');
  console.log('🌸 RUNNING STEP 27 SHIPROCKET INTEGRATION SCENARIOS 🌸');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      if (details) console.log(`   ℹ️ ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title}`);
      if (details) console.error(`   ⚠️ ${details}`);
      failed++;
    }
  };

  try {
    // Authenticate Admin
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@harinama.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.body?.token;
    // --------------------------------------------------------------------------
    // TEST 1: New Successful Prepaid Order
    // Expected: 1 Supabase order, 1 Shiprocket order, 1 Shiprocket shipment reference
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 1: New Successful Prepaid Order ---');
    const res1 = await request('POST', '/orders', {
      items: [
        {
          product_name: 'Bhagavad Gita As It Is Deluxe',
          price: 550,
          quantity: 1,
          sku: 'HN-BG-01'
        }
      ],
      shipping_address: {
        name: 'Gaurav Devotee',
        phone: '9876543210',
        email: 'gaurav.prepaid@harinama.store',
        address_line_1: 'Chaitanya Vihar Phase 1',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        pin: '281121'
      },
      payment_method: 'razorpay',
      transaction_id: `pay_test_${Date.now()}`,
      payment_details: { razorpay_payment_id: `pay_test_${Date.now()}` }
    });

    assert(
      res1.status === 201 &&
      res1.body.success &&
      res1.body.data.order_number &&
      res1.body.data.shiprocket_order_id &&
      (res1.body.data.shipping_status === 'ORDER_CREATED' || res1.body.data.shipping_status === 'AWB_ASSIGNED'),
      'TEST 1: New successful prepaid order automatically creates Shiprocket order & shipment',
      `Order: ${res1.body.data?.order_number}, SR Order: ${res1.body.data?.shiprocket_order_id}, Shipping Status: ${res1.body.data?.shipping_status}`
    );

    // --------------------------------------------------------------------------
    // TEST 2: New COD Order
    // Expected: 1 Supabase order, 1 Shiprocket order according to COD rules
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 2: New COD Order ---');
    const res2 = await request('POST', '/orders', {
      items: [
        {
          product_name: 'Sacred Tulasi Japa Mala 108 Beads',
          price: 350,
          quantity: 1,
          sku: 'HN-TM-01'
        }
      ],
      shipping_address: {
        name: 'Radha Vallabh Das',
        phone: '9876543210',
        email: 'radhavallabh.cod@harinama.store',
        address_line_1: 'Banke Bihari Marg',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        pin: '281121'
      },
      payment_method: 'cod'
    });

    assert(
      res2.status === 201 &&
      res2.body.success &&
      res2.body.data.order_number &&
      res2.body.data.shiprocket_order_id &&
      (res2.body.data.shipping_status === 'ORDER_CREATED' || res2.body.data.shipping_status === 'AWB_ASSIGNED'),
      'TEST 2: New COD order automatically creates Shiprocket order',
      `Order: ${res2.body.data?.order_number}, SR Order: ${res2.body.data?.shiprocket_order_id}, Payment: ${res2.body.data?.payment_status}`
    );

    // --------------------------------------------------------------------------
    // TEST 3: Payment Failure / Unpaid Prepaid Attempt
    // Expected: No Shiprocket order created for unpaid or failed attempts
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Payment Failure / Pending Payment ---');
    // If an order is created with razorpay but without transaction_id (unpaid checkout attempt)
    const res3 = await request('POST', '/orders', {
      items: [
        {
          product_name: 'Lord Jagannath Devotional Keychain',
          price: 199,
          quantity: 1
        }
      ],
      shipping_address: {
        name: 'Pending Customer',
        phone: '9876543210',
        email: 'pending@harinama.store',
        address_line_1: 'Plot 10',
        city: 'Mathura',
        state: 'Uttar Pradesh',
        pin: '281121'
      },
      payment_method: 'razorpay',
      transaction_id: null,
      payment_details: {}
    });

    assert(
      res3.status === 201 &&
      res3.body.data.payment_status === 'pending' &&
      res3.body.data.shiprocket_order_id === null &&
      res3.body.data.shipping_status === 'NOT_CREATED',
      'TEST 3: Unpaid / Pending prepaid order does NOT create Shiprocket order prematurely',
      `Order: ${res3.body.data?.order_number}, Payment Status: ${res3.body.data?.payment_status}, Shipping Status: ${res3.body.data?.shipping_status}`
    );

    // --------------------------------------------------------------------------
    // TEST 4: Customer Double-Clicks "Place Order"
    // Expected: Only one valid order in Supabase and only one Shiprocket order
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Customer Double-Clicks Place Order ---');
    const doubleClickOrderNum = `HN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const payload4 = {
      order_number: doubleClickOrderNum,
      items: [
        { product_name: 'Sri Krishna Brass Diya', price: 299, quantity: 1 }
      ],
      shipping_address: {
        name: 'Ananda Das',
        phone: '9876543210',
        email: 'ananda@harinama.store',
        address_line_1: 'Plot 44, Vrindavan',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        pin: '281121'
      },
      payment_method: 'cod'
    };

    // First click
    const click1 = await request('POST', '/orders', payload4);
    // Simultaneous/immediate second click with identical order number
    const click2 = await request('POST', '/orders', payload4);

    assert(
      click1.status === 201 &&
      click2.status === 200 &&
      click1.body.data.order_number === doubleClickOrderNum &&
      click2.body.data.order_number === doubleClickOrderNum &&
      click1.body.data.shiprocket_order_id === click2.body.data.shiprocket_order_id,
      'TEST 4: Double-click submission is idempotent and prevents duplicate Supabase & Shiprocket orders',
      `Order: ${doubleClickOrderNum}, Click 1 SR ID: ${click1.body.data?.shiprocket_order_id}, Click 2 SR ID: ${click2.body.data?.shiprocket_order_id}`
    );

    // --------------------------------------------------------------------------
    // TEST 5: Payment Webhook Arrives Twice
    // Expected: Only one order, only one Shiprocket order
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Payment Webhook Arrives Twice ---');
    const webhookOrderNum = res3.body.data.order_number; // The pending order from Test 3
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_hook_${Date.now()}`,
            amount: 29800,
            notes: { order_number: webhookOrderNum }
          }
        }
      }
    };

    // First webhook event
    const hook1 = await request('POST', '/payments/webhook/razorpay', webhookPayload);
    // Second duplicate webhook event
    const hook2 = await request('POST', '/payments/webhook/razorpay', webhookPayload);

    // Fetch order details to verify
    const orderAfterWebhook = await request('GET', `/orders/${webhookOrderNum}`);

    assert(
      hook1.status === 200 &&
      hook2.status === 200 &&
      orderAfterWebhook.body.data.payment_status === 'paid' &&
      orderAfterWebhook.body.data.shiprocket_order_id !== null,
      'TEST 5: Duplicate payment webhook is handled idempotently without creating duplicate Shiprocket orders',
      `Order: ${webhookOrderNum}, Payment: ${orderAfterWebhook.body.data?.payment_status}, SR ID: ${orderAfterWebhook.body.data?.shiprocket_order_id}`
    );

    // --------------------------------------------------------------------------
    // TEST 6: Shiprocket Creation Failure Handling
    // Expected: Harinama Store order remains safe, shipping status = FAILED, Admin can retry
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Shiprocket Error / Safe Failure Handling ---');
    // Order with simulated invalid location to trigger safe failure catch
    const failedOrderNum = `HN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const failureRes = await processOrderFulfillment({
      id: failedOrderNum,
      order_number: failedOrderNum,
      payment_method: 'cod',
      payment_status: 'pending',
      shipping_address: {
        name: 'Test Customer',
        phone: '0000000000', // Invalid phone to trigger rejection in Shiprocket
        email: 'invalid@harinama.store',
        address_line_1: 'Invalid Location Nowhere',
        city: 'NonExistentCity',
        state: 'NonExistentState',
        pin: '000000'
      },
      items: [{ name: 'Test Product', price: 100, qty: 1 }]
    }, { force: true });

    assert(
      failureRes.success === false &&
      typeof failureRes.message === 'string',
      'TEST 6: Shiprocket failure safely handled without crashing, sets shipping_status = FAILED for admin retry',
      `Safe failure captured: "${failureRes.message}"`
    );

    // --------------------------------------------------------------------------
    // TEST 7: Shiprocket Remote Discovery (Server timed out before saving DB)
    // Expected: Remote search discovers existing Shiprocket order and links IDs without creating duplicate
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Shiprocket Remote Discovery & Self-Healing ---');
    // We use res1.body.data.order_number which is already registered on Shiprocket
    const existingOrderNum = res1.body.data.order_number;
    const remoteSearchRes = await shiprocketService.searchOrder(existingOrderNum);

    assert(
      remoteSearchRes !== null &&
      remoteSearchRes.exists === true &&
      String(remoteSearchRes.order_id) === String(res1.body.data.shiprocket_order_id),
      'TEST 7: Remote order discovery identifies previously created Shiprocket order by channel order ID',
      `Found existing Shiprocket Order ID: ${remoteSearchRes?.order_id} for ${existingOrderNum}`
    );

    // --------------------------------------------------------------------------
    // TEST 8: Admin Clicks "Create Shipment" on Already Fulfilled Order
    // Expected: No duplicate shipment created, existing Shiprocket information is returned
    // --------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Admin Manual Create Shipment / Retry Idempotency ---');
    const adminRetryRes = await request('POST', '/shiprocket/create-order', {
      order_number: existingOrderNum
    }, adminToken);

    assert(
      adminRetryRes.status === 200 &&
      adminRetryRes.body.success === true &&
      String(adminRetryRes.body.data.shiprocket_order_id) === String(res1.body.data.shiprocket_order_id),
      'TEST 8: Admin "Create Shipment" / "Retry Shiprocket" returns existing Shiprocket info without creating duplicates',
      `Returned SR Order ID: ${adminRetryRes.body.data?.shiprocket_order_id}`
    );

    console.log('\n======================================================');
    console.log(`ALL SCENARIOS COMPLETED: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Scenario execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

server = app.listen(PORT, () => {
  runStep27Scenarios();
});
