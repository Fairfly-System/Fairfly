import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchQuotations(token, params = {}, successCallback, errorCallback, setIsLoading) {
  let actualParams = {};
  let cbSuccess = successCallback;
  let cbError = errorCallback;
  let cbLoading = setIsLoading;

  if (typeof params === 'function') {
    cbLoading = errorCallback;
    cbError = successCallback;
    cbSuccess = params;
    actualParams = {};
  } else if (params && typeof params === 'object') {
    actualParams = params;
  }

  let url = `${API_BASE_URL}/api/quotations`;
  const queryParts = [];
  if (actualParams.status && actualParams.status !== 'all') {
    queryParts.push(`status=${encodeURIComponent(actualParams.status)}`);
  }
  if (actualParams.branchUid && actualParams.branchUid !== 'all') {
    queryParts.push(`branchUid=${encodeURIComponent(actualParams.branchUid)}`);
  }
  if (actualParams.archived !== undefined && actualParams.archived !== null && actualParams.archived !== 'all') {
    queryParts.push(`archived=${encodeURIComponent(actualParams.archived)}`);
  }
  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`;
  }

  return ApiCaller(
    url,
    'GET',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    cbSuccess,
    cbError,
    cbLoading
  );
}

export function fetchQuotationById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createQuotation(token, quotationData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations`,
    'POST',
    quotationData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateQuotation(token, id, quotationData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}`,
    'PUT',
    quotationData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function archiveQuotation(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/archive`,
    'POST',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function restoreQuotation(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/restore`,
    'POST',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function rejectQuotation(token, id, reason, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/reject`,
    'POST',
    { reason },
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteQuotation(token, id, successCallback, errorCallback, setIsLoading) {
  // Gracefully route legacy delete calls to archiveQuotation
  return archiveQuotation(token, id, successCallback, errorCallback, setIsLoading);
}

export function updateQuotationStatus(token, id, status, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/status`,
    'PATCH',
    { status },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function acceptQuotation(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/accept`,
    'POST',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function submitQuotationRequirements(token, id, requirements, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/submit-requirements`,
    'POST',
    { requirements },
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function reviewQuotationRequirements(token, id, payload, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/quotations/${id}/review-requirements`,
    'POST',
    payload, // { action: 'approve' | 'request_changes', remarks, reason }
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

