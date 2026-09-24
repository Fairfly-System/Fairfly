import React, { useState, useEffect } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../../context/AuthContext';
import { fetchWorkflowTemplates, createWorkflowTemplate } from '../../../../services/workflowService';
import { uploadFileToBackend } from '../../../../utils/fileUploadApi';
import { useToast } from '../../../UI/toast/ToastProvider';
import WorkflowModal from '../WorkflowModal/WorkflowModal';
import useDebounce from '../../../../hooks/useDebounce';
import { firestore } from '../../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function ServiceWorkflowsModal({ isOpen, onClose, initialWorkflowIds = [], onSaveWorkflows }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState(initialWorkflowIds);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Nested New Workflow Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  useEffect(() => {
    setSelectedWorkflowIds(initialWorkflowIds);
  }, [isOpen, initialWorkflowIds]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    // Subscribe to Firestore realtime updates for workflowTemplates
    const unsubscribe = onSnapshot(
      collection(firestore, 'workflowTemplates'),
      (snapshot) => {
        const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkflowsList(templates);
        setLoading(false);
      },
      (error) => {
        console.warn('Realtime workflow templates listener error, falling back to API:', error);
        if (userToken) {
          fetchWorkflowTemplates(
            userToken,
            (data) => {
              setWorkflowsList(data || []);
              setLoading(false);
            },
            (err) => {
              console.error('Error fetching workflow templates:', err);
              setLoading(false);
            },
            setLoading
          );
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [isOpen, userToken]);

  const handleToggleWorkflow = (workflowId) => {
    if (selectedWorkflowIds.includes(workflowId)) {
      setSelectedWorkflowIds(selectedWorkflowIds.filter(id => id !== workflowId));
    } else {
      setSelectedWorkflowIds([...selectedWorkflowIds, workflowId]);
    }
  };

  const handleCreateWorkflow = async (templateData) => {
    setIsSubmittingWorkflow(true);
    try {
      let updatedSteps = templateData.steps || [];
      if (Array.isArray(templateData.steps)) {
        updatedSteps = await Promise.all(
          templateData.steps.map(async (step) => {
            if (step.file && step.file.pendingFile) {
              const file = step.file.pendingFile;
              const { url: downloadUrl } = await uploadFileToBackend(file, 'workflow_documents', userToken);
              const { pendingFile, ...restFile } = step.file;
              return {
                ...step,
                file: {
                  ...restFile,
                  url: downloadUrl,
                },
              };
            }
            return step;
          })
        );
      }

      const payload = {
        ...templateData,
        steps: updatedSteps,
      };

      createWorkflowTemplate(
        userToken,
        payload,
        (res) => {
          setIsSubmittingWorkflow(false);
          setIsCreateModalOpen(false);
          addToast('Workflow template created and attached!', 'success');
          if (res?.id) {
            setSelectedWorkflowIds((prev) => Array.from(new Set([...prev, res.id])));
          }
        },
        (err) => {
          console.error('Error creating workflow template:', err);
          addToast('Failed to create workflow: ' + (err.message || 'Error occurred'), 'error');
          setIsSubmittingWorkflow(false);
        },
        setIsSubmittingWorkflow
      );
    } catch (err) {
      console.error('Error processing step attachments:', err);
      addToast('Failed to upload step document attachment: ' + err.message, 'error');
      setIsSubmittingWorkflow(false);
    }
  };

  const handleSave = () => {
    onSaveWorkflows(selectedWorkflowIds);
    onClose();
  };

  const filteredWorkflows = workflowsList.filter(wf =>
    (wf.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (wf.description || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (wf.serviceType || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <>
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
        subtitle="Select the workflows to plug into this service or create a new one"
      >
        <div className="modalForm">
          <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.875rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  pointerEvents: 'none'
                }}
              ></i>
              <input
                type="text"
                className="modalInput"
                placeholder="Search workflows by name, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.375rem', margin: 0 }}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>New Workflow</span>
            </button>
          </div>

          <div className="stepsContainer" style={{ maxHeight: '18.75rem', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.25rem 0' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Loading workflow templates...
              </p>
            ) : filteredWorkflows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.5rem 0' }}>
                <p style={{ margin: '0 0 0.75rem 0' }}>
                  {searchTerm
                    ? 'No workflows match your search query.'
                    : 'No workflow templates available.'}
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <i className="fa-solid fa-plus"></i> Create New Workflow Template
                </button>
              </div>
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
                      background: isSelected ? 'var(--selection-bg, rgba(107, 111, 245, 0.045))' : 'var(--card-bg)',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row onClick
                        style={{ cursor: 'pointer', width: '1.125rem', height: '1.125rem', accentColor: 'var(--purple-dark, #5558E3)' }}
                      />
                      <div className="stepContent">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: isSelected ? 'var(--purple-dark)' : 'var(--text-dark)' }}>
                            {wf.name}
                          </h4>
                          {wf.serviceType && (
                            <span className="status-pill" style={{ fontSize: '0.6875rem' }}>
                              {wf.serviceType}
                            </span>
                          )}
                        </div>
                        {wf.description && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', margin: '0.125rem 0' }}>
                            {wf.description}
                          </p>
                        )}
                        <span className="status-pill status-active" style={{ marginTop: '0.25rem', fontSize: '0.6875rem' }}>
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

      {/* Nested Create Workflow Modal */}
      <WorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkflow}
        isLoading={isSubmittingWorkflow}
      />
    </>
  );
}
