import React, { useState, useEffect } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

export default function ServiceRequirementsModal({ isOpen, onClose, initialRequirements = [], onSaveRequirements }) {
  const [requirements, setRequirements] = useState(initialRequirements);

  const [newReqName, setNewReqName] = useState('');
  const [newReqRequired, setNewReqRequired] = useState(true);
  
  // Attachment State
  const [attachmentType, setAttachmentType] = useState('none'); // 'none' | 'link' | 'file'
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentTitle, setAttachmentTitle] = useState('');

  useEffect(() => {
    setRequirements(initialRequirements);
  }, [isOpen, initialRequirements]);

  const handleAddRequirement = () => {
    if (!newReqName.trim()) {
      return;
    }

    const attachmentObj = attachmentType !== 'none' && attachmentUrl.trim() ? {
      type: attachmentType,
      url: attachmentUrl.trim(),
      title: attachmentTitle.trim() || (attachmentType === 'file' ? 'Attached File' : 'External Link')
    } : null;

    setRequirements([...requirements, {
      name: newReqName.trim(),
      required: newReqRequired,
      attachment: attachmentObj
    }]);

    setNewReqName('');
    setNewReqRequired(true);
    setAttachmentType('none');
    setAttachmentUrl('');
    setAttachmentTitle('');
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
      subtitle="Edit requirements and attach files or reference links"
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
                      <h4>{req.name}</h4>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: req.required ? 'var(--red)' : 'var(--text-mid)',
                          marginTop: '0.125rem',
                          display: 'inline-block',
                        }}
                      >
                        {req.required ? '(Required)' : '(Optional)'}
                      </span>
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
                {req.attachment && req.attachment.url && (
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
                      <span>{req.attachment.title || 'Attachment'}</span>
                    </div>
                    <a
                      href={req.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--purple)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Open <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.6875rem' }}></i>
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="formGroup" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Add New Requirement</label>
          <input
            type="text"
            className="modalInput"
            placeholder="Requirement name (e.g. Barangay Clearance) *"
            value={newReqName}
            onChange={(e) => setNewReqName(e.target.value)}
          />

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
                onChange={(e) => setAttachmentType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="link">Web Link / URL</option>
                <option value="file">Document / File URL</option>
              </select>
            </div>

            {attachmentType !== 'none' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <input
                  type="url"
                  className="modalInput"
                  style={{ fontSize: '0.8125rem' }}
                  placeholder={attachmentType === 'file' ? 'File URL (e.g. https://drive.google.com/...) *' : 'Web Link URL (e.g. https://...) *'}
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
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
          </div>
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddRequirement}
          disabled={!newReqName.trim()}
          style={{
            opacity: !newReqName.trim() ? 0.6 : 1,
            cursor: !newReqName.trim() ? 'not-allowed' : 'pointer',
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
