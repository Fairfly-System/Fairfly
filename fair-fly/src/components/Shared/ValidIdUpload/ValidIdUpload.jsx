import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Trash2, Eye, Info, FileText } from 'lucide-react';
import ValidIdInfoModal, { ACCEPTED_ID_TYPES } from '../ValidIdInfoModal/ValidIdInfoModal';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import { useToast } from '../../UI/toast/ToastProvider';
import './valid-id-upload.css';

export default function ValidIdUpload({
  idType = '',
  onChangeIdType,
  idFront = null,
  idBack = null,
  onUploadFront,
  onUploadBack,
  onRemoveFront,
  onRemoveBack,
  disabled = false,
  error = null,
}) {
  const { addToast } = useToast();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleFileSelected = async (file, side) => {
    if (!file) return;

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      addToast('File size exceeds the 15MB limit. Please upload a smaller image or document.', 'error');
      return;
    }

    // Validate type (images & PDF)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validMimes.includes(file.type)) {
      addToast('Invalid file format. Please upload a JPEG, PNG, WEBP, or PDF file.', 'error');
      return;
    }

    const setUploading = side === 'front' ? setUploadingFront : setUploadingBack;
    const onUploadSuccess = side === 'front' ? onUploadFront : onUploadBack;

    setUploading(true);
    try {
      const res = await uploadFileToBackend(file, 'client_ids');
      onUploadSuccess({
        url: res.url,
        name: res.fileName || file.name,
        size: res.fileSize || file.size,
        type: file.type,
      });
      addToast(`${side === 'front' ? 'Front' : 'Back'} of ID uploaded successfully!`, 'success');
    } catch (err) {
      console.error(`Error uploading ${side} of ID:`, err);
      addToast(err?.message || `Failed to upload ${side} of ID. Please try again.`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const renderDropzone = (side, fileData, uploading, inputRef, onRemove) => {
    const isFront = side === 'front';
    const label = isFront ? 'Front Side of ID' : 'Back Side of ID';
    const isPdf = fileData?.name?.toLowerCase().endsWith('.pdf') || fileData?.type === 'application/pdf';

    return (
      <div className="id-dropzone-wrapper">
        <span className="id-side-label">{label} <span className="id-required-star">*</span></span>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0], side);
              e.target.value = ''; // Reset input to allow re-selection
            }
          }}
        />

        {fileData?.url ? (
          <div className="id-uploaded-card">
            <div className="id-uploaded-preview">
              {isPdf ? (
                <div className="id-pdf-icon-box">
                  <FileText size={24} className="text-purple" />
                </div>
              ) : (
                <img
                  src={fileData.url}
                  alt={label}
                  className="id-thumbnail-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="id-uploaded-info">
              <span className="id-uploaded-name" title={fileData.name}>
                {fileData.name || label}
              </span>
              <span className="id-uploaded-size">
                {fileData.size ? `${(fileData.size / 1024).toFixed(0)} KB` : 'Uploaded'}
                {' • '}
                <span className="text-success font-semibold">
                  <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Ready
                </span>
              </span>
            </div>

            <div className="id-uploaded-actions">
              <a
                href={fileData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="id-action-icon-btn view"
                title="Preview full image"
              >
                <Eye size={15} />
              </a>
              <button
                type="button"
                className="id-action-icon-btn delete"
                title="Remove and replace"
                disabled={disabled}
                onClick={onRemove}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`id-dropzone-box ${uploading ? 'is-uploading' : ''}`}
            onClick={() => !disabled && !uploading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            {uploading ? (
              <div className="id-dropzone-loading">
                <i className="fa-solid fa-spinner fa-spin text-purple" style={{ fontSize: '1.5rem' }}></i>
                <span>Uploading {label}...</span>
              </div>
            ) : (
              <div className="id-dropzone-content">
                <div className="id-dropzone-icon-circle">
                  <UploadCloud size={20} />
                </div>
                <div className="id-dropzone-text">
                  <strong>Click to upload {isFront ? 'Front' : 'Back'}</strong>
                  <span>JPG, PNG, WEBP, or PDF (Max 15MB)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="valid-id-upload-container">
      {/* ID Type Select & Info Button Header */}
      <div className="valid-id-field-header">
        <label className="auth-input-label" htmlFor="idTypeSelect">
          Valid Government ID <span className="id-required-star">*</span>
        </label>
        <button
          type="button"
          className="id-info-pill-btn"
          onClick={() => setIsInfoModalOpen(true)}
          title="Click to view accepted government IDs"
        >
          <Info size={14} />
          <span>Accepted IDs</span>
        </button>
      </div>

      {/* ID Type Dropdown */}
      <div className="auth-input-wrapper id-type-select-wrapper">
        <i className="fa-solid fa-address-card auth-input-icon" />
        <select
          id="idTypeSelect"
          className="auth-input id-type-select"
          value={idType}
          onChange={(e) => onChangeIdType(e.target.value)}
          disabled={disabled}
          required
        >
          <option value="" disabled>
            Select ID Type (e.g. Passport, PhilSys, Driver's License)
          </option>
          {ACCEPTED_ID_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dual Upload Slots (Front and Back) */}
      <div className="id-dual-upload-grid">
        {renderDropzone('front', idFront, uploadingFront, frontInputRef, onRemoveFront)}
        {renderDropzone('back', idBack, uploadingBack, backInputRef, onRemoveBack)}
      </div>

      {error && <p className="auth-input-error">{error}</p>}

      {/* Accepted ID Guide Modal */}
      <ValidIdInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
