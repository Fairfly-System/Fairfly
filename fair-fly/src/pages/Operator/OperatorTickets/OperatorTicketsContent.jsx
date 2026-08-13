import React, { useState, useMemo, useRef } from 'react';
import './operator-tickets.css';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import Pagination from '../../../components/UI/Pagination/Pagination';
import TicketTable from '../../../components/Admin/Tickets/TicketTable';
import TicketThread from '../../../components/Admin/Tickets/TicketThread';
import CreateTicketModal from '../../../components/Admin/Tickets/CreateTicketModal';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';

export default function OperatorTicketsContent() {
  const { data: tickets, loading: ticketsLoading } = useOperatorContext();
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createModalRef = useRef(null);

  // Active operator ID & details
  const currentOperatorId = userDetails?.uid || user?.uid || 'OP-ACCOUNT';
  const currentOperatorName = userDetails?.name || userDetails?.branchName || 'Operator Branch';
  const currentOperatorEmail = userDetails?.email || user?.email || 'operator@fairfly.com';

  // Filter operator-specific tickets or all branch tickets
  const operatorTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      return true;
    });
  }, [tickets]);

  const activeTicket = useMemo(() => {
    if (!selectedTicketId || !operatorTickets) return null;
    return operatorTickets.find((t) => t.id === selectedTicketId) || null;
  }, [selectedTicketId, operatorTickets]);

  const filteredTickets = useMemo(() => {
    return operatorTickets.filter((ticket) => {
      const titleStr = (ticket.title || '').toLowerCase();
      const opIdStr = (ticket.operatorId || '').toLowerCase();
      const opNameStr = (ticket.operatorName || '').toLowerCase();
      const idStr = (ticket.id || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        titleStr.includes(search) ||
        opIdStr.includes(search) ||
        opNameStr.includes(search) ||
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
  }, [operatorTickets, searchTerm, statusFilter]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const alertBarProps = useMemo(() => {
    if (operatorTickets.length === 0) {
      return { message: 'No support tickets raised yet. Click "New Ticket" to contact Head Office for assistance.', type: 'info' };
    }
    const pending = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length;
    const ongoing = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length;
    const closed = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length;

    if (pending > 0) {
      return {
        message: `You have ${pending} pending support ticket${pending !== 1 ? 's' : ''} awaiting Head Office review. ${ongoing} ongoing, ${closed} closed.`,
        type: 'warning',
      };
    }
    return {
      message: `${ongoing} active discussion thread${ongoing !== 1 ? 's' : ''} with Head Office. ${closed} ticket${closed !== 1 ? 's' : ''} closed.`,
      type: 'info',
    };
  }, [operatorTickets]);

  const handleCreateTicket = async (ticketData) => {
    const payload = {
      ...ticketData,
      operatorId: ticketData.operatorId || currentOperatorId,
      operatorName: ticketData.operatorName || currentOperatorName,
      operatorEmail: ticketData.operatorEmail || currentOperatorEmail,
    };

    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets`,
        'POST',
        payload,
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast('Support ticket submitted to Head Office', 'success');
          resolve(res);
        },
        (error) => {
          addToast(`Failed to submit ticket: ${error.message}`, 'error');
          reject(error);
        },
        setIsSubmitting
      );
    });
  };

  const handleSendMessage = async (ticketId, messageText) => {
    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets/${ticketId}/messages`,
        'POST',
        {
          message: messageText,
          senderId: currentOperatorId,
          senderName: currentOperatorName,
          senderRole: 'operator',
        },
        { Authorization: `Bearer ${userToken}` },
        (res) => {
          addToast('Message sent to Head Office thread', 'success');
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

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Tickets' },
  ];

  const totalTickets = operatorTickets.length;
  const pendingCount = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length;
  const ongoingCount = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length;
  const closedCount = operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length;

  return (
    <main className="operator-tickets-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      {activeTicket ? (
        <section className="card operator-tickets-card">
          <TicketThread
            ticket={activeTicket}
            onBack={() => setSelectedTicketId(null)}
            onSendMessage={handleSendMessage}
            isLoading={isSubmitting}
          />
        </section>
      ) : (
        <>
          <PageHeader
            title="Support Tickets & Head Office Communication"
            subtitle="Raise technical or operational issues directly to Fairfly Head Office"
            illustrationSrc="/pageImages/operator/tickets.png"
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

          <section className="card operator-tickets-card">
            <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

            <div className="table-toolbar">
              <div className="search-box">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  placeholder="Search tickets by subject, category, or ID..."
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

            <TicketTable
              tickets={paginatedTickets}
              loading={ticketsLoading}
              disabled={isSubmitting}
              onViewThread={(t) => setSelectedTicketId(t.id)}
            />

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </section>
        </>
      )}

      <CreateTicketModal
        ref={createModalRef}
        onCreateTicket={handleCreateTicket}
        isLoading={isSubmitting}
      />
    </main>
  );
}
