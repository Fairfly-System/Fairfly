import { useState, useMemo } from 'react';
import { Outlet, Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import { updateAppointmentStatus } from '../../../services/appointmentService';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-appointments.css';

export function AppointmentContent() {
  const { data: appointments, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((appt) => {
      const nameStr = (appt.clientName || appt.name || '').toLowerCase();
      const emailStr = (appt.clientEmail || appt.email || '').toLowerCase();
      const serviceStr = (appt.serviceType || appt.service || '').toLowerCase();
      const search = debouncedSearch.toLowerCase();

      const matchesSearch =
        nameStr.includes(search) ||
        emailStr.includes(search) ||
        serviceStr.includes(search);

      const apptStatus = (appt.status || 'Pending').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || apptStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [appointments, debouncedSearch, statusFilter]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  const handleStatusChange = (id, newStatus) => {
    updateAppointmentStatus(
      userToken,
      id,
      newStatus,
      () => {
        addToast(`Appointment status updated to ${newStatus}`, 'success');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Could not update appointment status. Please try again.'), 'error');
      },
      setIsSubmitting
    );
  };

  const pendingCount = (appointments || []).filter((a) => (a.status || '').toLowerCase() === 'pending').length;

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Appointments' },
  ];

  return (
    <main className="operator-appointments-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Appointment Requests"
        subtitle="Clients requesting face-to-face consultations"
        illustrationSrc="/pageImages/operator/appointments.png"
      />

      <section className="card op-appointments">

      {/* Toolbar Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search client name, email, or service..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <FilterChipGroup
          chips={[
            { value: 'all', label: `All (${(appointments || []).length})` },
            { value: 'pending', label: `Pending (${pendingCount})` },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          activeChip={statusFilter}
          onChipChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="op-appt-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <article key={`skel-appt-${i}`} className="op-appt-card" aria-busy="true">
              <div className="op-appt-top">
                <div className="op-appt-left">
                  <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }} />
                  <div style={{ width: '12rem' }}>
                    <div className="skeleton skeleton-title" style={{ width: '70%', height: '1.1rem', marginBottom: '0.35rem' }} />
                    <div className="skeleton skeleton-text" style={{ width: '90%', height: '0.75rem', margin: 0 }} />
                  </div>
                </div>
                <div className="op-appt-actions">
                  <div className="skeleton skeleton-badge" style={{ width: '4.5rem', height: '1.5rem' }} />
                  <div className="skeleton skeleton-btn" style={{ width: '6.5rem', height: '2rem' }} />
                </div>
              </div>
              <div className="op-appt-grid">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="skeleton skeleton-text" style={{ width: '80%', height: '0.9rem', margin: 0 }} />
                ))}
              </div>
            </article>
          ))
        ) : paginatedAppointments.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-regular fa-calendar-xmark empty-icon"></i>
            <p>No appointment requests match your filters</p>
          </div>
        ) : (
          paginatedAppointments.map((a) => {
            const name = a.clientName || a.name || 'Client';
            const email = a.clientEmail || a.email || 'N/A';
            const phone = a.clientPhone || a.phone || 'N/A';
            const service = a.serviceType || a.service || 'General Inquiry';
            const date = a.preferredDate || a.date || 'N/A';
            const time = a.preferredTime || a.time || 'N/A';
            const purpose = a.purpose || 'Face-to-face consultation';

            return (
              <article key={a.id} className="op-appt-card">
                <div className="op-appt-top">
                  <div className="op-appt-left">
                    <div className="op-avatar">{name[0]?.toUpperCase() || 'C'}</div>
                    <div>
                      <p className="op-appt-name">{name}</p>
                      <p className="op-appt-email">
                        <i className="fa-regular fa-envelope"></i> {email}
                      </p>
                    </div>
                  </div>
                  <div className="op-appt-actions">
                    <span
                      className={`status-pill ${
                        (a.status || '').toLowerCase() === 'confirmed'
                          ? 'status-pill-active'
                          : (a.status || '').toLowerCase() === 'cancelled'
                          ? 'status-pill-disabled'
                          : 'status-pill-pending'
                      }`}
                    >
                      {a.status || 'Pending'}
                    </span>
                    <div className="op-appt-btn-group">
                      <Link
                        to={`/operator/appointments/${a.id}`}
                        className="op-appt-btn confirm"
                        style={{ background: 'var(--purple-light-2)', color: 'var(--purple-dark)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="fa-solid fa-eye"></i> View details
                      </Link>
                      {(a.status || 'Pending').toLowerCase() === 'pending' && (
                        <>
                          <button
                            className="op-appt-btn confirm"
                            disabled={isSubmitting}
                            onClick={() => handleStatusChange(a.id, 'Confirmed')}
                          >
                            <i className="fa-solid fa-circle-check"></i> Confirm
                          </button>
                          <button
                            className="op-appt-btn cancel"
                            disabled={isSubmitting}
                            onClick={() => handleStatusChange(a.id, 'Cancelled')}
                          >
                            <i className="fa-solid fa-xmark"></i> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="op-appt-grid">
                  <span>
                    <i className="fa-solid fa-phone" style={{ color: 'var(--purple)' }}></i>{' '}
                    {phone}
                  </span>
                  <span>
                    <i className="fa-regular fa-file-lines" style={{ color: '#3B82F6' }}></i>{' '}
                    {service}
                  </span>
                  <span>
                    <i className="fa-regular fa-calendar" style={{ color: 'var(--orange)' }}></i>{' '}
                    {date}
                  </span>
                  <span>
                    <i className="fa-regular fa-clock" style={{ color: 'var(--orange)' }}></i>{' '}
                    {time}
                  </span>
                </div>

                <p className="op-appt-purpose">
                  <strong>Purpose:</strong> {purpose}
                </p>
                <p className="op-appt-requested">
                  Requested: {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Recently'}
                </p>
              </article>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredAppointments.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
      </section>
    </main>
  );
}

export default function OperatorAppointments() {
  return (
    <OperatorProvider targetCollection="appointments">
      <Outlet />
    </OperatorProvider>
  );
}
