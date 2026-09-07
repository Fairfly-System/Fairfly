import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { auth } from '../../../firebase';
import {
  subscribeToAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../../../services/chatService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import SearchBar from '../../../components/UI/SearchBar/SearchBar';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AnnouncementPhotoGrid from './AnnouncementPhotoGrid';
import AnnouncementLightbox from './AnnouncementLightbox';
import { SkeletonAnnouncement } from '../../../components/UI/Skeleton/Skeleton';
import './announcements-page.css';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export default function AnnouncementsPage() {
  const { user, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isAdmin = userDetails?.role === 'admin' || userDetails?.isSuperAdmin;

  // Real-time Announcements List
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Priority Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Expanded Post IDs for inline "... See more"
  const [expandedPostIds, setExpandedPostIds] = useState(new Set());

  // Modal Full Reader State
  const [readerPost, setReaderPost] = useState(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Admin Composer & Edit State
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerPriority, setComposerPriority] = useState('Normal');
  const [composerPhotos, setComposerPhotos] = useState([]); // mix of { url, name, size, type, storagePath } and { file, previewUrl, name, size, type }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const composerRef = useRef(null);

  // 1. Subscribe to Firestore Announcements
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAnnouncements((list) => {
      setAnnouncements(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Format Relative or Absolute Time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // 3. Filter and Search Logic
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Priority filter
      if (selectedPriority !== 'All') {
        const itemPrio = (item.priority || 'Normal').toLowerCase();
        if (itemPrio !== selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const contentMatch = (item.content || '').toLowerCase().includes(q);
        const authorMatch = (item.authorName || '').toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !authorMatch) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, selectedPriority, searchQuery]);

  // Priority counts for chips
  const priorityChips = useMemo(() => {
    const counts = {
      All: announcements.length,
      'Urgent Alert': 0,
      Important: 0,
      Normal: 0
    };

    announcements.forEach((a) => {
      const p = a.priority || 'Normal';
      if (p === 'Urgent Alert') counts['Urgent Alert']++;
      else if (p === 'Important') counts['Important']++;
      else counts['Normal']++;
    });

    return [
      { value: 'All', label: 'All Notices', count: counts['All'] },
      { value: 'Urgent Alert', label: 'Urgent Alert', count: counts['Urgent Alert'] },
      { value: 'Important', label: 'Important', count: counts['Important'] },
      { value: 'Normal', label: 'Normal', count: counts['Normal'] }
    ];
  }, [announcements]);

  // Toggle inline "... See more"
  const toggleInlineExpand = (id) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Lightbox handlers
  const openLightbox = (photos, initialIndex = 0) => {
    if (!photos || photos.length === 0) return;
    setLightboxPhotos(photos);
    setLightboxIndex(initialIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // 4. Composer File Selection & Validation
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - composerPhotos.length;
    if (remainingSlots <= 0) {
      addToast(`You can only attach a maximum of ${MAX_PHOTOS} photos per announcement.`, 'warning');
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      addToast(`Only the first ${remainingSlots} photos were added to respect the ${MAX_PHOTOS}-photo limit.`, 'warning');
    }

    const validNewPhotos = [];
    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        addToast(`"${file.name}" was skipped because only image files are supported.`, 'error');
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        addToast(`"${file.name}" exceeds the 15MB file size limit.`, 'error');
        continue;
      }
      validNewPhotos.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    setComposerPhotos((prev) => [...prev, ...validNewPhotos]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setComposerPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 5. Submit or Update Announcement
  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    if (!composerTitle.trim() || !composerContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      // Upload any new pending files to Firebase Storage via backend API
      const processedPhotos = [];
      for (const item of composerPhotos) {
        if (item.file) {
          // New file needs upload
          const uploadResult = await uploadFileToBackend(item.file, 'announcements', token);
          processedPhotos.push({
            url: uploadResult.url,
            name: uploadResult.fileName || item.name,
            size: uploadResult.fileSize || item.size,
            type: item.type,
            storagePath: uploadResult.storagePath || ''
          });
        } else {
          // Already uploaded photo
          processedPhotos.push({
            url: item.url,
            name: item.name || 'Photo',
            size: item.size || 0,
            type: item.type || 'image/jpeg',
            storagePath: item.storagePath || ''
          });
        }
      }

      if (editingId) {
        // Update existing announcement (diffing executed on backend)
        await updateAnnouncement(editingId, {
          title: composerTitle.trim(),
          content: composerContent.trim(),
          priority: composerPriority,
          photos: processedPhotos
        });
        addToast('Announcement updated successfully.', 'success');
      } else {
        // Create new announcement
        await postAnnouncement({
          title: composerTitle.trim(),
          content: composerContent.trim(),
          priority: composerPriority,
          photos: processedPhotos
        });
        addToast('Announcement broadcasted to all operators.', 'success');
      }

      // Reset composer
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to submit announcement:', error);
      addToast(error.message || 'Failed to submit announcement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Enter Edit Mode
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setComposerTitle(item.title || '');
    setComposerContent(item.content || '');
    setComposerPriority(item.priority || 'Normal');
    setComposerPhotos(
      Array.isArray(item.photos)
        ? item.photos.map((p) => (typeof p === 'string' ? { url: p, name: 'Photo' } : p))
        : []
    );
    setIsComposerExpanded(true);

    if (composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setComposerTitle('');
    setComposerContent('');
    setComposerPriority('Normal');
    setComposerPhotos([]);
    setIsComposerExpanded(false);
  };

  // 7. Delete Announcement (with storage cleanup)
  const handleDeleteConfirm = async () => {
    if (!announcementToDelete?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete.id);
      addToast('Announcement deleted and attached photos cleaned from storage.', 'success');
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      addToast(error.message || 'Failed to delete announcement.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="announcements-page">
      {/* Page Header */}
      <PageHeader
        title="Announcements"
        subtitle="Official notices, operational bulletins, and company broadcasts from Head Office."
      />

      {/* Toolbar: Debounced Search & Priority Filter Chips */}
      <div className="announcements-toolbar">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          debounceSearch={true}
          placeholder="Search announcements by title, content, or author..."
        />

        <FilterChipGroup
          chips={priorityChips}
          activeChip={selectedPriority}
          onChipChange={setSelectedPriority}
        />
      </div>

      {/* Admin Facebook-Style Post Composer */}
      {isAdmin && (
        <div className="fb-composer-card" ref={composerRef}>
          {!isComposerExpanded ? (
            <div
              className="fb-composer-collapsed"
              onClick={() => setIsComposerExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsComposerExpanded(true)}
            >
              <div className="fb-composer-avatar" title="Head Office">
                <i className="fa-solid fa-building-flag"></i>
              </div>
              <div className="fb-composer-trigger">
                <span>Broadcast a new announcement to all operators...</span>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <i className="fa-solid fa-bullhorn"></i> New Post
              </button>
            </div>
          ) : (
                <form className="fb-composer-form" onSubmit={handleSubmitAnnouncement}>
                  <div className="fb-composer-header">
                    <h3 className="fb-composer-title">
                      <i className="fa-solid fa-bullhorn"></i>
                      {editingId ? 'Edit Announcement Notice' : 'Broadcast Head Office Announcement'}
                    </h3>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      title="Cancel"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <input
                    type="text"
                    className="fb-composer-input"
                    placeholder="Announcement Title or Headline..."
                    value={composerTitle}
                    onChange={(e) => setComposerTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                    maxLength={150}
                  />

                  <textarea
                    className="fb-composer-textarea"
                    placeholder="Write announcement body, instructions, or updates for branch operators..."
                    value={composerContent}
                    onChange={(e) => setComposerContent(e.target.value)}
                    required
                    disabled={isSubmitting}
                    rows={4}
                  />

                  {/* Photo Attachment Section */}
                  <div className="fb-photo-section">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      disabled={isSubmitting || composerPhotos.length >= MAX_PHOTOS}
                    />

                    {composerPhotos.length < MAX_PHOTOS && (
                      <div
                        className="fb-photo-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="fb-photo-dropzone-content">
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                          <span className="fb-photo-dropzone-label">
                            Click to attach photos ({composerPhotos.length}/{MAX_PHOTOS})
                          </span>
                          <span className="fb-photo-dropzone-sub">
                            PNG, JPG, WEBP up to 15MB each
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Thumbnails of attached photos */}
                    {composerPhotos.length > 0 && (
                      <div className="fb-composer-thumbnails">
                        {composerPhotos.map((photo, idx) => {
                          const src = photo.previewUrl || photo.url;
                          const name = photo.name || `Photo ${idx + 1}`;
                          return (
                            <div key={src || idx} className="fb-thumbnail-item">
                              <img src={src} alt={name} className="fb-thumbnail-img" />
                              <button
                                type="button"
                                className="fb-thumbnail-remove"
                                onClick={() => handleRemovePhoto(idx)}
                                disabled={isSubmitting}
                                title="Remove photo"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Composer Footer: Priority & Action Buttons */}
                  <div className="fb-composer-footer">
                    <div className="fb-composer-priority">
                      <label htmlFor="fb-priority-select" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        Priority:
                      </label>
                      <select
                        id="fb-priority-select"
                        className="fb-priority-select"
                        value={composerPriority}
                        onChange={(e) => setComposerPriority(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="Normal">Normal Notice</option>
                        <option value="Important">Important</option>
                        <option value="Urgent Alert">Urgent Alert</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting || !composerTitle.trim() || !composerContent.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            {editingId ? 'Updating...' : 'Publishing...'}
                          </>
                        ) : (
                          <>
                            <i className={editingId ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-paper-plane'}></i>
                            {editingId ? 'Save Changes' : 'Post Announcement'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Feed List */}
          <div className="announcements-feed-container">
            {loading ? (
              <SkeletonAnnouncement count={3} />
            ) : filteredAnnouncements.length === 0 ? (
            <div className="fb-feed-empty">
              <i className="fa-solid fa-bullhorn"></i>
              <h3>No announcements found</h3>
              <p>
                {searchQuery || selectedPriority !== 'All'
                  ? 'Try adjusting your search criteria or priority filters.'
                  : 'There are currently no announcements published from Head Office.'}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const priorityClass = (item.priority || 'Normal').toLowerCase().replace(' ', '-');
              const isUrgent = item.priority === 'Urgent Alert';
              const isImportant = item.priority === 'Important';
              const isPrioNormal = !isUrgent && !isImportant;
              const cardPrioClass = isUrgent ? 'urgent' : isImportant ? 'important' : 'normal';

              const hasPhotos = Array.isArray(item.photos) && item.photos.length > 0;
              const photoCount = hasPhotos ? item.photos.length : 0;

              const isInlineExpanded = expandedPostIds.has(item.id);
              const isLongText = (item.content || '').length > 280;

              return (
                <article
                  key={item.id}
                  className={`fb-post-card ${cardPrioClass}`}
                  aria-label={`Announcement: ${item.title}`}
                >
                  {/* Post Header */}
                  <div className="fb-post-header">
                    <div className="fb-post-author-row">
                      <div className="fb-post-avatar">
                        <i className="fa-solid fa-building-flag"></i>
                      </div>

                      <div className="fb-post-author-meta">
                        <div className="fb-post-author-name">
                          <span>Head Office</span>
                          <i
                            className="fa-solid fa-circle-check fb-post-badge-verified"
                            title="Verified Official Broadcast"
                          ></i>
                        </div>
                        <div className="fb-post-sub-row">
                          <span title={formatFullDate(item.createdAt)}>
                            <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i>
                            {formatTime(item.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{item.authorName || 'Administrator'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="fb-post-header-actions">
                      <span className={`fb-priority-pill ${cardPrioClass}`}>
                        {item.priority || 'Normal'}
                      </span>

                      {/* Admin Edit & Delete Actions */}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleStartEdit(item)}
                            title="Edit announcement"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--text-mid)' }}
                          >
                            <i className="fa-regular fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setAnnouncementToDelete(item)}
                            title="Delete announcement"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--red, #ef4444)' }}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="fb-post-body">
                    <h2 className="fb-post-title">{item.title}</h2>

                    <div className="fb-post-text">
                      {isLongText && !isInlineExpanded
                        ? `${item.content.slice(0, 280)}...`
                        : item.content}
                    </div>

                    {isLongText && (
                      <button
                        type="button"
                        className="fb-see-more-btn"
                        onClick={() => toggleInlineExpand(item.id)}
                      >
                        {isInlineExpanded ? (
                          <>
                            Show less <i className="fa-solid fa-chevron-up"></i>
                          </>
                        ) : (
                          <>
                            See more <i className="fa-solid fa-chevron-down"></i>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Multi-Photo Grid (Facebook mosaic) */}
                  {hasPhotos && (
                    <AnnouncementPhotoGrid
                      photos={item.photos}
                      onPhotoClick={(photoIdx) => openLightbox(item.photos, photoIdx)}
                    />
                  )}

                  {/* Post Footer */}
                  <div className="fb-post-footer">
                    <div className="fb-post-footer-sub">
                      {hasPhotos ? (
                        <>
                          <i className="fa-regular fa-images"></i>
                          <span>{photoCount} {photoCount === 1 ? 'photo' : 'photos'} attached</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-shield-halved"></i>
                          <span>Official Broadcast</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      className="fb-post-expand-btn"
                      onClick={() => setReaderPost(item)}
                      title="Open full expanded reader view"
                    >
                      <i className="fa-solid fa-up-right-and-down-left-from-center"></i>
                      <span>Expand Notice</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

      {/* Lightbox Viewer */}
      <AnnouncementLightbox
        isOpen={lightboxOpen}
        photos={lightboxPhotos}
        activeIndex={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
      />

      {/* Full Expanded Reader Modal */}
      {readerPost && (
        <BaseModal
          isOpen={Boolean(readerPost)}
          onClose={() => setReaderPost(null)}
          title="Announcement Details"
          maxWidth="44rem"
        >
          <div className="fb-expanded-reader">
            <div className="fb-post-header" style={{ padding: 0 }}>
              <div className="fb-post-author-row">
                <div className="fb-post-avatar">
                  <i className="fa-solid fa-building-flag"></i>
                </div>
                <div className="fb-post-author-meta">
                  <div className="fb-post-author-name">
                    <span>Head Office</span>
                    <i className="fa-solid fa-circle-check fb-post-badge-verified"></i>
                  </div>
                  <div className="fb-post-sub-row">
                    <span>{formatFullDate(readerPost.createdAt)}</span>
                    <span>•</span>
                    <span>{readerPost.authorName || 'Administrator'}</span>
                  </div>
                </div>
              </div>

              <span
                className={`fb-priority-pill ${(readerPost.priority || 'Normal')
                  .toLowerCase()
                  .replace(' ', '-')}`}
              >
                {readerPost.priority || 'Normal'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                {readerPost.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--text-dark)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {readerPost.content}
              </p>
            </div>

            {/* Photos in expanded view */}
            {Array.isArray(readerPost.photos) && readerPost.photos.length > 0 && (
              <div className="fb-expanded-photos-list">
                <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-mid)', fontWeight: 600 }}>
                  <i className="fa-regular fa-images" style={{ marginRight: '0.35rem' }}></i>
                  Attached Photos ({readerPost.photos.length}) — Click photo to view fullscreen
                </h4>
                {readerPost.photos.map((photo, idx) => {
                  const url = typeof photo === 'string' ? photo : photo.url;
                  const name = typeof photo === 'string' ? `Photo ${idx + 1}` : photo.name;
                  return (
                    <div
                      key={url || idx}
                      className="fb-expanded-photo-wrap"
                      onClick={() => openLightbox(readerPost.photos, idx)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full photo"
                    >
                      <img src={url} alt={name} className="fb-expanded-photo-img" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </BaseModal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(announcementToDelete)}
        onClose={() => !isDeleting && setAnnouncementToDelete(null)}
        Icon={(props) => <i className="fa-solid fa-trash-can" {...props} />}
        Title="Delete Announcement?"
        Desc={`"${announcementToDelete?.title}" and all attached photos in storage will be permanently deleted.`}
        BtnColor="var(--error-red, #ef4444)"
        confirmText="Delete Announcement"
        isLoading={isDeleting}
        OnConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
