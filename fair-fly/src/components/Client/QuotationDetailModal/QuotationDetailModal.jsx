import React, { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useLightbox } from '../../UI/ImageLightbox/ImageLightbox';
import { useSubmittedRequirements } from '../../../hooks/useSubmittedRequirements';
import QuotationAttachRequirementsModal from '../QuotationAttachRequirementsModal/QuotationAttachRequirementsModal';
import './quotation-detail-modal.css';

export default function QuotationDetailModal({
  isOpen,
  onClose,
  quotation,
  onAcceptQuotation,
  onRejectQuotation,
  onOpenPayment,
  onOpenPdf,
  isAccepting = false,
}) {
  const { openLightbox } = useLightbox();
  const [showAttachModal, setShowAttachModal] = useState(false);

  const reqReferenceId = quotation?.submittedRequirementsId || quotation?.inquiryId || null;
  const { requirements: resolvedReqs, loading: loadingReqs } = useSubmittedRequirements(
    reqReferenceId,
    quotation?.submittedRequirements || quotation?.requirements || []
  );

  if (!quotation) return null;

  const totalAmt = Number(quotation.totalAmount || quotation.rate || 0);
  const isFulfilled = (quotation.status || '').toLowerCase() === 'fulfilled' || (quotation.fulfillmentStatus || '').toLowerCase() === 'fulfilled';
  const isAccepted = quotation.status === 'Accepted' && !isFulfilled;
  const isSent = quotation.status === 'Sent' && !isFulfilled;
  const isRejected = (quotation.status || '').toLowerCase() === 'rejected';
  const isPaid = quotation.paymentStatus === 'PAID';
  const isPaymentPending = (quotation.paymentStatus || '').toUpperCase() === 'PAYMENT_PENDING';

  const rawRequirements = Array.isArray(resolvedReqs) && resolvedReqs.length > 0
    ? resolvedReqs
    : (Array.isArray(quotation.submittedRequirements) ? quotation.submittedRequirements : (Array.isArray(quotation.requirements) ? quotation.requirements : []));
  const displayRequirements = rawRequirements.filter((r) => {
    const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
    return name !== 'specified requirements of client' &&
           name !== 'client specified requirements' &&
           name !== 'specified requirements of the client' &&
           name !== 'specified requirements';
  });

  const reqStatus = quotation.requirementsStatus || (displayRequirements.length === 0 ? 'not_required' : 'pending');
  const canAccept = reqStatus === 'approved' || reqStatus === 'not_required';

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
            {isFulfilled ? (
              <span className="quote-payment-badge paid">
                <i className="fa-solid fa-trophy"></i>
                FULFILLED
              </span>
            ) : isAccepted ? (
              <span className={`quote-payment-badge ${(quotation.paymentStatus || 'unpaid').toLowerCase()}`}>
                <i className={`fa-solid ${isPaid ? 'fa-check' : isPaymentPending ? 'fa-clock' : 'fa-circle-exclamation'}`}></i>
                {isPaid ? 'PAID' : isPaymentPending ? 'PAYMENT PENDING' : 'UNPAID'}
              </span>
            ) : null}
          </div>
        </div>

        {/* Rejection Notice Banner */}
        {isRejected && (
          <div style={{
            padding: '0.85rem 1.15rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--error-red, #dc2626)' }}></i>
              <span>Quotation Proposal Rejected</span>
            </div>
            {quotation.rejectedAt && (
              <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                Date Declined: {new Date(quotation.rejectedAt).toLocaleString()}
              </span>
            )}
            {quotation.rejectionReason && (
              <span style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
                <strong>Reason:</strong> {quotation.rejectionReason}
              </span>
            )}
          </div>
        )}

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

        {/* Requirements Status & Action Callout */}
        <div style={{
          padding: '1rem 1.15rem',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '0px',
          background: reqStatus === 'approved' ? '#f0fdf4' : reqStatus === 'submitted' ? '#eff6ff' : reqStatus === 'changes_requested' ? '#fff1f2' : '#fffbeb',
          borderColor: reqStatus === 'approved' ? '#bbf7d0' : reqStatus === 'submitted' ? '#bfdbfe' : reqStatus === 'changes_requested' ? '#fecaca' : '#fde68a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
            <i
              className={`fa-solid ${reqStatus === 'approved' ? 'fa-shield-check' : reqStatus === 'submitted' ? 'fa-clock-rotate-left' : reqStatus === 'changes_requested' ? 'fa-triangle-exclamation' : 'fa-clipboard-list'}`}
              style={{
                fontSize: '1.25rem',
                marginTop: '0.15rem',
                color: reqStatus === 'approved' ? '#16a34a' : reqStatus === 'submitted' ? '#2563eb' : reqStatus === 'changes_requested' ? '#dc2626' : '#d97706'
              }}
            />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                {reqStatus === 'approved' && '✓ Service Requirements Approved'}
                {reqStatus === 'submitted' && 'Requirements Submitted · Pending Operator Review'}
                {reqStatus === 'changes_requested' && 'Correction Required on Submitted Requirements'}
                {reqStatus === 'pending' && 'Requirements Required Before Acceptance'}
                {reqStatus === 'not_required' && 'No Document Requirements Needed'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
                {reqStatus === 'approved' && 'Your documents have been verified and approved by the branch operator. You may now accept this quotation and proceed to payment.'}
                {reqStatus === 'submitted' && 'Your documents have been submitted and are currently being reviewed by the operator. Acceptance will unlock once approved.'}
                {reqStatus === 'changes_requested' && (quotation.requirementsRemarks || quotation.requirementsRejectionReason || 'Please review and resubmit the requested documents.')}
                {reqStatus === 'pending' && 'This service requires verification documents (such as IDs or legal forms). Please attach them to unlock quotation acceptance.'}
                {reqStatus === 'not_required' && 'No document requirements apply. You can accept this quotation and proceed directly to payment.'}
              </p>
            </div>
          </div>

          {/* Action button if pending or changes requested */}
          {(reqStatus === 'pending' || reqStatus === 'changes_requested') && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAttachModal(true)}
              style={{ background: 'var(--brand-primary, #6366f1)', borderRadius: '0px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-file-arrow-up"></i>
              <span>{reqStatus === 'changes_requested' ? 'Update Requirements' : 'Attach Requirements'}</span>
            </button>
          )}
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
        {displayRequirements.length > 0 && (
          <div className="quote-modal-section">
            <div className="quote-section-heading">
              <i className="fa-solid fa-clipboard-check"></i>
              Submitted Client Requirements & Documents
              {loadingReqs && <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7, marginLeft: '0.5rem' }}>(Loading...)</span>}
            </div>
            <div className="quote-reqs-grid">
              {displayRequirements.map((req, rIdx) => {
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
                          <button
                            type="button"
                            className="quote-img-thumb-link"
                            title={`View in Lightbox: ${fileName || reqName}`}
                            onClick={() =>
                              openLightbox({
                                imageUrl: fileUrl,
                                title: fileName || reqName,
                                subtitle: `Quotation Requirement · ${quotation.serviceTitle || quotation.quoteNo || 'Quotation'}`
                              })
                            }
                          >
                            <img src={fileUrl} alt={fileName || reqName} className="quote-img-thumb" />
                          </button>
                        )}
                        {isImage ? (
                          <button
                            type="button"
                            className="quote-file-link"
                            title={`View in Lightbox: ${fileName || reqName}`}
                            onClick={() =>
                              openLightbox({
                                imageUrl: fileUrl,
                                title: fileName || reqName,
                                subtitle: `Quotation Requirement · ${quotation.serviceTitle || quotation.quoteNo || 'Quotation'}`
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
                            className="quote-file-link"
                            title={fileName ? `Open ${fileName}` : 'View Attached File'}
                          >
                            <i className="fa-solid fa-file-arrow-down"></i>
                            <span>{fileName || 'View Attached Document'}</span>
                          </a>
                        )}
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
        {(quotation.operatorRemarks || quotation.remarks) && (
          <div className="quote-modal-section" style={{ background: 'var(--warning-yellow-light, #fffbeb)', borderColor: '#fde68a' }}>
            <div className="quote-section-heading" style={{ color: '#b45309' }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#d97706' }}></i>
              Operator Remarks & Payment Terms
            </div>
            <div className="quote-text-block" style={{ color: '#78350f' }}>
              {quotation.operatorRemarks || quotation.remarks}
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
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    onClose();
                    onRejectQuotation && onRejectQuotation(quotation);
                  }}
                  style={{
                    borderRadius: '0px',
                    borderColor: '#fca5a5',
                    color: '#b91c1c',
                    background: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                  <span>Reject Quotation</span>
                </button>

                {canAccept ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-accept"
                    onClick={() => {
                      onClose();
                      onAcceptQuotation && onAcceptQuotation(quotation);
                    }}
                    disabled={isAccepting}
                    style={{ borderRadius: '0px' }}
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Accept & Proceed to Pay</span>
                  </button>
                ) : reqStatus === 'submitted' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: '0px'
                    }}
                  >
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>Requirements Under Review</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAttachModal(true)}
                    style={{ background: 'var(--brand-primary, #6366f1)', borderRadius: '0px' }}
                  >
                    <i className="fa-solid fa-file-arrow-up"></i>
                    <span>{reqStatus === 'changes_requested' ? 'Update Requirements' : 'Attach Requirements to Accept'}</span>
                  </button>
                )}
              </>
            )}

            {isRejected && (
              <span
                style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '0px'
                }}
              >
                <i className="fa-solid fa-ban"></i>
                <span>Proposal Rejected</span>
              </span>
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

            {isFulfilled ? (
              <span className="quote-paid-notice" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>
                <i className="fa-solid fa-trophy"></i> Fulfilled · Service Completed
              </span>
            ) : isPaid ? (
              <span className="quote-paid-notice">
                <i className="fa-solid fa-circle-check"></i> Paid · Custom Service Active
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {showAttachModal && (
        <QuotationAttachRequirementsModal
          isOpen={showAttachModal}
          onClose={() => setShowAttachModal(false)}
          quotation={quotation}
          onSuccess={() => {
            setShowAttachModal(false);
          }}
        />
      )}
    </BaseModal>
  );
}
