import { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './add-service-modal.css';

const SERVICE_TYPES = ['PSA', 'Passport', 'VISA Assistance', 'Package Tour', 'Airline Tickets'];
const PRIORITY_LEVELS = ['Normal', 'High'];
const SOURCES = ['Walk-in', 'Appointment'];

export default function AddServiceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    clientName: '',
    serviceType: '',
    priority: 'Normal',
    source: 'Walk-in',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.clientName.trim() || !form.serviceType) return;
    onAdd && onAdd(form);
    onClose();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="480px"
      title="Add New Active Service"
      subtitle="Create a new service for walk-in clients or confirmed appointments"
    >
      <div className="as-modal-body-content">
        <div className="as-field">
          <label>Client Name <span>*</span></label>
          <input
            type="text"
            name="clientName"
            placeholder="Enter client full name"
            value={form.clientName}
            onChange={handleChange}
            className="as-input focused"
          />
        </div>

        <div className="as-field">
          <label>Service Type <span>*</span></label>
          <div className="as-select-wrap">
            <select name="serviceType" value={form.serviceType} onChange={handleChange} className="as-select">
              <option value="" disabled>Select service type</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-field">
          <label>Priority Level</label>
          <div className="as-select-wrap">
            <select name="priority" value={form.priority} onChange={handleChange} className="as-select">
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-field">
          <label>Source</label>
          <div className="as-select-wrap">
            <select name="source" value={form.source} onChange={handleChange} className="as-select">
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-actions">
          <button className="as-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="as-btn-submit"
            onClick={handleSubmit}
            disabled={!form.clientName.trim() || !form.serviceType}
          >
            Add Service
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
