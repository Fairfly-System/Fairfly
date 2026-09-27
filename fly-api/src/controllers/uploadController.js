const crypto = require('crypto');
const { bucket } = require('../config/firebase');
const { 
  validateUploadMetadata, 
  verifyFileContent, 
  generateSafeDestination 
} = require('../utils/fileSecurity');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // 1. Validate metadata (filename, double extensions, allowed whitelist)
    const metaCheck = validateUploadMetadata(req.file.originalname, req.file.mimetype);
    if (!metaCheck.valid) {
      return res.status(400).json({ error: metaCheck.error });
    }

    // 2. Validate file size (25MB limit)
    if (req.file.size > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum 25MB limit.' });
    }

    // 3. Inspect buffer magic bytes and payload content
    const contentCheck = verifyFileContent(req.file.buffer, metaCheck.ext);
    if (!contentCheck.valid) {
      return res.status(400).json({ 
        error: contentCheck.error || 'Malicious or invalid file content detected.' 
      });
    }

    // 4. Generate safe sanitized destination path
    const rawFolder = req.body.folder || req.query.folder || 'uploads';
    const destination = generateSafeDestination(rawFolder, req.file.originalname);

    const fileRef = bucket.file(destination);
    const downloadToken = crypto.randomUUID();

    // 5. Store with canonical, verified MIME type (never trusting spoofed client MIME)
    await fileRef.save(req.file.buffer, {
      metadata: {
        contentType: contentCheck.canonicalMime,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: req.file.originalname,
          uploadedBy: req.user?.uid || 'anonymous'
        }
      },
      resumable: false,
    });

    // 6. Construct Firebase Storage download URL with secure token
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;

    return res.status(200).json({
      success: true,
      url: downloadUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      storagePath: destination,
      contentType: contentCheck.canonicalMime
    });
  } catch (error) {
    console.error('Error uploading file in backend:', error);
    return res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
};

module.exports = {
  uploadFile
};

