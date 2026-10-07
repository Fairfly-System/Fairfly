import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Fetch public tracking status for a request without requiring an authenticated account.
 * Strictly resolves official Service Tracking IDs (SRV-2026-XXXXXX / SVC-...).
 *
 * @param {string} trackingId - Service Tracking Code or Fulfillment ID
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
