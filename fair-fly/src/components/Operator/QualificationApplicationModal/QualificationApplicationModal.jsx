import React, { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';

export default function QualificationApplicationModal({
  isOpen,
  onClose,
  onApplicationSubmitted
}) {
  const { userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      addToast('Please provide a justification or background for your qualification request.', 'warning');
      return;
    }

    ApiCaller(
      `${API_BASE_URL}/api/qualifications`,
      'POST',
      { reason: reason.trim() },
      { Authorization: `Bearer ${userToken}` },
      (res) => {
        addToast('🎉 Qualification application submitted successfully! Super Administrators will review your request.', 'success');
        setReason('');
        if (onApplicationSubmitted) onApplicationSubmitted(res);
        onClose();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to submit qualification application.'), 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      maxWidth="38rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-certificate" style={{ color: 'var(--purple)' }}></i>
          <span>Apply for Qualified Operator Status</span>
        </div>
      }
      subtitle="Gain the ability to publish and manage branch-exclusive services on FairFly"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}>
        <div
          style={{
            background: 'var(--purple-soft, #ede9fe)',
            border: '1px solid #ddd6fe',
            borderRadius: 'var(--radius-md, 0.5rem)',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start'
          }}
        >
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--purple)', fontSize: '1.25rem', marginTop: '0.125rem' }}></i>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', lineHeight: 1.45 }}>
            <strong>What is a Qualified Operator?</strong>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-mid)' }}>
              Qualified operators can create unique branch-tailored travel and processing services. Clients booking these services will be exclusively assigned to your branch.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            Branch / Operator Details
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'var(--bg, #f8fafc)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Branch Name</span>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>{userDetails?.branchName || 'My Branch'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Operator Contact</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>{userDetails?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reason" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            Qualification Justification & Experience <span style={{ color: 'var(--error-red)' }}>*</span>
          </label>
          <textarea
            id="reason"
            rows="4"
            className="form-input"
            placeholder="Describe your branch capabilities, specialized travel services you intend to offer, or relevant certifications..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{ width: '100%', resize: 'vertical', minHeight: '6rem' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Provide details to help administrators review and verify your request.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !reason.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--purple)' }}
          >
            <i className="fa-solid fa-paper-plane"></i> Submit Application
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
