import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Fetch official E-Receipt by Receipt ID
 * 
 * @param {string} token - Firebase ID token
 * @param {string} receiptId - Receipt document ID (RCT-...)
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchReceiptById(token, receiptId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/receipts/${encodeURIComponent(receiptId)}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch official E-Receipt for a specific Quotation ID
 * 
 * @param {string} token - Firebase ID token
 * @param {string} quotationId - Quotation ID
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchReceiptByQuotationId(token, quotationId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/receipts/quotation/${encodeURIComponent(quotationId)}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch official E-Receipt for a specific Active Service Fulfillment ID
 * 
 * @param {string} token - Firebase ID token
 * @param {string} fulfillmentId - Active Service document ID (SVC-...)
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchReceiptByFulfillmentId(token, fulfillmentId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/receipts/fulfillment/${encodeURIComponent(fulfillmentId)}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch official E-Receipt for a specific Payment ID
 * 
 * @param {string} token - Firebase ID token
 * @param {string} paymentId - Payment record ID (PAY-...)
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchReceiptByPaymentId(token, paymentId, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/receipts/payment/${encodeURIComponent(paymentId)}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

/**
 * Fetch public E-Receipt data by Service Code, Receipt No, or Tracking Reference (No login required)
 * 
 * @param {string} code - Service code (SRV-...) or Receipt number (RCT-...)
 * @param {function} successCallback - (data) => void
 * @param {function} errorCallback - (err) => void
 * @param {function} [setIsLoading] - (bool) => void
 */
export function fetchPublicReceipt(code, successCallback, errorCallback, setIsLoading) {
  const cleanCode = (code || '').trim();
  return ApiCaller(
    `${API_BASE_URL}/api/receipts/public/${encodeURIComponent(cleanCode)}`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
