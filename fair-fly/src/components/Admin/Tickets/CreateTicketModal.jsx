import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './tickets.css';

const CreateTicketModal = forwardRef(
  ({ onCreateTicket, isLoading, isOperatorPortal = false, defaultOperator = null, operatorsList = [] }, ref) => {
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
      openModal: (customData = null) => {
        const op = customData || defaultOperator;
        setFormData({
          operatorId: op?.operatorId || (operatorsList[0]?.id || ''),
          operatorName: op?.operatorName || (operatorsList[0]?.branchName || operatorsList[0]?.name || ''),
          operatorEmail: op?.operatorEmail || (operatorsList[0]?.email || ''),
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

    // When Admin selects an operator from the dropdown
    const handleOperatorSelect = (e) => {
      const selectedUid = e.target.value;
      const op = operatorsList.find((o) => o.id === selectedUid);
      if (op) {
        setFormData((prev) => ({
          ...prev,
          operatorId: op.id,
          operatorName: op.branchName || op.name || 'Branch Operator',
          operatorEmail: op.email || '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          operatorId: selectedUid,
        }));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.initialMessage.trim() || isLoading) return;

      const finalOpId = isOperatorPortal
        ? (defaultOperator?.operatorId || formData.operatorId)
        : (formData.operatorId || defaultOperator?.operatorId);

      const finalOpName = isOperatorPortal
        ? (defaultOperator?.operatorName || formData.operatorName)
        : (formData.operatorName || defaultOperator?.operatorName || 'Branch Operator');

      const finalOpEmail = isOperatorPortal
        ? (defaultOperator?.operatorEmail || formData.operatorEmail)
        : (formData.operatorEmail || defaultOperator?.operatorEmail || '');

      try {
        await onCreateTicket({
          operatorId: finalOpId,
          operatorName: finalOpName,
          operatorEmail: finalOpEmail,
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

    const activeOp = isOperatorPortal ? defaultOperator : formData;
    const initialLetter = (activeOp?.operatorName || 'O')[0]?.toUpperCase() || 'O';

    return (
      <BaseModal
        ref={baseModalRef}
        maxWidth="56rem"
        title={isOperatorPortal ? 'Submit Support Ticket' : 'Create New Support Ticket'}
        subtitle={
          isOperatorPortal
            ? 'Send an official support inquiry or technical request to Head Office'
            : 'Create a support ticket thread on behalf of a branch operator'
        }
        isLoading={isLoading}
      >
        <form onSubmit={handleSubmit} className="form-column" style={{ gap: '1.125rem' }}>
          {/* Operator Context Banner (Auto-assigned via Firestore Account UID) */}
          {isOperatorPortal ? (
            <div className="operator-submitter-card">
              <div className="operator-submitter-main">
                <div className="operator-submitter-avatar">{initialLetter}</div>
                <div className="operator-submitter-details">
                  <span className="operator-submitter-title">
                    {defaultOperator?.operatorName || 'My Branch Account'}
                  </span>
                  <span className="operator-submitter-email">
                    {defaultOperator?.operatorEmail || 'operator@fairfly.com'}
                  </span>
                </div>
              </div>

              <div
                className="ticket-op-uid-pill"
                title={`Firestore Operator Account UID: ${defaultOperator?.operatorId || 'Auto'}`}
              >
                <i className="fa-solid fa-id-badge"></i>
                <span>UID: {defaultOperator?.operatorId ? `${defaultOperator.operatorId.slice(0, 12)}...` : 'Auto-filled'}</span>
              </div>
            </div>
          ) : (
            /* Admin view: Select Branch Operator */
            <div className="form-grid-2">
              <div className="form-column">
                <label className="form-label">
                  Select Branch Operator *
                </label>
                {operatorsList && operatorsList.length > 0 ? (
                  <select
                    name="operatorId"
                    value={formData.operatorId}
                    onChange={handleOperatorSelect}
                    disabled={isLoading}
                    className="form-select"
                    required
                  >
                    <option value="" disabled>-- Choose Operator --</option>
                    {operatorsList.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.branchName || op.name || op.email} ({op.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="operatorId"
                    value={formData.operatorId}
                    onChange={handleChange}
                    placeholder="Enter Operator Firestore UID"
                    required
                    disabled={isLoading}
                    className="form-input"
                  />
                )}
              </div>

              <div className="form-column">
                <label className="form-label">
                  Operator Name / Branch
                </label>
                <input
                  type="text"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={handleChange}
                  placeholder="e.g. Davao Branch"
                  disabled={isLoading}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Ticket Subject / Title */}
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

          {/* Category & Priority Grid */}
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

          {/* Initial Message */}
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

          {/* Actions */}
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
              disabled={!formData.title.trim() || !formData.initialMessage.trim() || (!isOperatorPortal && !formData.operatorId?.trim()) || isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i> Submitting...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: '0.375rem' }}></i>{' '}
                  {isOperatorPortal ? 'Submit Ticket' : 'Create Ticket'}
                </>
              )}
            </button>
          </div>
        </form>
      </BaseModal>
    );
  }
);

CreateTicketModal.displayName = 'CreateTicketModal';

export default CreateTicketModal;
