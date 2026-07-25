import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

export default function ServiceStepsModal({ isOpen, onClose, initialSteps = [], onSaveSteps }) {
  const [steps, setSteps] = useState(initialSteps);
  
  // State for all 3 fields
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [newStepLink, setNewStepLink] = useState('');

  // Sync internal state when modal opens with existing steps
  useEffect(() => {
    setSteps(initialSteps);
  }, [isOpen, initialSteps]);

  const handleAddStep = () => {
    // Validation: Require Title AND Description (trimmed)
    if (!newStepTitle.trim() || !newStepText.trim()) {
      return; 
    }

    const newStepObj = {
      title: newStepTitle.trim(),
      description: newStepText.trim(),
      link: newStepLink.trim() || null, // Link is optional
    };

    setSteps([...steps, newStepObj]);

    // Reset input fields after successful addition
    setNewStepTitle('');
    setNewStepText('');
    setNewStepLink('');
  };

  const handleDeleteStep = (indexToDelete) => {
    setSteps(steps.filter((_, index) => index !== indexToDelete));
  };

  const handleSave = () => {
    onSaveSteps(steps); // Send steps back to parent form
    onClose(); // Close modal
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-regular fa-clipboard" style={{ color: '#5865f2' }}></i>
          <span>Service Steps</span>
        </div>
      }
      subtitle="Edit the steps for the selected service"
    >
      <div className="modalForm">
        {/* Scrollable Steps Container */}
        <div className="stepsContainer">
          {steps.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: '20px 0' }}>
              No steps added yet. Fill out the fields below to add one.
            </p>
          ) : (
            steps.map((step, index) => (
              <div key={index} className="stepCard">
                <div className="stepBadge">{index + 1}</div>
                <div className="stepContent">
                  <h4>{typeof step === 'object' ? step.title : `Step ${index + 1}`}</h4>
                  <p>{typeof step === 'object' ? step.description : step}</p>
                  
                  {/* Render link if present */}
                  {typeof step === 'object' && step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#5865f2', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
                    >
                      <i className="fa-solid fa-link" style={{ marginRight: '4px' }}></i>
                      {step.link}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  className="deleteBtn"
                  onClick={() => handleDeleteStep(index)}
                  title="Delete Step"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input for adding new steps */}
        <div className="formGroup" style={{ marginTop: '12px', gap: '8px' }}>
          <input
            type="text"
            className="modalInput"
            placeholder="Title *"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            required
          />

          <input
            type="text"
            className="modalInput"
            placeholder="Description *"
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
            required
          />

          <input
            type="text"
            className="modalInput"
            placeholder="Links (Optional)"
            value={newStepLink}
            onChange={(e) => setNewStepLink(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddStep}
          disabled={!newStepTitle.trim() || !newStepText.trim()} // Disable button if required fields are empty
          style={{
            opacity: (!newStepTitle.trim() || !newStepText.trim()) ? 0.6 : 1,
            cursor: (!newStepTitle.trim() || !newStepText.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
          Add Step
        </button>

        <hr className="modalDivider" />

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleSave}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }}></i>
          Save Steps
        </button>
      </div>
    </ModalWrapper>
  );
}