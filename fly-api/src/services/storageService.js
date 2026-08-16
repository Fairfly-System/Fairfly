const { bucket } = require('../config/firebase');

/**
 * Extracts the storage file path from a Firebase Storage URL or path string
 * @param {string} urlOrPath 
 * @returns {string|null}
 */
function parseStoragePath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  if (urlOrPath.startsWith('https://') || urlOrPath.startsWith('http://')) {
    // Standard Firebase Storage URL format: .../o/folder%2Ffilename.ext?alt=media...
    if (urlOrPath.includes('/o/')) {
      const pathEncoded = urlOrPath.split('/o/')[1]?.split('?')[0];
      if (pathEncoded) {
        return decodeURIComponent(pathEncoded);
      }
    }
    return null;
  }

  return urlOrPath;
}

/**
 * Deletes a single file from Firebase Storage bucket
 * @param {string} urlOrPath 
 * @returns {Promise<boolean>}
 */
async function deleteFileFromStorage(urlOrPath) {
  const filePath = parseStoragePath(urlOrPath);
  if (!filePath) return false;

  try {
    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();
    if (exists) {
      await fileRef.delete();
      console.log(`[StorageCleanup] Successfully deleted storage file: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`[StorageCleanup] Error deleting file (${filePath}):`, error.message);
  }
  return false;
}

/**
 * Deletes multiple files from Firebase Storage bucket in parallel
 * @param {string[]} urlsOrPaths 
 */
async function deleteFilesFromStorage(urlsOrPaths) {
  if (!Array.isArray(urlsOrPaths) || urlsOrPaths.length === 0) return;
  const validPaths = urlsOrPaths.map(parseStoragePath).filter(Boolean);
  const uniquePaths = [...new Set(validPaths)];
  await Promise.allSettled(uniquePaths.map(filePath => deleteFileFromStorage(filePath)));
}

/**
 * Recursively extracts all Firebase Storage URLs/paths from an arbitrary data structure
 * @param {any} obj //Obj is the field or array of links from a record
 * @returns {string[]}
 */
function extractStorageUrls(obj) {
  const urls = []; //Arrays of Urls to be deleted
  if (!obj) return urls;

  function traverse(item) {
    if (!item) return;

    //Sees if that item contains a string, and if that string is a referecne to a firebase storage upload link.
    if (typeof item === 'string') {
      if (item.includes('firebasestorage.googleapis.com') || item.includes('/o/')) {
        urls.push(item);
      }
    } else if (Array.isArray(item)) {
      item.forEach(traverse);
    } else if (typeof item === 'object') { // If it is an object, checks each fields to see if it contains a string that is a firebase storage upload link.
      Object.keys(item).forEach((key) => {
        if (key === 'url' || key === 'storagePath' || key === 'fileUrl') {
          if (typeof item[key] === 'string' && item[key].trim()) { //Checks if the value is a non-empty string.
            urls.push(item[key]); //Put that URL to the array
          }
        }
        traverse(item[key]); //Use the function recursively to check other fields and nested objects.
      });
    }
  }

  traverse(obj);
  return [...new Set(urls.filter(Boolean))]; //returns a Set of 
}

/**
 * Modular Helper: Automatically scans and deletes all attached files from Firebase Storage
 * for any given record, array of records, or object before/after database deletion.
 * @param {any} recordData Single record or array of records
 */
async function deleteRecordStorageFiles(recordData) {
  const fileUrls = extractStorageUrls(recordData);
  if (fileUrls.length > 0) {
    console.log(`[StorageCleanup] Found ${fileUrls.length} attached file(s). Cleaning up from Firebase Storage...`);
    await deleteFilesFromStorage(fileUrls);
  }
}

module.exports = {
  parseStoragePath,
  deleteFileFromStorage,
  deleteFilesFromStorage,
  extractStorageUrls,
  deleteRecordStorageFiles
};
