const { getFromDatabase } = require('./firebaseService');

const ASSIGNMENT_PATH = 'formAssignments/active';

const hasAnswer = (field, value) => {
  if (field.type === 'checkbox') return value === true;
  if (field.type === 'checkboxGroup') return Array.isArray(value) && value.length > 0;
  if (field.type === 'file' || field.type === 'image') {
    const files = Array.isArray(value) ? value : [value];
    return files.length > 0 && files.every(file => file && typeof file.url === 'string');
  }
  return value !== null && value !== undefined && String(value).trim() !== '';
};

const validateFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return null;
  if (field.type === 'checkbox' && typeof value !== 'boolean') return `${field.label} must be a yes/no value.`;
  if (field.type === 'number' && !Number.isFinite(Number(value))) return `${field.label} must be a number.`;
  const options = (field.options || []).map(option => typeof option === 'string' ? option : option.value);
  if (field.type === 'select' && !options.includes(value)) return `Choose a valid option for ${field.label}.`;
  if (field.type === 'checkboxGroup' && (!Array.isArray(value) || value.some(item => !options.includes(item)))) return `Choose valid options for ${field.label}.`;
  if ((field.type === 'file' || field.type === 'image') && !hasAnswer(field, value)) return `${field.label} has invalid upload data.`;
  return null;
};

async function validateFormSubmission(actionKey, body = {}) {
  const assignments = await getFromDatabase(ASSIGNMENT_PATH) || {};
  const assignedId = assignments[actionKey] || null;
  if (!assignedId) {
    if (body.formId) return { error: 'This action no longer has the submitted form assigned.', status: 409 };
    return { formId: null, formVersion: null, formSnapshot: null, customFields: {} };
  }

  if (body.formId && body.formId !== assignedId) {
    return { error: 'The submitted form is no longer assigned to this action. Reload the form and try again.', status: 409 };
  }

  const schema = await getFromDatabase(`formSchemas/${assignedId}`);
  if (!schema || schema.status !== 'published') return { error: 'The active form for this action is unavailable.', status: 409 };
  const answers = body.customFields || {};
  if (typeof answers !== 'object' || Array.isArray(answers)) return { error: 'Form answers must be an object.', status: 400 };

  const fields = (schema.sections || []).flatMap(section => (section.fields || []).filter(field => !field.reserved));
  const customFields = fields.filter(field => !field.anchorKey);
  const anchorFields = fields.filter(field => field.anchorKey);
  const fieldsById = new Map(customFields.map(field => [field.id, field]));
  for (const fieldId of Object.keys(answers)) {
    if (!fieldsById.has(fieldId)) return { error: `Unknown form field: ${fieldId}.`, status: 400 };
  }
  for (const field of customFields) {
    const value = answers[field.id];
    if (field.required && !hasAnswer(field, value)) return { error: `${field.label} is required.`, status: 400 };
    const validationError = validateFieldValue(field, value);
    if (validationError) return { error: validationError, status: 400 };
  }
  for (const field of anchorFields) {
    const value = body[field.anchorKey];
    if (field.required && !hasAnswer(field, value)) return { error: `${field.label} is required.`, status: 400 };
    const validationError = validateFieldValue(field, value);
    if (validationError) return { error: validationError, status: 400 };
  }

  const formSnapshot = {
    id: schema.id,
    title: schema.title,
    version: schema.version || 1,
    sections: (schema.sections || []).map(section => ({
      id: section.id,
      title: section.title,
      fields: (section.fields || []).filter(field => !field.reserved && !field.anchorKey).map(({ id, label, type, options, required }) => ({ id, label, type, options: options || [], required: required === true }))
    })).filter(section => section.fields.length > 0)
  };

  return { formId: schema.id, formVersion: formSnapshot.version, formSnapshot, customFields: answers };
}

module.exports = { validateFormSubmission };