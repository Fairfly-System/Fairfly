import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../../context/AuthContext';
import { useToast } from '../../../UI/toast/ToastProvider';
import {
  fetchFranchiseApplicationSchema,
  saveFranchiseApplicationSchema,
} from '../../../../services/franchiseService';
import toFriendlyMessage from '../../../../utils/friendlyErrors';
import './franchise-application-form-builder.css';

const STABLE_FIELD_IDS = new Set([
  'fullName',
  'firstName',
  'middleInitial',
  'lastName',
  'phoneNumber',
  'email',
  'preferredBranchLocation',
  'province',
  'municipality',
  'barangay',
  'building',
  'businessExperience',
  'investmentCapacity',
  'preferredMeetingDate',
  'preferredMeetingTime',
  'additionalMessage',
]);

const isStableField = (field) => (
  field.isCore === true ||
  field.isStable === true ||
  STABLE_FIELD_IDS.has(field.id) ||
  STABLE_FIELD_IDS.has(field.key) ||
  STABLE_FIELD_IDS.has(field.name)
);

const DEFAULT_SECTIONS = [
  {
    id: 'applicant_info',
    title: 'Applicant Information',
    fields: [
      { id: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
      { id: 'middleInitial', label: 'Middle Initial', type: 'text', required: false, placeholder: 'M.I.' },
      { id: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'email@example.com' },
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true, placeholder: '+63 912 345 6789' }
    ]
  },
  {
    id: 'preferred_location',
    title: 'Preferred Branch Location',
    fields: [
      { id: 'province', label: 'Province', type: 'text', required: true, placeholder: 'Select province' },
      { id: 'municipality', label: 'Municipality / City', type: 'text', required: true, placeholder: 'Select municipality' },
      { id: 'barangay', label: 'Barangay', type: 'text', required: true, placeholder: 'Select barangay' },
      { id: 'building', label: 'Building / Street', type: 'text', required: false, placeholder: 'Building / House No. / Street' }
    ]
  },
  {
    id: 'business_background',
    title: 'Business Background & Meeting Preference',
    fields: [
      { id: 'businessExperience', label: 'Business Experience', type: 'text', required: true, placeholder: 'Experience level' },
      { id: 'investmentCapacity', label: 'Investment Capacity', type: 'text', required: true, placeholder: 'Investment range' },
      { id: 'preferredMeetingDate', label: 'Preferred Meeting Date', type: 'date', required: true },
      { id: 'preferredMeetingTime', label: 'Preferred Meeting Time', type: 'text', required: true },
      { id: 'additionalMessage', label: 'Additional Information', type: 'textarea', required: false, placeholder: 'Tell us more about your background...' }
    ]
  },
  {
    id: 'custom_fields',
    title: 'Custom Franchise Specifications',
    fields: []
  }
];

function normalizeSchema(data) {
  const schema = data?.schema || data?.applicationSchema || data || {};
  let sections = Array.isArray(schema.sections) && schema.sections.length > 0
    ? [...schema.sections]
    : DEFAULT_SECTIONS.map((s) => ({ ...s, fields: [...s.fields] }));

  if (!sections.some((s) => s.id === 'custom_fields')) {
    sections.push({
      id: 'custom_fields',
      title: 'Custom Franchise Specifications',
      fields: []
    });
  }

  return {
    title: schema.title || 'FairFly Franchise Application Form',
    sections
  };
}

