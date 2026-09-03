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
import { acceptQuotation } from '../../../services/quotationService';
import './client-tracking.css';

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

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // PDF Preview Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalType, setPdfModalType] = useState('quotation'); // 'quotation' | 'inquiry'
  const [pdfModalData, setPdfModalData] = useState(null);

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

  // Accept Quotation handler
  const handleAcceptQuotation = (quotation) => {
    if (!quotation?.id) return;

    if (!window.confirm(`Are you sure you want to accept Quotation ${quotation.quoteNo || ''} for ₱${Number(quotation.totalAmount || quotation.rate || 0).toLocaleString()}? This will create your active Custom Service.`)) {
      return;
    }

    setAcceptingQuoteId(quotation.id);
    acceptQuotation(
      userToken,
      quotation.id,
      (res) => {
        setAcceptingQuoteId(null);
        addToast(
          'Quotation accepted! Your custom service has been initiated and is now in Ongoing Services.',
          'success'
        );
        setMainTab('ongoing');
      },
      (err) => {
        setAcceptingQuoteId(null);
        console.error('Error accepting quotation:', err);
        addToast(err?.message || 'Failed to accept quotation. Please try again.', 'danger');
      }
    );
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
                <span className="tracking-kpi-val">{totalCount}</span>
              </div>
            </div>

            <div className="tracking-kpi-card">
              <div className="tracking-kpi-icon tracking-kpi-icon--orange">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
              <div className="tracking-kpi-info">
                <span className="tracking-kpi-label">Currently In Progress</span>
                <span className="tracking-kpi-val">{ongoingCount}</span>
              </div>
            </div>

            <div className="tracking-kpi-card">
              <div className="tracking-kpi-icon tracking-kpi-icon--green">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="tracking-kpi-info">
                <span className="tracking-kpi-label">Completed & Released</span>
                <span className="tracking-kpi-val">{completedCount}</span>
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
              <div className="tracking-empty-card">
                <i className="fa-solid fa-spinner fa-spin tracking-empty-icon tracking-loading-spinner"></i>
                <h3 className="tracking-loading-title">Connecting to Live Tracker...</h3>
                <p className="tracking-loading-subtitle">
                  Retrieving your active service request statuses from Firestore.
                </p>
              </div>
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
          {/* Section 2A: Quotations Received */}
          <div className="portal-sub-section">
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

            {loadingQuotations ? (
              <div className="tracking-empty-card">
                <i className="fa-solid fa-spinner fa-spin tracking-empty-icon"></i>
                <span>Loading your quotations...</span>
              </div>
            ) : quotationsList.length === 0 ? (
              <div className="empty-sub-card">
                <i className="fa-solid fa-file-circle-question"></i>
                <div>
                  <strong>No quotations received yet.</strong>
                  <p>When our operators review your inquiry and prepare a quotation, it will appear here for your review and one-click acceptance.</p>
                </div>
              </div>
            ) : (
              <div className="quotation-cards-grid">
                {quotationsList.map((quote) => {
                  const isAccepted = quote.status === 'Accepted';
                  const isSent = quote.status === 'Sent';
                  const isDraft = quote.status === 'Draft';
                  const totalAmt = Number(quote.totalAmount || quote.rate || 0);

                  return (
                    <article key={quote.id} className={`client-quote-card ${isAccepted ? 'is-accepted' : ''}`}>
                      <div className="quote-card-header">
                        <div>
                          <div className="quote-number-tag">{quote.quoteNo || 'Quotation'}</div>
                          <h4 className="quote-service-title">{quote.serviceTitle || 'Custom Service Package'}</h4>
                          <span className="quote-branch-label">
                            <i className="fa-solid fa-building"></i> {quote.branchName || 'FairFly Travel & Tours'}
                          </span>
                        </div>

                        <div className="quote-status-badge-wrap">
                          <span className={`quote-status-pill status-${(quote.status || 'draft').toLowerCase()}`}>
                            {quote.status}
                          </span>
                        </div>
                      </div>

                      <div className="quote-card-body">
                        <div className="quote-details-row">
                          <span className="q-label">Tour / Schedule Dates:</span>
                          <span className="q-val">{quote.tourDates || 'As agreed with client'}</span>
                        </div>

                        {quote.inclusions && (
                          <div className="quote-details-row">
                            <span className="q-label">Inclusions:</span>
                            <span className="q-val multiline">{quote.inclusions}</span>
                          </div>
                        )}

                        {quote.exclusions && (
                          <div className="quote-details-row">
                            <span className="q-label">Exclusions:</span>
                            <span className="q-val multiline">{quote.exclusions}</span>
                          </div>
                        )}

                        {quote.rateBreakdown && (
                          <div className="quote-details-row">
                            <span className="q-label">Rate Breakdown:</span>
                            <span className="q-val">{quote.rateBreakdown}</span>
                          </div>
                        )}

                        <div className="quote-total-price-box">
                          <span className="q-price-label">Total Amount:</span>
                          <span className="q-price-val">₱{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {quote.remarks && (
                          <div className="quote-remarks-callout">
                            <i className="fa-solid fa-info-circle"></i>
                            <span>{quote.remarks}</span>
                          </div>
                        )}
                      </div>

                      <div className="quote-card-footer">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenPdf('quotation', quote)}
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                          <span>View Official PDF</span>
                        </button>

                        {isSent && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm btn-accept"
                            onClick={() => handleAcceptQuotation(quote)}
                            disabled={acceptingQuoteId === quote.id}
                          >
                            {acceptingQuoteId === quote.id ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>Accepting...</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-circle-check"></i>
                                <span>Accept Quotation</span>
                              </>
                            )}
                          </button>
                        )}

                        {isAccepted && (
                          <span className="quote-accepted-notice">
                            <i className="fa-solid fa-check-double"></i> Accepted · Custom Service Active
                          </span>
                        )}

                        {isDraft && (
                          <span className="quote-draft-notice">
                            <i className="fa-solid fa-pencil"></i> Operator is finalizing this quote
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2B: My Inquiries Intake Forms */}
          <div className="portal-sub-section portal-sub-section-spaced">
            <div className="portal-sub-header">
              <div>
                <h3 className="portal-sub-title">
                  <i className="fa-solid fa-file-signature tracking-title-icon-purple"></i>
                  My Submitted Inquiries (SAF-01-002)
                </h3>
                <p className="portal-sub-desc">
                  Your submitted specifications for custom service packages and travel assistance.
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

            {loadingInquiries ? (
              <div className="tracking-empty-card">
                <i className="fa-solid fa-spinner fa-spin tracking-empty-icon"></i>
                <span>Loading your inquiries...</span>
              </div>
            ) : inquiriesList.length === 0 ? (
              <div className="empty-sub-card">
                <i className="fa-solid fa-file-lines"></i>
                <div>
                  <strong>No inquiries submitted yet.</strong>
                  <p>Click "Submit New Inquiry" above to request custom travel, transport, or document services.</p>
                </div>
              </div>
            ) : (
              <div className="inquiry-cards-list">
                {inquiriesList.map((inq) => {
                  const servicesList = Array.isArray(inq.servicesOffered)
                    ? inq.servicesOffered
                    : (inq.serviceType ? [inq.serviceType] : []);

                  return (
                    <div key={inq.id} className="client-inquiry-card">
                      <div className="inq-card-top">
                        <div>
                          <span className="inq-ctrl-pill">
                            {inq.formNo || 'SAF-01-002'} · {inq.controlNo || inq.id.substring(0, 8)}
                          </span>
                          <h4 className="inq-client-name">
                            {inq.clientName || 'Valued Client'}
                            {inq.population && <span className="inq-pax-tag">({inq.population})</span>}
                          </h4>
                          <span className="inq-date">
                            Submitted on {inq.dateInquired || (inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent')}
                          </span>
                        </div>

                        <div className="inq-actions-col">
                          <span className={`inquiry-status-pill status-${(inq.status || 'submitted').toLowerCase()}`}>
                            {(inq.status || 'Submitted').replace('_', ' ')}
                          </span>

                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenPdf('inquiry', inq)}
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span>View SAF-01-002</span>
                          </button>
                        </div>
                      </div>

                      {/* Services Offered Tags */}
                      {servicesList.length > 0 && (
                        <div className="inq-services-chips">
                          <span className="chip-label">Services:</span>
                          {servicesList.map((s, idx) => (
                            <span key={idx} className="inq-service-badge">{s}</span>
                          ))}
                        </div>
                      )}

                      {/* Specified Requirements Excerpt */}
                      <div className="inq-requirements-box">
                        <strong>Specified Requirements:</strong>
                        <p>{inq.specifiedRequirements || inq.requirements || 'No specific requirements entered.'}</p>
                      </div>

                      {inq.remarks && (
                        <div className="inq-remarks-box">
                          <strong>Remarks:</strong> {inq.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        onInquirySubmitted={() => {
          setMainTab('inquiries_quotations');
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
    </div>
  );
}

