import React, { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useToast } from '../../UI/toast/ToastProvider';

/**
 * ProfileEditModal — Reusable modal for editing user's basic profile details.
 * Supports Admin, Operator, and Client fields with validation and read-only email display.
 */
export default function ProfileEditModal({
  isOpen,
  onClose,
  initialData,
  role,
  onSave,
  isLoading
}) {
  const { addToast } = useToast();

  // Form states
  const [fullName, setFullName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Sync state when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      const isOp = role === 'operator' || role === 'branch_operator';
      // For operators, fullName stores Authorized Representative name, whereas name/branchName is the branch
      setFullName(initialData.fullName || (isOp ? '' : initialData.name) || '');
      setBranchName(initialData.branchName || initialData.name || '');
      setPhone(initialData.phone || initialData.contactNumber || '');
      setAddress(initialData.address || '');
    }
  }, [initialData, isOpen, role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isOp = role === 'operator' || role === 'branch_operator';

    if (!isOp && !fullName.trim()) {
      addToast('Full name cannot be empty', 'warning');
      return;
    }

    const payload = {};
    if (isOp) {
      // NOTE: Branch name is strictly read-only and managed exclusively by Head Office Administrators.
      // Deliberately omit branchName from update payload to preserve admin-assigned identity.
      if (fullName.trim()) payload.fullName = fullName.trim();
      payload.phone = phone.trim();
      payload.contactNumber = phone.trim();
      payload.address = address.trim();
    } else {
      payload.fullName = fullName.trim();
      payload.name = fullName.trim();
      payload.phone = phone.trim();
      payload.address = address.trim();
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  const isOperator = role === 'operator' || role === 'branch_operator';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personal Information"
      maxWidth="38rem"
    >
      <form className="form-column" onSubmit={handleSubmit} style={{ gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
          Update your public profile and contact information. Protected account credentials and administrative roles cannot be altered here.
        </p>

        {isOperator ? (
          <div className="form-grid-2">
            <div className="form-column">
              <label
                className="form-label"
                htmlFor="profile-branch-name"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Branch Name</span>
                <span
                  className="status-pill status-pill-neutral"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.45rem',
                    lineHeight: 1.2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Branch name is assigned and managed exclusively by Head Office Administrators"
                >
                  <i className="fa-solid fa-lock" style={{ fontSize: '0.625rem' }}></i>
                  Read-Only
                </span>
              </label>
              <input
                id="profile-branch-name"
                type="text"
                className="form-input"
                value={branchName}
                readOnly
                disabled
                style={{
                  backgroundColor: 'var(--bg)',
                  cursor: 'not-allowed',
                  color: 'var(--text-mid)',
                  borderColor: 'var(--border-color)'
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-light)',
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}></i>
                Assigned by Head Office. Only administrators can alter branch names.
              </span>
            </div>

            <div className="form-column">
              <label className="form-label" htmlFor="profile-rep-name">
                Authorized Representative Name
              </label>
              <input
                id="profile-rep-name"
                type="text"
                className="form-input"
                placeholder="e.g. Juan dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                Primary contact person in charge of this branch location.
              </span>
            </div>
          </div>
        ) : (
          <div className="form-column">
            <label className="form-label" htmlFor="profile-full-name">
              Full Name <span style={{ color: 'var(--error-red)' }}>*</span>
            </label>
            <input
              id="profile-full-name"
              type="text"
              className="form-input"
              placeholder="e.g. Maria Clara Santos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}

        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label" htmlFor="profile-email">
              Email Address (Read-Only)
            </label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={initialData?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-mid)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>
              Linked to your Firebase Authentication account.
            </span>
          </div>

          <div className="form-column">
            <label className="form-label" htmlFor="profile-phone">
              Contact Phone / Mobile
            </label>
            <input
              id="profile-phone"
              type="tel"
              className="form-input"
              placeholder="+63 912 345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-column">
          <label className="form-label" htmlFor="profile-address">
            {isOperator ? 'Branch Location Address' : role === 'admin' ? 'Location Address' : 'Mailing / Residential Address'}
          </label>
          <textarea
            id="profile-address"
            className="form-textarea"
            placeholder={isOperator ? 'Street, Barangay, City/Municipality, Province' : role === 'admin' ? 'Street, Barangay, City/Municipality, Province' : 'House/Unit No., Street, City, Province'}
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isLoading}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || (!isOperator && !fullName.trim())}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
