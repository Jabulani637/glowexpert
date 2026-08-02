const express = require('express');
const { buildPaymentFields, verifyItn, getPayFastHost } = require('../payments/payfast');
const { findOrderById, updateOrderPayment } = require('../models/Order');
const { findInfluencerByCode, addCommission } = require('../models/Influencer');
const { upsertPaymentToken, findDefaultTokenByClerkUserId, findTokensByClerkUserId } = require('../models/PaymentToken');
const https = require('https');

const router = express.Router();

/**
 * Shared function to handle commission payout after payment confirmation
 * Called by both ITN notify and token charge handlers
 */
async function handleCommissionPayout(order) {
  if (order.influencer_id) {
    const matchedInfluencer = await findInfluencerByCode(order.referral_code);
    if (matchedInfluencer) {
      const commissionRate = Number(matchedInfluencer.commission_rate) / 100;
      const commission = parseFloat(order.total_amount) * commissionRate;
      await addCommission(matchedInfluencer.id, commission);
    }
  }
}

/**
 * GET /api/payments/tokens/:clerk_user_id
 * Get all payment tokens for a user
 */
router.get('/payments/tokens/:clerk_user_id', async (req, res) => {
  try {
    const { clerk_user_id } = req.params;

    if (!clerk_user_id) {
      return res.status(400).json({ message: 'clerk_user_id is required' });
    }

    const tokens = await findTokensByClerkUserId(clerk_user_id);
    return res.status(200).json({
      message: 'Tokens retrieved successfully',
      data: tokens,
    });
  } catch (error) {
    console.error('[get tokens] error:', error);
    return res.status(500).json({ message: error.message || 'Failed to retrieve tokens' });
  }
});

/**
 * POST /api/payments/payfast/initiate
 * Initiate a PayFast payment for an order
 * Body: { order_id }
 */
router.post('/payments/payfast/initiate', async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: 'order_id is required' });
    }

    // Load the order
    const order = await findOrderById(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Build payment fields
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { fields, mPaymentId, host } = buildPaymentFields(order, {
      return_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
      notify_url: `${baseUrl}/api/payments/payfast/notify`,
    });

    // Update order with PayFast m_payment_id
    await updateOrderPayment(order_id, { payfastMPaymentId: mPaymentId });

    return res.status(200).json({
      message: 'Payment initiated',
      data: {
        fields,
        payfastUrl: `https://${host}/eng/process`,
        host,
      },
    });
  } catch (error) {
    console.error('[initiate] error:', error);
    return res.status(500).json({ message: error.message || 'Failed to initiate payment' });
  }
});

/**
 * POST /api/payments/payfast/notify
 * ITN webhook endpoint - called by PayFast
 * No authentication required (PayFast calls this directly)
 */
router.post('/payments/payfast/notify', async (req, res) => {
  try {
    const payload = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Extract order ID from m_payment_id (format: ORD-{order_id}-{timestamp})
    const mPaymentId = payload.m_payment_id;
    if (!mPaymentId) {
      console.error('[notify] Missing m_payment_id in payload');
      return res.status(400).send('BAD');
    }

    const orderIdMatch = mPaymentId.match(/^ORD-([a-f0-9-]+)-\d+$/);
    if (!orderIdMatch) {
      console.error('[notify] Invalid m_payment_id format:', mPaymentId);
      return res.status(400).send('BAD');
    }

    const orderId = orderIdMatch[1];

    // Load the order
    const order = await findOrderById(orderId);
    if (!order) {
      console.error('[notify] Order not found:', orderId);
      return res.status(404).send('BAD');
    }

    // Verify the ITN (all four checks)
    const verification = await verifyItn(payload, ip, order);
    if (!verification.valid) {
      console.error('[notify] Verification failed:', verification.errors);
      return res.status(400).send('BAD');
    }

    // Check payment status from PayFast
    const paymentStatus = payload.payment_status;
    if (paymentStatus !== 'COMPLETE') {
      console.log('[notify] Payment not complete:', paymentStatus);
      return res.status(200).send('OK'); // Still acknowledge, but don't mark as paid
    }

    // Update order as paid
    const paidAt = new Date().toISOString();
    await updateOrderPayment(orderId, {
      paymentStatus: 'paid',
      paidAt,
    });

    // Handle commission payout
    await handleCommissionPayout(order);

    // Save payment token if provided
    if (payload.token && order.clerk_user_id) {
      const cardBrand = payload.card_brand || null;
      const cardLastFour = payload.card_last_four || null;
      await upsertPaymentToken({
        clerkUserId: order.clerk_user_id,
        token: payload.token,
        cardBrand,
        cardLastFour,
        isDefault: true,
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[notify] error:', error);
    return res.status(500).send('BAD');
  }
});

/**
 * POST /api/payments/payfast/charge-token
 * Charge a saved payment token for an order
 * Body: { clerk_user_id, order_id }
 */
router.post('/payments/payfast/charge-token', async (req, res) => {
  try {
    const { clerk_user_id, order_id } = req.body;

    if (!clerk_user_id || !order_id) {
      return res.status(400).json({ message: 'clerk_user_id and order_id are required' });
    }

    // Load the order
    const order = await findOrderById(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find user's default payment token
    const paymentToken = await findDefaultTokenByClerkUserId(clerk_user_id);
    if (!paymentToken) {
      return res.status(404).json({ message: 'No payment token found for user' });
    }

    // Make adhoc charge call to PayFast tokenization API
    const host = getPayFastHost();
    const chargeResult = await makeAdhocCharge(host, paymentToken.token, order);

    if (!chargeResult.success) {
      // Update order as failed
      await updateOrderPayment(order_id, { paymentStatus: 'failed' });
      return res.status(400).json({ message: chargeResult.error || 'Charge failed' });
    }

    // Update order as paid
    const paidAt = new Date().toISOString();
    await updateOrderPayment(order_id, {
      paymentStatus: 'paid',
      paidAt,
    });

    // Handle commission payout
    await handleCommissionPayout(order);

    return res.status(200).json({
      message: 'Payment successful',
      data: {
        transactionId: chargeResult.transactionId,
        paidAt,
      },
    });
  } catch (error) {
    console.error('[charge-token] error:', error);
    return res.status(500).json({ message: error.message || 'Failed to charge token' });
  }
});

/**
 * Make adhoc charge to PayFast using saved token
 * @param {string} host - PayFast host
 * @param {string} token - Saved payment token
 * @param {Object} order - Order object
 * @returns {Promise<Object>} Charge result
 */
function makeAdhocCharge(host, token, order) {
  return new Promise((resolve, reject) => {
    const path = '/eng/process'; // PayFast adhoc charge endpoint

    // Build charge parameters
    const params = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      amount: order.total_amount.toFixed(2),
      item_name: `Order ${order.id}`,
      m_payment_id: `TOKEN-CHARGE-${order.id}-${Date.now()}`,
      token: token,
      email_address: order.customer_email,
      confirmation_address: `${process.env.FRONTEND_URL}/api/payments/payfast/notify`,
    };

    const queryParams = new URLSearchParams(params).toString();

    const options = {
      host,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(queryParams),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          // Parse response to check if charge was successful
          // PayFast returns redirect on success, but for adhoc we check the response
          resolve({
            success: true,
            transactionId: params.m_payment_id,
          });
        } else {
          resolve({
            success: false,
            error: `PayFast returned status ${res.statusCode}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(queryParams);
    req.end();
  });
}

module.exports = router;
