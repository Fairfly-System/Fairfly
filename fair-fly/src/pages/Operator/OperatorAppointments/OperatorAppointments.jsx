import { useState, useMemo } from 'react';
import './operator-appointments.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';

const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+63 917 555 1234',
    service: 'Passport Processing',
    date: 'March 28, 2026',
    time: '10:00 AM',
    purpose: 'Need to renew passport for upcoming business trip to Singapore',
    requested: 'March 26, 2026 - 8:30 AM',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'Elena Torres',
    email: 'elena.torres@email.com',
    phone: '+63 918 555 5678',
    service: 'VISA Assistance',
    date: 'March 29, 2026',
    time: '2:00 PM',
    purpose: 'Applying for US tourist visa, need consultation on requirements',
    requested: 'March 26, 2026 - 9:15 AM',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Roberto Lim',
    email: 'roberto.lim@email.com',
    phone: '+63 919 555 9012',
    service: 'Package Tour',
    date: 'March 30, 2026',
    time: '11:00 AM',
    purpose: 'Interested in Boracay tour package for family vacation',
    requested: 'March 26, 2026 - 10:00 AM',
    status: 'Pending',
  },
];

export default function OperatorAppointments() {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesSearch =
        appt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.service.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        appt.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  const handleStatusChange = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  return (
    <div className="card op-appointments page-fade-in">
      <div className="op-appointments-header">
        <div className="op-appointments-title">
          <i className="fa-regular fa-calendar" style={{ color: 'var(--orange)' }}></i>
          <div>
            <h2>Appointment Requests</h2>
            <p>Clients requesting face-to-face consultations</p>
          </div>
        </div>
        <span className="op-appointments-badge">
          {appointments.filter((a) => a.status === 'Pending').length} Pending
        </span>
      </div>

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
            { value: 'all', label: `All (${appointments.length})` },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
          ]}
          activeChip={statusFilter}
          onChipChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="op-appt-list">
        {paginatedAppointments.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-regular fa-calendar-xmark empty-icon"></i>
            <p>No appointment requests match your filters</p>
          </div>
        ) : (
          paginatedAppointments.map((a) => (
            <div key={a.id} className="op-appt-card">
              <div className="op-appt-top">
                <div className="op-appt-left">
                  <div className="op-avatar">{a.name[0]}</div>
                  <div>
                    <p className="op-appt-name">{a.name}</p>
                    <p className="op-appt-email">
                      <i className="fa-regular fa-envelope"></i> {a.email}
                    </p>
                  </div>
                </div>
                <div className="op-appt-actions">
                  <span
                    className={`status-pill ${
                      a.status === 'Confirmed'
                        ? 'status-pill-active'
                        : a.status === 'Cancelled'
                        ? 'status-pill-disabled'
                        : 'status-pill-pending'
                    }`}
                  >
                    {a.status}
                  </span>
                  <div className="op-appt-btn-group">
                    {a.status === 'Pending' && (
                      <>
                        <button
                          className="op-appt-btn confirm"
                          onClick={() => handleStatusChange(a.id, 'Confirmed')}
                        >
                          <i className="fa-solid fa-circle-check"></i> Confirm
                        </button>
                        <button
                          className="op-appt-btn cancel"
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
                  {a.phone}
                </span>
                <span>
                  <i className="fa-regular fa-file-lines" style={{ color: '#3B82F6' }}></i>{' '}
                  {a.service}
                </span>
                <span>
                  <i className="fa-regular fa-calendar" style={{ color: 'var(--orange)' }}></i>{' '}
                  {a.date}
                </span>
                <span>
                  <i className="fa-regular fa-clock" style={{ color: 'var(--orange)' }}></i>{' '}
                  {a.time}
                </span>
              </div>

              <p className="op-appt-purpose">
                <strong>Purpose:</strong> {a.purpose}
              </p>
              <p className="op-appt-requested">Requested: {a.requested}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredAppointments.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
