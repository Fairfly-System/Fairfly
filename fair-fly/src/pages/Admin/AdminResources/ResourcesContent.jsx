import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Pagination from '../../../components/UI/Pagination/Pagination';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ResourceModal from '../../../components/Admin/Modals/ResourceModal/ResourceModal';
import { fetchResources, createResource, updateResource, deleteResource, recordResourceDownload } from '../../../services/resourceService';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './admin-resources.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeIcon(ext) {
  const e = (ext || '').toLowerCase();
  if (['mp4', 'webm', 'mov', 'avi'].includes(e)) return 'fa-solid fa-file-video';
  if (['pdf'].includes(e)) return 'fa-solid fa-file-pdf';
  if (['doc', 'docx'].includes(e)) return 'fa-solid fa-file-word';
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'fa-solid fa-file-excel';
  if (['ppt', 'pptx'].includes(e)) return 'fa-solid fa-file-powerpoint';
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(e)) return 'fa-solid fa-file-image';
  if (['zip', 'rar', '7z', 'tar'].includes(e)) return 'fa-solid fa-file-zipper';
  return 'fa-solid fa-file-lines';
}

function getCategoryClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('marketing')) return 'marketing';
  if (c.includes('documentation') || c.includes('guide')) return 'documentation';
  if (c.includes('help') || c.includes('faq')) return 'help';
  if (c.includes('form') || c.includes('template')) return 'forms';
  if (c.includes('brand')) return 'brand';
  return 'documentation';
}

