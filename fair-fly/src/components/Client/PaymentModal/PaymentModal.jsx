import React, { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { createCheckoutSession } from '../../../services/paymentService';
import './payment-modal.css';

export default function PaymentModal({ isOpen, onClose, quotation }) {
  const { userToken } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!quotation) return null;

  const totalAmt = Number(quotation.totalAmount || quotation.rate || 0);

  const handleProceedToPayment = () => {
    if (!quotation?.id || !userToken) {
      setErrorMessage('Missing authentication or quotation reference.');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    createCheckoutSession(
      userToken,
      quotation.id,
      (response) => {
        setIsProcessing(false);
        if (response?.checkoutUrl) {
          // Redirect client to PayMongo secure hosted checkout page
          window.location.href = response.checkoutUrl;
        } else {
          setErrorMessage('Unable to initialize PayMongo checkout URL. Please try again.');
        }
      },
      (error) => {
        setIsProcessing(false);
        console.error('Error creating checkout session:', error);
        setErrorMessage(
          error?.message || 'Payment gateway initialization failed. Please contact FairFly support.'
        );
      }
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !isProcessing && onClose()}
      title="Secure Checkout & Payment"
      subtitle="FairFly Official Payment Gateway · Powered by PayMongo"
      size="medium"
    >
      <div className="payment-modal-content">
        {/* Error notification */}
        {errorMessage && (
          <div className="payment-error-banner" role="alert">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quotation Summary Card */}
        <div className="payment-summary-card">
          <div className="payment-summary-header">
            <div>
              <span className="payment-quote-badge">
                <i className="fa-solid fa-file-invoice"></i> {quotation.quoteNo || 'Quotation'}
              </span>
              <h3 className="payment-service-title">{quotation.serviceTitle || 'Custom Service Package'}</h3>
              <span className="payment-branch-name">
                <i className="fa-solid fa-building"></i> {quotation.branchName || 'FairFly Travel & Tours'}
              </span>
            </div>

            <div className="payment-total-box">
              <span className="payment-total-label">Total Due</span>
              <div className="payment-total-amount">
                <span className="payment-currency">₱</span>
                {totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="payment-details-grid">
            <div className="payment-detail-item">
              <span className="payment-detail-label">Schedule / Tour Dates</span>
              <span className="payment-detail-val">{quotation.tourDates || 'As scheduled'}</span>
            </div>

            {quotation.inclusions && (
              <div className="payment-detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="payment-detail-label">Package Inclusions</span>
                <span className="payment-detail-val" style={{ whiteSpace: 'pre-line' }}>{quotation.inclusions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Available via PayMongo Sandbox */}
        <div className="payment-methods-section">
          <div className="payment-methods-title">
            <i className="fa-solid fa-wallet" style={{ color: 'var(--purple, #7c3aed)' }}></i>
            Accepted Payment Channels
          </div>

          <div className="payment-methods-grid">
            <div className="payment-method-pill gcash">
              <i className="fa-solid fa-mobile-screen-button"></i>
              <span className="payment-method-name">GCash</span>
              <span className="payment-method-sub">e-Wallet</span>
            </div>

            <div className="payment-method-pill qrph">
              <i className="fa-solid fa-qrcode"></i>
              <span className="payment-method-name">QR Ph</span>
              <span className="payment-method-sub">BSP Standard</span>
            </div>

            <div className="payment-method-pill maya">
              <i className="fa-solid fa-wallet"></i>
              <span className="payment-method-name">Maya</span>
              <span className="payment-method-sub">e-Wallet</span>
            </div>

            <div className="payment-method-pill card">
              <i className="fa-regular fa-credit-card"></i>
              <span className="payment-method-name">Cards</span>
              <span className="payment-method-sub">Visa / Master</span>
            </div>

            <div className="payment-method-pill billease">
              <i className="fa-solid fa-calendar-check"></i>
              <span className="payment-method-name">BillEase</span>
              <span className="payment-method-sub">Buy Now, Pay Later</span>
            </div>

            <div className="payment-method-pill grabpay">
              <i className="fa-solid fa-car-side"></i>
              <span className="payment-method-name">GrabPay</span>
              <span className="payment-method-sub">e-Wallet</span>
            </div>
          </div>
        </div>

        {/* Zero-Trust Security Callout */}
        <div className="payment-trust-callout">
          <i className="fa-solid fa-shield-halved"></i>
          <div className="payment-trust-text">
            <strong>Server-Verified Transaction Protection</strong>
            Your payment amount is derived strictly by FairFly's secure server. Transactions are encrypted using 256-bit SSL and authenticated by PayMongo Philippines.
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="payment-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>

          <button
            type="button"
            className="payment-submit-btn"
            onClick={handleProceedToPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Redirecting to PayMongo...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock"></i>
                <span>Proceed to Pay ₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
