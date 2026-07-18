import React, { useState } from 'react';

export default function ServiceForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ name: '', price: '', processingTime: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="modalForm" onSubmit={handleSubmit}>
      <div className="formGroup">
        <label>Service Name</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., PSA Birth Certificate"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Price</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., ₱365"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
        />
      </div>
      <div className="formGroup">
        <label>Processing Time</label>
        <input 
          type="text" 
          className="modalInput" 
          placeholder="e.g., 7-10 days"
          value={formData.processingTime}
          onChange={(e) => setFormData({...formData, processingTime: e.target.value})}
        />
      </div>
      <button type="submit" className="modalSubmitBtn btnBlue" disabled={isLoading}>
        {isLoading ? 'Adding Service...' : 'Add Service'}
      </button>
    </form>
  );
}