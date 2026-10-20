import ApiCaller from '../utils/ApiCaller';
import { API_BASE_URL } from '../utils/config';

export function fetchWorkflowTemplates(token, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/workflows`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function fetchWorkflowTemplateById(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/workflows/${id}`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function createWorkflowTemplate(token, workflowData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/workflows`,
    'POST',
    workflowData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function updateWorkflowTemplate(token, id, workflowData, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/workflows/${id}`,
    'PUT',
    workflowData,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function deleteWorkflowTemplate(token, id, successCallback, errorCallback, setIsLoading) {
  return ApiCaller(
    `${API_BASE_URL}/api/workflows/${id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${token}` },
    successCallback,
    errorCallback,
    setIsLoading
  );
}

export function duplicateWorkflowTemplate(token, id, nameOrData, successCallback, errorCallback, setIsLoading) {
  let body = {};
  let cbSuccess = successCallback;
  let cbError = errorCallback;
  let cbLoading = setIsLoading;

  if (typeof nameOrData === 'string' && nameOrData) {
    body = { name: nameOrData };
  } else if (nameOrData && typeof nameOrData === 'object' && nameOrData.name) {
    body = { name: nameOrData.name };
  } else if (typeof nameOrData === 'function') {
    cbSuccess = nameOrData;
    cbError = successCallback;
    cbLoading = errorCallback;
  }

  return ApiCaller(
    `${API_BASE_URL}/api/workflows/${id}/duplicate`,
    'POST',
    body,
    { Authorization: `Bearer ${token}` },
    cbSuccess,
    cbError,
    cbLoading
  );
}
