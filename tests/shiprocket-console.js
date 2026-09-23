/**
 * Shiprocket Real-Time Diagnostic & Testing Console
 * Run with: node tests/shiprocket-console.js
 */

const sr = require('../server/services/shiprocketService');
const { processOrderFulfillment } = require('../server/services/fulfillmentService');
const { supabaseAdmin, isSupabaseConfigured } = require('../server/config/supabase');

async function runShiprocketConsole() {
  console.log('\n' + '='.repeat(65));
  console.log('📦  HARINAMA STORE — SHIPROCKET LIVE DIAGNOSTICS CONSOLE');
  console.log('='.repeat(65));

  // 1. Check Credentials Configuration
  console.log('\n[1/4] Checking Environment Configuration...');
  const isConfigured = sr.isConfigured();
  console.log(`  • Email: ${process.env.SHIPROCKET_EMAIL || 'NOT_SET'}`);
  console.log(`  • Pickup Location: ${process.env.SHIPROCKET_PICKUP_LOCATION || 'NOT_SET'}`);
  console.log(`  • Credentials Status: ${isConfigured ? '✅ CONFIGURED' : '❌ MISSING'}`);

  if (!isConfigured) {
    console.error('\n❌ Shiprocket credentials missing in .env. Please check SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');
    return;
  }

  // 2. Test Live Authentication & Pickup Location
  console.log('\n[2/4] Testing Shiprocket API Authentication...');
  try {
    const token = await sr.authenticate(true);
    console.log(`  • Auth Token: ✅ RECEIVED (${token.slice(0, 15)}...${token.slice(-10)})`);

    const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    const pickupJson = await pickupRes.json();
    const pickups = pickupJson.data?.shipping_address || [];
    console.log(`  • Verified Pickup Locations (${pickups.length}):`);
    pickups.forEach(p => {
      console.log(`     - Name: "${p.pickup_location}", City: ${p.city}, Pin: ${p.pin_code}, Status: ${p.status === 2 ? 'ACTIVE' : p.status}`);
    });
  } catch (err) {
    console.error(`  ❌ Authentication Failed: ${err.message}`);
    return;
  }

  // 3. Inspect Recent Orders in Shiprocket
  console.log('\n[3/4] Fetching Recent 5 Orders from Shiprocket...');
  try {
    const token = await sr.authenticate();
    const ordersRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders?per_page=5', {
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    const ordersJson = await ordersRes.json();
    const orderList = ordersJson.data || [];

    if (orderList.length === 0) {
      console.log('  • No orders currently in Shiprocket.');
    } else {
      orderList.forEach((o, idx) => {
        console.log(`  [#${idx + 1}] Order ID: ${o.channel_order_id || o.id}`);
        console.log(`       - SR Order ID: ${o.id}`);
        console.log(`       - Customer: ${o.customer_name} (${o.customer_phone || '—'})`);
        console.log(`       - Status: ${o.status} (Status Code: ${o.status_code})`);
        console.log(`       - Amount: ₹${o.total}`);
        console.log(`       - Date: ${o.created_at}`);
      });
    }
  } catch (err) {
    console.error(`  ❌ Failed to fetch orders: ${err.message}`);
  }

  // 4. Supabase Database Sync Check
  console.log('\n[4/4] Checking Orders in Supabase Database...');
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: dbOrders, error } = await supabaseAdmin
        .from('orders')
        .select('order_number, guest_name, total, order_status, shipping_status, shiprocket_order_id, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.log(`  ❌ Supabase Query Error: ${error.message}`);
      } else if (!dbOrders || dbOrders.length === 0) {
        console.log('  • No orders in Supabase database.');
      } else {
        dbOrders.forEach(o => {
          console.log(`  • Order: ${o.order_number} | Devotee: ${o.guest_name || 'Customer'} | Total: ₹${o.total} | Status: ${o.order_status} | SR ID: ${o.shiprocket_order_id || 'Not Linked'}`);
        });
      }
    } catch (e) {
      console.log(`  ❌ Supabase check error: ${e.message}`);
    }
  } else {
    console.log('  • Supabase admin not initialized.');
  }

  console.log('\n' + '='.repeat(65));
  console.log('✅  DIAGNOSTICS COMPLETE');
  console.log('='.repeat(65) + '\n');
}

runShiprocketConsole();
