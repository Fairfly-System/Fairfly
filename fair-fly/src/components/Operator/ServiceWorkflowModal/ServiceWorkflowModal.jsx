import { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './service-workflow-modal.css';

function getStepLink(step) {
  if (!step) return null;
  const linkObj = step.thirdPartyLink || step.link || step.url;
  if (!linkObj) return null;
  if (typeof linkObj === 'string') return { url: linkObj, title: 'Open Attached Link / Portal' };
  if (typeof linkObj === 'object' && linkObj.url) {
    return { url: linkObj.url, title: linkObj.title || linkObj.name || 'Open Attached Link / Portal' };
  }
  return null;
}

function getStepFile(step) {
  if (!step) return null;
  const fileObj = step.file || step.attachment || step.document;
  if (!fileObj) return null;
  if (typeof fileObj === 'string') return { url: fileObj, name: 'View Attached Document' };
  if (typeof fileObj === 'object' && fileObj.url) {
    return { url: fileObj.url, name: fileObj.name || fileObj.fileName || fileObj.title || 'View Attached Document' };
  }
  return null;
}

export default function ServiceWorkflowModal({ serviceRecord, onClose }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!serviceRecord) return null;

  const steps = serviceRecord.steps || [];
  const requirements = serviceRecord.requirements || [];
  const completedStepsCount = steps.filter((s) => s.status === 'Completed').length;
  const progressPct = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  const handleCompleteStep = (stepIdx) => {
    // Strict sequential rule check on frontend
    if (stepIdx > 0 && steps[stepIdx - 1].status !== 'Completed') {
      addToast(`Strict Step Rule: Complete Step ${stepIdx} first!`, 'warning');
      return;
    }

    ApiCaller(
      `${API_BASE_URL}/api/services/active/${serviceRecord.id}/step`,
      'PATCH',
      { stepIndex: stepIdx, newStatus: 'Completed' },
      { Authorization: `Bearer ${userToken}` },
      (res) => {
        addToast(`Step ${stepIdx + 1} completed successfully!`, 'success');
        if (res.allCompleted) {
          addToast('🎉 All workflow steps completed! Service marked as finished.', 'success');
        }
      },
      (error) => {
        addToast(`Failed to update step: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const handleToggleStatus = (stepIdx, currentStatus) => {
    const nextStatus = currentStatus === 'Currently Processing' ? 'Ongoing' : 'Currently Processing';
    ApiCaller(
      `${API_BASE_URL}/api/services/active/${serviceRecord.id}/step`,
      'PATCH',
      { stepIndex: stepIdx, newStatus: nextStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Step ${stepIdx + 1} status set to ${nextStatus}`, 'info');
      },
      (error) => {
        addToast(`Failed to update step: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="720px"
      title="Service Workflow Procedures & Execution"
      subtitle={`Guided step-by-step fulfillment for ${serviceRecord.serviceType}`}
    >
      <div className="swm-modal-body">
        <div className="swm-client-banner">
          <div className="swm-client-info">
            <h3>{serviceRecord.clientName}</h3>
            <p>
              Service: <strong>{serviceRecord.serviceType}</strong> · Price: {serviceRecord.price || 'Standard Fee'} · Phone: {serviceRecord.clientPhone || 'N/A'}
            </p>
          </div>
          <span className={`swm-overall-badge ${serviceRecord.status === 'Completed' ? 'completed' : 'processing'}`}>
            {serviceRecord.status || 'Processing'}
          </span>
        </div>

        {/* Admin Configured Service Requirements Banner */}
        {requirements.length > 0 && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-regular fa-clipboard" style={{ color: 'var(--purple)' }}></i>
              Admin Configured Requirements ({requirements.length}):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {requirements.map((req, rIdx) => (
                <span key={rIdx} style={{ fontSize: '0.775rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.25rem 0.6rem', borderRadius: '6px', color: '#0f172a' }}>
                  <i className="fa-solid fa-check-double" style={{ color: '#16a34a', marginRight: '0.3rem' }}></i>
                  {typeof req === 'string' ? req : req.title || req.name || 'Requirement'}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="swm-progress-header">
            <span>Overall Fulfillment Progress</span>
            <span>{completedStepsCount} of {steps.length} Steps Completed ({progressPct}%)</span>
          </div>
          <div className="swm-progress-track">
            <div className="swm-progress-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        <div className="swm-steps-timeline">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'Completed';
            const isPrevCompleted = idx === 0 || steps[idx - 1].status === 'Completed';
            const isActive = !isCompleted && isPrevCompleted;
            const isLocked = !isCompleted && !isPrevCompleted;

            const stepLink = getStepLink(step);
            const stepFile = getStepFile(step);

            let statusClass = 'pending';
            if (isCompleted) statusClass = 'completed';
            else if (step.status === 'Currently Processing') statusClass = 'currently-processing';
            else if (step.status === 'Ongoing') statusClass = 'ongoing';

            return (
              <div
                key={idx}
                className={`swm-step-card ${isCompleted ? 'completed' : isActive ? 'active' : 'locked'}`}
              >
                <div className="swm-step-top">
                  <div className="swm-step-title-group">
                    <div className="swm-step-number-badge">
                      {isCompleted ? <i className="fa-solid fa-check"></i> : step.stepNumber || idx + 1}
                    </div>
                    <div>
                      <div className="swm-step-title">{step.title}</div>
                      {step.description && (
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {step.description}
                        </p>
                      )}
                      {step.completedAt && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                          Completed: {new Date(step.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`swm-step-status-pill ${statusClass}`}>
                    {isLocked ? 'Locked (Pending Preceding Step)' : step.status}
                  </span>
                </div>

                {/* Attached Links & Files UI for Operator */}
                <div className="swm-step-actions" style={{ flexWrap: 'wrap' }}>
                  {!isCompleted && (
                    <button
                      className="swm-btn-complete"
                      disabled={isLocked || isSubmitting}
                      onClick={() => handleCompleteStep(idx)}
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      Mark Step Completed
                    </button>
                  )}

                  {!isCompleted && !isLocked && (
                    <button
                      className="swm-btn-portal"
                      disabled={isSubmitting}
                      onClick={() => handleToggleStatus(idx, step.status)}
                    >
                      <i className="fa-solid fa-rotate"></i>
                      Toggle {step.status === 'Currently Processing' ? 'Ongoing' : 'Processing'}
                    </button>
                  )}

                  {stepLink && (
                    <a
                      href={stepLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="swm-btn-portal"
                      title={stepLink.title}
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>{stepLink.title}</span>
                    </a>
                  )}

                  {stepFile && (
                    <a
                      href={stepFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="swm-btn-file-attach"
                      title={`Open Attached File: ${stepFile.name}`}
                    >
                      <i className="fa-solid fa-paperclip"></i>
                      <span>{stepFile.name}</span>
                      <i className="fa-solid fa-download download-icon"></i>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}
