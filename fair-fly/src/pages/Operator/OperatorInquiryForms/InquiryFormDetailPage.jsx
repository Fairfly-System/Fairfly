import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import CreateQuotationModal from '../../../components/Operator/CreateQuotationModal/CreateQuotationModal';
import { updateInquiry, deleteInquiry, attachServiceToInquiry } from '../../../services/inquiryService';
import { fetchServices } from '../../../services/serviceService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './inquiry-form-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

// Helper to safely parse client requirements and remarks
function parseInquiryData(inquiry) {
  if (!inquiry) return { requirementsText: '', remarksText: '' };

  let requirementsText = inquiry.specifiedRequirements || inquiry.notes || '';
  let remarksText = inquiry.remarks || '';

  if (typeof remarksText === 'object' && remarksText !== null) {
    remarksText = Object.entries(remarksText)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  return {
    requirementsText: typeof requirementsText === 'string' && requirementsText.trim()
      ? requirementsText.trim()
      : 'No specific client requirements recorded.',
    remarksText: typeof remarksText === 'string' && remarksText.trim()
      ? remarksText.trim()
      : 'No additional remarks recorded.'
  };
}

export default function InquiryFormDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  // Attach Service state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeServices, setActiveServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  // Load catalog services when attach modal opens
  useEffect(() => {
    if (showAttachModal) {
      fetchServices(
        (services) => {
          const activeList = Array.isArray(services)
            ? services.filter(s => s.status === 'Active' && Array.isArray(s.workflowIds) && s.workflowIds.length > 0)
            : [];
          setActiveServices(activeList);
          if (activeList.length > 0 && !selectedServiceId) {
            setSelectedServiceId(activeList[0].id);
          }
        },
        (err) => {
          console.error('Error fetching catalog services:', err);
        }
      );
    }
  }, [showAttachModal, selectedServiceId]);

  const handleAttachService = () => {
    if (!selectedServiceId || !form?.id) {
      addToast('Please select a service to attach', 'warning');
      return;
    }
    setIsAttaching(true);
    attachServiceToInquiry(
      userToken,
      form.id,
      { serviceId: selectedServiceId, isWalkIn: Boolean(form.isWalkIn) },
      () => {
        setIsAttaching(false);
        setShowAttachModal(false);
        addToast('Catalog service attached. You can now prepare the quotation.', 'success');
      },
      (err) => {
        setIsAttaching(false);
        console.error('Error attaching service:', err);
        addToast(err?.message || 'Failed to attach service', 'error');
      }
    );
  };

  // Directly subscribe to the specific inquiry form document (1 document read instead of entire collection)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(firestore, 'inquiries', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setForm({ id: docSnap.id, ...docSnap.data() });
        } else {
          setForm(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[InquiryFormDetailPage] Document error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const parsedData = useMemo(() => {
    return parseInquiryData(form);
  }, [form]);

  const handleDelete = async () => {
    if (!form) return;
    deleteInquiry(
      userToken,
      form.id,
      () => {
        addToast('Inquiry form deleted successfully', 'success');
        setShowDeleteConfirm(false);
        navigate('/operator/inquiry-forms');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to delete inquiry form'), 'error');
      },
      setIsDeleting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Inquiry Forms', to: '/operator/inquiry-forms' },
    { label: form ? (form.controlNo || form.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const hasQuotation = Boolean(form?.confirmedQuotationId);
  const hasActiveService = Boolean(form?.confirmedActiveServiceId);

  const actions = useMemo(() => {
    if (!form) return [];
    return [
      {
        label: 'Export to PDF (SAF-01-002)',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-secondary',
        disabled: isDeleting,
      },
      ...(hasQuotation ? [
        {
          label: 'View Quotation',
          icon: 'fa-solid fa-file-invoice-dollar',
          onClick: () => navigate(`/operator/quotations/${form.confirmedQuotationId}`),
          className: 'btn-primary',
          disabled: isDeleting,
          style: { background: 'var(--purple, #7c3aed)' }
        }
      ] : [
        {
          label: form.serviceId ? 'Change Attached Service' : 'Attach Catalog Service',
          icon: 'fa-solid fa-link',
          onClick: () => {
            if (form.serviceId) setSelectedServiceId(form.serviceId);
            setShowAttachModal(true);
          },
          className: 'btn-secondary',
          disabled: isDeleting,
        },
        {
          label: 'Create Quotation',
          icon: 'fa-solid fa-file-invoice-dollar',
          onClick: () => {
            if (!form.serviceId) {
              addToast('Please attach a catalog service to this inquiry before creating a quotation.', 'warning');
              setShowAttachModal(true);
              return;
            }
            setShowCreateQuoteModal(true);
          },
          className: 'btn-primary',
          disabled: isDeleting,
          style: { background: 'var(--purple, #7c3aed)' }
        }
      ]),
      {
        label: 'Delete Inquiry',
        icon: 'fa-solid fa-trash',
        onClick: () => setShowDeleteConfirm(true),
        className: 'btn-danger',
        disabled: isDeleting,
      },
    ];
  }, [form, isDeleting, hasQuotation, navigate]);

  const getStatusBadgeType = () => {
    const st = (form?.status || '').toLowerCase();
    if (st === 'accepted' || st === 'confirmed') return 'success';
    if (st === 'quotation_created' || st === 'quotation_sent') return 'purple';
    if (st === 'submitted') return 'warning';
    if (st === 'rejected' || st === 'cancelled') return 'danger';
    return 'neutral';
  };


  const isConfirmed = ['confirmed', 'accepted', 'quotation_created', 'quotation_sent'].includes((form?.status || '').toLowerCase());

  return (
    <RecordDetailLayout
      title={form?.fullName || form?.clientName || 'Client Inquiry Intake'}
      subtitle={form?.serviceType || 'Service Inquiry'}
      status={(form?.status || 'PENDING').toUpperCase()}
      statusType={getStatusBadgeType()}
      breadcrumbs={breadcrumbs}
      backTo="/operator/inquiry-forms"
      backLabel="Back to Inquiry Forms"
      actions={form ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !form}
      notFoundMessage="The inquiry intake form could not be found."
    >
      {form && (
        <div className="inquiry-detail-wrapper">
          {/* Attached Service Status Banner */}
          {form.serviceId && !hasQuotation && (
            <div className="inquiry-confirmed-banner" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-primary, #6366f1)' }}>
                  <i className="fa-solid fa-link"></i>
                </div>
                <div>
                  <h3 className="inquiry-confirmed-title" style={{ color: 'var(--brand-primary, #4338ca)' }}>
                    Linked Service: {form.serviceType || 'Catalog Service'}
                  </h3>
                  <p className="inquiry-confirmed-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                    Service linked and ready for quotation. You can change the service or proceed directly to creating the commercial quotation.
                  </p>
                </div>
              </div>
              <div className="inquiry-confirmed-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedServiceId(form.serviceId);
                    setShowAttachModal(true);
                  }}
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Change Service</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateQuoteModal(true)}
                  style={{ background: 'var(--purple, #7c3aed)', color: '#fff' }}
                >
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                  <span>Create Quotation</span>
                </button>
              </div>
            </div>
          )}

          {/* Unattached Service Prompt Banner */}
          {!form.serviceId && !hasQuotation && (
            <div className="inquiry-confirmed-banner" style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-primary, #6366f1)' }}>
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <h3 className="inquiry-confirmed-title" style={{ color: 'var(--brand-primary, #4338ca)' }}>
                    No Catalog Service Attached
                  </h3>
                  <p className="inquiry-confirmed-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                    This inquiry has no linked service. Attach a catalog service to proceed to quotation creation.
                  </p>
                </div>
              </div>
              <div className="inquiry-confirmed-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAttachModal(true)}
                  style={{ background: 'var(--brand-primary, #6366f1)', color: '#fff' }}
                >
                  <i className="fa-solid fa-link"></i>
                  <span>Attach Catalog Service</span>
                </button>
              </div>
            </div>
          )}

          {/* Status / Cross-Reference Banner */}
          {(hasQuotation || hasActiveService) && (
            <div className="inquiry-confirmed-banner">
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <h3 className="inquiry-confirmed-title">
                    {hasActiveService ? 'Inquiry Accepted & Active Service In Progress' : 'Quotation Prepared & Linked'}
                  </h3>
                  <p className="inquiry-confirmed-sub">
                    {hasActiveService
                      ? 'This inquiry has been accepted and converted into an active tracking service with sequential milestones.'
                      : 'An official quotation (ADF-07-001) has been created from this inquiry.'}
                  </p>
                </div>
              </div>

              <div className="inquiry-confirmed-actions">
                {form.confirmedQuotationId && (
                  <Link
                    to={`/operator/quotations/${form.confirmedQuotationId}`}
                    className="btn btn-secondary inquiry-action-link"
                  >
                    <i className="fa-solid fa-file-invoice-dollar inquiry-icon-purple"></i>
                    <span>View Quotation (ADF-07-001)</span>
                  </Link>
                )}

                {form.confirmedActiveServiceId && (
                  <Link
                    to={`/operator/ongoing-services/${form.confirmedActiveServiceId}`}
                    className="btn btn-primary inquiry-action-link primary"
                  >
                    <i className="fa-solid fa-gears"></i>
                    <span>View Ongoing Service</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Top Client & Service Row */}
          <div className="details-grid-2">
            {/* Client Profile Card */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tag"></i> Client Profile & Contact
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client / Company Name</span>
                  <span className="detail-value detail-value-bold">{form.fullName || form.clientName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{form.contactPerson || form.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cellphone Number</span>
                  <span className="detail-value">{form.phoneNumber || form.cellphone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telephone No.</span>
                  <span className="detail-value">{form.telNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{form.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Complete Address</span>
                  <span className="detail-value">{form.address || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Service & Branch Attribution Card */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-file-invoice"></i> Service & Intake Meta (SAF-01-002)
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Form Reference No.</span>
                  <span className="detail-value text-mono detail-value-purple">{form.formNo || 'SAF-01-002'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Control No.</span>
                  <span className="detail-value text-mono detail-value-bold">{form.controlNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Services Offered</span>
                  <div className="inquiry-services-tags-wrap">
                    {Array.isArray(form.servicesOffered) && form.servicesOffered.length > 0 ? (
                      form.servicesOffered.map((svc) => (
                        <span key={svc} className="inquiry-service-badge">
                          <i className="fa-solid fa-check"></i>
                          {svc}
                        </span>
                      ))
                    ) : (
                      <span className="detail-value">{form.serviceType || 'General Inquiry'}</span>
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Title / Catalog Link</span>
                  <span className="detail-value detail-value-semibold">{form.serviceType || 'Custom Request'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branch Received From</span>
                  <span className="detail-value detail-value-indigo">
                    {form.branchName || 'Main Branch Office'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date Inquired</span>
                  <span className="detail-value">{form.dateInquired || (form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Population / Pax Count</span>
                  <span className="detail-value">{form.population || 'N/A'}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Specified Requirements of Client (SAF-01-002 Section 2) */}
          <article className="card detail-panel">
            <h2 className="panel-title inquiry-panel-title-row">
              <span>
                <i className="fa-solid fa-clipboard-list inquiry-panel-title-icon"></i>
                Specified Requirements
              </span>
              <span className="inquiry-saf-badge">
                SAF-01-002 Col 2
              </span>
            </h2>
            <div className="inquiry-specs-box">
              <p className="inquiry-specs-text">
                {form.specifiedRequirements || parsedData.requirementsText}
              </p>
            </div>

          </article>


          {/* Remarks & Signatures Row */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-comment-dots"></i> Inquiry Remarks & Notes
              </h2>
              <p className="inquiry-text inquiry-preline-text">
                {parsedData.remarksText}
              </p>
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-signature"></i> Sign-off Information
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Agent Name</span>
                  <span className="detail-value font-medium">{form.agentName || 'Operator'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Agent Signature</span>
                  <span className="detail-value">{form.agentSignature || 'Signed electronically'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Acknowledged By</span>
                  <span className="detail-value">{form.acknowledgedBy || 'Pending supervisor acknowledgement'}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => !isDeleting && setShowDeleteConfirm(false)}
            Icon={TrashIcon}
            Title="Delete this inquiry form?"
            Desc={`"${form.formNo || 'Inquiry Form'}" will be permanently deleted. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Inquiry"
            isLoading={isDeleting}
            OnConfirm={handleDelete}
          />

          {/* Create Quotation Modal */}
          <CreateQuotationModal
            isOpen={showCreateQuoteModal}
            onClose={() => setShowCreateQuoteModal(false)}
            initialData={form}
            onQuotationCreated={(created) => {
              if (created?.id) {
                navigate(`/operator/quotations/${created.id}`);
              }
            }}
          />

          {/* PDF Preview & Export Modal */}
          <PdfDocumentView
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            type="inquiry"
            data={form}
          />

          {/* Attach / Change Catalog Service Modal */}
          <BaseModal
            isOpen={showAttachModal}
            onClose={() => !isAttaching && setShowAttachModal(false)}
            maxWidth="60rem"
            width="95%"
            title={form.serviceId ? 'Change Attached Catalog Service' : 'Attach Catalog Service to Inquiry'}
            subtitle={`Inquiry ${form.controlNo || form.id.substring(0, 8)} · ${form.clientName || 'Client'}`}
            isLoading={isAttaching}
          >
            <div className="attach-service-modal-body" style={{ padding: '0.5rem 0' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
                  Select Catalog Service *
                </label>
                <select
                  className="form-input"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  disabled={isAttaching || activeServices.length === 0}
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  {activeServices.length === 0 ? (
                    <option value="">No active services available</option>
                  ) : (
                    activeServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} — {svc.price || (svc.baseFee ? `₱${svc.baseFee}` : 'Free')}
                      </option>
                    ))
                  )}
                </select>
                <small style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                  Attaching a service links standard pricing, inclusions, and allows you to create the quotation.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttachModal(false)}
                  disabled={isAttaching}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAttachService}
                  disabled={isAttaching || !selectedServiceId}
                  style={{ background: 'var(--brand-primary, #6366f1)' }}
                >
                  {isAttaching ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                  ) : form.serviceId ? (
                    <><i className="fa-solid fa-check"></i> Update Service</>
                  ) : (
                    <><i className="fa-solid fa-link"></i> Attach Service</>
                  )}
                </button>
              </div>
            </div>
          </BaseModal>
        </div>
      )}
    </RecordDetailLayout>
  );
}
