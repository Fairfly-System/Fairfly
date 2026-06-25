import React, { useState } from 'react'; // Added useState
import './admin-quick-links.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import QuickLinkForm from '../../../components/AdminComponents/Modals/QuickLinkForm';

export default function AdminQuickLinks() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddLinkSubmit = (newLinkData) => {
    console.log('New Link Data:', newLinkData);
    // Handle API processing here
    setIsModalOpen(false);
  };

  return (
    <div className="card quicklinks-page">
      <div className="quicklinks-header">
        <div className="quicklinks-heading">
          <i className="fa-solid fa-link"></i>
          <div>
            <h2>Quick Links for Operators</h2>
            <p>Manage website links that operators can access</p>
          </div>
        </div>

        {/* Trigger button */}
        <button className="quicklinks-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fa-solid fa-plus"></i>
          Add Link
        </button>
      </div>

      {/* Render the Quick Link Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Quick Link"
        subtitle="Add a new website link for operators"
      >
        <QuickLinkForm onSubmit={handleAddLinkSubmit} />
      </ModalWrapper>
    </div>
  );
}