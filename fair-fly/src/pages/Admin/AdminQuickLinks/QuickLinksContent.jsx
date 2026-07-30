import React, { useState } from 'react';
import './admin-quick-links.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import QuickLinkForm from '../../../components/AdminComponents/Modals/QuickLinkForm';
import ConfirmationModal from '../../../components/AdminComponents/Modals/ConfirmationModal';
import { useAuthContext } from '../../../context/AuthContext';
import ApiCaller from '../../../utils/ApiCaller';
import { useToast } from '../../../components/toast/ToastProvider';
import { API_BASE_URL } from '../../../utils/config';
import { useAdminContext } from '../../../context/AdminContext';

export default function QuickLinksContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null); // null = add, object = edit
  const { data: AdminData, loading: isAdminDataLoading } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // Delete Confirmation Modal state
  const [deleteLinkTarget, setDeleteLinkTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Icons for Modal
  const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

  const handleOpenAddModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  // Switch submit routing based on mode
  const handleFormSubmit = (formData) => {
    if (editingLink) {
      handleEditLinkSubmit(formData);
    } else {
      handleAddLinkSubmit(formData);
    }
  };

  // POST Request (Add)
  const handleAddLinkSubmit = (newLinkData) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks`,
      'POST',
      newLinkData,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        handleCloseModal();
        addToast('Quick link added successfully', 'success');
      },
      (error) => {
        addToast(`Failed to add quick link: ${error.message}`, 'error');
        console.error('Error adding quick link:', error);
      },
      setIsLoading
    );
  };

  // PATCH Request (Edit)
  const handleEditLinkSubmit = (updatedLinkData) => {
    const linkId = editingLink.id || editingLink._id;
    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${linkId}`,
      'PATCH',
      updatedLinkData,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        handleCloseModal();
        addToast('Quick link updated successfully', 'success');
      },
      (error) => {
        addToast(`Failed to update quick link: ${error.message}`, 'error');
        console.error('Error updating quick link:', error);
      },
      setIsLoading
    );
  };

  // DELETE Request
  const handleDeleteConfirm = () => {
    if (!deleteLinkTarget) return;
    const linkId = deleteLinkTarget.id || deleteLinkTarget._id;

    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${linkId}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        setDeleteLinkTarget(null);
        addToast('Quick link deleted successfully', 'success');
      },
      (error) => {
        addToast(`Failed to delete quick link: ${error.message}`, 'error');
        console.error('Error deleting quick link:', error);
      },
      setIsDeleting
    );
  };

  return (
    <div className="card quicklinks-page">
      {/* Header */}
      <div className="quicklinks-header">
        <div>
          <h2>Quick Links for Operators</h2>
          <p>Manage website links that operators can access</p>
        </div>

        <button className="quicklinks-btn" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-plus"></i>
          Add Link
        </button>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Website Title</th>
            <th>URL</th>
            <th>Category</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isAdminDataLoading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                Loading quick links...
              </td>
            </tr>
          ) : !AdminData || AdminData.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                No quick links available.
              </td>
            </tr>
          ) : (
            AdminData.map((link) => (
              <tr key={link.id || link._id}>
                <td>{link.title}</td>
                <td>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quicklink-url"
                  >
                    <span>{link.url}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                </td>
                <td>
                  <span className="quicklink-badge">
                    {link.category || 'Government'}
                  </span>
                </td>
                <td className="actions-col">
                  <button
                    className="icon-btn edit"
                    title="Edit"
                    onClick={() => handleOpenEditModal(link)}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete"
                    onClick={() => setDeleteLinkTarget(link)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add / Edit Modal Wrapper */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i
              className={`fa-solid ${
                editingLink ? 'fa-pen-to-square' : 'fa-plus'
              }`}
              style={{ color: '#5b63ff' }}
            ></i>
            <span>{editingLink ? 'Edit Quick Link' : 'Add Quick Link'}</span>
          </div>
        }
        subtitle={
          editingLink
            ? 'Update the details for this website link'
            : 'Add a new website link for operators'
        }
      >
        <QuickLinkForm
          key={editingLink ? editingLink.id || editingLink._id : 'new'}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          initialData={editingLink}
        />
      </ModalWrapper>

      {/* Delete Confirmation Modal */}
      {deleteLinkTarget && (
        <ConfirmationModal
          isOpen={Boolean(deleteLinkTarget)}
          onClose={() => setDeleteLinkTarget(null)}
          Icon={TrashIcon}
          Title="Delete quick link?"
          Desc={`"${deleteLinkTarget?.title}" will be permanently removed.`}
          BtnColor="#ef4444"
          confirmText="Delete"
          isLoading={isDeleting}
          OnConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}