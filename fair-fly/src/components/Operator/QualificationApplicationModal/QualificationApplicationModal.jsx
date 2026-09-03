import React, { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './qualification-application-modal.css';

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
        <div className="qualification-modal-title">
          <i className="fa-solid fa-certificate"></i>
          <span>Apply for Qualified Operator Status</span>
        </div>
      }
      subtitle="Gain the ability to publish and manage branch-exclusive services on FairFly"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="qualification-modal-form">
        <div className="qualification-info-callout">
          <i className="fa-solid fa-circle-info qualification-info-icon"></i>
          <div className="qualification-info-content">
            <strong>What is a Qualified Operator?</strong>
            <p>
              Qualified operators can create unique branch-tailored travel and processing services. Clients booking these services will be exclusively assigned to your branch.
            </p>
          </div>
        </div>

        <div className="qualification-form-group">
          <label className="qualification-form-label">
            Branch / Operator Details
          </label>
          <div className="qualification-branch-meta-grid">
            <div>
              <span className="qualification-meta-label">Branch Name</span>
              <strong className="qualification-meta-value-bold">{userDetails?.branchName || 'My Branch'}</strong>
            </div>
            <div>
              <span className="qualification-meta-label">Operator Contact</span>
              <span className="qualification-meta-value">{userDetails?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="qualification-form-group">
          <label htmlFor="reason" className="qualification-form-label">
            Qualification Justification & Experience <span className="qualification-required-mark">*</span>
          </label>
          <textarea
            id="reason"
            rows="4"
            className="form-input qualification-textarea"
            placeholder="Describe your branch capabilities, specialized travel services you intend to offer, or relevant certifications..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <span className="qualification-field-help">
            Provide details to help administrators review and verify your request.
          </span>
        </div>

        <div className="qualification-modal-actions">
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
            className="btn btn-primary qualification-submit-btn"
            disabled={isSubmitting || !reason.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i> Submit Application
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
