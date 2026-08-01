import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.jar', '.vbs', '.js', '.scr', '.com', '.pif', '.application', '.gadget', '.msp', '.hta', '.cpl', '.msc'];

function isExecutableFile(filenameOrUrl) {
  if (!filenameOrUrl) return false;
  const clean = filenameOrUrl.split('?')[0].toLowerCase();
  return EXECUTABLE_EXTENSIONS.some(ext => clean.endsWith(ext));
}

function WorkflowStepsModal({ isOpen, onClose, initialSteps = [], onSaveSteps }) {
  const [steps, setSteps] = useState(initialSteps);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');

  // Step Optional Attachments State (Link AND File can both be attached)
  const [stepLinkUrl, setStepLinkUrl] = useState('');
  const [stepLinkTitle, setStepLinkTitle] = useState('');
  const [stepFileUrl, setStepFileUrl] = useState('');
  const [stepFileName, setStepFileName] = useState('');
  const [fileError, setFileError] = useState('');

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    setSteps(initialSteps);
  }, [isOpen, initialSteps]);

  const handleAddStep = () => {
    if (!stepName.trim() || !stepDescription.trim()) return;

    if (stepFileUrl.trim() && (isExecutableFile(stepFileUrl) || isExecutableFile(stepFileName))) {
      setFileError('Executable files (.exe, .bat, .sh, etc.) are prohibited for security.');
      return;
    }

    setFileError('');

    const linkObj = stepLinkUrl.trim() ? {
      url: stepLinkUrl.trim(),
      title: stepLinkTitle.trim() || 'External Link'
    } : null;

    const fileObj = stepFileUrl.trim() ? {
      url: stepFileUrl.trim(),
      name: stepFileName.trim() || 'Attached Document'
    } : null;

    setSteps([...steps, {
      name: stepName.trim(),
      description: stepDescription.trim(),
      link: linkObj,
      file: fileObj
    }]);

    setStepName('');
    setStepDescription('');
    setStepLinkUrl('');
    setStepLinkTitle('');
    setStepFileUrl('');
    setStepFileName('');
  };

  const handleDeleteStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Reorder steps up or down by delta (-1 or +1)
  const handleMoveStep = (index, delta) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const updated = [...steps];
    const [movedStep] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedStep);
    setSteps(updated);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...steps];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);

    setSteps(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-diagram-project" style={{ color: 'var(--orange)' }}></i>
          <span>Workflow Steps</span>
        </div>
      }
      subtitle="Define and re-order steps with optional document and web link attachments"
    >
      <div className="modalForm">
        <div className="stepsContainer" style={{ maxHeight: '18.75rem', overflowY: 'auto' }}>
          {steps.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', margin: '1.25rem 0' }}>
              No steps added yet. Fill out the fields below to add one.
            </p>
          ) : (
            steps.map((step, index) => {
              const isBeingDragged = draggedIndex === index;
              const isTargeted = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={index}
                  className={`stepCard ${isBeingDragged ? 'dragging' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: 'grab',
                    opacity: isBeingDragged ? 0.4 : 1,
                    border: isTargeted ? '0.125rem dashed var(--purple)' : '0.0625rem solid var(--border-color)',
                    background: isTargeted ? 'var(--purple-light-2)' : 'var(--card-bg)',
                    transition: 'var(--transition-fast)',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {/* Grip Vertical Reorder Handle */}
                    <div
                      title="Drag to reorder"
                      style={{
                        cursor: 'grab',
                        padding: '0 0.375rem 0 0',
                        color: 'var(--text-light)',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <i className="fa-solid fa-grip-vertical"></i>
                    </div>

                    <div className="stepBadge">{index + 1}</div>

                    <div className="stepContent" style={{ flex: 1, marginLeft: '12px' }}>
                      <h4>{step.name}</h4>
                      <p>{step.description}</p>
                    </div>

                    {/* Move Up / Move Down Arrow Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', marginRight: '0.375rem' }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStep(index, -1)}
                        style={{
                          padding: '0.125rem 0.375rem',
                          fontSize: '0.75rem',
                          color: index === 0 ? 'var(--border-color)' : 'var(--text-mid)',
                          cursor: index === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="Move Up"
                      >
                        <i className="fa-solid fa-chevron-up"></i>
                      </button>
                      <button
                        type="button"
                        disabled={index === steps.length - 1}
                        onClick={() => handleMoveStep(index, 1)}
                        style={{
                          padding: '0.125rem 0.375rem',
                          fontSize: '0.75rem',
                          color: index === steps.length - 1 ? 'var(--border-color)' : 'var(--text-mid)',
                          cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer'
                        }}
                        title="Move Down"
                      >
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
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

                  {/* Render Attachments (Link AND File simultaneously if present) */}
                  {(step.link?.url || step.file?.url) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {step.link?.url && (
                        <a
                          href={step.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--purple-dark)',
                            background: 'var(--purple-light-2)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <i className="fa-solid fa-link"></i>
                          <span>{step.link.title || 'Web Link'}</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.625rem' }}></i>
                        </a>
                      )}

                      {step.file?.url && (
                        <a
                          href={step.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--orange-dark, #c2410c)',
                            background: 'var(--orange-light, #ffedd5)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <i className="fa-solid fa-file-lines"></i>
                          <span>{step.file.name || 'Document File'}</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.625rem' }}></i>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="formGroup" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Add Step Details</label>
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
          />

          {/* Optional Attachments Container (Link + File) */}
          <div style={{ marginTop: '0.25rem', background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '0.0625rem solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
              Optional Step Attachments (Both link & document file can be attached):
            </span>

            {/* Optional Web Link */}
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <input
                type="url"
                className="modalInput"
                style={{ fontSize: '0.8125rem', flex: 2 }}
                placeholder="Web Link URL (e.g. https://...)"
                value={stepLinkUrl}
                onChange={(e) => setStepLinkUrl(e.target.value)}
              />
              <input
                type="text"
                className="modalInput"
                style={{ fontSize: '0.8125rem', flex: 1 }}
                placeholder="Link Title (Optional)"
                value={stepLinkTitle}
                onChange={(e) => setStepLinkTitle(e.target.value)}
              />
            </div>

            {/* Optional Document File */}
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <input
                type="url"
                className="modalInput"
                style={{ fontSize: '0.8125rem', flex: 2 }}
                placeholder="Document File URL (PDF, DOC, XLS, etc.)"
                value={stepFileUrl}
                onChange={(e) => {
                  setStepFileUrl(e.target.value);
                  if (fileError) setFileError('');
                }}
              />
              <input
                type="text"
                className="modalInput"
                style={{ fontSize: '0.8125rem', flex: 1 }}
                placeholder="File Name / Label"
                value={stepFileName}
                onChange={(e) => {
                  setStepFileName(e.target.value);
                  if (fileError) setFileError('');
                }}
              />
            </div>

            {fileError && (
              <p style={{ color: 'var(--red)', fontSize: '0.75rem', margin: 0, fontWeight: 600 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.25rem' }}></i>
                {fileError}
              </p>
            )}
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-light)', margin: 0 }}>
              * Accepted files: Documents & Media (PDF, DOCX, XLSX, PNG, etc.). Executable files (.exe, .bat, .sh) are prohibited.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleAddStep}
          disabled={!stepName.trim() || !stepDescription.trim()}
          style={{
            opacity: (!stepName.trim() || !stepDescription.trim()) ? 0.6 : 1,
            cursor: (!stepName.trim() || !stepDescription.trim()) ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i>
          Add Step
        </button>

        <hr className="modalDivider" />

        <button
          type="button"
          className="modalSubmitBtn btnBlue"
          onClick={handleSave}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.5rem' }}></i>
          Save Steps
        </button>
      </div>
    </ModalWrapper>
  );
}

export default function WorkflowForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || '',
  });
  const [steps, setSteps] = useState(
    initialData && Array.isArray(initialData.steps) ? initialData.steps : []
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
          required
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
          required
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
          <span style={{ color: 'var(--purple)' }}>
            <i className="fa-solid fa-diagram-project" style={{ marginRight: '0.375rem' }}></i>
            {steps.length > 0 ? `Edit / Reorder Steps (${steps.length})` : 'Add Step/s'}
          </span>
        </button>
      </div>

      <button type="submit" className="modalSubmitBtn btnGreen">
        {initialData ? 'Update Workflow' : 'Create Workflow'}
      </button>
      {onCancel && (
        <button type="button" className="modalSubmitBtn" onClick={onCancel} style={{ backgroundColor: 'var(--text-mid)', marginTop: 0 }}>
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
