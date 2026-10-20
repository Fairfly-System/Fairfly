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
 * Request password reset for operator accounts (Super Admin review flow)
 * @param {object} payload - { email, branchName, reason }
 * @param {function} successCallback - Success callback handler
 * @param {function} errorCallback - Error callback handler
 * @param {function} setIsLoading - Loading state setter
 */
export function requestOperatorPasswordReset(payload, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/operator-reset-request`,
    'POST',
    payload,
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

/**
 * Fetch profile details for currently authenticated user
 * @param {string} token - Firebase ID token
 * @param {function} successCallback - Success handler
 * @param {function} errorCallback - Error handler
 * @param {function} setIsLoading - Loading setter
 */
export function fetchUserProfile(token, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/profile`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Update personal profile information for currently authenticated user
 * @param {string} token - Firebase ID token
 * @param {object} data - { fullName, name, branchName, phone, contactNumber, address }
 * @param {function} successCallback - Success handler
 * @param {function} errorCallback - Error handler
 * @param {function} setIsLoading - Loading setter
 */
export function updateUserProfile(token, data, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/profile`,
    'PATCH',
    data,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Submit password change request to backend
 * @param {string} token - Fresh Firebase ID token (post-reauthentication)
 * @param {object} payload - { newPassword, confirmPassword }
 * @param {function} successCallback - Success handler
 * @param {function} errorCallback - Error handler
 * @param {function} setIsLoading - Loading setter
 */
export function changePasswordApi(token, payload, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/auth/change-password`,
    'POST',
    payload,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}




