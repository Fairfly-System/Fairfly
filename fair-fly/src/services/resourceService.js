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
