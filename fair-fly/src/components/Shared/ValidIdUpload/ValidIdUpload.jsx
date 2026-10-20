import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Trash2, Eye, Info, FileText } from 'lucide-react';
import ValidIdInfoModal, { ACCEPTED_ID_TYPES } from '../ValidIdInfoModal/ValidIdInfoModal';
import { useToast } from '../../UI/toast/ToastProvider';
import { useLightbox } from '../../UI/ImageLightbox/ImageLightbox';
import { usePdfModal } from '../../Shared/PdfDocument/PdfDocumentView';
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
  const { openLightbox } = useLightbox();
  const { openPdfModal } = usePdfModal();

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleFileSelected = (file, side) => {
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

    // Clean up previous blob URL if exists
    const previous = side === 'front' ? idFront : idBack;
    if (previous?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previous.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const filePayload = {
      file,
      previewUrl,
      url: previewUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    if (side === 'front') {
      onUploadFront(filePayload);
    } else {
      onUploadBack(filePayload);
    }

    addToast(`${side === 'front' ? 'Front' : 'Back'} of ID attached!`, 'success');
  };

  const renderDropzone = (side, fileData, inputRef, onRemove) => {
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
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0], side);
              e.target.value = ''; // Reset input to allow re-selection
            }
          }}
        />

        {fileData?.url ? (
          <div className="id-card-preview-slot">
            {isPdf ? (
              <div className="id-pdf-preview-content">
                <div className="id-card-top-row">
                  <span className="id-card-ready-pill pdf">
                    <FileText size={12} />
                    <span>PDF</span>
                  </span>
                  <div className="id-card-action-btns">
                    <button
                      type="button"
                      className="id-card-btn view"
                      title="View PDF document"
                      onClick={() =>
                        openPdfModal({
                          type: 'file',
                          url: fileData.previewUrl || fileData.url,
                          title: fileData.name || label || 'Government ID PDF'
                        })
                      }
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      className="id-card-btn delete"
                      title="Remove and replace"
                      disabled={disabled}
                      onClick={onRemove}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="id-pdf-center-icon">
                  <FileText size={26} />
                </div>

                <div className="id-card-bottom-info">
                  <span className="id-card-filename" title={fileData.name}>
                    {fileData.name || label}
                  </span>
                  <span className="id-card-filesize">
                    {fileData.size ? `${(fileData.size / 1024).toFixed(0)} KB` : 'Attached'} • Ready
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="id-image-preview-content"
                onClick={() =>
                  openLightbox({
                    url: fileData.previewUrl || fileData.url,
                    title: fileData.name || label,
                    subtitle: `${label} · ${idType || 'Government ID'}`
                  })
                }
                title="Click to view full preview in lightbox"
              >
                <img
                  src={fileData.previewUrl || fileData.url}
                  alt={label}
                  className="id-preview-img-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <div className="id-preview-scrim" />

                <div className="id-card-top-row" onClick={(e) => e.stopPropagation()}>
                  <span className="id-card-ready-pill success">
                    <CheckCircle2 size={12} />
                    <span>Ready</span>
                  </span>
                  <div className="id-card-action-btns">
                    <button
                      type="button"
                      className="id-card-btn view"
                      title="Preview in Lightbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox({
                          url: fileData.previewUrl || fileData.url,
                          title: fileData.name || label,
                          subtitle: `${label} · ${idType || 'Government ID'}`
                        });
                      }}
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      className="id-card-btn delete"
                      title="Remove and replace"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="id-card-bottom-info">
                  <span className="id-card-filename" title={fileData.name}>
                    {fileData.name || label}
                  </span>
                  <span className="id-card-filesize">
                    {fileData.size ? `${(fileData.size / 1024).toFixed(0)} KB` : 'Attached'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`id-dropzone-box ${disabled ? 'is-disabled' : ''}`}
            onClick={() => !disabled && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <div className="id-dropzone-content">
              <div className="id-dropzone-icon-circle">
                <UploadCloud size={18} />
              </div>
              <div className="id-dropzone-text">
                <strong>Choose {isFront ? 'Front' : 'Back'}</strong>
                <span>JPG, PNG, or PDF</span>
              </div>
            </div>
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
        {renderDropzone('front', idFront, frontInputRef, onRemoveFront)}
        {renderDropzone('back', idBack, backInputRef, onRemoveBack)}
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
