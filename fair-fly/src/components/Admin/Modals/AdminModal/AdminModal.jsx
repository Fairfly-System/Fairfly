import React, { forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import AdminForm from './AdminForm';

const AdminModal = forwardRef(({ isOpen, onClose, editingAdmin, onSubmit, isLoading }, ref) => {
  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={onClose}
      maxWidth="48rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className={`fa-solid ${editingAdmin ? 'fa-pen-to-square' : 'fa-user-shield'}`}
            style={{ color: 'var(--purple)' }}
          />
          <span>{editingAdmin ? 'Edit Administrator Details' : 'Create New Administrator'}</span>
        </div>
      }
      subtitle={
        editingAdmin
          ? 'Update administrator contact details and account status'
          : 'Add a new support administrator to assist franchise branches'
      }
    >
      <AdminForm
        key={editingAdmin?.id || 'new'}
        onSubmit={onSubmit}
        isLoading={isLoading}
        initialData={editingAdmin}
      />
    </BaseModal>
  );
});

AdminModal.displayName = 'AdminModal';

export default AdminModal;
