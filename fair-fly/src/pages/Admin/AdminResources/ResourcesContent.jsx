import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore, auth } from '../../../firebase';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import DataTable from '../../../components/UI/DataTable/DataTable';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ResourceModal from '../../../components/Admin/Modals/ResourceModal/ResourceModal';
import { API_BASE_URL } from '../../../utils/config';
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
  const { addToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');

  // Modals & Actions
  const modalRef = useRef(null);
  const confirmModalRef = useRef(null);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'resources'),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setResources(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching resources:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Filtered list
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedVisibility !== 'all' && item.visibility !== selectedVisibility) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
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
  }, [resources, selectedCategory, selectedVisibility, searchQuery]);

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
    modalRef.current?.openModal();
  };

  const handleSubmitResource = async (formData) => {
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const isEdit = Boolean(editingResource);
      const url = isEdit
        ? `${API_BASE_URL}/api/resources/${editingResource.id}`
        : `${API_BASE_URL}/api/resources`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save resource');
      }

      addToast(
        isEdit ? 'Resource updated successfully!' : 'Resource published successfully!',
        'success'
      );
    } catch (error) {
      console.error('Error saving resource:', error);
      addToast(error.message, 'error');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/resources/${resourceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete resource');
      }

      addToast('Resource deleted successfully', 'success');
      confirmModalRef.current?.closeModal();
      setResourceToDelete(null);
    } catch (error) {
      console.error('Error deleting resource:', error);
      addToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (resource) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // Record download on backend
      fetch(`${API_BASE_URL}/api/resources/${resource.id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch((e) => console.warn('Download tracking warning:', e));

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
              onClick={() => {
                setResourceToDelete(r);
                confirmModalRef.current?.openModal();
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="admin-resources-container">
      {/* 4 KPI Summary Cards */}
      <div className="resources-kpi-grid">
        <KpiCard
          title="Total Materials"
          value={totalResources}
          detail="Uploaded files & assets"
          icon="fa-solid fa-folder-open"
          iconColor="var(--purple)"
          badge="Catalog"
          badgeType="info"
        />
        <KpiCard
          title="Marketing Assets"
          value={marketingCount}
          detail="Posters, banners, promos"
          icon="fa-solid fa-bullhorn"
          iconColor="#2563eb"
          badge="Promos"
          badgeType="ok"
        />
        <KpiCard
          title="Docs & Guides"
          value={docsCount}
          detail="SOPs and user manuals"
          icon="fa-solid fa-book-open"
          iconColor="#8b5cf6"
          badge="Operational"
          badgeType="info"
        />
        <KpiCard
          title="Total Downloads"
          value={totalDownloads}
          detail="Downloads by operators"
          icon="fa-solid fa-cloud-arrow-down"
          iconColor="#16a34a"
          badge="Activity"
          badgeType="ok"
        />
      </div>

      {/* Toolbar */}
      <div className="resources-toolbar">
        <div className="resources-filters-group">
          {/* Search Box */}
          <div className="resources-search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              className="resources-search-input"
              placeholder="Search by title, tags, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="resources-select-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            className="resources-select-filter"
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
          >
            <option value="all">All Audiences</option>
            <option value="all">Operators & Admins</option>
            <option value="operator">Operators Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>

        {/* Upload Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenAddModal}
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Upload Resource
        </button>
      </div>

      {/* Resources DataTable */}
      <DataTable
        columns={columns}
        data={filteredResources}
        loading={loading}
        emptyMessage="No resource materials found matching your filters."
        keyField="id"
      />

      {/* Add / Edit Resource Modal */}
      <ResourceModal
        ref={modalRef}
        onSubmit={handleSubmitResource}
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
    </div>
  );
}
