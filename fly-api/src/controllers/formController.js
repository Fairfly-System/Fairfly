const {
  addToDocumentWithId,
  deleteFromDatabase,
  getAllFromDatabase,
  getFromDatabase,
  queryDatabaseAdvanced,
  setToDatabase
} = require('../services/firebaseService');

const FORM_COLLECTION = 'formSchemas';
const ASSIGNMENT_PATH = 'formAssignments/active';
const ACTION_KEYS = [
  'customer.inquiry',
  'operator.inquiry',
  'customer.appointment',
  'customer.serviceRequest',
  'operator.quotation'
];
const FIELD_TYPES = new Set(['text', 'textarea', 'number', 'date', 'tel', 'email', 'select', 'checkbox', 'checkboxGroup', 'file', 'image']);
const REFERENCED_COLLECTIONS = ['inquiries', 'appointments', 'activeServices', 'quotations'];

const INQUIRY_SECTIONS = [
  { id: 'client_info', title: 'Client Information', fields: [
    { id: 'clientName', label: 'Name of Client / Company', type: 'text', required: true, reserved: true },
    { id: 'contactPerson', label: 'Contact Person', type: 'text', required: false, anchorKey: 'contactPerson' },
    { id: 'population', label: 'Population / Pax Count', type: 'text', required: false, anchorKey: 'population' },
    { id: 'address', label: 'Address', type: 'text', required: false, anchorKey: 'address' },
    { id: 'cellphone', label: 'Cellphone No.', type: 'tel', required: true, reserved: true },
    { id: 'telNo', label: 'Telephone No.', type: 'tel', required: false, anchorKey: 'telNo' },
    { id: 'email', label: 'Email Address', type: 'email', required: false, anchorKey: 'email' },
    { id: 'contractNo', label: 'Contract No.', type: 'text', required: false, anchorKey: 'contractNo' },
    { id: 'isNo', label: 'I.S. No.', type: 'text', required: false, anchorKey: 'isNo' }
  ] },
  { id: 'services', title: 'Services Offered', fields: [
    { id: 'servicesOffered', label: 'Services Offered', type: 'checkboxGroup', required: true, reserved: true, options: ['NSO', 'Passport', 'VISA Assistance', 'Package Tour', 'Ticket', 'Others'] }
  ] },
  { id: 'requirements', title: 'Specified Requirements', fields: [
    { id: 'specifiedRequirements', label: 'Specified Requirements of Client', type: 'textarea', required: true, reserved: true },
    { id: 'remarks', label: 'Remarks & Special Instructions', type: 'textarea', required: false, anchorKey: 'remarks' }
  ] },
  { id: 'custom_fields', title: 'Additional Information', fields: [
    { id: 'customRequest', label: 'Additional Information', type: 'textarea', required: false }
  ] }
];

