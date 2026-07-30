import React, { useState } from 'react';

export default function QuickLinkForm({ onSubmit, isLoading }) {
  
  const [formData, setFormData] = useState({ title: '', url: '', category: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.url && formData.category) {
      onSubmit(formData);
    }
  };

  return (
    <form className="modalForm" onSubmit={handleSubmit}>
      <div className="formGroup">
        <label>Website Title *</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., PSA Serbilis Portal"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>
      <div className="formGroup">
        <label>Website URL *</label>
        <input 
          type="url" 
          className="modalInput" 
          placeholder="e.g., https://www.psaserbilis.com.ph"
          value={formData.url}
          onChange={(e) => setFormData({...formData, url: e.target.value})}
          required
        />
      </div>
      <div className="formGroup">
        <label>Category *</label>
        <select 
          className="modalSelect"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
        >
          <option value="" disabled hidden>Select category</option>
          <option value="government">Government</option>
          <option value="airlines">Airlines</option>
          <option value="hotels">Hotels</option>
          <option value="visaAndEmbassy">Visa & Embassy</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button type="submit" className="modalSubmitBtn btnBlue" disabled={isLoading}>Add Link</button>
    </form>
  );
}