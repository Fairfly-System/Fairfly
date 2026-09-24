import React from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

export default function ConfirmationModal({
  isOpen,
  onClose,
  Icon,
  icon,
  Title,
  title,
  Desc,
  desc,
  message,
  BtnColor = 'var(--purple)',
  OnConfirm,
  onConfirm,
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  cancelLabel,
  isLoading = false,
  isDanger: explicitDanger = false,
}) {
  const displayTitle = title || Title;
  const displayDesc = message || desc || Desc;
  const handleAction = onConfirm || OnConfirm;
  const finalConfirmText = confirmLabel || confirmText;
  const finalCancelText = cancelLabel || cancelText;
  const ActiveIcon = icon || Icon;

  const handleConfirm = async () => {
    if (handleAction) {
      await handleAction();
    }
  };

  const isDanger = explicitDanger || (typeof BtnColor === 'string' && (BtnColor.includes('red') || BtnColor.includes('error')));

  const renderIcon = () => {
    if (!ActiveIcon) return null;
    if (typeof ActiveIcon === 'string') {
      return <i className={ActiveIcon} style={{ color: isDanger ? 'var(--red)' : BtnColor, fontSize: '1.375rem' }} />;
    }
    const IconComponent = ActiveIcon;
    return <IconComponent style={{ color: isDanger ? 'var(--red)' : BtnColor, fontSize: '1.375rem' }} />;
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="26.25rem" width="100%" isLoading={isLoading}>
      <div className="modalForm" style={{ textAlign: 'center', alignItems: 'center' }}>
        {ActiveIcon && (
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              backgroundColor: isDanger ? 'var(--orange-glow)' : 'var(--purple-light-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem',
            }}
          >
            {renderIcon()}
          </div>
        )}

        {displayTitle && (
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            {displayTitle}
          </h3>
        )}

        {displayDesc && (
          <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-mid)' }}>
            {displayDesc}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1, margin: 0, justifyContent: 'center' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              backgroundColor: !isDanger ? BtnColor : undefined,
              flex: 1,
              margin: 0,
              justifyContent: 'center',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
