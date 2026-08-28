import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchServices(branchUidOrSuccess, successCallback, errorCallback, setIsLoading) {
  let url = `${API_BASE_URL}/api/services`;
  let successCb = successCallback;
  let errorCb = errorCallback;
  let setLoad = setIsLoading;

  if (typeof branchUidOrSuccess === 'string') {
    url += `?branchUid=${encodeURIComponent(branchUidOrSuccess)}`;
  } else if (typeof branchUidOrSuccess === 'function') {
    successCb = branchUidOrSuccess;
    errorCb = successCallback;
    setLoad = errorCallback;
  }

  return ApiCaller(
    url,
    'GET',
    null,
    {},
    successCb,
    errorCb,
    setLoad
  );
}

export function fetchServiceById(id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/${id}`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createService(token, serviceData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services`,
    'POST',
    serviceData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateService(token, id, serviceData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/${id}`,
    'PUT',
    serviceData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function patchService(token, id, serviceData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/${id}`,
    'PATCH',
    serviceData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteService(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/${id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function bulkStatusServices(token, ids, status, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/bulk-status`,
    'POST',
    { ids, status },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function bulkDeleteServices(token, ids, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/bulk-delete`,
    'POST',
    { ids },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
