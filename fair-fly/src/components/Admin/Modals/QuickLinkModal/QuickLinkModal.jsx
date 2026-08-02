import React, { useState, forwardRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import QuickLinkForm from './QuickLinkForm';

const QuickLinkModal = forwardRef(({ isOpen, onClose, editingLink: propEditingLink, onSubmit, isLoading }, ref) => {
  const [internalLink, setInternalLink] = useState(null);

  const activeLink = propEditingLink !== undefined ? propEditingLink : internalLink;

  return (
    <BaseModal
      ref={ref}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={() => {
        setInternalLink(null);
        if (onClose) onClose();
      }}
      onOpen={(link) => setInternalLink(link || null)}
      maxWidth="480px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i
            className={`fa-solid ${activeLink ? 'fa-pen-to-square' : 'fa-plus'}`}
            style={{ color: 'var(--purple)' }}
          />
          <span>{activeLink ? 'Edit Quick Link' : 'Add Quick Link'}</span>
        </div>
      }
      subtitle={
        activeLink
          ? 'Update external portal link details'
          : 'Add a quick reference link for operators'
      }
    >
      <QuickLinkForm
        key={activeLink?.id || 'new'}
        onSubmit={(formData) => onSubmit?.(formData, activeLink)}
        isLoading={isLoading}
        initialData={activeLink}
      />
    </BaseModal>
  );
});

QuickLinkModal.displayName = 'QuickLinkModal';

export default QuickLinkModal;
