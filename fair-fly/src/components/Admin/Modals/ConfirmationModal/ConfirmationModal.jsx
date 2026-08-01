import React from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

export default function ConfirmationModal({
  isOpen,
  onClose,
  Icon,
  Title,
  Desc,
  BtnColor = '#5865f2',
  OnConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}) {
  
  const handleConfirm = async () => {
    if (OnConfirm) {
      await OnConfirm();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <div className="modalForm" style={{ textAlign: 'center', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: `${BtnColor}1a`, // ~10% opacity tint of BtnColor
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
            }}
          >
            <Icon style={{ color: BtnColor, fontSize: '22px' }} />
          </div>
        )}

        {Title && (
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            {Title}
          </h3>
        )}

        {Desc && (
          <p style={{ margin: '4px 0 8px', fontSize: '14px', color: '#6b7280' }}>
            {Desc}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
          <button
            type="button"
            className="modalSubmitBtn"
            onClick={onClose}
            disabled={isLoading}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              flex: 1,
              margin: 0,
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="modalSubmitBtn"
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              backgroundColor: BtnColor,
              color: '#ffffff',
              flex: 1,
              margin: 0,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
