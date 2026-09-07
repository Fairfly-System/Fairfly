import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import TicketThread from '../../../components/Admin/Tickets/TicketThread';
import { fetchTicketById, sendMessageToTicket, closeTicket, updateTicketStatus } from '../../../services/ticketService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-ticket-detail.css';

export default function OperatorTicketDetailPage() {
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
        addToast(toFriendlyMessage(err, 'Unable to load ticket details.'), 'error');
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
        addToast(toFriendlyMessage(error, 'Could not post response. Please try again.'), 'error');
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
        addToast(toFriendlyMessage(error, 'Could not close ticket. Please try again.'), 'error');
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
        addToast(toFriendlyMessage(error, 'Could not update ticket status. Please try again.'), 'error');
      },
      setIsSubmitting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Tickets', to: '/operator/tickets' },
    { label: ticket ? `Ticket Details` : 'Loading...' },
  ];

  if (loading) {
    return (
      <main className="operator-ticket-detail-page page-fade-in" aria-busy="true">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-title" style={{ width: '45%', height: '1.5rem', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '25%', height: '0.875rem' }} />
            </div>
            <div className="skeleton skeleton-badge" style={{ width: '6rem', height: '1.5rem' }} />
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton skeleton-text" style={{ width: '90%' }} />
            <div className="skeleton skeleton-text" style={{ width: '85%' }} />
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          </div>
          <div className="card skeleton" style={{ height: '14rem', marginTop: '1rem' }} />
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="operator-ticket-detail-page page-fade-in">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card not-found-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20rem', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: 'var(--orange)', marginBottom: '1.25rem' }}></i>
            <h2>Support Ticket Not Found</h2>
            <p>The requested ticket could not be found or has been deleted.</p>
            <button className="btn-primary" onClick={() => navigate('/operator/tickets')}>
              <i className="fa-solid fa-arrow-left"></i> Return to Tickets
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="operator-ticket-detail-page page-fade-in">
      <Breadcrumbs items={breadcrumbs} />

      <section className="card ticket-detail-card" style={{ marginTop: '1.25rem' }}>
        <TicketThread
          ticket={ticket}
          onBack={() => navigate('/operator/tickets')}
          onSendMessage={handleSendMessage}
          onCloseForum={handleCloseTicket}
          onStatusChange={handleStatusChange}
          isLoading={isSubmitting}
        />
      </section>
    </main>
  );
}