const DEFAULT_FORMS = [
  {
    id: 'customer_inquiry',
    actionKey: 'customer.inquiry',
    title: 'Customer Inquiry',
    sections: INQUIRY_SECTIONS
  },
  {
    id: 'operator_inquiry',
    actionKey: 'operator.inquiry',
    title: 'Operator Inquiry',
    sections: INQUIRY_SECTIONS
  },
  {
    id: 'customer_appointment',
    actionKey: 'customer.appointment',
    title: 'Customer Appointment',
    sections: [
      { id: 'client_information', title: 'Client Information', fields: [
        { id: 'clientName', label: 'Full Name', type: 'text', required: true, reserved: true },
        { id: 'clientPhone', label: 'Contact Number', type: 'tel', required: true, reserved: true },
        { id: 'clientEmail', label: 'Email Address', type: 'email', required: false, anchorKey: 'clientEmail' }
      ] },
      { id: 'appointment_details', title: 'Appointment Details', fields: [
        { id: 'serviceType', label: 'Service of Interest', type: 'text', required: false, anchorKey: 'serviceType' },
        { id: 'preferredDate', label: 'Preferred Date', type: 'date', required: true, reserved: true },
        { id: 'preferredTime', label: 'Preferred Time', type: 'text', required: false, anchorKey: 'preferredTime' },
        { id: 'purpose', label: 'Purpose / Additional Notes', type: 'textarea', required: false, anchorKey: 'purpose' }
      ] }
    ]
  },
  {
    id: 'customer_service_request',
    actionKey: 'customer.serviceRequest',
    title: 'Customer Service Request',
    sections: [
      { id: 'request_details', title: 'Request Details', fields: [
        { id: 'clientName', label: 'Full Name', type: 'text', required: true, reserved: true },
        { id: 'clientEmail', label: 'Email Address', type: 'email', required: false, anchorKey: 'clientEmail' },
        { id: 'clientPhone', label: 'Contact Phone Number', type: 'tel', required: false, anchorKey: 'clientPhone' },
        { id: 'additionalNotes', label: 'Additional Instructions / Notes', type: 'textarea', required: false, anchorKey: 'additionalNotes' },
        { id: 'requestNotes', label: 'Additional Request Details', type: 'textarea', required: false }
      ] }
    ]
  },
  {
    id: 'operator_quotation',
    actionKey: 'operator.quotation',
    title: 'Operator Quotation',
    sections: [
      { id: 'client_information', title: 'Client Information', fields: [
        { id: 'clientName', label: 'Name of Client / Company', type: 'text', required: true, reserved: true },
        { id: 'contactPerson', label: 'Contact Person', type: 'text', required: false, anchorKey: 'contactPerson' },
        { id: 'clientPhone', label: 'Contact Phone / Mobile', type: 'tel', required: false, anchorKey: 'clientPhone' },
        { id: 'clientEmail', label: 'Client Email', type: 'email', required: false, anchorKey: 'clientEmail' }
      ] },
      { id: 'service_specifications', title: 'Service & Specifications', fields: [
        { id: 'serviceTitle', label: 'Service / Tour Subject Title', type: 'text', required: true, reserved: true },
        { id: 'requirements', label: 'Requirements', type: 'textarea', required: true, reserved: true },
        { id: 'tourDates', label: 'Tour Dates / Itinerary Breakdown', type: 'textarea', required: false, anchorKey: 'tourDates' }
      ] },
      { id: 'package_details', title: 'Inclusions & Exclusions', fields: [
        { id: 'inclusions', label: 'Package Inclusions', type: 'textarea', required: false, anchorKey: 'inclusions' },
        { id: 'exclusions', label: 'Package Exclusions', type: 'textarea', required: false, anchorKey: 'exclusions' }
      ] },
      { id: 'pricing', title: 'Pricing & Rates', fields: [
        { id: 'rate', label: 'Base Rate (PHP)', type: 'number', required: true, reserved: true },
        { id: 'taxAmount', label: 'Tax / Surcharge (PHP)', type: 'number', required: false, anchorKey: 'taxAmount' },
        { id: 'totalAmount', label: 'Total Amount (PHP)', type: 'number', required: true, reserved: true },
        { id: 'rateBreakdown', label: 'Rate Breakdown Display', type: 'text', required: false, anchorKey: 'rateBreakdown' }
      ] },
      { id: 'terms', title: 'Remarks & Prepared By', fields: [
        { id: 'remarks', label: 'Payment Terms & Remarks', type: 'textarea', required: false, anchorKey: 'remarks' },
        { id: 'preparedByName', label: 'Prepared By Name', type: 'text', required: false, anchorKey: 'preparedByName' },
        { id: 'preparedByTitle', label: 'Title / Role', type: 'text', required: false, anchorKey: 'preparedByTitle' },
        { id: 'preparedByContact', label: 'Contact Number', type: 'tel', required: false, anchorKey: 'preparedByContact' }
      ] },
      { id: 'additional_details', title: 'Additional Details', fields: [
        { id: 'paymentTerms', label: 'Additional Payment Terms', type: 'textarea', required: false },
        { id: 'quotationRemarks', label: 'Additional Remarks', type: 'textarea', required: false }
      ] }
    ]
  }
];

