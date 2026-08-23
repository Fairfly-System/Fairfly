import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import './admin-tickets.css';
import { useAdminContext } from '../../../context/AdminContext';
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
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';

export default function TicketsContent() {
  const navigate = useNavigate();
  const { data: tickets, loading: ticketsLoading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorsList, setOperatorsList] = useState([]);

  const createModalRef = useRef(null);

  // Subscribe to registered operators in Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'users'), where('role', '==', 'operator'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOperatorsList(list);
    });
    return () => unsub();
  }, []);

  // Keep selected ticket object in sync with real-time Firestore updates
  const activeTicket = useMemo(() => {
    if (!selectedTicketId || !tickets) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const titleStr = (ticket.title || '').toLowerCase();
      const opIdStr = (ticket.operatorId || '').toLowerCase();
      const opNameStr = (ticket.operatorName || '').toLowerCase();
      const opEmailStr = (ticket.operatorEmail || '').toLowerCase();
      const idStr = (ticket.id || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        titleStr.includes(search) ||
        opIdStr.includes(search) ||
        opNameStr.includes(search) ||
        opEmailStr.includes(search) ||
        idStr.includes(search);

      const ticketStatus = (ticket.status || 'Pending').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || ticketStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [tickets, searchTerm, statusFilter]);

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
    return ApiCaller(
      `${API_BASE_URL}/api/tickets`,
      'POST',
      ticketData,
      { Authorization: `Bearer ${userToken}` },
      (res) => {
        addToast('Support ticket created successfully', 'success');
        createModalRef.current?.closeModal();
      },
      (error) => {
        addToast(`Failed to create ticket: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  // API Handler: Send message in forum thread
  const handleSendMessage = async (ticketId, messageText) => {
    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets/${ticketId}/messages`,
        'POST',
        { message: messageText, senderRole: 'admin' },
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast('Response posted to support thread', 'success');
          resolve(res);
        },
        (error) => {
          addToast(`Failed to send message: ${error.message}`, 'error');
          reject(error);
        },
        setIsSubmitting
      );
    });
  };

  // API Handler: Close Ticket / Forum Thread
  const handleCloseTicket = async (ticketId) => {
    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets/${ticketId}/close`,
        'POST',
        {},
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast('Support forum thread has been closed', 'info');
          resolve(res);
        },
        (error) => {
          addToast(`Failed to close ticket: ${error.message}`, 'error');
          reject(error);
        },
        setIsSubmitting
      );
    });
  };

  // API Handler: Change Status
  const handleStatusChange = async (ticketId, newStatus) => {
    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets/${ticketId}/status`,
        'PATCH',
        { status: newStatus },
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast(`Ticket status updated to ${newStatus}`, 'success');
          resolve(res);
        },
        (error) => {
          addToast(`Failed to update status: ${error.message}`, 'error');
          reject(error);
        },
        setIsSubmitting
      );
    });
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Tickets' },
  ];

  const totalTickets = Array.isArray(tickets) ? tickets.length : 0;
  const pendingCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length : 0;
  const ongoingCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length : 0;
  const closedCount = Array.isArray(tickets) ? tickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length : 0;

  return (
    <main className="tickets-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Support Tickets & Forum Threads"
            subtitle="Manage and respond to operator support requests across all branches"
            illustrationSrc="/pageImages/admin/tickets.png"
            primaryAction={{
              label: 'New Ticket',
              icon: 'fa-solid fa-plus',
              onClick: () => createModalRef.current?.openModal(),
            }}
          />

          <section className="services-summary-grid">
            <KpiCard
              title="Total Tickets"
              value={totalTickets}
              icon="fa-solid fa-headset"
              iconColor="var(--purple)"
            />
            <KpiCard
              title="Pending"
              value={pendingCount}
              icon="fa-regular fa-clock"
              iconColor="var(--orange)"
            />
            <KpiCard
              title="Ongoing Threads"
              value={ongoingCount}
              icon="fa-solid fa-comments"
              iconColor="var(--blue-dark)"
            />
            <KpiCard
              title="Closed"
              value={closedCount}
              icon="fa-regular fa-circle-check"
              iconColor="var(--complete-green-dark)"
            />
          </section>

          <section className="card tickets-table-card">
            <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

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
            />
          </section>

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
