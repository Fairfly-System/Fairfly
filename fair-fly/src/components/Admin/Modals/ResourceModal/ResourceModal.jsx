import React, { forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import ResourceForm from './ResourceForm';

const ResourceModal = forwardRef(function ResourceModal(
  { onSubmit, isLoading, initialData },
  ref
) {
  const handleCancel = () => {
    ref.current?.closeModal();
  };

  const isEdit = Boolean(initialData);

  return (
    <BaseModal
      ref={ref}
      title={isEdit ? 'Edit Resource Material' : 'Upload Resource Material'}
      maxWidth="38rem"
    >
      <ResourceForm
        onSubmit={async (data) => {
          await onSubmit(data);
          ref.current?.closeModal();
        }}
        isLoading={isLoading}
        initialData={initialData}
        onCancel={handleCancel}
      />
    </BaseModal>
  );
});

export default ResourceModal;
