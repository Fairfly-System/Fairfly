import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router';
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
import { useFirestorePagination } from '../../../hooks/useFirestorePagination';
import { collection, query, where, or, getCountFromServer } from 'firebase/firestore';
import { firestore } from '../../../firebase';
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
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isQualified = Boolean(userDetails?.isQualified);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'standard' | 'my_branch'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'disabled'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const modalRef = useRef(null);

  // Server-side KPI Metrics
  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    standard: 0,
    myBranch: 0,
    active: 0,
    loading: true,
  });

  const loadKpis = useCallback(async () => {
    try {
      const colRef = collection(firestore, 'services');
      const queries = [
        getCountFromServer(colRef),
        getCountFromServer(query(colRef, where('isBranchExclusive', '==', false))),
        getCountFromServer(query(colRef, where('status', 'in', ['Active', 'active']))),
      ];
      if (user?.uid) {
        queries.push(
          getCountFromServer(
            query(
              colRef,
              or(where('createdByOperatorId', '==', user.uid), where('branchUid', '==', user.uid))
            )
          )
        );
      }
      const [totalSnap, stdSnap, actSnap, branchSnap] = await Promise.all(queries);
      setKpiCounts({
        total: totalSnap.data().count,
        standard: stdSnap.data().count,
        active: actSnap.data().count,
        myBranch: branchSnap ? branchSnap.data().count : 0,
        loading: false,
      });
    } catch (err) {
      console.warn('Operator services count aggregation notice:', err.message);
      setKpiCounts((prev) => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  // Construct query-level constraints
  const queryFilters = useMemo(() => {
    const list = [];
    if (scopeFilter === 'standard') {
      list.push(where('isBranchExclusive', '==', false));
    } else if (scopeFilter === 'my_branch' && user?.uid) {
      list.push(or(where('createdByOperatorId', '==', user.uid), where('branchUid', '==', user.uid)));
    }
    if (statusFilter !== 'all') {
      list.push(where('status', 'in', [
        statusFilter === 'active' ? 'Active' : 'Disabled',
        statusFilter
      ]));
    }
    return list;
  }, [scopeFilter, statusFilter, user]);

  // Client search filter function for multi-field bounded search
  const searchFilterFn = useCallback(
    (item) => {
      const term = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (Array.isArray(item.tags) && item.tags.some((t) => String(t).toLowerCase().includes(term)));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (item.status === 'Active' || item.status === 'active')) ||
        (statusFilter === 'disabled' && (item.status === 'Disabled' || item.status === 'disabled'));

      const isMyBranch = user && (item.createdByOperatorId === user.uid || item.branchUid === user.uid);
      const isStandard = !item.isBranchExclusive;
      let matchesScope = true;
      if (scopeFilter === 'standard') matchesScope = isStandard;
      if (scopeFilter === 'my_branch') matchesScope = isMyBranch;

      return matchesSearch && matchesStatus && matchesScope;
    },
    [debouncedSearch, statusFilter, scopeFilter, user]
  );

  // Firestore cursor pagination hook
  const {
    data: services,
    loading: serviceLoading,
    currentPage,
    pageSize,
    totalItems,
    goToPage,
    changePageSize,
  } = useFirestorePagination({
    collectionName: 'services',
    filters: queryFilters,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    realtime: true,
    searchTerm: debouncedSearch,
    searchFilterFn,
  });

  const operatorUid = user?.uid;
  const fulfillmentFilters = useMemo(() => {
    if (!operatorUid) return [];
    return [
      or(where('operatorId', '==', operatorUid), where('branchUid', '==', operatorUid)),
      where('status', 'in', ['Pending', 'Processing', 'Ongoing']),
    ];
  }, [operatorUid]);

  const {
    data: ongoingServices,
    loading: ongoingServicesLoading,
    currentPage: ongoingServicesPage,
    pageSize: ongoingServicesPageSize,
    totalItems: ongoingServicesTotal,
    goToPage: goToOngoingServicesPage,
    changePageSize: changeOngoingServicesPageSize,
  } = useFirestorePagination({
    collectionName: 'activeServices',
    filters: fulfillmentFilters,
    filterKey: `fulfillment-${operatorUid || ''}`,
    orderByField: 'startedAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    realtime: true,
    enabled: Boolean(user?.uid),
  });

  // Overall catalog counts for KPIs and chips
  const totalCount = kpiCounts.total || totalItems;
  const standardCount = kpiCounts.standard;
  const myBranchCount = kpiCounts.myBranch;
  const activeCount = kpiCounts.active;

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
      branchName: userDetails?.branchName || userDetails?.name || 'Branch Operator',
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
            addToast(`Branch service "${processedData.name}" created and published!`, 'success');
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
      console.error('Error submitting branch service:', err);
      addToast('Failed to upload file attachments: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    setIsConfirmLoading(true);
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
    setIsConfirmLoading(true);
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
        render: (item) => {
          const isMyBranch = user && (item.createdByOperatorId === user.uid || item.branchUid === user.uid);
          const isExclusive = Boolean(item.isBranchExclusive);

          return (
            <div className="op-service-info-row">
              <div className="op-service-thumb-box">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.name}
                    className="op-service-thumb-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const icon = e.currentTarget.parentElement?.querySelector('.op-service-thumb-placeholder');
                      if (icon) icon.classList.remove('display-none');
                    }}
                  />
                ) : (
                  <i className="fa-regular fa-image op-service-thumb-placeholder"></i>
                )}
              </div>
              <div className="op-service-meta-wrap">
                <div className="op-service-title-line">
                  <Link to={`/operator/services/${item.id}`} className="op-service-title-link">
                    {item.name || 'N/A'}
                  </Link>
                  {isMyBranch ? (
                    <span className="op-service-badge op-service-badge-own">
                      <i className="fa-solid fa-store"></i> My Branch
                    </span>
                  ) : isExclusive ? (
                    <span className="op-service-badge op-service-badge-other">
                      <i className="fa-solid fa-building-user"></i> {item.branchName || 'Partner'}
                    </span>
                  ) : (
                    <span className="op-service-badge op-service-badge-standard">
                      <i className="fa-solid fa-globe"></i> Standard Catalog
                    </span>
                  )}
                </div>
                <div className="op-service-category-line">
                  <span className="op-service-category-tag">
                    {item.category || 'General Services'}
                  </span>
                  {Array.isArray(item.tags) && item.tags.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="op-service-tag-pill">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'requirements',
        header: 'Requirements',
        render: (item) => {
          const count = Array.isArray(item.requirements) ? item.requirements.length : 0;
          return (
            <span className="status-pill status-active op-status-pill-small">
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
        render: (item) => {
          const isMyBranch = user && (item.createdByOperatorId === user.uid || item.branchUid === user.uid);
          const canManage = isQualified && isMyBranch;

          return (
            <div className="op-service-actions-row">
              <Link
                to={`/operator/services/${item.id}`}
                className="op-service-view-link"
                title="View Details"
              >
                <i className="fa-solid fa-eye"></i>
              </Link>

              {canManage && (
                <>
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
                </>
              )}
            </div>
          );
        },
      },
    ],
    [isQualified, user]
  );

  const fulfillmentColumns = useMemo(
    () => [
      {
        key: 'clientName',
        header: 'Client',
        render: (item) => item.clientName || item.name || 'N/A',
      },
      {
        key: 'serviceType',
        header: 'Service',
        render: (item) => item.serviceType || item.type || 'General Service',
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <span className="status-pill status-pill-active">
            {item.status || 'Pending'}
          </span>
        ),
      },
      {
        key: 'progress',
        header: 'Progress',
        render: (item) => {
          const steps = Array.isArray(item.steps) ? item.steps : [];
          const completed = steps.filter((step) => step.status === 'Completed').length;
          return `${completed} of ${steps.length || item.totalSteps || 0} steps`;
        },
      },
      {
        key: 'startedAt',
        header: 'Started',
        render: (item) => item.startedAt ? new Date(item.startedAt).toLocaleDateString() : 'N/A',
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (item) => (
          <Link
            to={`/operator/services/${item.id}/procedure`}
            className="op-service-view-link"
            title="Open fulfillment procedure"
          >
            <i className="fa-solid fa-list-check"></i>
          </Link>
        ),
      },
    ],
    []
  );

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Services' },
  ];

  return (
    <main className="operator-services-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Services Catalog"
        subtitle="Browse all standard catalog services and manage custom branch-exclusive offerings"
        primaryAction={
          isQualified
            ? {
                label: 'Create Branch Service',
                icon: 'fa-solid fa-plus',
                onClick: handleOpenAddModal,
              }
            : {
                label: 'Apply for Qualification',
                icon: 'fa-solid fa-paper-plane',
                onClick: () => setShowApplyModal(true),
                className: 'btn-secondary',
              }
        }
      />

      {/* Qualification Privilege Notice */}
      {!isQualified ? (
        <div className="op-qualification-banner">
          <div className="op-qualification-banner-text">
            <i className="fa-solid fa-circle-info"></i>
            <span>
              <strong>Standard Operator Access:</strong> You can view all standard FairFly catalog services in detail (read-only). To create custom branch-exclusive services and set custom pricing, apply for operator qualification.
            </span>
          </div>
          <button
            type="button"
            className="op-qualification-banner-btn"
            onClick={() => setShowApplyModal(true)}
          >
            <i className="fa-solid fa-certificate"></i> Apply for Qualification
          </button>
        </div>
      ) : (
        <AlertBar
          message={`Qualified Operator Active: You can create, edit, and publish custom services exclusive to ${userDetails?.branchName || 'your branch'}. Standard catalog services remain read-only.`}
          type="success"
        />
      )}

      {/* KPI Metrics */}
      <section className="services-summary-grid">
        <KpiCard
          title="Total Services"
          value={totalCount}
          icon="fa-solid fa-layer-group"
          iconColor="var(--purple)"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="Standard Catalog"
          value={standardCount}
          icon="fa-solid fa-globe"
          iconColor="#3b82f6"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="My Branch Exclusive"
          value={myBranchCount}
          icon="fa-solid fa-store"
          iconColor="var(--purple)"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="Active Services"
          value={activeCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
          isLoading={serviceLoading}
        />
      </section>

      {/* Table & Filtering Section */}
      <section className="card operator-services-table-card">
        <div className="op-services-toolbar">
          <div className="op-toolbar-top-row">
            {/* Scope Filter Chips */}
            <div className="op-scope-filter-chips">
              <button
                type="button"
                className={`op-scope-chip ${scopeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setScopeFilter('all')}
              >
                <i className="fa-solid fa-layer-group"></i> All Services ({totalCount})
              </button>
              <button
                type="button"
                className={`op-scope-chip ${scopeFilter === 'standard' ? 'active' : ''}`}
                onClick={() => setScopeFilter('standard')}
              >
                <i className="fa-solid fa-globe"></i> Standard Catalog ({standardCount})
              </button>
              <button
                type="button"
                className={`op-scope-chip ${scopeFilter === 'my_branch' ? 'active' : ''}`}
                onClick={() => setScopeFilter('my_branch')}
              >
                <i className="fa-solid fa-store"></i> My Branch ({myBranchCount})
              </button>
            </div>

            {/* Status Filter Chips */}
            <FilterChipGroup
              chips={[
                { value: 'all', label: `All Status (${totalItems})` },
                { value: 'active', label: `Active` },
                { value: 'disabled', label: `Disabled` },
              ]}
              activeChip={statusFilter}
              onChipChange={(val) => setStatusFilter(val)}
            />
          </div>

          <div className="table-toolbar">
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                placeholder="Search services by title, category, description, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={services}
          isLoading={serviceLoading}
          emptyState={{
            icon: 'fa-solid fa-concierge-bell',
            message: 'No services match your criteria. Adjust your filters or create a new branch service.',
          }}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </section>

      <section className="card operator-services-table-card">
        <h2>Ongoing Service Fulfillment ({ongoingServicesTotal})</h2>
        <DataTable
          columns={fulfillmentColumns}
          data={ongoingServices}
          isLoading={ongoingServicesLoading}
          emptyState={{
            icon: 'fa-solid fa-list-check',
            message: 'No ongoing service fulfillment is assigned to your branch.',
          }}
        />
        <Pagination
          currentPage={ongoingServicesPage}
          totalItems={ongoingServicesTotal}
          pageSize={ongoingServicesPageSize}
          onPageChange={goToOngoingServicesPage}
          onPageSizeChange={changeOngoingServicesPageSize}
        />
      </section>

      {/* Service Modal (for creating or editing branch services) */}
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

      {/* Qualification Application Modal */}
      <QualificationApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />
    </main>
  );
}
