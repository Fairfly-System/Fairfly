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
      maxWidth="560px"
      title="Create New Support Ticket"
      subtitle="Manually create a support ticket thread on behalf of an operator"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
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
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
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
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Operator Email
          </label>
          <input
            type="email"
            name="operatorEmail"
            value={formData.operatorEmail}
            onChange={handleChange}
            placeholder="e.g. operator@fairfly.com"
            disabled={isLoading}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
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
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Payments">Billing & Payments</option>
              <option value="Fleet Management">Fleet Management</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
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
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="back-to-table-btn"
            onClick={() => baseModalRef.current?.closeModal()}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="forum-send-btn"
            disabled={!formData.title.trim() || !formData.initialMessage.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Creating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus"></i> Create Ticket
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
