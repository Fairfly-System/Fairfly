import React from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './quotation-detail-modal.css';

export default function QuotationDetailModal({
  isOpen,
  onClose,
  quotation,
  onAcceptQuotation,
  onOpenPayment,
  onOpenPdf,
  isAccepting = false,
}) {
  if (!quotation) return null;

  const totalAmt = Number(quotation.totalAmount || quotation.rate || 0);
  const isAccepted = quotation.status === 'Accepted';
  const isSent = quotation.status === 'Sent';
  const isPaid = quotation.paymentStatus === 'PAID';
  const isPaymentPending = quotation.paymentStatus === 'PAYMENT_PENDING';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Service Quotation Details"
      subtitle={`Form ADF-07-001 · Reference ${quotation.quoteNo || quotation.id}`}
      size="large"
    >
      <div className="quotation-detail-content">
        {/* Header Card */}
        <div className="quote-modal-header-card">
          <div>
            <span className="quote-modal-tag">
              <i className="fa-solid fa-file-invoice"></i> {quotation.quoteNo || 'Quotation'}
            </span>
            <h3 className="quote-modal-title">{quotation.serviceTitle || 'Custom Service Package'}</h3>
            <span className="quote-modal-branch">
              <i className="fa-solid fa-building"></i> {quotation.branchName || 'FairFly Travel & Tours'}
            </span>
          </div>

          <div className="quote-modal-status-col">
            <span className={`quote-status-pill status-${(quotation.status || 'draft').toLowerCase()}`}>
              {quotation.status}
            </span>
            {isAccepted && (
              <span className={`quote-payment-badge ${(quotation.paymentStatus || 'unpaid').toLowerCase()}`}>
                <i className={`fa-solid ${isPaid ? 'fa-check' : isPaymentPending ? 'fa-clock' : 'fa-circle-exclamation'}`}></i>
                {isPaid ? 'PAID' : isPaymentPending ? 'PAYMENT PENDING' : 'UNPAID'}
              </span>
            )}
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="quote-modal-financial-grid">
          <div className="quote-modal-price-box">
            <span className="quote-price-label">Total Payable Amount</span>
            <div className="quote-price-value">
              ₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="quote-price-sub">
              {quotation.taxAmount ? `Inclusive of ₱${Number(quotation.taxAmount).toLocaleString()} tax` : 'All taxes and service fees included'}
            </span>
          </div>

          <div className="quote-modal-section">
            <div className="quote-section-heading">
              <i className="fa-solid fa-calendar-days"></i>
              Tour / Service Schedule
            </div>
            <div className="quote-text-block">
              {quotation.tourDates || 'Dates to be coordinated upon booking acceptance.'}
            </div>
            {quotation.rateBreakdown && (
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Breakdown: </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-dark)' }}>{quotation.rateBreakdown}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
          <div className="quote-modal-section">
            <div className="quote-section-heading">
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--complete-green)' }}></i>
              Package Inclusions
            </div>
            <div className="quote-text-block">
              {quotation.inclusions || 'Standard service inclusions apply as coordinated with operator.'}
            </div>
          </div>

          <div className="quote-modal-section">
            <div className="quote-section-heading">
              <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--error-red)' }}></i>
              Exclusions / Not Included
            </div>
            <div className="quote-text-block">
              {quotation.exclusions || 'Personal expenses, incidental fees, and optional gratuities not specified.'}
            </div>
          </div>
        </div>

        {/* Submitted Requirements / Files */}
        {((Array.isArray(quotation.submittedRequirements) && quotation.submittedRequirements.length > 0) ||
          (Array.isArray(quotation.requirements) && quotation.requirements.length > 0)) && (
          <div className="quote-modal-section">
            <div className="quote-section-heading">
              <i className="fa-solid fa-clipboard-check"></i>
              Submitted Client Requirements & Documents
            </div>
            <div className="quote-reqs-grid">
              {(quotation.submittedRequirements || quotation.requirements).map((req, rIdx) => {
                const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${rIdx + 1}`;
                const fileObj = typeof req === 'object' ? req.file : null;
                const fileUrl = typeof req === 'object' ? (fileObj?.url || (typeof fileObj === 'string' ? fileObj : null) || req.fileUrl || req.url) : null;
                const fileName = typeof req === 'object' ? (fileObj?.fileName || req.fileName || '') : '';
                const isImage = typeof req === 'object' && (req.inputType === 'image' || (fileUrl && /\.(png|jpg|jpeg|webp|gif)/i.test(fileName || fileUrl)));
                const textVal = typeof req === 'object' ? (req.value || req.textValue || '') : '';

                return (
                  <div key={rIdx} className="quote-req-item">
                    <span className="quote-req-name">{reqName}</span>
                    {fileUrl ? (
                      <div className="quote-req-file-row">
                        {isImage && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="quote-img-thumb-link" title={`View full image: ${fileName || reqName}`}>
                            <img src={fileUrl} alt={fileName || reqName} className="quote-img-thumb" />
                          </a>
                        )}
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="quote-file-link" title={fileName ? `Open ${fileName}` : 'View Attached File'}>
                          <i className={isImage ? "fa-regular fa-image" : "fa-solid fa-file-arrow-down"}></i>
                          <span>{fileName || (isImage ? 'View Attached Image' : 'View Attached Document')}</span>
                        </a>
                      </div>
                    ) : textVal ? (
                      <span className="quote-req-val">{textVal}</span>
                    ) : (
                      <span className="quote-req-val" style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Provided / Acknowledged</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Client & Operator Metadata */}
        <div className="quote-modal-section">
          <div className="quote-section-heading">
            <i className="fa-solid fa-id-card"></i>
            Quotation & Preparer Information
          </div>
          <div className="quote-modal-meta-grid">
            <div className="quote-meta-item">
              <span className="quote-meta-label">Client Name</span>
              <span className="quote-meta-val">{quotation.clientName || 'Valued Client'}</span>
            </div>
            <div className="quote-meta-item">
              <span className="quote-meta-label">Prepared By</span>
              <span className="quote-meta-val">{quotation.preparedByName || quotation.preparedBy || 'Branch Officer'}</span>
            </div>
            {quotation.preparedByTitle && (
              <div className="quote-meta-item">
                <span className="quote-meta-label">Preparer Designation</span>
                <span className="quote-meta-val">{quotation.preparedByTitle}</span>
              </div>
            )}
            {quotation.preparedByContact && (
              <div className="quote-meta-item">
                <span className="quote-meta-label">Branch Contact</span>
                <span className="quote-meta-val">{quotation.preparedByContact}</span>
              </div>
            )}
            <div className="quote-meta-item">
              <span className="quote-meta-label">Date Issued</span>
              <span className="quote-meta-val">
                {quotation.quotationDate || (quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'Recent')}
              </span>
            </div>
          </div>
        </div>

        {/* Operator Remarks */}
        {quotation.remarks && (
          <div className="quote-modal-section" style={{ background: 'var(--warning-yellow-light, #fffbeb)', borderColor: '#fde68a' }}>
            <div className="quote-section-heading" style={{ color: '#b45309' }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#d97706' }}></i>
              Operator Remarks & Special Instructions
            </div>
            <div className="quote-text-block" style={{ color: '#78350f' }}>
              {quotation.remarks}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="quote-modal-footer">
          <div className="quote-modal-footer-left">
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
              onClick={() => onOpenPdf && onOpenPdf('quotation', quotation)}
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>View Official PDF</span>
            </button>
          </div>

          <div className="quote-modal-footer-right">
            {isSent && (
              <button
                type="button"
                className="btn btn-primary btn-accept"
                onClick={() => {
                  onClose();
                  onAcceptQuotation && onAcceptQuotation(quotation);
                }}
                disabled={isAccepting}
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Accept & Proceed to Pay</span>
              </button>
            )}

            {isAccepted && isPaymentPending && (
              <button
                type="button"
                className="btn btn-warning btn-resume"
                onClick={() => {
                  onClose();
                  onOpenPayment && onOpenPayment(quotation);
                }}
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>Resume Payment (₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
              </button>
            )}

            {isAccepted && !isPaid && !isPaymentPending && (
              <button
                type="button"
                className="btn btn-primary btn-pay"
                onClick={() => {
                  onClose();
                  onOpenPayment && onOpenPayment(quotation);
                }}
              >
                <i className="fa-solid fa-credit-card"></i>
                <span>Proceed to Pay ₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </button>
            )}

            {isPaid && (
              <span className="quote-paid-notice">
                <i className="fa-solid fa-circle-check"></i> Paid · Custom Service Active
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
