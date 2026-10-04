import React, { useState, useMemo, useEffect } from 'react';
import './AppointmentCalendar.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export default function AppointmentCalendar({
  role = 'admin',
  appointments = [],
  onSelectAppointment,
  onDateClick,
  isLoading = false,
  onDateRangeChange,
  onRefresh,
  initialViewMode = 'month',
  showStatusFilter = true,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange
}) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [internalStatusFilter, setInternalStatusFilter] = useState('all');

  const activeStatusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : internalStatusFilter;

  const handleStatusChange = (val) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(val);
    } else {
      setInternalStatusFilter(val);
    }
  };

  const todayStr = useMemo(() => toISODateString(new Date()), []);

  // Compute visible date bounds based on viewMode and currentDate
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstOfMonth = new Date(year, month, 1);
      const startDayOfWeek = firstOfMonth.getDay(); // 0 is Sun
      const startDate = new Date(year, month, 1 - startDayOfWeek);

      const lastOfMonth = new Date(year, month + 1, 0);
      const endDayOfWeek = lastOfMonth.getDay();
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

  // Inform parent of date range changes if callback provided
  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange({
        startDateStr: dateRange.startDateStr,
        endDateStr: dateRange.endDateStr,
        viewMode
      });
    }
  }, [dateRange.startDateStr, dateRange.endDateStr, viewMode, onDateRangeChange]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    if (activeStatusFilter === 'all') return appointments;
    return appointments.filter((a) => {
      const s = (a.status || '').toLowerCase();
      return s === activeStatusFilter.toLowerCase();
    });
  }, [appointments, activeStatusFilter]);

  // Group appointments by ISO date string
  const appointmentsByDate = useMemo(() => {
    const map = {};
    filteredAppointments.forEach((appt) => {
      const d = appt.preferredDate || appt.appointmentDate || appt.date;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(appt);
    });

    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => {
        const timeA = a.startTime || a.preferredTime || a.time || '';
        const timeB = b.startTime || b.preferredTime || b.time || '';
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [filteredAppointments]);

  // Month grid cells
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startDayOfWeek);

    const lastOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastOfMonth.getDate();
    const rowsNeeded = Math.ceil((startDayOfWeek + daysInMonth) / 7);
    const cellCount = rowsNeeded * 7;

    const cells = [];
    for (let i = 0; i < cellCount; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);

      const isoStr = toISODateString(dayDate);
      const isCurrentMonth = dayDate.getMonth() === month;
      const isToday = isoStr === todayStr;
      const dayAppts = appointmentsByDate[isoStr] || [];

      cells.push({
        dateObj: dayDate,
        isoStr,
        dayNumber: dayDate.getDate(),
        isCurrentMonth,
        isToday,
        appointments: dayAppts
      });
    }

    return cells;
  }, [currentDate, viewMode, todayStr, appointmentsByDate]);

  // Week columns
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];

    const curr = new Date(currentDate);
    const day = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);

      const isoStr = toISODateString(dayDate);
      const isToday = isoStr === todayStr;
      const dayAppts = appointmentsByDate[isoStr] || [];

      days.push({
        dateObj: dayDate,
        isoStr,
        dayName: DAY_NAMES[dayDate.getDay()],
        dayNumber: dayDate.getDate(),
        monthShort: MONTH_NAMES[dayDate.getMonth()].slice(0, 3),
        isToday,
        appointments: dayAppts
      });
    }

    return days;
  }, [currentDate, viewMode, todayStr, appointmentsByDate]);

  return (
    <div className="shared-cal-wrapper">
      {/* Calendar Header Controls */}
      <header className="shared-cal-header">
        <div className="shared-cal-nav-group">
          <button
            type="button"
            className="shared-cal-nav-btn"
            onClick={handlePrev}
            title={viewMode === 'month' ? 'Previous Month' : 'Previous Week'}
            aria-label="Previous period"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button
            type="button"
            className="shared-cal-today-btn"
            onClick={handleToday}
          >
            Today
          </button>
          <button
            type="button"
            className="shared-cal-nav-btn"
            onClick={handleNext}
            title={viewMode === 'month' ? 'Next Month' : 'Next Week'}
            aria-label="Next period"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>

          <h2 className="shared-cal-period-title">{dateRange.displayTitle}</h2>

          {isLoading && (
            <span className="shared-cal-loading-indicator" aria-label="Loading appointments">
              <i className="fa-solid fa-circle-notch fa-spin" />
            </span>
          )}
        </div>

        <div className="shared-cal-actions-group">
          {/* Status Filter */}
          {showStatusFilter && (
            <div className="shared-cal-filter-select-wrapper">
              <select
                className="shared-cal-filter-select"
                value={activeStatusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by Status"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending Only</option>
                <option value="Confirmed">Confirmed Only</option>
                <option value="Completed">Completed Only</option>
                <option value="Cancelled">Cancelled Only</option>
              </select>
            </div>
          )}

          {/* Month / Week Switcher */}
          <div className="shared-cal-view-switch" role="group" aria-label="Calendar view switcher">
            <button
              type="button"
              className={`shared-cal-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`shared-cal-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              className="shared-cal-refresh-btn"
              onClick={onRefresh}
              title="Refresh appointments data"
              aria-label="Refresh appointments"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
          )}
        </div>
      </header>

      {/* Legend Bar */}
      <div className="shared-cal-legend">
        <span className="shared-legend-item">
          <span className="shared-legend-dot status-confirmed" />
          Confirmed
        </span>
        <span className="shared-legend-item">
          <span className="shared-legend-dot status-pending" />
          Pending
        </span>
        <span className="shared-legend-item">
          <span className="shared-legend-dot status-completed" />
          Completed
        </span>
        <span className="shared-legend-item">
          <span className="shared-legend-dot status-cancelled" />
          Cancelled
        </span>
      </div>

      {/* Main Calendar Display */}
      {viewMode === 'month' ? (
        <div className="shared-cal-month-container">
          {/* Day of Week Headers */}
          <div className="shared-cal-weekdays-row" role="row">
            {DAY_NAMES.map((name) => (
              <div key={name} className="shared-cal-weekday-header" role="columnheader">
                {name}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div className="shared-cal-month-grid" role="grid">
            {monthDays.map((cell) => {
              const hasAppts = cell.appointments.length > 0;
              return (
                <div
                  key={cell.isoStr}
                  className={`shared-cal-day-cell ${
                    !cell.isCurrentMonth ? 'other-month' : ''
                  } ${cell.isToday ? 'is-today' : ''} ${hasAppts ? 'has-appointments' : ''}`}
                  role="gridcell"
                  onClick={() => onDateClick?.(cell.isoStr)}
                >
                  <div className="shared-day-cell-top">
                    <span className={`shared-day-number ${cell.isToday ? 'today-pill' : ''}`}>
                      {cell.dayNumber}
                    </span>
                    {hasAppts && (
                      <span className="shared-day-appt-count" title={`${cell.appointments.length} appointments`}>
                        {cell.appointments.length}
                      </span>
                    )}
                  </div>

                  {/* Appointment Chips List */}
                  <div className="shared-day-appts-list">
                    {cell.appointments.slice(0, 3).map((appt) => {
                      const statusClass = (appt.status || 'pending').toLowerCase();
                      const timeStr = appt.startTime || appt.preferredTime || appt.time || '10:00 AM';
                      const clientName = appt.clientName || appt.name || 'Client';

                      return (
                        <button
                          key={appt.id}
                          type="button"
                          className={`shared-cal-appt-chip chip-${statusClass}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAppointment?.(appt);
                          }}
                          title={`${timeStr} - ${clientName} (${appt.serviceType || 'Consultation'})`}
                        >
                          <span className="chip-time">{timeStr}</span>
                          <span className="chip-title">{clientName}</span>
                        </button>
                      );
                    })}

                    {cell.appointments.length > 3 && (
                      <button
                        type="button"
                        className="shared-cal-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment?.(cell.appointments[0]);
                        }}
                      >
                        +{cell.appointments.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="shared-cal-week-container">
          <div className="shared-cal-week-grid">
            {weekDays.map((day) => {
              return (
                <div
                  key={day.isoStr}
                  className={`shared-cal-week-column ${day.isToday ? 'is-today' : ''}`}
                  onClick={() => onDateClick?.(day.isoStr)}
                >
                  <div className="shared-week-column-header">
                    <span className="shared-week-day-name">{day.dayName}</span>
                    <span className={`shared-week-day-number ${day.isToday ? 'today-pill' : ''}`}>
                      {day.dayNumber}
                    </span>
                  </div>

                  <div className="shared-week-appts-content">
                    {day.appointments.length === 0 ? (
                      <div className="shared-week-empty-slot">
                        <span>No appointments</span>
                      </div>
                    ) : (
                      day.appointments.map((appt) => {
                        const statusClass = (appt.status || 'pending').toLowerCase();
                        const timeStr = appt.startTime || appt.preferredTime || appt.time || '10:00 AM';
                        const clientName = appt.clientName || appt.name || 'Client';
                        const service = appt.serviceType || appt.service || 'Consultation';

                        return (
                          <article
                            key={appt.id}
                            className={`shared-week-appt-card card-${statusClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAppointment?.(appt);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                onSelectAppointment?.(appt);
                              }
                            }}
                          >
                            <div className="shared-week-appt-time">
                              <i className="fa-regular fa-clock" />
                              <span>{timeStr}</span>
                            </div>
                            <h4 className="shared-week-appt-name">{clientName}</h4>
                            <p className="shared-week-appt-service">
                              <i className="fa-regular fa-file-lines" />
                              <span>{service}</span>
                            </p>
                            <span className={`shared-week-appt-pill pill-${statusClass}`}>
                              {appt.status || 'Pending'}
                            </span>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
