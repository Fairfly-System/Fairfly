import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

function WorkflowStepsModal({ isOpen, onClose, initialSteps = [], onSaveSteps }) {
  const [steps, setSteps] = useState(initialSteps);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');

  useEffect(() => {
    setSteps(initialSteps);
  }, [isOpen, initialSteps]);

  const handleAddStep = () => {
    if (!stepName.trim() || !stepDescription.trim()) return;

    setSteps([...steps, { name: stepName.trim(), description: stepDescription.trim() }]);
    setStepName('');
    setStepDescription('');
  };

  const handleDeleteStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveSteps(steps);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-diagram-project" style={{ color: '#f97316' }}></i>
          <span>Workflow Steps</span>
        </div>
      }
      subtitle="Define the steps for this workflow template"
    >
      <div className="modalForm">
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
                  <h4>{step.name}</h4>
                  <p>{step.description}</p>
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

        <div className="formGroup" style={{ marginTop: '12px', gap: '8px' }}>
          <input
            type="text"
            className="modalInput"
            placeholder="Step name *"
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
          />
          <input
            type="text"
            className="modalInput"
            placeholder="Step description *"
            value={stepDescription}
            onChange={(e) => setStepDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
          />
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddStep}
          disabled={!stepName.trim() || !stepDescription.trim()}
          style={{
            opacity: (!stepName.trim() || !stepDescription.trim()) ? 0.6 : 1,
            cursor: (!stepName.trim() || !stepDescription.trim()) ? 'not-allowed' : 'pointer'
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

export default function WorkflowForm({ onSubmit, onClose, templateData = null }) {
  const [formData, setFormData] = useState({
    name: templateData ? templateData.name : '',
    description: templateData ? templateData.description : '',
    type: templateData ? templateData.type : '',
  });
  const [steps, setSteps] = useState(
    templateData && Array.isArray(templateData.steps) ? templateData.steps : []
  );
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;
    onSubmit({ ...formData, steps });
  };

  return (
    <form className="modalForm" onSubmit={handleSubmit}>
      <div className="formGroup">
        <label>Workflow Name</label>
        <input
          type="text"
          name="name"
          className="modalInput"
          placeholder="e.g., Customer Onboarding Process"
          value={formData.name}
          onChange={handleInputChange}
        />
      </div>

      <div className="formGroup">
        <label>Description</label>
        <textarea
          name="description"
          className="modalInput"
          placeholder="Describe what this workflow accomplishes..."
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>

      <div className="formGroup">
        <label>Workflow Type (Optional)</label>
        <input
          type="text"
          name="type"
          className="modalInput"
          placeholder="e.g., onboarding, approval, processing"
          value={formData.type}
          onChange={handleInputChange}
        />
      </div>

      <div className="formGroup">
        <label>Workflow Steps</label>
        <button
          type="button"
          className="modalSubmitBtn btnLightBlue"
          onClick={() => setIsStepsModalOpen(true)}
        >
          <span style={{ color: '#5865f2' }}>
            {steps.length > 0 ? `Edit Steps (${steps.length})` : 'Add Step/s'}
          </span>
        </button>
      </div>

      <button type="submit" className="modalSubmitBtn btnGreen">
        {templateData ? 'Update Workflow' : 'Create Workflow'}
      </button>
      {onClose && (
        <button type="button" className="modalSubmitBtn" onClick={onClose} style={{ backgroundColor: '#6b7280', marginTop: 0 }}>
          Cancel
        </button>
      )}

      <WorkflowStepsModal
        isOpen={isStepsModalOpen}
        onClose={() => setIsStepsModalOpen(false)}
        initialSteps={steps}
        onSaveSteps={(updatedSteps) => setSteps(updatedSteps)}
      />
    </form>
  );
}
