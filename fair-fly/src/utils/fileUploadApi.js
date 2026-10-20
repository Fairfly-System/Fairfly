import { API_BASE_URL } from './config';

/**
 * Uploads a file through the backend API (/api/upload) to Firebase Storage
 * Includes safe non-JSON error handling and retry mechanism for transient 503 cold starts.
 * @param {File} file - The file object to upload
 * @param {string} folder - Target folder name (e.g. 'service_requirements', 'workflow_documents')
 * @param {string} token - Optional Auth token
 * @param {number} maxRetries - Maximum retry attempts on 503 / network errors (default: 2)
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, storagePath: string }>}
 */
export async function uploadFileToBackend(file, folder = 'uploads', token = null, maxRetries = 2) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textBody = await response.text();
        // If 503 Service Unavailable / cold start and retries left, wait and retry
        if (response.status === 503 && attempt < maxRetries) {
          console.warn(`[uploadFileToBackend] Received 503 Service Unavailable, retrying (${attempt + 1}/${maxRetries})...`);
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(
          response.status === 503
            ? 'The upload service is momentarily starting up. Please try again in a few moments.'
            : `Upload server returned ${response.status} (${response.statusText}): ${textBody.slice(0, 100)}`
        );
      }

      if (!response.ok || !data?.success) {
        if (response.status === 503 && attempt < maxRetries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(data?.error || `Upload failed with status ${response.status}`);
      }

      return {
        url: data.url,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        storagePath: data.storagePath
      };
    } catch (err) {
      if (attempt < maxRetries && !err.message.includes('No file provided') && !err.message.includes('maximum 25MB')) {
        console.warn(`[uploadFileToBackend] Upload attempt ${attempt + 1} failed: ${err.message}. Retrying...`);
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

