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

/**
 * Initiate Client registration (generates and emails a 6-character code)
 * @param {object} userData - { fullName, email, phone, password, confirmPassword }
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function initiateRegistration(userData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/register-initiate`,
    'POST',
    userData,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Register a new Client account via backend API (delegates to initiateRegistration)
 */
export const registerClient = initiateRegistration;

/**
 * Verify 6-character registration code and sign in
 * @param {object} payload - { email, code }
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function verifyRegistrationCode(payload, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/register-verify`,
    'POST',
    payload,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Resend 6-character registration code
 * @param {string} email - Recipient email
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function resendRegistrationCode(email, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/register-resend`,
    'POST',
    { email },
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Re-upload government ID for rejected client
 * @param {object} payload - { email, token, idType, idFrontUrl, idBackUrl, idFrontName, idBackName }
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function reuploadId(payload, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/reupload-id`,
    'POST',
    payload,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}



