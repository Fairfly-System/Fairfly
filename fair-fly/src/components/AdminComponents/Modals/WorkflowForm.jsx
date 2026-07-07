import React, { useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';

export default function WorkflowForm({ onSubmit, templateData = null }) {
  const [formData, setFormData] = useState({
    name: templateData ? templateData.name : '',
    description: templateData ? templateData.description : '',
    type: templateData ? templateData.type : '',
    steps: templateData && Array.isArray(templateData.steps) ? templateData.steps : [{ name: '', description: '' }]
  });
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');

  // Initialize step editing if we're editing an existing template
  // We'll handle this when the user clicks to edit a step

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStepsChange = (index, field, value) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      if (index >= newSteps.length) return prev;
      newSteps[index] = {
        ...newSteps[index],
        [field]: value
      };
      return { ...prev, steps: newSteps };
    });
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { name: '', description: '' }]
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length <= 1) {
      const { addToast } = useToast();
      addToast('At least one step is required', 'error');
      return;
    }
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps.splice(index, 1);
      return { ...prev, steps: newSteps };
    });
  };

  const updateStep = (index, name, description) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { name, description };
      return { ...prev, steps: newSteps };
    });
    setEditingStepIndex(null);
    setStepName('');
    setStepDescription('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { addToast } = useToast();

    // Validate
    if (!formData.name.trim()) {
      addToast('Workflow name is required', 'error');
      return;
    }

    if (!formData.description.trim()) {
      addToast('Workflow description is required', 'error');
      return;
    }

    if (formData.steps.length === 0) {
      addToast('At least one step is required', 'error');
      return;
    }

    // Validate steps have names and descriptions
    const invalidStep = formData.steps.find(step => !step.name.trim() || !step.description.trim());
    if (invalidStep) {
      addToast('All steps must have a name and description', 'error');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className="modalForm" onSubmit={handleSubmit}>
      <div className="formGroup">
        <label>Workflow Name</label>
        <input
          type="text"
          className="modalInput"
          placeholder="e.g., Customer Onboarding Process"
          value={formData.name}
          onChange={handleInputChange}
        />
      </div>

      <div className="formGroup">
        <label>Description</label>
        <textarea
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
          className="modalInput"
          placeholder="e.g., onboarding, approval, processing"
          value={formData.type}
          onChange={handleInputChange}
        />
      </div>

      <div className="formGroup">
        <label>Workflow Steps</label>
        <div className="steps-container">
          {formData.steps.map((step, index) => (
            <div key={index} className="step-item">
              {editingStepIndex === index ? (
                <>
                  <input
                    type="text"
                    className="step-input"
                    placeholder="Step name"
                    value={stepName || step.name}
                    onChange={(e) => setStepName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="step-input"
                    placeholder="Step description"
                    value={stepDescription || step.description}
                    onChange={(e) => setStepDescription(e.target.value)}
                  />
                  <div className="step-actions">
                    <button
                      className="step-btn save-step"
                      onClick={() => updateStep(index, stepName.trim(), stepDescription.trim())}
                    >
                      Save
                    </button>
                    <button
                      className="step-btn cancel-step
                        onClick={() => { Name('')}">
Cancel
 </                </div>
                </>
              ) : (
                <>
                  <div className="step-content">
                    <h4>Step {index + 1}</h4>
                    <p><strong>Name:</strong> {step.name}</p>
                    <p><strong>Description:</strong> {step.description}</p>
                  </div>
                  <div className="step-actions">
                    <button
                      className="step-btn edit-step"
                      onClick={() => {
                        setEditingStepIndex(index);
                        setStepName(step.name);
                        setStepDescription(step.description);
                      }}
                    >
                      Edit
                    </button>
                    {formData.steps.length > 1 && (
                      <button
                        className="step-btn remove-step"
                        onClick={() => removeStep(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="step-item">
            <button
              className="step-btn add-step"
              onClick={addStep}
            >
              Add Step
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="modalSubmitBtn btnGreen">
        {templateData ? 'Update Workflow' : 'Create Workflow'}
      </button>
      <button type="button" className="modalSubmitBtn btnGray" onClick={() => {
        // TODO: Implement cancel/close functionality via props
      }}>
        Cancel
      </button>
    </form>
  );
}