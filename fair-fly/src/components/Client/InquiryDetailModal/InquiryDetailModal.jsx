import React from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useLightbox } from '../../UI/ImageLightbox/ImageLightbox';
import { useSubmittedRequirements } from '../../../hooks/useSubmittedRequirements';
import './inquiry-detail-modal.css';

function formatRequirementsText(specifiedRequirements, requirements) {
  for (const value of [specifiedRequirements, requirements]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  if (!Array.isArray(requirements)) return '';

  return requirements
    .map((requirement) => {
      if (typeof requirement === 'string') return requirement.trim();
      if (!requirement || typeof requirement !== 'object') return '';

      const label = [requirement.name, requirement.title]
        .find((value) => typeof value === 'string' && value.trim())?.trim() || '';
      const value = typeof requirement.value === 'string' ? requirement.value.trim() : '';
      const fileName = typeof requirement.file?.fileName === 'string'
        ? requirement.file.fileName.trim()
        : '';
      const details = [value, fileName ? `File: ${fileName}` : ''].filter(Boolean).join(' | ');

      if (label && details) return `${label}: ${details}`;
      return label || details;
    })
    .filter(Boolean)
    .join(', ');
}

export default function InquiryDetailModal({
  isOpen,
  onClose,
  inquiry,
  onOpenPdf
}) {
  const { openLightbox } = useLightbox();

  const submittedReqId = inquiry?.submittedRequirementsId || null;
  const { requirements: dynamicReqs } = useSubmittedRequirements(submittedReqId, inquiry?.requirements);

  if (!inquiry) return null;

  const servicesList = Array.isArray(inquiry.servicesOffered)
    ? inquiry.servicesOffered
    : (inquiry.serviceType ? [inquiry.serviceType] : []);

  const effectiveReqs = dynamicReqs && dynamicReqs.length > 0 ? dynamicReqs : (inquiry.requirements || []);
  const requirementsText = formatRequirementsText(inquiry.specifiedRequirements, effectiveReqs);

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

        {/* Specified Requirements */}
        <div className="inq-modal-section">
          <div className="inq-section-heading">
            <i className="fa-solid fa-list-check"></i>
            Specified Requirements & Details
          </div>
          {Array.isArray(effectiveReqs) && effectiveReqs.length > 0 && typeof effectiveReqs[0] === 'object' ? (
            <div className="inq-reqs-grid">
              {effectiveReqs.map((req, rIdx) => {
                const reqName = req.name || req.title || `Requirement ${rIdx + 1}`;
                const fileObj = req.file;
                const fileUrl = fileObj?.url || (typeof fileObj === 'string' ? fileObj : null) || req.fileUrl || req.url;
                const fileName = fileObj?.fileName || req.fileName || '';
                const isImage = req.inputType === 'image' || (fileUrl && /\.(png|jpg|jpeg|webp|gif)/i.test(fileName || fileUrl));
                const textVal = req.value || req.textValue || '';

                return (
                  <div key={rIdx} className="inq-req-item">
                    <span className="inq-req-name">{reqName}</span>
                    {fileUrl ? (
                      <div className="inq-req-file-row">
                        {isImage && (
                          <button
                            type="button"
                            className="inq-img-thumb-link"
                            title={`View in Lightbox: ${fileName || reqName}`}
                            onClick={() =>
                              openLightbox({
                                imageUrl: fileUrl,
                                title: fileName || reqName,
                                subtitle: `Inquiry Requirement · ${inquiry.serviceType || 'Inquiry'}`
                              })
                            }
                          >
                            <img src={fileUrl} alt={fileName || reqName} className="inq-img-thumb" />
                          </button>
                        )}
                        {isImage ? (
                          <button
                            type="button"
                            className="inq-file-link"
                            title={`View in Lightbox: ${fileName || reqName}`}
                            onClick={() =>
                              openLightbox({
                                imageUrl: fileUrl,
                                title: fileName || reqName,
                                subtitle: `Inquiry Requirement · ${inquiry.serviceType || 'Inquiry'}`
                              })
                            }
                          >
                            <i className="fa-regular fa-image"></i>
                            <span>{fileName || 'View Attached Image'}</span>
                          </button>
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inq-file-link"
                            title={fileName ? `Open ${fileName}` : 'View Attached File'}
                          >
                            <i className="fa-solid fa-file-arrow-down"></i>
                            <span>{fileName || 'View Attached Document'}</span>
                          </a>
                        )}
                      </div>
                    ) : textVal ? (
                      <span className="inq-req-val">{textVal}</span>
                    ) : (
                      <span className="inq-req-val" style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Provided / Acknowledged</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="inq-text-block">
              {requirementsText || 'No custom requirements specified in the submission.'}
            </div>
          )}
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
