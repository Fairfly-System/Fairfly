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
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

// Create a new support ticket (public or auth)
router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) {
    return verifyFirebaseToken(req, res, next);
  }
  next();
}, createTicket);

// List all support tickets (Admin or Operator auth)
router.get('/', performanceProfiler('GET /tickets', verifyFirebaseToken, apiRateLimiter, getTickets));

// Get specific ticket details by ID
router.get('/:id', performanceProfiler('GET /tickets/:id', verifyFirebaseToken, apiRateLimiter, getTicketById));

// Update ticket status (Pending, Ongoing, Closed)
router.patch('/:id/status', performanceProfiler('PATCH /tickets/:id/status', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateTicketStatus));

// Add a response message to ticket thread
router.post('/:id/messages', performanceProfiler('POST /tickets/:id/messages', verifyFirebaseToken, apiRateLimiter, addMessageToThread));

// Close a support ticket thread
router.post('/:id/close', performanceProfiler('POST /tickets/:id/close', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, closeTicket));

module.exports = router;
