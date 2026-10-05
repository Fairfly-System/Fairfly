import React, { useState, forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import OperatorForm from './OperatorForm';

const OperatorModal = forwardRef(({ isOpen, onClose, editingOperator: propEditingOperator, onSubmit, isLoading }, ref) => {
  const [internalOperator, setInternalOperator] = useState(null);

  const activeOperator = propEditingOperator !== undefined ? propEditingOperator : internalOperator;

  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={() => {
        setInternalOperator(null);
        if (onClose) onClose();
      }}
      onOpen={(op) => setInternalOperator(op || null)}
      maxWidth="68rem"
      width="95%"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className={`fa-solid ${activeOperator?.id ? 'fa-pen-to-square' : 'fa-user-plus'}`}
            style={{ color: 'var(--purple)' }}
          />
          <span>{activeOperator?.id ? 'Edit Operator Account' : 'Create Operator Account'}</span>
        </div>
      }
      subtitle={
        activeOperator?.id
          ? 'Update operator branch details and information'
          : 'Add a new operator branch to the system'
      }
    >
      <OperatorForm
        key={activeOperator?.id || 'new'}
        onSubmit={(formData) => onSubmit?.(formData, activeOperator)}
        isLoading={isLoading}
        initialData={activeOperator}
      />
    </BaseModal>
  );
});

OperatorModal.displayName = 'OperatorModal';

export default OperatorModal;
