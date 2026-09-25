import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

const chatbotUrl = (path) => `${API_BASE_URL}/api/chatbot${path}`;

export function fetchChatbotConfig(successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl('/config'), 'GET', null, {}, successCallback, errorCallback, setIsLoading);
}

export function updateChatbotConfig(token, config, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl('/config'), 'PUT', config, { Authorization: `Bearer ${token}` }, successCallback, errorCallback, setIsLoading);
}

export function fetchChatbotFaqs(successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl('/faqs'), 'GET', null, {}, successCallback, errorCallback, setIsLoading);
}

export function fetchAllChatbotFaqs(token, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl('/faqs/manage'), 'GET', null, { Authorization: `Bearer ${token}` }, successCallback, errorCallback, setIsLoading);
}

export function createChatbotFaq(token, faq, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl('/faqs'), 'POST', faq, { Authorization: `Bearer ${token}` }, successCallback, errorCallback, setIsLoading);
}

export function updateChatbotFaq(token, id, faq, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl(`/faqs/${id}`), 'PATCH', faq, { Authorization: `Bearer ${token}` }, successCallback, errorCallback, setIsLoading);
}

export function deleteChatbotFaq(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(chatbotUrl(`/faqs/${id}`), 'DELETE', null, { Authorization: `Bearer ${token}` }, successCallback, errorCallback, setIsLoading);
}
