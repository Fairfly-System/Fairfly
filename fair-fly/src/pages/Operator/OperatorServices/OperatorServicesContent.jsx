import React, { useState, useMemo, useRef } from 'react';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ServiceModal from '../../../components/Admin/Modals/ServiceModal/ServiceModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import QualificationApplicationModal from '../../../components/Operator/QualificationApplicationModal/QualificationApplicationModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-services.css';

const UNIT_LABELS = {
  days: 'Day/s',
  weeks: 'Week/s',
  months: 'Month/s',
};

function formatProcessingTime(processingTime) {
  if (!processingTime || typeof processingTime !== 'object') {
    return processingTime || '';
  }
  const { min, max, unit } = processingTime;
  const label = UNIT_LABELS[unit] || unit;
  if (!min && !max) return '';
  if (min === max || !max) return `${min} ${label}`;
  return `${min}-${max} ${label}`;
}

export default function OperatorServicesContent() {
  const { data: allServices, loading: serviceLoading } = useAdminContext();
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isQualified = Boolean(userDetails?.isQualified);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const modalRef = useRef(null);

  // Filter services to only own branch services
  const myServices = useMemo(() => {
    if (!allServices || !user) return [];
    return allServices.filter(
      (s) => s.createdByOperatorId === user.uid || s.branchUid === user.uid
    );
  }, [allServices, user]);

  const filteredServices = useMemo(() => {
    return myServices.filter((item) => {
      const term = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (Array.isArray(item.tags) && item.tags.some((t) => String(t).toLowerCase().includes(term)));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status === 'Active') ||
        (statusFilter === 'disabled' && item.status === 'Disabled');

      return matchesSearch && matchesStatus;
    });
  }, [myServices, debouncedSearch, statusFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  const totalServices = myServices.length;
  const activeCount = myServices.filter((s) => s.status === 'Active').length;
  const inactiveCount = totalServices - activeCount;
  const categoriesCount = new Set(myServices.map((s) => s.category).filter(Boolean)).size;

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (srv) => {
    setEditingService(srv);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const processPendingFiles = async (serviceData) => {
    if (!serviceData) return serviceData;
    let coverImageUrl = serviceData.coverImage || '';

    if (serviceData.pendingCoverFile) {
      const { url: uploadedCoverUrl } = await uploadFileToBackend(
        serviceData.pendingCoverFile,
        'service_covers',
        userToken
      );
      coverImageUrl = uploadedCoverUrl;
    }

    let updatedCarousel = Array.isArray(serviceData.carouselImages)
      ? serviceData.carouselImages
      : [];

    if (updatedCarousel.length > 0) {
      updatedCarousel = await Promise.all(
        updatedCarousel.map(async (img) => {
          if (img && img.pendingFile) {
            const { url: carouselUrl } = await uploadFileToBackend(
              img.pendingFile,
              'service_carousel',
              userToken
            );
            return carouselUrl;
          }
          return typeof img === 'string' ? img : img?.url || '';
        })
      );
    }

    let updatedRequirements = serviceData.requirements || [];
    if (Array.isArray(serviceData.requirements)) {
      updatedRequirements = await Promise.all(
        serviceData.requirements.map(async (req) => {
          if (req.attachment && req.attachment.pendingFile) {
            const file = req.attachment.pendingFile;
            const { url: downloadUrl } = await uploadFileToBackend(file, 'service_requirements', userToken);
            const { pendingFile, ...restAttachment } = req.attachment;
            return {
              ...req,
              attachment: {
                ...restAttachment,
                url: downloadUrl,
              },
            };
          }
          return req;
        })
      );
    }

    const { pendingCoverFile, ...cleanedData } = serviceData;
    return {
      ...cleanedData,
      coverImage: coverImageUrl,
      coverPhoto: coverImageUrl,
      coverPhotoUrl: coverImageUrl,
      carouselImages: updatedCarousel.filter(Boolean),
      requirements: updatedRequirements,
      isBranchExclusive: true,
      branchUid: user.uid,
      branchName: userDetails?.branchName || userDetails?.name || 'Branch Operator'
    };
  };

  const handleFormSubmit = async (formData, activeService) => {
    setIsSubmitting(true);
    try {
      const processedData = await processPendingFiles(formData);

      if (activeService) {
        // Edit service
        ApiCaller(
          `${API_BASE_URL}/api/services/${activeService.id}`,
          'PATCH',
          processedData,
          { Authorization: `Bearer ${userToken}` },
          () => {
            addToast(`Branch service "${processedData.name}" updated successfully!`, 'success');
            handleCloseModal();
            setIsSubmitting(false);
          },
          (error) => {
            addToast(toFriendlyMessage(error, 'Failed to update branch service.'), 'error');
            setIsSubmitting(false);
          }
        );
      } else {
        // Create service
        ApiCaller(
          `${API_BASE_URL}/api/services`,
          'POST',
          processedData,
          { Authorization: `Bearer ${userToken}` },
          () => {
            addToast(`🎉 Branch service "${processedData.name}" created and published!`, 'success');
            handleCloseModal();
            setIsSubmitting(false);
          },
          (error) => {
            addToast(toFriendlyMessage(error, 'Failed to create branch service.'), 'error');
            setIsSubmitting(false);
          }
        );
      }
    } catch (err) {
      console.error('Error in service submission:', err);
      addToast('An error occurred during file upload. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/${serviceId}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Branch service deleted successfully!', 'success');
        setConfirmState(null);
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to delete service.'), 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleDeactivateService = async (serviceItem) => {
    const newStatus = serviceItem.status === 'Active' ? 'Disabled' : 'Active';
    ApiCaller(
      `${API_BASE_URL}/api/services/${serviceItem.id}`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Service ${newStatus === 'Active' ? 'activated' : 'disabled'} successfully!`, 'success');
        setConfirmState(null);
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update service status.'), 'error');
      },
      setIsConfirmLoading
    );
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Service Details',
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '3.25rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-block';
                    }
                  }}
                />
              ) : null}
              <i
                className="fa-regular fa-image"
                style={{
                  color: 'var(--text-light)',
                  fontSize: '1rem',
                  display: item.coverImage ? 'none' : 'inline-block',
                }}
              ></i>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <strong style={{ color: 'var(--text-dark)' }}>{item.name || 'N/A'}</strong>
                <span
                  style={{
                    background: 'var(--purple-soft, #ede9fe)',
                    color: 'var(--purple, #7c3aed)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: '1px solid #ddd6fe'
                  }}
                >
                  <i className="fa-solid fa-store" style={{ fontSize: '0.625rem' }}></i> Branch Exclusive
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600 }}>
                  {item.category || 'General Services'}
                </span>
                {Array.isArray(item.tags) && item.tags.slice(0, 2).map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-mid)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'requirements',
        header: 'Requirements',
        render: (item) => {
          const count = Array.isArray(item.requirements) ? item.requirements.length : 0;
          return (
            <span className="status-pill status-active" style={{ fontSize: '0.75rem' }}>
              {count} Requirement{count !== 1 ? 's' : ''}
            </span>
          );
        },
      },
      {
        key: 'processingTime',
        header: 'Turnaround',
        render: (item) => formatProcessingTime(item.processingTime) || 'N/A',
      },
      {
        key: 'price',
        header: 'Fee',
        render: (item) => item.price || 'N/A',
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <span
            className={`status-pill ${
              item.status === 'Active' ? 'status-pill-active' : 'status-pill-disabled'
            }`}
          >
            {item.status || 'Active'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
            <button
              type="button"
              className="icon-btn edit"
              title="Edit Service"
              onClick={() => handleOpenEditModal(item)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              className={`icon-btn ${item.status === 'Active' ? 'ban' : 'check'}`}
              title={item.status === 'Active' ? 'Disable Service' : 'Activate Service'}
              onClick={() => setConfirmState({ type: 'deactivate', service: item })}
            >
              <i className={`fa-solid ${item.status === 'Active' ? 'fa-ban' : 'fa-circle-check'}`}></i>
            </button>
            <button
              type="button"
              className="icon-btn delete"
              title="Delete Service"
              onClick={() => setConfirmState({ type: 'delete', service: item })}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'My Branch Services' },
  ];

  if (serviceLoading) {
    return (
      <div className="card operator-services-page page-fade-in">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--purple)' }}></i>
          <p>Loading your branch services catalog...</p>
        </div>
      </div>
    );
  }

  // If operator is not qualified yet, display an elegant CTA prompt
  if (!isQualified) {
    return (
      <main className="operator-services-page page-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader
          title="Branch Services Management"
          subtitle="Publish and manage custom travel, document, and ticketing services for your branch"
        />

        <section className="card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '42rem', margin: '2rem auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: 'var(--purple-soft, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)', fontSize: '2rem' }}>
            <i className="fa-solid fa-certificate"></i>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
            Qualified Operator Access Required
          </h2>

          <p style={{ color: 'var(--text-mid)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Creating custom branch-exclusive services is a privilege for verified and qualified operators. Apply today to publish unique packages, set your own pricing, and receive client bookings directly at your branch location.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowApplyModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--purple)', padding: '0.75rem 1.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
          >
            <i className="fa-solid fa-paper-plane"></i> Apply for Qualification
          </button>
        </section>

        <QualificationApplicationModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
        />
      </main>
    );
  }

  return (
    <main className="operator-services-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Branch Services Management"
        subtitle={`Custom travel and processing services exclusive to ${userDetails?.branchName || 'your branch'}`}
        primaryAction={{
          label: 'Create Branch Service',
          icon: 'fa-solid fa-plus',
          onClick: handleOpenAddModal,
        }}
      />

      <section className="services-summary-grid">
        <KpiCard
          title="Branch Services"
          value={totalServices}
          icon="fa-solid fa-layer-group"
          iconColor="var(--purple)"
        />
        <KpiCard
          title="Active"
          value={activeCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
        />
        <KpiCard
          title="Disabled"
          value={inactiveCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
        />
        <KpiCard
          title="Categories"
          value={categoriesCount}
          icon="fa-solid fa-tags"
          iconColor="#f0653e"
        />
      </section>

      <section className="card operator-services-table-card">
        <AlertBar
          message={`You are a Qualified Operator. Services created here are automatically published to the Client Marketplace and locked to ${userDetails?.branchName || 'your branch'}.`}
          type="success"
        />

        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search your branch services..."
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

          <FilterChipGroup
            chips={[
              { value: 'all', label: `All (${totalServices})` },
              { value: 'active', label: `Active (${activeCount})` },
              { value: 'disabled', label: `Disabled (${inactiveCount})` },
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        <DataTable
          columns={columns}
          data={paginatedServices}
          emptyState={{
            icon: 'fa-solid fa-concierge-bell',
            message: 'No branch services match your criteria. Click "Create Branch Service" to add one.',
          }}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={filteredServices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Service Modal */}
      <ServiceModal
        ref={modalRef}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingService={editingService}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modal */}
      {confirmState && (
        <ConfirmationModal
          isOpen={Boolean(confirmState)}
          onClose={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState.type === 'delete') {
              handleDeleteService(confirmState.service.id);
            } else if (confirmState.type === 'deactivate') {
              handleDeactivateService(confirmState.service);
            }
          }}
          isLoading={isConfirmLoading}
          type={confirmState.type === 'delete' ? 'danger' : 'warning'}
          title={confirmState.type === 'delete' ? 'Delete Service' : 'Toggle Service Status'}
          message={
            confirmState.type === 'delete'
              ? `Are you sure you want to delete "${confirmState.service?.name}"? This action cannot be undone.`
              : `Are you sure you want to ${confirmState.service?.status === 'Active' ? 'disable' : 'activate'} "${confirmState.service?.name}"?`
          }
        />
      )}
    </main>
  );
}
