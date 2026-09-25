import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import './admin-tickets.css';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import Pagination from '../../../components/UI/Pagination/Pagination';
import TicketTable from '../../../components/Admin/Tickets/TicketTable';
import TicketThread from '../../../components/Admin/Tickets/TicketThread';
import CreateTicketModal from '../../../components/Admin/Tickets/CreateTicketModal';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { fetchTickets, createTicket, sendMessageToTicket, closeTicket, updateTicketStatus } from '../../../services/ticketService';
import { fetchOperators } from '../../../services/adminService';
import useDebounce from '../../../hooks/useDebounce';

const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, low: 1 };

export default function TicketsContent() {
  const navigate = useNavigate();
  const { userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const assignedOperators = useMemo(() => userDetails?.assignedOperators || [], [userDetails]);
  const [assignmentScope, setAssignmentScope] = useState('all'); // 'all' | 'assigned'

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ticketSort, setTicketSort] = useState('priority');

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorsList, setOperatorsList] = useState([]);

  const createModalRef = useRef(null);

  // Load operators list for ticket creation dropdown
  const loadOperators = useCallback(() => {
    if (!userToken) return;
    fetchOperators(
      userToken,
      (data) => {
        setOperatorsList(data || []);
      },
      (err) => console.error('Error fetching operators list:', err)
    );
  }, [userToken]);

  // Load tickets list via GET
  const loadTickets = useCallback(() => {
    if (!userToken) return;
    setTicketsLoading(true);
    fetchTickets(
      userToken,
      (data) => {
        setTickets(data || []);
        setTicketsLoading(false);
      },
      (err) => {
        console.error('Error fetching tickets:', err);
        addToast('Failed to load tickets', 'error');
        setTicketsLoading(false);
      },
      setTicketsLoading
    );
  }, [userToken, addToast]);

  useEffect(() => {
    loadOperators();
    loadTickets();
  }, [loadOperators, loadTickets]);

  // Keep selected ticket object in sync with latest tickets list
  const activeTicket = useMemo(() => {
    if (!selectedTicketId || !tickets) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  // Filtered tickets with debounced search and assignment scope
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      // Assignment scope filter
      if (assignmentScope === 'assigned' && assignedOperators.length > 0) {
        if (!assignedOperators.includes(ticket.operatorId)) {
          return false;
        }
      }

      const titleStr = (ticket.title || '').toLowerCase();
      const opIdStr = (ticket.operatorId || '').toLowerCase();
      const opNameStr = (ticket.operatorName || '').toLowerCase();
      const opEmailStr = (ticket.operatorEmail || '').toLowerCase();
      const idStr = (ticket.id || '').toLowerCase();
      const search = debouncedSearch.toLowerCase();

      const matchesSearch =
        titleStr.includes(search) ||
        opIdStr.includes(search) ||
        opNameStr.includes(search) ||
        opEmailStr.includes(search) ||
        idStr.includes(search);

      const ticketStatus = (ticket.status || 'Pending').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || ticketStatus === statusFilter.toLowerCase();
      const ticketPriority = (ticket.priority || 'Medium').toLowerCase();
      const matchesPriority = priorityFilter === 'all' || ticketPriority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      if (ticketSort === 'priority') {
        const priorityDifference = (PRIORITY_RANK[(b.priority || 'medium').toLowerCase()] || 0)
          - (PRIORITY_RANK[(a.priority || 'medium').toLowerCase()] || 0);
        if (priorityDifference !== 0) return priorityDifference;
      }
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [tickets, debouncedSearch, statusFilter, priorityFilter, ticketSort, assignmentScope, assignedOperators]);

  // Paginated tickets slice
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // AlertBar calculations
  const alertBarProps = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return { message: 'No support tickets recorded yet. Create one or wait for operators to submit tickets.', type: 'info' };
    }
    const total = tickets.length;
    const pending = tickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length;
    const ongoing = tickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length;
    const closed = tickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length;

    if (pending > 0) {
      return {
        message: `${pending} pending support ticket${pending !== 1 ? 's' : ''} awaiting admin response. ${ongoing} ongoing, ${closed} closed out of ${total} total.`,
        type: 'warning',
      };
    }
    return {
      message: `All tickets accounted for. ${ongoing} ongoing thread${ongoing !== 1 ? 's' : ''}, ${closed} closed thread${closed !== 1 ? 's' : ''} out of ${total} total.`,
      type: 'info',
    };
  }, [tickets]);

  // API Handler: Create Ticket
  const handleCreateTicket = async (ticketData) => {
    return createTicket(
      userToken,
      ticketData,
      (res) => {
        addToast('Support ticket created successfully', 'success');
        createModalRef.current?.closeModal();
        loadTickets();
      },
      (error) => {
        addToast(`Failed to create ticket: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  // API Handler: Send message in forum thread
  const handleSendMessage = async (ticketId, messageText) => {
    return sendMessageToTicket(
      userToken,
      ticketId,
      messageText,
      (res) => {
        addToast('Response posted to support thread', 'success');
        loadTickets();
      },
      (error) => {
        addToast(`Failed to send message: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  // API Handler: Close Ticket / Forum Thread
  const handleCloseTicket = async (ticketId) => {
    return closeTicket(
      userToken,
      ticketId,
      (res) => {
        addToast('Support forum thread has been closed', 'info');
        loadTickets();
      },
      (error) => {
        addToast(`Failed to close ticket: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  // API Handler: Change Status
  const handleStatusChange = async (ticketId, newStatus) => {
    return updateTicketStatus(
      userToken,
      ticketId,
      newStatus,
      (res) => {
        addToast(`Ticket status updated to ${newStatus}`, 'success');
        loadTickets();
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Tickets' },
  ];

  const totalTickets = Array.isArray(tickets) ? tickets.length : 0;
  const pendingCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length : 0;
  const ongoingCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length : 0;
  const closedCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length : 0;
  const assignedTicketsCount = useMemo(
    () => (Array.isArray(tickets) && assignedOperators.length > 0 ? tickets.filter((t) => assignedOperators.includes(t.operatorId)).length : 0),
    [tickets, assignedOperators]
  );

  return (
    <main className="tickets-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Branch Support Forum & Ticketing"
        subtitle="Manage, track, and resolve operational issues submitted by branch operators"
        illustrationSrc="/pageImages/admin/tickets.png"
        primaryAction={{
          label: 'Create Ticket',
          icon: 'fa-solid fa-plus',
          onClick: () => createModalRef.current?.openModal(),
        }}
      />

      <div className="tickets-layout-single">
        <section className="tickets-left-pane">
          <section className="kpi-grid-4">
            <KpiCard
              title="Total Tickets"
              value={totalTickets}
              icon="fa-solid fa-ticket"
              iconColor="var(--purple)"
              isLoading={ticketsLoading}
            />
            <KpiCard
              title="Pending"
              value={pendingCount}
              icon="fa-regular fa-clock"
              iconColor="var(--orange)"
              isLoading={ticketsLoading}
            />
            <KpiCard
              title="Ongoing Threads"
              value={ongoingCount}
              icon="fa-solid fa-comments"
              iconColor="var(--blue-dark)"
              isLoading={ticketsLoading}
            />
            <KpiCard
              title="Closed"
              value={closedCount}
              icon="fa-regular fa-circle-check"
              iconColor="var(--complete-green-dark)"
              isLoading={ticketsLoading}
            />
          </section>

          <section className="card tickets-table-card">
            <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

            {/* Scope Filter for Admins with Assigned Operators */}
            {assignedOperators.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className="fa-solid fa-filter" style={{ color: 'var(--purple)' }}></i> Ticket View Scope:
                </span>
                <FilterChipGroup
                  chips={[
                    { value: 'all', label: `All Branch Tickets (${totalTickets})` },
                    { value: 'assigned', label: `My Assigned Branches (${assignedTicketsCount})` },
                  ]}
                  activeChip={assignmentScope}
                  onChipChange={(val) => {
                    setAssignmentScope(val);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {/* Toolbar Search & Filter Chips */}
            <div className="table-toolbar">
              <div className="search-box">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  placeholder="Search ticket title, Operator ID, name, or email..."
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
                  { value: 'pending', label: `Pending (${pendingCount})` },
                  { value: 'ongoing', label: `Ongoing (${ongoingCount})` },
                  { value: 'closed', label: `Closed (${closedCount})` },
                  { value: 'all', label: `All (${totalTickets})` },
                ]}
                activeChip={statusFilter}
                onChipChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              />

              <FilterChipGroup
                chips={[
                  { value: 'all', label: `All Priorities (${totalTickets})` },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                activeChip={priorityFilter}
                onChipChange={(value) => {
                  setPriorityFilter(value);
                  setCurrentPage(1);
                }}
              />

              <label className="ticket-sort-control">
                <span>Sort</span>
                <select
                  value={ticketSort}
                  onChange={(event) => {
                    setTicketSort(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort tickets"
                >
                  <option value="priority">Priority</option>
                  <option value="recent">Recent</option>
                </select>
              </label>
            </div>

            {/* Ticket Table */}
            <TicketTable
              tickets={paginatedTickets}
              loading={ticketsLoading}
              disabled={isSubmitting}
              onViewThread={(t) => navigate(`/admin/tickets/${t.id}`)}
              onCloseTicket={handleCloseTicket}
              onStatusChange={handleStatusChange}
            />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5]}
            />
          </section>
        </section>
      </div>

      <CreateTicketModal
        ref={createModalRef}
        onCreateTicket={handleCreateTicket}
        isLoading={isSubmitting}
        isOperatorPortal={false}
        operatorsList={operatorsList}
      />
    </main>
  );
}
