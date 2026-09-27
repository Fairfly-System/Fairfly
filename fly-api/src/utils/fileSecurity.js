const path = require('path');
const crypto = require('crypto');

/**
 * Strict Whitelist of Allowed File Extensions
 * Exactly aligned with the frontend forms (PDF, Office Documents, Images, Video/Zip for Admin resources)
 */
const ALLOWED_EXTENSIONS = new Set([
  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  // Compressed Archives (Resources only)
  '.zip',
  // Videos (Resources only)
  '.mp4',
  '.webm',
  '.mov'
]);

/**
 * Canonical MIME types mapped strictly from verified extensions
 * Eliminates client-spoofed Content-Type headers
 */
const CANONICAL_MIMES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
};

/**
 * Prohibited Extensions for Double-Extension & Script Detection
 */
const PROHIBITED_DANGEROUS_TOKENS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', 'msi', 'jar', 'vbs',
  'js', 'mjs', 'cjs', 'scr', 'com', 'pif', 'hta', 'cpl', 'msc', 'php',
  'phtml', 'php3', 'php4', 'php5', 'phps', 'py', 'pyc', 'pl', 'cgi',
  'rb', 'jsp', 'jspx', 'asp', 'aspx', 'html', 'htm', 'xhtml', 'shtml',
  'svg', 'xml', 'dll', 'so', 'dylib', 'elf', 'bin', 'iso', 'img', 'reg',
  'lnk', 'inf', 'apk', 'ipa', 'app', 'dmg', 'pkg', 'wasm'
]);

/**
 * Whitelist of Allowed Target Storage Folders
 */
const ALLOWED_FOLDERS = new Set([
  'uploads',
  'client_ids',
  'service_requirements',
  'workflow_documents',
  'resources',
  'announcements',
  'inquiry_requirements',
  'qualification_documents',
  'chat_attachments'
]);

/**
 * Validates metadata before file is buffered into memory (Used in Multer fileFilter)
 * @param {string} originalname 
 * @param {string} clientMimetype 
 * @returns {{ valid: boolean, error?: string, ext?: string }}
 */
