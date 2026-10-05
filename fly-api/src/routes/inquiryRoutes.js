const express = require('express');
const router = express.Router();
const { 
  createInquiry, 
  getInquiries, 
  getInquiryById,
  updateInquiry, 
  deleteInquiry,
  confirmInquiry,
  getInquirySchema,
  saveInquirySchema,
  attachServiceToInquiry,
  submitInquiryRequirements
} = require('../controllers/inquiryController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

const INQUIRY_ALLOWED_FIELDS = [
  'fullName',
  'clientName',
  'contactPerson',
  'email',
  'phoneNumber',
  'cellphone',
  'telNo',
  'address',
  'population',
  'contractNo',
  'isNo',
  'dateInquired',
  'serviceId',
  'serviceType',
  'servicesOffered',
  'servicePrice',
  'specifiedRequirements',
  'requirements',
  'notes',
  'remarks',
  'agentName',
  'agentSignature',
  'agentContact',
  'acknowledgedBy',
  'acknowledgedSignature',
  'branchUid',
  'branchName',
  'formNo',
  'controlNo',
  'customFields',
  'clientUid',
  'status',
  'submittedRequirementsId',
  'confirmedQuotationId',
  'confirmedActiveServiceId',
  'isWalkIn',
  'workflow',
  'serviceAttachedAt',
  'serviceAttachedBy',
  'requirementsSubmittedAt',
  'id',
  'createdAt',
  'updatedAt'
];

// Dynamic Form Schema routes
router.get('/schema', performanceProfiler('GET /inquiries/schema', publicRateLimiter, getInquirySchema));
router.put('/schema', performanceProfiler('PUT /inquiries/schema', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, saveInquirySchema));

// Inquiries CRUD & Confirmation routes
router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createInquiry);

router.get('/', performanceProfiler('GET /inquiries', verifyFirebaseToken, apiRateLimiter, getInquiries));
router.get('/:id', performanceProfiler('GET /inquiries/:id', verifyFirebaseToken, apiRateLimiter, getInquiryById));

// Attach Service to Inquiry (Operator / Admin)
router.post(
  '/:id/attach-service',
  performanceProfiler(
    'POST /inquiries/:id/attach-service',
    verifyFirebaseToken,
    requireRole(['admin', 'operator', 'branch_operator']),
    allowedFields(['serviceId', 'isWalkIn']),
    apiRateLimiter,
    attachServiceToInquiry
  )
);

// Client Submits Required Documents for Inquiry in pending_requirements
router.post(
  '/:id/submit-requirements',
  performanceProfiler(
    'POST /inquiries/:id/submit-requirements',
    verifyFirebaseToken,
    requireRole('client'),
    allowedFields(['requirements']),
    apiRateLimiter,
    submitInquiryRequirements
  )
);

router.patch('/:id', performanceProfiler('PATCH /inquiries/:id', verifyFirebaseToken, allowedFields(INQUIRY_ALLOWED_FIELDS), apiRateLimiter, updateInquiry));
router.put('/:id', performanceProfiler('PUT /inquiries/:id', verifyFirebaseToken, allowedFields(INQUIRY_ALLOWED_FIELDS), apiRateLimiter, updateInquiry));
router.delete('/:id', performanceProfiler('DELETE /inquiries/:id', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, deleteInquiry));

// Confirm Inquiry -> creates a quotation; fulfillment begins when the quotation is accepted
router.post('/:id/confirm', performanceProfiler('POST /inquiries/:id/confirm', verifyFirebaseToken, requireRole(['admin', 'operator', 'branch_operator']), apiRateLimiter, confirmInquiry));

module.exports = router;
