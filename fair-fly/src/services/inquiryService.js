import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchInquiries(token, params = {}, successCallback, errorCallback, setIsLoading) {
  let url = `${API_BASE_URL}/api/inquiries`;
  const queryParts = [];
  if (params.status && params.status !== 'all') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.branchUid && params.branchUid !== 'all') {
    queryParts.push(`branchUid=${encodeURIComponent(params.branchUid)}`);
  }
  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`;
  }

  return ApiCaller(
    url,
    'GET',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function fetchInquiryById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/${id}`,
    'GET',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createInquiry(token, inquiryData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries`,
    'POST',
    inquiryData,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateInquiry(token, id, inquiryData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/${id}`,
    'PATCH',
    inquiryData,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteInquiry(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/${id}`,
    'DELETE',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function confirmInquiry(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/${id}/confirm`,
    'POST',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function fetchInquirySchema(successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/schema`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function saveInquirySchema(token, schemaData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/inquiries/schema`,
    'PUT',
    schemaData,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
