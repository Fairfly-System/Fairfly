import React, { useState, useMemo, useEffect } from 'react';
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
import ServiceCarouselGallery from '../../../components/UI/ServiceCarouselGallery/ServiceCarouselGallery';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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

  const [allWorkflowTemplates, setAllWorkflowTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'workflowTemplates'),
      (snapshot) => {
        setAllWorkflowTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.warn('Error loading workflow templates in ServiceDetailPage:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const service = useMemo(() => {
    if (!services || !id) return null;
    return services.find((s) => s.id === id) || null;
  }, [services, id]);

  const attachedWorkflows = useMemo(() => {
    if (!service || !Array.isArray(service.workflowIds) || service.workflowIds.length === 0) return [];
    return service.workflowIds
      .map(wfId => allWorkflowTemplates.find(t => t.id === wfId))
      .filter(Boolean);
  }, [service, allWorkflowTemplates]);

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

      // Process Carousel Images
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
        carouselImages: updatedCarouselImages,
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
  const totalStepsCount = useMemo(() => {
    if (attachedWorkflows.length > 0) {
      return attachedWorkflows.reduce((acc, wf) => acc + (Array.isArray(wf.steps) ? wf.steps.length : 0), 0);
    }
    return service?.steps?.length || 0;
  }, [attachedWorkflows, service]);

  return (
    <RecordDetailLayout
      title={service?.name || 'Service Catalog Details'}
      subtitle={service?.category || 'Standard Services Category'}
      status={service?.status}
      statusType={service?.status === 'Active' ? 'success' : 'danger'}
      thumbnail={coverUrl}
      avatarIcon={getCategoryIcon(service?.category)}
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

          {/* Interactive Hero Carousel Gallery (Cover + Carousel Photos) */}
          <ServiceCarouselGallery service={service} />

          {/* Quick Metrics KPI Row */}
          <div className="service-kpi-grid">
            <div className="service-kpi-card">
              <div className="service-kpi-icon">
                <i className="fa-solid fa-peso-sign"></i>
              </div>
              <div className="service-kpi-info">
                <span className="service-kpi-label">Service Fee</span>
                <span className="service-kpi-val service-kpi-purple">
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
                <span className="service-kpi-label">Attached Workflows</span>
                <span className="service-kpi-val">
                  {attachedWorkflows.length > 0
                    ? `${attachedWorkflows.length} (${totalStepsCount} Step${totalStepsCount !== 1 ? 's' : ''})`
                    : `${totalStepsCount} ${totalStepsCount === 1 ? 'Stage' : 'Stages'}`}
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
                  <span className="detail-value service-detail-category-value">
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
                    <span className="status-pill service-featured-pill">
                      <i className="fa-solid fa-star service-featured-star"></i> Featured / Top Showcase
                    </span>
                  ) : (
                    <span className="detail-value service-detail-muted">
                      Standard Listing
                    </span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Catalog Status</span>
                  <span className={`status-pill ${service.status === 'Active' ? 'status-pill-success' : 'status-pill-danger'}`}>
                    <i className={`fa-solid service-status-icon-gap ${service.status === 'Active' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
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
                    className="btn-secondary service-add-desc-btn"
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
                  <p className="no-items-text">No custom documents or input requirements configured for this service.</p>
                )}
              </div>
            </article>

            {/* Connected Workflows */}
            <article className="card detail-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 className="panel-title" style={{ margin: 0 }}>
                  <i className="fa-solid fa-diagram-project"></i> Attached Workflows ({attachedWorkflows.length > 0 ? attachedWorkflows.length : (service.steps?.length ? 1 : 0)})
                </h2>
                {attachedWorkflows.length > 0 && (
                  <span className="status-pill status-active" style={{ fontSize: '0.75rem' }}>
                    {totalStepsCount} Total Step{totalStepsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="detail-workflows-container">
                {attachedWorkflows.length > 0 ? (
                  attachedWorkflows.map((wf, wfIdx) => (
                    <div key={wf.id || wfIdx} className="attached-workflow-card">
                      <div className="attached-workflow-header">
                        <div className="attached-workflow-title-wrap">
                          <i className="fa-solid fa-diagram-project" style={{ color: 'var(--purple)' }}></i>
                          <h3 className="attached-workflow-title">{wf.name}</h3>
                          {wf.serviceType && (
                            <span className="status-pill" style={{ fontSize: '0.6875rem' }}>
                              {wf.serviceType}
                            </span>
                          )}
                        </div>
                        <span className="status-pill status-active" style={{ fontSize: '0.6875rem' }}>
                          {Array.isArray(wf.steps) ? wf.steps.length : 0} Step{Array.isArray(wf.steps) && wf.steps.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {wf.description && (
                        <p className="attached-workflow-desc">{wf.description}</p>
                      )}

                      <div className="detail-workflows-list">
                        {Array.isArray(wf.steps) && wf.steps.length > 0 ? (
                          wf.steps.map((step, sIdx) => {
                            const stepTitle = typeof step === 'string' ? step : (step.title || step.name || `Step ${sIdx + 1}`);
                            const stepDesc = typeof step === 'object' ? (step.description || step.instructions) : '';
                            const stepLink = typeof step === 'object' ? (step.thirdPartyLink || step.link || step.url) : null;
                            const stepFile = typeof step === 'object' ? (step.file || step.attachment) : null;
                            const linkUrl = typeof stepLink === 'string' ? stepLink : stepLink?.url;
                            const linkTitle = typeof stepLink === 'object' ? (stepLink?.title || 'Open Portal') : 'Open Portal';
                            const fileUrl = typeof stepFile === 'string' ? stepFile : stepFile?.url;
                            const fileName = typeof stepFile === 'object' ? (stepFile?.name || 'Attached Document') : 'Attached Document';

                            return (
                              <div key={sIdx} className="workflow-step-line">
                                <span className="step-number-badge">{sIdx + 1}</span>
                                <div className="step-content">
                                  <span className="step-title">{stepTitle}</span>
                                  {stepDesc && <p className="step-description">{stepDesc}</p>}
                                  {(linkUrl || fileUrl) && (
                                    <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                                      {linkUrl && (
                                        <a href={linkUrl} target="_blank" rel="noreferrer" className="req-attachment-link" style={{ fontSize: '0.75rem' }}>
                                          <i className="fa-solid fa-arrow-up-right-from-square"></i> {linkTitle}
                                        </a>
                                      )}
                                      {fileUrl && (
                                        <a href={fileUrl} target="_blank" rel="noreferrer" className="req-attachment-link" style={{ fontSize: '0.75rem' }}>
                                          <i className="fa-solid fa-paperclip"></i> {fileName}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="no-items-text" style={{ fontSize: '0.8125rem' }}>No steps in this workflow template.</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : service.steps && service.steps.length > 0 ? (
                  <div className="detail-workflows-list">
                    {service.steps.map((step, sIdx) => (
                      <div key={sIdx} className="workflow-step-line">
                        <span className="step-number-badge">{step.stepNumber || sIdx + 1}</span>
                        <div className="step-content">
                          <span className="step-title">{step.title}</span>
                          {step.description && <p className="step-description">{step.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-items-text" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <p style={{ margin: '0 0 0.75rem 0' }}>No workflow pipeline checklist configured for this catalog item.</p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <i className="fa-solid fa-diagram-project"></i> Attach Workflow
                    </button>
                  </div>
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
