import React, { useState, useEffect, useMemo } from 'react';
import './admin-workflow-templates.css';
import ModalWrapper from '../../../components/Admin/Modals/ModalWrapper';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal';
import WorkflowForm from '../../../components/Admin/Modals/WorkflowForm';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import {
  createWorkflowTemplate,
  getWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  duplicateWorkflowTemplate
} from '../../../services/workflowService';
import { useToast } from '../../../components/UI/toast/ToastProvider';

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function AdminWorkflowTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const { addToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

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

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchesSearch =
        (tmpl.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tmpl.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        serviceTypeFilter === 'all' ||
        (tmpl.serviceType || '').toLowerCase() === serviceTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [templates, searchTerm, serviceTypeFilter]);

  // Paginated slice
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, currentPage, pageSize]);

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
      await updateWorkflowTemplate(editingTemplate.id, templateData);
      await loadTemplates();
      setIsModalOpen(false);
      setEditingTemplate(null);
      addToast('Workflow template updated successfully', 'success');
    } catch (error) {
      console.error('Error updating workflow template:', error);
      addToast('Failed to update workflow template: ' + error.message, 'error');
    }
  };

  const handleDuplicate = async (tmpl) => {
    try {
      await duplicateWorkflowTemplate(tmpl.id);
      await loadTemplates();
      addToast(`Duplicated "${tmpl.name}" successfully`, 'success');
    } catch (error) {
      console.error('Error duplicating workflow template:', error);
      addToast('Failed to duplicate template: ' + error.message, 'error');
    }
  };

  const handleDelete = async (templateId) => {
    try {
      setIsConfirmLoading(true);
      await deleteWorkflowTemplate(templateId);
      await loadTemplates();
      addToast('Workflow template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      addToast('Failed to delete template: ' + error.message, 'error');
    } finally {
      setIsConfirmLoading(false);
      setConfirmState(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // ── AlertBar logic (must be before any early return — Rules of Hooks) ─────
  const alertBarProps = useMemo(() => {
    const total      = templates.length;
    const emptySteps = templates.filter(t => !t.steps || t.steps.length === 0).length;
    const totalSteps = templates.reduce((acc, t) => acc + (t.steps?.length || 0), 0);

    if (total === 0) {
      return { message: 'No workflow templates yet. Create one to start defining reusable service processes.', type: 'info' };
    }
    if (emptySteps > 0) {
      return {
        message: `${emptySteps} template${emptySteps !== 1 ? 's have' : ' has'} no steps defined yet. Add steps before assigning them to services.`,
        type: 'warning',
      };
    }
    return {
      message: `${total} template${total !== 1 ? 's' : ''} ready — ${totalSteps} total step${totalSteps !== 1 ? 's' : ''} across all workflows.`,
      type: 'success',
    };
  }, [templates]);

  if (loading) {
    return (
      <div className="card workflow-template-page page-fade-in">
        <div className="workflow-template-header">
          <div>
            <h2>Workflow Templates</h2>
            <p>Loading template configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card workflow-template-page page-fade-in">
      <div className="workflow-template-header">
        <div>
          <h2>Workflow Templates Management</h2>
          <p>Define standard multi-step workflow processes for service fulfillment</p>
        </div>

        <div className="header-actions">
          <button className="workflow-btn" onClick={handleOpenAddModal}>
            <i className="fa-solid fa-plus"></i>
            Create Template
          </button>
        </div>
      </div>

      <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

      {/* Toolbar Search & Filters */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search template name or service type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${serviceTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setServiceTypeFilter('all');
              setCurrentPage(1);
            }}
          >
            All ({templates.length})
          </button>
          <button
            className={`filter-chip ${serviceTypeFilter === 'psa' ? 'active' : ''}`}
            onClick={() => {
              setServiceTypeFilter('psa');
              setCurrentPage(1);
            }}
          >
            PSA
          </button>
          <button
            className={`filter-chip ${serviceTypeFilter === 'passport' ? 'active' : ''}`}
            onClick={() => {
              setServiceTypeFilter('passport');
              setCurrentPage(1);
            }}
          >
            Passport
          </button>
          <button
            className={`filter-chip ${serviceTypeFilter === 'visa' ? 'active' : ''}`}
            onClick={() => {
              setServiceTypeFilter('visa');
              setCurrentPage(1);
            }}
          >
            Visa
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Service Type</th>
              <th>Template Name</th>
              <th>Steps Count</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTemplates.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  <i className="fa-solid fa-diagram-project empty-icon"></i>
                  <p>No workflow templates match your filter</p>
                </td>
              </tr>
            ) : (
              paginatedTemplates.map((tmpl) => (
                <tr key={tmpl.id}>
                  <td>
                    <span className="workflow-badge">
                      {tmpl.serviceType || 'General'}
                    </span>
                  </td>
                  <td>
                    <strong>{tmpl.name}</strong>
                  </td>
                  <td>
                    <span className="steps-count-pill">
                      <i className="fa-solid fa-[#6B6FF5] fa-bars-staggered"></i>
                      {tmpl.steps?.length || 0} Steps
                    </span>
                  </td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button
                        className="icon-btn edit"
                        title="Edit Template"
                        onClick={() => handleOpenEditModal(tmpl)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        className="icon-btn duplicate"
                        title="Duplicate Template"
                        onClick={() => handleDuplicate(tmpl)}
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete Template"
                        onClick={() => setConfirmState({ type: 'delete', template: tmpl })}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredTemplates.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Create / Edit Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i
              className={`fa-solid ${editingTemplate ? 'fa-pen-to-square' : 'fa-plus'}`}
              style={{ color: 'var(--purple)' }}
            ></i>
            <span>
              {editingTemplate ? 'Edit Workflow Template' : 'Create Workflow Template'}
            </span>
          </div>
        }
        subtitle={
          editingTemplate
            ? 'Modify step definitions and configuration'
            : 'Configure a new multi-step workflow template'
        }
      >
        <WorkflowForm
          key={editingTemplate?.id || 'new'}
          onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          initialData={editingTemplate}
          onCancel={handleCloseModal}
        />
      </ModalWrapper>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState?.type === 'delete'}
        onClose={() => setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete Workflow Template?"
        Desc={`"${confirmState?.template?.name}" will be permanently deleted.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={() => handleDelete(confirmState.template.id)}
      />
    </div>
  );
}
