import { API_BASE_URL } from '../utils/config';

const request = async (path, method = 'GET', body = null, token = null) => {
  const response = await fetch(`${API_BASE_URL}/api/forms${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Form request failed.');
  return data;
};

export const listForms = (token) => request('/', 'GET', null, token);
export const fetchForm = (id, token) => request(`/${encodeURIComponent(id)}`, 'GET', null, token);
export const resolveForm = (actionKey) => request(`/resolve/${encodeURIComponent(actionKey)}`);
export const createForm = (token, form) => request('/', 'POST', form, token);
export const updateForm = (token, id, changes) => request(`/${encodeURIComponent(id)}`, 'PATCH', changes, token);
export const deleteForm = (token, id) => request(`/${encodeURIComponent(id)}`, 'DELETE', null, token);
export const saveFormAssignments = (token, assignments) => request('/assignments', 'PUT', { assignments }, token);