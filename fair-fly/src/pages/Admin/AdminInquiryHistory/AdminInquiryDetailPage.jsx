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
    { label: inquiry ? (inquiry.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const isConfirmed = (inquiry?.status || '').toLowerCase() === 'confirmed';

  const actions = useMemo(() => {
    if (!inquiry) return [];
    return [
      {
        label: 'Export to PDF',
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

  return (
    <RecordDetailLayout
      title={inquiry?.fullName || inquiry?.clientName || 'Inquiry Record Profile'}
      subtitle={inquiry?.serviceType || 'Service Inquiry'}
      status={(inquiry?.status || 'PENDING').toUpperCase()}
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
                <span className="inquiry-status-pill confirmed" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}>
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
                  <span className="detail-value" style={{ fontWeight: 700 }}>{inquiry.fullName || inquiry.clientName || 'N/A'}</span>
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
                  <span className="detail-value" style={{ fontWeight: 700, color: 'var(--purple)' }}>
                    <i className="fa-solid fa-location-dot" style={{ marginRight: '0.35rem' }}></i>
                    {inquiry.branchName || inquiry.preferredBranchLocation || 'Main Branch Office'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Form Reference No.</span>
                  <span className="detail-value text-mono" style={{ fontWeight: 700 }}>{inquiry.formNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Control No.</span>
                  <span className="detail-value text-mono">{inquiry.controlNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Requested</span>
                  <span className="detail-value" style={{ fontWeight: 600 }}>{inquiry.serviceType || 'General Inquiry'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Package Fee / Price</span>
                  <span className="detail-value text-purple">{inquiry.servicePrice || 'N/A'}</span>
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

          {/* Requirements & Documents */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-solid fa-list-check"></i> Service Requirements & Uploaded Attachments
            </h2>
            
            {parsedData.requirementsList.length > 0 ? (
              <div className="inquiry-reqs-list">
                {parsedData.requirementsList.map((req, idx) => {
                  const hasFile = Boolean(req.file?.url);
                  const isTextDone = Boolean(req.value);
                  const isComplete = hasFile || isTextDone;

                  return (
                    <div key={idx} className={`inquiry-req-card ${isComplete ? 'is-uploaded' : ''}`}>
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

                      <div>
                        {hasFile ? (
                          <a
                            href={req.file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inquiry-doc-badge valid"
                            style={{ textDecoration: 'none' }}
                          >
                            <i className="fa-solid fa-file-check"></i>
                            <span>{req.file.fileName || 'View Client Document'}</span>
                          </a>
                        ) : isTextDone ? (
                          <span className="inquiry-doc-badge valid">
                            <i className="fa-solid fa-check"></i> Completed
                          </span>
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
                <i className="fa-regular fa-comment-dots"></i> Remarks & Internal Notes
              </h2>
              <p className="inquiry-text" style={{ whiteSpace: 'pre-line' }}>
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
