const crypto = require('crypto');
require('dotenv').config();

const PAYMONGO_BASE_URL = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';

/**
 * Returns Base64 encoded Basic Auth header for PayMongo API
 */
const getAuthHeader = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY?.trim() || '';
  if (!secretKey) {
    throw new Error('PAYMONGO_SECRET_KEY is not configured in environment variables.');
  }
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
};

/**
 * Create a PayMongo Checkout Session
 * 
 * @param {Object} params
 * @param {number} params.amount - Total amount in Philippine Pesos (e.g. 5000.00)
 * @param {string} params.description - Checkout description
 * @param {string} params.serviceName - Name of the service being purchased
 * @param {string} params.referenceNumber - FairFly internal payment reference
 * @param {string} params.successUrl - Redirect URL upon payment success
 * @param {string} params.cancelUrl - Redirect URL upon payment cancellation
 * @param {Object} [params.metadata={}] - FairFly context metadata (paymentId, quotationId, clientUid, etc.)
 * @returns {Promise<Object>} PayMongo Checkout Session data
 */
const createPaymongoCheckoutSession = async ({
  amount,
  description,
  serviceName,
  referenceNumber,
  successUrl,
  cancelUrl,
  metadata = {}
}) => {
  const amountInCentavos = Math.round(Number(amount) * 100);

  if (isNaN(amountInCentavos) || amountInCentavos <= 0) {
    throw new Error('Invalid payment amount. Amount must be greater than zero.');
  }

  // PayMongo supports standard Philippine payment methods
  const paymentMethodTypes = [
    'gcash',
    'paymaya',
    'card',
    'qrph',
    'grab_pay',
    'dob',
    'billease'
  ];

  const payload = {
    data: {
      attributes: {
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        line_items: [
          {
            currency: 'PHP',
            amount: amountInCentavos,
            name: serviceName || 'FairFly Service Booking',
            quantity: 1,
            description: description || `Payment reference: ${referenceNumber}`
          }
        ],
        payment_method_types: paymentMethodTypes,
        description: description || `FairFly Booking Payment - Ref: ${referenceNumber}`,
        reference_number: referenceNumber,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          referenceNumber
        }
      }
    }
  };

  const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const errorMsg = responseBody.errors?.map(e => e.detail).join('; ') || 'Failed to create PayMongo checkout session';
    console.error('[PayMongo] API Error creating checkout session:', responseBody);
    throw new Error(`PayMongo Gateway Error: ${errorMsg}`);
  }

  const sessionData = responseBody.data;
  return {
    id: sessionData.id,
    type: sessionData.type,
    checkout_url: sessionData.attributes.checkout_url,
    attributes: sessionData.attributes
  };
};

/**
 * Retrieve PayMongo Checkout Session details by ID
 * 
 * @param {string} sessionId - PayMongo checkout session ID (cs_...)
 * @returns {Promise<Object>}
 */
const getPaymongoCheckoutSession = async (sessionId) => {
  if (!sessionId) {
    throw new Error('PayMongo sessionId is required.');
  }

  const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': getAuthHeader()
    }
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const errorMsg = responseBody.errors?.map(e => e.detail).join('; ') || 'Failed to retrieve PayMongo checkout session';
    console.error(`[PayMongo] API Error retrieving checkout session ${sessionId}:`, responseBody);
    throw new Error(`PayMongo Gateway Error: ${errorMsg}`);
  }

  return responseBody.data;
};

/**
 * Cryptographically verify PayMongo Webhook Signature
 * PayMongo sends header: `paymongo-signature` formatted as: `t=<timestamp>,te=<test_sig>,li=<live_sig>`
 * Signature verification: HMAC-SHA256 of `${t}.${rawBody}` compared with `te` or `li`.
 * 
 * @param {string} signatureHeader - Value of 'paymongo-signature' header
 * @param {Buffer|string} rawBody - Unparsed request body buffer or string
 * @param {string} [webhookSecret] - Webhook secret from PayMongo dashboard
 * @returns {{ valid: boolean, error?: string, timestamp?: number }}
 */
