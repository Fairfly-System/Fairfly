import { API_BASE_URL } from './config';

/**
 * Uploads a file through the backend API (/api/upload) to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} folder - Target folder name (e.g. 'service_requirements', 'workflow_documents')
 * @param {string} token - Optional Auth token
 * @returns {Promise<{ url: string, fileName: string, fileSize: number }>}
 */
export async function uploadFileToBackend(file, folder = 'uploads', token = null) {
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

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload file to backend.');
  }

  return {
    url: data.url,
    fileName: data.fileName || file.name,
    fileSize: data.fileSize || file.size,
    storagePath: data.storagePath
  };
}
