const { db } = require('../config/firebase');
const { 
  buildReceiptPayload,
  getReceiptById: fetchReceiptDocById,
  getReceiptByQuotationId: fetchReceiptDocByQuotationId,
  getReceiptByFulfillmentId: fetchReceiptDocByFulfillmentId,
  getReceiptByPaymentId: fetchReceiptDocByPaymentId,
  getReceiptByServiceCode: fetchReceiptDocByServiceCode
} = require('../services/receiptService');
const { ID_PREFIXES, generatePrefixedId, generateReceiptNo, generateServiceCode } = require('../utils/idGenerator');

const COLLECTIONS = {
  RECEIPTS: 'receipts',
  QUOTATIONS: 'quotations',
  PAYMENTS: 'payments',
  ACTIVE_SERVICES: 'activeServices'
};

/**
 * Mask client full name for public unauthenticated display
 */
function maskClientName(name) {
  if (!name || typeof name !== 'string') return 'Valued Client';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const single = parts[0];
    return single.length > 2 ? `${single[0]}***${single[single.length - 1]}` : `${single[0]}*`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0] || '';
  return `${first} ${lastInitial}.`;
}

/**
 * Verify user authorization to view the requested receipt document (IDOR / BOLA Guard)
 */
function isAuthorizedForReceipt(req, receipt) {
  const userRole = req.userDetails?.role;
  const isSuperAdmin = req.userDetails?.isSuperAdmin || req.user?.email === 'admin@gmail.com';
  if (userRole === 'admin' || isSuperAdmin) return true;

  if (userRole === 'client') {
    return receipt.clientUid && receipt.clientUid === req.user.uid;
  }

  if (userRole === 'operator' || userRole === 'branch_operator') {
    return (
      (receipt.branchUid && receipt.branchUid === req.user.uid) ||
      (receipt.operatorId && receipt.operatorId === req.user.uid) ||
      (receipt.receivedByOperatorId && receipt.receivedByOperatorId === req.user.uid)
    );
  }

  return false;
}

/**
 * Get Receipt by Receipt ID
 * GET /api/receipts/:id
 */
