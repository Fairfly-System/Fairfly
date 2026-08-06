const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Endpoint: POST /api/upload
router.post('/', (req, res, next) => {
  // If token is provided, verify it, otherwise allow upload
  if (req.headers.authorization) {
    return verifyFirebaseToken(req, res, next);
  }
  next();
}, upload.single('file'), uploadFile);

module.exports = router;
