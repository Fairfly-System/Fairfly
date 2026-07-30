import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

export default function ServiceRequirementsModal({ isOpen, onClose, initialRequirements = [], onSaveRequirements }) {
  const [requirements, setRequirements] = useState(initialRequirements);

  const [newReqName, setNewReqName] = useState('');
  const [newReqRequired, setNewReqRequired] = useState(true);

  useEffect(() => {
    setRequirements(initialRequirements);
  }, [isOpen, initialRequirements]);

  const handleAddRequirement = () => {
    if (!newReqName.trim()) {
      return;
    }

    setRequirements([...requirements, {
      name: newReqName.trim(),
      required: newReqRequired,
    }]);

    setNewReqName('');
    setNewReqRequired(true);
  };

  const handleDeleteRequirement = (indexToDelete) => {
    setRequirements(requirements.filter((_, index) => index !== indexToDelete));
  };

  const handleSave = () => {
    onSaveRequirements(requirements);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-regular fa-clipboard" style={{ color: '#5865f2' }}></i>
          <span>Service Requirements</span>
        </div>
      }
      subtitle="Edit the requirements for the selected service"
    >
      <div className="modalForm">
        <div className="stepsContainer">
          {requirements.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: '20px 0' }}>
              No requirements added yet. Fill out the fields below to add one.
            </p>
          ) : (
            requirements.map((req, index) => (
              <div key={index} className="stepCard">
                <div className="stepBadge">{index + 1}</div>
                <div className="stepContent">
                  <h4>{req.name}</h4>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: req.required ? '#ef4444' : '#6b7280',
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    {req.required ? '(Required)' : '(Optional)'}
                  </span>
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
            ))
          )}
        </div>

        <div className="formGroup" style={{ marginTop: '12px', gap: '8px' }}>
          <input
            type="text"
            className="modalInput"
            placeholder="Requirement name *"
            value={newReqName}
            onChange={(e) => setNewReqName(e.target.value)}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Type:</span>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="requirementType"
                checked={newReqRequired === true}
                onChange={() => setNewReqRequired(true)}
              />
              Required
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="requirementType"
                checked={newReqRequired === false}
                onChange={() => setNewReqRequired(false)}
              />
              Optional
            </label>
          </div>
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddRequirement}
          disabled={!newReqName.trim()}
          style={{
            opacity: !newReqName.trim() ? 0.6 : 1,
            cursor: !newReqName.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
          Add Requirement
        </button>

        <hr className="modalDivider" />

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleSave}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }}></i>
          Save Requirements
        </button>
      </div>
    </ModalWrapper>
  );
}
