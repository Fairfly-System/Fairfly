import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ServiceCarouselGallery from '../../../components/UI/ServiceCarouselGallery/ServiceCarouselGallery';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ServiceModal from '../../../components/Admin/Modals/ServiceModal/ServiceModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import '../../Admin/AdminServices/service-detail.css';
import './operator-service-detail.css';

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
  'general services': 'fa-solid fa-concierge-bell',
};

const UNIT_LABELS = {
  days: 'Day/s',
  weeks: 'Week/s',
  months: 'Month/s',
};

export default function OperatorServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: services, loading } = useAdminContext();
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isQualified = Boolean(userDetails?.isQualified);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const service = useMemo(() => {
    if (!services || !id) return null;
    return services.find((s) => s.id === id) || null;
  }, [services, id]);

  const isOwnBranchService = Boolean(
    service &&
      user &&
      (service.createdByOperatorId === user.uid || service.branchUid === user.uid)
  );

  const canManageService = isQualified && isOwnBranchService;

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
    setIsConfirmLoading(true);
    ApiCaller(
      `${API_BASE_URL}/api/services/${service.id}`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Service ${newStatus === 'Active' ? 'activated' : 'disabled'} successfully!`, 'success');
        setConfirmState(null);
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update status.'), 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleDelete = async () => {
    if (!service) return;
    setIsConfirmLoading(true);
    ApiCaller(
      `${API_BASE_URL}/api/services/${service.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Branch service deleted successfully', 'success');
        setConfirmState(null);
        navigate('/operator/services');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to delete service.'), 'error');
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

      let updatedCarouselImages = [];
      if (Array.isArray(serviceData.carouselImages)) {
        updatedCarouselImages = await Promise.all(
          serviceData.carouselImages.map(async (item) => {
            if (item?.pendingFile) {
              const { url: downloadUrl } = await uploadFileToBackend(
                item.pendingFile,
                'service_carousel',
                userToken
              );
              return downloadUrl;
            }
            if (typeof item === 'string') return item;
            return item?.url || '';
          })
        );
        updatedCarouselImages = updatedCarouselImages.filter(Boolean);
      }

      const { pendingCoverFile, coverImagePreview, ...cleanData } = serviceData;

      const payload = {
        ...cleanData,
        coverImage: coverImageUrl,
        coverPhoto: coverImageUrl,
        coverPhotoUrl: coverImageUrl,
        carouselImages: updatedCarouselImages,
        requirements: updatedRequirements,
        isBranchExclusive: true,
        branchUid: user.uid,
        branchName: userDetails?.branchName || userDetails?.name || 'Branch Operator',
      };

      ApiCaller(
        `${API_BASE_URL}/api/services/${service.id}`,
        'PATCH',
        payload,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast('Branch service updated successfully!', 'success');
          setIsModalOpen(false);
          setIsSubmitting(false);
        },
        (error) => {
          addToast(toFriendlyMessage(error, 'Failed to update service.'), 'error');
          setIsSubmitting(false);
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error updating service on operator detail page:', err);
      addToast('Failed to upload file attachments: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Services', to: '/operator/services' },
    { label: service ? service.name : 'Loading...' },
  ];

  // Actions based on permissions
  const actions = [];

  // If operator has management rights over their branch exclusive service
  if (canManageService) {
    actions.push({
      label: 'Edit Service',
      icon: 'fa-solid fa-pen-to-square',
      onClick: () => setIsModalOpen(true),
      className: 'btn-primary',
      disabled: isSubmitting || isConfirmLoading,
    });
    actions.push({
      label: service?.status === 'Active' ? 'Disable Service' : 'Activate Service',
      icon: service?.status === 'Active' ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check',
      onClick: () => setConfirmState('status'),
      className: 'btn-secondary',
      disabled: isSubmitting || isConfirmLoading,
    });
    actions.push({
      label: 'Delete Service',
      icon: 'fa-solid fa-trash',
      onClick: () => setConfirmState('delete'),
      className: 'btn-danger',
      disabled: isSubmitting || isConfirmLoading,
    });
  }

  const coverUrl = service?.coverImage || service?.coverPhoto || service?.coverPhotoUrl;
  const requirementsCount = service?.requirements?.length || 0;
  const stepsCount = service?.steps?.length || 0;

  return (
    <RecordDetailLayout
      title={service?.name || 'Service Details'}
      subtitle={
        isOwnBranchService
          ? `Branch Exclusive • ${userDetails?.branchName || 'My Branch'}`
          : service?.isBranchExclusive
          ? `Branch Exclusive • ${service.branchName || 'Partner Branch'}`
          : 'Standard Global Service'
      }
      status={service?.status}
      statusType={service?.status === 'Active' ? 'success' : 'danger'}
      thumbnail={coverUrl}
      avatarIcon={getCategoryIcon(service?.category)}
      breadcrumbs={breadcrumbs}
      backTo="/operator/services"
      backLabel="Back to Services"
      actions={service ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !service}
      notFoundMessage="The service item could not be found in the catalog."
    >
      {service && (
        <div className="operator-service-detail-wrapper service-detail-wrapper">
          {/* Permission / Exclusivity Context Banner */}
          {isOwnBranchService ? (
            <AlertBar
              message={`Branch Exclusive Service: Managed and priced exclusively by ${userDetails?.branchName || 'your branch'}. You have full editing rights.`}
              type="success"
            />
          ) : service.isBranchExclusive ? (
            <AlertBar
              message={`Branch Exclusive Service (Read-Only): Exclusively serviced by ${service.branchName || 'another branch'}. Available for review only.`}
              type="warning"
            />
          ) : (
            <AlertBar
              message="Standard Catalog Service (Read-Only): This is a global FairFly service catalog item available across all branches."
              type="info"
            />
          )}

          {/* Interactive Hero Carousel Gallery (Cover + Carousel Photos) */}
          <ServiceCarouselGallery service={service} />

          {/* Quick Execution SOP Callout (If Workflow Steps Configured) */}
          {stepsCount > 0 && (
            <div className="op-service-procedure-callout">
              <div className="op-procedure-callout-text">
                <i className="fa-solid fa-clipboard-check"></i>
                <span>
                  <strong>Standard Operating Procedure Available:</strong> This service has {stepsCount} operational stage{stepsCount !== 1 ? 's' : ''} with execution guidelines.
                </span>
              </div>
              <Link
                to={`/operator/services/${service.id}/procedure`}
                className="op-procedure-btn"
              >
                <i className="fa-solid fa-list-check"></i> Perform Service SOP
              </Link>
            </div>
          )}

          {/* Quick Metrics KPI Row */}
          <div className="service-kpi-grid">
            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-solid fa-peso-sign"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Service Fee</span>
                <span className="service-kpi-val op-kpi-purple">
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
                <span className="service-kpi-label">Workflow Stages</span>
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
                <i className="fa-regular fa-folder-open"></i> Service Specifications
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value op-detail-category-value">
                    <i className={getCategoryIcon(service.category)}></i>
                    {service.category || 'General Services'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Base Fee</span>
                  <span className="detail-value text-purple font-large">
                    {formatPriceDisplay(service.price)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Turnaround Time</span>
                  <span className="detail-value">{formatProcessingTime(service.processingTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Scope</span>
                  <span className="detail-value">
                    {isOwnBranchService ? (
                      <span className="op-branch-exclusive-badge">
                        <i className="fa-solid fa-store"></i> Exclusive to Your Branch
                      </span>
                    ) : service.isBranchExclusive ? (
                      <span className="op-branch-exclusive-badge op-branch-exclusive-badge-partner">
                        <i className="fa-solid fa-building-user"></i> Exclusive to {service.branchName || 'Partner'}
                      </span>
                    ) : (
                      <span className="status-pill status-pill-active">
                        <i className="fa-solid fa-globe"></i> Global Standard Catalog
                      </span>
                    )}
                  </span>
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
                  <span className="detail-label">Catalog Status</span>
                  <span className={`status-pill ${service.status === 'Active' ? 'status-pill-success' : 'status-pill-danger'}`}>
                    <i className={`fa-solid op-status-icon-gap ${service.status === 'Active' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                    {service.status || 'Active'}
                  </span>
                </div>
              </div>
            </article>

            {/* Description & Overview */}
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
                  <p>No description provided for this service item.</p>
                  {canManageService && (
                    <button
                      type="button"
                      className="btn-secondary op-add-desc-btn"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <i className="fa-solid fa-pen"></i> Add Description
                    </button>
                  )}
                </div>
              )}
            </article>
          </div>

          {/* Requirements & Workflows Grid */}
          <div className="details-grid-2">
            {/* Standard Required Inputs */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-list-check"></i> Standard Required Inputs ({requirementsCount})
              </h2>
              <div className="detail-requirements-list">
                {service.requirements && service.requirements.length > 0 ? (
                  service.requirements.map((req, rIdx) => {
                    const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${rIdx + 1}`;
                    const reqType = typeof req === 'object' ? (req.inputType || req.type || 'text') : 'text';
                    const isRequired = typeof req === 'object' ? req.required !== false : true;
                    const hasAttachment = typeof req === 'object' && Boolean(req.attachment?.url || req.attachmentUrl || req.fileUrl);
                    const attachmentUrl = typeof req === 'object' ? (req.attachment?.url || req.attachmentUrl || req.fileUrl) : '';
                    const attachmentName = typeof req === 'object' ? (req.attachment?.name || req.attachmentName || req.fileName || 'Sample Document') : 'Sample Document';

                    return (
                      <div key={rIdx} className="req-item-pill">
                        <span className="req-item-icon">
                          {reqType === 'image' && <i className="fa-regular fa-image"></i>}
                          {reqType === 'file' && <i className="fa-regular fa-file-lines"></i>}
                          {reqType === 'date' && <i className="fa-regular fa-calendar"></i>}
                          {reqType === 'number' && <i className="fa-solid fa-hashtag"></i>}
                          {(!['image', 'file', 'date', 'number'].includes(reqType)) && <i className="fa-solid fa-pen-to-square"></i>}
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
                            <span className="req-item-type">Type: {String(reqType || 'text').toUpperCase()}</span>
                            {hasAttachment && (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="req-attachment-link"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                                {attachmentName}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-items-text">No custom documents or requirements configured for this service.</p>
                )}
              </div>
            </article>

            {/* Workflow Pipeline Steps */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-diagram-project"></i> Workflow Checklist Stages ({stepsCount})
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
                  <p className="no-items-text">No operational workflow stages linked to this service catalog item.</p>
                )}
              </div>
            </article>
          </div>

          {/* Form Modal for editing own branch service */}
          {canManageService && (
            <ServiceModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              editingService={service}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
            />
          )}

          {/* Delete confirmation modal */}
          {canManageService && (
            <ConfirmationModal
              isOpen={confirmState === 'delete'}
              onClose={() => !isConfirmLoading && setConfirmState(null)}
              Title="Delete this branch service?"
              Desc={`"${service.name}" will be permanently deleted from your branch catalog.`}
              BtnColor="var(--error-red)"
              confirmText="Delete Service"
              isLoading={isConfirmLoading}
              OnConfirm={handleDelete}
            />
          )}

          {/* Deactivate/Activate confirmation modal */}
          {canManageService && (
            <ConfirmationModal
              isOpen={confirmState === 'status'}
              onClose={() => !isConfirmLoading && setConfirmState(null)}
              Title={service.status === 'Active' ? 'Disable this service item?' : 'Enable this service item?'}
              Desc={service.status === 'Active'
                ? `"${service.name}" will be hidden from customer booking options.`
                : `"${service.name}" will be made active again.`
              }
              BtnColor="var(--orange)"
              confirmText={service.status === 'Active' ? 'Disable' : 'Enable'}
              isLoading={isConfirmLoading}
              OnConfirm={handleDeactivate}
            />
          )}
        </div>
      )}
    </RecordDetailLayout>
  );
}
