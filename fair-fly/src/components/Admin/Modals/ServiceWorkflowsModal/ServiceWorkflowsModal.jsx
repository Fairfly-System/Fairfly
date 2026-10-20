import React, { useState, useEffect, useMemo } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../../context/AuthContext';
import { fetchWorkflowTemplates, createWorkflowTemplate } from '../../../../services/workflowService';
import { fetchPublicBranches } from '../../../../services/branchService';
import { uploadFileToBackend } from '../../../../utils/fileUploadApi';
import { useToast } from '../../../UI/toast/ToastProvider';
import WorkflowModal from '../WorkflowModal/WorkflowModal';
import WorkflowDetailModal from '../WorkflowDetailModal/WorkflowDetailModal';
import useDebounce from '../../../../hooks/useDebounce';
import { firestore } from '../../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function ServiceWorkflowsModal({ isOpen, onClose, initialWorkflowIds = [], onSaveWorkflows }) {
  const { userToken, user, userDetails } = useAuthContext();
  const { addToast } = useToast();
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState(initialWorkflowIds);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [branchMap, setBranchMap] = useState({});

  // Nested New Workflow Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState(null);

  // Load branch directory for ownership resolution
  useEffect(() => {
    let isMounted = true;
    fetchPublicBranches(
      (data) => {
        if (!isMounted || !Array.isArray(data)) return;
        const map = {};
        data.forEach((b) => {
          const id = b.uid || b.id;
          if (id) {
            map[id] = b.branchName || b.name || b.address || b.location || 'Branch';
          }
        });
        setBranchMap(map);
      },
      (err) => console.warn('Could not load branch directory for service workflows:', err?.message)
    );
    return () => { isMounted = false; };
  }, []);

  const getWorkflowBranchName = (wf) => {
    if (!wf) return null;
    if (wf.branchName && typeof wf.branchName === 'string') return wf.branchName;
    const bUid = wf.branchUid || (wf.createdByRole === 'operator' || wf.createdByRole === 'branch_operator' ? wf.createdBy : null);
    if (!bUid) return null;
    if (user?.uid && bUid === user.uid) {
      return userDetails?.branchName || userDetails?.branchLocation || branchMap[bUid] || 'Your Branch';
    }
    return branchMap[bUid] || null;
  };

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

  const handleMoveUp = (e, workflowId) => {
    e.stopPropagation();
    const index = selectedWorkflowIds.indexOf(workflowId);
    if (index > 0) {
      const next = [...selectedWorkflowIds];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      setSelectedWorkflowIds(next);
    }
  };

  const handleMoveDown = (e, workflowId) => {
    e.stopPropagation();
    const index = selectedWorkflowIds.indexOf(workflowId);
    if (index >= 0 && index < selectedWorkflowIds.length - 1) {
      const next = [...selectedWorkflowIds];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      setSelectedWorkflowIds(next);
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

  const displayedWorkflows = useMemo(() => {
    if (searchTerm.trim()) {
      return workflowsList.filter(wf =>
        (wf.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (wf.description || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (wf.serviceType || wf.type || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    // Show selected workflows in their exact ordered sequence at top, then unselected
    const selected = selectedWorkflowIds
      .map(id => workflowsList.find(w => w.id === id))
      .filter(Boolean);
    const unselected = workflowsList.filter(w => !selectedWorkflowIds.includes(w.id));
    return [...selected, ...unselected];
  }, [workflowsList, selectedWorkflowIds, debouncedSearch, searchTerm]);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="68rem"
        width="95%"
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
            ) : displayedWorkflows.length === 0 ? (
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
              displayedWorkflows.map((wf) => {
                const orderIndex = selectedWorkflowIds.indexOf(wf.id);
                const isSelected = orderIndex !== -1;
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
                      transition: 'var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      {/* Checkbox with numeric sequence badge when selected */}
                      {isSelected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '1.5rem',
                            height: '1.5rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--purple-dark, #5558E3)',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(85, 88, 227, 0.3)'
                          }}
                          title={`Order #${orderIndex + 1} in service workflow execution sequence`}
                        >
                          {orderIndex + 1}
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {}} // handled by row onClick
                          style={{ cursor: 'pointer', width: '1.125rem', height: '1.125rem', accentColor: 'var(--purple-dark, #5558E3)', flexShrink: 0 }}
                        />
                      )}

                      <div className="stepContent" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, color: isSelected ? 'var(--purple-dark)' : 'var(--text-dark)' }}>
                            {wf.name}
                          </h4>
                          {isSelected && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--purple)', background: '#ede9fe', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                              Sequence #{orderIndex + 1}
                            </span>
                          )}
                          {wf.serviceType && (
                            <span className="status-pill status-pill-info" style={{ fontSize: '0.6875rem' }}>
                              {wf.serviceType}
                            </span>
                          )}
                          {(() => {
                            const bName = getWorkflowBranchName(wf);
                            const isBranchTmpl = Boolean(wf.branchUid || wf.createdByRole === 'operator' || wf.createdByRole === 'branch_operator');
                            if (bName) {
                              return (
                                <span className="status-pill" style={{ fontSize: '0.6875rem', background: 'rgba(46, 187, 76, 0.1)', color: 'var(--complete-green-dark, #1b8a36)', border: '1px solid rgba(46, 187, 76, 0.25)' }}>
                                  <i className="fa-solid fa-building-user"></i> {bName}
                                </span>
                              );
                            }
                            if (isBranchTmpl) {
                              return (
                                <span className="status-pill" style={{ fontSize: '0.6875rem', background: 'rgba(46, 187, 76, 0.1)', color: 'var(--complete-green-dark, #1b8a36)' }}>
                                  <i className="fa-solid fa-code-branch"></i> Branch Template
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {wf.description && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', margin: '0.125rem 0' }}>
                            {wf.description}
                          </p>
                        )}
                        <span className="status-pill status-pill-active" style={{ marginTop: '0.25rem', fontSize: '0.6875rem' }}>
                          {stepsCount} Step{stepsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons on the right side of workflow card */}
                    <div
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="icon-btn view"
                        title="View Workflow Details & Steps"
                        onClick={() => setPreviewWorkflow(wf)}
                        style={{ width: '1.875rem', height: '1.875rem', fontSize: '0.75rem' }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>

                      {isSelected && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => handleMoveUp(e, wf.id)}
                            disabled={orderIndex === 0}
                            title="Move workflow earlier in sequence"
                            style={{
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.75rem',
                              cursor: orderIndex === 0 ? 'not-allowed' : 'pointer',
                              opacity: orderIndex === 0 ? 0.35 : 1
                            }}
                          >
                            <i className="fa-solid fa-arrow-up"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => handleMoveDown(e, wf.id)}
                            disabled={orderIndex === selectedWorkflowIds.length - 1}
                            title="Move workflow later in sequence"
                            style={{
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.75rem',
                              cursor: orderIndex === selectedWorkflowIds.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: orderIndex === selectedWorkflowIds.length - 1 ? 0.35 : 1
                            }}
                          >
                            <i className="fa-solid fa-arrow-down"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0 0.5rem 0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--purple)' }}>
              {selectedWorkflowIds.length} Workflow{selectedWorkflowIds.length !== 1 ? 's' : ''} Selected
            </span>
            {selectedWorkflowIds.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="fa-solid fa-arrow-down-1-9"></i>
                Numeric badge indicates execution pipeline order. Use arrows to reorder.
              </span>
            )}
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

      {/* Workflow Detail Preview Modal */}
      <WorkflowDetailModal
        isOpen={Boolean(previewWorkflow)}
        onClose={() => setPreviewWorkflow(null)}
        workflow={previewWorkflow}
        canManage={false}
        isOperator={userDetails?.role === 'operator' || userDetails?.role === 'branch_operator'}
        branchName={previewWorkflow ? getWorkflowBranchName(previewWorkflow) : null}
      />
    </>
  );
}
