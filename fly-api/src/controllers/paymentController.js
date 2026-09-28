const { db } = require('../config/firebase');
const { 
  createPaymongoCheckoutSession, 
  getPaymongoCheckoutSession, 
  verifyWebhookSignature 
} = require('../services/paymongoService');
const { buildFulfillmentPayload } = require('./quotationController');
const { 
  createNotification, 
  notifyBranch, 
  notifyAdmins 
} = require('../services/notificationService');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');

const COLLECTIONS = {
  PAYMENTS: 'payments',
  QUOTATIONS: 'quotations',
  INQUIRIES: 'inquiries',
  ACTIVE_SERVICES: 'activeServices',
  USERS: 'users'
};

/**
 * Core Atomic Transaction: Finalize a successful payment and activate service fulfillment exactly once.
 * Implements strict Idempotency Lock: 1 Successful Payment = Exactly 1 Service Fulfillment.
 * 
 * @param {string} paymentId - FairFly payment document ID (PAY-...)
 * @param {Object} [providerData={}] - Details from PayMongo (paymentId, paymentMethod, fee)
 * @returns {Promise<{ alreadyProcessed: boolean, fulfillmentId: string }>}
 */
const finalizeSuccessfulPayment = async (paymentId, providerData = {}) => {
  const now = new Date().toISOString();

  const result = await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc(paymentId);
    const paymentDoc = await transaction.get(paymentRef);

    if (!paymentDoc.exists) {
      throw new Error(`Payment record ${paymentId} not found in database`);
    }

    const paymentData = {
      id: paymentDoc.id,
      ...(paymentDoc.data() || {})
    };

    // 1. IDEMPOTENCY GUARD: If payment was already finalized as PAID, exit cleanly with existing fulfillmentId
    if (paymentData.status === 'PAID' && paymentData.fulfillmentId) {
      console.log(`[Payment Idempotency] Payment ${paymentId} already marked PAID. Fulfillment ID: ${paymentData.fulfillmentId}`);
      return { alreadyProcessed: true, fulfillmentId: paymentData.fulfillmentId, paymentData };
    }

    const quotationRef = db.collection(COLLECTIONS.QUOTATIONS).doc(paymentData.quotationId);
    const quotationDoc = await transaction.get(quotationRef);

    if (!quotationDoc.exists) {
      throw new Error(`Quotation record ${paymentData.quotationId} not found`);
    }

    const quotationData = {
      id: quotationDoc.id,
      quotationId: quotationDoc.id,
      ...(quotationDoc.data() || {})
    };

    // 2. CONFLICT GUARD: If quotation was already fulfilled by another concurrent session
    if (quotationData.activeServiceId) {
      console.log(`[Payment Idempotency] Quotation ${paymentData.quotationId} already has activeServiceId: ${quotationData.activeServiceId}`);
      transaction.update(paymentRef, {
        status: 'PAID',
        fulfillmentId: quotationData.activeServiceId,
        providerPaymentId: providerData.paymentId || paymentData.providerPaymentId || null,
        paymentMethodType: providerData.paymentMethod || paymentData.paymentMethodType || null,
        paidAt: paymentData.paidAt || now,
        updatedAt: now
      });
      return { alreadyProcessed: true, fulfillmentId: quotationData.activeServiceId, paymentData };
    }

    // 3. Generate exactly one Active Service ID
    const fulfillmentId = generatePrefixedId(ID_PREFIXES.ACTIVE_SERVICE);
    const activeServiceRef = db.collection(COLLECTIONS.ACTIVE_SERVICES).doc(fulfillmentId);

    // 4. Construct server-side fulfillment document from trusted quotation data
    const fulfillmentPayload = await buildFulfillmentPayload(quotationData, paymentData, fulfillmentId);

    // 5. Commit all document state transitions atomically in a single ACID transaction
    transaction.set(activeServiceRef, fulfillmentPayload);

    transaction.update(quotationRef, {
      status: 'PAID',
      paymentStatus: 'PAID',
      activeServiceId: fulfillmentId,
      paymentId: paymentId,
      paidAt: now,
      updatedAt: now
    });

    if (quotationData.inquiryId) {
      const inquiryRef = db.collection(COLLECTIONS.INQUIRIES).doc(quotationData.inquiryId);
      transaction.update(inquiryRef, {
        status: 'paid',
        confirmedActiveServiceId: fulfillmentId,
        confirmedQuotationId: quotationData.id || paymentData.quotationId || null,
        updatedAt: now
      });
    }


    transaction.update(paymentRef, {
      status: 'PAID',
      fulfillmentId: fulfillmentId,
      providerPaymentId: providerData.paymentId || paymentData.providerPaymentId || null,
      paymentMethodType: providerData.paymentMethod || paymentData.paymentMethodType || null,
      paidAt: now,
      updatedAt: now
    });

    return { alreadyProcessed: false, fulfillmentId, paymentData: { ...paymentData, quotationData } };
  });

  // Post-transaction notifications & logging (fired only when new fulfillment was generated)
  if (!result.alreadyProcessed) {
    const quote = result.paymentData.quotationData || {};
    const quoteNo = quote.quoteNo || result.paymentData.quotationId;
    const clientUid = result.paymentData.clientUid || quote.clientUid;
    const branchUid = quote.branchUid || quote.operatorId || result.paymentData.operatorId;

    // 1. Notify Client
    if (clientUid) {
      createNotification({
        recipientUid: clientUid,
        recipientRole: 'client',
        title: 'Payment Confirmed · Service Active',
        message: `Your payment for Quotation ${quoteNo} was confirmed! Service fulfillment has been initiated in Ongoing Services.`,
        type: 'service',
        link: '/client/tracking',
        metadata: { quotationId: quote.id, paymentId, fulfillmentId: result.fulfillmentId }
      }).catch(err => console.warn('[Payment] Client notification error:', err.message));
    }

    // 2. Notify Operator
    if (branchUid) {
      notifyBranch({
        branchUid: branchUid,
        branchName: quote.branchName || 'Branch Office',
        title: 'Quotation Paid · Service Initialized',
        message: `Payment confirmed for Quotation ${quoteNo} (${quote.clientName || 'Client'}). Service fulfillment ${result.fulfillmentId} is now active.`,
        type: 'service',
        link: `/operator/ongoing-services/${result.fulfillmentId}`,
        metadata: { quotationId: quote.id, paymentId, fulfillmentId: result.fulfillmentId }
      }).catch(err => console.warn('[Payment] Operator notification error:', err.message));
    }

    // 3. Notify Admins
    notifyAdmins({
      title: 'Quotation Paid & Fulfillment Created',
      message: `Quotation ${quoteNo} (₱${Number(quote.totalAmount || 0).toLocaleString()}) was successfully paid via PayMongo. Service ${result.fulfillmentId} activated.`,
      type: 'service',
      link: '/admin/inquiry-history',
      metadata: { quotationId: quote.id, paymentId, fulfillmentId: result.fulfillmentId }
    }).catch(err => console.warn('[Payment] Admin notification error:', err.message));

    console.log(`[Payment Finalized] Payment ${paymentId} -> Fulfillment ${result.fulfillmentId} created successfully.`);
  }

  return result;
};

