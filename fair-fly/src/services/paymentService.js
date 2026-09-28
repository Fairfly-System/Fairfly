import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Initialize a PayMongo checkout session for an accepted quotation.
 * Strictly derives the payment amount and currency server-side.
 * 
 * @param {string} token - Firebase ID token of the authenticated client
 * @param {string} quotationId - ID of the quotation to pay for
 * @param {function} successCallback - (data) => void with { checkoutUrl, paymentId, totalAmount }
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function createCheckoutSession(token, quotationId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/payments/checkout-session`,
    'POST',
    { quotationId },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Verify a payment record's state with PayMongo / server.
 * Invoked synchronously when client returns from the PayMongo checkout redirect.
 * 
 * @param {string} token - Firebase ID token
 * @param {string} paymentId - Payment record ID
 * @param {function} successCallback - (data) => void with { status, paid, payment }
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function verifyPayment(token, paymentId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/payments/${paymentId}/verify`,
    'POST',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch a specific payment transaction record by ID.
 * 
 * @param {string} token - Firebase ID token
 * @param {string} paymentId - Payment document ID
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchPaymentById(token, paymentId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/payments/${paymentId}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch payments matching query params (e.g., quotationId or status).
 * 
 * @param {string} token - Firebase ID token
 * @param {object} params - Query parameters
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchPayments(token, params = {}, successCallback, errorCallback, setIsLoading) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/api/payments${query ? `?${query}` : ''}`;
  return ApiCaller(
    url,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
