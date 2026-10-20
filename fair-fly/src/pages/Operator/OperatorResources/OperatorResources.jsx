import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import { fetchResources, recordResourceDownload, downloadResourceFile } from '../../../services/resourceService';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { usePdfModal, isPdfUrl } from '../../../components/Shared/PdfDocument/PdfDocumentView';
import { useLightbox, isImageUrl } from '../../../components/UI/ImageLightbox/ImageLightbox';
import './operator-resources.css';

const CATEGORIES = [
  'All Materials',
  'Marketing Materials',
  'Documentation & Guides',
  'Help & FAQs',
  'Forms & Templates',
  'Brand Assets',
];

function getFileMeta(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return { icon: 'fa-solid fa-file-image', className: 'image', isPreviewable: true };
  }
  if (['mp4', 'webm', 'mov'].includes(ext)) {
    return { icon: 'fa-solid fa-file-video', className: 'video', isPreviewable: false };
  }
  if (['pdf'].includes(ext)) {
    return { icon: 'fa-solid fa-file-pdf', className: 'pdf', isPreviewable: true };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'fa-solid fa-file-word', className: 'doc', isPreviewable: false };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: 'fa-solid fa-file-excel', className: 'spreadsheet', isPreviewable: false };
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return { icon: 'fa-solid fa-file-zipper', className: 'archive', isPreviewable: false };
  }
  return { icon: 'fa-solid fa-file-lines', className: 'other', isPreviewable: false };
}

const getFileTypeInfo = getFileMeta;

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function OperatorResources() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const { openPdfModal } = usePdfModal();
  const { openLightbox } = useLightbox();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const [activeCategory, setActiveCategory] = useState('All Materials');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const loadResources = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchResources(
      userToken,
      (data) => {
        const raw = Array.isArray(data) ? data : (data?.data || []);
        const list = raw.filter((r) => r.visibility === 'all' || r.visibility === 'operator');
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setResources(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading resources for operator:', error);
        addToast(toFriendlyMessage(error, 'Could not load branch resources. Please try refreshing.'), 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [userToken, addToast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Materials': resources.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = resources.filter((r) => r.category === cat).length;
    });
    return counts;
  }, [resources]);

  // Filtered resources with debounced search
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (activeCategory !== 'All Materials' && item.category !== activeCategory) {
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
  }, [resources, activeCategory, debouncedSearch]);

  const handlePreview = (resource) => {
    if (!resource || !resource.fileUrl) {
      addToast('No preview available for this file.', 'warning');
      return;
    }
    if (isImageUrl(resource.fileUrl, resource.fileName)) {
      openLightbox({
        url: resource.fileUrl,
        title: resource.title || resource.fileName || 'Resource Picture',
        subtitle: `${resource.category || 'Resource Material'} · ${resource.fileName || 'Image'}`
      });
      return;
    }
    if (isPdfUrl(resource.fileUrl, resource.fileName)) {
      openPdfModal({
        type: 'file',
        url: resource.fileUrl,
        title: resource.title || resource.fileName || 'Resource Document'
      });
      return;
    }
    window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (resource) => {
    if (!resource || !resource.id || downloadingId) return;

    try {
      setDownloadingId(resource.id);
      addToast(`Preparing download for "${resource.title}"...`, 'info');

      // Trigger direct download without opening new tabs
      await downloadResourceFile(userToken, resource);

      // Optimistically increment download count locally
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
        )
      );

      addToast(`Downloaded "${resource.title}" successfully.`, 'success');
    } catch (error) {
      console.error('Download error:', error);
      addToast(toFriendlyMessage(error, 'Download could not be completed. Please try again.'), 'error');
    } finally {
      setDownloadingId(null);
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
            className={`op-resources-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <i className="fa-solid fa-grip"></i>
          </button>
          <button
            type="button"
            className={`op-resources-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <i className="fa-solid fa-list"></i>
          </button>
        </div>
      </div>

      {/* Resources Display */}
      {loading ? (
        <div className={`op-resources-grid ${viewMode === 'list' ? 'op-resources-grid--list' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-res-${i}`} className="op-resource-card" aria-busy="true">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="op-card-header">
                  <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem', borderRadius: 'var(--radius-md)' }} />
                  <div className="op-card-title-group" style={{ width: '70%' }}>
                    <div className="skeleton skeleton-badge" style={{ width: '4rem', height: '1rem', marginBottom: '0.25rem' }} />
                    <div className="skeleton skeleton-title" style={{ width: '85%', height: '1rem', margin: 0 }} />
                  </div>
                </div>
                <div className="skeleton skeleton-text" style={{ width: '100%', height: '0.8rem', margin: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '65%', height: '0.8rem', margin: 0 }} />
              </div>
              <div className="op-card-footer" style={{ marginTop: '1rem' }}>
                <div className="skeleton skeleton-text" style={{ width: '5rem', height: '0.75rem', margin: 0 }} />
                <div className="skeleton skeleton-btn" style={{ width: '4rem', height: '1.75rem' }} />
              </div>
            </div>
          ))}
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
        <div className={`op-resources-grid ${viewMode === 'list' ? 'op-resources-grid--list' : ''}`}>
          {filteredResources.map((item) => {
            const fileInfo = getFileMeta(item.fileName || item.fileExtension || '');
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
                      disabled={downloadingId === item.id}
                      onClick={() => handleDownload(item)}
                      title={downloadingId === item.id ? 'Downloading...' : 'Download Material'}
                    >
                      <i className={downloadingId === item.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'}></i>
                      <span>{downloadingId === item.id ? 'Downloading...' : 'Download'}</span>
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
