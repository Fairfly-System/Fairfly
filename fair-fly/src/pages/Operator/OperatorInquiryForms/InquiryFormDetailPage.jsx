import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import { confirmInquiry, updateInquiry, deleteInquiry } from '../../../services/inquiryService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './inquiry-form-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

// Helper to safely parse requirements and remarks across all legacy and new inquiry formats
function parseInquiryData(inquiry) {
  if (!inquiry) return { requirementsList: [], requirementsText: '', remarksText: '' };

  let requirementsList = [];
  let requirementsText = '';
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
  } else if (typeof inquiry.requirements === 'string' && inquiry.requirements.trim()) {
    requirementsText = inquiry.requirements.trim();
  } else if (typeof inquiry.requirements === 'object' && inquiry.requirements !== null) {
    if (inquiry.requirements.name || inquiry.requirements.title) {
      requirementsList = [{
        id: inquiry.requirements.id || 'req_0',
        name: inquiry.requirements.name || inquiry.requirements.title,
        required: inquiry.requirements.required !== false,
        file: inquiry.requirements.file || null,
        value: typeof inquiry.requirements.value === 'object' ? JSON.stringify(inquiry.requirements.value) : (inquiry.requirements.value || '')
      }];
    } else {
      requirementsText = Object.entries(inquiry.requirements)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
    }
  }

  // 2. Parse Remarks
  if (typeof inquiry.remarks === 'string' && inquiry.remarks.trim()) {
    remarksText = inquiry.remarks.trim();
  } else if (typeof inquiry.remarks === 'object' && inquiry.remarks !== null) {
    remarksText = Object.entries(inquiry.remarks)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  // 3. Fallback to notes / details (Legacy format parser: "Requirements | Remarks: ...")
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
  } else if (typeof inquiry.notes === 'object' && inquiry.notes !== null) {
    if (!requirementsText && requirementsList.length === 0) {
      requirementsText = Object.entries(inquiry.notes)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
    }
  }

  return {
    requirementsList,
    requirementsText: requirementsText || (requirementsList.length === 0 ? 'Standard service requirements.' : ''),
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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

  const handleConfirmInquiry = () => {
    if (!form) return;

    // Check mandatory requirements
    const reqs = parsedData.requirementsList;
    const missing = reqs.filter(r => {
      if (r.required !== false) {
        return !r.file?.url && (!r.value || !r.value.trim());
      }
      return false;
    });

    if (missing.length > 0) {
      const names = missing.map(m => m.name || m.title || 'Required Document').join(', ');
      addToast(`Cannot confirm: Please upload or complete the required document(s): ${names}`, 'error');
      return;
    }

    setIsConfirming(true);
    confirmInquiry(
      userToken,
      form.id,
      (res) => {
        setIsConfirming(false);
        addToast('Inquiry confirmed successfully! Quotation created and Active Service initialized.', 'success');
      },
      (err) => {
        setIsConfirming(false);
        addToast(toFriendlyMessage(err, 'Failed to confirm inquiry'), 'error');
      },
      setIsConfirming
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
    { label: form ? (form.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const isConfirmed = (form?.status || '').toLowerCase() === 'confirmed';

  const actions = useMemo(() => {
    if (!form) return [];
    return [
      {
        label: 'Export to PDF',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-secondary',
        disabled: isDeleting || isConfirming,
      },
      ...(!isConfirmed ? [
        {
          label: isConfirming ? 'Confirming...' : 'Confirm Inquiry',
          icon: isConfirming ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check-circle',
          onClick: handleConfirmInquiry,
          className: 'btn-primary',
          disabled: isDeleting || isConfirming,
          style: { background: 'var(--purple, #7c3aed)' }
        }
      ] : []),
      {
        label: 'Delete Inquiry',
        icon: 'fa-solid fa-trash',
        onClick: () => setShowDeleteConfirm(true),
        className: 'btn-danger',
        disabled: isDeleting || isConfirming,
      },
    ];
  }, [form, isDeleting, isConfirming, isConfirmed]);

  return (
    <RecordDetailLayout
      title={form?.fullName || form?.clientName || 'Client Inquiry Intake'}
      subtitle={form?.serviceType || 'Service Inquiry'}
      status={(form?.status || 'PENDING').toUpperCase()}
      statusType={isConfirmed ? 'success' : 'warning'}
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
          {/* Confirmed Cross-Reference Banner */}
          {isConfirmed && (
            <div className="inquiry-confirmed-banner">
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <h3 className="inquiry-confirmed-title">Inquiry Confirmed & Transferred</h3>
                  <p className="inquiry-confirmed-sub">
                    This inquiry has been converted to an official Quotation and an Active Ongoing Service has been initialized in your branch.
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
                    <span>View Quotation</span>
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
                <i className="fa-solid fa-file-invoice"></i> Service & Intake Meta
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Form Reference No.</span>
                  <span className="detail-value text-mono" style={{ fontWeight: 700, color: 'var(--purple)' }}>{form.formNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Control No.</span>
                  <span className="detail-value text-mono">{form.controlNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Requested</span>
                  <span className="detail-value" style={{ fontWeight: 700 }}>{form.serviceType || 'General Inquiry'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Package Fee / Price</span>
                  <span className="detail-value text-purple">{form.servicePrice || 'N/A'}</span>
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

          {/* Requirements Checklist & Document Attachments */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-solid fa-list-check"></i> Service Requirements & Uploaded Documents
            </h2>
            
            {parsedData.requirementsList.length > 0 ? (
              <div className="inquiry-reqs-list">
                {parsedData.requirementsList.map((req, idx) => {
                  const reqKey = req.id || `req_${idx}`;
                  const hasFile = Boolean(req.file?.url);
                  const isTextDone = Boolean(req.value);
                  const isComplete = hasFile || isTextDone;

                  return (
                    <div key={reqKey} className={`inquiry-req-card ${isComplete ? 'is-uploaded' : ''}`}>
                      <div>
                        <div className="inquiry-req-title">
                          <span>{req.name || `Requirement ${idx + 1}`}</span>
                          {req.required !== false && <span style={{ color: 'var(--red)', fontSize: '0.75rem' }}>(Required)</span>}
                        </div>
                        {req.value && (
                          <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                            <strong>Value:</strong> {req.value}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {hasFile ? (
                          <>
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
                            {!isConfirmed && (
                              <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                <i className={uploadingReqId === reqKey ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-pen'}></i>
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
                          </>
                        ) : isTextDone ? (
                          <span className="inquiry-doc-badge valid">
                            <i className="fa-solid fa-check"></i> Completed
                          </span>
                        ) : (
                          <>
                            <span className="inquiry-doc-badge missing">
                              <i className="fa-solid fa-triangle-exclamation"></i> Missing Document
                            </span>
                            {!isConfirmed && (
                              <label className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: 'var(--purple)', cursor: 'pointer' }}>
                                <i className={uploadingReqId === reqKey ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'}></i>
                                <span>{uploadingReqId === reqKey ? 'Uploading...' : 'Upload Now'}</span>
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="inquiry-text" style={{ whiteSpace: 'pre-line' }}>
                {parsedData.requirementsText}
              </p>
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
