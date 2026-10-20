import React, { useState } from 'react';
import { useToast } from '../../../UI/toast/ToastProvider';
import { sanitizePhilippinePhone, isValidPhilippinePhone, PH_PHONE_MAX_LENGTH } from '../../../../utils/phoneUtils';

export default function ClientEditForm({ onSubmit, isLoading, initialData }) {
  const { addToast } = useToast();
  const [fullName, setFullName] = useState(initialData?.fullName || initialData?.name || '');
  const [phone, setPhone] = useState(sanitizePhilippinePhone(initialData?.phone || ''));
  const [status, setStatus] = useState(initialData?.status || 'Active');
  const [address, setAddress] = useState(initialData?.address || '');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      addToast('Client full name is required', 'warning');
      return;
    }

    if (phone.trim() && !isValidPhilippinePhone(phone)) {
      addToast('Phone number must follow Philippine format: 09XXXXXXXXX (11 digits)', 'warning');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      phone: sanitizePhilippinePhone(phone),
      status: status,
      address: address.trim()
    };

    onSubmit(payload);
  };

  return (
    <form className="form-column" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">
            Full Name <span className="req-star">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Maria Clara Santos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Email Address (Read-Only)</label>
          <input
            type="email"
            className="form-input"
            value={initialData?.email || ''}
            disabled
            style={{ backgroundColor: 'var(--bg-muted, #f8fafc)', cursor: 'not-allowed' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            Email address cannot be changed by administrators.
          </span>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            placeholder="09XXXXXXXXX"
            maxLength={PH_PHONE_MAX_LENGTH}
            value={phone}
            onChange={(e) => setPhone(sanitizePhilippinePhone(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Account Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLoading}
          >
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="form-column">
        <label className="form-label">Client Address / Location</label>
        <textarea
          className="form-input"
          placeholder="Client street address, city, or province..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          disabled={isLoading}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !fullName.trim()}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.35rem' }}></i>
          {isLoading ? 'Saving Changes...' : 'Save Client Details'}
        </button>
      </div>
    </form>
  );
}
