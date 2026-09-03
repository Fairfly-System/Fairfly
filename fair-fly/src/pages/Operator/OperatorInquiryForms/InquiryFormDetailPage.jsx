import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import CreateQuotationModal from '../../../components/Operator/CreateQuotationModal/CreateQuotationModal';
import { updateInquiry, deleteInquiry } from '../../../services/inquiryService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './inquiry-form-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

// Helper to safely parse requirements and remarks across all legacy and new inquiry formats
function parseInquiryData(inquiry) {
  if (!inquiry) return { requirementsList: [], requirementsText: '', remarksText: '' };

  let requirementsList = [];
  let requirementsText = inquiry.specifiedRequirements || '';
  let remarksText = '';

  // 1. Parse Requirements
  if (Array.isArray(inquiry.requirements)) {
    requirementsList = inquiry.requirements.map((req, idx) => {
      if (typeof req === 'string') {
        return { id: `req_${idx}`, name: req, required: true, file: null, value: '' };
      }
      if (typeof req === 'object' && req !== null) {
        return {
          id: req.id || `req_${idx}`,
          name: req.name || req.title || `Requirement ${idx + 1}`,
          required: req.required !== false,
          file: req.file || null,
          value: typeof req.value === 'object' ? JSON.stringify(req.value) : (req.value || '')
        };
      }
      return { id: `req_${idx}`, name: String(req), required: true, file: null, value: '' };
    });
  } else if (!requirementsText && typeof inquiry.requirements === 'string' && inquiry.requirements.trim()) {
    requirementsText = inquiry.requirements.trim();
  }

  // 2. Parse Remarks
  if (typeof inquiry.remarks === 'string' && inquiry.remarks.trim()) {
    remarksText = inquiry.remarks.trim();
  } else if (typeof inquiry.remarks === 'object' && inquiry.remarks !== null) {
    remarksText = Object.entries(inquiry.remarks)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  // 3. Fallback to notes / details (Legacy format parser)
  const legacyRaw = typeof inquiry.notes === 'string' ? inquiry.notes : typeof inquiry.details === 'string' ? inquiry.details : '';
  if (legacyRaw) {
    if (legacyRaw.includes(' | Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split(' | Remarks: ');
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = reqPart.trim();
      }
      if (!remarksText && remPart) {
        remarksText = remPart.trim();
      }
    } else if (legacyRaw.includes('Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split('Remarks: ');
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = reqPart.trim();
      }
      if (!remarksText && remPart) {
        remarksText = remPart.trim();
      }
    } else {
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = legacyRaw.trim();
      }
    }
  }

  return {
    requirementsList,
    requirementsText: requirementsText || (requirementsList.length === 0 ? 'No specific client requirements provided.' : ''),
    remarksText: remarksText || 'No additional remarks recorded.'
  };
}

export default function InquiryFormDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: inquiryForms, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [uploadingReqId, setUploadingReqId] = useState(null);

  const form = useMemo(() => {
    if (!inquiryForms || !id) return null;
    return inquiryForms.find((f) => f.id === id) || null;
  }, [inquiryForms, id]);

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

  const handleUploadRequirement = async (reqId, file) => {
    if (!file || !form) return;
    setUploadingReqId(reqId);

    try {
      const uploadResult = await uploadFileToBackend(file, 'inquiry_requirements', userToken);
      const currentList = Array.isArray(form.requirements) ? form.requirements : parsedData.requirementsList;
      const updatedReqs = currentList.map(r => {
        if (r.id === reqId || r.name === reqId) {
          return {
            ...r,
            file: {
              url: uploadResult.url,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
              storagePath: uploadResult.storagePath
            },
            isUploaded: true
          };
        }
        return r;
      });

      updateInquiry(
        userToken,
        form.id,
        { requirements: updatedReqs },
        () => {
          addToast(`Uploaded "${file.name}" for requirement`, 'success');
          setUploadingReqId(null);
        },
        (err) => {
          setUploadingReqId(null);
          addToast(toFriendlyMessage(err, 'Failed to save uploaded document reference'), 'error');
        }
      );
    } catch (err) {
      setUploadingReqId(null);
      console.error('Error uploading requirement:', err);
      addToast(toFriendlyMessage(err, 'Failed to upload document file'), 'error');
    }
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
          label: 'Create Quotation',
          icon: 'fa-solid fa-file-invoice-dollar',
          onClick: () => setShowCreateQuoteModal(true),
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
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--purple)' }}></i>
                    <span>View Quotation (ADF-07-001)</span>
                  </Link>
                )}

                {form.confirmedActiveServiceId && (
                  <Link
                    to={`/operator/ongoing-services/${form.confirmedActiveServiceId}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', background: 'var(--purple)' }}
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
                  <span className="detail-value" style={{ fontWeight: 700 }}>{form.fullName || form.clientName || 'N/A'}</span>
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
                  <span className="detail-value text-mono" style={{ fontWeight: 700, color: 'var(--purple)' }}>{form.formNo || 'SAF-01-002'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Control No.</span>
                  <span className="detail-value text-mono" style={{ fontWeight: 700 }}>{form.controlNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Services Offered</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                    {Array.isArray(form.servicesOffered) && form.servicesOffered.length > 0 ? (
                      form.servicesOffered.map((svc) => (
                        <span key={svc} style={{ background: '#f5f3ff', color: 'var(--purple, #7c3aed)', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          <i className="fa-solid fa-check" style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}></i>
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
                  <span className="detail-value" style={{ fontWeight: 600 }}>{form.serviceType || 'Custom Request'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branch Received From</span>
                  <span className="detail-value" style={{ fontWeight: 600, color: '#4338ca' }}>
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
          <article className="card detail-panel" style={{ borderLeft: '4px solid var(--purple, #7c3aed)' }}>
            <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--purple)', marginRight: '0.4rem' }}></i>
                Specified Requirements
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f5f3ff', color: 'var(--purple)', borderRadius: '4px', fontWeight: 600 }}>
                SAF-01-002 Col 2
              </span>
            </h2>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', marginTop: '0.75rem' }}>
              <p className="inquiry-text" style={{ whiteSpace: 'pre-line', margin: 0, fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
                {form.specifiedRequirements || parsedData.requirementsText}
              </p>
            </div>

            {/* Optional Uploaded Document Attachments if present */}
            {parsedData.requirementsList.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Document Attachments
                </h4>
                <div className="inquiry-reqs-list">
                  {parsedData.requirementsList.map((req, idx) => {
                    const reqKey = req.id || `req_${idx}`;
                    const hasFile = Boolean(req.file?.url);
                    const isComplete = hasFile;

                    return (
                      <div key={reqKey} className={`inquiry-req-card ${isComplete ? 'is-uploaded' : ''}`}>
                        <div>
                          <div className="inquiry-req-title">
                            <span>{req.name || `Requirement ${idx + 1}`}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {hasFile ? (
                            <a
                              href={req.file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inquiry-doc-badge valid"
                              style={{ textDecoration: 'none' }}
                            >
                              <i className="fa-solid fa-file-check"></i>
                              <span>{req.file.fileName || 'View Document'}</span>
                            </a>
                          ) : (
                            <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              <i className={uploadingReqId === reqKey ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'}></i>
                              <span style={{ marginLeft: '0.3rem' }}>Attach</span>
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                disabled={uploadingReqId === reqKey}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadRequirement(reqKey, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>


          {/* Remarks & Signatures Row */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-comment-dots"></i> Inquiry Remarks & Notes
              </h2>
              <p className="inquiry-text" style={{ whiteSpace: 'pre-line' }}>
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
        </div>
      )}
    </RecordDetailLayout>
  );
}
