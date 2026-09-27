import React, { useState, useMemo, useCallback } from 'react';
import './admin-quick-links.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import QuickLinkModal from '../../../components/Admin/Modals/QuickLinkModal/QuickLinkModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import DataTable from '../../../components/UI/DataTable/DataTable';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { useAuthContext } from '../../../context/AuthContext';
import ApiCaller from '../../../utils/ApiCaller';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { API_BASE_URL } from '../../../utils/config';
import { useFirestorePagination } from '../../../hooks/useFirestorePagination';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';

export default function QuickLinksContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  const [deleteLinkTarget, setDeleteLinkTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchFilterFn = useCallback(
    (link) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (link.title || '').toLowerCase().includes(q) ||
        (link.url || '').toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'all' ||
        (link.category || '').toLowerCase().replace(/\s+/g, '') ===
        categoryFilter.toLowerCase().replace(/\s+/g, '');

      return matchesSearch && matchesCategory;
    },
    [debouncedSearch, categoryFilter]
  );

  const {
    data: quickLinksList,
    loading: isQuickLinksLoading,
    currentPage,
    pageSize,
    totalItems,
    unfilteredTotal,
    goToPage,
    changePageSize,
    refetchCount,
  } = useFirestorePagination({
    collectionName: 'quickLinks',
    orderByField: 'createdAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    realtime: true,
    searchTerm: debouncedSearch || (categoryFilter !== 'all' ? categoryFilter : ''),
    searchFilterFn,
  });

  const handleOpenAddModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return;
    setIsModalOpen(false);
    setEditingLink(null);
  };

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: 'category',
        header: 'Category',
        render: (link) => {
          const categoryClass = `category-${(link.category || 'other')
            .toLowerCase()
            .replace(/\s+/g, '')}`;
          return (
            <span className={`quicklink-badge ${categoryClass}`}>
              {link.category || 'Other'}
            </span>
          );
        },
      },
      {
        key: 'title',
        header: 'Title',
        render: (link) => <strong>{link.title}</strong>,
      },
      {
        key: 'url',
        header: 'Link URL',
        render: (link) => (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="quicklink-url"
          >
            <span>{link.url}</span>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (link) => (
          <>
            <button
              className="icon-btn edit"
              title="Edit Quick Link"
              disabled={isLoading || isDeleting}
              onClick={() => handleOpenEditModal(link)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              className="icon-btn delete"
              title="Delete Quick Link"
              disabled={isLoading || isDeleting}
              onClick={() => setDeleteLinkTarget(link)}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </>
        ),
      },
    ],
    [isLoading, isDeleting]
  );

  const handleFormSubmit = async (formData) => {
    if (editingLink) {
      await handleEditLinkSubmit(formData);
    } else {
      await handleAddLinkSubmit(formData);
    }
  };

  const handleAddLinkSubmit = async (newLinkData) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks`,
      'POST',
      newLinkData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        setIsModalOpen(false);
        setEditingLink(null);
        addToast('Quick link added successfully', 'success');
        refetchCount?.();
      },
      (error) => {
        addToast(`Failed to add quick link: ${error.message}`, 'error');
      },
      setIsLoading
    );
  };

  const handleEditLinkSubmit = async (updatedLinkData) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${editingLink.id}`,
      'PATCH',
      updatedLinkData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        setIsModalOpen(false);
        setEditingLink(null);
        addToast('Quick link updated successfully', 'success');
        refetchCount?.();
      },
      (error) => {
        addToast(`Failed to update quick link: ${error.message}`, 'error');
      },
      setIsLoading
    );
  };

  const handleDeleteLink = async (linkId) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${linkId}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quick link deleted successfully', 'success');
        setDeleteLinkTarget(null);
        refetchCount?.();
      },
      (error) => {
        addToast(`Failed to delete quick link: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  const handleBulkDelete = async (ids) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/bulk-delete`,
      'POST',
      { ids },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`${ids.length} quick link(s) deleted successfully`, 'success');
        setSelectedIds([]);
        setBulkDeleteIds(null);
        refetchCount?.();
      },
      (error) => {
        console.error('Error bulk deleting quick links:', error);
        addToast(`Failed to delete quick links: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Quick Links' },
  ];

  const totalLinks = unfilteredTotal || totalItems;
  const categoriesCount = 5;

  return (
    <main className="quicklinks-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Quick Links Management"
        subtitle="Manage external resource portals and shortcuts for operators"
        illustrationSrc="/pageImages/admin/quick-links.png"
        primaryAction={{
          label: 'Add Quick Link',
          icon: 'fa-solid fa-plus',
          onClick: handleOpenAddModal,
        }}
      />

      <section className="services-summary-grid">
        <KpiCard
          title="Total Shortcuts"
          value={totalLinks}
          icon="fa-solid fa-link"
          iconColor="var(--purple)"
          isLoading={isLoading || isQuickLinksLoading}
        />
        <KpiCard
          title="Resource Categories"
          value={categoriesCount}
          icon="fa-solid fa-folder-tree"
          iconColor="var(--blue-dark)"
          isLoading={isLoading || isQuickLinksLoading}
        />
      </section>

      <section className="card quicklinks-table-card">
        {/* Toolbar Search & Category Filter */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by title or URL..."
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
              { value: 'all', label: `All (${totalLinks})` },
              { value: 'airlines', label: 'Airlines' },
              { value: 'hotels', label: 'Hotels' },
              { value: 'government', label: 'Government' },
              { value: 'visaandembassy', label: 'Visa & Embassy' },
              { value: 'other', label: 'Other' },
            ]}
            activeChip={categoryFilter}
            onChipChange={(val) => setCategoryFilter(val)}
          />
        </div>

        {/* Reusable DataTable */}
        <DataTable
          columns={columns}
          data={quickLinksList}
          keyField="id"
          selectable={true}
          selectedIds={selectedIds}
          isLoading={isLoading || isQuickLinksLoading}
          disabled={isLoading || isDeleting}
          onSelectionChange={setSelectedIds}
          onBulkDelete={(ids) => setBulkDeleteIds(ids)}
          emptyState={{
            icon: 'fa-solid fa-link-slash',
            message: 'No quick links match your search',
          }}
        />

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </section>

      {/* Modal for Add / Edit */}
      <QuickLinkModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingLink}
        isLoading={isLoading}
      />

      {/* Single Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteLinkTarget}
        onClose={() => !isDeleting && setDeleteLinkTarget(null)}
        icon="fa-solid fa-trash-can"
        Title="Delete Quick Link?"
        Desc={`"${deleteLinkTarget?.title}" will be permanently removed. Continue?`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isDeleting}
        OnConfirm={() => handleDeleteLink(deleteLinkTarget?.id)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!bulkDeleteIds}
        onClose={() => !isDeleting && setBulkDeleteIds(null)}
        icon="fa-solid fa-trash-can"
        Title={`Delete ${bulkDeleteIds?.length || 0} selected quick links?`}
        Desc={`${bulkDeleteIds?.length || 0} quick links will be permanently removed. Continue?`}
        BtnColor="var(--error-red)"
        confirmText="Delete Selected"
        isLoading={isDeleting}
        OnConfirm={() => handleBulkDelete(bulkDeleteIds)}
      />
    </main>
  );
}