import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './operator-service-procedure.css';

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

function ServiceProcedureContent() {
  const { id } = useParams();
  const { data: activeServices, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceRecord = useMemo(() => {
    if (!activeServices || !id) return null;
    return activeServices.find((s) => s.id === id) || null;
  }, [activeServices, id]);

  if (loading) {
    return (
      <div className="card op-procedure-page page-fade-in">
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>
          Loading service fulfillment procedures...
        </p>
      </div>
    );
  }

  if (!serviceRecord) {
    return (
      <div className="card op-procedure-page page-fade-in">
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#eab308' }}></i>
          <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', color: '#0f172a' }}>Active Service Record Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>The requested active service may have been deleted or moved.</p>
          <Link to="/operator" className="op-procedure-back-btn" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>
            <i className="fa-solid fa-arrow-left"></i> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const steps = serviceRecord.steps || [];
  const requirements = serviceRecord.requirements || [];
  const completedStepsCount = steps.filter((s) => s.status === 'Completed').length;
  const progressPct = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  const handleCompleteStep = (stepIdx) => {
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
        addToast(`Step ${stepIdx + 1} marked as Completed!`, 'success');
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

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Procedure Checklist' },
  ];

  return (
    <div className="operator-procedure-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="card op-procedure-page">
        <div className="op-procedure-top-bar">
        <Link to="/operator" className="op-procedure-back-btn">
          <i className="fa-solid fa-arrow-left"></i> Back to Active Services
        </Link>

        <span className={`swm-overall-badge ${serviceRecord.status === 'Completed' ? 'completed' : 'processing'}`}>
          Overall Status: {serviceRecord.status || 'Processing'}
        </span>
      </div>

      {/* Top Client & Service Header */}
      <div className="op-procedure-header-card">
        <div className="op-procedure-header-left">
          <div className="op-procedure-header-icon">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div className="op-procedure-header-info">
            <h1>{serviceRecord.clientName}</h1>
            <p>
              Service: <strong>{serviceRecord.serviceType}</strong> · Fee: <strong>{serviceRecord.price || 'Standard Fee'}</strong>
            </p>
            <div className="op-procedure-header-meta">
              <span><i className="fa-solid fa-phone" style={{ color: '#6366f1' }}></i> {serviceRecord.clientPhone || 'N/A'}</span>
              <span><i className="fa-regular fa-envelope" style={{ color: '#3b82f6' }}></i> {serviceRecord.clientEmail || 'N/A'}</span>
              <span><i className="fa-regular fa-clock" style={{ color: '#f59e0b' }}></i> Started: {serviceRecord.startedAt ? new Date(serviceRecord.startedAt).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className={`op-priority ${serviceRecord.priorityType || 'normal'}`}>
            {serviceRecord.priority || 'Normal Priority'}
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="op-procedure-grid">
        {/* Left Column: Progress Statistics & Requirements */}
        <div className="op-procedure-sidebar-panel">
          <div className="op-procedure-panel-card">
            <h3>
              <i className="fa-solid fa-chart-line" style={{ color: '#6366f1' }}></i>
              Completion Statistics
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              <span>Fulfillment Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="op-procedure-progress-bar-bg">
              <div className="op-procedure-progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>
              {completedStepsCount} of {steps.length} total workflow procedure steps completed.
            </p>
          </div>

          {/* Client Submitted Requirements & Documents Verification Panel */}
          {((serviceRecord.submittedRequirements && serviceRecord.submittedRequirements.length > 0) || requirements.length > 0) && (
            <div className="op-procedure-panel-card">
              <h3>
                <i className="fa-solid fa-file-circle-check" style={{ color: '#6366f1' }}></i>
                Client Submitted Requirements ({((serviceRecord.submittedRequirements || requirements).length)})
              </h3>

              <div className="op-procedure-req-list">
                {(serviceRecord.submittedRequirements || requirements).map((req, rIdx) => {
                  const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${rIdx + 1}`;
                  const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
                  const fileMeta = typeof req === 'object' ? req.file : null;
                  const valueStr = typeof req === 'object' ? req.value : '';

                  const isImage = inputType === 'image' || (fileMeta?.url && /\.(png|jpg|jpeg|webp|gif)/i.test(fileMeta.fileName || fileMeta.url));

                  return (
                    <div key={rIdx} className="op-submitted-req-card">
                      <div className="op-submitted-req-header">
                        <span className="op-submitted-req-name">{reqName}</span>
                        <span className="op-submitted-req-type">
                          {isImage ? '📷 Image' : fileMeta ? '📄 Document' : inputType === 'date' ? '📅 Date' : inputType === 'number' ? '🔢 Number' : '✏️ Text'}
                        </span>
                      </div>

                      {/* Image Thumbnail Preview & Link */}
                      {fileMeta && isImage && (
                        <div className="op-submitted-img-box">
                          <img src={fileMeta.url} alt={reqName} className="op-submitted-img-preview" />
                          <div className="op-submitted-img-actions">
                            <span className="op-file-name">{fileMeta.fileName || 'Attached Image'}</span>
                            <a
                              href={fileMeta.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="op-req-view-btn"
                              title="Open full resolution image"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square"></i> View Full Image
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Document File Link */}
                      {fileMeta && !isImage && (
                        <div className="op-submitted-doc-box">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fa-solid fa-file-pdf" style={{ fontSize: '1.25rem', color: '#ef4444' }}></i>
                            <div style={{ overflow: 'hidden' }}>
                              <div className="op-file-name">{fileMeta.fileName || 'Attached Document'}</div>
                              {fileMeta.fileSize && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  ({(fileMeta.fileSize / 1024 / 1024).toFixed(2)} MB)
                                </div>
                              )}
                            </div>
                          </div>
                          <a
                            href={fileMeta.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="op-req-view-btn"
                            title="Download/View Document"
                          >
                            <i className="fa-solid fa-download"></i> View File
                          </a>
                        </div>
                      )}

                      {/* Text / Date / Number Value Response */}
                      {!fileMeta && valueStr && (
                        <div className="op-submitted-text-box">
                          <span className="op-text-label">Response:</span>
                          <span className="op-text-value">{valueStr}</span>
                        </div>
                      )}

                      {!fileMeta && !valueStr && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Standard requirement acknowledged by client
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Spacious Procedure Steps Timeline */}
        <div className="op-procedure-timeline-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Workflow Procedure Execution Steps ({steps.length})
          </h3>

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
                className={`op-procedure-step-card ${isCompleted ? 'completed' : isActive ? 'active' : 'locked'}`}
              >
                <div className="op-procedure-step-header">
                  <div className="op-procedure-step-title-group">
                    <div className="op-procedure-step-badge">
                      {isCompleted ? <i className="fa-solid fa-check"></i> : step.stepNumber || idx + 1}
                    </div>
                    <div>
                      <div className="op-procedure-step-title">{step.title}</div>
                      {step.description && (
                        <p className="op-procedure-step-desc">{step.description}</p>
                      )}
                      {step.completedAt && (
                        <span style={{ fontSize: '0.775rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                          <i className="fa-regular fa-clock" style={{ marginRight: '0.3rem' }}></i>
                          Completed: {new Date(step.completedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`swm-step-status-pill ${statusClass}`}>
                    {isLocked ? 'Locked (Pending Preceding Step)' : step.status}
                  </span>
                </div>

                <div className="op-procedure-step-actions">
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
                      title={`Open Attached Document: ${stepFile.name}`}
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
      </div>
    </div>
  );
}

export default function OperatorServiceProcedure() {
  return (
    <OperatorProvider targetCollection="activeServices">
      <ServiceProcedureContent />
    </OperatorProvider>
  );
}
