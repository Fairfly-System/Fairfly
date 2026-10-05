import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useSubmittedRequirements } from '../../../hooks/useSubmittedRequirements';
import { reviewQuotationRequirements, submitQuotationRequirements } from '../../../services/quotationService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import { useLightbox, isImageUrl } from '../../UI/ImageLightbox/ImageLightbox';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './quotation-requirements-review.css';

export default function QuotationRequirementsReview({
  quotation,
  onReviewUpdated,
  isFinalized = false
}) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const { openLightbox } = useLightbox();

  // 1. Fetch catalog service schema to know required items
  const [serviceSchema, setServiceSchema] = useState([]);
  const [loadingService, setLoadingService] = useState(false);

  useEffect(() => {
    if (!quotation?.serviceId) {
      setServiceSchema([]);
      return;
    }

    let isMounted = true;
    const fetchCatalogService = async () => {
      setLoadingService(true);
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
        console.warn('[QuotationRequirementsReview] Catalog service fetch error:', err);
      } finally {
        if (isMounted) setLoadingService(false);
      }
    };

    fetchCatalogService();
    return () => { isMounted = false; };
  }, [quotation?.serviceId]);

  // 2. Fetch submitted requirements record via single-document hook
  const { requirements: submittedItems, loading: loadingSubmitted } = useSubmittedRequirements(
    quotation?.submittedRequirementsId
  );

  // 3. Modals and action states
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Walk-in requirements intake modal
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinInputs, setWalkinInputs] = useState({});
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);

  // Compile unified requirements checklist
  const mergedList = React.useMemo(() => {
    // If we have a catalog service schema, use that as the authoritative master list
    if (serviceSchema.length > 0) {
      return serviceSchema.map((item, idx) => {
        const schemaName = typeof item === 'string' ? item.trim() : (item.name || item.title || `Requirement ${idx + 1}`).trim();
        const inputType = typeof item === 'object' ? item.inputType || 'text' : 'text';
        const isRequired = typeof item === 'object' ? item.required !== false : true;

        // Look for matching submission in submittedItems
        const matched = submittedItems.find((s) => {
          const sName = typeof s === 'string' ? s.trim() : (s?.name || s?.title || '').trim();
          return sName.toLowerCase() === schemaName.toLowerCase();
        });

        const file = matched?.file || (matched?.fileUrl ? { url: matched.fileUrl, fileName: matched.fileName } : null);
        const value = matched?.value !== undefined ? matched.value : (matched?.textValue || '');

        return {
          id: matched?.id || `req_schema_${idx}`,
          name: schemaName,
          inputType,
          required: isRequired,
          file,
          value,
          isSubmitted: Boolean(file?.url || (typeof value === 'string' && value.trim()))
        };
      });
    }

    // Fallback: If no service schema found, display whatever was submitted directly
    return submittedItems.map((item, idx) => {
      const name = typeof item === 'string' ? item.trim() : (item?.name || item?.title || `Requirement ${idx + 1}`).trim();
      const inputType = typeof item === 'object' ? item.inputType || 'text' : 'text';
      const isRequired = typeof item === 'object' ? item.required !== false : true;
      const file = item?.file || (item?.fileUrl ? { url: item.fileUrl, fileName: item.fileName } : null);
      const value = item?.value !== undefined ? item.value : (item?.textValue || '');

      return {
        id: item?.id || `req_sub_${idx}`,
        name,
        inputType,
        required: isRequired,
        file,
        value,
        isSubmitted: Boolean(file?.url || (typeof value === 'string' && value.trim()))
      };
    });
  }, [serviceSchema, submittedItems]);

  const mandatoryPendingCount = React.useMemo(() => {
    return mergedList.filter(item => item.required && !item.isSubmitted).length;
  }, [mergedList]);

  // Status computation
  const reqStatus = quotation?.requirementsStatus || (mergedList.length === 0 ? 'not_required' : 'pending');

  // --- ACTIONS ---

  // 1. Approve Requirements
  const handleApprove = () => {
    if (!quotation?.id) return;
    if (mandatoryPendingCount > 0) {
      addToast('Cannot approve: There are mandatory requirements that have not yet been submitted or verified.', 'warning');
      return;
    }

    setIsApproving(true);
    reviewQuotationRequirements(
      userToken,
      quotation.id,
      { action: 'approve' },
      (res) => {
        setIsApproving(false);
        addToast('Requirements approved! Client is now authorized to accept the quotation.', 'success');
        if (onReviewUpdated) onReviewUpdated(res);
      },
      (err) => {
        setIsApproving(false);
        console.error('Error approving requirements:', err);
        addToast(toFriendlyMessage(err, 'Failed to approve requirements. Please try again.'), 'error');
      }
    );
  };

  // 2. Request Changes / Reject
  const handleConfirmRequestChanges = () => {
    if (!rejectionRemarks.trim()) {
      addToast('Please provide instructions on what the client needs to correct', 'warning');
      return;
    }

    setIsRejecting(true);
    reviewQuotationRequirements(
      userToken,
      quotation.id,
      { action: 'request_changes', remarks: rejectionRemarks.trim() },
      (res) => {
        setIsRejecting(false);
        setShowRejectModal(false);
        setRejectionRemarks('');
        addToast('Correction requested. Client has been notified to update their requirements.', 'info');
        if (onReviewUpdated) onReviewUpdated(res);
      },
      (err) => {
        setIsRejecting(false);
        console.error('Error requesting changes:', err);
        addToast(toFriendlyMessage(err, 'Failed to request changes. Please try again.'), 'error');
      }
    );
  };

  // 3. Walk-in Intake Handlers
  const handleOpenWalkinModal = () => {
    // Prepopulate inputs with any existing values
    const initialMap = {};
    mergedList.forEach((item, idx) => {
      initialMap[idx] = {
        textValue: typeof item.value === 'string' ? item.value : '',
        file: null,
        existingFile: item.file || null
      };
    });
    setWalkinInputs(initialMap);
    setShowWalkinModal(true);
  };

  const handleWalkinFileChange = (idx, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit', 'warning');
      return;
    }
    setWalkinInputs(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), file }
    }));
  };

  const handleWalkinTextChange = (idx, val) => {
    setWalkinInputs(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), textValue: val }
    }));
  };

  const handleSaveWalkinRequirements = async () => {
    setIsSubmittingWalkin(true);

    try {
      const compiledReqs = await Promise.all(
        mergedList.map(async (item, idx) => {
          const state = walkinInputs[idx] || {};
          let fileMeta = state.existingFile || null;

          if (state.file) {
            try {
              const targetFolder = `service_requirements/${quotation.submittedRequirementsId || ('operator_' + Date.now())}`;
              const upRes = await uploadFileToBackend(state.file, targetFolder, userToken);
              if (upRes?.url) {
                fileMeta = {
                  url: upRes.url,
                  fileName: upRes.fileName || state.file.name,
                  fileSize: upRes.fileSize || state.file.size,
                  storagePath: upRes.storagePath || ''
                };
              }
            } catch (upErr) {
              console.error(`Error uploading walk-in requirement file for ${item.name}:`, upErr);
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

      submitQuotationRequirements(
        userToken,
        quotation.id,
        compiledReqs,
        (res) => {
          setIsSubmittingWalkin(false);
          setShowWalkinModal(false);
          addToast('Service requirements completed on-site! You may now review and approve them.', 'success');
          if (onReviewUpdated) onReviewUpdated(res);
        },
        (err) => {
          setIsSubmittingWalkin(false);
          console.error('Error submitting walk-in requirements:', err);
          addToast(toFriendlyMessage(err, 'Failed to save walk-in requirements.'), 'error');
        }
      );
    } catch (err) {
      setIsSubmittingWalkin(false);
      console.error('Error in handleSaveWalkinRequirements:', err);
      addToast(toFriendlyMessage(err, 'Could not complete walk-in requirements intake.'), 'error');
    }
  };

  return (
    <article className="card detail-panel quotation-reqs-review-panel">
      {/* Header */}
      <div className="quotation-reqs-header">
        <div className="quotation-reqs-title-group">
          <h2 className="panel-title quotation-reqs-title">
            <i className="fa-solid fa-file-shield"></i>
            <span>Service Requirements & Legal Document Verification</span>
          </h2>
          <span className="quotation-reqs-count">
            {mergedList.length} Requirement{mergedList.length !== 1 ? 's' : ''} Configured
          </span>
        </div>

        {/* Dynamic Status Badges */}
        <div className="quotation-reqs-badge-wrap">
          {reqStatus === 'approved' && (
            <span className="quotation-req-status-badge status-approved">
              <i className="fa-solid fa-circle-check"></i> Requirements Approved
            </span>
          )}
          {reqStatus === 'submitted' && (
            <span className="quotation-req-status-badge status-submitted">
              <i className="fa-solid fa-clock-rotate-left"></i> Submitted · Ready for Review
            </span>
          )}
          {reqStatus === 'changes_requested' && (
            <span className="quotation-req-status-badge status-changes">
              <i className="fa-solid fa-triangle-exclamation"></i> Corrections Requested
            </span>
          )}
          {reqStatus === 'not_required' && (
            <span className="quotation-req-status-badge status-neutral">
              <i className="fa-solid fa-circle-info"></i> No Documents Required
            </span>
          )}
          {reqStatus === 'pending' && (
            <span className="quotation-req-status-badge status-pending">
              <i className="fa-solid fa-hourglass-half"></i> Awaiting Client Submission
            </span>
          )}
        </div>
      </div>

      {/* Operator Rejection / Correction Callout */}
      {(quotation?.requirementsRemarks || quotation?.requirementsRejectionReason) && reqStatus === 'changes_requested' && (
        <div className="quotation-reqs-rejection-callout">
          <div className="rejection-callout-icon">
            <i className="fa-solid fa-comment-dots"></i>
          </div>
          <div className="rejection-callout-body">
            <strong>Requested Corrections / Remarks:</strong>
            <p>{quotation.requirementsRemarks || quotation.requirementsRejectionReason}</p>
          </div>
        </div>
      )}

      {/* Approval Metadata Callout */}
      {reqStatus === 'approved' && (
        <div className="quotation-reqs-approved-callout">
          <i className="fa-solid fa-shield-check"></i>
          <span>
            Verified and approved by {quotation.requirementsApprovedBy || 'Operator'}{' '}
            {quotation.requirementsApprovedAt ? `on ${new Date(quotation.requirementsApprovedAt).toLocaleString()}` : ''}. Client is authorized to accept quotation.
          </span>
        </div>
      )}

      {/* Loading state */}
      {(loadingService || loadingSubmitted) && (
        <div className="quotation-reqs-loading">
          <i className="fa-solid fa-spinner fa-spin"></i> Loading requirements checklist...
        </div>
      )}

      {/* Requirements Items List */}
      {!loadingService && !loadingSubmitted && (
        <div className="quotation-reqs-list">
          {mergedList.length === 0 ? (
            <div className="quotation-reqs-empty">
              <i className="fa-solid fa-circle-info"></i>
              <span>This service does not require mandatory legal or document submissions.</span>
            </div>
          ) : (
            mergedList.map((item, idx) => {
              const fileUrl = item.file?.url;
              const fileName = item.file?.fileName || 'Attached File';
              const fileSize = item.file?.fileSize;
              const isImg = isImageUrl(fileUrl, fileName);

              return (
                <div key={item.id} className={`quotation-req-item-card ${item.isSubmitted ? 'is-complete' : 'is-pending'}`}>
                  <div className="quotation-req-item-left">
                    <div className="quotation-req-item-indicator">
                      {item.isSubmitted ? (
                        <i className="fa-solid fa-circle-check text-green"></i>
                      ) : item.required ? (
                        <i className="fa-solid fa-circle-exclamation text-amber"></i>
                      ) : (
                        <i className="fa-regular fa-circle text-muted"></i>
                      )}
                    </div>
                    <div>
                      <div className="quotation-req-item-name-row">
                        <span className="quotation-req-item-name">{item.name}</span>
                        {item.required ? (
                          <span className="req-pill req-pill-mandatory">Required</span>
                        ) : (
                          <span className="req-pill req-pill-optional">Optional</span>
                        )}
                        <span className="req-pill req-pill-type">{item.inputType.toUpperCase()}</span>
                      </div>

                      {/* Text value if available */}
                      {item.value && (
                        <div className="quotation-req-text-value">
                          <span>Value: </span><strong>{item.value}</strong>
                        </div>
                      )}

                      {!item.isSubmitted && (
                        <span className="quotation-req-missing-text">
                          <i className="fa-regular fa-clock"></i> Not submitted yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: File attachments / previews */}
                  <div className="quotation-req-item-right">
                    {fileUrl ? (
                      <div className="quotation-req-file-pill">
                        {isImg ? (
                          <button
                            type="button"
                            className="quotation-req-view-btn image-view"
                            onClick={() => openLightbox({
                              url: fileUrl,
                              title: fileName,
                              subtitle: `Quotation Requirement · ${quotation.clientName || 'Client'}`
                            })}
                          >
                            <i className="fa-regular fa-image"></i>
                            <span className="file-name-truncate">{fileName}</span>
                            {fileSize && <span className="file-size">({(fileSize / 1024 / 1024).toFixed(2)} MB)</span>}
                          </button>
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="quotation-req-view-btn doc-view"
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span className="file-name-truncate">{fileName}</span>
                            {fileSize && <span className="file-size">({(fileSize / 1024 / 1024).toFixed(2)} MB)</span>}
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Operator Review & Action Toolbar */}
      {!isFinalized && mergedList.length > 0 && reqStatus !== 'approved' && reqStatus !== 'not_required' && (
        <div className="quotation-reqs-actions-toolbar">
          <div className="toolbar-left-info">
            {mandatoryPendingCount > 0 ? (
              <span className="toolbar-warning">
                <i className="fa-solid fa-triangle-exclamation"></i> {mandatoryPendingCount} mandatory requirement{mandatoryPendingCount !== 1 ? 's' : ''} pending.
              </span>
            ) : (
              <span className="toolbar-ready">
                <i className="fa-solid fa-check-double"></i> All mandatory requirements submitted. Ready for verification.
              </span>
            )}
          </div>

          <div className="toolbar-buttons">
            {/* Walk-in on-site completion button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenWalkinModal}
              disabled={isApproving || isRejecting}
              title="Complete or upload documents for walk-in client on-site"
            >
              <i className="fa-solid fa-pen-nib"></i> Complete on Site (Walk-in)
            </button>

            {/* Request changes */}
            {reqStatus !== 'changes_requested' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-warn-outline"
                onClick={() => setShowRejectModal(true)}
                disabled={isApproving || isRejecting}
              >
                <i className="fa-solid fa-arrow-rotate-left"></i> Request Corrections
              </button>
            )}

            {/* Approve requirements */}
            <button
              type="button"
              className="btn btn-primary btn-sm btn-approve"
              onClick={handleApprove}
              disabled={isApproving || isRejecting || mandatoryPendingCount > 0}
              style={{ background: mandatoryPendingCount > 0 ? '#94a3b8' : 'var(--green, #16a34a)', borderColor: mandatoryPendingCount > 0 ? '#94a3b8' : 'var(--green, #16a34a)' }}
            >
              {isApproving ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Approving...</>
              ) : (
                <><i className="fa-solid fa-circle-check"></i> Approve Requirements</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reject / Request Changes Modal */}
      {showRejectModal && (
        <BaseModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Request Requirements Correction</span>
            </div>
          }
          subtitle={`Quotation ${quotation?.quoteNo || ''} · Notify client of incomplete or invalid documents`}
          maxWidth="40rem"
          isLoading={isRejecting}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
              Instructions / Reason for Correction *
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="e.g. The uploaded passport copy is blurry. Please provide a clear, full-page scan or photo of the bio page."
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              style={{ width: '100%', borderRadius: '0px' }}
              disabled={isRejecting}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmRequestChanges}
                disabled={isRejecting || !rejectionRemarks.trim()}
              >
                {isRejecting ? 'Sending...' : 'Send Correction Notice'}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Walk-in Client On-Site Intake Modal */}
      {showWalkinModal && (
        <BaseModal
          isOpen={showWalkinModal}
          onClose={() => !isSubmittingWalkin && setShowWalkinModal(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-person-walking"></i>
              <span>Complete Requirements on Site (Walk-in Client)</span>
            </div>
          }
          subtitle={`Quotation ${quotation?.quoteNo || ''} · ${quotation?.clientName || 'Client'}`}
          maxWidth="68rem"
          width="95%"
          isLoading={isSubmittingWalkin}
        >
          <div className="walkin-req-modal-content">
            <p className="walkin-req-modal-desc">
              Upload physical document scans or enter verified values directly on behalf of the walk-in client.
            </p>

            <div className="walkin-req-list">
              {mergedList.map((item, idx) => {
                const inputState = walkinInputs[idx] || {};
                const inputType = item.inputType || 'text';

                return (
                  <div key={idx} className="walkin-req-card">
                    <div className="walkin-req-header">
                      <span className="walkin-req-name">
                        {item.name} {item.required && <span className="req-star">*</span>}
                      </span>
                      <span className="req-pill req-pill-type">{inputType.toUpperCase()}</span>
                    </div>

                    {(inputType === 'image' || inputType === 'file') ? (
                      <div className="walkin-file-row">
                        {inputState.existingFile?.url && !inputState.file && (
                          <div className="walkin-existing-file">
                            <i className="fa-solid fa-file-circle-check text-green"></i>
                            <span>Attached: <strong>{inputState.existingFile.fileName || 'Document'}</strong></span>
                          </div>
                        )}

                        <div className="walkin-upload-input-wrap">
                          <input
                            type="file"
                            id={`walkin-file-${idx}`}
                            accept={inputType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx'}
                            className="walkin-hidden-input"
                            onChange={(e) => handleWalkinFileChange(idx, e.target.files[0])}
                            disabled={isSubmittingWalkin}
                          />
                          <label htmlFor={`walkin-file-${idx}`} className="btn btn-secondary btn-sm">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>{inputState.file ? inputState.file.name : 'Choose File to Upload'}</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={inputType === 'date' ? 'date' : inputType === 'number' ? 'number' : 'text'}
                        className="form-input"
                        placeholder={`Enter ${item.name}...`}
                        value={inputState.textValue || ''}
                        onChange={(e) => handleWalkinTextChange(idx, e.target.value)}
                        disabled={isSubmittingWalkin}
                        style={{ borderRadius: '0px' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="walkin-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowWalkinModal(false)}
                disabled={isSubmittingWalkin}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveWalkinRequirements}
                disabled={isSubmittingWalkin}
                style={{ background: 'var(--brand-primary, #6366f1)' }}
              >
                {isSubmittingWalkin ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Saving Requirements...</>
                ) : (
                  <><i className="fa-solid fa-floppy-disk"></i> Save Walk-in Requirements</>
                )}
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </article>
  );
}
