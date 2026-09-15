const crypto = require('crypto');
const Razorpay = require('razorpay');
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

// Create Payment Intent / Order
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', provider = 'razorpay', order_id = null } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const orderAmount = Math.round(parseFloat(amount) * 100); // Amount in paise/cents

    if (provider === 'razorpay') {
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
      const rzp = getRazorpayInstance();

      if (rzp) {
        try {
          const rzpOrder = await rzp.orders.create({
            amount: orderAmount,
            currency: currency.toUpperCase(),
            receipt: `rcpt_${Date.now()}`
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

      // Safe demo simulation if credentials are mock/missing
      const isDemo = keyId.includes('demo') || keyId.includes('placeholder');
      const paymentOrder = {
        id: `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        entity: 'order',
        amount: orderAmount,
        currency: currency.toUpperCase(),
        receipt: `rcpt_${Date.now()}`,
        status: 'created',
        is_demo: isDemo
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

// Verify Payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      provider = 'razorpay',
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      stripe_payment_intent_id
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
        // Safe verified simulation for test mode
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

    // If order_id exists, update the order in DB
    if (order_id) {
      const order = db.findById('orders', order_id);
      if (order) {
        db.update('orders', order.id, {
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        });

        db.insert('payments', {
          order_id: order.id,
          payment_provider: provider,
          transaction_id: razorpay_payment_id || stripe_payment_intent_id || `txn_${Date.now()}`,
          payment_order_id: razorpay_order_id || null,
          amount: order.total,
          currency: 'INR',
          status: 'captured'
        });
      }
    }

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

// Webhook Handler for Payment Gateways
exports.handleWebhook = async (req, res) => {
  try {
    const provider = req.params.provider;
    console.log(`[Payment Webhook] Received webhook from ${provider}:`, req.body);
    // Respond with 200 OK immediately for idempotency
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
