import React, { useState, useMemo } from 'react';
import './admin-quick-links.css';
import ModalWrapper from '../../../components/Admin/Modals/ModalWrapper';
import QuickLinkForm from '../../../components/Admin/Modals/QuickLinkForm';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import { useAuthContext } from '../../../context/AuthContext';
import ApiCaller from '../../../utils/ApiCaller';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { API_BASE_URL } from '../../../utils/config';
import { useAdminContext } from '../../../context/AdminContext';

export default function QuickLinksContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const { data: quickLinks, loading: isQuickLinksLoading } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [deleteLinkTarget, setDeleteLinkTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const quickLinksList = useMemo(() => {
    return Array.isArray(quickLinks) ? quickLinks : [];
  }, [quickLinks]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return quickLinksList.filter((link) => {
      const matchesSearch =
        (link.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.url || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        (link.category || '').toLowerCase().replace(/\s+/g, '') ===
          categoryFilter.toLowerCase().replace(/\s+/g, '');

      return matchesSearch && matchesCategory;
    });
  }, [quickLinksList, searchTerm, categoryFilter]);

  // Paginated slice
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLinks.slice(start, start + pageSize);
  }, [filteredLinks, currentPage, pageSize]);

  const handleFormSubmit = (formData) => {
    if (editingLink) {
      handleEditLinkSubmit(formData);
    } else {
      handleAddLinkSubmit(formData);
    }
  };

  const handleAddLinkSubmit = (newLinkData) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks`,
      'POST',
      newLinkData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        handleCloseModal();
        addToast('Quick link added successfully', 'success');
      },
      (error) => {
        addToast(`Failed to add quick link: ${error.message}`, 'error');
      },
      setIsLoading
    );
  };

  const handleEditLinkSubmit = (updatedLinkData) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${editingLink.id}`,
      'PATCH',
      updatedLinkData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        handleCloseModal();
        addToast('Quick link updated successfully', 'success');
      },
      (error) => {
        addToast(`Failed to update quick link: ${error.message}`, 'error');
      },
      setIsLoading
    );
  };

  const handleDeleteLink = (linkId) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/quicklinks/${linkId}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quick link deleted successfully', 'success');
        setDeleteLinkTarget(null);
      },
      (error) => {
        addToast(`Failed to delete quick link: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  if (isQuickLinksLoading) {
    return (
      <div className="card quicklinks-page page-fade-in">
        <div className="quicklinks-header">
          <div>
            <h2>Quick Links Management</h2>
            <p>Loading quick links...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card quicklinks-page page-fade-in">
      <div className="quicklinks-header">
        <div>
          <h2>Quick Links Management</h2>
          <p>Manage external resource portals and shortcuts for operators</p>
        </div>

        <button className="quicklinks-btn" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-plus"></i>
          Add Quick Link
        </button>
      </div>

      {/* Toolbar Search & Category Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search by title or URL..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('all');
              setCurrentPage(1);
            }}
          >
            All ({quickLinksList.length})
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'airlines' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('airlines');
              setCurrentPage(1);
            }}
          >
            Airlines
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'hotels' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('hotels');
              setCurrentPage(1);
            }}
          >
            Hotels
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'government' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('government');
              setCurrentPage(1);
            }}
          >
            Government
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Title</th>
              <th>Link URL</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLinks.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  <i className="fa-solid fa-link-slash empty-icon"></i>
                  <p>No quick links match your search</p>
                </td>
              </tr>
            ) : (
              paginatedLinks.map((link) => {
                const categoryClass = `category-${(link.category || 'other')
                  .toLowerCase()
                  .replace(/\s+/g, '')}`;

                return (
                  <tr key={link.id}>
                    <td>
                      <span className={`quicklink-badge ${categoryClass}`}>
                        {link.category || 'Other'}
                      </span>
                    </td>
                    <td>
                      <strong>{link.title}</strong>
                    </td>
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
                    <td className="actions-col">
                      <button
                        className="icon-btn edit"
                        title="Edit Quick Link"
                        onClick={() => handleOpenEditModal(link)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete Quick Link"
                        onClick={() => setDeleteLinkTarget(link)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredLinks.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i
              className={`fa-solid ${editingLink ? 'fa-pen-to-square' : 'fa-plus'}`}
              style={{ color: 'var(--purple)' }}
            ></i>
            <span>{editingLink ? 'Edit Quick Link' : 'Add Quick Link'}</span>
          </div>
        }
        subtitle={
          editingLink
            ? 'Update the title, category, or URL of this link'
            : 'Add a new shortcut link for operators'
        }
      >
        <QuickLinkForm
          key={editingLink?.id || 'new'}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          initialData={editingLink}
        />
      </ModalWrapper>

      <ConfirmationModal
        isOpen={!!deleteLinkTarget}
        onClose={() => setDeleteLinkTarget(null)}
        Icon={TrashIcon}
        Title="Delete this quick link?"
        Desc={`"${deleteLinkTarget?.title}" will be removed from quick links.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isDeleting}
        OnConfirm={() => handleDeleteLink(deleteLinkTarget.id)}
      />
    </div>
  );
}