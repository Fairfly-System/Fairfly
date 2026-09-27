const express = require('express');
const router = express.Router();
const { 
  createQuotation, 
  getQuotations, 
  updateQuotationStatus, 
  acceptQuotation, 
  deleteQuotation,
  updateQuotation
} = require('../controllers/quotationController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

const QUOTATION_ALLOWED_FIELDS = [
  'clientUid',
  'clientName',
  'contactPerson',
  'clientEmail',
  'clientPhone',
  'serviceId',
  'serviceTitle',
  'requirements',
  'tourDates',
  'inclusions',
  'exclusions',
  'rateBreakdown',
  'rate',
  'taxAmount',
  'totalAmount',
  'preparedByName',
  'preparedByTitle',
  'preparedByContact',
  'preparedBy',
  'remarks',
  'quotationDate',
  'branchUid',
  'branchName',
  'operatorId',
  'inquiryId',
  'quoteNo',
  'status',
  'activeServiceId',
  'id',
  'createdAt',
  'updatedAt'
];

// Create quotation (Admin or Operator)
router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createQuotation);

// List quotations (Scoped in controller based on role: Client sees own, Operator sees branch, Admin sees all)
router.get('/', performanceProfiler('GET /quotations', verifyFirebaseToken, apiRateLimiter, getQuotations));

// Accept quotation (Client or on-site Operator — verified in controller)
router.post('/:id/accept', performanceProfiler('POST /quotations/:id/accept', verifyFirebaseToken, apiRateLimiter, acceptQuotation));

// Update quotation status (Admin or Assigned Operator)
router.patch('/:id/status', performanceProfiler('PATCH /quotations/:id/status', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, updateQuotationStatus));

// Update quotation details (Admin or Assigned Operator) — supports both PATCH and PUT
router.patch('/:id', performanceProfiler('PATCH /quotations/:id', verifyFirebaseToken, requireRole(['admin', 'operator']), allowedFields(QUOTATION_ALLOWED_FIELDS), apiRateLimiter, updateQuotation));
router.put('/:id', performanceProfiler('PUT /quotations/:id', verifyFirebaseToken, requireRole(['admin', 'operator']), allowedFields(QUOTATION_ALLOWED_FIELDS), apiRateLimiter, updateQuotation));

// Delete quotation (Admin or Assigned Operator)
router.delete('/:id', performanceProfiler('DELETE /quotations/:id', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, deleteQuotation));

module.exports = router;
