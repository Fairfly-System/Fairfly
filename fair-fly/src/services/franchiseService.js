import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchFranchiseApplicationSchema(token, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/franchise/application-schema`,
    'GET',
    null,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function saveFranchiseApplicationSchema(token, schema, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/franchise/application-schema`,
    'PUT',
    schema,
    token ? { Authorization: `Bearer ${token}` } : {},
    successCallback,
    errorCallback,
    setIsLoading
  );
}
