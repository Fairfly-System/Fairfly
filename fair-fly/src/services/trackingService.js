import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Fetch public tracking status for a request without requiring an authenticated account.
 * Supports Quotation ID/Number (QT-...), Inquiry Control Number (INQ-...), or Service Tracking ID (ACT-...).
 *
 * @param {string} trackingId - Tracking code or document ID
 * @param {Function} successCallback - Callback invoked on successful status response
 * @param {Function} errorCallback - Callback invoked on lookup failure or network error
 * @param {Function} setIsLoading - Callback to toggle loading state
 */
export function fetchPublicTracking(trackingId, successCallback, errorCallback, setIsLoading) {
  const cleanId = (trackingId || '').trim();
  return ApiCaller(
    `${API_BASE_URL}/api/tracking/public/${encodeURIComponent(cleanId)}`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