function validateUploadMetadata(originalname, clientMimetype) {
  if (!originalname || typeof originalname !== 'string') {
    return { valid: false, error: 'File name is required.' };
  }

  // Null-byte injection check
  if (originalname.includes('\0') || originalname.includes('%00')) {
    return { valid: false, error: 'Suspicious filename detected (null byte).' };
  }

  const cleanName = path.basename(originalname).trim();
  const ext = path.extname(cleanName).toLowerCase();

  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type "${ext || 'unknown'}" is not permitted. Only PDF, Office documents (DOCX/XLSX), images (JPG/PNG/WEBP/GIF), ZIP, and MP4 files are allowed.`
    };
  }

  // Double extension detection (e.g. "invoice.php.pdf", "avatar.exe.jpg")
  const parts = cleanName.toLowerCase().split('.').slice(0, -1);
  for (const part of parts) {
    if (PROHIBITED_DANGEROUS_TOKENS.has(part)) {
      return {
        valid: false,
        error: `Potentially dangerous multi-extension pattern detected with "${part}". Upload rejected.`
      };
    }
  }

  return { valid: true, ext };
}

/**
 * Checks magic byte signatures of the buffered file
 * @param {Buffer} buffer 
 * @param {string} ext 
 * @returns {{ valid: boolean, error?: string, canonicalMime?: string }}
 */
function verifyFileContent(buffer, ext) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { valid: false, error: 'Empty or invalid file buffer.' };
  }

  // 1. Explicitly check for known executable & script signatures (Defense-in-depth)
  if (buffer.length >= 2) {
    // Windows PE Executable (MZ)
    if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
      return { valid: false, error: 'Executable binary signature (MZ / PE) detected. Executables are strictly prohibited.' };
    }
    // Unix Shell script (#!)
    if (buffer[0] === 0x23 && buffer[1] === 0x21) {
      return { valid: false, error: 'Shell script signature (#!) detected. Scripts are strictly prohibited.' };
    }
  }

  if (buffer.length >= 4) {
    // Linux ELF binary (\x7FELF)
    if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
      return { valid: false, error: 'ELF executable binary signature detected. Binaries are strictly prohibited.' };
    }
    // Mach-O binary
    if (
      (buffer[0] === 0xFE && buffer[1] === 0xED && buffer[2] === 0xFA && (buffer[3] === 0xCE || buffer[3] === 0xCF)) ||
      (buffer[0] === 0xCE && buffer[1] === 0xFA && buffer[2] === 0xED && buffer[3] === 0xFE) ||
      (buffer[0] === 0xCF && buffer[1] === 0xFA && buffer[2] === 0xED && buffer[3] === 0xFE)
    ) {
      return { valid: false, error: 'Mach-O binary signature detected. Binaries are strictly prohibited.' };
    }
  }

  // 2. Inspect first 2048 bytes for web script injection / Stored XSS vectors
  const headerSample = buffer.slice(0, Math.min(buffer.length, 2048)).toString('utf-8').toLowerCase();
  const dangerousPatterns = [
    '<?php',
    '<?=',
    '<script',
    'javascript:',
    '<!doctype html',
    '<html',
    'xmlns="http://www.w3.org/2000/svg"',
    '<svg'
  ];

  for (const pattern of dangerousPatterns) {
    if (headerSample.includes(pattern)) {
      return { valid: false, error: `Malicious script or HTML tag (${pattern}) detected in file payload.` };
    }
  }

  // 3. Verify that magic bytes match the claimed file extension
  let isSignatureMatched = false;

  switch (ext) {
    case '.pdf': {
      // PDF must contain '%PDF-' within the first 1024 bytes
      const headerStr = buffer.slice(0, Math.min(buffer.length, 1024)).toString('ascii');
      isSignatureMatched = headerStr.includes('%PDF-');
      break;
    }

    case '.jpg':
    case '.jpeg': {
      // JPEG: FF D8 FF
      isSignatureMatched = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      break;
    }

    case '.png': {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      isSignatureMatched = buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
      break;
    }

    case '.gif': {
      // GIF87a or GIF89a
      if (buffer.length >= 6) {
        const sig = buffer.slice(0, 6).toString('ascii');
        isSignatureMatched = sig === 'GIF87a' || sig === 'GIF89a';
      }
      break;
    }

    case '.webp': {
      // RIFF....WEBP
      if (buffer.length >= 12) {
        const riff = buffer.slice(0, 4).toString('ascii');
        const webp = buffer.slice(8, 12).toString('ascii');
        isSignatureMatched = riff === 'RIFF' && webp === 'WEBP';
      }
      break;
    }

    case '.zip':
    case '.docx':
    case '.xlsx':
    case '.pptx': {
      // Zip header: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
      isSignatureMatched = buffer.length >= 4 &&
        buffer[0] === 0x50 && buffer[1] === 0x4B &&
        (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
      break;
    }

    case '.doc':
    case '.xls':
    case '.ppt': {
      // OLE / Compound File Binary Format: D0 CF 11 E0 A1 B1 1A E1
      isSignatureMatched = buffer.length >= 8 &&
        buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0 &&
        buffer[4] === 0xA1 && buffer[5] === 0xB1 && buffer[6] === 0x1A && buffer[7] === 0xE1;
      break;
    }

    case '.mp4':
    case '.mov': {
      // ISO base media file: contains 'ftyp', 'moov', 'mdat', or 'wide' at offset 4..8
      if (buffer.length >= 12) {
        const brand = buffer.slice(4, 8).toString('ascii');
        isSignatureMatched = ['ftyp', 'moov', 'mdat', 'wide', 'free'].includes(brand);
      }
      break;
    }

    case '.webm': {
      // EBML ID: 1A 45 DF A3
      isSignatureMatched = buffer.length >= 4 &&
        buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      break;
    }

    default:
      isSignatureMatched = false;
  }

  if (!isSignatureMatched) {
    return {
      valid: false,
      error: `File signature does not match claimed file extension "${ext}". File may be corrupt or disguised.`
    };
  }

  const canonicalMime = CANONICAL_MIMES[ext] || 'application/octet-stream';
  return { valid: true, canonicalMime };
}

/**
 * Sanitizes and validates target folder to prevent path traversal
 * @param {string} rawFolder 
 * @returns {string} Safe target folder name
 */
function sanitizeFolder(rawFolder) {
  if (!rawFolder || typeof rawFolder !== 'string') {
    return 'uploads';
  }

  // Remove any path traversal components
  const cleaned = rawFolder.replace(/[^a-zA-Z0-9_]/g, '');
  if (ALLOWED_FOLDERS.has(cleaned)) {
    return cleaned;
  }

  return 'uploads';
}

/**
 * Generates safe storage destination path
 * @param {string} folder 
 * @param {string} originalname 
 * @returns {string} Safe destination path
 */
function generateSafeDestination(folder, originalname) {
  const safeFolder = sanitizeFolder(folder);
  const cleanBase = path.basename(originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  return `${safeFolder}/${Date.now()}_${randomSuffix}_${cleanBase}`;
}

module.exports = {
  ALLOWED_EXTENSIONS,
  CANONICAL_MIMES,
  ALLOWED_FOLDERS,
  validateUploadMetadata,
  verifyFileContent,
  sanitizeFolder,
  generateSafeDestination
};