export default function ResourcesContent() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals & Actions
  const modalRef = useRef(null);
  const confirmModalRef = useRef(null);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load resources via GET
  const loadResources = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchResources(
      userToken,
      (data) => {
        const list = data || [];
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setResources(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching resources:', error);
        addToast('Failed to load resources', 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [userToken, addToast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Filtered list with debounced search
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedVisibility !== 'all' && item.visibility !== selectedVisibility) {
        return false;
      }
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesFileName = item.fileName?.toLowerCase().includes(q);
        const matchesTag = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesFileName && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [resources, selectedCategory, selectedVisibility, debouncedSearch]);

  // Paginated list
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, currentPage, pageSize]);

  // KPI calculations
  const totalResources = resources.length;
  const marketingCount = resources.filter((r) => r.category === 'Marketing Materials').length;
  const docsCount = resources.filter((r) => r.category === 'Documentation & Guides').length;
  const totalDownloads = resources.reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingResource(null);
    modalRef.current?.openModal();
  };

  const handleOpenEditModal = (resource) => {
    setEditingResource(resource);
    modalRef.current?.openModal(resource);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingResource);

      if (isEdit) {
        await updateResource(
          userToken,
          editingResource.id,
          formData,
          () => {
            addToast('Resource updated successfully!', 'success');
            loadResources();
          },
          (err) => {
            addToast(toFriendlyMessage(err, 'Failed to update resource material.'), 'error');
          },
          setIsSubmitting
        );
      } else {
        await createResource(
          userToken,
          formData,
          () => {
            addToast('Resource published successfully!', 'success');
            loadResources();
          },
          (err) => {
            addToast(toFriendlyMessage(err, 'Failed to publish resource material.'), 'error');
          },
          setIsSubmitting
        );
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      addToast(toFriendlyMessage(error, 'Failed to save resource material.'), 'error');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    setIsSubmitting(true);
    deleteResource(
      userToken,
      resourceToDelete.id,
      () => {
        addToast('Resource deleted successfully', 'success');
        setResourceToDelete(null);
        loadResources();
      },
      (err) => {
        addToast(toFriendlyMessage(err, 'Failed to delete resource.'), 'error');
      },
      setIsSubmitting
    );
  };

  const handleDownload = async (resource) => {
    try {
      // Record download on backend
      recordResourceDownload(userToken, resource.id, () => {}, (e) => console.warn('Download tracking warning:', e));

      // Trigger download
      const link = document.createElement('a');
      link.href = resource.fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = resource.fileName || 'resource';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Material / Document',
        render: (r) => (
          <div className="resource-row-title-cell">
            <div className="resource-file-avatar">
              <i className={getFileTypeIcon(r.fileExtension || r.fileName?.split('.').pop())}></i>
            </div>
            <div className="resource-title-meta">
              <span className="resource-title-text">{r.title}</span>
              <span className="resource-filename-text">
                {r.fileName} • {formatFileSize(r.fileSize)}
              </span>
            </div>
          </div>
        )
      },
      {
        key: 'category',
        header: 'Category',
        render: (r) => (
          <span className={`resources-category-badge ${getCategoryClass(r.category)}`}>
            {r.category || 'General'}
          </span>
        )
      },
      {
        key: 'tags',
        header: 'Tags',
        render: (r) => (
          <div className="resource-tags-cell">
            {Array.isArray(r.tags) && r.tags.length > 0 ? (
              r.tags.map((t) => (
                <span key={t} className="resource-table-tag">
                  {t}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--text-light-2)', fontSize: '0.75rem' }}>—</span>
            )}
          </div>
        )
      },
      {
        key: 'visibility',
        header: 'Audience',
        render: (r) => (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', fontWeight: 500 }}>
            {r.visibility === 'admin'
              ? 'Admins Only'
              : r.visibility === 'operator'
              ? 'Operators Only'
              : 'All Operators'}
          </span>
        )
      },
      {
        key: 'downloadCount',
        header: 'Downloads',
        render: (r) => (
          <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
            <i className="fa-solid fa-download" style={{ fontSize: '0.75rem', color: 'var(--purple)', marginRight: '0.35rem' }}></i>
            {r.downloadCount || 0}
          </span>
        )
      },
      {
        key: 'createdAt',
        header: 'Uploaded',
        render: (r) => (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
            {r.createdAt
              ? new Date(r.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Recent'}
          </span>
        )
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (r) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
            <button
              type="button"
              className="icon-btn view"
              title="Download Material"
              onClick={() => handleDownload(r)}
            >
              <i className="fa-solid fa-download"></i>
            </button>
            <button
              type="button"
              className="icon-btn edit"
              title="Edit Resource"
              onClick={() => handleOpenEditModal(r)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              className="icon-btn delete"
              title="Delete Resource"
              onClick={() => setResourceToDelete(r)}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        )
      }
    ],
    []
  );

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Resources' },
  ];

  return (
    <main className="resources-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Resource Materials & Documentation"
        subtitle="Upload, organize, and distribute marketing materials, SOP guides, and templates for branch operators"
        illustrationSrc="/pageImages/admin/resources.png"
        primaryAction={{
          label: 'Upload Resource',
          icon: 'fa-solid fa-cloud-arrow-up',
          onClick: handleOpenAddModal,
        }}
      />

      {/* 4 KPI Summary Cards */}
      <section className="resources-summary-grid">
        <KpiCard
          title="Total Materials"
          value={totalResources}
          detail="Uploaded files & assets"
          icon="fa-solid fa-folder-open"
          iconColor="var(--purple)"
          badge="Catalog"
          badgeType="info"
          isLoading={loading}
        />
        <KpiCard
          title="Marketing Assets"
          value={marketingCount}
          detail="Posters, banners, promos"
          icon="fa-solid fa-bullhorn"
          iconColor="#2563eb"
          badge="Promos"
          badgeType="ok"
          isLoading={loading}
        />
        <KpiCard
          title="Docs & Guides"
          value={docsCount}
          detail="SOPs and user manuals"
          icon="fa-solid fa-book-open"
          iconColor="#8b5cf6"
          badge="Operational"
          badgeType="info"
          isLoading={loading}
        />
        <KpiCard
          title="Total Downloads"
          value={totalDownloads}
          detail="Downloads by operators"
          icon="fa-solid fa-cloud-arrow-down"
          iconColor="#16a34a"
          badge="Activity"
          badgeType="ok"
          isLoading={loading}
        />
      </section>

      {/* Card Table Container */}
      <section className="card resources-table-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            {/* Search Box */}
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, tags, or filename..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Categories</option>
              <option value="Marketing Materials">Marketing Materials</option>
              <option value="Documentation & Guides">Documentation & Guides</option>
              <option value="Help & FAQs">Help & FAQs</option>
              <option value="Forms & Templates">Forms & Templates</option>
              <option value="Brand Assets">Brand Assets</option>
            </select>

            {/* Visibility Filter */}
            <select
              className="filter-select"
              value={selectedVisibility}
              onChange={(e) => {
                setSelectedVisibility(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Audiences</option>
              <option value="all">Operators & Admins</option>
              <option value="operator">Operators Only</option>
              <option value="admin">Admins Only</option>
            </select>
          </div>
        </div>

        {/* Resources DataTable */}
        <DataTable
          columns={columns}
          data={paginatedResources}
          loading={loading}
          emptyMessage="No resource materials found matching your filters."
          keyField="id"
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredResources.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Add / Edit Resource Modal */}
      <ResourceModal
        ref={modalRef}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        initialData={editingResource}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(resourceToDelete)}
        onClose={() => !isSubmitting && setResourceToDelete(null)}
        Icon={TrashIcon}
        Title="Delete Resource Material?"
        Desc={`"${resourceToDelete?.title}" will be permanently removed. Operators will no longer be able to access or download this material.`}
        BtnColor="var(--error-red)"
        confirmText="Delete Resource"
        isLoading={isSubmitting}
        OnConfirm={handleDeleteConfirm}
      />
    </main>
  );
}
