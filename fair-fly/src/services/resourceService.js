import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchResources(token, paramsOrSuccess, successCallback, errorCallback, setIsLoading) {
  let params = null;
  let successCb = successCallback;
  let errorCb = errorCallback;
  let loadingCb = setIsLoading;

  if (typeof paramsOrSuccess === 'function') {
    successCb = paramsOrSuccess;
    errorCb = successCallback;
    loadingCb = errorCallback;
  } else if (paramsOrSuccess && typeof paramsOrSuccess === 'object') {
    params = paramsOrSuccess;
  }

  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ).toString()
    : '';

  return ApiCaller(
    `${API_BASE_URL}/api/resources${query}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCb,
    errorCb,
    loadingCb
  );
}

export function fetchResourceById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/resources/${id}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createResource(token, resourceData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/resources`,
    'POST',
    resourceData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateResource(token, id, resourceData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/resources/${id}`,
    'PATCH',
    resourceData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteResource(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/resources/${id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function recordResourceDownload(token, id, successCallback, errorCallback) {
  return ApiCaller(
    `${API_BASE_URL}/api/resources/${id}/download`,
    'POST',
    {},
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback
  );
}

/**
 * Triggers a direct browser file download for a resource.
 * Fetches the binary content from the authenticated backend streaming endpoint
 * and instantiates a same-origin Blob URL, guaranteeing the browser triggers
 * an actual file download dialog instead of opening in a new tab.
 *
 * @param {string} token - User auth Bearer token
 * @param {Object} resource - Resource object { id, title, fileName, fileExtension, fileUrl }
 * @returns {Promise<boolean>}
 */
export async function downloadResourceFile(token, resource) {
  if (!resource || !resource.id) {
    throw new Error('Resource is required for download.');
  }

  const filename = resource.fileName || resource.title || 'resource-material';
  let response;

  // 1. Try authenticated backend file stream endpoint
  try {
    response = await fetch(`${API_BASE_URL}/api/resources/${resource.id}/file`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch (netErr) {
    console.warn('[ResourceService] Backend file stream fetch failed, trying direct URL:', netErr);
  }

  // 2. Direct fallback if backend stream was not reachable
  if (!response || !response.ok) {
    if (resource.fileUrl) {
      try {
        response = await fetch(resource.fileUrl);
      } catch (directErr) {
        console.warn('[ResourceService] Direct fileUrl fetch failed:', directErr);
      }
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Download failed with status ${response ? response.status : 'network error'}`);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;

  // Ensure file extension is preserved
  const hasExt = filename.includes('.');
  const fallbackExt = resource.fileExtension ? `.${resource.fileExtension.replace(/^\./, '')}` : '';
  link.download = hasExt ? filename : `${filename}${fallbackExt}`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 2000);

  return true;
}