const verifyWebhookSignature = (signatureHeader, rawBody, webhookSecret) => {
  const secret = (webhookSecret || process.env.PAYMONGO_WEBHOOK_SECRET || '').trim();

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return { valid: false, error: 'Missing or invalid paymongo-signature header' };
  }

  if (!rawBody) {
    return { valid: false, error: 'Missing request raw body' };
  }

  // Parse key-value pairs from header (e.g. t=1630000000,te=hash1,li=hash2)
  const parts = signatureHeader.split(',').reduce((acc, pair) => {
    const [key, val] = pair.trim().split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {});

  const timestamp = parseInt(parts.t, 10);
  const testSig = parts.te;
  const liveSig = parts.li;

  if (!timestamp || isNaN(timestamp)) {
    return { valid: false, error: 'Invalid or missing timestamp in signature header' };
  }

  // Replay Attack Protection: Ensure timestamp is within 5 minutes (300 seconds)
  const currentTimeSec = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimeSec - timestamp) > 300) {
    return { valid: false, error: 'Webhook signature timestamp expired (possible replay attack)' };
  }

  if (!secret) {
    console.warn('[PayMongo Webhook] Warning: PAYMONGO_WEBHOOK_SECRET is not configured in .env.');
    return { valid: false, error: 'Webhook secret is not configured on the server' };
  }

  // Prepare payload for HMAC computation: `${timestamp}.${rawBody}`
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const payloadToSign = `${timestamp}.${bodyString}`;

  const computedHmac = crypto
    .createHmac('sha256', secret)
    .update(payloadToSign)
    .digest('hex');

  const candidateSig = testSig || liveSig;

  if (!candidateSig) {
    return { valid: false, error: 'No signature hash found in signature header' };
  }

  // Timing-safe buffer comparison to prevent timing attacks
  const computedBuffer = Buffer.from(computedHmac, 'utf8');
  const candidateBuffer = Buffer.from(candidateSig, 'utf8');

  if (computedBuffer.length !== candidateBuffer.length) {
    return { valid: false, error: 'Signature hash length mismatch' };
  }

  const isValid = crypto.timingSafeEqual(computedBuffer, candidateBuffer);

  return {
    valid: isValid,
    timestamp,
    error: isValid ? null : 'Cryptographic signature mismatch'
  };
};

/**
 * Create a Full or Partial Refund via PayMongo
 * 
 * @param {Object} params
 * @param {number} params.amount - Refund amount in Philippine Pesos (e.g. 5000.00)
 * @param {string} params.paymentId - PayMongo payment ID (pay_...)
 * @param {string} [params.reason='others'] - Reason ('requested_by_customer', 'duplicate', 'fraudulent', 'others')
 * @param {string} [params.notes] - Additional context/notes for refund
 * @returns {Promise<Object>}
 */
const createPaymongoRefund = async ({ amount, paymentId, reason = 'others', notes = '' }) => {
  const amountInCentavos = Math.round(Number(amount) * 100);

  if (isNaN(amountInCentavos) || amountInCentavos <= 0) {
    throw new Error('Invalid refund amount. Amount must be greater than zero.');
  }

  if (!paymentId) {
    throw new Error('PayMongo paymentId is required to issue a refund.');
  }

  const payload = {
    data: {
      attributes: {
        amount: amountInCentavos,
        payment_id: paymentId,
        reason: reason || 'others',
        notes: notes || 'Service fulfillment cancellation refund'
      }
    }
  };

  const response = await fetch(`${PAYMONGO_BASE_URL}/refunds`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const errorMsg = responseBody.errors?.map(e => e.detail).join('; ') || 'Failed to process PayMongo refund';
    console.error('[PayMongo] API Error creating refund:', responseBody);
    throw new Error(`PayMongo Gateway Error: ${errorMsg}`);
  }

  const refundData = responseBody.data;
  return {
    id: refundData.id,
    type: refundData.type,
    attributes: refundData.attributes
  };
};

module.exports = {
  createPaymongoCheckoutSession,
  getPaymongoCheckoutSession,
  verifyWebhookSignature,
  createPaymongoRefund
};
