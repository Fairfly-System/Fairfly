import React, { useState, useMemo } from 'react';
import './admin-workflow-templates.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import WorkflowModal from '../../../components/Admin/Modals/WorkflowModal/WorkflowModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);

export default function AdminWorkflowTemplates() {
  // ── Data from onSnapshot (AdminContext) ─────────────────────────────────
  const { data: templates, loading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // ── Modal & editing state ─────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Search / Filter state ─────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  // ── Pagination state ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // ── AlertBar (must be before any early return — Rules of Hooks) ───────
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

  // ── Filtered + paginated slices ───────────────────────────────────────
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

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, currentPage, pageSize]);

  // ── Early loading return (all hooks above this point) ─────────────────
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

  // ── Auth header helper ─────────────────────────────────────────────────
  const authHeaders = { Authorization: `Bearer ${userToken}` };

  // ── Mutations via fly-api ──────────────────────────────────────────────
  const handleCreateTemplate = async (templateData) => {
    const result = await ApiCaller(
      `${API_BASE_URL}/api/workflow/templates`,
      'POST',
      templateData,
      authHeaders,
      null,
      (err) => addToast('Failed to create template: ' + err.message, 'error'),
      setIsSubmitting
    );
    if (result) {
      setIsModalOpen(false);
      addToast('Workflow template created successfully', 'success');
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    const result = await ApiCaller(
      `${API_BASE_URL}/api/workflow/templates/${editingTemplate.id}`,
      'PATCH',
      templateData,
      authHeaders,
      null,
      (err) => addToast('Failed to update template: ' + err.message, 'error'),
      setIsSubmitting
    );
    if (result) {
      setIsModalOpen(false);
      setEditingTemplate(null);
      addToast('Workflow template updated successfully', 'success');
    }
  };

  const handleDelete = async (templateId) => {
    setIsConfirmLoading(true);
    const result = await ApiCaller(
      `${API_BASE_URL}/api/workflow/templates/${templateId}`,
      'DELETE',
      null,
      authHeaders,
      null,
      (err) => addToast('Failed to delete template: ' + err.message, 'error')
    );
    if (result) {
      addToast('Workflow template deleted successfully', 'success');
    }
    setIsConfirmLoading(false);
    setConfirmState(null);
  };

  // Duplicate: read existing from already-loaded templates array, then POST a new one
  const handleDuplicate = async (tmpl) => {
    const { id, createdAt, updatedAt, version, status, ...rest } = tmpl;
    const result = await ApiCaller(
      `${API_BASE_URL}/api/workflow/templates`,
      'POST',
      { ...rest, name: `${tmpl.name} (Copy)` },
      authHeaders,
      null,
      (err) => addToast('Failed to duplicate template: ' + err.message, 'error'),
      setIsSubmitting
    );
    if (result) {
      addToast(`Duplicated "${tmpl.name}" successfully`, 'success');
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────
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

        <FilterChipGroup
          chips={[
            { value: 'all', label: `All (${templates.length})` },
            { value: 'psa', label: 'PSA' },
            { value: 'passport', label: 'Passport' },
            { value: 'visa', label: 'Visa' },
          ]}
          activeChip={serviceTypeFilter}
          onChipChange={(val) => {
            setServiceTypeFilter(val);
            setCurrentPage(1);
          }}
        />
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
                      <i className="fa-solid fa-bars-staggered"></i>
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
                        disabled={isSubmitting}
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
      <WorkflowModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingTemplate={editingTemplate}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        isLoading={isSubmitting}
      />

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
