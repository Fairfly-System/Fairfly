import React, { useState } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

const PRESET_REASONS = [
  'Blurry or unreadable photo',
  'Document is expired',
  'ID type is not in our accepted list',
  'Name on document does not match account',
  'Missing back side of document',
  'Incomplete or cut-off identification'
];

export default function RejectClientModal({
  isOpen,
  onClose,
  client,
  onConfirmReject,
  isLoading = false
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const clientName = client?.fullName || client?.name || 'Applicant';
  const clientEmail = client?.email || '';
  const idType = client?.idType || 'Government ID';

  const handleSelectPreset = (preset) => {
    setError('');
    if (!reason) {
      setReason(preset);
    } else if (!reason.includes(preset)) {
      setReason((prev) => `${prev}. ${preset}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for rejecting the ID submission.');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Please provide a descriptive reason (at least 5 characters).');
      return;
    }
    setError('');
    onConfirmReject(reason.trim());
  };

  const handleClose = () => {
    if (isLoading) return;
    setReason('');
    setError('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Identification & Request Resubmission"
      subtitle="Provide clear feedback so the customer can upload a valid ID"
      maxWidth="34rem"
      width="100%"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Applicant summary chip */}
        <div
          style={{
            background: 'var(--bg, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 'var(--radius-md, 0.5rem)',
            padding: '0.875rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)', fontSize: '0.9375rem' }}>
              {clientName}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                background: '#fee2e2',
                color: '#991b1b'
              }}
            >
              {idType}
            </span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-light, #64748b)' }}>
            {clientEmail}
          </span>
        </div>

        {/* Quick Presets */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-mid, #475569)',
              marginBottom: '0.5rem'
            }}
          >
            Quick Feedback Suggestions:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: reason.includes(preset) ? '#ede9fe' : '#ffffff',
                  color: reason.includes(preset) ? '#6b21a8' : 'var(--text-mid, #475569)',
                  borderColor: reason.includes(preset) ? '#c4b5fd' : 'var(--border-color, #cbd5e1)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease'
                }}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label
            htmlFor="reject-reason"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-dark, #0f172a)'
            }}
          >
            Rejection Reason / Guidance for Applicant <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            id="reject-reason"
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., The front photo of your ID was blurry and your full name was cut off. Please ensure all 4 corners of your ID are clearly visible and legible."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md, 0.5rem)',
              border: error ? '1px solid #ef4444' : '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text-dark, #0f172a)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
              {error}
            </span>
          )}
        </div>

        {/* Automated email notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            padding: '0.75rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md, 0.5rem)',
            fontSize: '0.8125rem',
            color: '#92400e'
          }}
        >
          <i className="fa-solid fa-envelope-open-text" style={{ marginTop: '0.125rem', flexShrink: 0 }}></i>
          <span>
            Submitting will mark this account as <strong>Rejected</strong> and automatically email the client with this feedback and a secure link to re-upload their ID.
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-danger"
            disabled={isLoading || !reason.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                Reject & Send Email
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
