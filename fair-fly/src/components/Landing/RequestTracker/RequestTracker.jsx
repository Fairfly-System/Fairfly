import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { fetchPublicTracking } from '../../../services/trackingService';
import { fetchPublicReceipt } from '../../../services/receiptService';
import PdfDocumentView from '../../Shared/PdfDocument/PdfDocumentView';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { formatPaymentChannel } from '../../../utils/paymentUtils';
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

  // Presentation-only helpers for the route visual
  const timeline = Array.isArray(trackingData?.timeline) ? trackingData.timeline : [];
  const currentIdx = timeline.findIndex((n) => n.isCurrent);
  const reachedIdx = Math.max(currentIdx, timeline.map((n) => Boolean(n.isCompleted)).lastIndexOf(true), 0);
  const routeProgress = timeline.length > 1 ? reachedIdx / (timeline.length - 1) : 0;
  const hasReceipt = Boolean(
    trackingData && (trackingData.receipt || trackingData.serviceCode || trackingData.quotation?.paymentStatus === 'PAID')
  );
  const foundTypeLabel =
    trackingData?.foundType === 'quotation'
      ? 'Quotation proposal'
      : trackingData?.foundType === 'inquiry'
        ? 'Inquiry intake'
        : 'Active fulfillment';
  const statusIcon =
    trackingData?.statusType === 'success'
      ? 'fa-solid fa-circle-check'
      : trackingData?.statusType === 'warning'
        ? 'fa-solid fa-clock'
        : trackingData?.statusType === 'danger'
          ? 'fa-solid fa-circle-xmark'
          : 'fa-solid fa-spinner fa-spin';

  return (
    <>
      <div className="rt">

        {/* Section Header (used when embedded outside the dedicated page) */}
        {!hideHeader && (
          <div className="rt-head">
            <span className="rt-head-index">[ Track ] Real-time request tracker</span>
            <h2 className="rt-head-title">
              Track your travel request <span className="rt-head-accent">without logging in.</span>
            </h2>
            <p className="rt-head-sub">
              Enter your official Service Tracking ID (e.g. SRV-2026-XXXXXX) to view live milestone updates from our branch operators.
            </p>
          </div>
        )}

        {/* Check-in style search */}
        <div className="rt-search">
          <form className="rt-form" onSubmit={handleTrackSubmit}>
            <label className="rt-field">
              <span className="rt-field-label">Service tracking ID</span>
              <span className="rt-field-row">
                <i className="fa-solid fa-barcode rt-field-icon" aria-hidden="true"></i>
                <input
                  type="text"
                  className="rt-input"
                  placeholder="SRV-2026-000123"
                  value={trackingInput}
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setTrackingInput(e.target.value)}
                />
                {trackingInput && (
                  <button
                    type="button"
                    className="rt-clear"
                    aria-label="Clear input"
                    onClick={() => setTrackingInput('')}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </span>
            </label>

            <button
              type="submit"
              className="rt-submit"
              disabled={isLoading || !trackingInput.trim()}
            >
              {isLoading ? (
                <>
                  <span>Searching</span>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                </>
              ) : (
                <>
                  <span>Track status</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </>
              )}
            </button>
          </form>

          <div className="rt-hints">
            <div className="rt-samples">
              <span className="rt-samples-label">Try a sample</span>
              <button
                type="button"
                className="rt-sample"
                onClick={() => handleSampleClick('SRV-2026-000123')}
                title="Click to fill sample Service Tracking ID"
              >
                SRV-2026-000123
              </button>
              <button
                type="button"
                className="rt-sample"
                onClick={() => handleSampleClick('SRV-2026-784291')}
                title="Click to fill sample Service Tracking ID"
              >
                SRV-2026-784291
              </button>
            </div>
            <span className="rt-hint-note">
              <span className="rt-live-dot" aria-hidden="true" />
              No account required &middot; Instant live sync
            </span>
          </div>

          {errorMessage && (
            <div className="rt-error" role="alert">
              <span className="rt-error-code">Notice</span>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Real-time result: boarding pass */}
        {trackingData && (
          <article className="rt-pass" aria-live="polite">

            <header className="rt-pass-head">
              <div className="rt-pass-refs">
                <span>REF {trackingData.trackingReference}</span>
                {trackingData.serviceCode && (
                  <span className="rt-pass-code">CODE {trackingData.serviceCode}</span>
                )}
                <span className="rt-pass-type">{foundTypeLabel}</span>
              </div>
              <span className={`rt-status rt-status-${trackingData.statusType || 'primary'}`}>
                <i className={statusIcon} aria-hidden="true"></i>
                <span>{trackingData.status}</span>
              </span>
            </header>

            <div className="rt-pass-title-row">
              <h3 className="rt-pass-title">{trackingData.serviceTitle}</h3>
              {trackingData.statusDescription && (
                <p className="rt-pass-desc">{trackingData.statusDescription}</p>
              )}
            </div>

            <dl className="rt-fields">
              <div>
                <dt>Handling branch</dt>
                <dd>{trackingData.branchName}</dd>
              </div>
              <div>
                <dt>Customer</dt>
                <dd>{trackingData.clientName}</dd>
              </div>
              <div>
                <dt>Date submitted</dt>
                <dd>{formatDate(trackingData.dateInitiated)}</dd>
              </div>
              <div>
                <dt>Current phase</dt>
                <dd className="rt-fields-accent">
                  Stage {trackingData.currentStage} of {trackingData.totalStages || timeline.length}
                </dd>
              </div>
            </dl>

            {/* 5-stage route */}
            <section className="rt-route" aria-label="Lifecycle progression">
              <span className="rt-label">Lifecycle progression</span>
              <ol className="rt-route-track" style={{ '--rt-progress': routeProgress, '--rt-n': Math.max(timeline.length, 1) }}>
                {timeline.map((node) => {
                  const nodeClass = node.isCompleted ? 'is-done' : node.isCurrent ? 'is-current' : 'is-pending';
                  return (
                    <li className={`rt-stop ${nodeClass}`} key={node.stageNumber}>
                      <span className="rt-stop-dot">
                        {node.isCompleted ? (
                          <i className="fa-solid fa-check" aria-hidden="true"></i>
                        ) : (
                          String(node.stageNumber).padStart(2, '0')
                        )}
                      </span>
                      <span className="rt-stop-title">{node.title}</span>
                      <span className="rt-stop-desc">{node.desc}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Official E-Receipt stub (ADF-07-002) */}
            {hasReceipt && (
              <div className="rt-receipt">
                <div className="rt-receipt-main">
                  <span className="rt-label rt-label-accent">
                    <i className="fa-solid fa-receipt" aria-hidden="true"></i> Official e-receipt issued
                  </span>
                  <dl className="rt-receipt-fields">
                    <div>
                      <dt>Receipt no.</dt>
                      <dd>{trackingData.receipt?.receiptNo || 'Official (Authenticated)'}</dd>
                    </div>
                    {trackingData.serviceCode && (
                      <div>
                        <dt>Tracking code</dt>
                        <dd className="rt-mono">{trackingData.serviceCode}</dd>
                      </div>
                    )}
                    {trackingData.receipt?.amount && (
                      <div>
                        <dt>Amount paid</dt>
                        <dd>
                          {formatCurrency(trackingData.receipt.amount)}
                          <span className="rt-receipt-via">
                            via {formatPaymentChannel(trackingData.receipt.paymentMethod, trackingData.receipt.provider) || 'Verified Payment'}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div className="rt-receipt-stub">
                  <span className="rt-barcode" aria-hidden="true" />
                  <button
                    type="button"
                    className="rt-btn rt-btn-ink"
                    onClick={handleOpenReceiptModal}
                    disabled={isLoadingReceipt}
                  >
                    {isLoadingReceipt ? (
                      <>
                        <span>Loading receipt</span>
                        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                      </>
                    ) : (
                      <>
                        <span>View e-receipt</span>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quotation details */}
            {trackingData.quotation && (
              <section className="rt-quote">
                <div className="rt-quote-head">
                  <div>
                    <span className="rt-label">Official quotation issued</span>
                    <h4 className="rt-quote-no">
                      Quote No. {trackingData.quotation.quoteNo || trackingData.trackingReference}
                    </h4>
                  </div>
                  <div className="rt-quote-total">
                    <span className="rt-label">Quoted total</span>
                    <span className="rt-quote-amount">{formatCurrency(trackingData.quotation.totalAmount)}</span>
                  </div>
                </div>

                {(trackingData.quotation.inclusions || trackingData.quotation.tourDates) && (
                  <dl className="rt-quote-body">
                    {trackingData.quotation.inclusions && (
                      <div>
                        <dt>Package inclusions</dt>
                        <dd className="rt-quote-inclusions">{trackingData.quotation.inclusions}</dd>
                      </div>
                    )}
                    {trackingData.quotation.tourDates && (
                      <div>
                        <dt>Scheduled itinerary</dt>
                        <dd>{trackingData.quotation.tourDates}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </section>
            )}

            {/* Procedure milestones */}
            {trackingData.steps && trackingData.steps.length > 0 && (
              <section className="rt-steps">
                <span className="rt-label">Procedure milestone verification</span>
                <ol className="rt-steps-list">
                  {trackingData.steps.map((st) => {
                    const isStepCompleted = (st.status || '').toLowerCase() === 'completed';
                    const isStepProcessing = (st.status || '').toLowerCase().includes('process');
                    const rowClass = isStepCompleted ? 'is-done' : isStepProcessing ? 'is-processing' : 'is-pending';

                    return (
                      <li className={`rt-step ${rowClass}`} key={st.stepNumber}>
                        <span className="rt-step-num">
                          {isStepCompleted ? (
                            <i className="fa-solid fa-check" aria-hidden="true"></i>
                          ) : (
                            String(st.stepNumber).padStart(2, '0')
                          )}
                        </span>
                        <div className="rt-step-body">
                          <span className="rt-step-title">{st.title}</span>
                          {st.description && <span className="rt-step-desc">{st.description}</span>}
                          {st.completedAt && (
                            <span className="rt-step-done">Completed {formatDate(st.completedAt)}</span>
                          )}
                        </div>
                        <span className="rt-step-badge">{st.status || 'Pending'}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Footer actions */}
            <footer className="rt-pass-foot">
              <button type="button" className="rt-textbtn" onClick={handleReset}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                <span>Track another code</span>
              </button>

              <div className="rt-pass-foot-actions">
                {hasReceipt && (
                  <button
                    type="button"
                    className="rt-btn rt-btn-ghost"
                    onClick={handleOpenReceiptModal}
                    title="View printable E-Receipt"
                  >
                    <i className="fa-solid fa-receipt" aria-hidden="true"></i>
                    <span>Official e-receipt</span>
                  </button>
                )}
                <a href="/login" className="rt-btn rt-btn-ink" title="Sign in to your client account for full features">
                  <span>Client login</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </a>
              </div>
            </footer>
          </article>
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
