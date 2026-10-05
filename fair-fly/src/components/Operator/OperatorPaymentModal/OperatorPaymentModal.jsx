import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ConfirmationModal from '../../Admin/Modals/ConfirmationModal/ConfirmationModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { recordCashPayment, createCheckoutSession, verifyPayment } from '../../../services/paymentService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-payment-modal.css';

export default function OperatorPaymentModal({ isOpen, onClose, quotation, onPaymentSuccess }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('direct_cash'); // 'direct_cash' | 'paymongo_qr'
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [cashRemarks, setCashRemarks] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // PayMongo Session state
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [fulfillmentId, setFulfillmentId] = useState(null);
  const [completedPaymentId, setCompletedPaymentId] = useState(null);

  // Reset state on open/quotation change
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('direct_cash');
      setCashConfirmed(false);
      setCashRemarks('');
      setCheckoutSession(null);
      setPaymentCompleted(false);
      setFulfillmentId(null);
      setCompletedPaymentId(null);
    }
  }, [isOpen, quotation?.id]);

  if (!quotation) return null;

  const totalAmt = Number(quotation.totalAmount || quotation.rate || 0);

  // 1. Direct Cash Payment Handler
  const handleConfirmCashPayment = () => {
    if (!cashConfirmed) {
      addToast('Please check the confirmation box acknowledging receipt of cash', 'warning');
      return;
    }

    setIsProcessing(true);
    recordCashPayment(
      userToken,
      {
        quotationId: quotation.id,
        remarks: cashRemarks.trim() || 'Direct cash payment received at branch'
      },
      (res) => {
        setIsProcessing(false);
        setShowConfirmModal(false);
        setPaymentCompleted(true);
        setFulfillmentId(res.fulfillmentId);
        setCompletedPaymentId(res.paymentId);
        addToast('Cash payment confirmed and recorded! Service fulfillment activated.', 'success');
        if (onPaymentSuccess) {
          onPaymentSuccess(res);
        }
      },
      (err) => {
        setIsProcessing(false);
        setShowConfirmModal(false);
        console.error('Error recording cash payment:', err);
        addToast(toFriendlyMessage(err, 'Failed to record cash payment. Please try again.'), 'error');
      }
    );
  };

  // 2. PayMongo QR Checkout Session Handler
  const handleInitiatePaymongo = () => {
    setIsProcessing(true);
    createCheckoutSession(
      userToken,
      quotation.id,
      (res) => {
        setIsProcessing(false);
        if (res?.checkoutUrl) {
          setCheckoutSession(res);
          addToast('PayMongo checkout session initialized. Present the QR/link to the client.', 'info');
        } else {
          addToast('Could not retrieve PayMongo checkout URL. Please try again.', 'error');
        }
      },
      (err) => {
        setIsProcessing(false);
        console.error('Error initiating PayMongo checkout for operator:', err);
        addToast(toFriendlyMessage(err, 'Failed to generate PayMongo session.'), 'error');
      }
    );
  };

  // 3. Verify Payment Status Handler
  const handleVerifyPayment = (silent = false) => {
    const payId = checkoutSession?.paymentId || quotation.paymentId;
    if (!payId) {
      if (!silent) addToast('No active payment reference to verify.', 'warning');
      return;
    }

    if (!silent) setIsVerifying(true);
    verifyPayment(
      userToken,
      payId,
      (res) => {
        if (!silent) setIsVerifying(false);
        if (res.status === 'PAID') {
          setPaymentCompleted(true);
          setFulfillmentId(res.fulfillmentId);
          setCompletedPaymentId(payId);
          addToast('Payment verified successfully! Service fulfillment activated.', 'success');
          if (onPaymentSuccess) {
            onPaymentSuccess(res);
          }
        } else if (!silent) {
          addToast(res.message || 'Payment is still awaiting client completion.', 'warning');
        }
      },
      (err) => {
        if (!silent) {
          setIsVerifying(false);
          console.error('Error verifying payment:', err);
          addToast(toFriendlyMessage(err, 'Failed to verify payment status.'), 'error');
        }
      }
    );
  };

  // Auto-polling for PayMongo when session is active
  useEffect(() => {
    if (!isOpen || paymentCompleted || !checkoutSession?.paymentId) return;

    const interval = setInterval(() => {
      handleVerifyPayment(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [isOpen, paymentCompleted, checkoutSession?.paymentId]);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={() => !isProcessing && onClose()}
        title={
          <div className="op-payment-modal-title">
            <i className="fa-solid fa-cash-register"></i>
            <span>Process Client Payment</span>
          </div>
        }
        subtitle={`Quotation ${quotation.quoteNo || ''} · ${quotation.clientName || 'Client'}`}
        size="medium"
      >
        <div className="op-payment-modal-content">
          {paymentCompleted ? (
            /* Success State */
            <div className="op-payment-success-card">
              <div className="op-payment-success-icon">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h3 className="op-payment-success-title">Payment Confirmed & Recorded!</h3>
              <p className="op-payment-success-sub">
                The payment for <strong>{quotation.quoteNo}</strong> ({quotation.serviceTitle}) was successfully processed.
                Service fulfillment has been instantiated in Ongoing Services.
              </p>

              <div className="op-payment-success-meta">
                <div className="op-payment-meta-row">
                  <span>Payment Amount:</span>
                  <strong>₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="op-payment-meta-row">
                  <span>Method:</span>
                  <strong>{paymentMethod === 'direct_cash' ? 'Direct Cash Payment' : 'PayMongo QR / Online'}</strong>
                </div>
                {completedPaymentId && (
                  <div className="op-payment-meta-row">
                    <span>Payment Ref:</span>
                    <code className="text-mono">{completedPaymentId}</code>
                  </div>
                )}
                {fulfillmentId && (
                  <div className="op-payment-meta-row">
                    <span>Active Service ID:</span>
                    <code className="text-mono text-bold-purple">{fulfillmentId}</code>
                  </div>
                )}
              </div>

              <div className="op-payment-success-actions">
                {fulfillmentId && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onClose();
                      navigate(`/operator/ongoing-services/${fulfillmentId}`);
                    }}
                  >
                    <i className="fa-solid fa-gears"></i>
                    <span>View Ongoing Service</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Payment Workflow */
            <>
              {/* Quotation Payable Summary */}
              <div className="op-payment-summary-card">
                <div className="op-payment-summary-header">
                  <div>
                    <span className="op-payment-badge">
                      <i className="fa-solid fa-file-invoice"></i> {quotation.quoteNo || 'Quotation'}
                    </span>
                    <h3 className="op-payment-service-title">{quotation.serviceTitle || 'Service Package'}</h3>
                    <div className="op-payment-client-row">
                      <span><i className="fa-solid fa-user"></i> {quotation.clientName || 'Walk-in Client'}</span>
                      <span><i className="fa-solid fa-building"></i> {quotation.branchName || 'Branch Office'}</span>
                    </div>
                  </div>

                  <div className="op-payment-total-box">
                    <span className="op-payment-total-label">Total Payable</span>
                    <div className="op-payment-total-amount">
                      <span className="currency-symbol">₱</span>
                      {totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Radio Cards */}
              <div className="op-payment-method-radios" role="radiogroup" aria-label="Select Payment Method">
                <label
                  className={`op-payment-radio-card ${paymentMethod === 'direct_cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('direct_cash')}
                >
                  <input
                    type="radio"
                    name="operatorPaymentMethod"
                    value="direct_cash"
                    checked={paymentMethod === 'direct_cash'}
                    onChange={() => setPaymentMethod('direct_cash')}
                    className="op-payment-radio-input"
                    disabled={isProcessing}
                  />
                  <div className="tab-icon-wrap">
                    <i className="fa-solid fa-money-bill-wave"></i>
                  </div>
                  <div className="tab-text-wrap">
                    <span className="tab-title">Direct Cash Payment (Walk-in Clients)</span>
                    <span className="tab-desc">Record physical cash payment received at branch</span>
                  </div>
                </label>

                <label
                  className={`op-payment-radio-card ${paymentMethod === 'paymongo_qr' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('paymongo_qr')}
                >
                  <input
                    type="radio"
                    name="operatorPaymentMethod"
                    value="paymongo_qr"
                    checked={paymentMethod === 'paymongo_qr'}
                    onChange={() => setPaymentMethod('paymongo_qr')}
                    className="op-payment-radio-input"
                    disabled={isProcessing}
                  />
                  <div className="tab-icon-wrap">
                    <i className="fa-solid fa-qrcode"></i>
                  </div>
                  <div className="tab-text-wrap">
                    <span className="tab-title">PayMongo Online Payment (Dynamic QR Ph Code)</span>
                    <span className="tab-desc">Generate real-time QR Ph code for GCash, Maya, Cards</span>
                  </div>
                </label>
              </div>

              {/* METHOD 1: Direct Cash Form */}
              {paymentMethod === 'direct_cash' && (
                <div className="op-cash-payment-section">
                  <div className="op-cash-callout">
                    <i className="fa-solid fa-hand-holding-dollar"></i>
                    <div>
                      <strong>Walk-in Cash Collection Verification</strong>
                      <p>
                        Confirm receipt of physical cash from the client before recording. Once confirmed,
                        the payment record is persisted in Firestore and sequential service fulfillment is initialized.
                      </p>
                    </div>
                  </div>

                  <div className="op-cash-input-group">
                    <label className="op-cash-label">Official Receipt / Remarks (Optional)</label>
                    <input
                      type="text"
                      className="op-cash-input"
                      placeholder="e.g., OR #48291 / Cash received at counter"
                      value={cashRemarks}
                      onChange={(e) => setCashRemarks(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  <label className="op-cash-checkbox-row">
                    <input
                      type="checkbox"
                      checked={cashConfirmed}
                      onChange={(e) => setCashConfirmed(e.target.checked)}
                      disabled={isProcessing}
                    />
                    <span>
                      I explicitly confirm that cash payment of <strong>₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> has been received in full from <strong>{quotation.clientName}</strong>.
                    </span>
                  </label>

                  <div className="op-payment-actions-footer">
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
                      className="btn btn-primary op-cash-submit-btn"
                      disabled={!cashConfirmed || isProcessing}
                      onClick={() => setShowConfirmModal(true)}
                    >
                      {isProcessing ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>Recording Cash...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check-double"></i>
                          <span>Confirm & Record Cash Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* METHOD 2: PayMongo QR Form */}
              {paymentMethod === 'paymongo_qr' && (
                <div className="op-paymongo-section">
                  {/* Channels Pill Grid */}
                  <div className="op-paymongo-channels-grid">
                    <div className="op-pm-pill">
                      <img src="/paymentMethods/qrph.svg" alt="QR Ph" />
                      <span>QR Ph</span>
                    </div>
                    <div className="op-pm-pill">
                      <img src="/paymentMethods/gcash.svg" alt="GCash" />
                      <span>GCash</span>
                    </div>
                    <div className="op-pm-pill">
                      <img src="/paymentMethods/maya.svg" alt="Maya" />
                      <span>Maya</span>
                    </div>
                    <div className="op-pm-pill">
                      <img src="/paymentMethods/card.svg" alt="Cards" />
                      <span>Cards</span>
                    </div>
                  </div>

                  {!checkoutSession ? (
                    <div className="op-paymongo-init-box">
                      <p>
                        Generate a secure PayMongo QR / Checkout session for <strong>₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.
                        You can present the dynamic QR code on screen for the client to scan with their banking or e-wallet app.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary op-generate-pm-btn"
                        onClick={handleInitiatePaymongo}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>Generating QR Checkout...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-qrcode"></i>
                            <span>Generate PayMongo QR Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="op-paymongo-active-session">
                      <div className="op-pm-status-banner">
                        <div className="op-pm-status-indicator">
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        </div>
                        <div>
                          <strong>Awaiting Client Payment</strong>
                          <p>Reference: <code className="text-mono">{checkoutSession.paymentId}</code></p>
                        </div>
                      </div>

                      <div className="op-pm-link-box">
                        <input
                          type="text"
                          readOnly
                          value={checkoutSession.checkoutUrl}
                          className="op-pm-link-input"
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Copy Link"
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutSession.checkoutUrl);
                            addToast('PayMongo checkout link copied to clipboard', 'info');
                          }}
                        >
                          <i className="fa-solid fa-copy"></i>
                        </button>
                      </div>

                      <div className="op-pm-action-buttons">
                        <a
                          href={checkoutSession.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary op-open-checkout-btn"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          <span>Open QR Code / Checkout Screen for Client</span>
                        </a>

                        <button
                          type="button"
                          className="btn btn-secondary op-verify-btn"
                          onClick={() => handleVerifyPayment(false)}
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-rotate-right"></i>
                          )}
                          <span>Check / Verify Payment Now</span>
                        </button>
                      </div>

                      <p className="op-pm-auto-poll-hint">
                        <i className="fa-solid fa-circle-info"></i> The system automatically checks payment status every few seconds.
                      </p>
                    </div>
                  )}

                  <div className="op-payment-actions-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                      disabled={isProcessing}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BaseModal>

      {/* Confirmation Modal for Direct Cash */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => !isProcessing && setShowConfirmModal(false)}
        icon="fa-solid fa-money-bill-wave"
        title="Confirm Cash Receipt"
        message={`Confirm receipt of ₱${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cash in full from ${quotation.clientName || 'the client'} for Quotation ${quotation.quoteNo}? This will record the payment and initialize service fulfillment.`}
        confirmText="Confirm & Activate Service"
        cancelText="Cancel"
        onConfirm={handleConfirmCashPayment}
        isLoading={isProcessing}
      />
    </>
  );
}
