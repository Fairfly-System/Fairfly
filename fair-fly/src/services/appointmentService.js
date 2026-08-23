import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchAppointments(token, queryParams = {}, successCallback, errorCallback, setIsLoading) {
  const queryStr = new URLSearchParams(queryParams).toString();
  const url = `${API_BASE_URL}/api/appointments${queryStr ? `?${queryStr}` : ''}`;
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

export function createAppointment(token, appointmentData, successCallback, errorCallback, setIsLoading) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return ApiCaller(
    `${API_BASE_URL}/api/appointments`,
    'POST',
    appointmentData,
    headers,
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateAppointmentStatus(token, id, status, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/appointments/${id}/status`,
    'PATCH',
    { status },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
