import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './tickets.css';

const CreateTicketModal = forwardRef(({ onCreateTicket, isLoading }, ref) => {
  const baseModalRef = useRef(null);

  const [formData, setFormData] = useState({
    operatorId: '',
    operatorName: '',
    operatorEmail: '',
    title: '',
    category: 'Technical Support',
    priority: 'Medium',
    initialMessage: '',
  });

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setFormData({
        operatorId: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
        operatorName: '',
        operatorEmail: '',
        title: '',
        category: 'Technical Support',
        priority: 'Medium',
        initialMessage: '',
      });
      baseModalRef.current?.openModal();
    },
    closeModal: () => {
      baseModalRef.current?.closeModal();
    },
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.initialMessage.trim() || isLoading) return;

    try {
      await onCreateTicket({
        operatorId: formData.operatorId.trim() || 'OP-1001',
        operatorName: formData.operatorName.trim() || 'Operator Account',
        operatorEmail: formData.operatorEmail.trim() || 'operator@fairfly.com',
        title: formData.title.trim(),
        category: formData.category,
        priority: formData.priority,
        initialMessage: formData.initialMessage.trim(),
      });
      baseModalRef.current?.closeModal();
    } catch (err) {
      console.error('Failed to create ticket from modal:', err);
    }
  };

  return (
    <BaseModal
      ref={baseModalRef}
      maxWidth="56rem"
      title="Create New Support Ticket"
      subtitle="Manually create a support ticket thread on behalf of an operator"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="form-column" style={{ gap: '1rem' }}>
        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label">
              Operator ID *
            </label>
            <input
              type="text"
              name="operatorId"
              value={formData.operatorId}
              onChange={handleChange}
              placeholder="e.g. OP-1001"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">
              Operator Name *
            </label>
            <input
              type="text"
              name="operatorName"
              value={formData.operatorName}
              onChange={handleChange}
              placeholder="e.g. Cebu Central Operator"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label">
              Operator Email
            </label>
            <input
              type="email"
              name="operatorEmail"
              value={formData.operatorEmail}
              onChange={handleChange}
              placeholder="e.g. operator@fairfly.com"
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">
              Ticket Subject / Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Fleet Scheduling System Sync Delay"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
              className="form-select"
            >
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Payments">Billing & Payments</option>
              <option value="Fleet Management">Fleet Management</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div className="form-column">
            <label className="form-label">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoading}
              className="form-select"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-column">
          <label className="form-label">
            Initial Message Request *
          </label>
          <textarea
            name="initialMessage"
            value={formData.initialMessage}
            onChange={handleChange}
            placeholder="Describe the issue or inquiry in detail..."
            rows={4}
            required
            disabled={isLoading}
            className="form-textarea"
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => baseModalRef.current?.closeModal()}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!formData.title.trim() || !formData.initialMessage.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i> Creating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus" style={{ marginRight: '0.375rem' }}></i> Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
});

CreateTicketModal.displayName = 'CreateTicketModal';

export default CreateTicketModal;
