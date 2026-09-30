const express = require('express');
const router = express.Router();
const busboy = require('busboy');
const { uploadFile } = require('../controllers/uploadController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateUploadMetadata } = require('../utils/fileSecurity');

const FILE_SIZE_LIMIT = 25 * 1024 * 1024; // 25MB

/**
 * Parses multipart/form-data using busboy.
 * Works in both local Express (stream) and Cloud Functions (req.rawBody) environments.
 *
 * Populates req.file = { originalname, mimetype, size, buffer }
 * and merges text fields into req.body.
 */
const handleMultipartUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'Expected multipart/form-data content type.' });
  }

  let fileData = null;
  const fields = {};

  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: FILE_SIZE_LIMIT, files: 1 }
  });

  bb.on('file', (fieldname, stream, info) => {
    const { filename, mimeType } = info;

    // Validate metadata early (extension, double-extension, allowed whitelist)
    const metaCheck = validateUploadMetadata(filename, mimeType);
    if (!metaCheck.valid) {
      stream.resume(); // Drain the stream
      const err = new Error(metaCheck.error);
      err.status = 400;
      bb.destroy(err);
      return;
    }

    const chunks = [];
    let totalSize = 0;

    stream.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > FILE_SIZE_LIMIT) {
        stream.destroy();
        const err = new Error('File size exceeds maximum 25MB limit.');
        err.status = 400;
        bb.destroy(err);
        return;
      }
      chunks.push(chunk);
    });

    stream.on('end', () => {
      fileData = {
        originalname: filename,
        mimetype: mimeType,
        size: totalSize,
        buffer: Buffer.concat(chunks)
      };
    });
  });

  bb.on('field', (name, value) => {
    fields[name] = value;
  });

  bb.on('finish', () => {
    if (!fileData) {
      return res.status(400).json({ error: 'No file provided in upload.' });
    }
    req.file = fileData;
    req.body = { ...req.body, ...fields };
    next();
  });

  bb.on('error', (err) => {
    return res.status(err.status || 400).json({
      error: err.message || 'Invalid upload request.'
    });
  });

  // Cloud Functions provides the raw body as a Buffer on req.rawBody.
  // In that environment the stream has already been consumed, so we
  // must feed the pre-parsed buffer to busboy manually.
  if (req.rawBody) {
    bb.end(req.rawBody);
  } else {
    req.pipe(bb);
  }
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
  handleMultipartUpload,
  uploadFile
);

module.exports = router;
