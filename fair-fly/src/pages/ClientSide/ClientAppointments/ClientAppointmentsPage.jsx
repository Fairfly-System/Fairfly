import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import SearchBar from '../../../components/UI/SearchBar/SearchBar';
import { fetchAppointments } from '../../../services/appointmentService';
import useDebounce from '../../../hooks/useDebounce';
import './client-appointments.css';

export default function ClientAppointmentsPage() {
  const { user, userDetails, userToken } = useAuthContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch appointments via GET
  const loadAppointments = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchAppointments(
      userToken,
      {},
      (data) => {
        const list = (data || []).map((doc) => ({
          id: doc.id || doc._id,
          ...doc
        }));
        list.sort((a, b) => new Date(b.createdAt || b.preferredDate || 0) - new Date(a.createdAt || a.preferredDate || 0));
        setAppointments(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching client appointments:', error);
        setLoading(false);
      },
      setLoading
    );
  }, [userToken]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Compute KPI metrics
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => (a.status || '').toLowerCase() === 'confirmed').length;
  const pendingCount = appointments.filter((a) => (a.status || '').toLowerCase() === 'pending').length;
  const cancelledCount = appointments.filter((a) => (a.status || '').toLowerCase() === 'cancelled').length;

  // Filter & search with debouncedSearch
  const filteredAppointments = useMemo(() => {
    let result = appointments || [];

    if (activeTab !== 'all') {
      result = result.filter((a) => (a.status || '').toLowerCase() === activeTab.toLowerCase());
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((a) => {
        const service = (a.serviceType || '').toLowerCase();
        const branch = (a.branchName || a.preferredBranchLocation || '').toLowerCase();
        const purpose = (a.purpose || '').toLowerCase();
        const date = (a.preferredDate || '').toLowerCase();
        return service.includes(q) || branch.includes(q) || purpose.includes(q) || date.includes(q);
      });
    }

    return result;
  }, [appointments, activeTab, debouncedSearch]);

  return (
    <div className="client-appointments-page">
      {/* Header Row */}
      <div className="appointments-header-row">
        <div>
          <h2 className="appointments-header-title">
            <i className="fa-solid fa-calendar-check" style={{ color: 'var(--purple)' }}></i>
            My Branch Appointments
          </h2>
          <p className="appointments-header-subtitle">
            Schedule and manage face-to-face branch appointments for document intake, consultations, and expedited turnover.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsFormOpen(true)}
        >
          <i className="fa-solid fa-calendar-plus"></i>
          Schedule Branch Appointment
        </button>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="appointments-kpi-grid">
        <div className="appointment-kpi-card">
          <div className="appointment-kpi-icon appointment-kpi-icon--purple">
            <i className="fa-solid fa-calendar-days"></i>
          </div>
          <div className="appointment-kpi-info">
            <span className="appointment-kpi-label">Total Scheduled</span>
            <span className={`appointment-kpi-val ${loading ? 'skeleton skeleton-text' : ''}`} style={loading ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loading ? '' : totalCount}</span>
          </div>
        </div>

        <div className="appointment-kpi-card">
          <div className="appointment-kpi-icon appointment-kpi-icon--green">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="appointment-kpi-info">
            <span className="appointment-kpi-label">Confirmed Visits</span>
            <span className={`appointment-kpi-val ${loading ? 'skeleton skeleton-text' : ''}`} style={loading ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loading ? '' : confirmedCount}</span>
          </div>
        </div>

        <div className="appointment-kpi-card">
          <div className="appointment-kpi-icon appointment-kpi-icon--yellow">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="appointment-kpi-info">
            <span className="appointment-kpi-label">Pending Review</span>
            <span className={`appointment-kpi-val ${loading ? 'skeleton skeleton-text' : ''}`} style={loading ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loading ? '' : pendingCount}</span>
          </div>
        </div>

        <div className="appointment-kpi-card">
          <div className="appointment-kpi-icon appointment-kpi-icon--red">
            <i className="fa-solid fa-calendar-xmark"></i>
          </div>
          <div className="appointment-kpi-info">
            <span className="appointment-kpi-label">Past / Cancelled</span>
            <span className={`appointment-kpi-val ${loading ? 'skeleton skeleton-text' : ''}`} style={loading ? { width: '2.5rem', height: '1.75rem', display: 'inline-block' } : {}}>{loading ? '' : cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="appointments-toolbar-card">
        {/* Status Tabs */}
        <div className="appointments-tabs">
          <button
            type="button"
            className={`appointments-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Appointments ({totalCount})
          </button>
          <button
            type="button"
            className={`appointments-tab-btn ${activeTab === 'confirmed' ? 'active' : ''}`}
            onClick={() => setActiveTab('confirmed')}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            type="button"
            className={`appointments-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            className={`appointments-tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Search Field */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search by branch or service..."
          className="appointments-search-bar"
        />
      </div>

      {/* Appointments Grid List */}
      <div className="appointments-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <article key={`skel-app-${i}`} className="appointment-card" aria-busy="true">
              <div className="appointment-card-header">
                <div className="skeleton skeleton-badge" style={{ width: '9rem', height: '1.5rem' }} />
                <div className="skeleton skeleton-badge" style={{ width: '5.5rem', height: '1.5rem' }} />
              </div>
              <div className="skeleton skeleton-title" style={{ width: '70%', height: '1.25rem', margin: '0.75rem 0' }} />
              <div className="appointment-details-list">
                <div className="skeleton skeleton-text" style={{ width: '85%', height: '0.9rem', margin: '0.25rem 0' }} />
                <div className="skeleton skeleton-text" style={{ width: '75%', height: '0.9rem', margin: '0.25rem 0' }} />
              </div>
              <div className="skeleton skeleton-text" style={{ width: '95%', height: '2rem', marginTop: '0.75rem' }} />
            </article>
          ))
        ) : filteredAppointments.length === 0 ? (
          <div className="tracking-empty-card" style={{ gridColumn: '1 / -1' }}>
            <div className="tracking-empty-icon">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
              {searchQuery ? 'No Matching Appointments' : 'No Appointments in this View'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', maxWidth: '28rem', margin: 0 }}>
              {searchQuery
                ? 'Try searching with a different branch or service keyword.'
                : 'Need to meet our agency team in person? Schedule a branch visit for personalized assistance.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsFormOpen(true)}
            >
              <i className="fa-solid fa-calendar-plus"></i>
              Schedule an Appointment Now
            </button>
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const statusKey = (app.status || 'pending').toLowerCase();
            const statusClass =
              statusKey === 'confirmed'
                ? 'confirmed'
                : statusKey === 'cancelled'
                ? 'cancelled'
                : 'pending';

            return (
              <article key={app.id} className="appointment-card">
                {/* Header with Date and Status */}
                <div className="appointment-card-header">
                  <div className="appointment-date-badge">
                    <i className="fa-regular fa-calendar-day"></i>
                    <span>{app.preferredDate || 'Scheduled Date'}</span>
                    <span>·</span>
                    <span>{app.preferredTime || '10:00 AM'}</span>
                  </div>

                  <span className={`appointment-status-pill ${statusClass}`}>
                    <i
                      className={`fa-solid ${
                        statusKey === 'confirmed'
                          ? 'fa-circle-check'
                          : statusKey === 'cancelled'
                          ? 'fa-circle-xmark'
                          : 'fa-clock'
                      }`}
                    ></i>
                    {app.status || 'Pending'}
                  </span>
                </div>

                {/* Service Title */}
                <h3 className="appointment-service-title">
                  {app.serviceType || 'General Consultation'}
                </h3>

                {/* Details Box */}
                <div className="appointment-details-list">
                  <div className="appointment-detail-row">
                    <i className="fa-solid fa-building"></i>
                    <span>
                      <strong>Branch:</strong> {app.branchName || app.preferredBranchLocation || 'Main Office'}
                    </span>
                  </div>

                  <div className="appointment-detail-row">
                    <i className="fa-solid fa-user"></i>
                    <span>
                      <strong>Client:</strong> {app.clientName} ({app.clientPhone})
                    </span>
                  </div>
                </div>

                {/* Purpose Notes */}
                {app.purpose && (
                  <p className="appointment-purpose-box">
                    <strong>Notes:</strong> {app.purpose}
                  </p>
                )}

                {/* Footer */}
                <div className="appointment-card-footer">
                  <span>
                    Booked:{' '}
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--purple)' }}>
                    Ref #{app.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Appointment Booking Modal Form */}
      <ClientAppointmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          loadAppointments();
        }}
      />
    </div>
  );
}