export default function FranchiseApplicationFormBuilderModal({ isOpen, onClose }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSchema = useCallback((isCurrent = () => true) => {
    fetchFranchiseApplicationSchema(
      userToken,
      (data) => {
        try {
          const loadedSchema = normalizeSchema(data);
          if (!isCurrent()) return;
          setSchema(loadedSchema);
          setErrorMessage('');
        } catch (error) {
          console.error('Invalid franchise application schema:', error);
          if (isCurrent()) {
            setErrorMessage(toFriendlyMessage(error, 'Could not load the application form.'));
          }
        }
      },
      (error) => {
        console.error('Error fetching franchise application schema:', error);
        if (isCurrent()) {
          setSchema(normalizeSchema(null));
        }
      },
      (loading) => {
        if (isCurrent()) setIsLoading(loading);
      }
    );
  }, [userToken]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let isCurrent = true;
    const timeout = window.setTimeout(() => loadSchema(() => isCurrent), 0);
    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [isOpen, loadSchema]);

  const handleAddField = (sectionId) => {
    const newField = {
      id: `custom_${uuidv4()}`,
      label: 'New Custom Field',
      placeholder: 'Enter details...',
      type: 'text',
      required: false,
      isCustom: true,
    };

    setSchema((current) => current && ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId
          ? { ...section, fields: [...(section.fields || []), newField] }
          : section
      )),
    }));
  };

  const handleFieldChange = (sectionId, fieldId, property, value) => {
    setSchema((current) => current && ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId
          ? {
            ...section,
            fields: (section.fields || []).map((field) => (
              field.id === fieldId && !isStableField(field)
                ? { ...field, [property]: value }
                : field
            )),
          }
          : section
      )),
    }));
  };

  const handleRemoveField = (sectionId, fieldId) => {
    setSchema((current) => current && ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId
          ? {
            ...section,
            fields: (section.fields || []).filter(
              (field) => field.id !== fieldId || isStableField(field)
            ),
          }
          : section
      )),
    }));
  };

  const handleSave = () => {
    if (!schema) return;
    setErrorMessage('');
    saveFranchiseApplicationSchema(
      userToken,
      { title: schema.title, sections: schema.sections },
      () => {
        addToast('Franchise application form saved successfully.', 'success');
        onClose();
      },
      (error) => {
        console.error('Error saving franchise application schema:', error);
        setErrorMessage(toFriendlyMessage(error, 'Could not save the application form.'));
      },
      setIsSaving
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="76rem"
      width="96%"
      title="Edit Franchise Application Form"
      subtitle="Customize the fields shown on the franchise application form"
      isLoading={isLoading || isSaving}
    >
      <div className="fab-modal-body" aria-busy={isLoading || isSaving}>
        <div className="fab-notice" role="note">
          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
          <p>
            Standard applicant and application fields are protected for reliable
            application processing. You can add and edit custom fields under Custom Specifications.
          </p>
        </div>

        {errorMessage && (
          <div className="fab-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
            <span>{errorMessage}</span>
            {!schema && !isLoading && (
              <button
                type="button"
                className="fab-retry"
                onClick={() => {
                  setErrorMessage('');
                  loadSchema();
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {isLoading && !schema && (
          <div className="fab-status" role="status">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            <span>Loading application form...</span>
          </div>
        )}

        {schema && (
          <>
            {schema.sections.map((section) => {
              const isAnchorSection =
                section.id === 'applicant_info' ||
                section.id === 'preferred_location' ||
                section.id === 'business_background';

              return (
                <section className="fab-section" key={section.id}>
                  <header className="fab-section-header">
                    <h3>
                      <i className={`fa-solid ${isAnchorSection ? 'fa-lock' : 'fa-sliders'}`} aria-hidden="true"></i>
                      <span>{section.title}</span>
                      {isAnchorSection && (
                        <span style={{ fontSize: '0.675rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '0.25rem' }}>
                          Standard Core Fields
                        </span>
                      )}
                    </h3>
                    {!isAnchorSection && (
                      <button
                        type="button"
                        className="fab-add-field"
                        onClick={() => handleAddField(section.id)}
                        disabled={isSaving}
                      >
                        <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        Add New Field
                      </button>
                    )}
                  </header>

                  {(section.fields || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.25rem', color: '#64748b', background: '#f8fafc', borderRadius: '0.375rem', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem' }}>No custom fields added yet.</p>
                      <button
                        type="button"
                        className="fab-add-field"
                        onClick={() => handleAddField(section.id)}
                        disabled={isSaving}
                      >
                        <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        Add First Custom Field
                      </button>
                    </div>
                  ) : (
                    <div className="fab-fields">
                      {(section.fields || []).map((field) => {
                        const isProtected = isAnchorSection || isStableField(field);
                        return (
                          <div className="fab-field-row" key={field.id}>
                            <div className="fab-field-control">
                              <label htmlFor={`${section.id}-${field.id}-label`}>Field label</label>
                              <input
                                id={`${section.id}-${field.id}-label`}
                                type="text"
                                value={field.label || ''}
                                onChange={(event) => handleFieldChange(section.id, field.id, 'label', event.target.value)}
                                disabled={isProtected || isSaving}
                              />
                            </div>
                            <div className="fab-field-control">
                              <label htmlFor={`${section.id}-${field.id}-placeholder`}>Placeholder</label>
                              <input
                                id={`${section.id}-${field.id}-placeholder`}
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(event) => handleFieldChange(section.id, field.id, 'placeholder', event.target.value)}
                                disabled={isProtected || isSaving}
                              />
                            </div>
                            <div className="fab-field-control">
                              <label htmlFor={`${section.id}-${field.id}-type`}>Input type</label>
                              <select
                                id={`${section.id}-${field.id}-type`}
                                value={field.type || 'text'}
                                onChange={(event) => handleFieldChange(section.id, field.id, 'type', event.target.value)}
                                disabled={isProtected || isSaving}
                              >
                                <option value="text">Single-line text</option>
                                <option value="textarea">Multi-line text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="tel">Telephone / mobile</option>
                                <option value="email">Email</option>
                              </select>
                            </div>
                            <label className="fab-required">
                              <input
                                type="checkbox"
                                checked={field.required === true}
                                onChange={(event) => handleFieldChange(section.id, field.id, 'required', event.target.checked)}
                                disabled={isProtected || isSaving}
                              />
                              Required
                            </label>
                            {isProtected ? (
                              <span className="fab-protected" title="Protected core field">
                                <i className="fa-solid fa-shield" style={{ color: '#94a3b8', fontSize: '0.875rem' }} aria-hidden="true"></i>
                                <span className="fab-visually-hidden">Protected core field</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="fab-remove-field"
                                onClick={() => handleRemoveField(section.id, field.id)}
                                disabled={isSaving}
                                aria-label={`Remove ${field.label || 'custom field'}`}
                                title="Remove field"
                              >
                                <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}

            <footer className="fab-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary fab-save"
                onClick={handleSave}
                disabled={isLoading || isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                    Save Form
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </div>
    </BaseModal>
  );
}
