import React, { useState, useEffect } from 'react';
import './admin-workflow-templates.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import WorkflowForm from '../../../components/AdminComponents/Modals/WorkflowForm';
import {
  createWorkflowTemplate,
  getWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  duplicateWorkflowTemplate
} from '../../../services/workflowService';

export default function AdminWorkflowTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateToDuplicate, setTemplateToDuplicate] = useState(null);

  // Load templates on component mount
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await createWorkflowTemplate(templateData);
      await loadTemplates();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      alert('Failed to create workflow template: ' + error.message);
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      if (!editingTemplate) throw new Error('No template selected for update');
      await updateWorkflowTemplate(editingTemplate.id, templateData);
      await loadTemplates();
      setIsEditModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating workflow template:', error);
      alert('Failed to update workflow template: ' + error.message);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this workflow template? This action cannot be undone.')) {
      try {
        setDeleting(templateId);
        await deleteWorkflowTemplate(templateId);
        await loadTemplates();
      } catch (error) {
        console.error('Error deleting workflow template:', error);
        alert('Failed to delete workflow template: ' + error.message);
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      setTemplateToDuplicate(templateId);
      // In a real implementation, you might want to open a modal for duplication options
      // For now, we'll duplicate with a default name
      const newTemplateId = await duplicateWorkflowTemplate(templateId, {
        name: 'Copy of Template' // Will be updated by the service
      });
      await loadTemplates();
      setTemplateToDuplicate(null);
    } catch (error) {
      console.error('Error duplicating workflow template:', error);
      alert('Failed to duplicate workflow template: ' + error.message);
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
                <td>{template.steps?.length || 0} steps</td>
                <td><span className="workflow-badge">{template.status}</span></td>
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
                      className="icon-btn delete"
                      title="Delete"
                      onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Create Workflow Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workflow Template"
        subtitle="Define a new workflow template"
      >
        <WorkflowForm onSubmit={handleCreateTemplate} />
      </ModalWrapper>

      {/* Edit Workflow Modal */}
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
        />
      </ModalWrapper>
    </div>
  );
}