/**
 * Create a PayMongo checkout session for an accepted quotation
 * POST /api/payments/checkout-session
 * 
 * Security:
 * - Client authentication required
 * - Server-side quotation verification: Client can only pay their own quotation
 * - Amount is derived strictly from server-side quotation total (Zero Client Trust)
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { quotationId } = req.body;

    if (!quotationId) {
      return res.status(400).json({ error: 'quotationId is required' });
    }

    // 1. Fetch quotation from Firestore
    const quotationRef = db.collection(COLLECTIONS.QUOTATIONS).doc(quotationId);
    const quotationSnap = await quotationRef.get();

    if (!quotationSnap.exists) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = quotationSnap.data();

    // 2. Object-level Authorization / IDOR Protection
    if (quotation.clientUid && quotation.clientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You cannot pay for a quotation issued to another client.' });
    }

    // 3. Status validation
    if (quotation.status !== 'Accepted') {
      return res.status(400).json({
        error: `Cannot pay for quotation with status "${quotation.status}". The quotation must be accepted first.`
      });
    }

    if (quotation.paymentStatus === 'PAID' || quotation.activeServiceId) {
      return res.status(400).json({
        error: 'This quotation has already been paid and fulfilled.'
      });
    }

    // 4. Server-Side Price Authority: Calculate payable amount strictly from database
    const totalAmount = Number(quotation.totalAmount || quotation.rate || 0);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid quotation payable amount. Please contact the branch operator to review the quotation rate.'
      });
    }

    // 5. Generate internal Payment record ID
    const paymentId = generatePrefixedId(ID_PREFIXES.PAYMENT);
    const now = new Date().toISOString();

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const successUrl = `${frontendBaseUrl}/client/tracking?payment_status=success&payment_id=${paymentId}&quotation_id=${quotationId}`;
    const cancelUrl = `${frontendBaseUrl}/client/tracking?payment_status=cancelled&payment_id=${paymentId}&quotation_id=${quotationId}`;

    // 6. Call PayMongo Service to generate Checkout Session
    const checkoutSession = await createPaymongoCheckoutSession({
      amount: totalAmount,
      description: `FairFly Travel: Quotation ${quotation.quoteNo || quotationId}`,
      serviceName: quotation.serviceTitle || 'Travel & Tour Package',
      referenceNumber: paymentId,
      successUrl,
      cancelUrl,
      metadata: {
        paymentId,
        quotationId,
        quoteNo: quotation.quoteNo || '',
        clientUid: req.user.uid,
        inquiryId: quotation.inquiryId || '',
        branchUid: quotation.branchUid || quotation.operatorId || ''
      }
    });

    // 7. Store new payment record in Firestore with state PAYMENT_PENDING
    const paymentDocData = {
      id: paymentId,
      quotationId,
      quoteNo: quotation.quoteNo || '',
      inquiryId: quotation.inquiryId || null,
      clientUid: req.user.uid,
      clientName: quotation.clientName || 'Valued Client',
      clientEmail: quotation.clientEmail || req.user.email || '',
      operatorId: quotation.branchUid || quotation.operatorId || 'OP-ACCOUNT',
      branchName: quotation.branchName || 'Branch Office',
      serviceTitle: quotation.serviceTitle || 'Custom Service',
      serviceId: quotation.serviceId || null,
      amount: totalAmount,
      amountInCentavos: Math.round(totalAmount * 100),
      currency: 'PHP',
      provider: 'paymongo',
      providerReferenceId: checkoutSession.id,
      providerPaymentIntentId: checkoutSession.attributes?.payment_intent?.id || null,
      providerPaymentId: null,
      paymentMethodType: null,
      status: 'PAYMENT_PENDING',
      checkoutUrl: checkoutSession.checkout_url,
      fulfillmentId: null,
      webhookProcessedAt: null,
      paidAt: null,
      createdAt: now,
      updatedAt: now
    };

    await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).set(paymentDocData);

    // Update quotation payment tracking state
    await quotationRef.update({
      paymentStatus: 'PAYMENT_PENDING',
      paymentId: paymentId,
      updatedAt: now
    });

    console.log(`[Payment] Created PayMongo checkout session ${checkoutSession.id} for payment ${paymentId} (₱${totalAmount})`);

    return res.status(201).json({
      success: true,
      paymentId,
      checkoutUrl: checkoutSession.checkout_url,
      amount: totalAmount,
      currency: 'PHP',
      status: 'PAYMENT_PENDING',
      quoteNo: quotation.quoteNo
    });
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    return res.status(500).json({ error: 'Failed to initiate payment session: ' + error.message });
  }
};

/**
 * Verify payment status upon customer redirect back from PayMongo
 * POST /api/payments/:id/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Payment ID is required' });

    const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc(id);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = paymentSnap.data();

    // Authorization: Client must own payment, or user is admin/operator
    const userRole = req.userDetails?.role;
    if (userRole === 'client' && payment.clientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You cannot access payment records for another traveler.' });
    }

    // 1. If already PAID, return current status
    if (payment.status === 'PAID') {
      return res.status(200).json({
        status: 'PAID',
        paymentId: id,
        fulfillmentId: payment.fulfillmentId,
        message: 'Payment has already been confirmed and fulfilled.'
      });
    }

    // 2. Query PayMongo API directly to verify checkout session
    if (!payment.providerReferenceId) {
      return res.status(400).json({ error: 'Missing PayMongo provider reference on payment record' });
    }

    const paymongoSession = await getPaymongoCheckoutSession(payment.providerReferenceId);
    const sessionAttrs = paymongoSession.attributes || {};
    const paymentsList = sessionAttrs.payments || [];

    // Inspect if a successful payment is recorded on the PayMongo session
    const successfulPayment = paymentsList.find(p => (p.attributes?.status || '').toLowerCase() === 'paid');
    const isPaid = (sessionAttrs.status || '').toLowerCase() === 'paid' || Boolean(successfulPayment);

    if (isPaid) {
      const providerPaymentId = successfulPayment?.id || null;
      const paymentMethod = successfulPayment?.attributes?.source?.type || 'online';

      // Execute atomic fulfillment processor
      const finalResult = await finalizeSuccessfulPayment(id, {
        paymentId: providerPaymentId,
        paymentMethod
      });

      return res.status(200).json({
        success: true,
        status: 'PAID',
        paymentId: id,
        fulfillmentId: finalResult.fulfillmentId,
        message: 'Payment verified successfully! Your service order has been activated in Ongoing Services.'
      });
    }

    // If session is expired or cancelled in PayMongo
    if ((sessionAttrs.status || '').toLowerCase() === 'expired') {
      await paymentRef.update({ status: 'PAYMENT_EXPIRED', updatedAt: new Date().toISOString() });
      return res.status(200).json({
        status: 'PAYMENT_EXPIRED',
        message: 'The payment session has expired. You may generate a new payment link from your quotations tab.'
      });
    }

    return res.status(200).json({
      status: payment.status || 'PAYMENT_PENDING',
      message: 'Payment is still being processed by the payment provider.'
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    return res.status(500).json({ error: 'Failed to verify payment status: ' + error.message });
  }
};

/**
 * Handle incoming PayMongo Webhooks
 * POST /api/payments/webhook
 * 
 * Verifies PayMongo HMAC-SHA256 signature, validates event payload,
 * and atomically commits payment success with idempotency defense.
 */
const handlePaymongoWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers['paymongo-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // 1. Signature Verification
    const sigCheck = verifyWebhookSignature(signatureHeader, rawBody);
    if (!sigCheck.valid) {
      console.warn('[PayMongo Webhook] Signature verification failed:', sigCheck.error);
      return res.status(400).json({ error: `Webhook Signature Verification Failed: ${sigCheck.error}` });
    }

    const event = req.body?.data;
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload structure' });
    }

    const eventType = event.attributes?.type;
    console.log(`[PayMongo Webhook] Received verified event: ${eventType} (ID: ${event.id})`);

    // 2. Event Routing: Handle paid checkout sessions or payments
    if (eventType === 'checkout_session.payment.paid' || eventType === 'payment.paid') {
      const resourceData = event.attributes?.data;
      const resourceAttrs = resourceData?.attributes || {};
      const metadata = resourceAttrs.metadata || {};

      let paymentId = metadata.paymentId || resourceAttrs.reference_number;

      // If paymentId not in metadata, search payments collection by provider reference ID
      if (!paymentId && resourceData?.id) {
        const querySnap = await db.collection(COLLECTIONS.PAYMENTS)
          .where('providerReferenceId', '==', resourceData.id)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          paymentId = querySnap.docs[0].id;
        }
      }

      if (!paymentId) {
        console.warn(`[PayMongo Webhook] Could not associate event ${event.id} with any FairFly payment ID.`);
        return res.status(200).json({ received: true, warning: 'Unmapped payment reference' });
      }

      const paymentsList = resourceAttrs.payments || [];
      const successfulPayment = paymentsList.find(p => (p.attributes?.status || '').toLowerCase() === 'paid') || paymentsList[0];
      const providerPaymentId = successfulPayment?.id || null;
      const paymentMethod = successfulPayment?.attributes?.source?.type || 'online';

      // 3. Atomically finalize payment and create fulfillment exactly once
      await finalizeSuccessfulPayment(paymentId, {
        paymentId: providerPaymentId,
        paymentMethod
      });

      // Update webhook timestamp on payment record
      await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).update({
        webhookProcessedAt: new Date().toISOString()
      }).catch(err => console.warn('[Payment] Could not update webhookProcessedAt:', err.message));
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling PayMongo Webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error handling webhook: ' + error.message });
  }
};

