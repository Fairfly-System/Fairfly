import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Request password reset for client accounts
 * @param {string} email - Client account email
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function requestClientPasswordReset(email, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/client-forgot-password`,
    'POST',
    { email },
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
