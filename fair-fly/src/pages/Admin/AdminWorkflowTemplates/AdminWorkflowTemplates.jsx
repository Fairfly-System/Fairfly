import React, { useState, useEffect } from 'react';
import './admin-workflow-templates.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import ConfirmationModal from '../../../components/AdminComponents/Modals/ConfirmationModal';
import WorkflowForm from '../../../components/AdminComponents/Modals/WorkflowForm';
import {
  createWorkflowTemplate,
  getWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  duplicateWorkflowTemplate
} from '../../../services/workflowService';
import { useToast } from '../../../components/toast/ToastProvider';

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function AdminWorkflowTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateToDuplicate, setTemplateToDuplicate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const tmpls = await getWorkflowTemplates();
      setTemplates(tmpls);
    } catch (error) {
      console.error('Error loading workflow templates:', error);
      addToast('Failed to load workflow templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await createWorkflowTemplate(templateData);
      await loadTemplates();
      setIsModalOpen(false);
      addToast('Workflow template created successfully', 'success');
    } catch (error) {
      console.error('Error creating workflow template:', error);
      addToast('Failed to create workflow template: ' + error.message, 'error');
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      if (!editingTemplate) throw new Error('No template selected for update');
      await updateWorkflowTemplate(editingTemplate.id, templateData);
      await loadTemplates();
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      addToast('Workflow template updated successfully', 'success');
    } catch (error) {
      console.error('Error updating workflow template:', error);
      addToast('Failed to update workflow template: ' + error.message, 'error');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget);
      setDeleteTarget(null);
      await deleteWorkflowTemplate(deleteTarget);
      await loadTemplates();
      addToast('Workflow template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      addToast('Failed to delete workflow template: ' + error.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (template) => {
    const newStatus = template.status === 'active' ? 'disabled' : 'active';
    try {
      setIsConfirmLoading(true);
      await updateWorkflowTemplate(template.id, { status: newStatus });
      await loadTemplates();
      addToast(`Workflow template ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`, 'success');
      setConfirmState(null);
    } catch (error) {
      addToast(`Failed to ${newStatus === 'active' ? 'enable' : 'disable'} template: ` + error.message, 'error');
      console.error(`Error ${newStatus === 'active' ? 'enabling' : 'disabling'} template:`, error);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    if (confirmState.type === 'toggle') {
      await handleToggleStatus(confirmState.template);
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      setTemplateToDuplicate(templateId);
      await duplicateWorkflowTemplate(templateId, {
        name: 'Copy of Template'
      });
      await loadTemplates();
      setTemplateToDuplicate(null);
      addToast('Workflow template duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating workflow template:', error);
      addToast('Failed to duplicate workflow template: ' + error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="card workflow-template-page">
        <div className="workflow-template-header">
          <div>
            <h2>Workflow Templates</h2>
            <p>Create and manage workflow templates for business processes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card workflow-template-page">
      <div className="workflow-template-header">
        <div>
          <h2>Workflow Templates</h2>
          <p>Create and manage workflow templates for business processes</p>
        </div>

        <div className="header-actions">
          <button className="workflow-btn" onClick={() => setIsModalOpen(true)}>
            <i className="fa-solid fa-plus"></i>
            New Workflow Template
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Workflow Name</th>
            <th>Description</th>
            <th>Type</th>
            <th>Steps</th>
            <th>Status</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {templates.length === 0 ? (
            <tr>
              <td colSpan="6">No workflow templates found</td>
            </tr>
          ) : (
            templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.description.substring(0, 100)}{template.description.length > 100 ? '...' : ''}</td>
                <td>{template.type || 'N/A'}</td>
                <td><span className="steps">{template.steps?.length || 0}</span></td>
                <td><span className={`workflow-badge ${template.status === 'disabled' ? 'inactive' : ''}`}>{template.status}</span></td>
                <td className="actions-col">
                  <div className="action-buttons">
                    <button
                      className="icon-btn edit"
                      title="Edit"
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      className="icon-btn duplicate"
                      title="Duplicate"
                      onClick={() => handleDuplicateTemplate(template.id)}
                      disabled={deleting === template.id || templateToDuplicate === template.id}
                    >
                      {templateToDuplicate === template.id ? 'Duplicating...' : <i className="fa-solid fa-copy"></i>}
                    </button>
                    <button
                      className="icon-btn ban"
                      title={template.status === 'active' ? 'Disable' : 'Enable'}
                      onClick={() => setConfirmState({ type: 'toggle', template })}
                    >
                      <i className={`fa-solid ${template.status === 'active' ? 'fa-ban' : 'fa-circle-check'}`}></i>
                    </button>
                    <button
                      className="icon-btn delete"
                      title="Delete"
                      onClick={() => setDeleteTarget(template.id)}
                      disabled={deleting === template.id}
                    >
                      {deleting === template.id ? 'Deleting...' : <i className="fa-solid fa-trash"></i>}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workflow Template"
        subtitle="Define a new workflow template"
      >
        <WorkflowForm onSubmit={handleCreateTemplate} onClose={() => setIsModalOpen(false)} />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTemplate(null);
        }}
        title="Edit Workflow Template"
        subtitle="Modify an existing workflow template"
      >
        <WorkflowForm
          templateData={editingTemplate}
          onSubmit={handleUpdateTemplate}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTemplate(null);
          }}
        />
      </ModalWrapper>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        Icon={TrashIcon}
        Title="Delete this workflow template?"
        Desc="This workflow template will be permanently removed. This action can't be undone."
        BtnColor="#ef4444"
        confirmText="Delete"
        isLoading={deleting === deleteTarget}
        OnConfirm={handleDeleteTemplate}
      />

      <ConfirmationModal
        isOpen={confirmState?.type === 'toggle'}
        onClose={() => setConfirmState(null)}
        Icon={BanIcon}
        Title={
          confirmState?.template?.status === 'active'
            ? 'Disable this workflow template?'
            : 'Enable this workflow template?'
        }
        Desc={
          confirmState?.template?.status === 'active'
            ? `"${confirmState?.template?.name}" will not be available for new instances until re-enabled.`
            : `"${confirmState?.template?.name}" will become available for new instances again.`
        }
        BtnColor="#f97316"
        confirmText={
          confirmState?.template?.status === 'active' ? 'Disable' : 'Enable'
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </div>
  );
}
