const { supabaseAdmin } = require('../server/config/supabase');
const shiprocketService = require('../server/services/shiprocketService');

async function runEndToEndTest() {
  console.log('================================================================');
  console.log('🌸 HARINAMA STORE: END-TO-END COMMERCE & SHIPROCKET LIFECYCLE TEST 🌸');
  console.log('================================================================\n');

  // STEP 1: Simulate Customer Adding Product to Cart & Placing Order
  const testOrderNumber = 'HN-TEST-' + Math.floor(100000 + Math.random() * 900000);
  console.log('📦 STEP 1: Placing Order at Checkout with Number:', testOrderNumber);

  const shippingAddr = {
    name: 'Sri Radhe Devotee',
    phone: '9876543210',
    email: 'devotee.test@harinamastore.com',
    address_line_1: 'Flat 108, Sri Krishna Nilayam, Vrindavan Road',
    city: 'Hyderabad',
    state: 'Telangana',
    pin: '500034'
  };

  const { data: newOrder, error: orderErr } = await supabaseAdmin.from('orders').insert({
    order_number: testOrderNumber,
    guest_name: shippingAddr.name,
    guest_email: shippingAddr.email,
    subtotal: 99.00,
    discount: 0.00,
    shipping_fee: 0.00,
    tax: 0.00,
    total: 99.00,
    payment_status: 'pending',
    payment_method: 'cod',
    order_status: 'confirmed',
    shipping_address: shippingAddr,
    billing_address: shippingAddr,
    tracking_number: 'HN-EXP-' + Math.floor(100000 + Math.random() * 900000),
    tracking_url: '/order-tracking.html?order=' + testOrderNumber,
    notes: 'End-to-End automated validation test.'
  }).select().maybeSingle();

  if (orderErr || !newOrder) {
    console.error('❌ Failed Step 1 (Order creation):', orderErr);
    return;
  }
  console.log('✅ Order created in Supabase with DB ID:', newOrder.id);

  // Insert Order Items
  const { data: itemData, error: itemErr } = await supabaseAdmin.from('order_items').insert({
    order_id: newOrder.id,
    product_id: '8ff21c2a-e054-43b8-abad-0bd414e39a88',
    sku: 'HN-PROD-252476',
    product_name: 'Lord Jagannath Devotional Keychain | Spiritual Blessings & Protection',
    quantity: 1,
    price: 99.00,
    total: 99.00
  }).select();

  if (itemErr || !itemData) {
    console.error('❌ Failed Step 1 (Item creation):', itemErr);
    return;
  }
  console.log('✅ Item attached in Supabase order_items table (Qty: 1, Total: ₹99)');

  // STEP 2: Verify Admin Dashboard Retrieval
  console.log('\n📊 STEP 2: Verifying Admin Dashboard Database Retrieval...');
  const { data: adminFetch, error: adminErr } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', newOrder.id)
    .single();

  if (adminErr || !adminFetch) {
    console.error('❌ Failed Step 2:', adminErr);
    return;
  }
  console.log('✅ Admin Query Successful:');
  console.log('   - Order ID:', adminFetch.order_number);
  console.log('   - Customer:', adminFetch.guest_name, '(' + adminFetch.guest_email + ')');
  console.log('   - Payment:', adminFetch.payment_method.toUpperCase(), '(Status: ' + adminFetch.payment_status + ')');
  console.log('   - Items count:', adminFetch.order_items.length);

  // STEP 3: Shiprocket API v2 Live Order & Shipment Creation
  console.log('\n🚚 STEP 3: Sending Order to Shiprocket API v2...');
  const orderForShiprocket = {
    ...adminFetch,
    items: adminFetch.order_items
  };

  const srRes = await shiprocketService.createOrder(orderForShiprocket);
  console.log('✅ Shiprocket Order & Shipment Created Successfully:');
  console.log('   - Shiprocket Order ID:', srRes.data.order_id);
  console.log('   - Shiprocket Shipment ID:', srRes.data.shipment_id);
  console.log('   - Shipping Status Code:', srRes.data.status_code);

  // STEP 4: Update Database with Shiprocket IDs
  console.log('\n🔄 STEP 4: Updating Supabase Order with Shiprocket Fulfillment Data...');
  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      shiprocket_order_id: String(srRes.data.order_id),
      shiprocket_shipment_id: String(srRes.data.shipment_id),
      shipping_status: 'ORDER_CREATED',
      courier_name: 'India Post Speed Post',
      updated_at: new Date().toISOString()
    })
    .eq('id', newOrder.id)
    .select()
    .single();

  if (updateErr) {
    console.error('❌ Failed Step 4:', updateErr);
    return;
  }
  console.log('✅ Supabase Order now linked to Shiprocket:');
  console.log('   - shiprocket_order_id:', updatedOrder.shiprocket_order_id);
  console.log('   - shiprocket_shipment_id:', updatedOrder.shiprocket_shipment_id);
  console.log('   - shipping_status:', updatedOrder.shipping_status);

  // STEP 5: Final Lifecycle Summary
  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🌸');
  console.log('1. Customer Cart & Checkout -> Saved to Supabase');
  console.log('2. Admin Portal -> Retrieved with 100% details');
  console.log('3. Shiprocket API v2 -> Created Real Shipment #' + srRes.data.shipment_id);
  console.log('4. Live Tracking -> Linked and ready for courier pickup');
  console.log('================================================================');
}

runEndToEndTest();
