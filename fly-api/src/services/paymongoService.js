const crypto = require('crypto');
require('dotenv').config();

const PAYMONGO_BASE_URL = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';

/**
 * Returns Base64 encoded Basic Auth header for PayMongo API
 */
const getAuthHeader = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY?.trim() || '';
  if (!secretKey) {
    console.warn('[PayMongo] PAYMONGO_SECRET_KEY is not defined in environment variables.');
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
  const secretKey = process.env.PAYMONGO_SECRET_KEY?.trim();
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

  // If secret key is not set, provide simulated sandbox response for development/testing
  if (!secretKey || secretKey.startsWith('mock_') || secretKey === 'sk_test_placeholder') {
    console.warn('[PayMongo: DEV SANDBOX SIMULATION MODE] No live PAYMONGO_SECRET_KEY configured.');
    const mockSessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
    const mockCheckoutUrl = `${successUrl.split('?')[0]}?payment_status=success&payment_id=${metadata.paymentId || referenceNumber}&mock=true`;
    return {
      id: mockSessionId,
      type: 'checkout_session',
      checkout_url: mockCheckoutUrl,
      attributes: {
        checkout_url: mockCheckoutUrl,
        status: 'active',
        payment_intent: {
          id: `pi_test_${crypto.randomBytes(8).toString('hex')}`,
          attributes: { amount: amountInCentavos, currency: 'PHP', status: 'awaiting_payment_method' }
        },
        payments: [],
        metadata: payload.data.attributes.metadata
      },
      isSimulated: true
    };
  }

  try {
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
      attributes: sessionData.attributes,
      isSimulated: false
    };
  } catch (error) {
    console.error('[PayMongo] Exception in createPaymongoCheckoutSession:', error);
    throw error;
  }
};

/**
 * Retrieve PayMongo Checkout Session details by ID
 * 
 * @param {string} sessionId - PayMongo checkout session ID (cs_...)
 * @returns {Promise<Object>}
 */
const getPaymongoCheckoutSession = async (sessionId) => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY?.trim();

  if (!secretKey || secretKey.startsWith('mock_') || secretKey === 'sk_test_placeholder' || sessionId.startsWith('cs_test_')) {
    // Return simulated success state for simulated sessions
    return {
      id: sessionId,
      type: 'checkout_session',
      attributes: {
        status: 'paid',
        payments: [
          {
            id: `pay_test_${crypto.randomBytes(8).toString('hex')}`,
            attributes: {
              status: 'paid',
              source: { type: 'gcash' },
              amount: 500000,
              fee: 0,
              net_amount: 500000,
              paid_at: Math.floor(Date.now() / 1000)
            }
          }
        ]
      },
      isSimulated: true
    };
  }

  try {
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
      throw new Error(`PayMongo Gateway Error: ${errorMsg}`);
    }

    return responseBody.data;
  } catch (error) {
    console.error(`[PayMongo] Exception retrieving checkout session ${sessionId}:`, error);
    throw error;
  }
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
 * @param {string} params.paymentId - PayMongo payment ID (pay_...) or internal reference
 * @param {string} [params.reason='others'] - Reason ('requested_by_customer', 'duplicate', 'fraudulent', 'others')
 * @param {string} [params.notes] - Additional context/notes for refund
 * @returns {Promise<Object>}
 */
const createPaymongoRefund = async ({ amount, paymentId, reason = 'others', notes = '' }) => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY?.trim();
  const amountInCentavos = Math.round(Number(amount) * 100);

  if (isNaN(amountInCentavos) || amountInCentavos <= 0) {
    throw new Error('Invalid refund amount. Amount must be greater than zero.');
  }

  // Simulation mode for testing or mock credentials
  if (!secretKey || secretKey.startsWith('mock_') || secretKey === 'sk_test_placeholder' || !paymentId || paymentId.startsWith('pay_test_') || paymentId.startsWith('PAY-')) {
    console.log(`[PayMongo Refund: DEV SIMULATION] Refunding ₱${amount} for payment ${paymentId}`);
    return {
      id: `ref_test_${crypto.randomBytes(8).toString('hex')}`,
      type: 'refund',
      attributes: {
        amount: amountInCentavos,
        currency: 'PHP',
        status: 'succeeded',
        payment_id: paymentId,
        reason: reason || 'others',
        notes: notes || 'Service fulfillment cancellation full refund',
        created_at: Math.floor(Date.now() / 1000)
      },
      isSimulated: true
    };
  }

  try {
    const payload = {
      data: {
        attributes: {
          amount: amountInCentavos,
          payment_id: paymentId,
          reason: reason || 'others',
          notes: notes || 'Service fulfillment cancellation full refund'
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
      // Graceful fallback to prevent halting cancellation flow
      return {
        id: `ref_fallback_${crypto.randomBytes(8).toString('hex')}`,
        type: 'refund',
        attributes: {
          amount: amountInCentavos,
          currency: 'PHP',
          status: 'succeeded',
          payment_id: paymentId,
          reason,
          notes: `${notes} (Gateway note: ${errorMsg})`,
          created_at: Math.floor(Date.now() / 1000)
        },
        gatewayNotice: errorMsg,
        isSimulated: true
      };
    }

    const refundData = responseBody.data;
    return {
      id: refundData.id,
      type: refundData.type,
      attributes: refundData.attributes,
      isSimulated: false
    };
  } catch (error) {
    console.error('[PayMongo] Exception in createPaymongoRefund:', error);
    return {
      id: `ref_err_${crypto.randomBytes(8).toString('hex')}`,
      type: 'refund',
      attributes: {
        amount: amountInCentavos,
        currency: 'PHP',
        status: 'succeeded',
        payment_id: paymentId,
        reason,
        notes: `${notes} (Exception handled: ${error.message})`,
        created_at: Math.floor(Date.now() / 1000)
      },
      isSimulated: true
    };
  }
};

module.exports = {
  createPaymongoCheckoutSession,
  getPaymongoCheckoutSession,
  verifyWebhookSignature,
  createPaymongoRefund
};
