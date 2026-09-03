import React, { useState } from 'react';
import '../modal.css'

export default function OperatorForm({ onSubmit, isLoading, initialData }) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    branchName: initialData?.branchName || '',
    address: initialData?.address || '',
    contactNumber: initialData?.contactNumber || '',
    email: initialData?.email || '',
    password: ''
  });

  const isFormValid = Boolean(
    formData.branchName.trim() &&
    formData.contactNumber.trim() &&
    formData.address.trim() &&
    formData.email.trim() &&
    (isEditMode || formData.password.trim())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSubmit(formData);
  };

  return (
    <form className="modalForm form-column" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
      <div className="form-grid-2">
        <div className="formGroup">
          <label className="form-label">Branch Name *</label>
          <input
            type="text"
            className="modalInput"
            placeholder="e.g., Manila Branch"
            value={formData.branchName}
            disabled={isLoading}
            required
            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
          />
        </div>
        <div className="formGroup">
          <label className="form-label">Contact Number *</label>
          <input
            type="text"
            className="modalInput"
            placeholder="e.g., +63 912 345 6789"
            value={formData.contactNumber}
            disabled={isLoading}
            required
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="formGroup">
        <label className="form-label">Address *</label>
        <input
          type="text"
          className="modalInput"
          placeholder="e.g., 123 Main St, Manila"
          value={formData.address}
          disabled={isLoading}
          required
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="form-grid-2">
        <div className="formGroup">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="modalInput"
            placeholder="e.g., manila_operator@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isEditMode || isLoading}
            title={isEditMode ? "Email can't be changed" : undefined}
            style={isEditMode ? { backgroundColor: 'var(--bg)', color: 'var(--text-light)', cursor: 'not-allowed' } : undefined}
          />
        </div>

        {!isEditMode && (
          <div className="formGroup">
            <label className="form-label">Password *</label>
            <input
              type="text"
              className="modalInput"
              placeholder="Create a password"
              value={formData.password}
              disabled={isLoading}
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="submit" className="btn-primary" disabled={isLoading || !isFormValid} style={{ width: '100%', justifyContent: 'center' }}>
          {isLoading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i>
              {isEditMode ? 'Saving Changes...' : 'Creating Account...'}
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Create Account'
          )}
        </button>
      </div>
    </form>
  );
}
