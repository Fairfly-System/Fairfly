import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { firestore } from '../../../firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import './admin-qualification-detail.css';

const ApproveIcon = (props) => <i className="fa-solid fa-certificate" {...props}></i>;
const RejectIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

const getDocumentIcon = (fileName = '', fileType = '') => {
  const lowerName = fileName.toLowerCase();
  const lowerType = fileType.toLowerCase();

  if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) {
    return { icon: 'fa-solid fa-file-pdf', color: '#ef4444' };
  }
  if (
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp') ||
    lowerType.includes('image')
  ) {
    return { icon: 'fa-solid fa-file-image', color: '#3b82f6' };
  }
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerType.includes('word')) {
    return { icon: 'fa-solid fa-file-word', color: '#2563eb' };
  }
  return { icon: 'fa-solid fa-file-lines', color: '#64748b' };
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function AdminQualificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cachedApplications, loading: contextLoading } = useAdminContext();
  const { userToken, userDetails, user } = useAuthContext();
  const { addToast } = useToast();

  const isSuperAdmin =
    userDetails?.isSuperAdmin === true ||
    userDetails?.email === 'admin@gmail.com' ||
    user?.email === 'admin@gmail.com';

  const [application, setApplication] = useState(() => {
    if (!cachedApplications || !id) return null;
    return cachedApplications.find((app) => app.id === id) || null;
  });
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(!application);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // 'approve' | 'reject' | null
  const [docToPreview, setDocToPreview] = useState(null);

  // Live performance stats for the operator
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [completedServicesCount, setCompletedServicesCount] = useState(0);

  // Live listener for application record
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(firestore, 'qualificationApplications', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setApplication(data);
          if (data.adminNotes) {
            setAdminNotes(data.adminNotes);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Error subscribing to qualification application:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Live listener for operator user document
  useEffect(() => {
    const operatorId = application?.operatorId;
    if (!operatorId) return;

    const unsub = onSnapshot(
      doc(firestore, 'users', operatorId),
      (docSnap) => {
        if (docSnap.exists()) {
          setOperator({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
        }
      },
      (err) => {
        console.warn('Error subscribing to operator profile:', err);
      }
    );

    return () => unsub();
  }, [application?.operatorId]);

  // Live listener for operator services count (Fulfilled & Active)
  useEffect(() => {
    const opId = application?.operatorId;
    if (!opId) return;

    const unsubServices = onSnapshot(
      collection(firestore, 'activeServices'),
      (snapshot) => {
        let active = 0;
        let completed = 0;

        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (data.operatorId === opId || data.branchUid === opId) {
            const st = (data.status || '').toLowerCase();
            if (st === 'completed') {
              completed++;
            } else if (st !== 'cancelled') {
              active++;
            }
          }
        });

        setActiveServicesCount(active);
        setCompletedServicesCount(completed);
      },
      (err) => {
        console.warn('Error calculating operator live services:', err);
      }
    );

    return () => unsubServices();
  }, [application?.operatorId]);

  // Handle Review (Approve / Reject)
  const handleReviewSubmit = async (status) => {
    if (!application) return;

    ApiCaller(
      `${API_BASE_URL}/api/qualifications/${application.id}/review`,
      'PATCH',
      { status, adminNotes },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(
          `Qualification application for ${application.branchName || 'Operator'} ${
            status === 'approved' ? 'approved' : 'rejected'
          } successfully`,
          status === 'approved' ? 'success' : 'info'
        );
        setConfirmState(null);
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update qualification application status.'), 'error');
      },
      setIsSubmitting
    );
  };

  // Document action handlers
  const handleViewDoc = (docItem) => {
    if (!docItem?.url) return;
    const lowerName = (docItem.name || '').toLowerCase();
    const isImage =
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp');
    const isPdf = lowerName.endsWith('.pdf');

    if (isImage || isPdf) {
      setDocToPreview(docItem);
    } else {
      window.open(docItem.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrintDoc = (docItem) => {
    if (!docItem?.url) return;
    const printWindow = window.open(docItem.url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.warn('Direct print command not permitted across origins, user can print in tab:', err);
        }
      });
    }
  };

  const handleDownloadDoc = async (docItem) => {
    if (!docItem?.url) return;
    try {
      addToast(`Downloading ${docItem.name}...`, 'info');
      const res = await fetch(docItem.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = docItem.name || 'qualification-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      addToast(`Downloaded ${docItem.name}`, 'success');
    } catch (err) {
      console.warn('Direct blob fetch failed, falling back to window navigation download:', err);
      const link = document.createElement('a');
      link.href = docItem.url;
      link.target = '_blank';
      link.download = docItem.name || 'qualification-document';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Qualifications', to: '/admin/qualifications' },
    { label: application?.branchName || 'Application Details' }
  ];

  const getStatusType = () => {
    if (!application) return 'neutral';
    switch (application.status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const headerActions = useMemo(() => {
    const actions = [];
    if (application?.operatorId) {
      actions.push({
        label: 'View Operator Account',
        icon: 'fa-solid fa-arrow-up-right-from-square',
        onClick: () => navigate(`/admin/operators/${application.operatorId}`),
        className: 'btn-secondary'
      });
    }

    if (isSuperAdmin && application?.status === 'pending') {
      actions.push(
        {
          label: 'Approve Qualification',
          icon: 'fa-solid fa-certificate',
          onClick: () => setConfirmState('approve'),
          className: 'btn-primary',
          disabled: isSubmitting
        },
        {
          label: 'Reject Application',
          icon: 'fa-solid fa-ban',
          onClick: () => setConfirmState('reject'),
          className: 'btn-danger',
          disabled: isSubmitting
        }
      );
    }

    return actions;
  }, [application, isSuperAdmin, isSubmitting, navigate]);

  const documents = Array.isArray(application?.documents) ? application.documents : [];
  const branchRevenue = Number(operator?.totalRevenue) || 0;

  return (
    <RecordDetailLayout
      title={application?.branchName || 'Qualification Application'}
      subtitle={application?.operatorName ? `${application.operatorName} • ${application.email || 'N/A'}` : 'Branch Review'}
      status={application?.status ? application.status.toUpperCase() : 'PENDING'}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo="/admin/qualifications"
      backLabel="Back to Qualifications"
      actions={headerActions}
      isLoading={loading}
      isNotFound={!loading && !application}
      notFoundMessage="The qualification application could not be found."
    >
      {application && (
        <div className="qualification-detail-wrapper">
          {/* Status Alert Banner */}
          <div className="qualification-alert-box">
            {application.status === 'pending' && (
              <AlertBar
                message="This qualification application is currently pending review. Super Administrators can evaluate the submitted experience, verify uploaded documents, and approve certified status."
                type="warning"
              />
            )}
            {application.status === 'approved' && (
              <AlertBar
                message={`Application approved by ${application.reviewedByName || 'Super Administrator'}${
                  application.reviewedAt ? ` on ${new Date(application.reviewedAt).toLocaleDateString()}` : ''
                }. This operator is qualified to create and manage custom branch services.`}
                type="success"
              />
            )}
            {application.status === 'rejected' && (
              <AlertBar
                message={`Application rejected by ${application.reviewedByName || 'Super Administrator'}${
                  application.reviewedAt ? ` on ${new Date(application.reviewedAt).toLocaleDateString()}` : ''
                }.`}
                type="error"
              />
            )}
          </div>

          {/* Performance & Operations KPI Cards */}
          <section className="services-summary-grid">
            <KpiCard
              title="Fulfilled Revenue"
              value={`₱${branchRevenue.toLocaleString()}`}
              detail="Total credited revenue earned"
              icon="fa-solid fa-coins"
              iconColor="#eab308"
              badge="Revenue"
              badgeType="ok"
            />
            <KpiCard
              title="Active Services"
              value={activeServicesCount}
              detail="Currently in progress"
              icon="fa-solid fa-clipboard-list"
              iconColor="#3b82f6"
              badge="In Progress"
              badgeType="info"
            />
            <KpiCard
              title="Completed Services"
              value={completedServicesCount}
              detail="Total fulfilled requests"
              icon="fa-solid fa-circle-check"
              iconColor="#16a34a"
              badge="Fulfilled"
              badgeType="ok"
            />
            <KpiCard
              title="Attached Documents"
              value={documents.length}
              detail={documents.length > 0 ? 'Verified credentials attached' : 'No documents uploaded'}
              icon="fa-solid fa-paperclip"
              iconColor="var(--purple)"
              badge={documents.length > 0 ? `${documents.length} / 5` : 'None'}
              badgeType={documents.length > 0 ? 'ok' : 'warn'}
            />
          </section>

          {/* Two-Column Detail Panels */}
          <div className="qualification-content-grid">
            {/* Left Column: Operator Info & Application Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <article className="card qualification-panel">
                <div className="qualification-panel-header">
                  <h2 className="qualification-panel-title">
                    <i className="fa-solid fa-id-card"></i> Operator & Branch Profile
                  </h2>
                  {application.operatorId && (
                    <Link
                      to={`/admin/operators/${application.operatorId}`}
                      className="btn-link"
                      style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>View Account</span>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </Link>
                  )}
                </div>

                <div className="qualification-info-list">
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Branch Name</span>
                    <span className="qualification-info-val">
                      {operator?.branchName || application.branchName || 'N/A'}
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Operator Contact Person</span>
                    <span className="qualification-info-val">
                      {operator?.name || operator?.fullName || application.operatorName || 'N/A'}
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Email Address</span>
                    <span className="qualification-info-val">
                      {operator?.email || application.email || 'N/A'}
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Contact Number</span>
                    <span className="qualification-info-val">
                      {operator?.contactNumber || operator?.phone || application.contactNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Business Address</span>
                    <span className="qualification-info-val">
                      {operator?.address || application.address || 'N/A'}
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Account Status</span>
                    <span className="qualification-info-val">
                      <span
                        className={`status-pill ${
                          (operator?.status || 'Active') === 'Active' ? 'status-pill-active' : 'status-pill-disabled'
                        }`}
                      >
                        {operator?.status || 'Active'}
                      </span>
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Current Certification</span>
                    <span className="qualification-info-val">
                      <span
                        className={`status-pill ${
                          operator?.isQualified ? 'status-pill-active' : 'status-pill-pending'
                        }`}
                      >
                        {operator?.isQualified ? 'Certified Operator' : 'Standard Operator'}
                      </span>
                    </span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Operator ID</span>
                    <span className="qualification-info-val text-mono">{application.operatorId}</span>
                  </div>
                  <div className="qualification-info-item">
                    <span className="qualification-info-label">Submission Date</span>
                    <span className="qualification-info-val">
                      {application.createdAt ? new Date(application.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </article>

              <article className="card qualification-panel">
                <div className="qualification-panel-header">
                  <h2 className="qualification-panel-title">
                    <i className="fa-solid fa-file-lines"></i> Justification & Experience
                  </h2>
                </div>
                <div className="qualification-reason-content">
                  {application.reason || 'No justification statement was submitted with this application.'}
                </div>
              </article>
            </div>

            {/* Right Column: Uploaded Documents & Decision Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Uploaded Documents */}
              <article className="card qualification-panel">
                <div className="qualification-panel-header">
                  <h2 className="qualification-panel-title">
                    <i className="fa-solid fa-folder-open"></i> Attached Supporting Documents
                  </h2>
                  <span className="qualification-panel-badge">
                    {documents.length} File{documents.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {documents.length === 0 ? (
                  <div className="qualification-docs-empty">
                    <i className="fa-regular fa-folder-open"></i>
                    <p>No supporting documents were attached to this application.</p>
                  </div>
                ) : (
                  <div className="qualification-docs-container">
                    {documents.map((docItem, idx) => {
                      const iconMeta = getDocumentIcon(docItem.name, docItem.type);
                      return (
                        <div key={docItem.url || idx} className="qualification-doc-card">
                          <div className="qualification-doc-card-main">
                            <div className="qualification-doc-icon-wrap">
                              <i className={iconMeta.icon} style={{ color: iconMeta.color }}></i>
                            </div>
                            <div className="qualification-doc-meta">
                              <span className="qualification-doc-title" title={docItem.name}>
                                {docItem.name || `Document #${idx + 1}`}
                              </span>
                              <span className="qualification-doc-sub">
                                {formatFileSize(docItem.size)}
                                {docItem.uploadedAt
                                  ? ` • ${new Date(docItem.uploadedAt).toLocaleDateString()}`
                                  : ''}
                              </span>
                            </div>
                          </div>

                          <div className="qualification-doc-actions">
                            <button
                              type="button"
                              className="doc-btn doc-btn--view"
                              title="View Document"
                              onClick={() => handleViewDoc(docItem)}
                            >
                              <i className="fa-solid fa-eye"></i> View
                            </button>
                            <button
                              type="button"
                              className="doc-btn doc-btn--print"
                              title="Print Document"
                              onClick={() => handlePrintDoc(docItem)}
                            >
                              <i className="fa-solid fa-print"></i> Print
                            </button>
                            <button
                              type="button"
                              className="doc-btn doc-btn--download"
                              title="Download Document"
                              onClick={() => handleDownloadDoc(docItem)}
                            >
                              <i className="fa-solid fa-download"></i> Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              {/* Review & Decision Panel */}
              <article className="card qualification-panel">
                <div className="qualification-panel-header">
                  <h2 className="qualification-panel-title">
                    <i className="fa-solid fa-gavel"></i> Decision & Remarks
                  </h2>
                  <span
                    className={`status-pill ${
                      application.status === 'approved'
                        ? 'status-pill-active'
                        : application.status === 'rejected'
                        ? 'status-pill-disabled'
                        : 'status-pill-pending'
                    }`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {application.status || 'Pending'}
                  </span>
                </div>

                <div className="qualification-decision-form">
                  {application.status === 'pending' ? (
                    isSuperAdmin ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label
                            htmlFor="adminDecisionNotes"
                            style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}
                          >
                            Administrative Notes (Optional):
                          </label>
                          <textarea
                            id="adminDecisionNotes"
                            className="form-input qualification-notes-textarea"
                            placeholder="Add evaluation comments, reference numbers, or requirements notes..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="qualification-decision-buttons">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setConfirmState('reject')}
                            disabled={isSubmitting}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <i className="fa-solid fa-xmark"></i> Reject Application
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setConfirmState('approve')}
                            disabled={isSubmitting}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'var(--purple)'
                            }}
                          >
                            <i className="fa-solid fa-certificate"></i> Approve Qualification
                          </button>
                        </div>
                      </>
                    ) : (
                      <AlertBar
                        message="Only Super Administrators are authorized to approve or reject qualification applications."
                        type="info"
                      />
                    )
                  ) : (
                    <div className="qualification-info-list">
                      <div className="qualification-info-item">
                        <span className="qualification-info-label">Reviewed By</span>
                        <span className="qualification-info-val">
                          {application.reviewedByName || 'Super Administrator'}
                        </span>
                      </div>
                      <div className="qualification-info-item">
                        <span className="qualification-info-label">Review Date</span>
                        <span className="qualification-info-val">
                          {application.reviewedAt ? new Date(application.reviewedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <span className="qualification-info-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                          Decision Remarks:
                        </span>
                        <div
                          style={{
                            background: 'var(--bg)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.875rem',
                            color: 'var(--text-mid)',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {application.adminNotes || 'No remarks recorded.'}
                        </div>
                      </div>

                      {isSuperAdmin && (
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                          {application.status === 'approved' ? (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => setConfirmState('reject')}
                              disabled={isSubmitting}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <i className="fa-solid fa-ban"></i> Revoke Qualification
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setConfirmState('approve')}
                              disabled={isSubmitting}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: 'var(--purple)'
                              }}
                            >
                              <i className="fa-solid fa-certificate"></i> Re-approve Qualification
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>

          {/* In-Modal Document Preview Dialog */}
          {docToPreview && (
            <BaseModal
              isOpen={Boolean(docToPreview)}
              onClose={() => setDocToPreview(null)}
              maxWidth="52rem"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-file-invoice" style={{ color: 'var(--purple)' }}></i>
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '24rem'
                    }}
                  >
                    {docToPreview.name}
                  </span>
                </div>
              }
              subtitle={`Uploaded ${
                docToPreview.uploadedAt ? new Date(docToPreview.uploadedAt).toLocaleString() : 'N/A'
              } • ${formatFileSize(docToPreview.size)}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="doc-preview-modal-body">
                  {(docToPreview.name || '').toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={docToPreview.url}
                      title={docToPreview.name}
                      className="doc-preview-iframe"
                    />
                  ) : (
                    <img
                      src={docToPreview.url}
                      alt={docToPreview.name}
                      className="doc-preview-image"
                    />
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.875rem'
                  }}
                >
                  <a
                    href={docToPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-link"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    Open Original in New Tab <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="doc-btn doc-btn--print"
                      onClick={() => handlePrintDoc(docToPreview)}
                    >
                      <i className="fa-solid fa-print"></i> Print
                    </button>
                    <button
                      type="button"
                      className="doc-btn doc-btn--download"
                      onClick={() => handleDownloadDoc(docToPreview)}
                    >
                      <i className="fa-solid fa-download"></i> Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDocToPreview(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </BaseModal>
          )}

          {/* Confirmation Modals */}
          <ConfirmationModal
            isOpen={confirmState === 'approve'}
            onClose={() => setConfirmState(null)}
            Icon={ApproveIcon}
            Title="Approve Qualification Application?"
            Desc={`Are you sure you want to approve the qualification application for ${
              application.branchName || 'this operator'
            }? This grants the operator privileges to create and publish custom branch services.`}
            BtnColor="var(--purple)"
            confirmText="Approve Application"
            OnConfirm={() => handleReviewSubmit('approved')}
            isLoading={isSubmitting}
          />

          <ConfirmationModal
            isOpen={confirmState === 'reject'}
            onClose={() => setConfirmState(null)}
            Icon={RejectIcon}
            Title="Reject Qualification Application?"
            Desc={`Are you sure you want to reject the qualification application for ${
              application.branchName || 'this operator'
            }? The operator will retain standard branch fulfillment access but will not be certified for custom service creation.`}
            BtnColor="var(--red, #ef4444)"
            confirmText="Reject Application"
            OnConfirm={() => handleReviewSubmit('rejected')}
            isLoading={isSubmitting}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
