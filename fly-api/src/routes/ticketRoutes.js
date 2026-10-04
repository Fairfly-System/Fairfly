const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getTickets, 
  getTicketById, 
  updateTicketStatus, 
  addMessageToThread, 
  closeTicket 
} = require('../controllers/ticketController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { allowedFields } = require('../middleware/allowedFields');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const TICKET_ALLOWED_FIELDS = [
  'title',
  'category',
  'priority',
  'initialMessage',
  'operatorId'
];

// Create a new support ticket (Operator or Admin only)
router.post(
  '/',
  performanceProfiler(
    'POST /tickets',
    verifyFirebaseToken,
    requireRole(['operator', 'admin']),
    allowedFields(TICKET_ALLOWED_FIELDS),
    apiRateLimiter,
    createTicket
  )
);

// List all support tickets (Admin or Operator auth)
router.get('/', performanceProfiler('GET /tickets', verifyFirebaseToken, apiRateLimiter, getTickets));

// Get specific ticket details by ID
router.get('/:id', performanceProfiler('GET /tickets/:id', verifyFirebaseToken, apiRateLimiter, getTicketById));

// Update ticket status (Pending, Ongoing, Closed)
router.patch('/:id/status', performanceProfiler('PATCH /tickets/:id/status', verifyFirebaseToken, requireRole('admin'), allowedFields(['status']), apiRateLimiter, updateTicketStatus));

// Add a response message to ticket thread
router.post('/:id/messages', performanceProfiler('POST /tickets/:id/messages', verifyFirebaseToken, allowedFields(['message']), apiRateLimiter, addMessageToThread));

// Close a support ticket thread
router.post('/:id/close', performanceProfiler('POST /tickets/:id/close', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, closeTicket));

module.exports = router;
