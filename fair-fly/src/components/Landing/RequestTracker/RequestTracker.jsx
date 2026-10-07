import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { fetchPublicTracking } from '../../../services/trackingService';
import { fetchPublicReceipt } from '../../../services/receiptService';
import PdfDocumentView from '../../Shared/PdfDocument/PdfDocumentView';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './request-tracker.css';

const SAMPLE_CODES = ['SRV-2026-000123', 'SRV-2026-784291', 'SRV-2026-9B3E2F'];

export default function RequestTracker({ hideHeader = false }) {
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // E-Receipt modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptDocData, setReceiptDocData] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Auto-track on mount if URL contains tracking parameters (e.g. from QR scan)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let queryVal = searchParams.get('trackingId') ||
        searchParams.get('serviceCode') ||
        searchParams.get('code');

      if (!queryVal && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        queryVal = hashParams.get('trackingId') ||
          hashParams.get('serviceCode') ||
          hashParams.get('code');
      }

      if (queryVal && queryVal.trim()) {
        const clean = queryVal.trim();
        setTrackingInput(clean);
        performTrackLookup(clean);

        // Smoothly scroll to the tracker section if on landing page
        const trackerElem = document.getElementById('track-request');
        if (trackerElem) {
          trackerElem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.warn('[RequestTracker] Error parsing URL tracking params:', err);
    }
  }, []);

  // Real-time onSnapshot subscription + resilient periodic background reconciliation
  useEffect(() => {
    if (!trackingData) return;

    const unsubscribers = [];

    // 1. Subscribe to Active Service fulfillment document (milestones / steps progression)
    if (trackingData.fulfillmentId) {
      const activeServiceDocRef = doc(db, 'activeServices', trackingData.fulfillmentId);
      const unsubService = onSnapshot(
        activeServiceDocRef,
        (docSnap) => {
          if (!docSnap.exists()) return;
          const serviceDoc = docSnap.data();

          const rawSteps = serviceDoc.steps || [];
          const sanitizedSteps = Array.isArray(rawSteps)
            ? rawSteps.map((st, idx) => ({
                stepNumber: st.stepNumber || idx + 1,
                title: st.title || `Milestone ${idx + 1}`,
                description: st.description || '',
                status: st.status || 'Pending',
                completedAt: st.completedAt || null,
                hasLink: Boolean(st.thirdPartyLink || st.link)
              }))
            : [];

          const sStatus = (serviceDoc.status || '').toLowerCase();
          let currentStage = 4;
          let statusLabel = 'In Progress · Milestone Processing';
          let statusType = 'primary';
          let statusDescription = 'Your service is actively being processed by our branch operators.';

          if (sStatus === 'completed') {
            currentStage = 5;
            statusLabel = 'Service Completed';
            statusType = 'success';
            statusDescription = 'All milestones have been successfully completed and documents are ready.';
          } else if (sStatus === 'cancelled') {
            currentStage = 4;
            statusLabel = 'Service Cancelled';
            statusType = 'danger';
            statusDescription = 'This service request was cancelled. Please contact your handling branch.';
          }

          const updatedTimeline = [
            { stageNumber: 1, title: 'Request Intake', desc: 'Inquiry and requirements submitted', isCompleted: currentStage > 1, isCurrent: currentStage === 1 },
            { stageNumber: 2, title: 'Branch Assessment', desc: 'Specialists review documentation and itinerary', isCompleted: currentStage > 2, isCurrent: currentStage === 2 },
            { stageNumber: 3, title: 'Quotation Issued', desc: 'Official quotation prepared and ready', isCompleted: currentStage > 3, isCurrent: currentStage === 3 },
            { stageNumber: 4, title: 'Service Processing', desc: 'Executing procedure milestones & embassy filings', isCompleted: currentStage > 4, isCurrent: currentStage === 4 },
            { stageNumber: 5, title: 'Delivery & Release', desc: 'Fulfillment completed and documents delivered', isCompleted: currentStage === 5, isCurrent: currentStage === 5 }
          ];

          setTrackingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              steps: sanitizedSteps,
              currentStage,
              status: statusLabel,
              statusType,
              statusDescription,
              timeline: updatedTimeline,
              serviceCode: serviceDoc.serviceCode || prev.serviceCode,
              lastUpdated: serviceDoc.updatedAt || new Date().toISOString()
            };
          });
        },
        (err) => {
          console.warn('[RequestTracker] activeServices onSnapshot error:', err);
        }
      );
      unsubscribers.push(unsubService);
    }

    // 2. Subscribe to Quotation document (payment status / activation)
    if (trackingData.quotation?.id) {
      const quoteDocRef = doc(db, 'quotations', trackingData.quotation.id);
      const unsubQuote = onSnapshot(
        quoteDocRef,
        (docSnap) => {
          if (!docSnap.exists()) return;
          const quoteDoc = docSnap.data();

          setTrackingData((prev) => {
            if (!prev) return prev;
            const isPaid = (quoteDoc.paymentStatus || '').toUpperCase() === 'PAID' || (quoteDoc.status || '').toUpperCase() === 'PAID';
            const newFulfillmentId = quoteDoc.activeServiceId || prev.fulfillmentId;

            return {
              ...prev,
              fulfillmentId: newFulfillmentId,
              serviceCode: quoteDoc.serviceCode || prev.serviceCode,
              quotation: {
                ...prev.quotation,
                status: quoteDoc.status || prev.quotation?.status,
                paymentStatus: quoteDoc.paymentStatus || (isPaid ? 'PAID' : prev.quotation?.paymentStatus),
                totalAmount: Number(quoteDoc.totalAmount || quoteDoc.rate || prev.quotation?.totalAmount || 0),
                inclusions: quoteDoc.inclusions || prev.quotation?.inclusions,
                tourDates: quoteDoc.tourDates || prev.quotation?.tourDates
              }
            };
          });
        },
        (err) => {
          console.warn('[RequestTracker] quotations onSnapshot error:', err);
        }
      );
      unsubscribers.push(unsubQuote);
    }

    // 3. Periodic background reconciliation (every 4s) to guarantee live sync even if websocket/onSnapshot is blocked by browser privacy features
    const lookupRef = trackingData.trackingReference || trackingData.serviceCode;
    let pollTimer = null;
    if (lookupRef) {
      pollTimer = setInterval(() => {
        fetchPublicTracking(
          lookupRef,
          (freshData) => {
            if (freshData) {
              setTrackingData((prev) => {
                if (!prev) return freshData;
                return {
                  ...prev,
                  ...freshData,
                  steps: freshData.steps || prev.steps,
                  timeline: freshData.timeline || prev.timeline,
                  status: freshData.status || prev.status,
                  statusType: freshData.statusType || prev.statusType,
                  statusDescription: freshData.statusDescription || prev.statusDescription,
                  currentStage: freshData.currentStage || prev.currentStage,
                  fulfillmentId: freshData.fulfillmentId || prev.fulfillmentId,
                  serviceCode: freshData.serviceCode || prev.serviceCode,
                  quotation: freshData.quotation ? { ...prev.quotation, ...freshData.quotation } : prev.quotation,
                  receipt: freshData.receipt ? { ...prev.receipt, ...freshData.receipt } : prev.receipt
                };
              });
            }
          },
          () => {},
          null
        );
      }, 4000);
    }

    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {}
      });
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [trackingData?.fulfillmentId, trackingData?.quotation?.id, trackingData?.trackingReference]);

  const performTrackLookup = (codeToSearch) => {
    const cleanId = (codeToSearch || '').trim();
    if (!cleanId) {
      setErrorMessage('Please enter a valid Service Tracking ID (e.g., SRV-2026-000123).');
      return;
    }

    const upper = cleanId.toUpperCase();
    if (upper.startsWith('QT-') || upper.startsWith('QUO-') || upper.startsWith('QTN-')) {
      setTrackingData(null);
      setErrorMessage('Quotation IDs cannot be tracked here. Only official Service Tracking IDs (e.g., SRV-2026-XXXXXX) are allowed on the public tracker.');
      return;
    }
    if (upper.startsWith('INQ-') || upper.startsWith('SAF-')) {
      setTrackingData(null);
      setErrorMessage('Inquiry reference codes cannot be tracked here. Only official Service Tracking IDs (e.g., SRV-2026-XXXXXX) are allowed on the public tracker.');
      return;
    }
    if (upper.startsWith('RCT-')) {
      setTrackingData(null);
      setErrorMessage('Receipt Numbers cannot be tracked directly. Please enter the Service Tracking ID (SRV-2026-XXXXXX) indicated on your receipt.');
      return;
    }

    setErrorMessage('');
    fetchPublicTracking(
      cleanId,
      (data) => {
        setTrackingData(data);
        setErrorMessage('');
      },
      (err) => {
        setTrackingData(null);
        setErrorMessage(
          toFriendlyMessage(
            err,
            'No active service found for this Tracking ID. Please verify your Service Tracking ID (SRV-2026-XXXXXX).'
          )
        );
      },
      setIsLoading
    );
  };

  const handleTrackSubmit = (e) => {
    if (e) e.preventDefault();
    performTrackLookup(trackingInput);
  };

  const handleSampleClick = (code) => {
    setTrackingInput(code);
    setErrorMessage('');
    performTrackLookup(code);
  };

  const handleReset = () => {
    setTrackingData(null);
    setTrackingInput('');
    setErrorMessage('');
    setReceiptDocData(null);
  };

  const handleOpenReceiptModal = () => {
    if (trackingData?.receipt) {
      // Direct receipt data from tracking response with quotation & client fallback enrichment
      const mergedReceipt = {
        ...trackingData.receipt,
        clientName: trackingData.receipt.clientName && trackingData.receipt.clientName !== 'Valued Client'
          ? trackingData.receipt.clientName
          : (trackingData.clientName || trackingData.quotation?.clientName || 'Valued Client'),
        contactPerson: trackingData.receipt.contactPerson || trackingData.contactPerson || trackingData.quotation?.contactPerson || '',
        clientEmail: trackingData.receipt.clientEmail || trackingData.quotation?.clientEmail || '',
        clientPhone: trackingData.receipt.clientPhone || trackingData.quotation?.clientPhone || '',
        quoteNo: trackingData.receipt.quoteNo || trackingData.quotation?.quoteNo || '',
        quotationId: trackingData.receipt.quotationId || trackingData.quotation?.id || '',
        paymentId: trackingData.receipt.paymentId || trackingData.quotation?.paymentId || (trackingData.receipt.receiptNo ? `PAY-${trackingData.receipt.receiptNo.replace('RCT-', '')}` : 'PAY-CONFIRMED'),
        serviceTitle: trackingData.receipt.serviceTitle || trackingData.serviceTitle || trackingData.quotation?.serviceTitle || 'Travel & Tour Package',
        branchName: trackingData.receipt.branchName || trackingData.branchName || 'FairFly Travel & Tours - Baliuag Branch',
        receivedByOperatorName: trackingData.receipt.receivedByOperatorName || trackingData.quotation?.preparedByName || trackingData.quotation?.preparedBy || 'Emmanuel Manlapig',
        tourDates: trackingData.receipt.tourDates || trackingData.quotation?.tourDates || 'As arranged with client',
        inclusions: trackingData.receipt.inclusions || trackingData.quotation?.inclusions || '',
        exclusions: trackingData.receipt.exclusions || trackingData.quotation?.exclusions || '',
        totalAmount: Number(trackingData.receipt.amount || trackingData.receipt.totalAmount || trackingData.quotation?.totalAmount || 0),
        amount: Number(trackingData.receipt.amount || trackingData.receipt.totalAmount || trackingData.quotation?.totalAmount || 0)
      };
      setReceiptDocData(mergedReceipt);
      setIsReceiptModalOpen(true);
      return;
    }

    // Otherwise fetch via public receipt endpoint
    const lookupCode = trackingData?.serviceCode ||
      trackingData?.quotation?.quoteNo ||
      trackingData?.trackingReference;

    if (!lookupCode) return;

    setIsLoadingReceipt(true);
    fetchPublicReceipt(
      lookupCode,
      (rctData) => {
        const enriched = {
          ...rctData,
          clientName: rctData.clientName && rctData.clientName !== 'Valued Client'
            ? rctData.clientName
            : (trackingData?.clientName || trackingData?.quotation?.clientName || 'Valued Client'),
          contactPerson: rctData.contactPerson || trackingData?.contactPerson || trackingData?.quotation?.contactPerson || '',
          quoteNo: rctData.quoteNo || trackingData?.quotation?.quoteNo || '',
          paymentId: rctData.paymentId || trackingData?.quotation?.paymentId || (rctData.receiptNo ? `PAY-${rctData.receiptNo.replace('RCT-', '')}` : 'PAY-CONFIRMED'),
          branchName: rctData.branchName || trackingData?.branchName || 'FairFly Travel & Tours - Baliuag Branch'
        };
        setReceiptDocData(enriched);
        setIsReceiptModalOpen(true);
      },
      (err) => {
        alert(toFriendlyMessage(err, 'Could not retrieve official E-Receipt record at this time.'));
      },
      setIsLoadingReceipt
    );
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(Number(val) || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <div className="request-tracker-container">

        {/* Section Header */}
        {!hideHeader && (
          <div className="tracker-header">
            <div className="tracker-badge">
              <span className="tracker-badge-dot" />
              <i className="fa-solid fa-magnifying-glass-location" />
              <span>Real-Time Request Tracker</span>
            </div>
            <h2 className="tracker-title">
              Track Your Travel Request <br />
              <span className="tracker-title-accent">Without Logging In</span>
            </h2>
            <p className="tracker-subtitle">
              Enter your official Service Tracking ID (e.g. SRV-2026-XXXXXX) to view live milestone updates from our branch operators.
            </p>
          </div>
        )}

        {/* Search Card */}
        <div className="tracker-search-card">
          <form className="tracker-search-form" onSubmit={handleTrackSubmit}>
            <div className="tracker-input-wrapper">
              <i className="fa-solid fa-barcode tracker-input-icon"></i>
              <input
                type="text"
                className="tracker-input"
                placeholder="Enter Service Tracking ID (e.g. SRV-2026-000123)..."
                value={trackingInput}
                disabled={isLoading}
                onChange={(e) => setTrackingInput(e.target.value)}
              />
              {trackingInput && (
                <button
                  type="button"
                  className="tracker-clear-btn"
                  title="Clear input"
                  onClick={() => setTrackingInput('')}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="tracker-submit-btn"
              disabled={isLoading || !trackingInput.trim()}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span>Track Status</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Examples & Helpers */}
          <div className="tracker-hints">
            <div className="tracker-chips-row">
              <span>Sample Tracking IDs:</span>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('SRV-2026-000123')}
                title="Click to fill sample Service Tracking ID"
              >
                SRV-2026-000123
              </button>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('SRV-2026-784291')}
                title="Click to fill sample Service Tracking ID"
              >
                SRV-2026-784291
              </button>
            </div>
            <span>No account required • Instant live sync</span>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="tracker-error-alert" role="alert">
              <i className="fa-solid fa-circle-exclamation"></i>
              <div>
                <strong>Notice:</strong> {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Result Card */}
        {trackingData && (
          <div className="tracker-result-card">

            {/* Result Header */}
            <div className="result-header">
              <div className="result-title-group">
                <div className="result-ref-row">
                  <span className="result-ref-code">REF: {trackingData.trackingReference}</span>
                  {trackingData.serviceCode && (
                    <span className="result-ref-code" style={{ background: '#dcfce7', color: '#15803d' }}>
                      CODE: {trackingData.serviceCode}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>
                    • {trackingData.foundType === 'quotation' ? 'Quotation Proposal' : trackingData.foundType === 'inquiry' ? 'Inquiry Intake' : 'Active Fulfillment'}
                  </span>
                </div>
                <h3 className="result-service-title">{trackingData.serviceTitle}</h3>
              </div>

              <div className={`result-status-pill ${trackingData.statusType}`}>
                <i className={
                  trackingData.statusType === 'success'
                    ? 'fa-solid fa-circle-check'
                    : trackingData.statusType === 'warning'
                      ? 'fa-solid fa-clock'
                      : trackingData.statusType === 'danger'
                        ? 'fa-solid fa-circle-xmark'
                        : 'fa-solid fa-spinner fa-spin'
                }></i>
                <span>{trackingData.status}</span>
              </div>
            </div>

            {/* Meta Info Grid */}
            <div className="result-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Handling Branch</span>
                <span className="meta-value">
                  <i className="fa-solid fa-building-flag" style={{ marginRight: '0.375rem', color: 'var(--purple)' }}></i>
                  {trackingData.branchName}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Customer Reference</span>
                <span className="meta-value">
                  <i className="fa-solid fa-user-check" style={{ marginRight: '0.375rem', color: 'var(--green)' }}></i>
                  {trackingData.clientName}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Date Submitted</span>
                <span className="meta-value">
                  <i className="fa-solid fa-calendar-day" style={{ marginRight: '0.375rem', color: 'var(--text-light)' }}></i>
                  {formatDate(trackingData.dateInitiated)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Current Phase</span>
                <span className="meta-value">
                  Stage {trackingData.currentStage} of {trackingData.totalStages}
                </span>
              </div>
            </div>

            {/* Official E-Receipt Callout Card (ADF-07-002) */}
            {(trackingData.receipt || trackingData.serviceCode || trackingData.quotation?.paymentStatus === 'PAID') && (
              <div className="receipt-callout-card">
                <div className="receipt-callout-left">
                  <div className="receipt-callout-badge">
                    <i className="fa-solid fa-receipt"></i>
                    <span>OFFICIAL E-RECEIPT ISSUED</span>
                  </div>
                  <div className="receipt-callout-details">
                    <span className="receipt-callout-no">
                      Receipt No: <strong>{trackingData.receipt?.receiptNo || 'ADF-07-002 (Authenticated)'}</strong>
                    </span>
                    {trackingData.serviceCode && (
                      <span className="receipt-callout-code">
                        Service Tracking Code: <code>{trackingData.serviceCode}</code>
                      </span>
                    )}
                    {trackingData.receipt?.amount && (
                      <span className="receipt-callout-amount">
                        Amount Paid: <strong>{formatCurrency(trackingData.receipt.amount)}</strong> via {trackingData.receipt.paymentMethod || 'Verified Payment'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-view-receipt-modal"
                  onClick={handleOpenReceiptModal}
                  disabled={isLoadingReceipt}
                >
                  {isLoadingReceipt ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Loading Receipt...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-invoice-dollar"></i>
                      <span>View Official E-Receipt</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 5-Stage Visual Stepper */}
            <div className="stepper-section">
              <div className="stepper-title">
                <i className="fa-solid fa-bars-progress" style={{ color: 'var(--purple)' }}></i>
                <span>Lifecycle Progression</span>
              </div>

              <div className="stepper-track">
                {trackingData.timeline.map((node) => {
                  const nodeClass = node.isCompleted ? 'completed' : node.isCurrent ? 'current' : 'pending';
                  return (
                    <div className={`stepper-node ${nodeClass}`} key={node.stageNumber}>
                      <div className="stepper-circle">
                        {node.isCompleted ? (
                          <i className="fa-solid fa-check"></i>
                        ) : node.isCurrent ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          node.stageNumber
                        )}
                      </div>
                      <span className="stepper-node-title">{node.title}</span>
                      <span className="stepper-node-desc">{node.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quotation Details Card (if quotation available) */}
            {trackingData.quotation && (
              <div className="quotation-callout-card">
                <div className="quote-row-header">
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                      Official Quotation Issued
                    </span>
                    <h4 style={{ margin: '0.125rem 0 0', color: 'var(--text-dark)' }}>
                      Quote No: {trackingData.quotation.quoteNo || trackingData.trackingReference}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                      Quoted Total
                    </span>
                    <div className="quote-amount">
                      {formatCurrency(trackingData.quotation.totalAmount)}
                    </div>
                  </div>
                </div>

                {trackingData.quotation.inclusions && (
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--text-dark)' }}>Package Inclusions:</strong>
                    <p className="quote-inclusions-text">{trackingData.quotation.inclusions}</p>
                  </div>
                )}

                {trackingData.quotation.tourDates && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-dark)' }}>
                    <strong>Scheduled Itinerary:</strong> {trackingData.quotation.tourDates}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Procedure Milestones (if active steps available) */}
            {trackingData.steps && trackingData.steps.length > 0 && (
              <div className="steps-details-section">
                <div className="stepper-title" style={{ marginBottom: '1rem' }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--purple)' }}></i>
                  <span>Procedure Milestone Verification</span>
                </div>

                <div className="steps-list">
                  {trackingData.steps.map((st) => {
                    const isStepCompleted = (st.status || '').toLowerCase() === 'completed';
                    const isStepProcessing = (st.status || '').toLowerCase().includes('process');
                    const rowClass = isStepCompleted ? 'completed' : isStepProcessing ? 'processing' : '';
                    const badgeClass = isStepCompleted ? 'completed' : isStepProcessing ? 'processing' : 'pending';

                    return (
                      <div className={`step-row-card ${rowClass}`} key={st.stepNumber}>
                        <div className="step-row-num">
                          {isStepCompleted ? <i className="fa-solid fa-check"></i> : st.stepNumber}
                        </div>
                        <div className="step-row-content">
                          <span className="step-row-title">{st.title}</span>
                          {st.description && <span className="step-row-desc">{st.description}</span>}
                          {st.completedAt && (
                            <span style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 600 }}>
                              <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i>
                              Completed on {formatDate(st.completedAt)}
                            </span>
                          )}
                        </div>
                        <span className={`step-row-badge ${badgeClass}`}>
                          {st.status || 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="result-footer-actions">
              <button
                type="button"
                className="btn-track-reset"
                onClick={handleReset}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Track Another Code</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(trackingData.receipt || trackingData.serviceCode || trackingData.quotation?.paymentStatus === 'PAID') && (
                  <button
                    type="button"
                    className="btn-track-receipt-btn"
                    onClick={handleOpenReceiptModal}
                    title="View printable E-Receipt"
                  >
                    <i className="fa-solid fa-receipt"></i>
                    <span>Official E-Receipt</span>
                  </button>
                )}

                <a
                  href="/login"
                  className="btn-track-cta"
                  title="Sign in to your client account for full features"
                >
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Client Login</span>
                </a>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Official E-Receipt Modal */}
      {isReceiptModalOpen && receiptDocData && (
        <PdfDocumentView
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          type="receipt"
          data={receiptDocData}
        />
      )}
    </>
  );
}
