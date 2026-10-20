import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

/**
 * Fetch public directory of authorized active FairFly branch operators.
 * Unauthenticated public endpoint returning canonical branch directory info.
 *
 * @param {Function} successCallback - Callback with array of branch objects
 * @param {Function} errorCallback - Error handler callback
 * @param {Function} [setIsLoading] - Optional loading state toggler
 */
export function fetchPublicBranches(successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/operators/branches`,
    'GET',
    null,
    {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
