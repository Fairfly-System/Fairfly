const express = require('express');
const router = express.Router();
const {
  getReceiptById,
  getReceiptByQuotationId,
  getReceiptByFulfillmentId,
  getReceiptByPaymentId,
  getPublicReceiptByCode
} = require('../controllers/receiptController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter, publicRateLimiter, trackerRateLimiter } = require('../middleware/rateLimiter');
const { performanceProfiler } = require('../middleware/performanceProfiler');

// 1. Public E-Receipt Verification & Tracking Endpoint (Static sub-path declared FIRST)
router.get(
  '/public/:code',
  performanceProfiler('GET /receipts/public/:code', trackerRateLimiter, getPublicReceiptByCode)
);

// 2. Fetch Receipt by Quotation ID (Authenticated & IDOR protected)
router.get(
  '/quotation/:quotationId',
  performanceProfiler('GET /receipts/quotation/:quotationId', verifyFirebaseToken, apiRateLimiter, getReceiptByQuotationId)
);

// 3. Fetch Receipt by Fulfillment ID (Authenticated & IDOR protected)
router.get(
  '/fulfillment/:fulfillmentId',
  performanceProfiler('GET /receipts/fulfillment/:fulfillmentId', verifyFirebaseToken, apiRateLimiter, getReceiptByFulfillmentId)
);

// 4. Fetch Receipt by Payment ID (Authenticated & IDOR protected)
router.get(
  '/payment/:paymentId',
  performanceProfiler('GET /receipts/payment/:paymentId', verifyFirebaseToken, apiRateLimiter, getReceiptByPaymentId)
);

// 5. Fetch Receipt by Receipt Document ID (Dynamic route declared LAST to prevent shadowing)
router.get(
  '/:id',
  performanceProfiler('GET /receipts/:id', verifyFirebaseToken, apiRateLimiter, getReceiptById)
);

module.exports = router;
