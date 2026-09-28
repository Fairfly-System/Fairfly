import React from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './history-detail-modal.css';

function formatDate(val) {
  if (!val) return 'N/A';
  const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return 'N/A';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(val);
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function HistoryDetailModal({ isOpen, onClose, data, type = 'service' }) {
  if (!isOpen || !data) return null;

  const isService = type === 'service' || Boolean(data.serviceType && (data.steps || data.totalSteps || data.price));
  const isCancelled = (data.status || '').toLowerCase() === 'cancelled';
  const isCompleted = (data.status || '').toLowerCase() === 'completed';

  const modalTitle = isService 
    ? (isCancelled ? 'Cancelled Service Record & Refund' : 'Completed Service Fulfillment')
    : 'Appointment History Details';

  const modalSubtitle = isService
    ? `Detailed audit trail for ${data.serviceType || 'Service'} (${data.id || 'N/A'})`
    : `Historical consultation record for ${data.clientName || 'Client'}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="large"
      maxWidth="50rem"
    >
      <div className="op-history-modal-body">
        {/* Top Banner */}
        <div className="op-history-top-banner">
          <div className="op-history-banner-left">
            <div className={`op-history-icon-bubble ${isCancelled ? 'cancelled' : isCompleted ? 'completed' : ''}`}>
              <i className={`fa-solid ${
                isService 
                  ? (isCancelled ? 'fa-ban' : isCompleted ? 'fa-circle-check' : 'fa-list-check')
                  : 'fa-calendar-check'
              }`}></i>
            </div>
            <div>
              <h3 className="op-history-banner-title">
                {isService ? (data.serviceType || 'Service Fulfillment') : (data.serviceType || data.service || 'Appointment Consultation')}
              </h3>
              <div className="op-history-banner-sub">
                <span>Record ID:</span>
                <span className="op-history-id-code">{data.id}</span>
              </div>
            </div>
          </div>

          <div className="op-history-banner-badges">
            <span
              className={`status-pill ${
                isCompleted
                  ? 'status-pill-completed'
                  : isCancelled
                  ? 'status-pill-disabled'
                  : 'status-pill-active'
              }`}
              style={{
                background: isCancelled ? '#fee2e2' : undefined,
                color: isCancelled ? '#b91c1c' : undefined,
                borderColor: isCancelled ? '#f87171' : undefined
              }}
            >
              <i className={`fa-solid ${isCompleted ? 'fa-check' : isCancelled ? 'fa-xmark' : 'fa-clock'}`} style={{ marginRight: '0.3rem' }}></i>
              {data.status || (isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Recorded')}
            </span>

            {data.priority && (
              <span className={`op-priority ${data.priorityType || 'normal'}`}>
                {data.priority}
              </span>
            )}
          </div>
        </div>

        {/* Cancelled Callout with Full Refund Details */}
        {isCancelled && (
          <div className="op-refund-callout-card">
            <div className="op-refund-icon-box">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <div className="op-refund-info">
              <div className="op-refund-title-row">
                <h4 className="op-refund-title">
                  <i className="fa-solid fa-shield-halved"></i> 100% Full Refund Issued
                </h4>
                <span className="op-refund-pill">
                  <i className="fa-solid fa-check-double"></i> Full Refund
                </span>
              </div>
              <p style={{ margin: '0.2rem 0', fontSize: '0.8125rem', color: '#7f1d1d' }}>
                This service fulfillment was cancelled. A 100% full refund was automatically authorized and processed back to the client via PayMongo.
              </p>

              <div className="op-refund-details-grid">
                <div className="op-refund-detail-item">
                  <span className="op-refund-detail-label">Refunded Amount</span>
                  <span className="op-refund-detail-val">
                    {formatCurrency(data.refundAmount || data.price)}
                  </span>
                </div>
                <div className="op-refund-detail-item">
                  <span className="op-refund-detail-label">Refund Status</span>
                  <span className="op-refund-detail-val" style={{ color: '#15803d' }}>
                    {data.refundStatus || 'FULL_REFUND'}
                  </span>
                </div>
                <div className="op-refund-detail-item">
                  <span className="op-refund-detail-label">PayMongo Refund ID</span>
                  <span className="op-refund-detail-val" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    {data.refundId || 'ref_processed'}
                  </span>
                </div>
                <div className="op-refund-detail-item">
                  <span className="op-refund-detail-label">Cancellation Reason</span>
                  <span className="op-refund-detail-val" style={{ fontWeight: 500, fontSize: '0.8125rem', color: '#475569' }}>
                    {data.cancellationReason || 'Cancelled by Operator'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed Callout */}
        {isCompleted && isService && (
          <div className="op-success-callout-card">
            <div className="op-success-left">
              <div className="op-success-icon-box">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <div>
                <h4 className="op-success-title">Fulfillment Successfully Completed</h4>
                <p className="op-success-sub">All procedure steps and documentation have been finalized and delivered to the client.</p>
              </div>
            </div>
            {data.completedAt && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                Completed on {formatDate(data.completedAt)}
              </span>
            )}
          </div>
        )}

        {/* 2-Column Overview Grids */}
        {isService ? (
          <div className="op-history-grid">
            {/* Client Profile */}
            <div className="op-history-card-panel">
              <div className="op-history-panel-header">
                <i className="fa-solid fa-user-circle"></i>
                <span>Client Information</span>
              </div>
              <div className="op-detail-rows">
                <div className="op-detail-row">
                  <span className="op-detail-label">Client Name:</span>
                  <span className="op-detail-value">{data.clientName || 'Valued Client'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Email:</span>
                  <span className="op-detail-value">{data.clientEmail || 'N/A'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Phone:</span>
                  <span className="op-detail-value">{data.clientPhone || 'N/A'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Client UID:</span>
                  <span className="op-detail-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {data.clientUid || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Service & Financial Overview */}
            <div className="op-history-card-panel">
              <div className="op-history-panel-header">
                <i className="fa-solid fa-receipt"></i>
                <span>Financial & Operations</span>
              </div>
              <div className="op-detail-rows">
                <div className="op-detail-row">
                  <span className="op-detail-label">Service Price:</span>
                  <span className="op-detail-value" style={{ color: 'var(--purple)', fontWeight: 700 }}>
                    {formatCurrency(data.price)}
                  </span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Payment Status:</span>
                  <span className="op-detail-value">
                    <span className={`status-pill ${data.paymentStatus === 'PAID' ? 'status-pill-completed' : data.paymentStatus === 'REFUNDED' ? 'status-pill-disabled' : 'status-pill-pending'}`}>
                      {data.paymentStatus || 'PAID'}
                    </span>
                  </span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Branch Office:</span>
                  <span className="op-detail-value">{data.branchName || 'Branch Office'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Quotation ID:</span>
                  <span className="op-detail-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {data.quotationId || 'Direct'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="op-history-grid">
            {/* Appointment Client Info */}
            <div className="op-history-card-panel">
              <div className="op-history-panel-header">
                <i className="fa-solid fa-user-circle"></i>
                <span>Client Information</span>
              </div>
              <div className="op-detail-rows">
                <div className="op-detail-row">
                  <span className="op-detail-label">Client Name:</span>
                  <span className="op-detail-value">{data.clientName || data.name || 'Valued Client'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Email:</span>
                  <span className="op-detail-value">{data.clientEmail || 'N/A'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Phone:</span>
                  <span className="op-detail-value">{data.clientPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Appointment Schedule & Purpose */}
            <div className="op-history-card-panel">
              <div className="op-history-panel-header">
                <i className="fa-regular fa-calendar-check"></i>
                <span>Schedule & Location</span>
              </div>
              <div className="op-detail-rows">
                <div className="op-detail-row">
                  <span className="op-detail-label">Preferred Date:</span>
                  <span className="op-detail-value">{data.preferredDate || data.date || 'N/A'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Preferred Time:</span>
                  <span className="op-detail-value">{data.preferredTime || '10:00 AM'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Branch:</span>
                  <span className="op-detail-value">{data.branchName || data.preferredBranchLocation || 'Main Branch'}</span>
                </div>
                <div className="op-detail-row">
                  <span className="op-detail-label">Purpose / Notes:</span>
                  <span className="op-detail-value">{data.purpose || data.service || 'Consultation & Inquiry'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Steps Audit Breakdown (Only for Services) */}
        {isService && Array.isArray(data.steps) && data.steps.length > 0 && (
          <div className="op-steps-section">
            <div className="op-steps-header">
              <h4 className="op-steps-title">
                <i className="fa-solid fa-timeline"></i> Procedure Workflow Audit ({data.steps.length} Steps)
              </h4>
            </div>

            <div className="op-steps-list">
              {data.steps.map((st, idx) => {
                const isStepCompleted = st.status === 'Completed';
                const isProcessing = st.status === 'Currently Processing' || st.status === 'In Progress';
                return (
                  <div key={idx} className={`op-step-item ${isStepCompleted ? 'is-completed' : ''}`}>
                    <div className="op-step-number">
                      {isStepCompleted ? <i className="fa-solid fa-check"></i> : (st.stepNumber || idx + 1)}
                    </div>
                    <div className="op-step-details">
                      <div className="op-step-title-row">
                        <span className="op-step-title">{st.title || `Step ${idx + 1}`}</span>
                        <span
                          className={`status-pill ${
                            isStepCompleted
                              ? 'status-pill-completed'
                              : isProcessing
                              ? 'status-pill-active'
                              : 'status-pill-disabled'
                          }`}
                          style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                        >
                          {st.status || 'Pending'}
                        </span>
                      </div>
                      {st.description && <p className="op-step-desc">{st.description}</p>}
                      {st.completedAt && (
                        <p className="op-step-desc" style={{ color: '#16a34a' }}>
                          <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i>
                          Completed: {formatDate(st.completedAt)}
                        </p>
                      )}
                      {st.thirdPartyLink && (
                        <a
                          href={st.thirdPartyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="op-step-link"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Portal Link
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Notes / Remarks */}
        {data.additionalNotes && (
          <div className="op-history-card-panel">
            <div className="op-history-panel-header">
              <i className="fa-regular fa-clipboard"></i>
              <span>Additional Notes & Specifications</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', whiteSpace: 'pre-line' }}>
              {data.additionalNotes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="op-history-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
