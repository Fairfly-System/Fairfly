import { useEffect, useState } from 'react';
import { Archive, ArrowDown, ArrowUp, FilePlus2, Plus, Save, Trash2 } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import {
  createForm,
  deleteForm,
  listForms,
  saveFormAssignments,
  updateForm
} from '../../../services/formService';
import './admin-forms.css';

const ACTIONS = [
  { key: 'customer.inquiry', label: 'Customer inquiry' },
  { key: 'operator.inquiry', label: 'Operator inquiry' },
  { key: 'customer.appointment', label: 'Customer appointment' },
  { key: 'customer.serviceRequest', label: 'Customer service request' },
  { key: 'operator.quotation', label: 'Operator quotation' }
];

const FIELD_TYPES = [
  ['text', 'Short text'], ['textarea', 'Long text'], ['number', 'Number'], ['date', 'Date'],
  ['tel', 'Telephone'], ['email', 'Email'], ['select', 'Dropdown'], ['checkbox', 'Checkbox'],
  ['checkboxGroup', 'Checkbox group'], ['file', 'File'], ['image', 'Image']
];

const DEFAULT_FORM = {
  title: 'Untitled form',
  sections: [{ id: `section_${Date.now()}`, title: 'Customer Information', fields: [] }]
};

const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const isReservedField = (field) => field.reserved === true;
const isMappedField = (field) => Boolean(field.anchorKey);
const isLockedField = (field) => isReservedField(field) || isMappedField(field);
const hasUploadField = (form) => form.sections?.some(section => section.fields?.some(field => ['file', 'image'].includes(field.type)));

