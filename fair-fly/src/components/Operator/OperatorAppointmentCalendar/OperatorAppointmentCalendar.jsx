import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { fetchAppointments, updateAppointmentStatus } from '../../../services/appointmentService';
import BaseModal from '../../UI/ModalBase/BaseModal';
import AppointmentCalendar from '../../Shared/AppointmentCalendar/AppointmentCalendar';
import { useToast } from '../../UI/toast/ToastProvider';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-appointment-calendar.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format Date to local YYYY-MM-DD string
 */
function toISODateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object without UTC drift
 */
function parseISODate(str) {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(str);
}

/**
 * Format date string into human-friendly format (e.g. Monday, Sep 29, 2026)
 */
function formatHumanDate(str) {
  if (!str) return 'N/A';
  const d = parseISODate(str);
  return `${FULL_DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function OperatorAppointmentCalendar({ userToken, userUid, onStatusUpdated }) {
  const { addToast } = useToast();

  // Calendar view mode: 'month' or 'week'
  const [viewMode, setViewMode] = useState('month');

  // Currently viewed anchor date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Filter by status: 'all', 'Pending', 'Confirmed', 'Cancelled'
  const [statusFilter, setStatusFilter] = useState('all');

  // Loaded appointments state
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // In-memory cache by periodKey: { [periodKey]: appointmentsArray }
  const cacheRef = useRef({});

  // Detail Modal selection
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Calculate today ISO string
  const todayStr = useMemo(() => toISODateString(new Date()), []);

  // Compute visible date bounds based on viewMode and currentDate
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // First day of current month
      const firstOfMonth = new Date(year, month, 1);
      const startDayOfWeek = firstOfMonth.getDay(); // 0 is Sun

      // Grid start date (Sunday of the first week row)
      const startDate = new Date(year, month, 1 - startDayOfWeek);

      // Last day of current month
      const lastOfMonth = new Date(year, month + 1, 0);
      const endDayOfWeek = lastOfMonth.getDay();

      // Grid end date (Saturday of the last week row)
      const endDate = new Date(year, month + 1, 6 - endDayOfWeek);

      return {
        startDateStr: toISODateString(startDate),
        endDateStr: toISODateString(endDate),
        displayTitle: `${MONTH_NAMES[month]} ${year}`
      };
    } else {
      // Week View
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const sunday = new Date(curr);
      sunday.setDate(curr.getDate() - day);

      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const sunMonth = MONTH_NAMES[sunday.getMonth()].slice(0, 3);
      const satMonth = MONTH_NAMES[saturday.getMonth()].slice(0, 3);
      const yearStr = saturday.getFullYear();

      let displayTitle = '';
      if (sunday.getMonth() === saturday.getMonth()) {
        displayTitle = `${sunMonth} ${sunday.getDate()} – ${saturday.getDate()}, ${yearStr}`;
      } else {
        displayTitle = `${sunMonth} ${sunday.getDate()} – ${satMonth} ${saturday.getDate()}, ${yearStr}`;
      }

      return {
        startDateStr: toISODateString(sunday),
        endDateStr: toISODateString(saturday),
        displayTitle
      };
    }
  }, [currentDate, viewMode]);

  // Fetch appointments for the active date range with period caching
  const loadAppointments = useCallback((forceRefresh = false) => {
    if (!userToken) return;

    const { startDateStr, endDateStr } = dateRange;
    const cacheKey = `${startDateStr}_${endDateStr}_${userUid || ''}`;

    if (!forceRefresh && cacheRef.current[cacheKey]) {
      setAppointments(cacheRef.current[cacheKey]);
      return;
    }

    setIsLoading(true);
    fetchAppointments(
      userToken,
      {
        startDate: startDateStr,
        endDate: endDateStr
      },
      (data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        cacheRef.current[cacheKey] = list;
        setAppointments(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('[OperatorAppointmentCalendar] Failed to load appointments:', err);
        addToast(toFriendlyMessage(err, 'Failed to retrieve appointments for this period.'), 'error');
        setIsLoading(false);
      },
      () => {}
    );
  }, [userToken, userUid, dateRange, addToast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Invalidate cache and reload on manual refresh or status change
  const handleRefresh = () => {
    cacheRef.current = {};
    loadAppointments(true);
  };

  // Status mutation (Confirm / Cancel) from calendar modal
  const handleStatusChange = (newStatus) => {
    if (!selectedAppointment || !userToken) return;
    setIsUpdatingStatus(true);

    updateAppointmentStatus(
      userToken,
      selectedAppointment.id,
      newStatus,
      () => {
        addToast(`Appointment successfully marked as ${newStatus}`, 'success');
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
        setIsUpdatingStatus(false);
        // Invalidate cache & reload
        cacheRef.current = {};
        loadAppointments(true);
        if (onStatusUpdated) onStatusUpdated();
      },
      (err) => {
        setIsUpdatingStatus(false);
        addToast(toFriendlyMessage(err, `Failed to update status to ${newStatus}.`), 'error');
      },
      () => {}
    );
  };

  return (
    <div className="op-cal-wrapper">
      <AppointmentCalendar
        role="operator"
        appointments={appointments}
        onSelectAppointment={(appt) => setSelectedAppointment(appt)}
        isLoading={isLoading}
        onDateRangeChange={({ startDateStr, endDateStr }) => {
          if (startDateStr !== dateRange.startDateStr || endDateStr !== dateRange.endDateStr) {
            fetchAppointments(
              userToken,
              { startDate: startDateStr, endDate: endDateStr },
              (data) => {
                const list = Array.isArray(data) ? data : (data?.data || []);
                setAppointments(list);
              }
            );
          }
        }}
        onRefresh={handleRefresh}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Appointment Detail Modal */}
      <BaseModal
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Consultation Details"
        subtitle="Review scheduled consult time, client details, and requirements"
        maxWidth="54rem"
        width="95%"
      >
        {selectedAppointment && (
          <div className="cal-modal-content">
            {/* Header Status Banner */}
            <div className="cal-modal-banner">
              <div className="banner-left">
                <div className="client-avatar">
                  {(selectedAppointment.clientName || selectedAppointment.name || 'C')[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="banner-client-name">
                    {selectedAppointment.clientName || selectedAppointment.name || 'Client'}
                  </h3>
                  <span className="banner-service">
                    {selectedAppointment.serviceType || selectedAppointment.service || 'General Inquiry'}
                  </span>
                </div>
              </div>

              <span
                className={`status-pill ${
                  (selectedAppointment.status || '').toLowerCase() === 'confirmed'
                    ? 'status-pill-active'
                    : (selectedAppointment.status || '').toLowerCase() === 'cancelled'
                    ? 'status-pill-disabled'
                    : 'status-pill-pending'
                }`}
              >
                {selectedAppointment.status || 'Pending'}
              </span>
            </div>

            {/* Info Grid */}
            <div className="cal-modal-grid">
              <div className="cal-modal-section">
                <h4 className="cal-modal-section-title">
                  <i className="fa-regular fa-calendar"></i> Schedule Information
                </h4>
                <div className="cal-modal-rows">
                  <div className="cal-modal-row">
                    <span className="row-label">Scheduled Date</span>
                    <span className="row-value font-semibold">
                      {formatHumanDate(selectedAppointment.preferredDate || selectedAppointment.date)}
                    </span>
                  </div>
                  <div className="cal-modal-row">
                    <span className="row-label">Start Time</span>
                    <span className="row-value font-semibold" style={{ color: 'var(--purple-dark)' }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i>
                      {selectedAppointment.preferredTime || selectedAppointment.time || '10:00 AM'}
                    </span>
                  </div>
                  <div className="cal-modal-row">
                    <span className="row-label">Estimated Duration</span>
                    <span className="row-value">45 minutes</span>
                  </div>
                  <div className="cal-modal-row">
                    <span className="row-label">Branch Location</span>
                    <span className="row-value">
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--purple)', marginRight: '0.25rem' }}></i>
                      {selectedAppointment.branchName || selectedAppointment.preferredBranchLocation || 'Main Branch'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cal-modal-section">
                <h4 className="cal-modal-section-title">
                  <i className="fa-solid fa-user"></i> Client Contact Information
                </h4>
                <div className="cal-modal-rows">
                  <div className="cal-modal-row">
                    <span className="row-label">Full Name</span>
                    <span className="row-value">
                      {selectedAppointment.clientName || selectedAppointment.name || 'N/A'}
                    </span>
                  </div>
                  <div className="cal-modal-row">
                    <span className="row-label">Email Address</span>
                    <span className="row-value">
                      <i className="fa-regular fa-envelope" style={{ marginRight: '0.25rem' }}></i>
                      {selectedAppointment.clientEmail || selectedAppointment.email || 'N/A'}
                    </span>
                  </div>
                  <div className="cal-modal-row">
                    <span className="row-label">Phone Number</span>
                    <span className="row-value">
                      <i className="fa-solid fa-phone" style={{ marginRight: '0.25rem' }}></i>
                      {selectedAppointment.clientPhone || selectedAppointment.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purpose & Remarks */}
            <div className="cal-modal-purpose-box">
              <h4 className="cal-modal-section-title">
                <i className="fa-regular fa-comment-dots"></i> Consultation Purpose & Notes
              </h4>
              <p className="purpose-desc">
                {selectedAppointment.purpose || 'Client has requested a face-to-face consultation to discuss visa and travel service requirements.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="cal-modal-footer">
              <Link
                to={`/operator/appointments/${selectedAppointment.id}`}
                className="cal-btn-view-record"
                onClick={() => setSelectedAppointment(null)}
              >
                <i className="fa-solid fa-eye"></i> View Full Record
              </Link>

              <div className="cal-modal-action-buttons">
                {(selectedAppointment.status || 'Pending').toLowerCase() === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="cal-btn-confirm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('Confirmed')}
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      {isUpdatingStatus ? 'Updating...' : 'Confirm Appointment'}
                    </button>
                    <button
                      type="button"
                      className="cal-btn-cancel"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('Cancelled')}
                    >
                      <i className="fa-solid fa-xmark"></i>
                      Cancel
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="cal-btn-close"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
