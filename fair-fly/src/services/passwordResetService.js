import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Fetch all operator password reset requests (Super Admin only)
 */
export function fetchPasswordResetRequests(token, status, successCallback, errorCallback, setIsLoading) {
  const queryParam = status && status !== 'all' ? `?status=${status}` : '';
  return ApiCaller(
    `${API_BASE_URL}/api/admin/password-resets${queryParam}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch single password reset request with operator profile
 */
export function fetchPasswordResetRequestById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/admin/password-resets/${id}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Approve operator password reset request (triggers Firebase reset email)
 */
export function approvePasswordResetRequest(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/admin/password-resets/${id}/approve`,
    'POST',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Reject operator password reset request
 */
export function rejectPasswordResetRequest(token, id, reason, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/admin/password-resets/${id}/reject`,
    'POST',
    { reason },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
