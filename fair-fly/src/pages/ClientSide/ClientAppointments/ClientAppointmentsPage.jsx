import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import SearchBar from '../../../components/UI/SearchBar/SearchBar';
import { fetchAppointments } from '../../../services/appointmentService';
import useDebounce from '../../../hooks/useDebounce';
import './client-appointments.css';

export default function ClientAppointmentsPage() {
  const { user, userDetails, userToken } = useAuthContext();
  const { clearNotificationsForTab } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (clearNotificationsForTab) {
      clearNotificationsForTab('/client/appointments');
    }
  }, [clearNotificationsForTab]);

  // Fetch appointments via GET
  const loadAppointments = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchAppointments(
      userToken,
      { clientUid: user?.uid },
      (data) => {
        const list = (data || [])
          .map((doc) => ({
            id: doc.id || doc._id,
            ...doc
          }))
          .filter((doc) => !user?.uid || doc.clientUid === user.uid);
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
  }, [userToken, user?.uid]);

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
                <div className="skeleton skeleton-badge" style={{ width: '6.5rem', height: '1.35rem' }} />
                <div className="skeleton skeleton-badge" style={{ width: '5.5rem', height: '1.35rem' }} />
              </div>
              <div className="skeleton skeleton-title" style={{ width: '75%', height: '1.35rem', margin: '0.5rem 0' }} />
              <div className="skeleton skeleton-card" style={{ width: '100%', height: '3.5rem', borderRadius: 'var(--radius-md)' }} />
              <div className="appointment-details-list">
                <div className="skeleton skeleton-text" style={{ width: '85%', height: '0.9rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', height: '0.9rem' }} />
              </div>
              <div className="skeleton skeleton-text" style={{ width: '100%', height: '1.5rem', marginTop: 'auto' }} />
            </article>
          ))
        ) : filteredAppointments.length === 0 ? (
          <div className="appointments-empty-card" style={{ gridColumn: '1 / -1' }}>
            <div className="appointments-empty-icon">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <h3 className="appointments-empty-title">
              {searchQuery ? 'No Matching Appointments' : 'No Appointments in this View'}
            </h3>
            <p className="appointments-empty-desc">
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

            const refCode = app.id ? String(app.id).substring(0, 8).toUpperCase() : 'APPT';

            return (
              <article key={app.id} className="appointment-card">
                {/* Header with Reference and Status Pill */}
                <div className="appointment-card-header">
                  <span className="appointment-ref-tag">
                    <i className="fa-solid fa-hashtag"></i>
                    {refCode}
                  </span>

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
                  <i className="fa-solid fa-handshake"></i>
                  <span>{app.serviceType || 'General Consultation'}</span>
                </h3>

                {/* Prominent Schedule Banner */}
                <div className="appointment-schedule-banner">
                  <div className="appointment-schedule-item">
                    <i className="fa-solid fa-calendar-day"></i>
                    <div>
                      <span className="schedule-item-label">Visit Date</span>
                      <strong className="schedule-item-val">{app.preferredDate || 'To be scheduled'}</strong>
                    </div>
                  </div>
                  <div className="appointment-schedule-divider" />
                  <div className="appointment-schedule-item">
                    <i className="fa-regular fa-clock"></i>
                    <div>
                      <span className="schedule-item-label">Time Window</span>
                      <strong className="schedule-item-val">{app.preferredTime || '10:00 AM'}</strong>
                    </div>
                  </div>
                </div>

                {/* Branch & Contact Details Box */}
                <div className="appointment-details-list">
                  <div className="appointment-detail-row">
                    <i className="fa-solid fa-store"></i>
                    <div>
                      <span className="detail-row-label">Branch:</span>
                      <strong className="detail-row-value">{app.branchName || app.preferredBranchLocation || 'Main Branch'}</strong>
                    </div>
                  </div>

                  <div className="appointment-detail-row">
                    <i className="fa-solid fa-phone"></i>
                    <div>
                      <span className="detail-row-label">Client Contact:</span>
                      <span className="detail-row-value">{app.clientName} ({app.clientPhone})</span>
                    </div>
                  </div>
                </div>

                {/* Purpose / Visit Notes Callout */}
                {app.purpose && (
                  <div className="appointment-purpose-box">
                    <div className="appointment-purpose-header">
                      <i className="fa-regular fa-clipboard"></i>
                      <span>Visit Purpose &amp; Requirements</span>
                    </div>
                    <p className="appointment-purpose-text">{app.purpose}</p>
                  </div>
                )}

                {/* Card Footer with Auto-margin for Equal Alignment */}
                <div className="appointment-card-footer">
                  <span className="appointment-booked-date">
                    <i className="fa-regular fa-clock"></i>
                    Booked:{' '}
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Recently'}
                  </span>
                  <span className="appointment-branch-badge">
                    <i className="fa-solid fa-location-dot"></i>
                    In-Person Visit
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
