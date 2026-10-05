import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import ClientServiceTracker from '../../../components/Client/ClientServiceTracker/ClientServiceTracker';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import ClientInquiryModal from '../../../components/Client/ClientInquiryModal/ClientInquiryModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import PaymentModal from '../../../components/Client/PaymentModal/PaymentModal';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Pagination from '../../../components/UI/Pagination/Pagination';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import useDebounce from '../../../hooks/useDebounce';
import QuotationDetailModal from '../../../components/Client/QuotationDetailModal/QuotationDetailModal';
import InquiryDetailModal from '../../../components/Client/InquiryDetailModal/InquiryDetailModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import { acceptQuotation } from '../../../services/quotationService';
import { verifyPayment } from '../../../services/paymentService';
import './client-tracking.css';

function formatRequirementsText(specifiedRequirements, requirements) {
  for (const value of [specifiedRequirements, requirements]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  if (!Array.isArray(requirements)) return '';

  return requirements
    .map((requirement) => {
      if (typeof requirement === 'string') return requirement.trim();
      if (!requirement || typeof requirement !== 'object') return '';

      const label = [requirement.name, requirement.title]
        .find((value) => typeof value === 'string' && value.trim())?.trim() || '';
      const value = typeof requirement.value === 'string' ? requirement.value.trim() : '';
      const fileName = typeof requirement.file?.fileName === 'string'
        ? requirement.file.fileName.trim()
        : '';
      const details = [value, fileName ? `File: ${fileName}` : ''].filter(Boolean).join(' | ');

      if (label && details) return `${label}: ${details}`;
      return label || details;
    })
    .filter(Boolean)
    .join(', ');
}

export default function ClientTrackingPage() {
  const { user, userToken } = useAuthContext();
  const { addToast } = useToast();

  // Primary 2-tab navigation: 'ongoing' | 'inquiries_quotations'
  const [mainTab, setMainTab] = useState('ongoing');

  // Ongoing Services state
  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesSubTab, setServicesSubTab] = useState('all'); // 'all' | 'ongoing' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Inquiries & Quotations state
  const [inquiriesList, setInquiriesList] = useState([]);
  const [quotationsList, setQuotationsList] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);

  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedQuotationForPayment, setSelectedQuotationForPayment] = useState(null);
  const [quotationToAccept, setQuotationToAccept] = useState(null);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // PDF Preview Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalType, setPdfModalType] = useState('quotation'); // 'quotation' | 'inquiry'
  const [pdfModalData, setPdfModalData] = useState(null);

  // Subtab for Inquiries & Quotations ('quotations' | 'inquiries')
  const [inquirySubTab, setInquirySubTab] = useState('quotations');

  // Quotation table filtering & pagination
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');
  const [quotePage, setQuotePage] = useState(1);
  const [quotePageSize, setQuotePageSize] = useState(8);
  const debouncedQuoteSearch = useDebounce(quoteSearch, 300);

  // Inquiry table filtering & pagination
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryPageSize, setInquiryPageSize] = useState(8);
  const debouncedInquirySearch = useDebounce(inquirySearch, 300);

  // Detail view modals state
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [viewingInquiry, setViewingInquiry] = useState(null);


  // 1. Subscribe to real-time active services for logged-in client
  useEffect(() => {
    let unsubscribe;
    try {
      setLoadingServices(true);
      const activeServicesRef = collection(db, 'activeServices');

      let q = activeServicesRef;
      if (user?.uid) {
        q = query(activeServicesRef, where('clientUid', '==', user.uid));
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          list.sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0));
          setActiveServices(list);
          setLoadingServices(false);
        },
        (error) => {
          console.error('Error fetching client tracking onSnapshot:', error);
          onSnapshot(activeServicesRef, (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const mine = user?.uid ? all.filter((s) => s.clientUid === user.uid) : all;
            setActiveServices(mine);
            setLoadingServices(false);
          });
        }
      );
    } catch (err) {
      console.error('Setup tracking onSnapshot error:', err);
      setLoadingServices(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // 2. Subscribe to client's Inquiries
  useEffect(() => {
    let unsubscribe;
    if (!user?.uid) {
      setLoadingInquiries(false);
      return;
    }

    try {
      setLoadingInquiries(true);
      const inquiriesRef = collection(db, 'inquiries');
      const q = query(inquiriesRef, where('clientUid', '==', user.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setInquiriesList(list);
          setLoadingInquiries(false);
        },
        (err) => {
          console.error('Error subscribing to client inquiries:', err);
          onSnapshot(inquiriesRef, (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setInquiriesList(all.filter((i) => i.clientUid === user.uid));
            setLoadingInquiries(false);
          });
        }
      );
    } catch (err) {
      console.error('Inquiries onSnapshot setup error:', err);
      setLoadingInquiries(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // 3. Subscribe to client's Quotations
  useEffect(() => {
    let unsubscribe;
    if (!user?.uid) {
      setLoadingQuotations(false);
      return;
    }

    try {
      setLoadingQuotations(true);
      const quotationsRef = collection(db, 'quotations');
      const q = query(quotationsRef, where('clientUid', '==', user.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setQuotationsList(list);
          setLoadingQuotations(false);
        },
        (err) => {
          console.error('Error subscribing to client quotations:', err);
          onSnapshot(quotationsRef, (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setQuotationsList(all.filter((qDoc) => qDoc.clientUid === user.uid));
            setLoadingQuotations(false);
          });
        }
      );
    } catch (err) {
      console.error('Quotations onSnapshot setup error:', err);
      setLoadingQuotations(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Handle PayMongo return redirect verification
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment_status');
    const paymentId = searchParams.get('payment_id');

    if (paymentStatus && paymentId) {
      // Clear query params from browser URL without triggering reload
      window.history.replaceState({}, document.title, window.location.pathname);

      if (paymentStatus === 'success') {
        if (userToken) {
          verifyPayment(
            userToken,
            paymentId,
            (res) => {
              addToast(
                'Payment verified successfully! Your custom service fulfillment has started.',
                'success'
              );
              setMainTab('ongoing');
            },
            (err) => {
              console.warn('Payment verification sync:', err);
              addToast(
                'Payment captured! Your service fulfillment record will appear momentarily.',
                'info'
              );
              setMainTab('ongoing');
            }
          );
        } else {
          addToast('Payment captured! Please log in to view active service progress.', 'success');
          setMainTab('ongoing');
        }
      } else if (paymentStatus === 'cancelled') {
        addToast('Payment checkout was cancelled. You may complete your payment anytime.', 'info');
        setMainTab('inquiries_quotations');
      }
    }
  }, [userToken, addToast]);

  // Accept Quotation modal triggers (replaces native window.confirm/alert with ConfirmationModal)
  const handleInitiateAcceptQuotation = (quotation) => {
    if (!quotation?.id) return;

    const reqStatus = quotation.requirementsStatus;
    if (reqStatus && reqStatus !== 'approved' && reqStatus !== 'not_required') {
      if (reqStatus === 'submitted') {
        addToast('Your service requirements have been submitted and are awaiting operator review before acceptance.', 'info');
      } else if (reqStatus === 'changes_requested') {
        addToast('The branch operator has requested corrections to your requirements. Please update them first.', 'warning');
      } else {
        addToast('Please attach mandatory service requirements before accepting this quotation.', 'warning');
      }
      setViewingQuotation(quotation);
      return;
    }

    setQuotationToAccept(quotation);
  };

  const handleConfirmAcceptQuotation = () => {
    if (!quotationToAccept?.id) return;

    const targetQuotation = quotationToAccept;
    setAcceptingQuoteId(targetQuotation.id);
    acceptQuotation(
      userToken,
      targetQuotation.id,
      (res) => {
        setAcceptingQuoteId(null);
        setQuotationToAccept(null);
        addToast(
          'Quotation accepted! Please proceed with payment to begin service fulfillment.',
          'success'
        );
        // Immediately present the payment modal with server quotation details
        setSelectedQuotationForPayment({
          ...targetQuotation,
          status: 'Accepted',
          paymentStatus: 'UNPAID',
        });
        setPaymentModalOpen(true);
      },
      (err) => {
        setAcceptingQuoteId(null);
        setQuotationToAccept(null);
        console.error('Error accepting quotation:', err);
        addToast(err?.message || 'Failed to accept quotation. Please try again.', 'danger');
      }
    );
  };

  const handleOpenPayment = (quotation) => {
    setSelectedQuotationForPayment(quotation);
    setPaymentModalOpen(true);
  };

  // Open PDF Preview Modal
  const handleOpenPdf = (type, data) => {
    setPdfModalType(type);
    setPdfModalData(data);
    setPdfModalOpen(true);
  };


  // KPI Metrics
  const totalCount = activeServices.length;
  const ongoingCount = activeServices.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled').length;
  const completedCount = activeServices.filter((s) => s.status === 'Completed').length;

  // Filter ongoing services
  const filteredServices = useMemo(() => {
    let result = [...activeServices];

    if (servicesSubTab === 'ongoing') {
      result = result.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled');
    } else if (servicesSubTab === 'completed') {
      result = result.filter((s) => s.status === 'Completed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const title = (s.serviceName || s.serviceType || s.title || '').toLowerCase();
        const branch = (s.branchName || '').toLowerCase();
        const status = (s.status || '').toLowerCase();
        return title.includes(q) || branch.includes(q) || status.includes(q);
      });
    }

    return result;
  }, [activeServices, servicesSubTab, searchQuery]);

  // Reset quotation page on search or filter change
  useEffect(() => {
    setQuotePage(1);
  }, [debouncedQuoteSearch, quoteStatusFilter]);

  // Reset inquiry page on search or filter change
  useEffect(() => {
    setInquiryPage(1);
  }, [debouncedInquirySearch, inquiryStatusFilter]);

  // Quotation Filter Chips
  const quoteFilterChips = useMemo(() => [
    { value: 'all', label: 'All Quotations', count: quotationsList.length },
    { value: 'sent', label: 'Pending Acceptance', count: quotationsList.filter((q) => q.status === 'Sent').length },
    { value: 'accepted', label: 'Accepted', count: quotationsList.filter((q) => q.status === 'Accepted').length },
    { value: 'draft', label: 'In Preparation', count: quotationsList.filter((q) => q.status === 'Draft').length },
  ], [quotationsList]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    let result = [...quotationsList];

    if (quoteStatusFilter === 'sent') {
      result = result.filter((q) => q.status === 'Sent');
    } else if (quoteStatusFilter === 'accepted') {
      result = result.filter((q) => q.status === 'Accepted');
    } else if (quoteStatusFilter === 'draft') {
      result = result.filter((q) => q.status === 'Draft');
    }

    if (debouncedQuoteSearch.trim()) {
      const q = debouncedQuoteSearch.toLowerCase().trim();
      result = result.filter((item) => {
        const quoteNo = (item.quoteNo || '').toLowerCase();
        const serviceTitle = (item.serviceTitle || '').toLowerCase();
        const branchName = (item.branchName || '').toLowerCase();
        const tourDates = (item.tourDates || '').toLowerCase();
        const remarks = (item.remarks || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        return quoteNo.includes(q) || serviceTitle.includes(q) || branchName.includes(q) || tourDates.includes(q) || remarks.includes(q) || status.includes(q);
      });
    }

    return result;
  }, [quotationsList, quoteStatusFilter, debouncedQuoteSearch]);

  // Paginated Quotations
  const paginatedQuotations = useMemo(() => {
    const startIndex = (quotePage - 1) * quotePageSize;
    return filteredQuotations.slice(startIndex, startIndex + quotePageSize);
  }, [filteredQuotations, quotePage, quotePageSize]);

  // Inquiry Filter Chips
  const inquiryFilterChips = useMemo(() => [
    { value: 'all', label: 'All Inquiries', count: inquiriesList.length },
    { value: 'submitted', label: 'Submitted', count: inquiriesList.filter((i) => (i.status || '').toLowerCase() === 'submitted').length },
    { value: 'in_review', label: 'Under Review', count: inquiriesList.filter((i) => ['in_review', 'under_review', 'processing'].includes((i.status || '').toLowerCase())).length },
    { value: 'quoted', label: 'Quoted', count: inquiriesList.filter((i) => ['quotation_created', 'quotation_sent', 'quoted', 'accepted'].includes((i.status || '').toLowerCase())).length },
  ], [inquiriesList]);

  // Filtered Inquiries
  const filteredInquiries = useMemo(() => {
    let result = [...inquiriesList];

    if (inquiryStatusFilter === 'submitted') {
      result = result.filter((i) => (i.status || '').toLowerCase() === 'submitted');
    } else if (inquiryStatusFilter === 'in_review') {
      result = result.filter((i) => ['in_review', 'under_review', 'processing'].includes((i.status || '').toLowerCase()));
    } else if (inquiryStatusFilter === 'quoted') {
      result = result.filter((i) => ['quotation_created', 'quotation_sent', 'quoted', 'accepted'].includes((i.status || '').toLowerCase()));
    }

    if (debouncedInquirySearch.trim()) {
      const q = debouncedInquirySearch.toLowerCase().trim();
      result = result.filter((item) => {
        const controlNo = (item.controlNo || item.id || '').toLowerCase();
        const formNo = (item.formNo || '').toLowerCase();
        const clientName = (item.clientName || item.fullName || '').toLowerCase();
        const serviceType = (item.serviceType || '').toLowerCase();
        const services = Array.isArray(item.servicesOffered) ? item.servicesOffered.join(' ').toLowerCase() : '';
        const reqs = (item.specifiedRequirements || '').toLowerCase();
        const remarks = (item.notes || item.remarks || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        return controlNo.includes(q) || formNo.includes(q) || clientName.includes(q) || serviceType.includes(q) || services.includes(q) || reqs.includes(q) || remarks.includes(q) || status.includes(q);
      });
    }

    return result;
  }, [inquiriesList, inquiryStatusFilter, debouncedInquirySearch]);

  // Paginated Inquiries
  const paginatedInquiries = useMemo(() => {
    const startIndex = (inquiryPage - 1) * inquiryPageSize;
    return filteredInquiries.slice(startIndex, startIndex + inquiryPageSize);
  }, [filteredInquiries, inquiryPage, inquiryPageSize]);

  // Quotation Columns for DataTable
  const quotationColumns = useMemo(() => [
    {
      key: 'quoteNo',
      header: 'Quotation / Service',
      render: (quote) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span className="quote-number-tag">{quote.quoteNo || 'Quotation'}</span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-dark, #0f172a)' }}>
            {quote.serviceTitle || 'Custom Service Package'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748b)', marginTop: '0.15rem' }}>
            <i className="fa-solid fa-building" style={{ marginRight: '0.25rem' }}></i>
            {quote.branchName || 'FairFly Travel & Tours'}
          </div>
        </div>
      )
    },
    {
      key: 'tourDates',
      header: 'Tour Schedule',
      render: (quote) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid, #475569)' }}>
          {quote.tourDates || 'As agreed with client'}
        </span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (quote) => {
        const total = Number(quote.totalAmount || quote.rate || 0);
        return (
          <div>
            <span style={{ fontWeight: 700, color: 'var(--purple-dark, #5b21b6)', fontSize: '0.9375rem' }}>
              ₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (quote) => {
        const isAccepted = quote.status === 'Accepted';
        const reqStatus = quote.requirementsStatus;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
            <span className={`quote-status-pill status-${(quote.status || 'draft').toLowerCase()}`}>
              {quote.status}
            </span>
            {reqStatus && reqStatus !== 'not_required' && !isAccepted && (
              <span style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                background: reqStatus === 'approved' ? '#f0fdf4' : reqStatus === 'submitted' ? '#eff6ff' : reqStatus === 'changes_requested' ? '#fef2f2' : '#fffbeb',
                color: reqStatus === 'approved' ? '#166534' : reqStatus === 'submitted' ? '#1e40af' : reqStatus === 'changes_requested' ? '#b91c1c' : '#b45309',
                border: `1px solid ${reqStatus === 'approved' ? '#bbf7d0' : reqStatus === 'submitted' ? '#bfdbfe' : reqStatus === 'changes_requested' ? '#fecaca' : '#fde68a'}`,
                fontWeight: 600,
                borderRadius: '0px'
              }}>
                {reqStatus === 'approved' ? '✓ Reqs Approved' : reqStatus === 'submitted' ? 'Reqs In Review' : reqStatus === 'changes_requested' ? 'Reqs Correction' : 'Reqs Required'}
              </span>
            )}
            {isAccepted && (
              <span className={`quote-payment-badge ${(quote.paymentStatus || 'unpaid').toLowerCase()}`}>
                <i className={`fa-solid ${quote.paymentStatus === 'PAID' ? 'fa-check' : quote.paymentStatus === 'PAYMENT_PENDING' ? 'fa-clock' : 'fa-circle-exclamation'}`}></i>
                {quote.paymentStatus === 'PAID' ? 'PAID' : quote.paymentStatus === 'PAYMENT_PENDING' ? 'PAYMENT PENDING' : 'UNPAID'}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (quote) => {
        const isSent = quote.status === 'Sent';
        const isAccepted = quote.status === 'Accepted';
        const isPaid = quote.paymentStatus === 'PAID';
        const isPaymentPending = quote.paymentStatus === 'PAYMENT_PENDING';
        const totalAmt = Number(quote.totalAmount || quote.rate || 0);
        const canAccept = !quote.requirementsStatus || quote.requirementsStatus === 'approved' || quote.requirementsStatus === 'not_required';

        return (
          <div className="client-row-actions">
            {/* View Details Button */}
            <button
              type="button"
              className="icon-btn view-action"
              title="View Complete Quotation Details"
              aria-label="View Complete Quotation Details"
              onClick={() => setViewingQuotation(quote)}
            >
              <i className="fa-solid fa-eye"></i>
            </button>

            {/* View PDF Button */}
            <button
              type="button"
              className="icon-btn pdf-action"
              title="View Official ADF-07-001 PDF"
              aria-label="View Official ADF-07-001 PDF"
              onClick={() => handleOpenPdf('quotation', quote)}
            >
              <i className="fa-solid fa-file-pdf"></i>
            </button>

            {/* Accept & Pay Action or Attach Docs */}
            {isSent && (
              canAccept ? (
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => handleInitiateAcceptQuotation(quote)}
                  disabled={acceptingQuoteId === quote.id}
                  title="Accept Quotation & Proceed to Pay"
                >
                  {acceptingQuoteId === quote.id ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Accept</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setViewingQuotation(quote)}
                  title="Review & Attach Service Documents"
                >
                  <i className="fa-solid fa-file-arrow-up"></i>
                  <span>{quote.requirementsStatus === 'changes_requested' ? 'Update Docs' : quote.requirementsStatus === 'submitted' ? 'In Review' : 'Attach Docs'}</span>
                </button>
              )
            )}

            {isAccepted && isPaymentPending && (
              <button
                type="button"
                className="btn btn-warning btn-xs btn-resume"
                onClick={() => handleOpenPayment(quote)}
                title="Resume Pending Payment"
                aria-label="Resume Pending Payment"
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>Resume</span>
              </button>
            )}

            {isAccepted && !isPaid && !isPaymentPending && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => handleOpenPayment(quote)}
                title={`Pay ₱${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              >
                <i className="fa-solid fa-credit-card"></i>
                <span>Pay</span>
              </button>
            )}
          </div>
        );
      }
    }
  ], [acceptingQuoteId]);

  // Inquiry Columns for DataTable
  const inquiryColumns = useMemo(() => [
    {
      key: 'controlNo',
      header: 'Control No & Client',
      render: (inq) => (
        <div>
          <span className="inq-ctrl-pill" style={{ display: 'inline-block', marginBottom: '0.2rem' }}>
            {inq.formNo || 'SAF-01-002'} · {inq.controlNo || inq.id.substring(0, 8)}
          </span>
          <div style={{ fontWeight: 600, color: 'var(--text-dark, #0f172a)' }}>
            {inq.clientName || 'Valued Client'}
            {inq.population && <span className="inq-pax-tag" style={{ marginLeft: '0.35rem' }}>({inq.population})</span>}
          </div>
        </div>
      )
    },
    {
      key: 'servicesOffered',
      header: 'Services Requested',
      render: (inq) => {
        const servicesList = Array.isArray(inq.servicesOffered)
          ? inq.servicesOffered
          : (inq.serviceType ? [inq.serviceType] : []);
        return (
          <div className="inq-table-services">
            {servicesList.length > 0 ? (
              servicesList.map((s, idx) => (
                <span key={idx} className="inq-table-service-chip">{s}</span>
              ))
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #94a3b8)' }}>Custom Service</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'dateInquired',
      header: 'Date Submitted',
      render: (inq) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid, #475569)' }}>
          {inq.dateInquired || (inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent')}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (inq) => (
        <span className={`inquiry-status-pill status-${(inq.status || 'submitted').toLowerCase()}`}>
          {(inq.status || 'Submitted').replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (inq) => {
        return (
          <div className="client-row-actions">
            {/* View Details Button */}
            <button
              type="button"
              className="icon-btn view-action"
              title="View Complete Inquiry Details"
              aria-label="View Complete Inquiry Details"
              onClick={() => setViewingInquiry(inq)}
            >
              <i className="fa-solid fa-eye"></i>
            </button>

            {/* View PDF Button */}
            <button
              type="button"
              className="icon-btn pdf-action"
              title="View Official SAF-01-002 PDF"
              aria-label="View Official SAF-01-002 PDF"
              onClick={() => handleOpenPdf('inquiry', inq)}
            >
              <i className="fa-solid fa-file-pdf"></i>
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="client-tracking-page">
      {/* Header Banner */}
      <div className="tracking-header-row">
        <div>
          <h2 className="tracking-header-title">
            <i className="fa-solid fa-compass tracking-title-icon-purple"></i>
            Client Requests & Tracking Portal
          </h2>
          <p className="tracking-header-subtitle">
            Manage your custom inquiries, review official quotations (ADF-07-001), and track ongoing service milestones.
          </p>
        </div>

        <div className="tracking-header-actions">
          <span className="tracking-realtime-badge">
            <i className="fa-solid fa-bolt"></i>
            Live Real-Time Sync
          </span>

          <button
            type="button"
            className="btn-primary tracking-primary-purple-btn"
            onClick={() => setIsInquiryModalOpen(true)}
          >
            <i className="fa-solid fa-file-circle-plus"></i>
            Submit New Inquiry
          </button>
        </div>
      </div>

      {/* Main 2-Tab Navigation */}
      <div className="client-portal-main-tabs">
        <button
          type="button"
          className={`portal-main-tab-btn ${mainTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setMainTab('ongoing')}
        >
          <i className="fa-solid fa-bars-progress"></i>
          <span>Ongoing Services</span>
          <span className="tab-pill-badge">{ongoingCount}</span>
        </button>

        <button
          type="button"
          className={`portal-main-tab-btn ${mainTab === 'inquiries_quotations' ? 'active' : ''}`}
          onClick={() => setMainTab('inquiries_quotations')}
        >
          <i className="fa-solid fa-file-invoice-dollar"></i>
          <span>My Inquiries & Quotations</span>
          <span className="tab-pill-badge">{inquiriesList.length + quotationsList.length}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: ONGOING SERVICES                                      */}
      {/* ============================================================ */}
      {mainTab === 'ongoing' && (
        <>
          {/* KPI Metrics Summary Grid */}
          <div className="tracking-kpi-grid">
            <div className="tracking-kpi-card">
              <div className="tracking-kpi-icon tracking-kpi-icon--purple">
                <i className="fa-solid fa-folder-open"></i>
              </div>
              <div className="tracking-kpi-info">
                <span className="tracking-kpi-label">Total Requested</span>
                <span className={`tracking-kpi-val ${loadingServices ? 'skeleton skeleton-text' : ''}`} style={loadingServices ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loadingServices ? '' : totalCount}</span>
              </div>
            </div>

            <div className="tracking-kpi-card">
              <div className="tracking-kpi-icon tracking-kpi-icon--orange">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="tracking-kpi-info">
                <span className="tracking-kpi-label">Currently In Progress</span>
                <span className={`tracking-kpi-val ${loadingServices ? 'skeleton skeleton-text' : ''}`} style={loadingServices ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loadingServices ? '' : ongoingCount}</span>
              </div>
            </div>

            <div className="tracking-kpi-card">
              <div className="tracking-kpi-icon tracking-kpi-icon--green">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="tracking-kpi-info">
                <span className="tracking-kpi-label">Completed & Released</span>
                <span className={`tracking-kpi-val ${loadingServices ? 'skeleton skeleton-text' : ''}`} style={loadingServices ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loadingServices ? '' : completedCount}</span>
              </div>
            </div>
          </div>

          {/* Sub-toolbar */}
          <div className="tracking-toolbar-card">
            <div className="tracking-tabs">
              <button
                type="button"
                className={`tracking-tab-btn ${servicesSubTab === 'all' ? 'active' : ''}`}
                onClick={() => setServicesSubTab('all')}
              >
                All Requests ({totalCount})
              </button>
              <button
                type="button"
                className={`tracking-tab-btn ${servicesSubTab === 'ongoing' ? 'active' : ''}`}
                onClick={() => setServicesSubTab('ongoing')}
              >
                In Progress ({ongoingCount})
              </button>
              <button
                type="button"
                className={`tracking-tab-btn ${servicesSubTab === 'completed' ? 'active' : ''}`}
                onClick={() => setServicesSubTab('completed')}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="tracking-search-box">
              <i className="fa-solid fa-magnifying-glass tracking-search-icon"></i>
              <input
                type="text"
                className="tracking-search-input"
                placeholder="Search by service name or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tracking-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* Trackers List Area */}
          <div className="tracking-cards-list">
            {loadingServices ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={`skel-srv-${i}`} className="client-service-tracker-card" aria-busy="true" style={{ padding: '1.5rem', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 'var(--radius-lg, 12px)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ width: '45%' }}>
                      <div className="skeleton skeleton-title" style={{ width: '80%', height: '1.25rem', marginBottom: '0.4rem' }} />
                      <div className="skeleton skeleton-text" style={{ width: '50%', height: '0.8rem', margin: 0 }} />
                    </div>
                    <div className="skeleton skeleton-badge" style={{ width: '6rem', height: '1.75rem' }} />
                  </div>
                  {/* Stepper bar skeleton */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1.5rem 0' }}>
                    {Array.from({ length: 4 }).map((_, sIdx) => (
                      <div key={sIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '2rem', height: '2rem' }} />
                        <div className="skeleton skeleton-text" style={{ width: '70%', height: '0.75rem', margin: 0 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div className="skeleton skeleton-text" style={{ width: '30%', height: '0.85rem', margin: 0 }} />
                    <div className="skeleton skeleton-btn" style={{ width: '6rem', height: '2rem' }} />
                  </div>
                </div>
              ))
            ) : filteredServices.length === 0 ? (
              <div className="tracking-empty-card">
                <div className="tracking-empty-icon">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <h3 className="tracking-empty-title">
                  {searchQuery ? 'No Matching Service Requests' : 'No Active Services In Progress'}
                </h3>
                <p className="tracking-empty-desc">
                  {searchQuery
                    ? 'Try refining your search keyword to locate your active requests.'
                    : 'Submit a custom inquiry or accept an operator quotation to begin service fulfillment.'}
                </p>
                <button
                  type="button"
                  className="btn-primary tracking-empty-action-btn"
                  onClick={() => setIsInquiryModalOpen(true)}
                >
                  <i className="fa-solid fa-file-circle-plus"></i>
                  Submit Custom Inquiry
                </button>
              </div>
            ) : (
              filteredServices.map((service) => (
                <ClientServiceTracker key={service.id} service={service} />
              ))
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MY INQUIRIES & QUOTATIONS                             */}
      {/* ============================================================ */}
      {mainTab === 'inquiries_quotations' && (
        <div className="client-inquiries-quotations-view">
          {/* Subtabs Navigation */}
          <div className="client-portal-subtabs">
            <button
              type="button"
              className={`client-portal-subtab-btn ${inquirySubTab === 'quotations' ? 'active' : ''}`}
              onClick={() => setInquirySubTab('quotations')}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i>
              <span>Official Quotations</span>
              <span className="badge-pill">{quotationsList.length}</span>
            </button>

            <button
              type="button"
              className={`client-portal-subtab-btn ${inquirySubTab === 'inquiries' ? 'active' : ''}`}
              onClick={() => setInquirySubTab('inquiries')}
            >
              <i className="fa-solid fa-file-signature"></i>
              <span>Submitted Inquiries</span>
              <span className="badge-pill">{inquiriesList.length}</span>
            </button>
          </div>

          {/* Subtab 1: Quotations DataTable View */}
          {inquirySubTab === 'quotations' && (
            <div className="client-table-card">
              <div className="portal-sub-header">
                <div>
                  <h3 className="portal-sub-title">
                    <i className="fa-solid fa-file-invoice-dollar tracking-title-icon-purple"></i>
                    Official Quotations Received (ADF-07-001)
                  </h3>
                  <p className="portal-sub-desc">
                    Review pricing, tour schedules, and inclusions prepared by FairFly operators. Accept a quotation to start service fulfillment.
                  </p>
                </div>
              </div>

              {/* Toolbar: Search + Filter Chips */}
              <div className="client-table-toolbar">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass search-icon"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search quotations by number, service, or branch..."
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                  />
                  {quoteSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setQuoteSearch('')}
                      aria-label="Clear search"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <FilterChipGroup
                  chips={quoteFilterChips}
                  activeChip={quoteStatusFilter}
                  onChipChange={setQuoteStatusFilter}
                />
              </div>

              {/* Quotations DataTable */}
              <DataTable
                columns={quotationColumns}
                data={paginatedQuotations}
                isLoading={loadingQuotations}
                emptyState={{
                  icon: 'fa-solid fa-file-circle-question',
                  message: quoteSearch || quoteStatusFilter !== 'all'
                    ? 'No quotations match the active search or filter criteria.'
                    : 'No quotations received yet. When operators prepare a quotation for your inquiry, it will appear here.'
                }}
              />

              {/* Pagination */}
              <Pagination
                currentPage={quotePage}
                totalItems={filteredQuotations.length}
                pageSize={quotePageSize}
                onPageChange={setQuotePage}
                onPageSizeChange={setQuotePageSize}
              />
            </div>
          )}

          {/* Subtab 2: Submitted Inquiries DataTable View */}
          {inquirySubTab === 'inquiries' && (
            <div className="client-table-card">
              <div className="portal-sub-header">
                <div>
                  <h3 className="portal-sub-title">
                    <i className="fa-solid fa-file-signature tracking-title-icon-purple"></i>
                    My Submitted Inquiries (SAF-01-002)
                  </h3>
                  <p className="portal-sub-desc">
                    Your submitted intake requests and specifications for custom service packages and travel assistance.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsInquiryModalOpen(true)}
                >
                  <i className="fa-solid fa-plus"></i> Submit Another Inquiry
                </button>
              </div>

              {/* Toolbar: Search + Filter Chips */}
              <div className="client-table-toolbar">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass search-icon"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search inquiries by control no, services, or details..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                  />
                  {inquirySearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setInquirySearch('')}
                      aria-label="Clear search"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <FilterChipGroup
                  chips={inquiryFilterChips}
                  activeChip={inquiryStatusFilter}
                  onChipChange={setInquiryStatusFilter}
                />
              </div>

              {/* Inquiries DataTable */}
              <DataTable
                columns={inquiryColumns}
                data={paginatedInquiries}
                isLoading={loadingInquiries}
                emptyState={{
                  icon: 'fa-solid fa-file-lines',
                  message: inquirySearch || inquiryStatusFilter !== 'all'
                    ? 'No inquiries match the active search or filter criteria.'
                    : 'No inquiries submitted yet. Submit a new inquiry to request custom travel services.'
                }}
              />

              {/* Pagination */}
              <Pagination
                currentPage={inquiryPage}
                totalItems={filteredInquiries.length}
                pageSize={inquiryPageSize}
                onPageChange={setInquiryPage}
                onPageSizeChange={setInquiryPageSize}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ClientInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        onInquirySubmitted={() => {
          setMainTab('inquiries_quotations');
          setInquirySubTab('inquiries');
        }}
      />

      <ClientServiceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* Official PDF Document Preview Modal */}
      <PdfDocumentView
        isOpen={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setPdfModalData(null);
        }}
        type={pdfModalType}
        data={pdfModalData}
      />

      {/* PayMongo Payment Checkout Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedQuotationForPayment(null);
        }}
        quotation={selectedQuotationForPayment}
      />

      {/* Quotation Complete Detail View Modal */}
      <QuotationDetailModal
        isOpen={!!viewingQuotation}
        onClose={() => setViewingQuotation(null)}
        quotation={viewingQuotation}
        onAcceptQuotation={(q) => {
          setViewingQuotation(null);
          handleInitiateAcceptQuotation(q);
        }}
        onOpenPayment={(q) => {
          setViewingQuotation(null);
          handleOpenPayment(q);
        }}
        onOpenPdf={(type, data) => handleOpenPdf(type, data)}
        isAccepting={acceptingQuoteId === viewingQuotation?.id}
      />

      {/* Inquiry Complete Detail View Modal */}
      <InquiryDetailModal
        isOpen={!!viewingInquiry}
        onClose={() => setViewingInquiry(null)}
        inquiry={viewingInquiry}
        onOpenPdf={(type, data) => handleOpenPdf(type, data)}
      />

      {/* Quotation Acceptance Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!quotationToAccept}
        onClose={() => !acceptingQuoteId && setQuotationToAccept(null)}
        icon="fa-solid fa-file-circle-check"
        title="Accept Service Quotation"
        message={
          quotationToAccept
            ? `Accept Quotation ${quotationToAccept.quoteNo || ''} for ₱${Number(quotationToAccept.totalAmount || quotationToAccept.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? You can proceed directly to secure payment to begin service fulfillment.`
            : ''
        }
        confirmText="Accept Quotation"
        cancelText="Cancel"
        onConfirm={handleConfirmAcceptQuotation}
        isLoading={!!acceptingQuoteId}
      />
    </div>
  );
}


