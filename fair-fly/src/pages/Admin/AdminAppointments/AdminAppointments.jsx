import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, limit, getCountFromServer, where } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';

import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import DataTable from '../../../components/UI/DataTable/DataTable';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import AppointmentCalendar from '../../../components/Shared/AppointmentCalendar/AppointmentCalendar';
import OperatorModal from '../../../components/Admin/Modals/OperatorModal/OperatorModal';

import { updateAppointmentStatus } from '../../../services/appointmentService';
import { createOperator } from '../../../services/adminService';

import './admin-appointments.css';

export default function AdminAppointments() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Operator Creation Modal state (Grant Franchise)
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [prefilledOperatorData, setPrefilledOperatorData] = useState(null);
  const [isCreatingOperator, setIsCreatingOperator] = useState(false);

  // KPI server counts
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0
  });

  const fetchKpis = useCallback(async () => {
    try {
      const col = collection(firestore, 'appointments');
      const franchiseFilter = where('type', '==', 'franchise_consultation');
      const [totalSnap, pendingSnap, confirmedSnap, completedSnap] = await Promise.all([
        getCountFromServer(query(col, franchiseFilter)),
        getCountFromServer(query(col, franchiseFilter, where('status', 'in', ['Pending', 'pending']))),
        getCountFromServer(query(col, franchiseFilter, where('status', 'in', ['Confirmed', 'confirmed']))),
        getCountFromServer(query(col, franchiseFilter, where('status', 'in', ['Completed', 'completed'])))
      ]);

      setCounts({
        total: totalSnap.data().count,
        pending: pendingSnap.data().count,
        confirmed: confirmedSnap.data().count,
        completed: completedSnap.data().count
      });
    } catch (err) {
      console.warn('[AdminAppointments] KPI aggregation notice:', err.message);
    }
  }, []);

  // Real-time Firestore sync — franchise consultations only.
  // NOTE: orderBy is intentionally omitted here because the composite index
  // (type ASC + createdAt DESC) does not yet exist in Firestore. Without it,
  // the query would error silently and fall back to returning ALL documents.
  // Sorting is applied client-side below after documents are received.
  useEffect(() => {
    fetchKpis();

    const q = query(
      collection(firestore, 'appointments'),
      where('type', '==', 'franchise_consultation'),
      limit(300)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          // Sort client-side: newest first by createdAt
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        setAppointments(list);
        setLoading(false);
      },
      (err) => {
        console.error('[AdminAppointments] Firestore onSnapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fetchKpis]);

  // Keep selectedAppt in sync if real-time update occurs
  useEffect(() => {
    if (selectedAppt) {
      const updated = appointments.find((a) => a.id === selectedAppt.id);
      if (updated) {
        setSelectedAppt(updated);
      }
    }
  }, [appointments, selectedAppt]);

  // Filtered appointments — all records are franchise_consultation (filtered at query level)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Status filter
      if (statusFilter !== 'all') {
        const s = (appt.status || 'Pending').toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }

      // Search term
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const clientName = (appt.clientName || appt.name || '').toLowerCase();
        const clientEmail = (appt.clientEmail || appt.email || '').toLowerCase();
        const clientPhone = (appt.clientPhone || appt.phone || '').toLowerCase();
        const branch = (appt.branchName || appt.preferredBranchLocation || appt.location || '').toLowerCase();
        const notes = (appt.notes || '').toLowerCase();

        if (
          !clientName.includes(term) &&
          !clientEmail.includes(term) &&
          !clientPhone.includes(term) &&
          !branch.includes(term) &&
          !notes.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, debouncedSearch]);

  // Table pagination slice
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  // Handlers for Appointment Status
  const handleUpdateStatus = (id, newStatus) => {
    setIsUpdatingStatus(true);
    updateAppointmentStatus(
      userToken,
      id,
      newStatus,
      () => {
        addToast(`Appointment status updated to ${newStatus}`, 'success');
        setIsUpdatingStatus(false);
        fetchKpis();
      },
      (error) => {
        setIsUpdatingStatus(false);
        addToast(toFriendlyMessage(error, 'Failed to update appointment status.'), 'error');
      },
      setIsUpdatingStatus
    );
  };

  const handleOpenDetails = (appt) => {
    setSelectedAppt(appt);
    setIsDetailOpen(true);
  };

  const handleCloseDetails = () => {
    if (isUpdatingStatus) return;
    setIsDetailOpen(false);
    setSelectedAppt(null);
  };

  // Open Grant Franchise modal
  const handleOpenGrantFranchise = (appt) => {
    const prefill = {
      branchName: appt.preferredBranchLocation || (appt.clientName ? `${appt.clientName} Branch` : ''),
      email: appt.clientEmail || appt.email || '',
      contactNumber: appt.clientPhone || appt.phone || '',
      address: appt.preferredBranchLocation || '',
      franchiseApplicationId: appt.franchiseApplicationId || '',
      appointmentId: appt.id
    };
    setPrefilledOperatorData(prefill);
    setIsOperatorModalOpen(true);
  };

  // Submit Grant Franchise (Create Operator)
  const handleCreateOperatorSubmit = (formData) => {
    createOperator(
      userToken,
      formData,
      () => {
        addToast('Operator account created and franchise granted successfully!', 'success');
        setIsOperatorModalOpen(false);
        setPrefilledOperatorData(null);
        setIsDetailOpen(false);
        setSelectedAppt(null);
        fetchKpis();
      },
      (error) => {
        console.error('Error creating operator:', error);
        addToast(toFriendlyMessage(error, 'Failed to create operator account.'), 'error');
      },
      setIsCreatingOperator
    );
  };

  // Columns for DataTable — all rows are franchise consultations
  const columns = useMemo(() => [
    {
      key: 'client',
      header: 'Applicant',
      render: (appt) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-dark, #0f172a)' }}>
            {appt.clientName || appt.name || 'Applicant'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748b)' }}>
            {appt.clientEmail || appt.email || '—'}
          </span>
        </div>
      )
    },
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (appt) => {
        const dateStr = appt.preferredDate || appt.date || appt.appointmentDate || '—';
        const timeStr = appt.startTime && appt.endTime
          ? `${appt.startTime} – ${appt.endTime}`
          : (appt.preferredTime || appt.time || '—');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-dark, #0f172a)' }}>{dateStr}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748b)' }}>{timeStr}</span>
          </div>
        );
      }
    },
    {
      key: 'location',
      header: 'Preferred Location',
      render: (appt) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-mid, #334155)' }}>
          {appt.branchName || appt.preferredBranchLocation || appt.location || 'FairFly Office'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => {
        const s = (appt.status || 'Pending').toLowerCase();
        let cls = 'badge-status-pending';
        let icon = 'fa-clock';
        if (s === 'confirmed') {
          cls = 'badge-status-confirmed';
          icon = 'fa-circle-check';
        } else if (s === 'completed') {
          cls = 'badge-status-completed';
          icon = 'fa-flag-checkered';
        } else if (s === 'cancelled') {
          cls = 'badge-status-cancelled';
          icon = 'fa-ban';
        }

        return (
          <span className={`badge-status ${cls}`}>
            <i className={`fa-solid ${icon}`}></i> {appt.status || 'Pending'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (appt) => (
        <button
          type="button"
          className="admin-appt-action-btn"
          onClick={() => handleOpenDetails(appt)}
          aria-label={`View details for consultation with ${appt.clientName || 'applicant'}`}
        >
          <i className="fa-regular fa-eye"></i> Details
        </button>
      )
    }
  ], []);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Appointments' }
  ];

  // Every appointment on this page is a franchise consultation
  const statusLower = (selectedAppt?.status || 'pending').toLowerCase();

  return (
    <main className="admin-appointments-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Franchise Consultations"
        subtitle="Manage scheduled consultations with aspiring franchise applicants"
        illustrationSrc="/pageImages/operator/appointments.png"
      />

      {/* KPI Cards */}
      <section className="admin-appointments-kpi-grid">
        <KpiCard
          title="Total Consultations"
          value={counts.total}
          icon="fa-regular fa-calendar-check"
          iconColor="#7c3aed"
          badge="All Time"
          badgeType="neutral"
        />
        <KpiCard
          title="Awaiting Confirmation"
          value={counts.pending}
          icon="fa-regular fa-clock"
          iconColor="#f59e0b"
          badge={counts.pending > 0 ? 'Requires Review' : 'Up to Date'}
          badgeType={counts.pending > 0 ? 'warn' : 'ok'}
        />
        <KpiCard
          title="Confirmed"
          value={counts.confirmed}
          icon="fa-regular fa-circle-check"
          iconColor="#10b981"
          badge="Scheduled"
          badgeType="ok"
        />
        <KpiCard
          title="Completed"
          value={counts.completed}
          icon="fa-solid fa-flag-checkered"
          iconColor="#6366f1"
          badge="Done"
          badgeType="info"
        />
      </section>

      {/* Main Container */}
      <section className="admin-appointments-card">
        {/* Toolbar */}
        <div className="admin-appointments-toolbar">
          <div className="admin-appointments-search-filters">
            <div className="admin-appointments-search-box">
              <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
              <input
                type="text"
                placeholder="Search applicant, email, location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <FilterChipGroup
              chips={[
                { value: 'all', label: `All (${counts.total})` },
                { value: 'pending', label: `Pending (${counts.pending})` },
                { value: 'confirmed', label: `Confirmed (${counts.confirmed})` },
                { value: 'completed', label: `Completed (${counts.completed})` },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              activeChip={statusFilter}
              onChipChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* View Toggle */}
          <div className="admin-view-toggle">
            <button
              type="button"
              className={`admin-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
              aria-label="Switch to calendar view"
            >
              <i className="fa-regular fa-calendar-days"></i> Calendar
            </button>
            <button
              type="button"
              className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Switch to table view"
            >
              <i className="fa-solid fa-table-list"></i> Table
            </button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'calendar' ? (
          <AppointmentCalendar
            role="admin"
            appointments={filteredAppointments}
            onSelectAppointment={(appt) => handleOpenDetails(appt)}
            isLoading={loading}
            showStatusFilter={false}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedAppointments}
              isLoading={loading}
              keyField="id"
              emptyState={{
                icon: 'fa-regular fa-calendar-xmark',
                message: 'No appointments match your filters'
              }}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredAppointments.length / pageSize))}
              onPageChange={setCurrentPage}
              totalItems={filteredAppointments.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </section>

      {/* Appointment Details Modal */}
      <BaseModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetails}
        maxWidth="62rem"
        width="95%"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <i className="fa-regular fa-calendar-check" style={{ color: 'var(--purple, #7c3aed)' }}></i>
            <span>Franchise Consultation Details</span>
          </div>
        }
        subtitle="Review the meeting schedule, applicant details, and update the consultation status"
      >
        {selectedAppt && (
          <div className="admin-appt-modal-body">
            {/* Top Banner with Status */}
            <div className="admin-appt-modal-header-banner">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748b)', display: 'block' }}>Type</span>
                <span className="badge-type-franchise">
                  <i className="fa-solid fa-briefcase"></i> Franchise Consultation
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #64748b)', display: 'block' }}>Status</span>
                <span className={`badge-status badge-status-${statusLower}`}>
                  {selectedAppt.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Applicant Information */}
            <h4 className="admin-appt-modal-section-title">
              <i className="fa-regular fa-user" style={{ color: 'var(--purple, #7c3aed)' }}></i>
              Applicant Information
            </h4>
            <div className="admin-appt-modal-grid">
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Full Name</span>
                <span className="admin-appt-modal-value">{selectedAppt.clientName || selectedAppt.name || '—'}</span>
              </div>
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Email Address</span>
                <span className="admin-appt-modal-value">{selectedAppt.clientEmail || selectedAppt.email || '—'}</span>
              </div>
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Contact Number</span>
                <span className="admin-appt-modal-value">{selectedAppt.clientPhone || selectedAppt.phone || '—'}</span>
              </div>
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Branch / Location</span>
                <span className="admin-appt-modal-value">
                  {selectedAppt.preferredBranchLocation || selectedAppt.branchName || selectedAppt.location || 'FairFly Office'}
                </span>
              </div>
            </div>

            {/* Consultation Schedule */}
            <h4 className="admin-appt-modal-section-title">
              <i className="fa-regular fa-clock" style={{ color: 'var(--purple, #7c3aed)' }}></i>
              Scheduled Window
            </h4>
            <div className="admin-appt-modal-grid">
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Date</span>
                <span className="admin-appt-modal-value highlight">
                  {selectedAppt.preferredDate || selectedAppt.date || selectedAppt.appointmentDate || '—'}
                </span>
              </div>
              <div className="admin-appt-modal-item">
                <span className="admin-appt-modal-label">Time Window</span>
                <span className="admin-appt-modal-value highlight">
                  {selectedAppt.startTime && selectedAppt.endTime
                    ? `${selectedAppt.startTime} – ${selectedAppt.endTime}`
                    : (selectedAppt.preferredTime || selectedAppt.time || '—')}
                </span>
              </div>
              {selectedAppt.franchiseApplicationId && (
                <div className="admin-appt-modal-item">
                  <span className="admin-appt-modal-label">Franchise Application ID</span>
                  <span className="admin-appt-modal-value">
                    <code>{selectedAppt.franchiseApplicationId}</code>
                  </span>
                </div>
              )}
            </div>

            {/* Capability Proofs / Attachments */}
            {Array.isArray(selectedAppt.proofOfCapability) && selectedAppt.proofOfCapability.length > 0 && (
              <>
                <h4 className="admin-appt-modal-section-title">
                  <i className="fa-solid fa-file-shield" style={{ color: 'var(--purple, #7c3aed)' }}></i>
                  Capability Proofs & Credentials
                </h4>
                <div className="admin-appt-proofs-grid">
                  {selectedAppt.proofOfCapability.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-appt-proof-card"
                      title={doc.name}
                    >
                      <i className="fa-regular fa-file-pdf admin-appt-proof-icon"></i>
                      <div className="admin-appt-proof-info">
                        <span className="admin-appt-proof-name">{doc.name}</span>
                        <span className="admin-appt-proof-meta">
                          {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : 'Document'} · Open File
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Notes / Message */}
            {selectedAppt.notes && (
              <>
                <h4 className="admin-appt-modal-section-title">
                  <i className="fa-regular fa-comment-dots" style={{ color: 'var(--purple, #7c3aed)' }}></i>
                  Notes & Discussion Points
                </h4>
                <div className="admin-appt-modal-notes">{selectedAppt.notes}</div>
              </>
            )}

            {/* Modal Actions */}
            <div className="admin-appt-modal-actions">
              {statusLower === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn-cancel-appt"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'Cancelled')}
                  >
                    <i className="fa-solid fa-ban"></i> Cancel Consultation
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-appt"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'Confirmed')}
                  >
                    {isUpdatingStatus ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Updating...</>
                    ) : (
                      <><i className="fa-solid fa-circle-check"></i> Confirm Appointment</>
                    )}
                  </button>
                </>
              )}

              {statusLower === 'confirmed' && (
                <>
                  <button
                    type="button"
                    className="btn-cancel-appt"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'Cancelled')}
                  >
                    <i className="fa-solid fa-ban"></i> Cancel Consultation
                  </button>
                  <button
                    type="button"
                    className="btn-complete-appt"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'Completed')}
                  >
                    {isUpdatingStatus ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Updating...</>
                    ) : (
                      <><i className="fa-solid fa-flag-checkered"></i> Mark as Completed</>
                    )}
                  </button>
                </>
              )}

              {statusLower === 'completed' && (
                <button
                  type="button"
                  className="btn-grant-franchise"
                  onClick={() => handleOpenGrantFranchise(selectedAppt)}
                >
                  <i className="fa-solid fa-user-plus"></i> Grant Franchise & Create Operator Account
                </button>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* Operator Account Creation Modal (Post-Consultation Approval) */}
      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => {
          if (!isCreatingOperator) {
            setIsOperatorModalOpen(false);
            setPrefilledOperatorData(null);
          }
        }}
        editingOperator={prefilledOperatorData}
        onSubmit={handleCreateOperatorSubmit}
        isLoading={isCreatingOperator}
      />
    </main>
  );
}
