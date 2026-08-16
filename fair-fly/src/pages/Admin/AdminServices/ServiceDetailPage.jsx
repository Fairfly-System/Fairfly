import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ServiceModal from '../../../components/Admin/Modals/ServiceModal/ServiceModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './service-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

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
    ApiCaller(
      `${API_BASE_URL}/api/services/${service.id}`,
      'PATCH',
      serviceData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Service updated successfully', 'success');
        setIsModalOpen(false);
      },
      (error) => {
        addToast(`Failed to update service: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Services', to: '/admin/services' },
    { label: service ? service.name : 'Loading...' },
  ];

  const actions = [
    {
      label: 'Edit Catalog Item',
      icon: 'fa-solid fa-pen-to-square',
      onClick: () => setIsModalOpen(true),
      className: 'btn-secondary',
      disabled: isSubmitting || isConfirmLoading,
    },
    {
      label: service?.status === 'Active' ? 'Disable Item' : 'Activate Item',
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
              message="This service is currently disabled in the catalog. Clients will not be able to request or view it on their client dashboard portals."
              type="warning"
            />
          )}

          <div className="details-grid-2">
            {/* Catalog Info Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-folder-open"></i> Catalog Configuration
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Service Fee (Base Price)</span>
                  <span className="detail-value text-purple font-large">
                    {service.price ? `₱${Number(service.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Category</span>
                  <span className="detail-value">{service.category || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Processing Turnaround</span>
                  <span className="detail-value">{formatProcessingTime(service.processingTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created / Configured At</span>
                  <span className="detail-value">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </article>

            {/* Catalog Overview & Details */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-align-left"></i> Description & Details
              </h2>
              <p className="service-description-text">
                {service.description || 'No detailed description has been registered for this service catalog item.'}
              </p>
            </article>
          </div>

          <div className="details-grid-2">
            {/* Requirements Checklist */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-list-check"></i> Standard Required Inputs ({service.requirements?.length || 0})
              </h2>
              <div className="detail-requirements-list">
                {service.requirements && service.requirements.length > 0 ? (
                  service.requirements.map((req, rIdx) => {
                    const reqName = typeof req === 'string' ? req : req.name || req.title;
                    const reqType = typeof req === 'object' ? req.inputType : 'text';
                    
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
                          <span className="req-item-name">{reqName}</span>
                          <span className="req-item-type">{reqType.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-items-text">No custom documents or requirements configured for this service.</p>
                )}
              </div>
            </article>

            {/* Connected Workflows */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-diagram-project"></i> Workflow Checklist Steps
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
                  <p className="no-items-text">No workflow pipeline configured for this catalog item.</p>
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
