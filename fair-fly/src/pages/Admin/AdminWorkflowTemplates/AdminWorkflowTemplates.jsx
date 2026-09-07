import React, { useState, useMemo } from 'react';
import './admin-workflow-templates.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import WorkflowModal from '../../../components/Admin/Modals/WorkflowModal/WorkflowModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import DataTable from '../../../components/UI/DataTable/DataTable';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);

export default function AdminWorkflowTemplates() {
  const { data: templates, loading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Search / Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const alertBarProps = useMemo(() => {
    if (!templates) return { message: 'Loading...', type: 'info' };
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

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((tmpl) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        (tmpl.name || '').toLowerCase().includes(q) ||
        (tmpl.serviceType || '').toLowerCase().includes(q);

      const matchesType =
        serviceTypeFilter === 'all' ||
        (tmpl.serviceType || '').toLowerCase() === serviceTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [templates, debouncedSearch, serviceTypeFilter]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, currentPage, pageSize]);

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: 'serviceType',
        header: 'Service Type',
        render: (tmpl) => (
          <span className="workflow-badge">
            {tmpl.serviceType || 'General'}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Template Name',
        render: (tmpl) => <strong>{tmpl.name}</strong>,
      },
      {
        key: 'steps',
        header: 'Steps Count',
        render: (tmpl) => (
          <span className="steps-count-pill">
            <i className="fa-solid fa-bars-staggered"></i>
            {tmpl.steps?.length || 0} Steps
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (tmpl) => (
          <div className="action-buttons">
            <button
              className="icon-btn edit"
              title="Edit Template"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleOpenEditModal(tmpl)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              className="icon-btn duplicate"
              title="Duplicate Template"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleDuplicate(tmpl)}
            >
              <i className="fa-solid fa-copy"></i>
            </button>
            <button
              className="icon-btn delete"
              title="Delete Template"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => setConfirmState({ type: 'delete', template: tmpl })}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    [isSubmitting, isConfirmLoading]
  );

  const authHeaders = { Authorization: `Bearer ${userToken}` };

  const processPendingFilesForWorkflow = async (templateData) => {
    if (!templateData || !Array.isArray(templateData.steps)) {
      return templateData;
    }

    const updatedSteps = await Promise.all(
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

    return {
      ...templateData,
      steps: updatedSteps,
    };
  };

  const handleCreateTemplate = async (templateData) => {
    setIsSubmitting(true);
    try {
      const processedData = await processPendingFilesForWorkflow(templateData);
      return await ApiCaller(
        `${API_BASE_URL}/api/workflow/templates`,
        'POST',
        processedData,
        authHeaders,
        () => {
          setIsModalOpen(false);
          setEditingTemplate(null);
          addToast('Workflow template created successfully', 'success');
        },
        (err) => addToast('Failed to create template: ' + err.message, 'error'),
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error uploading step document attachments:', err);
      addToast('Failed to upload step document attachment: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    setIsSubmitting(true);
    try {
      const processedData = await processPendingFilesForWorkflow(templateData);
      return await ApiCaller(
        `${API_BASE_URL}/api/workflow/templates/${editingTemplate.id}`,
        'PATCH',
        processedData,
        authHeaders,
        () => {
          setIsModalOpen(false);
          setEditingTemplate(null);
          addToast('Workflow template updated successfully', 'success');
        },
        (err) => addToast('Failed to update template: ' + err.message, 'error'),
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error uploading step document attachments:', err);
      addToast('Failed to upload step document attachment: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (templateId) => {
    return ApiCaller(
      `${API_BASE_URL}/api/workflow/templates/${templateId}`,
      'DELETE',
      null,
      authHeaders,
      () => {
        addToast('Workflow template deleted successfully', 'success');
        setConfirmState(null);
      },
      (err) => addToast('Failed to delete template: ' + err.message, 'error'),
      setIsConfirmLoading
    );
  };

  const handleBulkDelete = async (ids) => {
    return ApiCaller(
      `${API_BASE_URL}/api/workflow/templates/bulk-delete`,
      'POST',
      { ids },
      authHeaders,
      () => {
        addToast(`${ids.length} template(s) deleted successfully`, 'success');
        setSelectedIds([]);
        setConfirmState(null);
      },
      (err) => addToast('Failed to delete templates: ' + err.message, 'error'),
      setIsConfirmLoading
    );
  };

  const handleDuplicate = async (tmpl) => {
    const { id, createdAt, updatedAt, version, status, ...rest } = tmpl;
    return ApiCaller(
      `${API_BASE_URL}/api/workflow/templates`,
      'POST',
      { ...rest, name: `${tmpl.name} (Copy)` },
      authHeaders,
      () => {
        addToast(`Duplicated "${tmpl.name}" successfully`, 'success');
      },
      (err) => addToast('Failed to duplicate template: ' + err.message, 'error'),
      setIsSubmitting
    );
  };

  const handleFormSubmit = async (formData) => {
    if (editingTemplate) {
      await handleUpdateTemplate(formData);
    } else {
      await handleCreateTemplate(formData);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Workflows' },
  ];

  const totalTemplates = Array.isArray(templates) ? templates.length : 0;

  return (
    <main className="workflow-template-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Workflow Templates"
        subtitle="Create and manage step-by-step workflow templates for service automation"
        illustrationSrc="/pageImages/admin/workflow-templates.png"
        primaryAction={{
          label: 'New Template',
          icon: 'fa-solid fa-plus',
          onClick: handleOpenAddModal,
        }}
      />

      <section className="card workflow-template-table-card">
        <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

        {/* Search & Filter Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by template name or type..."
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
              { value: 'all', label: `All (${totalTemplates})` },
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

        {/* Reusable DataTable */}
        <DataTable
          columns={columns}
          data={paginatedTemplates}
          keyField="id"
          selectable={true}
          selectedIds={selectedIds}
          isLoading={loading}
          disabled={isConfirmLoading || isSubmitting}
          onSelectionChange={setSelectedIds}
          onBulkDelete={(ids) => setConfirmState({ type: 'bulk-delete', ids })}
          emptyState={{
            icon: 'fa-solid fa-diagram-project',
            message: 'No workflow templates match your filter',
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Modal */}
      <WorkflowModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingTemplate}
        isLoading={isSubmitting}
      />

      {/* Single Delete Confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === 'delete'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete Workflow Template?"
        Desc={`"${confirmState?.template?.name}" will be permanently deleted. Continue?`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={() => handleDelete(confirmState?.template?.id)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === 'bulk-delete'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title={`Delete ${confirmState?.ids?.length || 0} selected templates?`}
        Desc={`${confirmState?.ids?.length || 0} workflow templates will be permanently deleted. Continue?`}
        BtnColor="var(--error-red)"
        confirmText="Delete Selected"
        isLoading={isConfirmLoading}
        OnConfirm={() => handleBulkDelete(confirmState?.ids)}
      />
    </main>
  );
}
