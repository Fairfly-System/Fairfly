import React, { useState } from 'react';

export default function OperatorForm({ onSubmit, isLoading, initialData }) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    branchName: initialData?.branchName || '',
    address: initialData?.address || '',
    contactNumber: initialData?.contactNumber || '',
    email: initialData?.email || '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="modalForm" onSubmit={handleSubmit}>
      <div className="formGroup">
        <label>Branch Name</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., Manila Branch"
          value={formData.branchName}
          onChange={(e) => setFormData({...formData, branchName: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Address</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., 123 Main St, Manila"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Contact Number</label>
        <input
          type="text"
          className="modalInput"
          placeholder="e.g., +63 912 345 6789"
          value={formData.contactNumber}
          onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Email</label>
        <input 
          type="email" 
          className="modalInput" 
          placeholder="e.g., manila_operator@example.com"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          disabled={isEditMode}
          title={isEditMode ? "Email can't be changed" : undefined}
          style={isEditMode ? { backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed' } : undefined}
        />
      </div>

      {/* Password is only collected when creating a new account */}
      {!isEditMode && (
        <div className="formGroup">
          <label>Password</label>
          <input 
            type="text" 
            className="modalInput" 
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>
      )}

      <button type="submit" className="modalSubmitBtn btnGreen" disabled={isLoading}>
        {isLoading
          ? (isEditMode ? 'Saving Changes...' : 'Creating Account...')
          : (isEditMode ? 'Save Changes' : 'Create Account')}
      </button>
    </form>
  );
}