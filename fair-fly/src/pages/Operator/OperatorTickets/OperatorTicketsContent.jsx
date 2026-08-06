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
      // Show tickets created by or assigned to this operator, or if op account
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

  return (
    <>
      <div className="card operator-tickets-page page-fade-in">
        {activeTicket ? (
          <TicketThread
            ticket={activeTicket}
            onBack={() => setSelectedTicketId(null)}
            onSendMessage={handleSendMessage}
            isLoading={isSubmitting}
          />
        ) : (
          <>
            <div className="op-tickets-header">
              <div className="op-tickets-header-left">
                <div className="op-tickets-header-icon">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div>
                  <h2>Support Tickets & Head Office Communication</h2>
                  <p>Raise technical or operational issues directly to Fairfly Head Office</p>
                </div>
              </div>

              <button
                type="button"
                className="create-ticket-btn"
                onClick={() => createModalRef.current?.openModal()}
              >
                <i className="fa-solid fa-plus"></i>
                <span>New Ticket</span>
              </button>
            </div>

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
                  { value: 'pending', label: `Pending (${operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length})` },
                  { value: 'ongoing', label: `Ongoing (${operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'ongoing').length})` },
                  { value: 'closed', label: `Closed (${operatorTickets.filter((t) => (t.status || '').toLowerCase() === 'closed').length})` },
                  { value: 'all', label: `All (${operatorTickets.length})` },
                ]}
                activeChip={statusFilter}
                onChipChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="op-tickets-table-container">
              <TicketTable
                tickets={paginatedTickets}
                loading={ticketsLoading}
                disabled={isSubmitting}
                onViewThread={(t) => setSelectedTicketId(t.id)}
              />
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      <CreateTicketModal
        ref={createModalRef}
        onCreateTicket={handleCreateTicket}
        isLoading={isSubmitting}
      />
    </>
  );
}
