import React, { useState } from 'react';
import { useToast } from '../../../UI/toast/ToastProvider';

export default function AdminForm({ onSubmit, isLoading, initialData }) {
  const { addToast } = useToast();
  const [username, setUsername] = useState(initialData?.username || initialData?.fullName || '');
  const [fullName, setFullName] = useState(initialData?.fullName || initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [status, setStatus] = useState(initialData?.status || 'Active');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      addToast('Username is required', 'warning');
      return;
    }

    if (!initialData && !email.trim()) {
      addToast('Email address is required', 'warning');
      return;
    }

    if (!initialData && (!password || password.length < 6)) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    const payload = {
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      name: fullName.trim() || username.trim(),
      phone: phone.trim(),
      status: status
    };

    if (!initialData) {
      payload.email = email.trim().toLowerCase();
      payload.password = password;
    }

    onSubmit(payload);
  };

  return (
    <form className="form-column" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">
            Username <span className="req-star">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. support.admin1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Full Name / Display Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Alex Santos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">
            Email Address <span className="req-star">*</span>
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="admin.support@fairfly.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || !!initialData}
          />
          {initialData && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              Email cannot be changed after creation.
            </span>
          )}
        </div>

        {!initialData ? (
          <div className="form-column">
            <label className="form-label">
              Password <span className="req-star">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="form-column">
            <label className="form-label">Account Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading || initialData?.isSuperAdmin}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            placeholder="0912 345 6789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Role Assignment</label>
          <input
            type="text"
            className="form-input"
            value="Support Administrator (Fairfly Admin)"
            disabled
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          <i className="fa-solid fa-user-shield"></i>
          {isLoading ? 'Saving...' : initialData ? 'Update Administrator' : 'Create Administrator'}
        </button>
      </div>
    </form>
  );
}