export default function AdminForms() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [forms, setForms] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Forms' }
  ];

  const loadData = async (preferredId) => {
    try {
      const { forms: nextForms, assignments: nextAssignments } = await listForms(userToken);
      const activeForms = nextForms.filter(form => form.status !== 'archived');
      setForms(nextForms);
      setAssignments(nextAssignments);
      const selected = activeForms.find(form => form.id === preferredId) || activeForms[0];
      setDraft(selected ? { ...selected } : null);
    } catch (error) {
      addToast(error.message || 'Could not load forms.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userToken) return undefined;
    let cancelled = false;
    listForms(userToken)
      .then(({ forms: nextForms, assignments: nextAssignments }) => {
        if (cancelled) return;
        const activeForms = nextForms.filter(form => form.status !== 'archived');
        setForms(nextForms);
        setAssignments(nextAssignments);
        setDraft(activeForms[0] || null);
      })
      .catch(error => {
        if (!cancelled) addToast(error.message || 'Could not load forms.', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [addToast, userToken]);

  const setField = (sectionId, fieldId, key, value) => {
    setDraft(current => ({
      ...current,
      sections: current.sections.map(section => section.id !== sectionId ? section : {
        ...section,
        fields: section.fields.map(field => field.id !== fieldId ? field : { ...field, [key]: value })
      })
    }));
  };

  const addSection = () => setDraft(current => ({
    ...current,
    sections: [...current.sections, { id: makeId('section'), title: 'New section', fields: [] }]
  }));

  const moveSection = (index, direction) => setDraft(current => {
    const target = index + direction;
    if (target < 0 || target >= current.sections.length) return current;
    const sections = [...current.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    return { ...current, sections };
  });

  const moveField = (sectionId, index, direction) => setDraft(current => ({
    ...current,
    sections: current.sections.map(section => {
      if (section.id !== sectionId) return section;
      const target = index + direction;
      if (target < 0 || target >= section.fields.length) return section;
      const fields = [...section.fields];
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...section, fields };
    })
  }));

  const handleSaveForm = async () => {
    if (!userToken || !draft) return;
    setSaving(true);
    setLoading(true);
    try {
      const saved = draft.id
        ? await updateForm(userToken, draft.id, { title: draft.title, sections: draft.sections })
        : await createForm(userToken, { title: draft.title, sections: draft.sections });
      addToast('Form saved.', 'success');
      await loadData(saved.id);
    } catch (error) {
      addToast(error.message || 'Could not save the form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!userToken || !draft?.id) return;
    if (Object.values(assignments).includes(draft.id)) {
      addToast('Reassign this form before archiving it.', 'error');
      return;
    }
    setSaving(true);
    setLoading(true);
    try {
      await updateForm(userToken, draft.id, { ...draft, status: 'archived' });
      addToast('Form archived.', 'success');
      await loadData();
    } catch (error) {
      addToast(error.message || 'Could not archive the form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToken || !draft?.id) return;
    if (!window.confirm(`Permanently delete “${draft.title}”?`)) return;
    setSaving(true);
    setLoading(true);
    try {
      await deleteForm(userToken, draft.id);
      addToast('Form deleted.', 'success');
      await loadData();
    } catch (error) {
      addToast(error.message || 'Could not delete the form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!userToken) return;
    setSavingAssignments(true);
    try {
      const saved = await saveFormAssignments(userToken, assignments);
      setAssignments(saved);
      addToast('Form assignments updated.', 'success');
    } catch (error) {
      addToast(error.message || 'Could not update form assignments.', 'error');
    } finally {
      setSavingAssignments(false);
    }
  };

  const addField = (sectionId) => setDraft(current => ({
    ...current,
    sections: current.sections.map(section => section.id !== sectionId ? section : {
      ...section,
      fields: [...section.fields, {
        id: makeId('field'), label: 'New field', type: 'text', required: false, placeholder: ''
      }]
    })
  }));

  const removeField = (sectionId, fieldId) => setDraft(current => ({
    ...current,
    sections: current.sections.map(section => section.id !== sectionId ? section : {
      ...section, fields: section.fields.filter(field => field.id !== fieldId)
    })
  }));

  const removeSection = (sectionId) => setDraft(current => ({
    ...current, sections: current.sections.filter(section => section.id !== sectionId || section.fields.some(isLockedField))
  }));

  return (
    <main className="forms-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />
      <PageHeader
        title="Form Management"
        subtitle="Manage reusable forms and workflow assignments"
        illustrationSrc="/pageImages/admin/workflow-templates.png"
        primaryAction={{
          label: 'New Form',
          icon: 'fa-solid fa-plus',
          onClick: () => setDraft({ ...DEFAULT_FORM, id: null, sections: [{ ...DEFAULT_FORM.sections[0], id: makeId('section') }] })
        }}
      />

      <div className="admin-forms-workspace">
        <aside className="forms-library-column">
          <section className="card forms-panel">
            <div className="forms-panel-heading">
              <div><h2>Library</h2><span>{forms.filter(form => form.status !== 'archived').length} active</span></div>
            </div>
            {loading ? <p className="forms-muted">Loading forms...</p> : (
              <div className="forms-library-list">
                {forms.filter(form => form.status !== 'archived').map(form => (
                  <button
                    type="button"
                    key={form.id}
                    className={`forms-library-item ${draft?.id === form.id ? 'is-selected' : ''}`}
                    onClick={() => setDraft({ ...form })}
                  >
                    <span className="forms-library-icon"><FilePlus2 size={17} /></span>
                    <span className="forms-library-copy"><strong>{form.title}</strong><small>{form.sections?.length || 0} sections</small></span>
                  </button>
                ))}
                {!forms.some(form => form.status !== 'archived') && <p className="forms-muted">No forms yet.</p>}
              </div>
            )}
          </section>

          <section className="card forms-panel assignment-panel">
            <div className="forms-panel-heading">
              <div><h2>Action assignments</h2></div>
            </div>
            <div className="forms-assignment-list">
              {ACTIONS.map(action => (
                <label className="forms-assignment-row" key={action.key}>
                  <span>{action.label}</span>
                  <select
                    value={assignments[action.key] || ''}
                    onChange={event => setAssignments(current => ({ ...current, [action.key]: event.target.value || null }))}
                  >
                    <option value="">Use built-in fallback</option>
                    {forms.filter(form => form.status === 'published' && (action.key !== 'operator.quotation' || !hasUploadField(form))).map(form => <option value={form.id} key={form.id}>{form.title}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <button type="button" className="btn btn-secondary forms-assignment-save" onClick={handleSaveAssignments} disabled={savingAssignments}>
              <Save size={16} /> {savingAssignments ? 'Saving...' : 'Save assignments'}
            </button>
          </section>
        </aside>

        <section className="card forms-editor-column">
          {!draft ? (
            <div className="forms-empty-state"><FilePlus2 size={28} /><h2>Select a form</h2></div>
          ) : (
            <>
              <div className="forms-editor-heading">
                <div><h2>{draft.id ? 'Edit form' : 'New form'}</h2></div>
                <div className="forms-editor-actions">
                  {draft.id && <button type="button" className="forms-icon-button" onClick={handleArchive} title="Archive form" aria-label="Archive form" disabled={saving || Object.values(assignments).includes(draft.id)}><Archive size={17} /></button>}
                  {draft.id && !['customer_inquiry', 'operator_inquiry', 'customer_appointment', 'customer_service_request', 'operator_quotation', 'inquiry'].includes(draft.id) && <button type="button" className="forms-icon-button is-danger" onClick={handleDelete} title="Delete form" aria-label="Delete form" disabled={saving}><Trash2 size={17} /></button>}
                  <button type="button" className="btn-primary" onClick={handleSaveForm} disabled={saving || !draft.title.trim()}><Save size={16} /> {saving ? 'Saving...' : 'Save form'}</button>
                </div>
              </div>

              <label className="forms-title-field">
                <span>Form name</span>
                <input value={draft.title} maxLength={120} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} />
              </label>

              <div className="forms-sections-heading">
                <h3>Sections and fields</h3>
                <button type="button" className="btn btn-secondary" onClick={addSection}><Plus size={16} /> Add section</button>
              </div>

              <div className="forms-sections">
                {draft.sections.map((section, sectionIndex) => (
                  <section className="forms-section" key={section.id}>
                    <div className="forms-section-heading">
                      <input aria-label="Section name" value={section.title} disabled={section.fields.some(isReservedField)} onChange={event => setDraft(current => ({
                        ...current,
                        sections: current.sections.map(item => item.id === section.id ? { ...item, title: event.target.value } : item)
                      }))} />
                      <div className="forms-order-actions">
                        <button type="button" aria-label="Move section up" title="Move section up" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0}><ArrowUp size={16} /></button>
                        <button type="button" aria-label="Move section down" title="Move section down" onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === draft.sections.length - 1}><ArrowDown size={16} /></button>
                        <button type="button" aria-label="Remove section" title="Remove section" onClick={() => removeSection(section.id)} className="is-danger" disabled={section.fields.some(isLockedField)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="forms-field-list">
                      {section.fields.map((field, fieldIndex) => (
                        <div className="forms-field-row" key={field.id}>
                          <label><span>Label</span><input value={field.label} disabled={isLockedField(field)} onChange={event => setField(section.id, field.id, 'label', event.target.value)} /></label>
                          <label><span>Type</span><select value={field.type} disabled={isLockedField(field)} onChange={event => setField(section.id, field.id, 'type', event.target.value)}>{FIELD_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                          <label><span>Placeholder</span><input value={field.placeholder || ''} disabled={isLockedField(field)} onChange={event => setField(section.id, field.id, 'placeholder', event.target.value)} /></label>
                          {['select', 'checkboxGroup'].includes(field.type) && <label className="forms-options-field"><span>Options, one per line</span><textarea rows="2" value={(field.options || []).join('\n')} disabled={isLockedField(field)} onChange={event => setField(section.id, field.id, 'options', event.target.value.split('\n').map(option => option.trim()).filter(Boolean))} /></label>}
                          <label className="forms-required-toggle"><input type="checkbox" checked={field.required === true} disabled={isReservedField(field)} onChange={event => setField(section.id, field.id, 'required', event.target.checked)} /><span>{isReservedField(field) ? 'Core' : 'Required'}</span></label>
                          <div className="forms-order-actions forms-field-actions">
                            <button type="button" aria-label="Move field up" title="Move field up" onClick={() => moveField(section.id, fieldIndex, -1)} disabled={fieldIndex === 0}><ArrowUp size={15} /></button>
                            <button type="button" aria-label="Move field down" title="Move field down" onClick={() => moveField(section.id, fieldIndex, 1)} disabled={fieldIndex === section.fields.length - 1}><ArrowDown size={15} /></button>
                            <button type="button" aria-label="Remove field" title={isLockedField(field) ? 'Workflow field cannot be removed' : 'Remove field'} onClick={() => removeField(section.id, field.id)} className="is-danger" disabled={isLockedField(field)}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      ))}
                      {!section.fields.length && <p className="forms-muted forms-no-fields">No fields in this section.</p>}
                    </div>
                    <button type="button" className="forms-add-field" onClick={() => addField(section.id)}><Plus size={15} /> Add field to section</button>
                  </section>
                ))}
                {!draft.sections.length && <p className="forms-muted">Add a section to start building this form.</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}