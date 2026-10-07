const QRCode = require('qrcode');
const { db } = require('../config/firebase');
const { ID_PREFIXES, generatePrefixedId, generateReceiptNo, generateServiceCode } = require('../utils/idGenerator');

const COLLECTIONS = {
  RECEIPTS: 'receipts',
  PAYMENTS: 'payments',
  QUOTATIONS: 'quotations',
  ACTIVE_SERVICES: 'activeServices'
};

/**
 * Builds authoritative E-Receipt document data and encodes the QR tracking payload.
 *
 * @param {Object} params
 * @param {Object} params.quotation - Authoritative quotation record
 * @param {Object} params.payment - Authoritative payment record
 * @param {string} params.fulfillmentId - Unique Service Fulfillment ID (SVC-...)
 * @param {string} [params.serviceCode] - Public high-entropy tracking code (SRV-...)
 * @param {string} [params.receiptId] - Internal receipt document ID (RCT-...)
 * @param {string} [params.receiptNo] - Official human-readable receipt number
 * @returns {Promise<Object>} Receipt document payload
 */
const buildReceiptPayload = async ({
  quotation,
  payment,
  fulfillmentId,
  serviceCode = null,
  receiptId = null,
  receiptNo = null
}) => {
  const now = new Date().toISOString();
  const effectiveReceiptId = receiptId || generatePrefixedId(ID_PREFIXES.RECEIPT);
  const effectiveReceiptNo = receiptNo || generateReceiptNo();
  const effectiveServiceCode = serviceCode || quotation?.serviceCode || payment?.serviceCode || generateServiceCode();

  // Stable production-configured tracker URL
  const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const qrTrackingUrl = `${frontendBaseUrl}/track?trackingId=${encodeURIComponent(effectiveServiceCode)}`;

  // Generate Base64 PNG QR Code data URL
  let qrCodeDataUrl = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrTrackingUrl, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1e1b4b', // Deep indigo brand color for high scannability
        light: '#ffffff'
      }
    });
  } catch (qrErr) {
    console.warn('[ReceiptService] QR Code generation warning:', qrErr.message);
  }

  const totalAmountNum = Number(payment?.amount || quotation?.totalAmount || quotation?.rate || 0);
  const rawPaymentMethod = payment?.paymentMethodType || payment?.provider || (payment?.isWalkInCash ? 'Cash' : 'Online');
  const normalizedPaymentMethod = (typeof rawPaymentMethod === 'string' && rawPaymentMethod.toLowerCase() === 'cash')
    ? 'Cash'
    : (rawPaymentMethod || 'Online (PayMongo)');

  return {
    id: effectiveReceiptId,
    receiptId: effectiveReceiptId,
    receiptNo: effectiveReceiptNo,
    formNo: 'ADF-07-002', // Standard FairFly Official E-Receipt Form code
    fulfillmentId: fulfillmentId || quotation?.activeServiceId || null,
    serviceCode: effectiveServiceCode,
    quotationId: quotation?.id || quotation?.quotationId || payment?.quotationId || null,
    quoteNo: quotation?.quoteNo || '',
    inquiryId: quotation?.inquiryId || payment?.inquiryId || null,
    paymentId: payment?.id || quotation?.paymentId || null,
    providerPaymentId: payment?.providerPaymentId || payment?.providerReferenceId || null,
    paymentMethod: normalizedPaymentMethod,
    paymentMethodType: payment?.paymentMethodType || normalizedPaymentMethod,
    provider: payment?.provider || (payment?.isWalkInCash ? 'cash' : 'paymongo'),
    currency: payment?.currency || 'PHP',
    amount: totalAmountNum,
    amountInCentavos: Math.round(totalAmountNum * 100),
    status: 'PAID',
    paymentStatus: 'PAID',

    // Client / Payer Details
    clientUid: quotation?.clientUid || payment?.clientUid || null,
    clientName: quotation?.clientName || payment?.clientName || 'Valued Client',
    clientEmail: quotation?.clientEmail || payment?.clientEmail || '',
    clientPhone: quotation?.clientPhone || payment?.clientPhone || '',
    contactPerson: quotation?.contactPerson || '',

    // Handling Branch & Operator Details
    branchUid: quotation?.branchUid || quotation?.operatorId || payment?.operatorId || null,
    branchName: quotation?.branchName || payment?.branchName || 'FairFly Travel & Tours',
    receivedByOperatorId: payment?.receivedByOperatorId || payment?.operatorId || quotation?.operatorId || null,
    receivedByOperatorName: payment?.receivedByOperatorName || quotation?.preparedByName || quotation?.preparedBy || 'Branch Operator',

    // Service Description & Quotation Line Items
    serviceId: quotation?.serviceId || payment?.serviceId || null,
    serviceTitle: quotation?.serviceTitle || payment?.serviceTitle || 'Custom Travel Package',
    description: quotation?.serviceTitle || payment?.serviceTitle || 'Travel and tour services',
    operatorRemarks: quotation?.operatorRemarks || quotation?.remarks || '',
    clientRemarks: quotation?.clientRemarks || '',
    tourDates: quotation?.tourDates || 'As scheduled',
    inclusions: quotation?.inclusions || '',
    exclusions: quotation?.exclusions || '',
    rate: Number(quotation?.rate || totalAmountNum),
    rateBreakdown: quotation?.rateBreakdown || '',
    taxAmount: Number(quotation?.taxAmount || 0),

    // QR Verification & Public Tracking Link
    qrTrackingUrl,
    qrCodeDataUrl,

    // Timestamps
    issuedAt: now,
    paidAt: payment?.paidAt || quotation?.paidAt || now,
    createdAt: now,
    updatedAt: now,

    // Legal & Business Disclaimers
    businessName: 'FairFly Travel & Tours',
    businessTagline: 'Your Trusted Gateway to Seamless Journeys',
    legalNotice: 'This electronic receipt is an official acknowledgment of payment received by FairFly Travel and Tours. For inquiries or verification, scan the QR code or visit the online tracking portal.'
  };
};

/**
 * Fetch receipt by receipt ID
 */
const getReceiptById = async (receiptId) => {
  if (!receiptId) return null;
  const docSnap = await db.collection(COLLECTIONS.RECEIPTS).doc(receiptId).get();
  if (!docSnap.exists) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Fetch receipt by Quotation ID
 */
const getReceiptByQuotationId = async (quotationId) => {
  if (!quotationId) return null;
  const snap = await db.collection(COLLECTIONS.RECEIPTS)
    .where('quotationId', '==', quotationId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Fetch receipt by Fulfillment ID (activeServiceId)
 */
const getReceiptByFulfillmentId = async (fulfillmentId) => {
  if (!fulfillmentId) return null;
  const snap = await db.collection(COLLECTIONS.RECEIPTS)
    .where('fulfillmentId', '==', fulfillmentId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Fetch receipt by Payment ID
 */
const getReceiptByPaymentId = async (paymentId) => {
  if (!paymentId) return null;
  const snap = await db.collection(COLLECTIONS.RECEIPTS)
    .where('paymentId', '==', paymentId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Fetch receipt by Public Service Code
 */
const getReceiptByServiceCode = async (serviceCode) => {
  if (!serviceCode) return null;
  const snap = await db.collection(COLLECTIONS.RECEIPTS)
    .where('serviceCode', '==', serviceCode)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
};

module.exports = {
  buildReceiptPayload,
  getReceiptById,
  getReceiptByQuotationId,
  getReceiptByFulfillmentId,
  getReceiptByPaymentId,
  getReceiptByServiceCode
};
