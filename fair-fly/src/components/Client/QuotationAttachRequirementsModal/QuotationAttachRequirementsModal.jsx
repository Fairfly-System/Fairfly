import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useSubmittedRequirements } from '../../../hooks/useSubmittedRequirements';
import { submitQuotationRequirements } from '../../../services/quotationService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './quotation-attach-requirements-modal.css';

export default function QuotationAttachRequirementsModal({
  isOpen,
  onClose,
  quotation,
  onSuccess
}) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [serviceSchema, setServiceSchema] = useState([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirement Inputs State: { [idx]: { textValue: '', file: File|null, existingFile: Object|null } }
  const [inputs, setInputs] = useState({});

  // 1. Fetch existing submitted requirements if available (only subscribe when modal is open)
  const { requirements: existingSubmitted } = useSubmittedRequirements(
    isOpen ? quotation?.submittedRequirementsId : null
  );

  // 2. Fetch catalog service schema
  useEffect(() => {
    if (!isOpen || !quotation?.serviceId) {
      setServiceSchema([]);
      return;
    }

    let isMounted = true;
    const loadServiceSchema = async () => {
      setLoadingSchema(true);
      try {
        const snap = await getDoc(doc(firestore, 'services', quotation.serviceId));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          const reqs = Array.isArray(data.requirements)
            ? data.requirements
            : (Array.isArray(data.actions) ? data.actions : []);

          const cleanReqs = reqs.filter((r) => {
            const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
            return name !== 'specified requirements of client' &&
                   name !== 'client specified requirements' &&
                   name !== 'specified requirements of the client' &&
                   name !== 'specified requirements';
          });
          setServiceSchema(cleanReqs);
        }
      } catch (err) {
        console.warn('[QuotationAttachRequirementsModal] Schema fetch error:', err);
      } finally {
        if (isMounted) setLoadingSchema(false);
      }
    };

    loadServiceSchema();
    return () => { isMounted = false; };
  }, [isOpen, quotation?.serviceId]);

  // Unified items to present to user
  const requirementItems = useMemo(() => {
    if (!isOpen) return [];

    if (serviceSchema.length > 0) {
      return serviceSchema.map((item, idx) => {
        const name = typeof item === 'string' ? item.trim() : (item.name || item.title || `Requirement ${idx + 1}`).trim();
        const inputType = typeof item === 'object' ? item.inputType || 'text' : 'text';
        const isRequired = typeof item === 'object' ? item.required !== false : true;
        return { name, inputType, required: isRequired };
      });
    }

    const fallbackList = Array.isArray(existingSubmitted) && existingSubmitted.length > 0
      ? existingSubmitted
      : (Array.isArray(quotation?.submittedRequirements) && quotation.submittedRequirements.length > 0
          ? quotation.submittedRequirements
          : (Array.isArray(quotation?.requirements) ? quotation.requirements : []));

    const cleanFallback = fallbackList.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name &&
             name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    return cleanFallback.map((item, idx) => {
      const name = typeof item === 'string' ? item.trim() : (item.name || item.title || `Requirement ${idx + 1}`).trim();
      const inputType = typeof item === 'object' ? item.inputType || 'text' : 'text';
      const isRequired = typeof item === 'object' ? item.required !== false : true;
      return { name, inputType, required: isRequired };
    });
  }, [isOpen, serviceSchema, quotation?.requirements, quotation?.submittedRequirements, existingSubmitted]);

  // Pre-fill inputs when existing submissions or requirementItems change without wiping user selections
  useEffect(() => {
    if (!isOpen) {
      setInputs((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    if (requirementItems.length > 0) {
      setInputs((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        requirementItems.forEach((item, idx) => {
          const matched = (existingSubmitted || []).find((s) => {
            const sName = typeof s === 'string' ? s.trim() : (s?.name || s?.title || '').trim();
            return sName.toLowerCase() === item.name.toLowerCase();
          }) || (Array.isArray(quotation?.submittedRequirements) ? quotation.submittedRequirements.find((s) => {
            const sName = typeof s === 'string' ? s.trim() : (s?.name || s?.title || '').trim();
            return sName.toLowerCase() === item.name.toLowerCase();
          }) : null);

          const existingFile = matched?.file || (matched?.fileUrl ? { url: matched.fileUrl, fileName: matched.fileName } : null);
          const existingText = typeof matched?.value === 'string' ? matched.value : (matched?.textValue || '');

          if (!next[idx]) {
            next[idx] = {
              textValue: existingText,
              file: null,
              existingFile
            };
            hasChanges = true;
          } else {
            const current = next[idx];
            const nextText = current.textValue !== undefined && current.textValue !== '' ? current.textValue : existingText;
            const nextExistingFile = current.existingFile || existingFile;
            if (current.textValue !== nextText || current.existingFile !== nextExistingFile) {
              next[idx] = {
                textValue: nextText,
                file: current.file || null,
                existingFile: nextExistingFile
              };
              hasChanges = true;
            }
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [isOpen, quotation?.id, requirementItems, existingSubmitted, quotation?.submittedRequirements]);

  // Validation: Mandatory fields/files must not be empty
  const isSubmissionValid = useMemo(() => {
    if (requirementItems.length === 0) return true;

    for (let i = 0; i < requirementItems.length; i++) {
      const item = requirementItems[i];
      if (item.required) {
        const state = inputs[i] || {};
        const hasFile = Boolean(state.file || state.existingFile?.url);
        const hasText = Boolean(state.textValue && state.textValue.trim());

        if (item.inputType === 'image' || item.inputType === 'file') {
          if (!hasFile) return false;
        } else {
          if (!hasText && !hasFile) return false;
        }
      }
    }
    return true;
  }, [requirementItems, inputs]);

  const handleFileChange = (idx, file) => {
    if (!file) return;

    // Check size limit: 25MB (matching backend upload limit)
    if (file.size > 25 * 1024 * 1024) {
      addToast('File exceeds 25MB size limit', 'warning');
      const inputEl = document.getElementById(`client-file-${idx}`);
      if (inputEl) inputEl.value = '';
      return;
    }

    setInputs(prev => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || {}),
        file
      }
    }));
  };

  const handleRemoveSelectedFile = (idx) => {
    const inputEl = document.getElementById(`client-file-${idx}`);
    if (inputEl) inputEl.value = '';

    setInputs(prev => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || {}),
        file: null
      }
    }));
  };

  const handleTextChange = (idx, val) => {
    setInputs(prev => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || {}),
        textValue: val
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSubmissionValid) {
      addToast('Please complete all mandatory requirements and upload required files.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const folderRef = quotation?.submittedRequirementsId || `quote_${quotation.id}_${Date.now()}`;
      const targetFolder = `service_requirements/${folderRef}`;

      // Upload newly attached files to Firebase Storage
      const compiledReqs = await Promise.all(
        requirementItems.map(async (item, idx) => {
          const state = inputs[idx] || {};
          let fileMeta = state.existingFile || null;

          if (state.file) {
            try {
              const uploadRes = await uploadFileToBackend(state.file, targetFolder, userToken);
              if (uploadRes?.url) {
                fileMeta = {
                  url: uploadRes.url,
                  fileName: uploadRes.fileName || state.file.name,
                  fileSize: uploadRes.fileSize || state.file.size,
                  storagePath: uploadRes.storagePath || ''
                };
              }
            } catch (upErr) {
              console.error(`Upload error for requirement ${item.name}:`, upErr);
              throw upErr;
            }
          }

          return {
            name: item.name,
            inputType: item.inputType,
            required: item.required,
            value: state.textValue ? state.textValue.trim() : '',
            file: fileMeta
          };
        })
      );

      // Submit requirements to quotation backend route
      submitQuotationRequirements(
        userToken,
        quotation.id,
        compiledReqs,
        (res) => {
          setIsSubmitting(false);
          addToast('Service requirements submitted successfully! The operator will review your documents.', 'success');
          if (onSuccess) onSuccess(res);
          onClose();
        },
        (err) => {
          setIsSubmitting(false);
          console.error('Error submitting quotation requirements:', err);
          addToast(toFriendlyMessage(err, 'Failed to submit requirements. Please try again.'), 'error');
        }
      );
    } catch (err) {
      setIsSubmitting(false);
      console.error('Submission pipeline error:', err);
      addToast(toFriendlyMessage(err, 'File upload or submission failed. Please try again.'), 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <i className="fa-solid fa-file-arrow-up" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>
          <span>Attach Service Requirements</span>
        </div>
      }
      subtitle={`Quotation ${quotation?.quoteNo || ''} · ${quotation?.serviceTitle || 'Service Verification'}`}
      maxWidth="68rem"
      width="95%"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="attach-reqs-form">
        {/* Notice Banner */}
        <div className="attach-reqs-notice">
          <i className="fa-solid fa-circle-info"></i>
          <div>
            <strong>Mandatory Document Verification:</strong>
            <p>
              Please upload all required identification, legal documents, or files for this service. Your quotation can be accepted once the branch operator reviews and approves these requirements.
            </p>
          </div>
        </div>

        {/* Correction Remarks from Operator if changes requested */}
        {(quotation?.requirementsRemarks || quotation?.requirementsRejectionReason) && (
          <div className="attach-reqs-correction-box">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Operator Correction Instructions:</strong>
              <p>{quotation.requirementsRemarks || quotation.requirementsRejectionReason}</p>
            </div>
          </div>
        )}

        {loadingSchema ? (
          <div className="attach-reqs-loading">
            <i className="fa-solid fa-spinner fa-spin"></i> Loading service requirements...
          </div>
        ) : requirementItems.length === 0 ? (
          <div className="attach-reqs-empty">
            <i className="fa-solid fa-check-circle text-green"></i>
            <span>This service does not require mandatory documents. You may proceed directly.</span>
          </div>
        ) : (
          <div className="attach-reqs-list">
            {requirementItems.map((item, idx) => {
              const state = inputs[idx] || {};
              const inputType = item.inputType || 'text';
              const hasExisting = Boolean(state.existingFile?.url);

              return (
                <div key={idx} className={`attach-req-card ${item.required ? 'is-mandatory' : ''}`}>
                  <div className="attach-req-card-header">
                    <span className="attach-req-title">
                      {item.name} {item.required && <span className="req-star">*</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span className="attach-req-badge type">{inputType.toUpperCase()}</span>
                      {item.required ? (
                        <span className="attach-req-badge mandatory">Required</span>
                      ) : (
                        <span className="attach-req-badge optional">Optional</span>
                      )}
                    </div>
                  </div>

                  {/* File / Image Upload Input */}
                  {(inputType === 'image' || inputType === 'file') ? (
                    <div className="attach-req-file-zone">
                      {/* Show currently existing uploaded file */}
                      {hasExisting && !state.file && (
                        <div className="attach-existing-file-pill">
                          <i className="fa-solid fa-file-check text-green"></i>
                          <span className="file-name">{state.existingFile.fileName || 'Attached Document'}</span>
                          <span className="file-tag">Current Attachment</span>
                        </div>
                      )}

                      {/* File selector */}
                      <div className="attach-file-controls">
                        <input
                          type="file"
                          id={`client-file-${idx}`}
                          accept={inputType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,image/*'}
                          className="attach-hidden-file-input"
                          onChange={(e) => handleFileChange(idx, e.target.files[0])}
                          disabled={isSubmitting}
                        />

                        {!state.file ? (
                          <label htmlFor={`client-file-${idx}`} className="btn btn-secondary btn-sm attach-file-btn">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>{hasExisting ? 'Replace Document' : 'Upload Document'}</span>
                          </label>
                        ) : (
                          <div className="attach-new-file-selected">
                            <i className="fa-solid fa-paperclip"></i>
                            <span className="file-name-txt" title={state.file.name}>{state.file.name}</span>
                            <span className="file-size-txt">({(state.file.size / 1024).toFixed(0)} KB)</span>
                            <label htmlFor={`client-file-${idx}`} className="attach-change-file-btn" title="Choose a different file">
                              <i className="fa-solid fa-pen"></i> Change
                            </label>
                            <button
                              type="button"
                              className="attach-remove-file-btn"
                              onClick={() => handleRemoveSelectedFile(idx)}
                              title="Remove selected file"
                              disabled={isSubmitting}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Text / Number / Date inputs */
                    <input
                      type={inputType === 'date' ? 'date' : inputType === 'number' ? 'number' : 'text'}
                      className="form-input"
                      placeholder={`Enter ${item.name}...`}
                      value={state.textValue || ''}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
                      required={item.required}
                      disabled={isSubmitting}
                      style={{ borderRadius: '0px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="attach-reqs-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !isSubmissionValid}
            style={{
              background: isSubmissionValid ? 'var(--brand-primary, #6366f1)' : '#94a3b8',
              borderColor: isSubmissionValid ? 'var(--brand-primary, #6366f1)' : '#94a3b8',
              cursor: isSubmissionValid ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Uploading & Submitting...</>
            ) : (
              <><i className="fa-solid fa-paper-plane"></i> Submit Requirements for Review</>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
