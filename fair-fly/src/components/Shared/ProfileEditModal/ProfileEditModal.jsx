import React, { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useToast } from '../../UI/toast/ToastProvider';
import { sanitizePhilippinePhone, isValidPhilippinePhone, PH_PHONE_MAX_LENGTH } from '../../../utils/phoneUtils';

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
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
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
      setPhone(sanitizePhilippinePhone(initialData.phone || initialData.contactNumber || ''));
      setAddress(initialData.address || '');

      // Parse or load firstName, middleName / middleInitial, lastName
      const rawFull = (initialData.fullName || initialData.name || '').trim();
      const parts = rawFull.split(/\s+/).filter(Boolean);

      const fName = initialData.firstName !== undefined && initialData.firstName !== null && String(initialData.firstName).trim() !== ''
        ? String(initialData.firstName).trim()
        : (parts.length > 0 ? parts[0] : '');

      const mName = initialData.middleName !== undefined && initialData.middleName !== null && String(initialData.middleName).trim() !== ''
        ? String(initialData.middleName).trim()
        : (initialData.middleInitial !== undefined && initialData.middleInitial !== null && String(initialData.middleInitial).trim() !== ''
          ? String(initialData.middleInitial).trim()
          : (parts.length > 2 ? parts.slice(1, -1).join(' ') : ''));

      const lName = initialData.lastName !== undefined && initialData.lastName !== null && String(initialData.lastName).trim() !== ''
        ? String(initialData.lastName).trim()
        : (parts.length > 1 ? parts[parts.length - 1] : '');

      setFirstName(fName);
      setMiddleName(mName);
      setLastName(lName);
    }
  }, [initialData, isOpen, role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isOp = role === 'operator' || role === 'branch_operator';

    if (isOp) {
      if (!fullName.trim()) {
        addToast('Representative name cannot be empty', 'warning');
        return;
      }
    } else {
      if (!firstName.trim()) {
        addToast('First name is required', 'warning');
        return;
      }
      if (firstName.trim().length < 2) {
        addToast('First name must be at least 2 characters', 'warning');
        return;
      }
      if (!lastName.trim()) {
        addToast('Last name is required', 'warning');
        return;
      }
      if (lastName.trim().length < 2) {
        addToast('Last name must be at least 2 characters', 'warning');
        return;
      }
    }

    if (phone.trim() && !isValidPhilippinePhone(phone)) {
      addToast('Phone number must follow Philippine format: 09XXXXXXXXX (11 digits)', 'warning');
      return;
    }

    const sanitizedPhone = sanitizePhilippinePhone(phone);
    const payload = {};
    if (isOp) {
      // NOTE: Branch name is strictly read-only and managed exclusively by Head Office Administrators.
      // Deliberately omit branchName from update payload to preserve admin-assigned identity.
      if (fullName.trim()) payload.fullName = fullName.trim();
      payload.phone = sanitizedPhone;
      payload.contactNumber = sanitizedPhone;
      payload.address = address.trim();
    } else {
      const derivedFullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
      payload.firstName = firstName.trim();
      payload.middleName = middleName.trim();
      payload.middleInitial = middleName.trim();
      payload.lastName = lastName.trim();
      payload.fullName = derivedFullName;
      payload.name = derivedFullName;
      payload.phone = sanitizedPhone;
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
      maxWidth="40rem"
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
          <div className="form-grid-3">
            <div className="form-column">
              <label className="form-label" htmlFor="profile-first-name">
                First Name <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                id="profile-first-name"
                type="text"
                className="form-input"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="given-name"
              />
            </div>

            <div className="form-column">
              <label className="form-label" htmlFor="profile-middle-name">
                Middle Name / M.I.
              </label>
              <input
                id="profile-middle-name"
                type="text"
                className="form-input"
                placeholder="D."
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                disabled={isLoading}
                autoComplete="additional-name"
              />
            </div>

            <div className="form-column">
              <label className="form-label" htmlFor="profile-last-name">
                Last Name <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                id="profile-last-name"
                type="text"
                className="form-input"
                placeholder="Dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="family-name"
              />
            </div>
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
              placeholder="09XXXXXXXXX"
              maxLength={PH_PHONE_MAX_LENGTH}
              value={phone}
              onChange={(e) => setPhone(sanitizePhilippinePhone(e.target.value))}
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
            disabled={isLoading || (isOperator ? !fullName.trim() : (!firstName.trim() || !lastName.trim()))}
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
