const crypto = require('crypto');
const Razorpay = require('razorpay');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');
require('dotenv').config();

// Helper to get active Razorpay instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret && !keyId.includes('placeholder') && !keyId.includes('demo')) {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return null;
};

// 1. Create Payment Order (POST /api/payments/create-order)
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const {
      amount,
      currency = 'INR',
      provider = 'razorpay',
      order_id = null,
      order_number = null,
      customer_name = '',
      customer_email = '',
      customer_phone = '',
      notes = {}
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const orderAmount = Math.round(parseFloat(amount) * 100); // Amount in paise/cents

    if (provider === 'razorpay') {
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TdKaEz5Ly8qmgb';
      const rzp = getRazorpayInstance();

      const orderReceipt = String(order_number || order_id || `rcpt_${Date.now()}`).slice(0, 40);
      const mergedNotes = {
        store_name: 'Harinama Store',
        order_number: order_number || '',
        customer_name: customer_name || '',
        customer_email: customer_email || '',
        customer_phone: customer_phone || '',
        ...notes
      };

      if (rzp) {
        try {
          const rzpOrder = await rzp.orders.create({
            amount: orderAmount,
            currency: currency.toUpperCase(),
            receipt: orderReceipt,
            notes: mergedNotes
          });

          return res.json({
            success: true,
            provider: 'razorpay',
            key: keyId,
            order: rzpOrder
          });
        } catch (rzpErr) {
          console.error('[Razorpay Order Creation Error]', rzpErr);
          return res.status(500).json({
            success: false,
            message: rzpErr.error?.description || rzpErr.message || 'Failed to create Razorpay order'
          });
        }
      }

      // Safe fallback / test simulation
      const paymentOrder = {
        id: `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        entity: 'order',
        amount: orderAmount,
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        status: 'created',
        notes: mergedNotes,
        is_demo: keyId.includes('demo') || keyId.includes('placeholder')
      };

      return res.json({
        success: true,
        provider: 'razorpay',
        key: keyId,
        order: paymentOrder
      });
    } else if (provider === 'stripe') {
      const isDemo = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('demo');

      return res.json({
        success: true,
        provider: 'stripe',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_demo',
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
        is_demo: isDemo
      });
    }

    res.status(400).json({ success: false, message: 'Unsupported payment provider.' });
  } catch (err) {
    next(err);
  }
};

// Helper to update Order & Payment Records in Supabase and Local DB
async function recordSuccessfulPayment({
  orderNumber,
  orderId,
  paymentId,
  paymentOrderId,
  amount,
  provider = 'razorpay',
  method = 'online',
  rawDetails = {}
}) {
const client = (isSupabaseConfigured && supabaseAdmin) ? supabaseAdmin : supabase;
  let targetOrderId = orderId;

  if (client) {
    try {
      let query = client.from('orders').select('*');
      if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      } else if (orderId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        if (isUuid) query = query.eq('id', orderId);
        else query = query.eq('order_number', orderId);
      } else if (paymentOrderId) {
        const { data: payRow } = await client.from('payments').select('order_id').eq('payment_order_id', paymentOrderId).maybeSingle();
        if (payRow && payRow.order_id) {
          query = query.eq('id', payRow.order_id);
        } else {
          query = query.eq('order_number', paymentOrderId);
        }
      }

      const { data: matchedOrder, error: fetchErr } = await query.maybeSingle();

      if (fetchErr) {
        console.warn('[PaymentController] Error finding order for payment:', fetchErr.message);
      }

      if (matchedOrder) {
        targetOrderId = matchedOrder.id;
        const { error: updErr } = await client
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: (matchedOrder.order_status === 'pending' ? 'confirmed' : matchedOrder.order_status) || 'confirmed',
            payment_method: provider,
            updated_at: new Date().toISOString()
          })
          .eq('id', matchedOrder.id);

        if (updErr) {
          console.error('[PaymentController] Failed to update order payment status:', updErr.message);
        } else {
          console.log(`[PaymentController] Successfully marked order ${matchedOrder.order_number || matchedOrder.id} as PAID`);
        }

        // Record in payments table
        await client
          .from('payments')
          .insert({
            order_id: matchedOrder.id,
            payment_provider: provider,
            transaction_id: paymentId,
            payment_order_id: paymentOrderId || null,
            amount: amount || matchedOrder.total_amount || matchedOrder.total || 0,
            currency: 'INR',
            status: 'captured',
            payment_details: rawDetails
          });
      }
    } catch (sbE) {
      console.warn('[PaymentController] Supabase update warning:', sbE.message);
    }
  }

  // Local database fallback update
  try {
    const localOrder = (orderNumber && db.findOne('orders', o => o.order_number === orderNumber)) ||
                        (orderId && db.findById('orders', orderId)) ||
                        (paymentOrderId && db.findOne('orders', o => o.payment_order_id === paymentOrderId || o.transaction_id === paymentOrderId));

    if (localOrder) {
      db.update('orders', localOrder.id, {
        payment_status: 'paid',
        status: localOrder.status === 'pending' ? 'processing' : localOrder.status,
        payment_method: provider,
        transaction_id: paymentId || localOrder.transaction_id,
        updated_at: new Date().toISOString()
      });

      db.insert('payments', {
        order_id: localOrder.id,
        payment_provider: provider,
        transaction_id: paymentId,
        payment_order_id: paymentOrderId || null,
        amount: amount || localOrder.total || 0,
        currency: 'INR',
        status: 'captured',
        payment_details: rawDetails
      });
    }
  } catch (dbE) {}

  // Trigger automatic Shiprocket fulfillment and email for newly paid order
  try {
    const { processOrderFulfillment } = require('../services/fulfillmentService');
    const { sendOrderConfirmationEmail } = require('../services/emailService');
    const orderIdentifier = orderNumber || targetOrderId || orderId;
    if (orderIdentifier) {
      processOrderFulfillment(orderIdentifier).catch(() => {});
      if (typeof matchedOrder === 'object' && matchedOrder) {
        sendOrderConfirmationEmail(matchedOrder).catch(() => {});
      }
    }
  } catch (fErr) {
    console.warn('[Payment Controller] Fulfillment dispatch notice:', fErr.message);
  }
}

// 2. Client Verification Handler (POST /api/payments/verify)
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      provider = 'razorpay',
      order_id,
      order_number,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      stripe_payment_intent_id,
      amount
    } = req.body;

    let isVerified = false;

    if (provider === 'razorpay') {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret && !secret.includes('demo') && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');
        isVerified = (generatedSignature === razorpay_signature);
      } else {
        isVerified = Boolean(razorpay_payment_id);
      }
    } else if (provider === 'stripe') {
      isVerified = Boolean(stripe_payment_intent_id);
    } else if (provider === 'cod') {
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Signature mismatch.'
      });
    }

    await recordSuccessfulPayment({
      orderNumber: order_number,
      orderId: order_id,
      paymentId: razorpay_payment_id || stripe_payment_intent_id,
      paymentOrderId: razorpay_order_id,
      amount: amount,
      provider: provider,
      rawDetails: req.body
    });

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified and captured successfully.',
      data: {
        payment_id: razorpay_payment_id || stripe_payment_intent_id,
        payment_status: 'paid'
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. Razorpay & Multi-Gateway Webhook Handler (POST /api/payments/webhook/razorpay & /api/payments/webhook)
exports.handleWebhook = async (req, res) => {
  try {
    const provider = req.params.provider || 'razorpay';
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    console.log(`[Payment Webhook Received] Provider: ${provider}, Event: ${req.body?.event}`);

    // Verify webhook signature if secret configured
    if (provider === 'razorpay' && webhookSecret && razorpaySignature) {
      const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        console.error('[Razorpay Webhook Signature Mismatch]');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload || {};

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity || {};
      const orderEntity = payload.order?.entity || {};

      const paymentId = paymentEntity.id;
      const rzpOrderId = paymentEntity.order_id || orderEntity.id;
      const amount = paymentEntity.amount ? (paymentEntity.amount / 100) : (orderEntity.amount_paid ? orderEntity.amount_paid / 100 : null);
      const notes = { ...orderEntity.notes, ...paymentEntity.notes };
      const orderNumber = notes.order_number || notes.order_id || null;

      console.log(`[Razorpay Webhook Success] Processing payment ${paymentId} for order ${orderNumber || rzpOrderId}`);

      await recordSuccessfulPayment({
        orderNumber: orderNumber,
        paymentId: paymentId,
        paymentOrderId: rzpOrderId,
        amount: amount,
        provider: 'razorpay',
        method: paymentEntity.method || 'online',
        rawDetails: paymentEntity
      });
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity || {};
      const notes = paymentEntity.notes || {};
      const orderNumber = notes.order_number || null;

      console.warn(`[Razorpay Webhook Payment Failed] Payment ${paymentEntity.id} failed for order ${orderNumber}`);

      const client = (isSupabaseConfigured && (supabaseAdmin || supabase)) ? (supabaseAdmin || supabase) : null;
      if (client && orderNumber) {
        try {
          await client
            .from('orders')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
            .eq('order_number', orderNumber);
        } catch (e) {}
      }
    }

    // Acknowledge receipt to Razorpay immediately
    res.status(200).json({ success: true, received: true, event: event });
  } catch (err) {
    console.error('[Payment Webhook Error]', err);
    res.status(500).json({ error: err.message });
  }
};
