import React, { forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import ClientEditForm from './ClientEditForm';

const ClientEditModal = forwardRef(({ isOpen, onClose, editingClient, onSubmit, isLoading }, ref) => {
  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={onClose}
      maxWidth="44rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className="fa-solid fa-user-pen"
            style={{ color: 'var(--purple)' }}
          />
          <span>Edit Client Details</span>
        </div>
      }
      subtitle="Update client contact details, address, and account activation status"
    >
      <ClientEditForm
        key={editingClient?.id || 'edit-client'}
        onSubmit={onSubmit}
        isLoading={isLoading}
        initialData={editingClient}
      />
    </BaseModal>
  );
});

ClientEditModal.displayName = 'ClientEditModal';

export default ClientEditModal;
