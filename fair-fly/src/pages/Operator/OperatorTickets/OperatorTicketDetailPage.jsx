import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import TicketThread from '../../../components/Admin/Tickets/TicketThread';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './operator-ticket-detail.css';

export default function OperatorTicketDetailPage() {
  const { id } = useParams();
  console.log('[OperatorTicketDetailPage] Rendering detail page, ID =', id);
  const navigate = useNavigate();
  const { data: tickets, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with Firestore context data
  const ticket = useMemo(() => {
    if (!tickets || !id) return null;
    return tickets.find((t) => t.id === id) || null;
  }, [tickets, id]);

  const handleSendMessage = async (ticketId, messageText) => {
    return new Promise((resolve, reject) => {
      ApiCaller(
        `${API_BASE_URL}/api/tickets/${ticketId}/messages`,
        'POST',
        { message: messageText, senderRole: 'operator' },
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

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Tickets', to: '/operator/tickets' },
    { label: ticket ? `Ticket Details` : 'Loading...' },
  ];

  if (loading) {
    return (
      <main className="operator-ticket-detail-page page-fade-in">
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
