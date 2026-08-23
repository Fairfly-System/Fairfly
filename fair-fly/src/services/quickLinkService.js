import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchQuickLinks(successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/quicklinks`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createQuickLink(token, quickLinkData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/quicklinks`,
    'POST',
    quickLinkData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateQuickLink(token, id, quickLinkData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/quicklinks/${id}`,
    'PATCH',
    quickLinkData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteQuickLink(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/quicklinks/${id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function bulkDeleteQuickLinks(token, ids, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/services/quicklinks/bulk-delete`,
    'POST',
    { ids },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
