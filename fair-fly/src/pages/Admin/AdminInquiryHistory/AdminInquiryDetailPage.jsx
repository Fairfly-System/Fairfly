import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import { archiveInquiry, restoreInquiry } from '../../../services/inquiryService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './admin-inquiry-history.css';
import '../../Operator/OperatorInquiryForms/inquiry-form-detail.css';

// Helper to safely parse requirements and remarks across all legacy and new inquiry formats
function parseInquiryData(inquiry) {
  if (!inquiry) return { requirementsText: '', remarksText: '' };

  let requirementsText = inquiry.specifiedRequirements || '';
  let remarksText = '';

  // 1. Fallback to string requirements if not specifiedRequirements
  if (!requirementsText && typeof inquiry.requirements === 'string' && inquiry.requirements.trim()) {
    requirementsText = inquiry.requirements.trim();
  }

  // 2. Parse Client Remarks / Notes
  const rawRemarks = inquiry.clientRemarks || inquiry.remarks || (inquiry.notes !== inquiry.specifiedRequirements ? inquiry.notes : '');
  if (typeof rawRemarks === 'string' && rawRemarks.trim()) {
    remarksText = rawRemarks.trim();
  } else if (typeof rawRemarks === 'object' && rawRemarks !== null) {
    remarksText = Object.entries(rawRemarks)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  // 3. Fallback to notes / details (Legacy format parser)
  const legacyRaw = typeof inquiry.notes === 'string' ? inquiry.notes : typeof inquiry.details === 'string' ? inquiry.details : '';
  if (legacyRaw) {
    if (legacyRaw.includes(' | Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split(' | Remarks: ');
      if (!requirementsText) requirementsText = reqPart.trim();
      if (!remarksText && remPart) remarksText = remPart.trim();
    } else if (legacyRaw.includes('Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split('Remarks: ');
      if (!requirementsText) requirementsText = reqPart.trim();
      if (!remarksText && remPart) remarksText = remPart.trim();
    } else {
      if (!requirementsText) requirementsText = legacyRaw.trim();
    }
  }

  return {
    requirementsText: requirementsText || 'No specific client requirements provided.',
    remarksText: remarksText || 'No additional remarks recorded.'
  };
}

export default function AdminInquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Directly subscribe to the specific inquiry document
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(firestore, 'inquiries', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setInquiry({ id: docSnap.id, ...docSnap.data() });
        } else {
          setInquiry(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[AdminInquiryDetailPage] Document error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const parsedData = useMemo(() => {
    return parseInquiryData(inquiry);
  }, [inquiry]);

  const isArchived = Boolean(inquiry?.archived);

  const handleArchive = async () => {
    if (!inquiry) return;
    archiveInquiry(
      userToken,
      inquiry.id,
      () => {
        addToast('Inquiry record and associated quotations archived successfully', 'success');
        setShowArchiveConfirm(false);
        navigate('/admin/inquiry-history');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to archive inquiry record'), 'error');
      },
      setIsArchiving
    );
  };

  const handleRestore = async () => {
    if (!inquiry) return;
    restoreInquiry(
      userToken,
      inquiry.id,
      () => {
        addToast('Inquiry record and linked quotations restored to active records', 'success');
        setShowRestoreConfirm(false);
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to restore inquiry record'), 'error');
      },
      setIsRestoring
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Inquiry Requests History', to: '/admin/inquiry-history' },
    { label: inquiry ? (inquiry.controlNo || inquiry.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!inquiry) return [];

    if (isArchived) {
      return [
        {
          label: 'Export to PDF (SAF-01-002)',
          icon: 'fa-solid fa-file-pdf',
          onClick: () => setShowPdfModal(true),
          className: 'btn-secondary',
          disabled: isRestoring,
        },
        {
          label: 'Restore Record',
          icon: 'fa-solid fa-rotate-left',
          onClick: () => setShowRestoreConfirm(true),
          className: 'btn-primary',
          disabled: isRestoring,
          style: { background: 'var(--brand-primary, #6366f1)' }
        }
      ];
    }

    return [
      {
        label: 'Export to PDF (SAF-01-002)',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-primary',
        disabled: isArchiving,
        style: { background: 'var(--purple, #7c3aed)' }
      },
      {
        label: 'Archive Record',
        icon: 'fa-solid fa-box-archive',
        onClick: () => setShowArchiveConfirm(true),
        className: 'btn-secondary',
        disabled: isArchiving,
      },
    ];
  }, [inquiry, isArchived, isArchiving, isRestoring]);

  const isConfirmed = ['confirmed', 'accepted', 'quotation_created'].includes((inquiry?.status || '').toLowerCase());

  return (
    <RecordDetailLayout
      title={inquiry?.fullName || inquiry?.clientName || 'Inquiry Record Profile'}
      subtitle={inquiry?.serviceType || 'Service Inquiry'}
      status={isArchived ? 'ARCHIVED' : (inquiry?.status || 'SUBMITTED').toUpperCase()}
      statusType={isArchived ? 'neutral' : (isConfirmed ? 'success' : 'warning')}
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

          {/* Archived Status Banner */}
          {isArchived && (
            <div className="inquiry-confirmed-banner" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <i className="fa-solid fa-box-archive"></i>
                </div>
                <div>
                  <h3 className="inquiry-confirmed-title" style={{ color: '#334155' }}>
                    This Inquiry Record is Archived
                  </h3>
                  <p className="inquiry-confirmed-sub" style={{ color: '#64748b' }}>
                    Archived records are hidden from active lists. Associated quotations are also archived. You can restore this inquiry at any time.
                  </p>
                </div>
              </div>
              <div className="inquiry-confirmed-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowRestoreConfirm(true)}
                  disabled={isRestoring}
                  style={{ background: 'var(--brand-primary, #6366f1)' }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Restore Record
                </button>
              </div>
            </div>
          )}

          {/* Confirmed Cross-Reference Banner */}
          {isConfirmed && !isArchived && (
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
                  <span className="detail-value detail-value-bold">{inquiry.clientName || inquiry.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{inquiry.contactPerson || inquiry.clientName || inquiry.fullName || 'N/A'}</span>
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
                Specified Requirements of Client
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
          </article>

          {/* Remarks & Signatures Row */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-comment-dots"></i> Client Remarks & Notes (SAF-01-002 Col 3)
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

          {/* Archive Confirmation Modal */}
          <ConfirmationModal
            isOpen={showArchiveConfirm}
            onClose={() => !isArchiving && setShowArchiveConfirm(false)}
            Icon={() => <i className="fa-solid fa-box-archive" style={{ color: 'var(--purple-dark, #4338ca)' }}></i>}
            Title="Archive this inquiry?"
            Desc="Archiving this inquiry will also archive its associated quotations. The records will remain available from the Archived view."
            BtnColor="var(--purple-dark, #4338ca)"
            confirmText="Archive Inquiry"
            isLoading={isArchiving}
            OnConfirm={handleArchive}
          />

          {/* Restore Confirmation Modal */}
          <ConfirmationModal
            isOpen={showRestoreConfirm}
            onClose={() => !isRestoring && setShowRestoreConfirm(false)}
            Icon={() => <i className="fa-solid fa-rotate-left" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>}
            Title="Restore this inquiry?"
            Desc="Restoring this inquiry will return it to active records and restore quotations that were archived with it."
            BtnColor="var(--brand-primary, #6366f1)"
            confirmText="Restore Record"
            isLoading={isRestoring}
            OnConfirm={handleRestore}
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
