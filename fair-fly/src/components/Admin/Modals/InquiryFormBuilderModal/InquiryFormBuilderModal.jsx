import React, { useState, useEffect } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../../context/AuthContext';
import { useToast } from '../../../UI/toast/ToastProvider';
import { fetchInquirySchema, saveInquirySchema } from '../../../../services/inquiryService';
import toFriendlyMessage from '../../../../utils/friendlyErrors';
import './inquiry-form-builder.css';

export default function InquiryFormBuilderModal({ isOpen, onClose }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetchInquirySchema(
      (data) => {
        setIsLoading(false);
        if (data) {
          // Ensure we have custom section
          const sections = data.sections || [];
          const hasCustom = sections.some(s => s.id === 'custom_fields');
          if (!hasCustom) {
            sections.splice(1, 0, {
              id: 'custom_fields',
              title: 'Custom Intake Specifications',
              fields: []
            });
          }
          setSchema({ ...data, sections });
        }
      },
      (err) => {
        setIsLoading(false);
        console.error('Error fetching inquiry schema:', err);
      },
      setIsLoading
    );
  }, [isOpen]);

  const handleAddField = (sectionId) => {
    const fieldKey = `custom_${Date.now()}`;
    const newField = {
      id: fieldKey,
      label: 'New Custom Field',
      placeholder: 'Enter details...',
      type: 'text',
      required: false,
      isCustom: true
    };

    setSchema(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === sectionId) {
            return { ...s, fields: [...(s.fields || []), newField] };
          }
          return s;
        })
      };
    });
  };

  const handleRemoveField = (sectionId, fieldId) => {
    setSchema(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === sectionId) {
            return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
          }
          return s;
        })
      };
    });
  };

  const handleFieldChange = (sectionId, fieldId, property, value) => {
    setSchema(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              fields: s.fields.map(f => {
                if (f.id === fieldId) {
                  return { ...f, [property]: value };
                }
                return f;
              })
            };
          }
          return s;
        })
      };
    });
  };

  const handleSave = () => {
    if (!schema) return;
    setIsSaving(true);

    saveInquirySchema(
      userToken,
      { title: schema.title, sections: schema.sections },
      (res) => {
        setIsSaving(false);
        addToast('Inquiry form schema saved successfully! Operator forms updated.', 'success');
        onClose();
      },
      (err) => {
        setIsSaving(false);
        addToast(toFriendlyMessage(err, 'Failed to save form schema'), 'error');
      },
      setIsSaving
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="56rem"
      title="Dynamic Inquiry Form Builder"
      subtitle="Customize inquiry intake form fields and schema for all branches"
      isLoading={isLoading || isSaving}
    >
      <div className="ifb-modal-body">
        <div className="ifb-notice-bar">
          <i className="fa-solid fa-circle-info" style={{ marginTop: '0.15rem' }}></i>
          <div>
            <strong>Dynamic Form Engine:</strong> Changes made here will dynamically adjust the Operator Inquiry Intake forms across all branches in real-time. Core anchor fields (Client Name, Cellphone, Address) remain preserved for database integrity.
          </div>
        </div>

        {schema?.sections?.map((section) => {
          const isAnchorSection = section.id === 'client_info' || section.id === 'signatures';

          return (
            <div key={section.id} className="ifb-section-card">
              <div className="ifb-section-header">
                <h3 className="ifb-section-title">
                  <i className={`fa-solid ${isAnchorSection ? 'fa-lock' : 'fa-sliders'}`}></i>
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
                    className="ifb-btn-add-field"
                    onClick={() => handleAddField(section.id)}
                  >
                    <i className="fa-solid fa-plus"></i> Add New Field
                  </button>
                )}
              </div>

              <div className="ifb-fields-list">
                {section.fields?.map((field) => (
                  <div key={field.id} className="ifb-field-row">
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Field Label</label>
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => handleFieldChange(section.id, field.id, 'label', e.target.value)}
                        disabled={isAnchorSection}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Placeholder Text</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldChange(section.id, field.id, 'placeholder', e.target.value)}
                        disabled={isAnchorSection}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Input Type</label>
                      <select
                        value={field.type || 'text'}
                        onChange={(e) => handleFieldChange(section.id, field.id, 'type', e.target.value)}
                        disabled={isAnchorSection}
                      >
                        <option value="text">Single-line Text</option>
                        <option value="textarea">Multi-line Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="tel">Telephone / Mobile</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Validation</label>
                      <label className="ifb-toggle-label">
                        <input
                          type="checkbox"
                          checked={field.required === true}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'required', e.target.checked)}
                          disabled={isAnchorSection}
                        />
                        <span>Required</span>
                      </label>
                    </div>

                    {!isAnchorSection ? (
                      <button
                        type="button"
                        className="ifb-btn-icon-danger"
                        onClick={() => handleRemoveField(section.id, field.id)}
                        title="Remove field"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    ) : (
                      <i className="fa-solid fa-shield" style={{ color: '#94a3b8', fontSize: '0.875rem' }} title="Protected core field"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="ifb-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ background: 'var(--purple, #7c3aed)' }}
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Saving Schema...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Save Form Layout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
