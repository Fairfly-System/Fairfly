import React, { useState } from 'react';
import { fetchPublicTracking } from '../../../services/trackingService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './request-tracker.css';

const SAMPLE_CODES = ['QT-2026-4821', 'INQ-SAMPLE', 'ACT-SERVICE'];

export default function RequestTracker() {
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTrackSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanId = trackingInput.trim();
    if (!cleanId) {
      setErrorMessage('Please enter a valid Quotation Number or Inquiry Reference Code.');
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
            'No matching request found for this reference code. Please verify your Quotation ID (QT-...), Inquiry Code (INQ-...), or Service ID.'
          )
        );
      },
      setIsLoading
    );
  };

  const handleSampleClick = (code) => {
    setTrackingInput(code);
    setErrorMessage('');
  };

  const handleReset = () => {
    setTrackingData(null);
    setTrackingInput('');
    setErrorMessage('');
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
    <section id="track-request" className="request-tracker-section">
      <div className="request-tracker-container">
        
        {/* Section Header */}
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
            Enter your Quotation ID, Quote Number (QT-...), Inquiry Control Code, or Service Tracking Reference to view live milestone updates from our branch operators.
          </p>
        </div>

        {/* Search Card */}
        <div className="tracker-search-card">
          <form className="tracker-search-form" onSubmit={handleTrackSubmit}>
            <div className="tracker-input-wrapper">
              <i className="fa-solid fa-barcode tracker-input-icon"></i>
              <input
                type="text"
                className="tracker-input"
                placeholder="Enter Quotation No (e.g. QT-2026-4821) or Inquiry Code..."
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
              <span>Accepted Formats:</span>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('QT-2026-4821')}
                title="Click to fill sample Quotation Number"
              >
                QT-2026-XXXX
              </button>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('QUO-1743512345678')}
                title="Click to fill sample Quotation ID"
              >
                QUO-...
              </button>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('INQ-1743512345678')}
                title="Click to fill sample Inquiry Code"
              >
                INQ-...
              </button>
              <button
                type="button"
                className="tracker-hint-chip"
                onClick={() => handleSampleClick('ACT-1743512345678')}
                title="Click to fill sample Active Service ID"
              >
                ACT-...
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
    </section>
  );
}
