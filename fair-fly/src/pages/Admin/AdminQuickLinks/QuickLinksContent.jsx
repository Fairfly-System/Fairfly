import React, { useState, useMemo } from 'react';
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
import { useAdminContext } from '../../../context/AdminContext';

export default function QuickLinksContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const { data: quickLinks, loading: isQuickLinksLoading } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [deleteLinkTarget, setDeleteLinkTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

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

  const quickLinksList = useMemo(() => {
    return Array.isArray(quickLinks) ? quickLinks : [];
  }, [quickLinks]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return quickLinksList.filter((link) => {
      const matchesSearch =
        (link.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.url || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        (link.category || '').toLowerCase().replace(/\s+/g, '') ===
        categoryFilter.toLowerCase().replace(/\s+/g, '');

      return matchesSearch && matchesCategory;
    });
  }, [quickLinksList, searchTerm, categoryFilter]);

  // Paginated slice
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLinks.slice(start, start + pageSize);
  }, [filteredLinks, currentPage, pageSize]);

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
      },
      (error) => {
        console.error('Error bulk deleting quick links:', error);
        addToast(`Failed to delete quick links: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  // Early loading return AFTER all hooks are declared
  if (isQuickLinksLoading) {
    return (
      <div className="card quicklinks-page page-fade-in">
        <div className="quicklinks-header">
          <div>
            <h2>Quick Links Management</h2>
            <p>Loading quick links...</p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Quick Links' },
  ];

  const totalLinks = quickLinksList.length;
  const categoriesCount = new Set(quickLinksList.map((l) => l.category).filter(Boolean)).size;

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
        />
        <KpiCard
          title="Resource Categories"
          value={categoriesCount}
          icon="fa-solid fa-folder-tree"
          iconColor="var(--blue-dark)"
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
              { value: 'all', label: `All (${quickLinksList.length})` },
              { value: 'airlines', label: 'Airlines' },
              { value: 'hotels', label: 'Hotels' },
              { value: 'government', label: 'Government' },
              { value: 'visaandembassy', label: 'Visa & Embassy' },
              { value: 'other', label: 'Other' },
            ]}
            activeChip={categoryFilter}
            onChipChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Reusable DataTable */}
        <DataTable
          columns={columns}
          data={paginatedLinks}
          keyField="id"
          selectable={true}
          selectedIds={selectedIds}
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
          totalItems={filteredLinks.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
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
        Icon={TrashIcon}
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
        Icon={TrashIcon}
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