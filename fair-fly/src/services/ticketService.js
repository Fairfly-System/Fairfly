import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchTickets(token, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/tickets`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function fetchTicketById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/tickets/${id}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createTicket(token, ticketData, successCallback, errorCallback, setIsLoading) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return ApiCaller(
    `${API_BASE_URL}/api/tickets`,
    'POST',
    ticketData,
    headers,
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function sendMessageToTicket(token, id, message, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/tickets/${id}/messages`,
    'POST',
    { message },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateTicketStatus(token, id, status, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/tickets/${id}/status`,
    'PATCH',
    { status },
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function closeTicket(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/tickets/${id}/close`,
    'POST',
    {},
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}
