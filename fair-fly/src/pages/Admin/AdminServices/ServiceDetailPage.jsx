import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ServiceModal from '../../../components/Admin/Modals/ServiceModal/ServiceModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './service-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

const CATEGORY_ICON_MAP = {
  'visa & embassy assistance': 'fa-solid fa-passport',
  'visa assistance': 'fa-solid fa-passport',
  'passport processing': 'fa-solid fa-id-card',
  'psa & civil documents': 'fa-regular fa-file-lines',
  'psa documents': 'fa-regular fa-file-lines',
  'airline ticketing': 'fa-solid fa-plane-departure',
  'airline tickets': 'fa-solid fa-plane-departure',
  'tour packages': 'fa-solid fa-map-location-dot',
  'travel insurance & hotels': 'fa-solid fa-hotel',
  'authentication & legalization': 'fa-solid fa-certificate',
  'other': 'fa-solid fa-boxes-stacked',
  'general services': 'fa-solid fa-concierge-bell'
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: services, loading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const service = useMemo(() => {
    if (!services || !id) return null;
    return services.find((s) => s.id === id) || null;
  }, [services, id]);

  const UNIT_LABELS = {
    days: 'Day/s',
    weeks: 'Week/s',
    months: 'Month/s',
  };

  const formatProcessingTime = (processingTime) => {
    if (!processingTime || typeof processingTime !== 'object') {
      return processingTime || 'N/A';
    }
    const { min, max, unit } = processingTime;
    const label = UNIT_LABELS[unit] || unit;
    if (!min && !max) return 'N/A';
    if (min === max || !max) return `${min} ${label}`;
    return `${min}-${max} ${label}`;
  };

  const formatPriceDisplay = (price) => {
    if (!price) return '₱0.00';
    if (typeof price === 'string' && (price.startsWith('₱') || price.startsWith('PHP'))) {
      return price;
    }
    const num = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
    return `₱${num.toLocaleString('en-US')}`;
  };

  const getCategoryIcon = (category) => {
    const key = (category || '').toLowerCase();
    return CATEGORY_ICON_MAP[key] || 'fa-solid fa-concierge-bell';
  };

  const handleDeactivate = async () => {
    if (!service) return;
    const newStatus = service.status === 'Active' ? 'Disabled' : 'Active';
    ApiCaller(
      `${API_BASE_URL}/api/services/${service.id}`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Service catalog item ${newStatus === 'Active' ? 'activated' : 'disabled'} successfully`, 'success');
        setConfirmState(null);
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleDelete = async () => {
    if (!service) return;
    ApiCaller(
      `${API_BASE_URL}/api/services/${service.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Service catalog item deleted successfully', 'success');
        setConfirmState(null);
        navigate('/admin/services');
      },
      (error) => {
        addToast(`Failed to delete service: ${error.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleFormSubmit = async (serviceData) => {
    setIsSubmitting(true);
    try {
      let coverImageUrl = serviceData.coverImage || '';
      if (serviceData.pendingCoverFile) {
        const { url: uploadedCoverUrl } = await uploadFileToBackend(
          serviceData.pendingCoverFile,
          'service_covers',
          userToken
        );
        coverImageUrl = uploadedCoverUrl;
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

      const { pendingCoverFile, coverImagePreview, ...cleanData } = serviceData;

      const payload = {
        ...cleanData,
        coverImage: coverImageUrl,
        requirements: updatedRequirements,
      };

      ApiCaller(
        `${API_BASE_URL}/api/services/${service.id}`,
        'PUT',
        payload,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast('Service updated successfully', 'success');
          setIsModalOpen(false);
          setIsSubmitting(false);
        },
        (error) => {
          addToast(`Failed to update service: ${error.message}`, 'error');
          setIsSubmitting(false);
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error updating service on detail page:', err);
      addToast('Failed to upload file attachments: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Services', to: '/admin/services' },
    { label: service ? service.name : 'Loading...' },
  ];

  const actions = [
    {
      label: 'Edit Service',
      icon: 'fa-solid fa-pen-to-square',
      onClick: () => setIsModalOpen(true),
      className: 'btn-primary',
      disabled: isSubmitting || isConfirmLoading,
    },
    {
      label: service?.status === 'Active' ? 'Disable Service' : 'Activate Service',
      icon: service?.status === 'Active' ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check',
      onClick: () => setConfirmState('status'),
      className: 'btn-secondary',
      disabled: isSubmitting || isConfirmLoading,
    },
    {
      label: 'Delete Service',
      icon: 'fa-solid fa-trash',
      onClick: () => setConfirmState('delete'),
      className: 'btn-danger',
      disabled: isSubmitting || isConfirmLoading,
    },
  ];

  const coverUrl = service?.coverImage || service?.coverPhoto || service?.coverPhotoUrl;
  const requirementsCount = service?.requirements?.length || 0;
  const stepsCount = service?.steps?.length || 0;

  return (
    <RecordDetailLayout
      title={service?.name || 'Service Catalog Details'}
      subtitle={service?.category || 'Standard Services Category'}
      status={service?.status}
      statusType={service?.status === 'Active' ? 'success' : 'danger'}
      breadcrumbs={breadcrumbs}
      backTo="/admin/services"
      backLabel="Back to Services"
      actions={service ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !service}
      notFoundMessage="The service catalog item could not be found."
    >
      {service && (
        <div className="service-detail-wrapper">
          {service.status === 'Disabled' && (
            <AlertBar
              message="This service is currently disabled. It is hidden from the client-side shopping catalog."
              type="warning"
            />
          )}

          {/* Hero Cover Banner */}
          <div className="service-hero-banner">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={service.name}
                className="service-hero-img"
                loading="eager"
              />
            ) : (
              <div className="service-hero-fallback">
                <i className={`${getCategoryIcon(service.category)} service-hero-fallback-icon`}></i>
                <span className="service-hero-fallback-text">{service.category || 'Travel & Document Service'}</span>
              </div>
            )}

            {/* Overlays on Hero */}
            <div className="service-hero-overlay">
              <span className="service-hero-category">
                <i className={getCategoryIcon(service.category)}></i>
                {service.category || 'General Services'}
              </span>

              <div className="service-hero-badges">
                {service.featured && (
                  <span className="service-hero-featured">
                    <i className="fa-solid fa-star"></i> Featured on Shopping UI
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Row */}
          <div className="service-kpi-grid">
            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-solid fa-peso-sign"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Service Fee</span>
                <span className="service-kpi-val" style={{ color: 'var(--purple)' }}>
                  {formatPriceDisplay(service.price)}
                </span>
              </div>
            </div>

            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-regular fa-clock"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Turnaround Time</span>
                <span className="service-kpi-val">
                  {formatProcessingTime(service.processingTime)}
                </span>
              </div>
            </div>

            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-solid fa-list-check"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Required Inputs</span>
                <span className="service-kpi-val">
                  {requirementsCount} {requirementsCount === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>

            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-solid fa-diagram-project"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Workflow Steps</span>
                <span className="service-kpi-val">
                  {stepsCount} {stepsCount === 1 ? 'Stage' : 'Stages'}
                </span>
              </div>
            </div>
          </div>

          {/* Catalog Configuration & Overview Grid */}
          <div className="details-grid-2">
            {/* Catalog Info Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-folder-open"></i> Catalog Configuration
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Service Category</span>
                  <span className="detail-value" style={{ fontWeight: 700, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <i className={getCategoryIcon(service.category)}></i>
                    {service.category || 'General Services'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Base Service Price</span>
                  <span className="detail-value text-purple font-large">
                    {formatPriceDisplay(service.price)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estimated Turnaround</span>
                  <span className="detail-value">{formatProcessingTime(service.processingTime)}</span>
                </div>
                {Array.isArray(service.tags) && service.tags.length > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Marketplace Tags</span>
                    <div className="detail-tags-group">
                      {service.tags.map((t, idx) => (
                        <span key={idx} className="detail-tag-pill">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Marketplace Spotlight</span>
                  {service.featured ? (
                    <span className="status-pill" style={{ background: 'var(--warning-yellow-light)', color: '#8d6b00', fontWeight: 700 }}>
                      <i className="fa-solid fa-star" style={{ marginRight: '0.25rem', color: 'var(--warning-yellow)' }}></i> Featured / Top Showcase
                    </span>
                  ) : (
                    <span className="detail-value" style={{ color: 'var(--text-light)' }}>
                      Standard Listing
                    </span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Catalog Status</span>
                  <span className={`status-pill ${service.status === 'Active' ? 'status-pill-success' : 'status-pill-danger'}`}>
                    <i className={`fa-solid ${service.status === 'Active' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: '0.25rem' }}></i>
                    {service.status || 'Active'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
                {service.updatedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Last Modified</span>
                    <span className="detail-value">
                      {new Date(service.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </article>

            {/* Catalog Overview & Description */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-align-left"></i> Description & Customer Summary
              </h2>
              {service.description ? (
                <p className="service-description-text">
                  {service.description}
                </p>
              ) : (
                <div className="no-items-text">
                  <p>No description provided for this service yet.</p>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: '0.5rem', display: 'inline-flex' }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    <i className="fa-solid fa-pen"></i> Add Description
                  </button>
                </div>
              )}
            </article>
          </div>

          {/* Requirements & Workflows Grid */}
          <div className="details-grid-2">
            {/* Requirements Checklist */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-list-check"></i> Standard Required Inputs ({requirementsCount})
              </h2>
              <div className="detail-requirements-list">
                {service.requirements && service.requirements.length > 0 ? (
                  service.requirements.map((req, rIdx) => {
                    const reqName = typeof req === 'string' ? req : req.name || req.title;
                    const reqType = typeof req === 'object' ? req.inputType : 'text';
                    const isRequired = typeof req === 'object' ? req.required !== false : true;
                    const hasAttachment = typeof req === 'object' && req.attachment?.url;

                    return (
                      <div key={rIdx} className="req-item-pill">
                        <span className="req-item-icon">
                          {reqType === 'image' && <i className="fa-regular fa-image"></i>}
                          {reqType === 'file' && <i className="fa-regular fa-file-lines"></i>}
                          {reqType === 'date' && <i className="fa-regular fa-calendar"></i>}
                          {reqType === 'number' && <i className="fa-solid fa-hashtag"></i>}
                          {reqType === 'text' && <i className="fa-solid fa-pen-to-square"></i>}
                        </span>
                        <div className="req-item-details">
                          <div className="req-item-header">
                            <span className="req-item-name">{reqName}</span>
                            {isRequired ? (
                              <span className="req-mandatory-pill">Mandatory</span>
                            ) : (
                              <span className="req-optional-pill">Optional</span>
                            )}
                          </div>
                          <div className="req-item-meta">
                            <span className="req-item-type">Type: {reqType.toUpperCase()}</span>
                            {hasAttachment && (
                              <a
                                href={req.attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="req-attachment-link"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                                {req.attachment.name || 'Sample Document'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-items-text">No custom documents or input requirements configured for this service.</p>
                )}
              </div>
            </article>

            {/* Connected Workflows */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-diagram-project"></i> Workflow Checklist Steps ({stepsCount})
              </h2>
              <div className="detail-workflows-list">
                {service.steps && service.steps.length > 0 ? (
                  service.steps.map((step, sIdx) => (
                    <div key={sIdx} className="workflow-step-line">
                      <span className="step-number-badge">{step.stepNumber || sIdx + 1}</span>
                      <div className="step-content">
                        <span className="step-title">{step.title}</span>
                        {step.description && <p className="step-description">{step.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-items-text">No workflow pipeline checklist configured for this catalog item.</p>
                )}
              </div>
            </article>
          </div>

          {/* Form Modal for editing */}
          <ServiceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingService={service}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />

          {/* Single Delete confirmation */}
          <ConfirmationModal
            isOpen={confirmState === 'delete'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={TrashIcon}
            Title="Delete this service item?"
            Desc={`"${service.name}" will be permanently deleted from the catalog. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Service"
            isLoading={isConfirmLoading}
            OnConfirm={handleDelete}
          />

          {/* Single Deactivate/Activate confirmation */}
          <ConfirmationModal
            isOpen={confirmState === 'status'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={BanIcon}
            Title={service.status === 'Active' ? 'Disable this service item?' : 'Enable this service item?'}
            Desc={service.status === 'Active' 
              ? `"${service.name}" will be hidden from the catalog until re-enabled.` 
              : `"${service.name}" will be reactivated in the client search catalog.`
            }
            BtnColor="var(--orange)"
            confirmText={service.status === 'Active' ? 'Disable' : 'Enable'}
            isLoading={isConfirmLoading}
            OnConfirm={handleDeactivate}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
