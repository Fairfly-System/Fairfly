import React, { useState, useEffect } from 'react'; // Added useState
import './admin-quick-links.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import QuickLinkForm from '../../../components/AdminComponents/Modals/QuickLinkForm';
import { useAuthContext } from '../../../context/AuthContext';
import ApiCaller from '../../../utils/ApiCaller';
import { useToast } from '../../../components/toast/ToastProvider';
import { useAdminContext } from '../../../context/AdminContext';

export default function QuickLinksContent() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: AdminData, loading: isAdminDataLoading } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false); // State to indicate if the API call is loading
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const handleInsertLink = (newLinkData) => {
    ApiCaller('http://localhost:5001/api/services/quicklinks', 
      'POST',
      newLinkData,
      { 'Authorization': `Bearer ${userToken}` },
      (data) => {
        setIsModalOpen(false); // Close the modal on success
        addToast('Quick link added successfully', `success`);
        console.log('Quick link added successfully:', data);
      },
      (error) => {
        setIsModalOpen(false); // Close the modal on error
        addToast(`Failed to add quick link: ${error.message}`, `error`);
        console.error('Error adding quick link:', error);
      },
      setIsLoading
    );
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

        <div className="quicklinks-list">
          {isAdminDataLoading ? (
            <p>Loading quick links...</p>
          ) : AdminData && AdminData.length === 0 ? (
            <p>No quick links available.</p>
          ) : (
            <ul>
              {AdminData.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Render the Quick Link Modal */}
        <ModalWrapper
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Quick Link"
          subtitle="Add a new website link for operators"
        >
          <QuickLinkForm onSubmit={handleInsertLink} isLoading={isLoading} />
        </ModalWrapper>
      </div>
  );
}