const { bucket } = require('../config/firebase');

const PROHIBITED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.jar', '.vbs', '.js', '.scr', '.com', '.pif', '.hta', '.cpl', '.msc'];

function isProhibitedFile(filename) {
  if (!filename) return false;
  const clean = filename.toLowerCase();
  return PROHIBITED_EXTENSIONS.some(ext => clean.endsWith(ext));
}

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (isProhibitedFile(req.file.originalname)) {
      return res.status(400).json({ error: 'Executable files (.exe, .bat, .sh, etc.) are prohibited for security.' });
    }

    // Max 10MB limit
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit.' });
    }

    const folder = req.body.folder || req.query.folder || 'uploads';
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const destination = `${folder}/${Date.now()}_${safeName}`;

    const fileRef = bucket.file(destination);

    await fileRef.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false,
    });

    // Make public so Firebase Storage URL works
    try {
      await fileRef.makePublic();
    } catch (makePublicErr) {
      console.warn('Note: makePublic error (bucket uniform access enabled):', makePublicErr.message);
    }

    // Construct Firebase Storage download URL format
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

    return res.status(200).json({
      success: true,
      url: downloadUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      storagePath: destination
    });
  } catch (error) {
    console.error('Error uploading file in backend:', error);
    return res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
};

module.exports = {
  uploadFile
};
