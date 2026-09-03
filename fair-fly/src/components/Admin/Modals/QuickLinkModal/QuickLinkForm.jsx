import React, { useState, useEffect } from 'react';

export default function QuickLinkForm({ onSubmit, isLoading, initialData = null }) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
  });

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const lower = String(cat).toLowerCase().replace(/\s+/g, '');
    if (lower === 'government') return 'government';
    if (lower === 'airlines') return 'airlines';
    if (lower === 'hotels') return 'hotels';
    if (lower.includes('visa') || lower.includes('embassy')) return 'visaAndEmbassy';
    return cat;
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        url: initialData.url || '',
        category: normalizeCategory(initialData.category),
      });
    } else {
      setFormData({ title: '', url: '', category: '' });
    }
  }, [initialData]);

  const isFormValid = Boolean(formData.title.trim() && formData.url.trim() && formData.category);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  return (
    <form className="modalForm form-column" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
      <div className="form-grid-2">
        <div className="formGroup">
          <label className="form-label">Website Title *</label>
          <input
            type="text"
            className="modalInput"
            placeholder="e.g., PSA Serbilis Portal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="formGroup">
          <label className="form-label">Category *</label>
          <select
            className="modalSelect"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            disabled={isLoading}
          >
            <option value="" disabled hidden>
              Select category
            </option>
            <option value="government">Government</option>
            <option value="airlines">Airlines</option>
            <option value="hotels">Hotels</option>
            <option value="visaAndEmbassy">Visa & Embassy</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="formGroup">
        <label className="form-label">Website URL *</label>
        <input
          type="url"
          className="modalInput"
          placeholder="e.g., https://www.psaserbilis.com.ph"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !isFormValid}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i>
              Saving...
            </>
          ) : (
            initialData ? 'Update Link' : 'Add Link'
          )}
        </button>
      </div>
    </form>
  );
}