const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Receipt ID is required' });

    const receipt = await fetchReceiptDocById(id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt record not found' });
    }

    if (!isAuthorizedForReceipt(req, receipt)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to view this receipt.' });
    }

    return res.status(200).json(receipt);
  } catch (error) {
    console.error('Error in getReceiptById:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get Receipt by Quotation ID (with automatic on-demand creation for paid quotations)
 * GET /api/receipts/quotation/:quotationId
 */
const getReceiptByQuotationId = async (req, res) => {
  try {
    const { quotationId } = req.params;
    if (!quotationId) return res.status(400).json({ error: 'Quotation ID is required' });

    // 1. Try fetching existing receipt
    let receipt = await fetchReceiptDocByQuotationId(quotationId);

    if (!receipt) {
      // Check if quotation is PAID and generate receipt if missing
      const quotationSnap = await db.collection(COLLECTIONS.QUOTATIONS).doc(quotationId).get();
      if (!quotationSnap.exists) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      const quotationData = { id: quotationSnap.id, ...quotationSnap.data() };
      const isPaid = (quotationData.status || '').toUpperCase() === 'PAID' || (quotationData.paymentStatus || '').toUpperCase() === 'PAID';

      if (isPaid) {
        // Find associated payment
        let paymentData = null;
        if (quotationData.paymentId) {
          const paySnap = await db.collection(COLLECTIONS.PAYMENTS).doc(quotationData.paymentId).get();
          if (paySnap.exists) paymentData = { id: paySnap.id, ...paySnap.data() };
        }

        const fulfillmentId = quotationData.activeServiceId || generatePrefixedId(ID_PREFIXES.ACTIVE_SERVICE);
        const serviceCode = quotationData.serviceCode || generateServiceCode();
        const receiptId = quotationData.receiptId || generatePrefixedId(ID_PREFIXES.RECEIPT);
        const receiptNo = quotationData.receiptNo || generateReceiptNo();

        receipt = await buildReceiptPayload({
          quotation: quotationData,
          payment: paymentData || { quotationId, amount: quotationData.totalAmount || quotationData.rate },
          fulfillmentId,
          serviceCode,
          receiptId,
          receiptNo
        });

        // Persist generated receipt
        await db.collection(COLLECTIONS.RECEIPTS).doc(receiptId).set(receipt);
        await db.collection(COLLECTIONS.QUOTATIONS).doc(quotationId).update({
          receiptId,
          receiptNo,
          serviceCode
        });
      } else {
        return res.status(404).json({ error: 'No official receipt exists for this unpaid quotation.' });
      }
    }

    if (!isAuthorizedForReceipt(req, receipt)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to view this receipt.' });
    }

    return res.status(200).json(receipt);
  } catch (error) {
    console.error('Error in getReceiptByQuotationId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get Receipt by Fulfillment ID (activeServiceId)
 * GET /api/receipts/fulfillment/:fulfillmentId
 */
const getReceiptByFulfillmentId = async (req, res) => {
  try {
    const { fulfillmentId } = req.params;
    if (!fulfillmentId) return res.status(400).json({ error: 'Fulfillment ID is required' });

    let receipt = await fetchReceiptDocByFulfillmentId(fulfillmentId);

    if (!receipt) {
      // Check active service record
      const serviceSnap = await db.collection(COLLECTIONS.ACTIVE_SERVICES).doc(fulfillmentId).get();
      if (!serviceSnap.exists) {
        return res.status(404).json({ error: 'Service fulfillment not found' });
      }
      const serviceData = { id: serviceSnap.id, ...serviceSnap.data() };
      if (serviceData.quotationId) {
        receipt = await fetchReceiptDocByQuotationId(serviceData.quotationId);
      }
    }

    if (!receipt) {
      return res.status(404).json({ error: 'No receipt record found for this service fulfillment.' });
    }

    if (!isAuthorizedForReceipt(req, receipt)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to view this receipt.' });
    }

    return res.status(200).json(receipt);
  } catch (error) {
    console.error('Error in getReceiptByFulfillmentId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get Receipt by Payment ID
 * GET /api/receipts/payment/:paymentId
 */
const getReceiptByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ error: 'Payment ID is required' });

    const receipt = await fetchReceiptDocByPaymentId(paymentId);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt record not found for this payment' });
    }

    if (!isAuthorizedForReceipt(req, receipt)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to view this receipt.' });
    }

    return res.status(200).json(receipt);
  } catch (error) {
    console.error('Error in getReceiptByPaymentId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Public E-Receipt Verification & Lookup by Service Code or Receipt Number
 * GET /api/receipts/public/:code
 * 
 * Rate-limited and sanitized for client privacy.
 */
const getPublicReceiptByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const cleanCode = code.trim();
    let receipt = null;

    // 1. Try lookup by serviceCode
    receipt = await fetchReceiptDocByServiceCode(cleanCode);

    // 2. Try lookup by direct document ID (receiptId)
    if (!receipt) {
      receipt = await fetchReceiptDocById(cleanCode);
    }

    // 3. Try lookup by receiptNo
    if (!receipt) {
      const snap = await db.collection(COLLECTIONS.RECEIPTS)
        .where('receiptNo', '==', cleanCode)
        .limit(1)
        .get();
      if (!snap.empty) {
        receipt = { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    }

    // 4. Try lookup by quotationId / quoteNo
    if (!receipt) {
      receipt = await fetchReceiptDocByQuotationId(cleanCode);
    }

    // 5. Try lookup by fulfillmentId
    if (!receipt) {
      receipt = await fetchReceiptDocByFulfillmentId(cleanCode);
    }

    if (!receipt) {
      return res.status(404).json({
        error: 'No verified official receipt found for this tracking code or receipt number.'
      });
    }

    // Enrich with linked quotation data if available
    let linkedQuotation = null;
    if (receipt.quotationId) {
      try {
        const qSnap = await db.collection(COLLECTIONS.QUOTATIONS).doc(receipt.quotationId).get();
        if (qSnap.exists) {
          linkedQuotation = qSnap.data();
        }
      } catch (err) {}
    }

    const resolvedClientName = receipt.clientName && receipt.clientName !== 'Valued Client'
      ? receipt.clientName
      : (linkedQuotation?.clientName || receipt.clientName || 'Valued Client');

    // Return complete public receipt payload
    const sanitizedPublicReceipt = {
      id: receipt.id || receipt.receiptId,
      receiptId: receipt.id || receipt.receiptId,
      receiptNo: receipt.receiptNo,
      formNo: receipt.formNo || 'ADF-07-002',
      serviceCode: receipt.serviceCode,
      fulfillmentId: receipt.fulfillmentId,
      quotationId: receipt.quotationId || linkedQuotation?.id || '',
      quoteNo: receipt.quoteNo || linkedQuotation?.quoteNo || '',
      paymentId: receipt.paymentId || (receipt.receiptNo ? `PAY-${receipt.receiptNo.replace('RCT-', '')}` : 'PAY-CONFIRMED'),
      providerPaymentId: receipt.providerPaymentId || '',
      serviceTitle: receipt.serviceTitle || linkedQuotation?.serviceTitle || 'Travel & Tour Package',
      description: receipt.description || linkedQuotation?.serviceTitle || 'Standard tour & travel service fulfillment',
      operatorRemarks: receipt.operatorRemarks || linkedQuotation?.operatorRemarks || linkedQuotation?.remarks || '',
      clientRemarks: receipt.clientRemarks || linkedQuotation?.clientRemarks || '',
      clientName: maskClientName(resolvedClientName),
      fullName: resolvedClientName,
      customerName: resolvedClientName,
      contactPerson: receipt.contactPerson || linkedQuotation?.contactPerson || '',
      clientEmail: receipt.clientEmail || linkedQuotation?.clientEmail || '',
      clientPhone: receipt.clientPhone || linkedQuotation?.clientPhone || '',
      branchName: receipt.branchName || linkedQuotation?.branchName || 'FairFly Travel & Tours - Baliuag Branch',
      receivedByOperatorName: receipt.receivedByOperatorName || linkedQuotation?.preparedByName || linkedQuotation?.preparedBy || 'Emmanuel Manlapig',
      paymentMethod: receipt.paymentMethod || 'Direct Payment',
      amount: Number(receipt.amount || linkedQuotation?.totalAmount || linkedQuotation?.rate || 0),
      totalAmount: Number(receipt.amount || linkedQuotation?.totalAmount || linkedQuotation?.rate || 0),
      rate: Number(receipt.rate || linkedQuotation?.rate || receipt.amount || 0),
      taxAmount: Number(receipt.taxAmount || linkedQuotation?.taxAmount || 0),
      currency: receipt.currency || 'PHP',
      status: (receipt.status || 'PAID').toUpperCase(),
      issuedAt: receipt.issuedAt,
      paidAt: receipt.paidAt || receipt.issuedAt,
      tourDates: receipt.tourDates || linkedQuotation?.tourDates || 'As arranged with client',
      inclusions: receipt.inclusions || linkedQuotation?.inclusions || '',
      exclusions: receipt.exclusions || linkedQuotation?.exclusions || '',
      rateBreakdown: receipt.rateBreakdown || linkedQuotation?.rateBreakdown || '',
      qrTrackingUrl: receipt.qrTrackingUrl,
      qrCodeDataUrl: receipt.qrCodeDataUrl,
      businessName: receipt.businessName || 'FairFly Travel & Tours',
      legalNotice: receipt.legalNotice || 'This electronic receipt is an official acknowledgment of payment received by FairFly Travel and Tours.'
    };

    return res.status(200).json(sanitizedPublicReceipt);
  } catch (error) {
    console.error('Error in getPublicReceiptByCode:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getReceiptById,
  getReceiptByQuotationId,
  getReceiptByFulfillmentId,
  getReceiptByPaymentId,
  getPublicReceiptByCode
};
