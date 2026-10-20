const { db } = require('../config/firebase');
const { generateReceiptNo, generateServiceCode } = require('../utils/idGenerator');

const COLLECTIONS = {
  RECEIPTS: 'receipts',
  PAYMENTS: 'payments',
  QUOTATIONS: 'quotations',
  ACTIVE_SERVICES: 'activeServices'
};

// Static Official Receipt Template Constants
const RECEIPT_CONSTANTS = {
  FORM_NO: 'ADF-07-002',
  BUSINESS_NAME: 'FairFly Travel & Tours',
  BUSINESS_TAGLINE: 'Your Trusted Gateway to Seamless Journeys',
  LEGAL_NOTICE: 'This electronic receipt is an official acknowledgment of payment received by FairFly Travel and Tours. For inquiries or verification, scan the QR code or visit the online tracking portal.'
};

/**
 * Normalizes a receipt document snapshot or object for backward-compatible consumption.
 * Supplies defaults for deprecated/derived fields when reading older or newer documents.
 */
const formatReceiptDoc = (docSnap) => {
  if (!docSnap) return null;
  const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
  if (!data) return null;

  const docId = docSnap.id || data.id || data.receiptId || null;
  const amountVal = Number(data.amount || 0);

  return {
    ...data,
    id: docId,
    receiptId: docId,
    formNo: data.formNo || RECEIPT_CONSTANTS.FORM_NO,
    businessName: data.businessName || RECEIPT_CONSTANTS.BUSINESS_NAME,
    businessTagline: data.businessTagline || RECEIPT_CONSTANTS.BUSINESS_TAGLINE,
    legalNotice: data.legalNotice || RECEIPT_CONSTANTS.LEGAL_NOTICE,
    description: data.description || data.serviceTitle || 'Travel and tour services',
    paymentStatus: data.paymentStatus || data.status || 'PAID',
    paymentMethodType: data.paymentMethodType || data.paymentMethod || 'Online',
    amountInCentavos: data.amountInCentavos !== undefined ? data.amountInCentavos : Math.round(amountVal * 100),
    qrCodeDataUrl: data.qrCodeDataUrl || null
  };
};

/**
 * Builds authoritative E-Receipt document data and encodes the QR tracking payload.
 * Canonical schema: No redundant id/receiptId, no Base64 QR code blob, no static legal boilerplate,
 * no duplicate description/status/method/centavos fields.
 *
 * @param {Object} params
 * @param {Object} params.quotation - Authoritative quotation record
 * @param {Object} params.payment - Authoritative payment record
 * @param {string} params.fulfillmentId - Unique Service Fulfillment ID (SVC-...)
 * @param {string} [params.serviceCode] - Public high-entropy tracking code (SRV-...)
 * @param {string} [params.receiptId] - Internal receipt document ID (RCT-...)
 * @param {string} [params.receiptNo] - Official human-readable receipt number
 * @returns {Promise<Object>} Canonical Receipt document payload
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
  const effectiveReceiptNo = receiptNo || generateReceiptNo();
  const effectiveServiceCode = serviceCode || quotation?.serviceCode || payment?.serviceCode || generateServiceCode();

  // Stable production-configured tracker URL for QR generation on frontend
  const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const qrTrackingUrl = `${frontendBaseUrl}/track?trackingId=${encodeURIComponent(effectiveServiceCode)}`;

  const totalAmountNum = Number(payment?.amount || quotation?.totalAmount || quotation?.rate || 0);
  const rawPaymentMethod = payment?.paymentMethodType || payment?.provider || (payment?.isWalkInCash ? 'Cash' : 'Online');
  const normalizedPaymentMethod = (typeof rawPaymentMethod === 'string' && rawPaymentMethod.toLowerCase() === 'cash')
    ? 'Cash'
    : (rawPaymentMethod || 'Online (PayMongo)');

  return {
    receiptNo: effectiveReceiptNo,
    fulfillmentId: fulfillmentId || quotation?.activeServiceId || null,
    serviceCode: effectiveServiceCode,
    quotationId: quotation?.id || quotation?.quotationId || payment?.quotationId || null,
    quoteNo: quotation?.quoteNo || '',
    inquiryId: quotation?.inquiryId || payment?.inquiryId || null,
    paymentId: payment?.id || quotation?.paymentId || null,
    providerPaymentId: payment?.providerPaymentId || payment?.providerReferenceId || null,
    paymentMethod: normalizedPaymentMethod,
    provider: payment?.provider || (payment?.isWalkInCash ? 'cash' : 'paymongo'),
    currency: payment?.currency || 'PHP',
    amount: totalAmountNum,
    status: 'PAID',

    // Client / Payer Details (Snapshot)
    clientUid: quotation?.clientUid || payment?.clientUid || null,
    clientName: quotation?.clientName || payment?.clientName || 'Valued Client',
    clientEmail: quotation?.clientEmail || payment?.clientEmail || '',
    clientPhone: quotation?.clientPhone || payment?.clientPhone || '',
    contactPerson: quotation?.contactPerson || '',

    // Handling Branch & Operator Details (Snapshot)
    branchUid: quotation?.branchUid || quotation?.operatorId || payment?.operatorId || null,
    branchName: quotation?.branchName || payment?.branchName || 'FairFly Travel & Tours',
    receivedByOperatorId: payment?.receivedByOperatorId || payment?.operatorId || quotation?.operatorId || null,
    receivedByOperatorName: payment?.receivedByOperatorName || quotation?.preparedByName || quotation?.preparedBy || 'Branch Operator',

    // Service Description & Quotation Line Items (Snapshot)
    serviceId: quotation?.serviceId || payment?.serviceId || null,
    serviceTitle: quotation?.serviceTitle || payment?.serviceTitle || 'Custom Travel Package',
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

    // Timestamps
    issuedAt: now,
    paidAt: payment?.paidAt || quotation?.paidAt || now,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Fetch receipt by receipt ID
 */
const getReceiptById = async (receiptId) => {
  if (!receiptId) return null;
  const docSnap = await db.collection(COLLECTIONS.RECEIPTS).doc(receiptId).get();
  if (!docSnap.exists) return null;
  return formatReceiptDoc(docSnap);
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
  return formatReceiptDoc(snap.docs[0]);
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
  return formatReceiptDoc(snap.docs[0]);
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
  return formatReceiptDoc(snap.docs[0]);
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
  return formatReceiptDoc(snap.docs[0]);
};

module.exports = {
  RECEIPT_CONSTANTS,
  formatReceiptDoc,
  buildReceiptPayload,
  getReceiptById,
  getReceiptByQuotationId,
  getReceiptByFulfillmentId,
  getReceiptByPaymentId,
  getReceiptByServiceCode
};
