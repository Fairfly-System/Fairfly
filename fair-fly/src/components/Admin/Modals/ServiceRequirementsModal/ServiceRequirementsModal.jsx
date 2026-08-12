import React, { useState, useEffect } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

const PROHIBITED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.jar', '.vbs', '.js', '.scr', '.com', '.pif', '.hta', '.cpl', '.msc'];

function isProhibitedFile(filename) {
  if (!filename) return false;
  const clean = filename.toLowerCase();
  return PROHIBITED_EXTENSIONS.some(ext => clean.endsWith(ext));
}

export default function ServiceRequirementsModal({ isOpen, onClose, initialRequirements = [], onSaveRequirements }) {
  const [requirements, setRequirements] = useState(initialRequirements);

  const [newReqName, setNewReqName] = useState('');
  const [newReqInputType, setNewReqInputType] = useState('image'); // 'image' | 'file' | 'text' | 'date' | 'number'
  const [newReqRequired, setNewReqRequired] = useState(true);
  
  // Attachment State
  const [attachmentType, setAttachmentType] = useState('none'); // 'none' | 'link' | 'file'
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setRequirements(initialRequirements);
  }, [isOpen, initialRequirements]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isProhibitedFile(file.name)) {
      setUploadError('Executable files (.exe, .bat, .sh, etc.) are prohibited for security.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit.');
      setSelectedFile(null);
      return;
    }

    setUploadError('');
    setSelectedFile(file);
  };

  const handleAddRequirement = () => {
    if (!newReqName.trim()) {
      return;
    }

    let attachmentObj = null;

    if (attachmentType === 'file') {
      if (!selectedFile) {
        setUploadError('Please select a file to attach.');
        return;
      }

      attachmentObj = {
        type: 'file',
        pendingFile: selectedFile,
        url: '',
        title: attachmentTitle.trim() || selectedFile.name,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      };
    } else if (attachmentType === 'link' && attachmentUrl.trim()) {
      attachmentObj = {
        type: 'link',
        url: attachmentUrl.trim(),
        title: attachmentTitle.trim() || 'External Link'
      };
    }

    setRequirements([...requirements, {
      name: newReqName.trim(),
      title: newReqName.trim(),
      inputType: newReqInputType,
      required: newReqRequired,
      attachment: attachmentObj
    }]);

    setNewReqName('');
    setNewReqInputType('image');
    setNewReqRequired(true);
    setAttachmentType('none');
    setAttachmentUrl('');
    setAttachmentTitle('');
    setSelectedFile(null);
    setUploadError('');
  };

  const handleDeleteRequirement = (indexToDelete) => {
    setRequirements(requirements.filter((_, index) => index !== indexToDelete));
  };

  const handleSave = () => {
    onSaveRequirements(requirements);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="550px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-regular fa-clipboard" style={{ color: 'var(--purple)' }}></i>
          <span>Service Requirements</span>
        </div>
      }
      subtitle="Edit requirements and attach document files to be uploaded on save"
    >
      <div className="modalForm">
        <div className="stepsContainer" style={{ maxHeight: '18.75rem', overflowY: 'auto' }}>
          {requirements.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.25rem 0' }}>
              No requirements added yet. Fill out the fields below to add one.
            </p>
          ) : (
            requirements.map((req, index) => (
              <div key={index} className="stepCard" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div className="stepBadge">{index + 1}</div>
                    <div className="stepContent">
                      <h4>{req.name || req.title}</h4>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.125rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: req.required ? 'var(--red)' : 'var(--text-mid)',
                          }}
                        >
                          {req.required ? '(Required)' : '(Optional)'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, background: '#e0e7ff', color: '#3730a3', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          Type: {req.inputType || 'text'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="deleteBtn"
                    onClick={() => handleDeleteRequirement(index)}
                    title="Delete Requirement"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>

                {/* Render Requirement Attachment if Present */}
                {req.attachment && (req.attachment.url || req.attachment.pendingFile) && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.375rem 0.625rem',
                    background: 'var(--purple-light-2)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--purple-dark)', fontWeight: 600 }}>
                      <i className={req.attachment.type === 'file' ? 'fa-solid fa-paperclip' : 'fa-solid fa-link'}></i>
                      <span>{req.attachment.title || req.attachment.fileName || 'Attachment'}</span>
                      {req.attachment.pendingFile && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--orange-dark)', background: 'var(--orange-light)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                          Ready to Upload
                        </span>
                      )}
                    </div>
                    {req.attachment.url ? (
                      <a
                        href={req.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--purple)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        View File <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.6875rem' }}></i>
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-mid)' }}>
                        {(req.attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="formGroup" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Add New Requirement</label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
            <input
              type="text"
              className="modalInput"
              placeholder="Requirement name (e.g. Passport Image) *"
              value={newReqName}
              onChange={(e) => setNewReqName(e.target.value)}
            />
            <select
              className="modalSelect"
              value={newReqInputType}
              onChange={(e) => setNewReqInputType(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="image">📷 Image Upload</option>
              <option value="file">📄 Document File</option>
              <option value="text">✏️ Text Response</option>
              <option value="date">📅 Date Input</option>
              <option value="number">🔢 Number Input</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', fontWeight: 600 }}>Requirement Type:</span>
            <label style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="requirementType"
                checked={newReqRequired === true}
                onChange={() => setNewReqRequired(true)}
              />
              Required
            </label>
            <label style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="requirementType"
                checked={newReqRequired === false}
                onChange={() => setNewReqRequired(false)}
              />
              Optional
            </label>
          </div>

          {/* Attachment Selector */}
          <div style={{ marginTop: '0.5rem', background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '0.0625rem solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                <i className="fa-solid fa-paperclip" style={{ marginRight: '0.25rem', color: 'var(--purple)' }}></i>
                Attach File or Link:
              </span>
              <select
                className="modalSelect"
                style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }}
                value={attachmentType}
                onChange={(e) => {
                  setAttachmentType(e.target.value);
                  setSelectedFile(null);
                  setAttachmentUrl('');
                  setUploadError('');
                }}
              >
                <option value="none">None</option>
                <option value="file">Upload Document / File</option>
                <option value="link">Web Link / URL</option>
              </select>
            </div>

            {attachmentType === 'file' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  border: '1px dashed var(--purple-light, #e9d5ff)',
                  background: 'var(--purple-light-2, #f5f3ff)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm, 0.375rem)',
                  textAlign: 'center'
                }}>
                  <input
                    type="file"
                    id="req-file-input"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {!selectedFile ? (
                    <label htmlFor="req-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--purple)' }}></i>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--purple-dark)' }}>
                        Click to select document file
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-mid)' }}>
                        PDF, DOCX, XLSX, PNG, JPG (Max 10MB)
                      </span>
                    </label>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--purple-dark)', fontWeight: 600, overflow: 'hidden' }}>
                        <i className="fa-solid fa-file-pdf"></i>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                          {selectedFile.name}
                        </span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="deleteBtn"
                        onClick={() => setSelectedFile(null)}
                        title="Remove file"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  className="modalInput"
                  style={{ fontSize: '0.8125rem' }}
                  placeholder="Display Title / File Label (Optional)"
                  value={attachmentTitle}
                  onChange={(e) => setAttachmentTitle(e.target.value)}
                />
              </div>
            )}

            {attachmentType === 'link' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <input
                  type="url"
                  className="modalInput"
                  style={{ fontSize: '0.8125rem' }}
                  placeholder="Web Link URL (e.g. https://...) *"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
                <input
                  type="text"
                  className="modalInput"
                  style={{ fontSize: '0.8125rem' }}
                  placeholder="Display Title / Link Label (Optional)"
                  value={attachmentTitle}
                  onChange={(e) => setAttachmentTitle(e.target.value)}
                />
              </div>
            )}

            {uploadError && (
              <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.375rem', marginBottom: 0, fontWeight: 600 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.25rem' }}></i>
                {uploadError}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddRequirement}
          disabled={!newReqName.trim() || (attachmentType === 'file' && !selectedFile)}
          style={{
            opacity: (!newReqName.trim() || (attachmentType === 'file' && !selectedFile)) ? 0.6 : 1,
            cursor: (!newReqName.trim() || (attachmentType === 'file' && !selectedFile)) ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Add Requirement
        </button>

        <hr className="modalDivider" />

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleSave}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.5rem' }}></i>
          Save Requirements
        </button>
      </div>
    </BaseModal>
  );
}
