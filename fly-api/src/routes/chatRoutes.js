const express = require('express');
const router = express.Router();
const {
  createChatSession,
  getChatSession,
  postMessage
} = require('../controllers/chatController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// All chat endpoints require authentication
router.use(verifyFirebaseToken);
//If rejected, return. 

//Once Verified, Move onto Rate Limiter, then to the Controllers
router.post('/', apiRateLimiter, createChatSession);
router.get('/:id', apiRateLimiter, getChatSession);
router.post('/:id/messages', apiRateLimiter, postMessage);

// Note: GET /:id/messages is handled on the frontend via Firestore onSnapshot subscription

module.exports = router;

