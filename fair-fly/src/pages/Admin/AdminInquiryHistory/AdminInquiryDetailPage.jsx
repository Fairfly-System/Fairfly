import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import { deleteInquiry } from '../../../services/inquiryService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './admin-inquiry-history.css';
import '../../Operator/OperatorInquiryForms/inquiry-form-detail.css';

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

export default function AdminInquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: rawInquiries, loading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const inquiry = useMemo(() => {
    if (!rawInquiries || !id) return null;
    return rawInquiries.find((i) => i.id === id) || null;
  }, [rawInquiries, id]);

  const parsedData = useMemo(() => {
    return parseInquiryData(inquiry);
  }, [inquiry]);

  const handleDelete = async () => {
    if (!inquiry) return;
    deleteInquiry(
      userToken,
      inquiry.id,
      () => {
        addToast('Inquiry record deleted successfully', 'success');
        setShowDeleteConfirm(false);
        navigate('/admin/inquiry-history');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to delete inquiry record'), 'error');
      },
      setIsDeleting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Inquiry Requests History', to: '/admin/inquiry-history' },
    { label: inquiry ? (inquiry.controlNo || inquiry.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!inquiry) return [];
    return [
      {
        label: 'Export to PDF (SAF-01-002)',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-primary',
        disabled: isDeleting,
        style: { background: 'var(--purple, #7c3aed)' }
      },
      {
        label: 'Delete Record',
        icon: 'fa-solid fa-trash',
        onClick: () => setShowDeleteConfirm(true),
        className: 'btn-danger',
        disabled: isDeleting,
      },
    ];
  }, [inquiry, isDeleting]);

  const isConfirmed = ['confirmed', 'accepted', 'quotation_created'].includes((inquiry?.status || '').toLowerCase());

  return (
    <RecordDetailLayout
      title={inquiry?.fullName || inquiry?.clientName || 'Inquiry Record Profile'}
      subtitle={inquiry?.serviceType || 'Service Inquiry'}
      status={(inquiry?.status || 'SUBMITTED').toUpperCase()}
      statusType={isConfirmed ? 'success' : 'warning'}
      breadcrumbs={breadcrumbs}
      backTo="/admin/inquiry-history"
      backLabel="Back to Inquiry History"
      actions={inquiry ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !inquiry}
      notFoundMessage="The inquiry request history record could not be found."
    >
      {inquiry && (
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
                    This inquiry has been verified and converted to an official Quotation and Ongoing Service in branch: <strong>{inquiry.branchName || 'Branch Office'}</strong>.
                  </p>
                </div>
              </div>

              <div className="inquiry-confirmed-actions">
                <span className="inquiry-status-pill confirmed inquiry-status-pill-padded">
                  <i className="fa-solid fa-circle-check"></i> Transferred to Ongoing Service
                </span>
              </div>
            </div>
          )}

          {/* Top Client & Branch Card Row */}
          <div className="details-grid-2">
            {/* Client Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tag"></i> Client / Company Information
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client / Company Name</span>
                  <span className="detail-value detail-value-bold">{inquiry.fullName || inquiry.clientName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{inquiry.contactPerson || inquiry.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cellphone Number</span>
                  <span className="detail-value">{inquiry.phoneNumber || inquiry.cellphone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telephone No.</span>
                  <span className="detail-value">{inquiry.telNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{inquiry.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Complete Address</span>
                  <span className="detail-value">{inquiry.address || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Service & Branch Attribution Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-code-branch"></i> Branch & Intake Specifications
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Branch Received From</span>
                  <span className="detail-value detail-value-purple">
                    <i className="fa-solid fa-location-dot inquiry-icon-margin"></i>
                    {inquiry.branchName || inquiry.preferredBranchLocation || 'Main Branch Office'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Form Reference No.</span>
                  <span className="detail-value text-mono detail-value-purple">{inquiry.formNo || 'SAF-01-002'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Control No.</span>
                  <span className="detail-value text-mono detail-value-bold">{inquiry.controlNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Services Offered</span>
                  <div className="inquiry-services-tags-wrap">
                    {Array.isArray(inquiry.servicesOffered) && inquiry.servicesOffered.length > 0 ? (
                      inquiry.servicesOffered.map((svc) => (
                        <span key={svc} className="inquiry-service-badge">
                          <i className="fa-solid fa-check"></i>
                          {svc}
                        </span>
                      ))
                    ) : (
                      <span className="detail-value">{inquiry.serviceType || 'General Inquiry'}</span>
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Title / Catalog Link</span>
                  <span className="detail-value detail-value-semibold">{inquiry.serviceType || 'Custom Request'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date Inquired</span>
                  <span className="detail-value">{inquiry.dateInquired || (inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : 'N/A')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Population / Pax</span>
                  <span className="detail-value">{inquiry.population || 'N/A'}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Specified Requirements of Client (SAF-01-002 Col 2) */}
          <article className="card detail-panel inquiry-specs-card">
            <h2 className="panel-title inquiry-panel-title-row">
              <span>
                <i className="fa-solid fa-clipboard-list inquiry-panel-title-icon"></i>
                Specified Requirements of Client (What the Client Wants)
              </span>
              <span className="inquiry-saf-badge">
                SAF-01-002 Col 2
              </span>
            </h2>
            <div className="inquiry-specs-box">
              <p className="inquiry-specs-text">
                {inquiry.specifiedRequirements || parsedData.requirementsText}
              </p>
            </div>

            {/* Optional Attachments if any */}
            {parsedData.requirementsList.length > 0 && (
              <div className="inquiry-attachments-container">
                <h4 className="inquiry-attachments-header">
                  Document Attachments
                </h4>
                <div className="inquiry-reqs-list">
                  {parsedData.requirementsList.map((req, idx) => {
                    const hasFile = Boolean(req.file?.url);
                    const isComplete = hasFile;

                    return (
                      <div key={idx} className={`inquiry-req-card ${isComplete ? 'is-uploaded' : ''}`}>
                        <div>
                          <div className="inquiry-req-title">
                            <span>{req.name || `Requirement ${idx + 1}`}</span>
                          </div>
                        </div>

                        <div>
                          {hasFile ? (
                            <a
                              href={req.file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inquiry-doc-badge valid inquiry-action-link"
                            >
                              <i className="fa-solid fa-file-check"></i>
                              <span>{req.file.fileName || 'View Client Document'}</span>
                            </a>
                          ) : (
                            <span className="inquiry-doc-badge missing">
                              <i className="fa-solid fa-triangle-exclamation"></i> Missing Document
                            </span>
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
                <i className="fa-regular fa-comment-dots"></i> Remarks & Internal Notes
              </h2>
              <p className="inquiry-text inquiry-preline-text">
                {parsedData.remarksText}
              </p>
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-signature"></i> Signatures & Intake Attribution
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Agent / Operator Name</span>
                  <span className="detail-value font-medium">{inquiry.agentName || 'Operator'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Agent Signature</span>
                  <span className="detail-value">{inquiry.agentSignature || 'Signed electronically'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Acknowledged By</span>
                  <span className="detail-value">{inquiry.acknowledgedBy || 'Supervisor / Manager'}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Delete confirmation */}
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => !isDeleting && setShowDeleteConfirm(false)}
            Icon={TrashIcon}
            Title="Delete this inquiry record?"
            Desc={`"${inquiry.formNo || 'Inquiry Form'}" will be permanently deleted. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Record"
            isLoading={isDeleting}
            OnConfirm={handleDelete}
          />

          {/* PDF Preview & Export Modal */}
          <PdfDocumentView
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            type="inquiry"
            data={inquiry}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
