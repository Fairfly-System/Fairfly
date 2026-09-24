import React from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './valid-id-info-modal.css';

export const ACCEPTED_ID_TYPES = [
  { value: 'Philippine Passport', label: 'Philippine Passport (DFA)' },
  { value: 'PhilSys National ID', label: 'PhilSys National ID / ePhilID' },
  { value: "Driver's License", label: "Driver's License (LTO)" },
  { value: 'UMID', label: 'UMID / SSS ID / GSIS eCard' },
  { value: 'PRC ID', label: 'PRC Professional License' },
  { value: 'Postal ID', label: 'Postal ID (Digitized)' },
  { value: "Voter's ID", label: "Voter's ID / COMELEC Certification" },
  { value: 'Senior Citizen / PWD ID', label: 'Senior Citizen / PWD ID' },
  { value: 'Other Government ID', label: 'Other Government-Issued ID' }
];

export default function ValidIdInfoModal({ isOpen, onClose }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="42rem"
      className="valid-id-modal-container"
    >
      <div className="valid-id-modal">
        {/* Header */}
        <div className="valid-id-modal-header">
          <div className="valid-id-modal-icon-badge">
            <i className="fa-solid fa-id-card"></i>
          </div>
          <div>
            <h2 className="valid-id-modal-title">Accepted Government IDs</h2>
            <p className="valid-id-modal-subtitle">
              FairFly requires valid government-issued identification to prevent automated bots and protect traveler security.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="valid-id-modal-body">
          {/* Section: Accepted IDs Grid */}
          <div className="valid-id-section">
            <h3 className="valid-id-section-title">
              <i className="fa-solid fa-circle-check text-success"></i> Recognized Philippine IDs
            </h3>
            <div className="valid-id-list-grid">
              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-passport"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>Philippine Passport</strong>
                  <span>Issued by the DFA (must be unexpired)</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-address-card"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>PhilSys National ID</strong>
                  <span>Physical card or printed ePhilID with QR code</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-id-badge"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>Driver's License</strong>
                  <span>Issued by LTO (plastic card or official digital ID)</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>UMID / SSS / GSIS Card</strong>
                  <span>Unified Multi-Purpose ID or digitized member card</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-user-graduate"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>PRC License ID</strong>
                  <span>Professional Regulation Commission card</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-envelope-open-text"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>Postal ID (Digitized)</strong>
                  <span>PhilPost issued biometric ID card</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-check-to-slot"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>Voter's ID / Certification</strong>
                  <span>COMELEC issued voter card or dry-sealed certificate</span>
                </div>
              </div>

              <div className="valid-id-card-item">
                <div className="valid-id-card-icon">
                  <i className="fa-solid fa-wheelchair"></i>
                </div>
                <div className="valid-id-card-text">
                  <strong>Senior Citizen / PWD ID</strong>
                  <span>City or Municipal Social Welfare office issued</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Upload Guidelines */}
          <div className="valid-id-guidelines">
            <h3 className="valid-id-section-title">
              <i className="fa-solid fa-camera text-purple"></i> ID Submission Guidelines
            </h3>
            <div className="valid-id-rules-grid">
              <div className="valid-id-rule-item do">
                <i className="fa-solid fa-circle-check"></i>
                <div>
                  <strong>Upload Both Sides</strong>
                  <span>You must provide clear photos of both the <strong>Front</strong> and <strong>Back</strong> of the ID.</span>
                </div>
              </div>
              <div className="valid-id-rule-item do">
                <i className="fa-solid fa-circle-check"></i>
                <div>
                  <strong>Clear &amp; Legible</strong>
                  <span>Ensure your name, date of birth, photo, and ID number are clearly visible and unblurred.</span>
                </div>
              </div>
              <div className="valid-id-rule-item dont">
                <i className="fa-solid fa-circle-xmark"></i>
                <div>
                  <strong>No Glare or Reflections</strong>
                  <span>Avoid flash reflections directly over text or facial features.</span>
                </div>
              </div>
              <div className="valid-id-rule-item dont">
                <i className="fa-solid fa-circle-xmark"></i>
                <div>
                  <strong>No Expired Documents</strong>
                  <span>IDs that are expired or cut off at the borders cannot be approved.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="valid-id-modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
