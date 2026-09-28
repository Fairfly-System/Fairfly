export function getFormResponseEntries(snapshot, values = {}) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return [];
  const fields = new Map();
  (snapshot?.sections || []).forEach(section => {
    (section.fields || []).forEach(field => fields.set(field.id, { ...field, sectionTitle: section.title }));
  });
  return Object.entries(values).map(([id, value]) => {
    const field = fields.get(id) || {};
    return { id, label: field.label || id, sectionTitle: field.sectionTitle || '', value };
  });
}

export function formatFormResponseValue(value) {
  if (Array.isArray(value)) return value.map(formatFormResponseValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return value.fileName || value.name || value.url || '';
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value === null || value === undefined ? '' : String(value);
}