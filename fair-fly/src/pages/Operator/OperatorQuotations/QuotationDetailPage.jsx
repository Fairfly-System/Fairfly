import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import OperatorPaymentModal from '../../../components/Operator/OperatorPaymentModal/OperatorPaymentModal';
import AcceptOnBehalfModal from '../../../components/Operator/AcceptOnBehalfModal/AcceptOnBehalfModal';
import QuotationRequirementsReview from '../../../components/Operator/QuotationRequirementsReview/QuotationRequirementsReview';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { acceptQuotation, archiveQuotation, restoreQuotation } from '../../../services/quotationService';
import { verifyPayment } from '../../../services/paymentService';
import { fetchReceiptByQuotationId } from '../../../services/receiptService';
import './quotation-detail.css';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Listen for PayMongo redirect query params on operator quotation page
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const paymentId = searchParams.get('payment_id');
    if (paymentStatus === 'success' && paymentId && userToken) {
      verifyPayment(
        userToken,
        paymentId,
        (res) => {
          if (res?.paid) {
            addToast('PayMongo payment successfully verified! Service fulfillment is active.', 'success');
          } else {
            addToast('Payment checkout returned. Please check status.', 'info');
          }
          setSearchParams({}, { replace: true });
        },
        (err) => {
          console.error('[QuotationDetailPage] PayMongo auto-verify error:', err);
          addToast(err?.message || 'Failed to verify PayMongo payment', 'error');
        }
      );
    }
  }, [searchParams, userToken, setSearchParams, addToast]);

  // Directly subscribe to the specific quotation document (1 document read instead of entire collection)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(firestore, 'quotations', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setQuotation({ id: docSnap.id, ...docSnap.data() });
        } else {
          setQuotation(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[QuotationDetailPage] Document error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  // Subscribe to linked active service document if quotation has an associated activeServiceId or quotation.id
  const [activeService, setActiveService] = useState(null);

  useEffect(() => {
    if (!quotation) {
      setActiveService(null);
      return;
    }

    if (quotation.activeServiceId) {
      const unsub = onSnapshot(
        doc(firestore, 'activeServices', quotation.activeServiceId),
        (docSnap) => {
          if (docSnap.exists()) {
            setActiveService({ id: docSnap.id, ...docSnap.data() });
          } else {
            setActiveService(null);
          }
        },
        (err) => {
          console.warn('[QuotationDetailPage] activeService listener error:', err);
        }
      );
      return () => unsub();
    } else if (quotation.id) {
      const q = query(
        collection(firestore, 'activeServices'),
        where('quotationId', '==', quotation.id),
        limit(1)
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            setActiveService({ id: docSnap.id, ...docSnap.data() });
          } else {
            setActiveService(null);
          }
        },
        (err) => {
          console.warn('[QuotationDetailPage] activeServices query error:', err);
        }
      );
      return () => unsub();
    }
  }, [quotation?.id, quotation?.activeServiceId]);

  // Form state for inline editing
  const [formData, setFormData] = useState({
    clientName: '',
    contactPerson: '',
    clientEmail: '',
    clientPhone: '',
    serviceTitle: '',
    requirements: '',
    tourDates: '',
    inclusions: '',
    exclusions: '',
    rateBreakdown: '',
    rate: '',
    taxAmount: '',
    totalAmount: '',
    remarks: '',
    preparedByName: '',
    preparedByTitle: '',
    preparedByContact: '',
  });

  // Load quotation data into form fields when entering edit mode or when database updates
  useEffect(() => {
    if (quotation) {
      setFormData({
        clientName: quotation.clientName || '',
        contactPerson: quotation.contactPerson || '',
        clientEmail: quotation.clientEmail || '',
        clientPhone: quotation.clientPhone || '',
        serviceTitle: quotation.serviceTitle || '',
        requirements: quotation.requirements || '',
        tourDates: quotation.tourDates || '',
        inclusions: quotation.inclusions || '',
        exclusions: quotation.exclusions || '',
        rateBreakdown: quotation.rateBreakdown || '',
        rate: quotation.rate !== undefined ? quotation.rate : '',
        taxAmount: quotation.taxAmount !== undefined ? quotation.taxAmount : '',
        totalAmount: quotation.totalAmount !== undefined ? quotation.totalAmount : quotation.rate || '',
        remarks: quotation.remarks || '',
        preparedByName: quotation.preparedByName || quotation.preparedBy || '',
        preparedByTitle: quotation.preparedByTitle || '',
        preparedByContact: quotation.preparedByContact || '',
      });
    }
  }, [quotation, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'rate' || name === 'taxAmount') {
        const numRate = Number(name === 'rate' ? value : prev.rate) || 0;
        const numTax = Number(name === 'taxAmount' ? value : prev.taxAmount) || 0;
        const total = numRate + numTax;
        updated.totalAmount = total > 0 ? String(total) : '';

        if (numRate > 0) {
          if (numTax > 0) {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${numTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
          } else {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
      return updated;
    });
  };

  const isFulfilled = (quotation?.status || '').toLowerCase() === 'fulfilled' ||
    (quotation?.fulfillmentStatus || '').toLowerCase() === 'fulfilled' ||
    (activeService?.status || '').toLowerCase() === 'completed';
  const isPaid = (quotation?.status || '').toUpperCase() === 'PAID' || (quotation?.paymentStatus || '').toUpperCase() === 'PAID';
  const isAccepted = quotation?.status === 'Accepted' || isPaid || isFulfilled;
  const isCancelled = (quotation?.status || '').toLowerCase() === 'cancelled';
  const isRejected = (quotation?.status || '').toLowerCase() === 'rejected';
  const isArchived = Boolean(quotation?.archived);
  const isFinalized = isPaid || isAccepted || isCancelled || isFulfilled || isRejected || isArchived;

  const handleSaveChanges = async () => {
    if (!formData.clientName || !formData.serviceTitle || formData.rate === '') {
      addToast('Client name, service title, and rate are required fields', 'error');
      return;
    }

    if (isFinalized) {
      addToast('Cannot modify a quotation that has already been finalized, accepted, or archived.', 'error');
      setIsEditing(false);
      return;
    }

    const payload = {
      ...formData,
      rate: Number(formData.rate) || 0,
      taxAmount: Number(formData.taxAmount) || 0,
      totalAmount: Number(formData.totalAmount || formData.rate) || 0,
    };

    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}`,
      'PATCH',
      payload,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quotation details saved successfully', 'success');
        setIsEditing(false);
      },
      (error) => {
        addToast(`Failed to update quotation: ${error.message}`, 'error');
      },
      setIsSaving
    );
  };

  const handleArchive = async () => {
    if (!quotation) return;
    archiveQuotation(
      userToken,
      quotation.id,
      () => {
        addToast('Quotation archived successfully. Associated inquiry remains active.', 'success');
        setShowArchiveConfirm(false);
        navigate('/operator/quotations');
      },
      (error) => {
        addToast(error?.message || 'Failed to archive quotation', 'error');
      },
      setIsArchiving
    );
  };

  const handleRestore = async () => {
    if (!quotation) return;
    restoreQuotation(
      userToken,
      quotation.id,
      () => {
        addToast('Quotation restored to active records successfully.', 'success');
        setShowRestoreConfirm(false);
      },
      (error) => {
        addToast(error?.message || 'Failed to restore quotation', 'error');
      },
      setIsRestoring
    );
  };

  const handleStatusChange = async (newStatus) => {
    if (!quotation) return;
    if (isFinalized) {
      addToast('Cannot change status of a finalized or paid quotation.', 'error');
      return;
    }

    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}/status`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Quotation status updated to ${newStatus}`, 'success');
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      }
    );
  };

  const requirementsApproved = quotation?.requirementsStatus === 'approved' ||
    quotation?.requirementsStatus === 'not_required';

  const handleOpenAcceptModal = () => {
    if (!quotation?.id) return;
    if (isFinalized) {
      addToast('This quotation has already been accepted or paid.', 'warning');
      return;
    }
    if (!requirementsApproved) {
      addToast(
        `Cannot accept quotation: Service requirements must be verified and approved first (Current requirements status: "${(quotation.requirementsStatus || 'pending').replace('_', ' ')}").`,
        'warning'
      );
      return;
    }
    setShowAcceptModal(true);
  };

  const handleAcceptSuccess = (result) => {
    setShowAcceptModal(false);
    if (result?.proceedToPayment !== false) {
      setShowPaymentModal(true);
    }
  };

  const handleOpenReceipt = () => {
    if (!quotation?.id || !userToken) return;
    fetchReceiptByQuotationId(
      userToken,
      quotation.id,
      (rct) => {
        setReceiptData(rct);
        setShowReceiptModal(true);
      },
      (err) => {
        console.warn('[QuotationDetailPage] Receipt fetch fallback:', err);
        setReceiptData({
          ...quotation,
          receiptNo: quotation.receiptNo || 'RCT-2026-OFFICIAL',
          serviceCode: quotation.serviceCode || activeService?.serviceCode,
          fulfillmentId: quotation.activeServiceId || activeService?.id,
          amount: quotation.totalAmount || quotation.rate,
          paymentMethod: quotation.paymentMethod || 'Verified Payment'
        });
        setShowReceiptModal(true);
      }
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Quotations', to: '/operator/quotations' },
    { label: quotation ? (quotation.quoteNo || 'Quotation Details') : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!quotation) return [];

    if (isArchived) {
      return [
        {
          label: 'Export to PDF (ADF-07-001)',
          icon: 'fa-solid fa-file-pdf',
          onClick: () => setShowPdfModal(true),
          className: 'btn-secondary',
          disabled: isRestoring,
        },
        {
          label: 'Restore Quotation',
          icon: 'fa-solid fa-rotate-left',
          onClick: () => setShowRestoreConfirm(true),
          className: 'btn-primary',
          disabled: isRestoring,
          style: { background: 'var(--brand-primary, #6366f1)' }
        }
      ];
    }

    if (isEditing) {
      return [
        {
          label: 'Save Changes',
          icon: 'fa-solid fa-cloud-arrow-up',
          onClick: handleSaveChanges,
          className: 'btn-primary',
          disabled: isSaving || isArchiving,
        },
        {
          label: 'Cancel',
          icon: 'fa-solid fa-xmark',
          onClick: () => setIsEditing(false),
          className: 'btn-secondary',
          disabled: isSaving || isArchiving,
        },
      ];
    }

    return [
      {
        label: 'Export to PDF (ADF-07-001)',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-secondary',
        disabled: isSaving || isArchiving || isAccepting,
      },
      ...(isPaid ? [
        {
          label: 'View E-Receipt (ADF-07-002)',
          icon: 'fa-solid fa-receipt',
          onClick: handleOpenReceipt,
          className: 'btn-secondary',
          style: { color: '#16a34a', borderColor: '#86efac' }
        }
      ] : []),
      ...(!isFinalized ? [
        {
          label: 'Edit Fields',
          icon: 'fa-solid fa-pen-to-square',
          onClick: () => setIsEditing(true),
          className: 'btn-secondary',
          disabled: isSaving || isArchiving || isAccepting,
        },
      ] : []),
      ...(quotation.status === 'Draft' ? [
        {
          label: 'Send to Client',
          icon: 'fa-solid fa-paper-plane',
          onClick: () => handleStatusChange('Sent'),
          className: 'btn-primary',
          disabled: isSaving || isArchiving || isAccepting || !requirementsApproved,
          style: { background: requirementsApproved ? 'var(--purple, #7c3aed)' : '#94a3b8' },
          title: !requirementsApproved ? 'Service requirements must be verified and approved first' : 'Send quotation to client'
        }
      ] : []),
      ...(!isFinalized ? [
        {
          label: 'Accept on Behalf of Client (On-Site)',
          icon: 'fa-solid fa-handshake',
          onClick: handleOpenAcceptModal,
          className: 'btn-primary',
          disabled: isSaving || isArchiving || !requirementsApproved,
          style: { background: requirementsApproved ? 'var(--green, #16a34a)' : '#94a3b8' },
          title: !requirementsApproved ? 'Service requirements must be verified and approved first' : 'Accept on behalf of client'
        }
      ] : []),
      ...(quotation.status === 'Accepted' && !isPaid ? [
        {
          label: 'Process Payment (Cash / PayMongo)',
          icon: 'fa-solid fa-cash-register',
          onClick: () => setShowPaymentModal(true),
          className: 'btn-primary',
          disabled: isSaving || isArchiving || isAccepting,
          style: { background: 'var(--brand-primary, #6366f1)' }
        }
      ] : []),
      {
        label: 'Archive Quotation',
        icon: 'fa-solid fa-box-archive',
        onClick: () => setShowArchiveConfirm(true),
        className: 'btn-secondary',
        disabled: isSaving || isArchiving || isAccepting,
      },
    ];
  }, [quotation, isEditing, isSaving, isArchiving, isRestoring, isAccepting, isFinalized, isPaid, isArchived, formData, requirementsApproved, userToken]);

  const getStatusType = () => {
    if (isArchived) return 'neutral';
    if (!quotation) return 'neutral';
    if (isFulfilled) return 'success';
    const status = (quotation.status || '').toLowerCase();
    if (status === 'paid') return 'success';
    if (status === 'accepted' || status === 'confirmed') return 'success';
    if (status === 'sent') return 'warning';
    if (status === 'cancelled' || status === 'rejected') return 'danger';
    return 'neutral';
  };

  const getStatusLabel = () => {
    if (isArchived) return 'ARCHIVED';
    if (!quotation) return 'DRAFT';
    if (isFulfilled) return 'FULFILLED';
    return quotation.status ? quotation.status.toUpperCase() : 'DRAFT';
  };

  return (
    <RecordDetailLayout
      title={quotation?.quoteNo || 'Quotation Profile'}
      subtitle={quotation?.serviceTitle || 'Service Booking Tour'}
      status={getStatusLabel()}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo="/operator/quotations"
      backLabel="Back to Quotations"
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !quotation}
      notFoundMessage="The quotation record could not be found."
    >
      {quotation && (
        <div className="quotation-detail-wrapper">
          {/* Archived Status Banner */}
          {isArchived && (
            <div className="inquiry-confirmed-banner" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <i className="fa-solid fa-box-archive"></i>
                </div>
                <div>
                  <h4 className="quote-accepted-title" style={{ color: '#334155' }}>
                    This Quotation is Archived
                  </h4>
                  <p className="quote-accepted-sub" style={{ color: '#64748b' }}>
                    This quotation has been archived and removed from active lists. The associated inquiry remains active. You can restore this quotation to active records at any time.
                  </p>
                </div>
              </div>
              <div className="quote-accepted-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowRestoreConfirm(true)}
                  disabled={isRestoring}
                  style={{ background: 'var(--brand-primary, #6366f1)' }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Restore Quotation
                </button>
              </div>
            </div>
          )}

          {/* Rejection Banner */}
          {isRejected && !isArchived && (
            <div className="inquiry-confirmed-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1.25rem' }}>
              <div className="inquiry-confirmed-info">
                <div className="inquiry-confirmed-icon" style={{ background: '#fee2e2', color: 'var(--red, #ef4444)' }}>
                  <i className="fa-solid fa-circle-xmark"></i>
                </div>
                <div>
                  <h4 className="quote-accepted-title" style={{ color: '#991b1b' }}>
                    Quotation Rejected by Client
                  </h4>
                  <p className="quote-accepted-sub" style={{ color: '#b91c1c' }}>
                    The client declined this quotation proposal
                    {quotation.rejectedAt ? ` on ${new Date(quotation.rejectedAt).toLocaleString()}` : ''}.
                    {quotation.rejectionReason && (
                      <span style={{ display: 'block', marginTop: '0.35rem', fontWeight: 600 }}>
                        Reason: "{quotation.rejectionReason}"
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Custom Service / Accepted / Fulfilled Banner */}
          {isFinalized && !isCancelled && !isRejected && !isArchived && (
            <div className={`inquiry-confirmed-banner quote-accepted-banner ${isFulfilled ? 'fulfilled-banner' : isPaid ? 'paid-banner' : ''}`}>
              <div className="quote-accepted-info">
                <div className="quote-accepted-icon">
                  <i className={isFulfilled ? "fa-solid fa-trophy" : isPaid ? "fa-solid fa-badge-check" : "fa-solid fa-circle-check"}></i>
                </div>
                <div>
                  <h4 className="quote-accepted-title">
                    {isFulfilled
                      ? 'Fulfilled'
                      : isPaid
                      ? 'Quotation Paid · Service Fulfillment Active'
                      : 'Quotation Accepted · Awaiting Payment'}
                  </h4>
                  <p className="quote-accepted-sub">
                    {isFulfilled
                      ? 'All workflow procedure steps and documentation have been finalized and delivered to the client.'
                      : isPaid
                      ? 'Payment has been authoritatively verified. The custom service has been initialized in active fulfillment.'
                      : 'This quotation has been officially accepted. Service fulfillment will activate upon payment confirmation.'}
                  </p>
                </div>
              </div>

              {!isFulfilled && (
                <div className="quote-accepted-actions">
                  {!isPaid && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm quote-link-btn"
                      onClick={() => setShowPaymentModal(true)}
                      style={{ background: 'var(--brand-primary, #6366f1)', color: '#fff' }}
                    >
                      <i className="fa-solid fa-cash-register"></i>
                      <span>Collect Payment (Cash / QR)</span>
                    </button>
                  )}
                  {quotation.activeServiceId && (
                    <Link
                      to={`/operator/services/${quotation.activeServiceId}/procedure`}
                      className="btn btn-primary btn-sm quote-link-btn ongoing"
                    >
                      <i className="fa-solid fa-gears"></i>
                      <span>View Ongoing Service</span>
                    </Link>
                  )}
                  {quotation.inquiryId && (
                    <Link
                      to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                      className="btn btn-secondary btn-sm quote-link-btn"
                    >
                      <i className="fa-solid fa-file-signature"></i>
                      <span>Originating Inquiry</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Originating Inquiry Reference (if not yet accepted/paid) */}
          {!isFinalized && quotation.inquiryId && (
            <div className="quote-inquiry-bar">
              <span className="quote-inquiry-bar-label">
                <i className="fa-solid fa-link quote-inquiry-bar-icon"></i>
                Originating from client inquiry: <strong>{quotation.inquiryId}</strong>
              </span>
              <Link
                to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                className="quote-inquiry-bar-link"
              >
                View Inquiry Form (SAF-01-002) →
              </Link>
            </div>
          )}

          {/* Requirements Verification Pending Warning Callout */}
          {!isFinalized && !requirementsApproved && (
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '0px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', fontSize: '1.25rem' }}></i>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.875rem' }}>
                  Requirements Verification Pending (Status: {(quotation.requirementsStatus || 'pending').replace('_', ' ').toUpperCase()})
                </div>
                <div style={{ color: '#b45309', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                  Quotation acceptance and payment are locked until all mandatory service requirements below are verified and approved by the branch operator.
                </div>
              </div>
            </div>
          )}

          {/* Top Client & Service Row */}
          <div className="details-grid-2">
            {/* Client Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-building"></i> Client / Company Information
              </h2>

              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client / Company Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold">{quotation.clientName || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.contactPerson || quotation.clientName || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Telephone / Cellphone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.contactNumber || quotation.cellphone || quotation.telNo || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientEmail || quotation.email || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Complete Address</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientAddress || quotation.address || 'N/A'}</span>
                  )}
                </div>
              </div>
            </article>

            {/* Quotation Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-file-invoice"></i> Quotation Specifications
              </h2>

              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Document Code</span>
                  <span className="detail-value text-mono font-bold text-purple">{quotation.code || 'ADF-07-001'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Branch Office</span>
                  <span className="detail-value font-medium">{quotation.branchName || 'FairFly Travel'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Quotation Date</span>
                  {isEditing ? (
                    <input
                      type="date"
                      name="quotationDate"
                      value={formData.quotationDate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.quotationDate || (quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A')}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Service Title / Package</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="serviceTitle"
                      value={formData.serviceTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold">{quotation.serviceTitle || quotation.serviceName || 'Custom Service'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Rate / Bus / Base Price</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold text-mono">
                      ₱{Number(quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Amount</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input quote-total-input"
                    />
                  ) : (
                    <span className="detail-value text-purple font-large quote-total-display">
                      ₱{Number(quotation.totalAmount || quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Rate Breakdown Line</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="rateBreakdown"
                      value={formData.rateBreakdown}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value quote-rate-note">
                      {quotation.rateBreakdown || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Service Requirements Verification Section */}
          <QuotationRequirementsReview
            quotation={quotation}
            isFinalized={isFinalized}
            onReviewUpdated={() => {}}
          />

          {/* Client Remarks & Special Instructions from Intake (SAF-01-002) */}
          {quotation.clientRemarks && (
            <article className="card detail-panel" style={{ marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h2 className="panel-title" style={{ color: 'var(--primary, #4338ca)' }}>
                <i className="fa-regular fa-comment-dots" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>
                Client Remarks & Special Instructions (from Inquiry Intake)
              </h2>
              <p className="description-text quote-preline-text" style={{ color: '#334155', margin: 0 }}>
                {quotation.clientRemarks}
              </p>
            </article>
          )}

          {/* Requirements & Tour Dates */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-list-check"></i> Requirements / Unit Specs
              </h2>
              {isEditing ? (
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="• (1) Unit Tourist Bus&#10;• Equipped with video and audio entertainment system&#10;• 49 Regular seats&#10;• 3D/2N – QC-Bolinao-Alaminos-QC"
                />
              ) : (
                <p className="description-text quote-preline-text">
                  {quotation.requirements || 'No specific unit requirements noted.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-calendar-days"></i> Tour Date / Itinerary Breakdown
              </h2>
              {isEditing ? (
                <textarea
                  name="tourDates"
                  value={formData.tourDates}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="April 29, 2023: Pick up QC to Bolinao&#10;April 30, 2023: Bolinao to Alaminos&#10;May 1, 2023: Alaminos to QC"
                />
              ) : (
                <p className="description-text quote-preline-text">
                  {quotation.tourDates || 'Tour schedule to be arranged upon confirmation.'}
                </p>
              )}
            </article>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-plus text-success"></i> Inclusions
              </h2>
              {isEditing ? (
                <textarea
                  name="inclusions"
                  value={formData.inclusions}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                />
              ) : (
                <p className="description-text quote-preline-text">
                  {quotation.inclusions || 'No inclusions specified.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-minus text-danger"></i> Exclusions
              </h2>
              {isEditing ? (
                <textarea
                  name="exclusions"
                  value={formData.exclusions}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                />
              ) : (
                <p className="description-text quote-preline-text">
                  {quotation.exclusions || 'No exclusions specified.'}
                </p>
              )}
            </article>
          </div>

          {/* Remarks & Sign-off */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-comment-dots"></i> Operator Remarks & Payment Terms
              </h2>
              {isEditing ? (
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="- Initial payment of Php 10,000.00 for reservation upon confirmation&#10;- Full payment on or before April 29, 2023"
                />
              ) : (
                <p className="description-text quote-preline-text">
                  {quotation.remarks || 'Standard terms and conditions apply.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-signature"></i> Sign-off Information
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Prepared By</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByName"
                      value={formData.preparedByName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-medium">{quotation.preparedByName || quotation.preparedBy || 'Operator'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Designation / Title</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByTitle"
                      value={formData.preparedByTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.preparedByTitle || 'Branch Operator'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByContact"
                      value={formData.preparedByContact}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.preparedByContact || 'N/A'}</span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Payment & Settlement Summary Card */}
          {isPaid && (
            <article className="card detail-panel" style={{ marginTop: '1.25rem', borderLeft: '4px solid var(--green, #16a34a)' }}>
              <h2 className="panel-title" style={{ color: 'var(--green, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  <i className="fa-solid fa-receipt"></i> Payment & Fulfillment Settlement
                </span>
                <span className="quote-payment-badge paid" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                  <i className="fa-solid fa-circle-check"></i> AUTHORITATIVELY PAID
                </span>
              </h2>

              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value font-bold" style={{ textTransform: 'capitalize' }}>
                    {quotation.paymentMethod === 'Cash' || quotation.paymentMethod === 'cash' ? (
                      <span><i className="fa-solid fa-money-bill-wave" style={{ color: '#16a34a', marginRight: '0.4rem' }}></i> Direct Cash (Walk-in Receipt)</span>
                    ) : (
                      <span><i className="fa-solid fa-qrcode" style={{ color: '#6366f1', marginRight: '0.4rem' }}></i> PayMongo QR / Online Gateway</span>
                    )}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Amount Settled</span>
                  <span className="detail-value font-bold text-green" style={{ fontSize: '1.05rem' }}>
                    ₱{Number(quotation.totalAmount || quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {quotation.paidAt && (
                  <div className="detail-item">
                    <span className="detail-label">Settlement Timestamp</span>
                    <span className="detail-value">
                      {new Date(quotation.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {quotation.paymentId && (
                  <div className="detail-item">
                    <span className="detail-label">System Payment Reference</span>
                    <span className="detail-value text-mono text-purple">{quotation.paymentId}</span>
                  </div>
                )}

                {activeService?.id && (
                  <div className="detail-item">
                    <span className="detail-label">Linked Active Service</span>
                    <Link
                      to={`/operator/services/${activeService.id}/procedure`}
                      className="detail-value font-bold text-purple"
                      style={{ textDecoration: 'underline' }}
                    >
                      View Live Service Fulfillment ({activeService.id.substring(0, 10)}...) →
                    </Link>
                  </div>
                )}
              </div>

              {/* Action row for E-Receipt in settlement panel */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleOpenReceipt}
                  style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-receipt"></i>
                  <span>View & Print Official E-Receipt (ADF-07-002)</span>
                </button>
              </div>
            </article>
          )}

          {/* Archive confirmation */}
          <ConfirmationModal
            isOpen={showArchiveConfirm}
            onClose={() => !isArchiving && setShowArchiveConfirm(false)}
            Icon={() => <i className="fa-solid fa-box-archive" style={{ color: 'var(--purple-dark, #4338ca)' }}></i>}
            Title="Archive this quotation?"
            Desc="This quotation will be removed from active quotation lists but will remain available in Archived records. The associated inquiry will remain active."
            BtnColor="var(--purple-dark, #4338ca)"
            confirmText="Archive Quotation"
            isLoading={isArchiving}
            OnConfirm={handleArchive}
          />

          {/* Restore confirmation */}
          <ConfirmationModal
            isOpen={showRestoreConfirm}
            onClose={() => !isRestoring && setShowRestoreConfirm(false)}
            Icon={() => <i className="fa-solid fa-rotate-left" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>}
            Title="Restore this quotation?"
            Desc="Restoring this quotation will return it to active quotation lists. Note that the parent inquiry must be active in order to restore this quotation."
            BtnColor="var(--brand-primary, #6366f1)"
            confirmText="Restore Quotation"
            isLoading={isRestoring}
            OnConfirm={handleRestore}
          />

          {/* PDF Export Preview & Download Modal (Quotation) */}
          <PdfDocumentView
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            type="quotation"
            data={quotation}
          />

          {/* PDF Export Preview & Download Modal (Receipt) */}
          <PdfDocumentView
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            type="receipt"
            data={receiptData}
          />

          {/* Accept on Behalf of Client Modal */}
          <AcceptOnBehalfModal
            isOpen={showAcceptModal}
            onClose={() => setShowAcceptModal(false)}
            quotation={quotation}
            onAcceptSuccess={handleAcceptSuccess}
          />

          {/* Operator Payment Modal (Direct Cash & PayMongo QR) */}
          <OperatorPaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            quotation={quotation}
            onPaymentSuccess={() => {
              setShowPaymentModal(false);
              addToast('Payment verified and recorded successfully!', 'success');
            }}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
