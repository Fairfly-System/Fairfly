const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateUploadMetadata } = require('../utils/fileSecurity');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const metaCheck = validateUploadMetadata(file.originalname, file.mimetype);
    if (!metaCheck.valid) {
      const err = new Error(metaCheck.error);
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

// Middleware to handle multer execution & return structured 400 errors
const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum 25MB limit.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(err.status || 400).json({ error: err.message || 'Invalid upload request.' });
    }
    next();
  });
};

// Endpoint: POST /api/upload (Rate limited, token-checked if provided, strictly filtered)
router.post(
  '/',
  apiRateLimiter,
  (req, res, next) => {
    if (req.headers.authorization) {
      return verifyFirebaseToken(req, res, next);
    }
    next();
  },
  handleMulterUpload,
  uploadFile
);

module.exports = router;

