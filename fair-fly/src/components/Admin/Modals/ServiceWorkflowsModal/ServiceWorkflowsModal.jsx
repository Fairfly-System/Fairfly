import React, { useState, useEffect } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { firestore } from '../../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function ServiceWorkflowsModal({ isOpen, onClose, initialWorkflowIds = [], onSaveWorkflows }) {
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState(initialWorkflowIds);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelectedWorkflowIds(initialWorkflowIds);
  }, [isOpen, initialWorkflowIds]);

  useEffect(() => {
    if (!isOpen) return;

    // Listen to real-time workflowTemplates from Firestore
    const unsubscribe = onSnapshot(
      collection(firestore, 'workflowTemplates'),
      (snapshot) => {
        const templates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkflowsList(templates);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching workflow templates:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const handleToggleWorkflow = (workflowId) => {
    if (selectedWorkflowIds.includes(workflowId)) {
      setSelectedWorkflowIds(selectedWorkflowIds.filter(id => id !== workflowId));
    } else {
      setSelectedWorkflowIds([...selectedWorkflowIds, workflowId]);
    }
  };

  const handleSave = () => {
    onSaveWorkflows(selectedWorkflowIds);
    onClose();
  };

  const filteredWorkflows = workflowsList.filter(wf =>
    (wf.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wf.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="56rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-diagram-project" style={{ color: 'var(--purple)' }}></i>
          <span>Attached Workflows</span>
        </div>
      }
      subtitle="Select the workflows to plug into this service"
    >
      <div className="modalForm">
        <div className="formGroup" style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            className="modalInput"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="stepsContainer" style={{ maxHeight: '18.75rem', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.25rem 0' }}>
              Loading workflow templates...
            </p>
          ) : filteredWorkflows.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.25rem 0' }}>
              No workflow templates available. Create workflows in the Workflows section first.
            </p>
          ) : (
            filteredWorkflows.map((wf) => {
              const isSelected = selectedWorkflowIds.includes(wf.id);
              const stepsCount = Array.isArray(wf.steps) ? wf.steps.length : 0;

              return (
                <div
                  key={wf.id}
                  className="stepCard"
                  onClick={() => handleToggleWorkflow(wf.id)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: isSelected ? '0.25rem solid var(--purple)' : '0.0625rem solid var(--border-color)',
                    background: isSelected ? 'var(--purple-light-2)' : 'var(--card-bg)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by row onClick
                      style={{ cursor: 'pointer', width: '1.125rem', height: '1.125rem' }}
                    />
                    <div className="stepContent">
                      <h4 style={{ color: isSelected ? 'var(--purple-dark)' : 'var(--text-dark)' }}>
                        {wf.name}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', margin: '0.125rem 0' }}>
                        {wf.description}
                      </p>
                      <span className="status-pill status-active" style={{ marginTop: '0.25rem' }}>
                        {stepsCount} Step{stepsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0 0.5rem 0' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--purple)' }}>
            {selectedWorkflowIds.length} Workflow{selectedWorkflowIds.length !== 1 ? 's' : ''} Selected
          </span>
        </div>

        <hr className="modalDivider" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.5rem' }}></i>
            Save Attached Workflows
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
