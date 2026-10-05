import React from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './inquiry-detail-modal.css';

export default function InquiryDetailModal({
  isOpen,
  onClose,
  inquiry,
  onOpenPdf
}) {
  if (!inquiry) return null;

  const servicesList = Array.isArray(inquiry.servicesOffered)
    ? inquiry.servicesOffered
    : (inquiry.serviceType ? [inquiry.serviceType] : []);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Submitted Service Inquiry Details"
      subtitle={`Form SAF-01-002 · Control No: ${inquiry.controlNo || inquiry.id.substring(0, 8)}`}
      size="large"
    >
      <div className="inquiry-detail-content">
        {/* Header Card */}
        <div className="inq-modal-header-card">
          <div>
            <span className="inq-modal-tag">
              <i className="fa-solid fa-file-signature"></i> {inquiry.formNo || 'SAF-01-002'} · {inquiry.controlNo || inquiry.id.substring(0, 8)}
            </span>
            <h3 className="inq-modal-title">{inquiry.clientName || 'Valued Client'}</h3>
            <span className="inq-modal-date">
              <i className="fa-regular fa-clock"></i> Submitted on {inquiry.dateInquired || (inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : 'Recent')}
            </span>
          </div>

          <div>
            <span className={`inquiry-status-pill status-${(inqStatus => inqStatus.toLowerCase())(inquiry.status || 'submitted')}`}>
              {(inquiry.status || 'Submitted').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Requested Services */}
        <div className="inq-modal-section">
          <div className="inq-section-heading">
            <i className="fa-solid fa-bell-concierge"></i>
            Requested Services & Categories
          </div>
          {servicesList.length > 0 ? (
            <div className="inq-services-wrap">
              {servicesList.map((serviceName, idx) => (
                <span key={idx} className="inq-modal-service-pill">
                  <i className="fa-solid fa-check" style={{ fontSize: '0.625rem', marginRight: '0.25rem' }}></i>
                  {serviceName}
                </span>
              ))}
            </div>
          ) : (
            <div className="inq-text-block">Custom Travel & Tour Inquiry</div>
          )}
        </div>

        {/* Client & Travel Group Information */}
        <div className="inq-modal-section">
          <div className="inq-section-heading">
            <i className="fa-solid fa-user-group"></i>
            Contact & Passenger Details
          </div>
          <div className="inq-modal-meta-grid">
            <div className="inq-meta-item">
              <span className="inq-meta-label">Primary Client Name</span>
              <span className="inq-meta-val">{inquiry.clientName || 'N/A'}</span>
            </div>
            {inquiry.contactPerson && (
              <div className="inq-meta-item">
                <span className="inq-meta-label">Contact Person</span>
                <span className="inq-meta-val">{inquiry.contactPerson}</span>
              </div>
            )}
            <div className="inq-meta-item">
              <span className="inq-meta-label">Total Pax / Population</span>
              <span className="inq-meta-val">{inquiry.population || 'Not specified'}</span>
            </div>
            {inquiry.clientEmail && (
              <div className="inq-meta-item">
                <span className="inq-meta-label">Email Address</span>
                <span className="inq-meta-val">{inquiry.clientEmail}</span>
              </div>
            )}
            {inquiry.clientPhone && (
              <div className="inq-meta-item">
                <span className="inq-meta-label">Phone Number</span>
                <span className="inq-meta-val">{inquiry.clientPhone}</span>
              </div>
            )}
            {inquiry.preferredBranch && (
              <div className="inq-meta-item">
                <span className="inq-meta-label">Preferred Branch</span>
                <span className="inq-meta-val">{inquiry.preferredBranch}</span>
              </div>
            )}
          </div>
        </div>

        {/* Specified Requirements of Client (What the client needs from the agency) */}
        <div className="inq-modal-section">
          <div className="inq-section-heading">
            <i className="fa-solid fa-clipboard-list"></i>
            Specified Requirements of Client (SAF-01-002 Section 2)
          </div>
          <div className="inq-text-block">
            {inquiry.specifiedRequirements || (typeof inquiry.notes === 'string' && inquiry.notes.trim()) || 'No specific requirements recorded in this inquiry.'}
          </div>
        </div>

        {/* Operator Remarks / Notes */}
        {(inquiry.notes || inquiry.remarks) && (
          <div className="inq-modal-section" style={{ background: 'var(--warning-yellow-light, #fffbeb)', borderColor: '#fde68a' }}>
            <div className="inq-section-heading" style={{ color: '#b45309' }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#d97706' }}></i>
              Operator Remarks & Updates
            </div>
            <div className="inq-text-block" style={{ color: '#78350f' }}>
              {inquiry.notes || inquiry.remarks}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="inq-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onOpenPdf && onOpenPdf('inquiry', inquiry)}
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>View Official PDF (SAF-01-002)</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
