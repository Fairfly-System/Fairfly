const express = require('express');
const router = express.Router();
const { 
  createCheckoutSession, 
  recordCashPayment,
  verifyPayment, 
  handlePaymongoWebhook, 
  getPaymentById, 
  getPayments 
} = require('../controllers/paymentController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter, publicRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');
const { performanceProfiler } = require('../middleware/performanceProfiler');

// Public Webhook route: PayMongo servers push event notifications here
// Protected by cryptographic HMAC-SHA256 signature verification inside controller
router.post(
  '/webhook',
  publicRateLimiter,
  handlePaymongoWebhook
);

// Client or Operator initiates PayMongo checkout session for an accepted quotation
router.post(
  '/checkout-session',
  performanceProfiler(
    'POST /payments/checkout-session',
    verifyFirebaseToken,
    requireRole(['client', 'operator', 'branch_operator', 'admin']),
    allowedFields(['quotationId']),
    apiRateLimiter,
    createCheckoutSession
  )
);

// Operator records direct cash payment for walk-in client
router.post(
  '/cash',
  performanceProfiler(
    'POST /payments/cash',
    verifyFirebaseToken,
    requireRole(['operator', 'branch_operator', 'admin']),
    allowedFields(['quotationId', 'remarks']),
    apiRateLimiter,
    recordCashPayment
  )
);

// Client or Admin verifies payment status (invoked upon redirect from PayMongo or manual sync)
router.post(
  '/:id/verify',
  performanceProfiler(
    'POST /payments/:id/verify',
    verifyFirebaseToken,
    apiRateLimiter,
    verifyPayment
  )
);

// Read payment by ID
router.get(
  '/:id',
  performanceProfiler(
    'GET /payments/:id',
    verifyFirebaseToken,
    apiRateLimiter,
    getPaymentById
  )
);

// List payments (scoped to role)
router.get(
  '/',
  performanceProfiler(
    'GET /payments',
    verifyFirebaseToken,
    apiRateLimiter,
    getPayments
  )
);

module.exports = router;
