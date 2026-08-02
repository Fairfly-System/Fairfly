import React, { useState, forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import WorkflowForm from './WorkflowForm';

const WorkflowModal = forwardRef(({ isOpen, onClose, editingTemplate: propEditingTemplate, onSubmit, isLoading }, ref) => {
  const [internalTemplate, setInternalTemplate] = useState(null);

  const activeTemplate = propEditingTemplate !== undefined ? propEditingTemplate : internalTemplate;

  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={() => {
        setInternalTemplate(null);
        if (onClose) onClose();
      }}
      onOpen={(template) => setInternalTemplate(template || null)}
      maxWidth="600px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className={`fa-solid ${activeTemplate ? 'fa-pen-to-square' : 'fa-plus'}`}
            style={{ color: 'var(--purple)' }}
          />
          <span>{activeTemplate ? 'Edit Workflow Template' : 'Create Workflow Template'}</span>
        </div>
      }
      subtitle={
        activeTemplate
          ? 'Modify process steps, titles, and details'
          : 'Define a reusable step-by-step process flow'
      }
    >
      {({ close }) => (
        <WorkflowForm
          key={activeTemplate?.id || 'new'}
          onSubmit={(formData) => onSubmit?.(formData, activeTemplate)}
          onCancel={() => close()}
          isLoading={isLoading}
          initialData={activeTemplate}
        />
      )}
    </BaseModal>
  );
});

WorkflowModal.displayName = 'WorkflowModal';

export default WorkflowModal;
