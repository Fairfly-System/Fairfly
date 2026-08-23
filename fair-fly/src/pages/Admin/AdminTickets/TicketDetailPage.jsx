import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import TicketThread from '../../../components/Admin/Tickets/TicketThread';
import { fetchTicketById, sendMessageToTicket, closeTicket, updateTicketStatus } from '../../../services/ticketService';
import './ticket-detail.css';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTicket = useCallback(() => {
    if (!id || !userToken) return;
    setLoading(true);
    fetchTicketById(
      userToken,
      id,
      (data) => {
        setTicket(data || null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching ticket detail:', err);
        addToast('Failed to load ticket details', 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [id, userToken, addToast]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleSendMessage = async (ticketId, messageText) => {
    return sendMessageToTicket(
      userToken,
      ticketId,
      messageText,
      (res) => {
        addToast('Response posted to support thread', 'success');
        loadTicket();
      },
      (error) => {
        addToast(`Failed to send message: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const handleCloseTicket = async (ticketId) => {
    return closeTicket(
      userToken,
      ticketId,
      (res) => {
        addToast('Support forum thread has been closed', 'info');
        loadTicket();
      },
      (error) => {
        addToast(`Failed to close ticket: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    return updateTicketStatus(
      userToken,
      ticketId,
      newStatus,
      (res) => {
        addToast(`Ticket status updated to ${newStatus}`, 'success');
        loadTicket();
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Tickets', to: '/admin/tickets' },
    { label: ticket ? `Ticket Details` : 'Loading...' },
  ];

  if (loading) {
    return (
      <main className="ticket-detail-page page-fade-in">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card loading-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20rem' }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--purple)', marginBottom: '1rem' }}></i>
            <p>Loading ticket details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="ticket-detail-page page-fade-in">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card not-found-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20rem', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: 'var(--orange)', marginBottom: '1.25rem' }}></i>
            <h2>Support Ticket Not Found</h2>
            <p>The requested ticket could not be found or has been deleted.</p>
            <button className="btn-primary" onClick={() => navigate('/admin/tickets')}>
              <i className="fa-solid fa-arrow-left"></i> Return to Tickets
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ticket-detail-page page-fade-in">
      <Breadcrumbs items={breadcrumbs} />

      <section className="card ticket-detail-card" style={{ marginTop: '1.25rem' }}>
        <TicketThread
          ticket={ticket}
          onBack={() => navigate('/admin/tickets')}
          onSendMessage={handleSendMessage}
          onCloseForum={handleCloseTicket}
          onStatusChange={handleStatusChange}
          isLoading={isSubmitting}
        />
      </section>
    </main>
  );
}
