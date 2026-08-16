import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { useToast } from '../../../UI/toast/ToastProvider';
import './resource-modal.css';

const CATEGORIES = [
  'Marketing Materials',
  'Documentation & Guides',
  'Help & FAQs',
  'Forms & Templates',
  'Brand Assets'
];

const SUGGESTED_TAGS = [
  'Promo',
  'SocialMedia',
  'Brochure',
  'SOP',
  'Training',
  'Pricing',
  'Guidelines',
  'Flyer',
  'Template'
];

const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DEFAULT_SIZE = 10 * 1024 * 1024; // 10MB

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

export default function ResourceForm({ onSubmit, isLoading, initialData, onCancel }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Marketing Materials');
  const [tags, setTags] = useState(initialData?.tags || ['#Marketing']);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState(initialData?.visibility || 'all');

  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Existing file in edit mode
  const [existingFileUrl, setExistingFileUrl] = useState(initialData?.fileUrl || '');
  const [existingFileName, setExistingFileName] = useState(initialData?.fileName || '');
  const [existingFileSize, setExistingFileSize] = useState(initialData?.fileSize || 0);

  // Handle Tag Input
  const handleAddTag = (rawTag) => {
    if (!rawTag || !rawTag.trim()) return;
    const cleanTag = rawTag.trim().startsWith('#') ? rawTag.trim() : `#${rawTag.trim()}`;
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // File Validation
  const validateAndSetFile = (file) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(file.name);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_DEFAULT_SIZE;
    const limitLabel = isVideo ? '20MB for videos' : '10MB for documents/images';

    if (file.size > maxSize) {
      addToast(`File size exceeds limit (${limitLabel})`, 'error');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Prefill title with friendly filename if empty
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(nameWithoutExt);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast('Please enter a title for the resource', 'error');
      return;
    }

    if (!selectedFile && !existingFileUrl) {
      addToast('Please upload a resource file', 'error');
      return;
    }

    try {
      let fileUrl = existingFileUrl;
      let fileName = existingFileName;
      let fileSize = existingFileSize;
      let fileType = initialData?.fileType || 'application/octet-stream';
      let fileExtension = initialData?.fileExtension || '';

      // If a new file is chosen, upload to Firebase Storage
      if (selectedFile) {
        setIsUploading(true);
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `resources/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileName = selectedFile.name;
              fileSize = selectedFile.size;
              fileType = selectedFile.type || 'application/octet-stream';
              fileExtension = ext;
              resolve();
            }
          );
        });
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        visibility,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        fileExtension
      });
    } catch (error) {
      console.error('Error submitting resource:', error);
      addToast('Failed to upload resource: ' + error.message, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form className="resource-form-container" onSubmit={handleSubmit}>
      {/* File Upload Section */}
      <div className="resource-form-section">
        <label className="form-label" style={{ fontWeight: 700 }}>
          Resource File <span style={{ color: 'var(--error-red)' }}>*</span>
        </label>

        {selectedFile || existingFileUrl ? (
          <div className="resource-file-preview">
            <div className="resource-preview-left">
              <div className="resource-preview-icon">
                <i
                  className={getFileTypeIcon(
                    selectedFile
                      ? selectedFile.name.split('.').pop()
                      : existingFileName.split('.').pop()
                  )}
                ></i>
              </div>
              <div className="resource-preview-details">
                <span className="resource-preview-name">
                  {selectedFile ? selectedFile.name : existingFileName}
                </span>
                <span className="resource-preview-size">
                  {formatFileSize(selectedFile ? selectedFile.size : existingFileSize)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="icon-btn delete"
              title="Replace file"
              onClick={() => {
                setSelectedFile(null);
                setExistingFileUrl('');
                setExistingFileName('');
                setExistingFileSize(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ) : (
          <div
            className={`resource-dropzone ${isDragActive ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className="resource-dropzone-icon">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <span className="resource-dropzone-title">
              Click to upload or drag & drop
            </span>
            <span className="resource-dropzone-hint">
              PDF, Word, Excel, PPT, ZIP, Video (Max 20MB for video, 10MB for documents)
            </span>
          </div>
        )}

        {isUploading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-mid)' }}>
              <span>Uploading to cloud storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="resource-progress-bar">
              <div className="resource-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="resource-form-section">
        <label className="form-label" htmlFor="res-title" style={{ fontWeight: 700 }}>
          Resource Title <span style={{ color: 'var(--error-red)' }}>*</span>
        </label>
        <input
          id="res-title"
          type="text"
          className="form-input"
          placeholder="e.g. Q3 2026 Promo Poster Package"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Category & Visibility */}
      <div className="resource-form-row">
        <div className="resource-form-section">
          <label className="form-label" htmlFor="res-cat" style={{ fontWeight: 700 }}>
            Category
          </label>
          <select
            id="res-cat"
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="resource-form-section">
          <label className="form-label" htmlFor="res-vis" style={{ fontWeight: 700 }}>
            Audience / Visibility
          </label>
          <select
            id="res-vis"
            className="form-input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="all">Operators & Admins (Default)</option>
            <option value="operator">Operators Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>
      </div>

      {/* Tags Input */}
      <div className="resource-form-section">
        <label className="form-label" style={{ fontWeight: 700 }}>
          Tags (Optional)
        </label>
        <div className="resource-tags-input-container">
          {tags.map((tag) => (
            <span key={tag} className="resource-tag-chip">
              {tag}
              <button
                type="button"
                className="resource-tag-chip-remove"
                onClick={() => handleRemoveTag(tag)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          ))}
          <input
            type="text"
            className="resource-tag-text-input"
            placeholder="Type tag and press Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => handleAddTag(tagInput)}
          />
        </div>

        {/* Quick Suggested Tags */}
        <div className="resource-suggested-tags">
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-light)', alignSelf: 'center' }}>Suggested:</span>
          {SUGGESTED_TAGS.map((stag) => (
            <button
              key={stag}
              type="button"
              className="resource-suggested-tag-btn"
              onClick={() => handleAddTag(stag)}
            >
              +{stag}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="resource-form-section">
        <label className="form-label" htmlFor="res-desc" style={{ fontWeight: 700 }}>
          Description & Usage Instructions
        </label>
        <textarea
          id="res-desc"
          className="form-input"
          rows={3}
          placeholder="Provide instructions on how operators should utilize this document or material..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn-secondary"
          disabled={isLoading || isUploading}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || isUploading}
          style={{ minWidth: '8rem', justifyContent: 'center' }}
        >
          {isUploading ? 'Uploading...' : isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Publish Resource'}
        </button>
      </div>
    </form>
  );
}
