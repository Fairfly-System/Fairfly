import React, { useState, useRef } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './qualification-application-modal.css';

const MAX_DOCUMENTS = 5;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx'];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'fa-solid fa-file-pdf text-red';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
    return 'fa-solid fa-file-image text-blue';
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    return 'fa-solid fa-file-word text-indigo';
  }
  return 'fa-solid fa-file-lines text-purple';
}

export default function QualificationApplicationModal({
  isOpen,
  onClose,
  onApplicationSubmitted
}) {
  const { userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleFilesSelect = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    const availableSlots = MAX_DOCUMENTS - documents.length;

    if (availableSlots <= 0) {
      addToast(`You have already attached the maximum allowed ${MAX_DOCUMENTS} documents.`, 'warning');
      return;
    }

    if (incoming.length > availableSlots) {
      addToast(`You can only attach ${availableSlots} more document${availableSlots !== 1 ? 's' : ''} (Max ${MAX_DOCUMENTS}).`, 'warning');
    }

    const toProcess = incoming.slice(0, availableSlots);
    const validFiles = [];

    for (const file of toProcess) {
      const lowerName = file.name.toLowerCase();
      const isAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

      if (!isAllowedExt) {
        addToast(`"${file.name}" has an unsupported format. Allowed formats: PDF, PNG, JPG, WEBP, DOC, DOCX.`, 'warning');
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        addToast(`"${file.name}" exceeds the 15MB file size limit.`, 'warning');
        continue;
      }

      // Check for duplicate in current state
      const isDuplicate = documents.some((d) => d.name === file.name && d.size === file.size);
      if (isDuplicate) {
        addToast(`"${file.name}" is already attached.`, 'info');
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setDocuments((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveDocument = (indexToRemove) => {
    setDocuments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setReason('');
    setDocuments([]);
    setUploadStatus('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      addToast('Please provide a justification or background for your qualification request.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload documents if attached
      const uploadedDocs = [];
      if (documents.length > 0) {
        for (let i = 0; i < documents.length; i++) {
          const file = documents[i];
          setUploadStatus(`Uploading document ${i + 1} of ${documents.length} (${file.name})...`);

          const uploadResult = await uploadFileToBackend(file, 'qualification_documents', userToken);
          uploadedDocs.push({
            name: file.name,
            url: uploadResult.url,
            size: uploadResult.fileSize || file.size,
            type: file.type || 'application/octet-stream',
            storagePath: uploadResult.storagePath || '',
            uploadedAt: new Date().toISOString()
          });
        }
      }

      setUploadStatus('Submitting qualification application...');

      // Step 2: Submit application payload
      ApiCaller(
        `${API_BASE_URL}/api/qualifications`,
        'POST',
        {
          reason: reason.trim(),
          documents: uploadedDocs
        },
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast('Qualification application submitted successfully! Super Administrators will review your request and attached documents.', 'success');
          setReason('');
          setDocuments([]);
          setUploadStatus('');
          if (onApplicationSubmitted) onApplicationSubmitted(res);
          onClose();
        },
        (error) => {
          addToast(toFriendlyMessage(error, 'Failed to submit qualification application.'), 'error');
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error uploading qualification documents:', err);
      addToast(toFriendlyMessage(err, 'Failed to upload attached qualification documents.'), 'error');
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleModalClose}
      maxWidth="42rem"
      title={
        <div className="qualification-modal-title">
          <i className="fa-solid fa-certificate"></i>
          <span>Apply for Qualified Operator Status</span>
        </div>
      }
      subtitle="Gain the ability to publish and manage branch-exclusive services on FairFly"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="qualification-modal-form">
        <div className="qualification-info-callout">
          <i className="fa-solid fa-circle-info qualification-info-icon"></i>
          <div className="qualification-info-content">
            <strong>What is a Qualified Operator?</strong>
            <p>
              Qualified operators can create unique branch-tailored travel and processing services. Clients booking these services will be exclusively assigned to your branch.
            </p>
          </div>
        </div>

        <div className="qualification-form-group">
          <label className="qualification-form-label">
            Branch / Operator Details
          </label>
          <div className="qualification-branch-meta-grid">
            <div>
              <span className="qualification-meta-label">Branch Name</span>
              <strong className="qualification-meta-value-bold">{userDetails?.branchName || 'My Branch'}</strong>
            </div>
            <div>
              <span className="qualification-meta-label">Operator Contact</span>
              <span className="qualification-meta-value">{userDetails?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="qualification-form-group">
          <label htmlFor="reason" className="qualification-form-label">
            Qualification Justification & Experience <span className="qualification-required-mark">*</span>
          </label>
          <textarea
            id="reason"
            rows="4"
            className="form-input qualification-textarea"
            placeholder="Describe your branch capabilities, specialized travel services you intend to offer, or relevant certifications..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className="qualification-field-help">
            Provide details to help administrators review and verify your request.
          </span>
        </div>

        {/* Upload Supporting Documents (Up to 5) */}
        <div className="qualification-form-group">
          <div className="qualification-doc-header-row">
            <label className="qualification-form-label" style={{ margin: 0 }}>
              Supporting Documents
            </label>
            <span className={`qualification-doc-counter ${documents.length === MAX_DOCUMENTS ? 'full' : ''}`}>
              <i className="fa-solid fa-paperclip"></i> {documents.length} of {MAX_DOCUMENTS} files attached
            </span>
          </div>

          <div
            className={`qualification-dropzone ${isDragging ? 'is-dragging' : ''} ${documents.length >= MAX_DOCUMENTS ? 'is-disabled' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (documents.length < MAX_DOCUMENTS && !isSubmitting && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => {
                handleFilesSelect(e.target.files);
                e.target.value = null; // Reset for re-selection
              }}
              disabled={documents.length >= MAX_DOCUMENTS || isSubmitting}
            />
            <div className="qualification-dropzone-icon">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div className="qualification-dropzone-text">
              <strong>{documents.length >= MAX_DOCUMENTS ? 'Maximum 5 Documents Reached' : 'Click or drag files here to attach documents'}</strong>
              <span>PDF, PNG, JPG, WEBP, DOC, or DOCX (Max 15MB each)</span>
            </div>
          </div>

          {/* Attached Documents List */}
          {documents.length > 0 && (
            <div className="qualification-attached-list">
              {documents.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="qualification-attached-item">
                  <div className="qualification-attached-item-left">
                    <i className={`${getFileIcon(file.name)} qualification-file-icon`}></i>
                    <div className="qualification-attached-info">
                      <span className="qualification-attached-name" title={file.name}>
                        {file.name}
                      </span>
                      <span className="qualification-attached-meta">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="qualification-remove-doc-btn"
                    onClick={() => handleRemoveDocument(idx)}
                    disabled={isSubmitting}
                    title="Remove document"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploadStatus && (
          <div className="qualification-upload-progress">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            <span>{uploadStatus}</span>
          </div>
        )}

        <div className="qualification-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleModalClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary qualification-submit-btn"
            disabled={isSubmitting || !reason.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i> Submit Application
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
