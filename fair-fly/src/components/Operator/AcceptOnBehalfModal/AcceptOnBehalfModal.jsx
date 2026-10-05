import React, { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { acceptQuotation } from '../../../services/quotationService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './accept-on-behalf-modal.css';

export default function AcceptOnBehalfModal({
  isOpen,
  onClose,
  quotation,
  onAcceptSuccess,
}) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [confirmedAuth, setConfirmedAuth] = useState(false);
  const [proceedToPayment, setProceedToPayment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmedAuth(false);
      setProceedToPayment(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!quotation) return null;

  const totalAmt = Number(quotation.totalAmount || quotation.rate || 0);
  const requirementsApproved = quotation?.requirementsStatus === 'approved' ||
    quotation?.requirementsStatus === 'not_required';

  const handleConfirm = () => {
    if (!requirementsApproved) {
      addToast(
        `Cannot accept quotation: Service requirements must be verified and approved first (Current: "${(quotation.requirementsStatus || 'pending').replace('_', ' ')}").`,
        'warning'
      );
      return;
    }

    if (!confirmedAuth) {
      addToast('Please confirm client authorization before proceeding.', 'warning');
      return;
    }

    setIsSubmitting(true);
    acceptQuotation(
      userToken,
      quotation.id,
      (res) => {
        setIsSubmitting(false);
        addToast('Quotation accepted on behalf of client!', 'success');
        onClose();
        if (onAcceptSuccess) {
          onAcceptSuccess({
            ...res,
            proceedToPayment,
          });
        }
      },
      (err) => {
        setIsSubmitting(false);
        console.error('Error accepting quotation on behalf:', err);
        addToast(toFriendlyMessage(err, 'Failed to accept quotation. Please try again.'), 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={
        <div className="accept-modal-header-title">
          <i className="fa-solid fa-handshake"></i>
          <span>Accept Quotation on Behalf of Client</span>
        </div>
      }
      subtitle={`Quotation ${quotation.quoteNo || ''} · ${quotation.clientName || 'Client'}`}
      maxWidth="48rem"
      width="95%"
      isLoading={isSubmitting}
    >
      <div className="accept-modal-content">
        {/* Quotation Summary Card */}
        <div className="accept-summary-card">
          <div className="accept-summary-header">
            <div>
              <span className="accept-quote-pill">
                <i className="fa-solid fa-file-invoice"></i> {quotation.quoteNo || 'ADF-07-001'}
              </span>
              <h3 className="accept-service-title">{quotation.serviceTitle || 'Custom Service Package'}</h3>
              <div className="accept-client-info">
                <span><i className="fa-solid fa-user"></i> {quotation.clientName || 'Walk-in Client'}</span>
                {quotation.branchName && (
                  <span><i className="fa-solid fa-building"></i> {quotation.branchName}</span>
                )}
              </div>
            </div>

            <div className="accept-total-box">
              <span className="accept-total-label">Contract Amount</span>
              <div className="accept-total-amount">
                <span className="currency-symbol">₱</span>
                {totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Walk-in Authorization Callout */}
        <div className="accept-callout-box">
          <div className="accept-callout-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="accept-callout-text">
            <strong>Operator-Assisted Acceptance (On-Site Client)</strong>
            <p>
              You are accepting this quotation on behalf of the client. This will mark the quotation as <strong>Accepted</strong>, update the client tracking record, and unlock immediate payment recording.
            </p>
          </div>
        </div>

        {/* Next Step Workflow Radio Selection */}
        <div className="accept-next-step-section">
          <label className="accept-section-label">Next Action Upon Acceptance *</label>
          <div className="accept-workflow-radios" role="radiogroup" aria-label="Next Step After Acceptance">
            <label
              className={`accept-radio-card ${proceedToPayment ? 'active' : ''}`}
              onClick={() => setProceedToPayment(true)}
            >
              <input
                type="radio"
                name="proceedOption"
                checked={proceedToPayment}
                onChange={() => setProceedToPayment(true)}
                className="accept-radio-input"
                disabled={isSubmitting}
              />
              <div className="accept-radio-body">
                <span className="accept-radio-title">
                  <i className="fa-solid fa-cash-register" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>
                  Proceed Immediately to Payment (Recommended)
                </span>
                <span className="accept-radio-desc">
                  Open the payment modal right away to collect Direct Cash or present PayMongo QR code.
                </span>
              </div>
            </label>

            <label
              className={`accept-radio-card ${!proceedToPayment ? 'active' : ''}`}
              onClick={() => setProceedToPayment(false)}
            >
              <input
                type="radio"
                name="proceedOption"
                checked={!proceedToPayment}
                onChange={() => setProceedToPayment(false)}
                className="accept-radio-input"
                disabled={isSubmitting}
              />
              <div className="accept-radio-body">
                <span className="accept-radio-title">
                  <i className="fa-solid fa-file-lines" style={{ color: 'var(--purple, #7c3aed)' }}></i>
                  Accept Only (Record Payment Later)
                </span>
                <span className="accept-radio-desc">
                  Mark quotation as Accepted without opening payment collection immediately.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Client Authorization Checkbox */}
        <label className="accept-confirm-checkbox-label">
          <input
            type="checkbox"
            checked={confirmedAuth}
            onChange={(e) => setConfirmedAuth(e.target.checked)}
            className="accept-checkbox-input"
            disabled={isSubmitting}
          />
          <span className="accept-checkbox-text">
            I verify that the client has reviewed and explicitly authorized acceptance of this quotation and consented to the total rate, inclusions, exclusions, and payment terms (ADF-07-001).
          </span>
        </label>

        {!requirementsApproved && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '0px'
          }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>
              Service requirements must be verified and approved first (Status: <strong>{(quotation.requirementsStatus || 'pending').replace('_', ' ').toUpperCase()}</strong>) before this quotation can be accepted.
            </span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="accept-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary accept-submit-btn"
            onClick={handleConfirm}
            disabled={isSubmitting || !confirmedAuth || !requirementsApproved}
            style={{
              background: (confirmedAuth && requirementsApproved) ? 'var(--green, #16a34a)' : '#94a3b8',
              borderColor: (confirmedAuth && requirementsApproved) ? 'var(--green, #16a34a)' : '#94a3b8',
              cursor: (confirmedAuth && requirementsApproved) ? 'pointer' : 'not-allowed',
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check"></i>
                <span>Confirm Acceptance & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
