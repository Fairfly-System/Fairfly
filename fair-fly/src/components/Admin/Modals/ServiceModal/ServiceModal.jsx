import React, { useState, forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import ServiceForm from './ServiceForm';

const ServiceModal = forwardRef(({ isOpen, onClose, editingService: propEditingService, onSubmit, isLoading }, ref) => {
  const [internalService, setInternalService] = useState(null);

  const activeService = propEditingService !== undefined ? propEditingService : internalService;

  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      onClose={() => {
        setInternalService(null);
        if (onClose) onClose();
      }}
      onOpen={(service) => setInternalService(service || null)}
      maxWidth="480px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className={`fa-solid ${activeService ? 'fa-pen-to-square' : 'fa-plus'}`}
            style={{ color: 'var(--purple)' }}
          />
          <span>{activeService ? 'Edit Service' : 'Create New Service'}</span>
        </div>
      }
      subtitle={
        activeService
          ? 'Update service details, requirements, and attached workflows'
          : 'Add a new service to the catalog'
      }
    >
      <ServiceForm
        key={activeService?.id || 'new'}
        onSubmit={(formData) => onSubmit?.(formData, activeService)}
        isLoading={isLoading}
        initialData={activeService}
      />
    </BaseModal>
  );
});

ServiceModal.displayName = 'ServiceModal';

export default ServiceModal;