const makeDefaultSchema = (form, legacySchema) => {
  let sections = form.sections.map(section => ({ ...section, fields: [...section.fields] }));
  if (form.actionKey === 'operator.inquiry' && legacySchema?.sections?.length) {
    const customSections = legacySchema.sections.filter(section => section.id === 'custom_fields' || (section.fields || []).some(field => field.isCustom));
    customSections.forEach(legacySection => {
      let target = sections.find(section => section.id === legacySection.id);
      if (!target) {
        target = { id: legacySection.id, title: legacySection.title || 'Additional Information', fields: [] };
        sections.push(target);
      }
      const knownIds = new Set(target.fields.map(field => field.id));
      (legacySection.fields || []).filter(field => !knownIds.has(field.id)).forEach(field => {
        const customField = { ...field, reserved: false };
        delete customField.anchorKey;
        target.fields.push(customField);
      });
    });
  }
  return {
    ...form,
    version: 1,
    status: 'published',
    sections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

let defaultsTask;
const ensureDefaults = () => {
  if (!defaultsTask) {
    defaultsTask = (async () => {
      const legacySchema = await getFromDatabase(`${FORM_COLLECTION}/inquiry`);
      const storedForms = await Promise.all(DEFAULT_FORMS.map(form => getFromDatabase(`${FORM_COLLECTION}/${form.id}`)));
      await Promise.all(DEFAULT_FORMS.map((form, index) => {
        if (storedForms[index]) return Promise.resolve();
        return addToDocumentWithId(FORM_COLLECTION, form.id, makeDefaultSchema(form, legacySchema));
      }));

      const currentAssignments = await getFromDatabase(ASSIGNMENT_PATH);
      const defaultAssignments = Object.fromEntries(DEFAULT_FORMS.map(form => [form.actionKey, form.id]));
      if (!currentAssignments) {
        await setToDatabase(ASSIGNMENT_PATH, { ...defaultAssignments, updatedAt: new Date().toISOString() });
        return;
      }
      const missingAssignments = Object.fromEntries(Object.entries(defaultAssignments).filter(([key]) => !Object.hasOwn(currentAssignments, key)));
      if (Object.keys(missingAssignments).length) {
        await setToDatabase(ASSIGNMENT_PATH, { ...currentAssignments, ...missingAssignments, updatedAt: new Date().toISOString() });
      }
    })();
  }
  return defaultsTask.catch(error => {
    defaultsTask = null;
    throw error;
  });
};

const validateSchema = (data) => {
  if (!data || typeof data !== 'object' || !Array.isArray(data.sections)) return 'A form must contain an array of sections.';
  if (typeof data.title !== 'string' || !data.title.trim()) return 'A form title is required.';
  if (data.title.length > 120) return 'Form titles must be 120 characters or fewer.';

  const sectionIds = new Set();
  const fieldIds = new Set();
  for (const section of data.sections) {
    if (!section || typeof section.id !== 'string' || !section.id.trim() || typeof section.title !== 'string' || !section.title.trim() || !Array.isArray(section.fields)) {
      return 'Each section needs an ID, title, and fields array.';
    }
    if (sectionIds.has(section.id)) return 'Section IDs must be unique within a form.';
    sectionIds.add(section.id);
    for (const field of section.fields) {
      if (!field || typeof field.id !== 'string' || !field.id.trim() || typeof field.label !== 'string' || !field.label.trim() || !FIELD_TYPES.has(field.type)) {
        return 'Each field needs an ID, label, and supported input type.';
      }
      if (fieldIds.has(field.id)) return 'Field IDs must be unique within a form.';
      fieldIds.add(field.id);
      if (['select', 'checkboxGroup'].includes(field.type) && (!Array.isArray(field.options) || field.options.length === 0)) {
        return `${field.label} needs at least one option.`;
      }
    }
  }
  return null;
};

const listForms = async (req, res) => {
  try {
    await ensureDefaults();
    const forms = await getAllFromDatabase(FORM_COLLECTION);
    const assignments = await getFromDatabase(ASSIGNMENT_PATH) || {};
    res.json({
      forms: forms.filter(form => form.id !== 'inquiry'),
      assignments: Object.fromEntries(ACTION_KEYS.map(key => [key, assignments[key] || null]))
    });
  } catch (error) {
    console.error('Error listing form schemas:', error);
    res.status(500).json({ error: 'Failed to load forms.' });
  }
};

const getForm = async (req, res) => {
  try {
    await ensureDefaults();
    const form = await getFromDatabase(`${FORM_COLLECTION}/${req.params.id}`);
    if (!form || form.status === 'archived') return res.status(404).json({ error: 'Form not found.' });
    res.json(form);
  } catch (error) {
    console.error('Error loading form schema:', error);
    res.status(500).json({ error: 'Failed to load form.' });
  }
};

const getAssignments = async (req, res) => {
  try {
    await ensureDefaults();
    const assignments = await getFromDatabase(ASSIGNMENT_PATH);
    res.json(Object.fromEntries(ACTION_KEYS.map(key => [key, assignments?.[key] || null])));
  } catch (error) {
    console.error('Error loading form assignments:', error);
    res.status(500).json({ error: 'Failed to load form assignments.' });
  }
};

const resolveForm = async (req, res) => {
  try {
    if (!ACTION_KEYS.includes(req.params.actionKey)) return res.status(400).json({ error: 'Unknown form action.' });
    await ensureDefaults();
    const assignments = await getFromDatabase(ASSIGNMENT_PATH);
    const formId = assignments?.[req.params.actionKey];
    const form = formId ? await getFromDatabase(`${FORM_COLLECTION}/${formId}`) : null;
    if (!form || form.status === 'archived') return res.status(404).json({ error: 'No active form is assigned to this action.' });
    res.json(form);
  } catch (error) {
    console.error('Error resolving assigned form:', error);
    res.status(500).json({ error: 'Failed to resolve assigned form.' });
  }
};

const createForm = async (req, res) => {
  try {
    const validationError = validateSchema(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const id = `form_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const form = { id, title: req.body.title.trim(), sections: req.body.sections, status: 'published', version: 1, createdAt: now, updatedAt: now };
    await addToDocumentWithId(FORM_COLLECTION, id, form);
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form schema:', error);
    res.status(500).json({ error: 'Failed to create form.' });
  }
};

const updateForm = async (req, res) => {
  try {
    const existing = await getFromDatabase(`${FORM_COLLECTION}/${req.params.id}`);
    if (!existing || req.params.id === 'inquiry') return res.status(404).json({ error: 'Form not found.' });
    const next = { ...existing, ...req.body, id: existing.id, updatedAt: new Date().toISOString() };
    if (next.status !== 'published' && next.status !== 'archived') return res.status(400).json({ error: 'Form status must be published or archived.' });
    if (next.status === 'archived') {
      const assignments = await getFromDatabase(ASSIGNMENT_PATH) || {};
      if (Object.values(assignments).includes(existing.id)) return res.status(409).json({ error: 'Reassign this form before archiving it.' });
    }
    const validationError = validateSchema(next);
    if (validationError) return res.status(400).json({ error: validationError });
    next.title = next.title.trim();
    next.version = (existing.version || 1) + 1;
    await addToDocumentWithId(FORM_COLLECTION, existing.id, next);
    res.json(next);
  } catch (error) {
    console.error('Error updating form schema:', error);
    res.status(500).json({ error: 'Failed to update form.' });
  }
};

const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (DEFAULT_FORMS.some(form => form.id === id) || id === 'inquiry') return res.status(409).json({ error: 'Default forms cannot be deleted. Archive or edit the form instead.' });
    const form = await getFromDatabase(`${FORM_COLLECTION}/${id}`);
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    const assignments = await getFromDatabase(ASSIGNMENT_PATH) || {};
    if (Object.values(assignments).includes(id)) return res.status(409).json({ error: 'Reassign this form before deleting it.' });
    const references = await Promise.all(REFERENCED_COLLECTIONS.map(collection => queryDatabaseAdvanced(collection, { filters: [{ field: 'formId', value: id }], limit: 1 })));
    if (references.some(docs => docs.length)) return res.status(409).json({ error: 'This form is referenced by submitted records and cannot be deleted.' });
    await deleteFromDatabase(`${FORM_COLLECTION}/${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting form schema:', error);
    res.status(500).json({ error: 'Failed to delete form.' });
  }
};

const saveAssignments = async (req, res) => {
  try {
    await ensureDefaults();
    const supplied = req.body?.assignments;
    if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) return res.status(400).json({ error: 'Assignments must be an action-to-form map.' });
    for (const actionKey of Object.keys(supplied)) {
      if (!ACTION_KEYS.includes(actionKey)) return res.status(400).json({ error: `Unknown form action: ${actionKey}` });
      const formId = supplied[actionKey];
      if (formId === null) continue;
      const form = typeof formId === 'string' ? await getFromDatabase(`${FORM_COLLECTION}/${formId}`) : null;
      if (!form || form.status !== 'published') return res.status(400).json({ error: `Choose an active form for ${actionKey}.` });
      if (actionKey === 'operator.quotation' && form.sections?.some(section => section.fields?.some(field => ['file', 'image'].includes(field.type)))) {
        return res.status(400).json({ error: 'Quotation forms do not support upload fields.' });
      }
    }
    const existing = await getFromDatabase(ASSIGNMENT_PATH) || {};
    const assignments = { ...Object.fromEntries(ACTION_KEYS.map(key => [key, existing[key] || null])), ...supplied, updatedAt: new Date().toISOString() };
    await setToDatabase(ASSIGNMENT_PATH, assignments);
    res.json(Object.fromEntries(ACTION_KEYS.map(key => [key, assignments[key]])));
  } catch (error) {
    console.error('Error saving form assignments:', error);
    res.status(500).json({ error: 'Failed to save form assignments.' });
  }
};

module.exports = { listForms, getForm, resolveForm, getAssignments, createForm, updateForm, deleteForm, saveAssignments };