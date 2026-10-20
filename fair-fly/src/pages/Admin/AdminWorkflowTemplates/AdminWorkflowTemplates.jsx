import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './admin-workflow-templates.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import WorkflowModal from '../../../components/Admin/Modals/WorkflowModal/WorkflowModal';
import WorkflowDetailModal from '../../../components/Admin/Modals/WorkflowDetailModal/WorkflowDetailModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import DataTable from '../../../components/UI/DataTable/DataTable';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import { fetchPublicBranches } from '../../../services/branchService';
import useDebounce from '../../../hooks/useDebounce';
import { useFirestorePagination } from '../../../hooks/useFirestorePagination';
import { collection, getCountFromServer } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import toFriendlyMessage from '../../../utils/friendlyErrors';

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);

export default function AdminWorkflowTemplates() {
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isOperator = userDetails?.role === 'operator' || userDetails?.role === 'branch_operator';
  const [branchMap, setBranchMap] = useState({});

  // Load public branch directory to resolve branch ownership names
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
      (err) => console.warn('Could not load branch directory for workflow templates:', err?.message)
    );
    return () => { isMounted = false; };
  }, []);

  // Resolve human-readable branch name from template or branchMap
  const getWorkflowBranchName = useCallback(
    (tmpl) => {
      if (!tmpl) return null;
      if (tmpl.branchName && typeof tmpl.branchName === 'string') {
        return tmpl.branchName;
      }
      const bUid = tmpl.branchUid || (tmpl.createdByRole === 'operator' || tmpl.createdByRole === 'branch_operator' ? tmpl.createdBy : null);
      if (!bUid) return null;
      if (user?.uid && bUid === user.uid) {
        return userDetails?.branchName || userDetails?.branchLocation || branchMap[bUid] || 'Your Branch';
      }
      return branchMap[bUid] || null;
    },
    [branchMap, user?.uid, userDetails?.branchName, userDetails?.branchLocation]
  );

  // Determine whether current user owns or is authorized to edit/delete this template
  const canManageTemplate = useCallback(
    (tmpl) => {
      if (!isOperator) return true; // Admins / Superadmins have full authority
      if (!tmpl) return false;
      const currentUid = user?.uid;
      if (!currentUid) return false;
      return (
        (tmpl.branchUid && tmpl.branchUid === currentUid) ||
        (tmpl.createdBy && tmpl.createdBy === currentUid)
      );
    },
    [isOperator, user?.uid]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Search / Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [totalSystemCount, setTotalSystemCount] = useState(0);

  // Fetch total template count for chip badge
  useEffect(() => {
    let isMounted = true;
    const fetchTotal = async () => {
      try {
        const snap = await getCountFromServer(collection(firestore, 'workflowTemplates'));
        if (isMounted) setTotalSystemCount(snap.data().count);
      } catch (err) {
        console.warn('Total count notice for workflowTemplates:', err.message);
      }
    };
    fetchTotal();
    return () => { isMounted = false; };
  }, []);

  // Search and filter function for bounded query
  const searchFilterFn = useCallback(
    (tmpl) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (tmpl.name || '').toLowerCase().includes(q) ||
        (tmpl.serviceType || tmpl.type || '').toLowerCase().includes(q) ||
        (tmpl.description || '').toLowerCase().includes(q);

      const type = (tmpl.serviceType || tmpl.type || '').toLowerCase();
      const matchesType =
        serviceTypeFilter === 'all' ||
        type.includes(serviceTypeFilter.toLowerCase());

      return matchesSearch && matchesType;
    },
    [debouncedSearch, serviceTypeFilter]
  );

  // Query-level cursor pagination hook
  const {
    data: templates,
    loading,
    currentPage,
    pageSize,
    totalItems,
    goToPage,
    changePageSize,
  } = useFirestorePagination({
    collectionName: 'workflowTemplates',
    orderByField: 'createdAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    realtime: true,
    searchTerm: debouncedSearch || (serviceTypeFilter !== 'all' ? serviceTypeFilter : ''),
    searchFilterFn,
  });

  // Automatically deselect any templates that become unselectable for operators
  useEffect(() => {
    if (selectedIds.length > 0 && isOperator) {
      const validSelected = selectedIds.filter((id) => {
        const tmpl = templates.find((t) => t.id === id);
        return !tmpl || canManageTemplate(tmpl);
      });
      if (validSelected.length !== selectedIds.length) {
        setSelectedIds(validSelected);
      }
    }
  }, [templates, selectedIds, isOperator, canManageTemplate]);

  const alertBarProps = useMemo(() => {
    if (loading && templates.length === 0) return { message: 'Loading workflow templates...', type: 'info' };
    const total = totalItems || totalSystemCount;

    if (total === 0) {
      return { message: 'No workflow templates yet. Create one to start defining reusable service processes.', type: 'info' };
    }
    return {
      message: `${total} workflow template${total !== 1 ? 's' : ''} available for service automation.`,
      type: 'success',
    };
  }, [loading, templates.length, totalItems, totalSystemCount]);

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (tmpl) => {
    setViewingTemplate(tmpl);
  };

  const handleOpenEditModal = (tmpl) => {
    if (!canManageTemplate(tmpl)) {
      addToast('Operators can only edit workflow templates created by their branch.', 'error');
      return;
    }
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
            {tmpl.serviceType || tmpl.type || 'General'}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Template Name',
        render: (tmpl) => {
          const isOwner = canManageTemplate(tmpl);
          const isBranchTmpl = Boolean(tmpl.branchUid || tmpl.createdByRole === 'operator' || tmpl.createdByRole === 'branch_operator');
          const branchName = getWorkflowBranchName(tmpl);

          return (
            <div className="workflow-name-cell">
              <strong
                className="workflow-title-text workflow-clickable-title"
                onClick={() => handleOpenDetailModal(tmpl)}
                title="Click to view workflow details and steps"
              >
                {tmpl.name}
              </strong>
              {isOperator ? (
                isOwner ? (
                  <span className="workflow-ownership-pill branch" title={`Created by your branch: ${branchName || 'Your Branch'}`}>
                    <i className="fa-solid fa-code-branch"></i> Your Branch{branchName && branchName !== 'Your Branch' ? ` (${branchName})` : ''}
                  </span>
                ) : isBranchTmpl ? (
                  <span className="workflow-ownership-pill other-branch" title={`Created by branch: ${branchName || 'Other Branch'}`}>
                    <i className="fa-solid fa-building-user"></i> {branchName ? `Branch: ${branchName}` : 'Other Branch'}
                  </span>
                ) : (
                  <span className="workflow-ownership-pill global" title="Head Office Global Workflow (Read-only)">
                    <i className="fa-solid fa-building"></i> Head Office / Global
                  </span>
                )
              ) : (
                isBranchTmpl ? (
                  <span className="workflow-ownership-pill branch" title={`Created by branch: ${branchName || 'Branch Template'}`}>
                    <i className="fa-solid fa-building-user"></i> {branchName ? `Branch: ${branchName}` : 'Branch Template'}
                  </span>
                ) : (
                  <span className="workflow-ownership-pill global" title="Head Office / Global Template">
                    <i className="fa-solid fa-building"></i> Head Office / Global
                  </span>
                )
              )}
            </div>
          );
        },
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
        render: (tmpl) => {
          const canManage = canManageTemplate(tmpl);

          return (
            <div className="action-buttons">
              <button
                type="button"
                className="icon-btn view"
                title="View Workflow Details & Steps"
                disabled={isSubmitting || isConfirmLoading}
                onClick={() => handleOpenDetailModal(tmpl)}
              >
                <i className="fa-solid fa-eye"></i>
              </button>

              {canManage ? (
                <button
                  type="button"
                  className="icon-btn edit"
                  title="Edit Template"
                  disabled={isSubmitting || isConfirmLoading}
                  onClick={() => handleOpenEditModal(tmpl)}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              ) : (
                <button
                  type="button"
                  className="icon-btn disabled"
                  title="Operators can only edit workflow templates created by their branch"
                  disabled
                >
                  <i className="fa-solid fa-lock"></i>
                </button>
              )}

              <button
                type="button"
                className="icon-btn duplicate"
                title="Duplicate Template (Creates a new copy for your branch)"
                disabled={isSubmitting || isConfirmLoading}
                onClick={() => handleDuplicate(tmpl)}
              >
                <i className="fa-solid fa-copy"></i>
              </button>

              {canManage ? (
                <button
                  type="button"
                  className="icon-btn delete"
                  title="Delete Template"
                  disabled={isSubmitting || isConfirmLoading}
                  onClick={() => setConfirmState({ type: 'delete', template: tmpl })}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              ) : (
                <button
                  type="button"
                  className="icon-btn disabled"
                  title="Operators can only delete workflow templates created by their branch"
                  disabled
                >
                  <i className="fa-solid fa-lock"></i>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isSubmitting, isConfirmLoading, canManageTemplate, isOperator]
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
    if (editingTemplate && !canManageTemplate(editingTemplate)) {
      addToast('Operators can only update workflow templates created by their branch.', 'error');
      return;
    }
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
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl && !canManageTemplate(tmpl)) {
      addToast('Operators can only delete workflow templates created by their branch.', 'error');
      return;
    }
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
    if (isOperator) {
      const unauthorized = ids.some((id) => {
        const tmpl = templates.find((t) => t.id === id);
        return tmpl && !canManageTemplate(tmpl);
      });
      if (unauthorized) {
        addToast('Selected items contain templates created by Head Office or other branches that you cannot delete.', 'error');
        return;
      }
    }
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
    if (!tmpl?.id) return;
    setIsSubmitting(true);
    const copyName = `${tmpl.name || 'Workflow'} (Copy)`;

    return ApiCaller(
      `${API_BASE_URL}/api/workflows/${tmpl.id}/duplicate`,
      'POST',
      { name: copyName },
      authHeaders,
      () => {
        addToast(`Duplicated "${tmpl.name}" successfully`, 'success');
      },
      (err) => {
        console.warn('Backend duplicate endpoint fallback notice:', err.message);
        // Fallback: create fresh template with strictly whitelisted specification fields
        const payload = {
          name: copyName,
          description: tmpl.description || '',
          serviceType: tmpl.serviceType || tmpl.type || 'General',
          steps: Array.isArray(tmpl.steps) ? tmpl.steps : [],
          status: 'active'
        };
        if (tmpl.category) payload.category = tmpl.category;

        ApiCaller(
          `${API_BASE_URL}/api/workflows`,
          'POST',
          payload,
          authHeaders,
          () => addToast(`Duplicated "${tmpl.name}" successfully`, 'success'),
          (fallbackErr) => addToast('Failed to duplicate template: ' + fallbackErr.message, 'error'),
          setIsSubmitting
        );
      },
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
    { label: 'Dashboard', to: userDetails?.role === 'operator' ? '/operator' : '/admin' },
    { label: 'Workflows' },
  ];

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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { value: 'all', label: `All (${totalSystemCount || totalItems})` },
              { value: 'psa', label: 'PSA' },
              { value: 'passport', label: 'Passport' },
              { value: 'visa', label: 'Visa' },
            ]}
            activeChip={serviceTypeFilter}
            onChipChange={(val) => setServiceTypeFilter(val)}
          />
        </div>

        {/* Reusable DataTable */}
        <DataTable
          columns={columns}
          data={templates}
          keyField="id"
          selectable={true}
          isRowSelectable={(tmpl) => canManageTemplate(tmpl)}
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
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </section>

      {/* Create / Edit Workflow Modal */}
      <WorkflowModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingTemplate}
        isLoading={isSubmitting}
      />

      {/* Workflow Detail View Modal */}
      <WorkflowDetailModal
        isOpen={Boolean(viewingTemplate)}
        onClose={() => setViewingTemplate(null)}
        workflow={viewingTemplate}
        canManage={canManageTemplate(viewingTemplate)}
        isOperator={isOperator}
        branchName={getWorkflowBranchName(viewingTemplate)}
        onEdit={(tmpl) => handleOpenEditModal(tmpl)}
        onDuplicate={(tmpl) => handleDuplicate(tmpl)}
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
