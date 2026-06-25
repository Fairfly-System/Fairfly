import React, { useState } from 'react';

export default function OperatorForm({ onSubmit }) {
  const [formData, setFormData] = useState({ branchName: '', username: '', password: '' });

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
        <label>Username</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., manila_operator"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Password</label>
        <input 
          type="password" 
          className="modalInput" 
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
      </div>
      <button type="submit" className="modalSubmitBtn btnGreen">Create Account</button>
    </form>
  );
}