/**
 * Get payment details by ID
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Payment ID is required' });

    const doc = await db.collection(COLLECTIONS.PAYMENTS).doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const data = doc.data();
    const userRole = req.userDetails?.role;

    // Authorization: Client can only view their own payment; Operator can view their branch; Admin can view all
    if (userRole === 'client' && data.clientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You cannot view another client payment record.' });
    }

    if ((userRole === 'operator' || userRole === 'branch_operator') && data.operatorId !== req.user.uid && data.branchUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You can only view payments for your branch.' });
    }

    return res.status(200).json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List payments with role-based scoping
 * GET /api/payments
 */
const getPayments = async (req, res) => {
  try {
    const { status, limit } = req.query;
    let queryRef = db.collection(COLLECTIONS.PAYMENTS);
    const userRole = req.userDetails?.role;

    if (userRole === 'client') {
      queryRef = queryRef.where('clientUid', '==', req.user.uid);
    } else if (userRole === 'operator' || userRole === 'branch_operator') {
      queryRef = queryRef.where('operatorId', '==', req.user.uid);
    }

    if (status && status !== 'all') {
      queryRef = queryRef.where('status', '==', status);
    }

    const snapshot = await queryRef.get();
    const payments = [];
    snapshot.forEach(d => payments.push({ id: d.id, ...d.data() }));

    payments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const maxResults = limit ? parseInt(limit, 10) : 50;
    return res.status(200).json(payments.slice(0, maxResults));
  } catch (error) {
    console.error('Error in getPayments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createCheckoutSession,
  verifyPayment,
  handlePaymongoWebhook,
  getPaymentById,
  getPayments,
  finalizeSuccessfulPayment
};
