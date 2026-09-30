import { API_BASE_URL } from './config';
import { uploadFileToBackend } from './fileUploadApi';

export function getRequiredFieldError(schema, values = {}) {
  for (const section of schema?.sections || []) {
    for (const field of section.fields || []) {
      if (!field.required || field.reserved || field.anchorKey) continue;
      const value = values[field.id];
      const hasValue = field.type === 'checkbox'
        ? value === true
        : Array.isArray(value)
          ? value.length > 0
          : value !== null && value !== undefined && String(value).trim() !== '';
      if (!hasValue) return field.label;
    }
  }
  return null;
}

export function getRequiredAnchorError(schema, values = {}) {
  for (const section of schema?.sections || []) {
    for (const field of section.fields || []) {
      if (!field.required || field.reserved || !field.anchorKey) continue;
      if (!String(values[field.anchorKey] ?? '').trim()) return field.label;
    }
  }
  return null;
}

export function isAnchorRequired(schema, anchorKey) {
  for (const section of schema?.sections || []) {
    const field = (section.fields || []).find(item => item.anchorKey === anchorKey);
    if (field) return field.required === true;
  }
  return false;
}

async function uploadFieldFile(file, token, field) {
  const maxBytes = Number(field.maxBytes) || 10 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error(`${field.label} exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB file limit.`);

  const result = await uploadFileToBackend(file, 'service_requirements/form_answers', token);
  return {
    url: result.url,
    fileName: result.fileName || file.name,
    fileSize: result.fileSize || file.size,
    storagePath: result.storagePath || ''
  };
}

export async function serializeFormAnswers(schema, values = {}, token) {
  const answers = { ...values };
  for (const section of schema?.sections || []) {
    for (const field of section.fields || []) {
      if (field.reserved || field.anchorKey || !['file', 'image'].includes(field.type)) continue;
      const value = values[field.id];
      if (!value) continue;
      const files = Array.isArray(value) ? value : [value];
      answers[field.id] = await Promise.all(files.map(file => uploadFieldFile(file, token, field)));
      if (!field.multiple) answers[field.id] = answers[field.id][0] || null;
    }
  }
  return answers;
}