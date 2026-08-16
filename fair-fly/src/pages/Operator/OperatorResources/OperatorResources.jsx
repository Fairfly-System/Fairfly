import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore, auth } from '../../../firebase';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import { API_BASE_URL } from '../../../utils/config';
import './operator-resources.css';

const CATEGORIES = [
  'All Materials',
  'Marketing Materials',
  'Documentation & Guides',
  'Help & FAQs',
  'Forms & Templates',
  'Brand Assets'
];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeInfo(ext) {
  const e = (ext || '').toLowerCase();
  if (['mp4', 'webm', 'mov', 'avi'].includes(e)) {
    return { icon: 'fa-solid fa-file-video', className: 'video', isPreviewable: false };
  }
  if (['pdf'].includes(e)) {
    return { icon: 'fa-solid fa-file-pdf', className: 'pdf', isPreviewable: true };
  }
  if (['doc', 'docx'].includes(e)) {
    return { icon: 'fa-solid fa-file-word', className: 'word', isPreviewable: false };
  }
  if (['xls', 'xlsx', 'csv'].includes(e)) {
    return { icon: 'fa-solid fa-file-excel', className: 'excel', isPreviewable: false };
  }
  if (['ppt', 'pptx'].includes(e)) {
    return { icon: 'fa-solid fa-file-powerpoint', className: 'powerpoint', isPreviewable: false };
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(e)) {
    return { icon: 'fa-solid fa-file-image', className: 'image', isPreviewable: true };
  }
  if (['zip', 'rar', '7z', 'tar'].includes(e)) {
    return { icon: 'fa-solid fa-file-zipper', className: 'zip', isPreviewable: false };
  }
  return { icon: 'fa-solid fa-file-lines', className: 'other', isPreviewable: false };
}

export default function OperatorResources() {
  const { addToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('All Materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Real-time Firestore sync
  useEffect(() => {
    // Only fetch resources visible to operators
    const q = query(
      collection(firestore, 'resources'),
      where('visibility', 'in', ['all', 'operator'])
    );

    const unsub = onSnapshot(
      q,
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
        console.error('Error loading resources for operator:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Materials': resources.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = resources.filter((r) => r.category === cat).length;
    });
    return counts;
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (activeCategory !== 'All Materials' && item.category !== activeCategory) {
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
  }, [resources, activeCategory, searchQuery]);

  const handleDownload = async (resource) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // Record download in backend
      fetch(`${API_BASE_URL}/api/resources/${resource.id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch((e) => console.warn('Download record warning:', e));

      addToast(`Downloading "${resource.title}"...`, 'info');

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
      addToast('Download failed: ' + error.message, 'error');
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Resources' },
  ];

  return (
    <main className="operator-resources-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Branch Resources & Materials"
        subtitle="Access marketing materials, operational SOPs, forms, and templates provided by Head Office"
        illustrationSrc="/pageImages/admin/resources.png"
      />

      {/* Category Pills Bar */}
      <div className="op-resources-category-bar">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              className={`op-category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & View Controls */}
      <div className="op-resources-controls">
        <div className="op-search-input-wrapper">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="op-resources-search-input"
            placeholder="Search resources by keyword, title, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="op-view-toggle">
          <button
            type="button"
            className={`op-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <i className="fa-solid fa-grip"></i>
          </button>
          <button
            type="button"
            className={`op-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <i className="fa-solid fa-list"></i>
          </button>
        </div>
      </div>

      {/* Resources Display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
          <p>Loading resource materials...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="op-resources-empty">
          <div className="op-resources-empty-icon">
            <i className="fa-regular fa-folder-open"></i>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-dark)' }}>
            No Materials Found
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', maxWidth: '22rem' }}>
            {searchQuery
              ? `No resources matching "${searchQuery}". Try adjusting your search query.`
              : `No resources currently available under "${activeCategory}".`}
          </p>
        </div>
      ) : (
        <div className="op-resources-grid">
          {filteredResources.map((item) => {
            const fileInfo = getFileTypeInfo(item.fileExtension || item.fileName?.split('.').pop());
            return (
              <div key={item.id} className="op-resource-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="op-card-header">
                    <div className={`op-card-file-icon ${fileInfo.className}`}>
                      <i className={fileInfo.icon}></i>
                    </div>
                    <div className="op-card-title-group">
                      <span className="op-card-category-badge">{item.category}</span>
                      <h4 className="op-card-title">{item.title}</h4>
                    </div>
                  </div>

                  {item.description && (
                    <p className="op-card-desc" title={item.description}>
                      {item.description}
                    </p>
                  )}

                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div className="op-card-tags">
                      {item.tags.map((tag) => (
                        <span key={tag} className="op-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="op-card-footer">
                  <div className="op-card-file-info">
                    <span className="op-card-size">{formatFileSize(item.fileSize)}</span>
                    <span className="op-card-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Recent'}
                    </span>
                  </div>

                  <div className="op-card-actions">
                    {fileInfo.isPreviewable && (
                      <button
                        type="button"
                        className="op-preview-btn"
                        title="Quick Preview"
                        onClick={() => handlePreview(item)}
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                    )}
                    <button
                      type="button"
                      className="op-download-btn"
                      onClick={() => handleDownload(item)}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
