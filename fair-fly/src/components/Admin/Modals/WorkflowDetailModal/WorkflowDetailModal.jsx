import React from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { useLightbox, isImageUrl } from '../../../UI/ImageLightbox/ImageLightbox';
import { usePdfModal, isPdfUrl } from '../../../Shared/PdfDocument/PdfDocumentView';
import './workflow-detail-modal.css';

function formatDate(val) {
  if (!val) return 'N/A';
  const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getFileIcon(fileName = '', url = '') {
  if (isPdfUrl(url, fileName)) return 'fa-solid fa-file-pdf';
  if (isImageUrl(url, fileName)) return 'fa-solid fa-file-image';
  const lower = (fileName || url || '').toLowerCase();
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fa-solid fa-file-word';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'fa-solid fa-file-excel';
  return 'fa-solid fa-file-lines';
}

/**
 * WorkflowDetailModal
 *
 * Displays detailed information and the ordered steps of a workflow template.
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Close handler
 * @param {Object} workflow - Workflow template object
 * @param {boolean} [canManage=false] - Whether current user can edit/delete this template
 * @param {boolean} [isOperator=false] - Whether current user is a branch operator
 * @param {string|null} [branchName=null] - Human-readable name of owning branch if applicable
 * @param {Function} [onEdit] - Callback to transition to edit modal: (workflow) => void
 * @param {Function} [onDuplicate] - Callback to duplicate template: (workflow) => void
 */
export default function WorkflowDetailModal({
  isOpen,
  onClose,
  workflow,
  canManage = false,
  isOperator = false,
  branchName = null,
  onEdit,
  onDuplicate,
}) {
  const { openLightbox } = useLightbox();
  const { openPdfModal } = usePdfModal();

  if (!workflow) return null;

  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
  const isBranchTmpl = Boolean(workflow.branchUid || workflow.createdByRole === 'operator' || workflow.createdByRole === 'branch_operator');
  const effectiveBranchName = branchName || workflow.branchName || null;

  const handleFileClick = (file) => {
    if (!file || !file.url) return;
    if (isImageUrl(file.url, file.name)) {
      openLightbox({ url: file.url, title: file.name || 'Workflow Step File' });
    } else if (isPdfUrl(file.url, file.name)) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderOwnershipPill = () => {
    if (isOperator) {
      if (canManage) {
        return (
          <span className="wfd-pill wfd-pill-branch" title={`Authored by your branch${effectiveBranchName ? `: ${effectiveBranchName}` : ''}`}>
            <i className="fa-solid fa-code-branch"></i> Your Branch{effectiveBranchName && effectiveBranchName !== 'Your Branch' ? ` (${effectiveBranchName})` : ''}
          </span>
        );
      }
      if (isBranchTmpl) {
        return (
          <span className="wfd-pill wfd-pill-other" title={`Authored by branch: ${effectiveBranchName || 'Another Branch'}`}>
            <i className="fa-solid fa-building-user"></i> {effectiveBranchName ? `Branch: ${effectiveBranchName}` : 'Other Branch'}
          </span>
        );
      }
      return (
        <span className="wfd-pill wfd-pill-global" title="Head Office Global Workflow Template">
          <i className="fa-solid fa-building"></i> Head Office / Global
        </span>
      );
    }

    if (isBranchTmpl) {
      return (
        <span className="wfd-pill wfd-pill-branch" title={`Created by branch: ${effectiveBranchName || 'Branch Template'}`}>
          <i className="fa-solid fa-building-user"></i> {effectiveBranchName ? `Branch: ${effectiveBranchName}` : 'Branch Template'}
        </span>
      );
    }
    return (
      <span className="wfd-pill wfd-pill-global" title="Head Office Standard Template">
        <i className="fa-solid fa-building"></i> Head Office / Global
      </span>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="56rem"
      width="94%"
      className="workflow-detail-base-modal"
      title={
        <div className="wfd-modal-header-title">
          <div className="wfd-header-icon-box">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div className="wfd-header-text">
            <h2>{workflow.name}</h2>
            <div className="wfd-header-badges">
              <span className="wfd-pill wfd-pill-type">
                {workflow.serviceType || workflow.type || 'General'}
              </span>
              <span className="wfd-pill wfd-pill-count">
                <i className="fa-solid fa-bars-staggered"></i>
                {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
              </span>
              {renderOwnershipPill()}
            </div>
          </div>
        </div>
      }
      subtitle="Complete workflow procedural flow, instructions, and reference documents"
    >
      <div className="wfd-modal-body">
        {/* Workflow Overview & Description */}
        <section className="wfd-overview-card">
          <div className="wfd-overview-header">
            <span className="wfd-overview-label">
              <i className="fa-solid fa-circle-info"></i> Process Overview
            </span>
            <div className="wfd-meta-chips">
              <span className="wfd-meta-chip" title="Creation Date">
                <i className="fa-regular fa-calendar-plus"></i>
                Created: {formatDate(workflow.createdAt)}
              </span>
              {workflow.updatedAt && workflow.updatedAt !== workflow.createdAt && (
                <span className="wfd-meta-chip" title="Last Updated">
                  <i className="fa-regular fa-clock"></i>
                  Updated: {formatDate(workflow.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <p className="wfd-overview-description">
            {workflow.description || 'No description provided for this workflow template.'}
          </p>

          {/* Workflow Branch Ownership Banner */}
          <div className={`wfd-ownership-banner ${isBranchTmpl ? 'branch' : 'global'}`}>
            <div className="wfd-ownership-banner-icon">
              <i className={isBranchTmpl ? 'fa-solid fa-building-user' : 'fa-solid fa-building'}></i>
            </div>
            <div className="wfd-ownership-banner-content">
              <span className="wfd-ownership-banner-title">
                {isBranchTmpl ? 'Branch-Specific Workflow Template' : 'Standard Head Office Workflow'}
              </span>
              <p className="wfd-ownership-banner-sub">
                {isBranchTmpl ? (
                  <>
                    Owned and maintained by{' '}
                    <strong className="wfd-branch-highlight">{effectiveBranchName || 'Branch Location'}</strong>
                    {isOperator && canManage && ' (Your Branch)'}.
                  </>
                ) : (
                  'Universal operational workflow published by Head Office for all branches.'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Sequential Steps Pipeline */}
        <section className="wfd-steps-section">
          <div className="wfd-steps-header">
            <div className="wfd-steps-title">
              <i className="fa-solid fa-list-check"></i>
              <h3>Sequential Steps Pipeline</h3>
            </div>
            <span className="wfd-steps-counter-pill">
              {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} in Order
            </span>
          </div>

          {steps.length === 0 ? (
            <div className="wfd-empty-steps">
              <div className="wfd-empty-icon">
                <i className="fa-solid fa-diagram-next"></i>
              </div>
              <h4>No steps defined</h4>
              <p>This workflow template currently has no operational steps configured.</p>
            </div>
          ) : (
            <div className="wfd-timeline">
              {steps.map((step, index) => {
                const stepNum = index + 1;
                const hasLink = Boolean(step.link?.url);
                const hasFile = Boolean(step.file?.url);

                return (
                  <div key={index} className="wfd-step-card">
                    {/* Step Sequence Badge */}
                    <div className="wfd-step-indicator">
                      <div className="wfd-step-badge">
                        <span>{stepNum}</span>
                      </div>
                      {index < steps.length - 1 && <div className="wfd-step-connector" />}
                    </div>

                    {/* Step Details */}
                    <div className="wfd-step-content">
                      <div className="wfd-step-title-row">
                        <h4 className="wfd-step-title">
                          {typeof step === 'string' ? step : (step.name || `Step ${stepNum}`)}
                        </h4>
                        <span className="wfd-step-order-tag">Step {stepNum} of {steps.length}</span>
                      </div>

                      {typeof step === 'object' && step.description && (
                        <p className="wfd-step-desc">{step.description}</p>
                      )}

                      {/* Step Attachments & Resources */}
                      {(hasLink || hasFile) && (
                        <div className="wfd-step-attachments">
                          {hasLink && (
                            <a
                              href={step.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wfd-attachment-pill wfd-link-pill"
                              title={`Open web resource: ${step.link.url}`}
                            >
                              <i className="fa-solid fa-link"></i>
                              <span className="wfd-attachment-name">{step.link.title || 'Web Link'}</span>
                              <i className="fa-solid fa-arrow-up-right-from-square wfd-external-icon"></i>
                            </a>
                          )}

                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => handleFileClick(step.file)}
                              className="wfd-attachment-pill wfd-file-pill"
                              title={`View attached document: ${step.file.name || 'Document File'}`}
                            >
                              <i className={getFileIcon(step.file.name, step.file.url)}></i>
                              <span className="wfd-attachment-name">{step.file.name || 'Attached Document'}</span>
                              {isImageUrl(step.file.url, step.file.name) ? (
                                <i className="fa-solid fa-expand wfd-expand-icon" title="Preview in Lightbox"></i>
                              ) : (
                                <i className="fa-solid fa-arrow-up-right-from-square wfd-external-icon"></i>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal Actions Footer */}
        <div className="wfd-modal-footer">
          <div className="wfd-footer-meta">
            {isOperator && !canManage && (
              <span className="wfd-footer-locked-notice">
                <i className="fa-solid fa-lock"></i> Read-only workflow template
              </span>
            )}
          </div>

          <div className="wfd-footer-buttons">
            <button
              type="button"
              className="btn btn-secondary wfd-btn-close"
              onClick={onClose}
            >
              Close
            </button>

            {onDuplicate && (
              <button
                type="button"
                className="btn btn-secondary wfd-btn-duplicate"
                onClick={() => {
                  onClose();
                  onDuplicate(workflow);
                }}
                title="Duplicate this workflow template"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Duplicate</span>
              </button>
            )}

            {canManage && onEdit && (
              <button
                type="button"
                className="btn btn-primary wfd-btn-edit"
                onClick={() => {
                  onClose();
                  onEdit(workflow);
                }}
                title="Edit this workflow template"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Edit Workflow</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
