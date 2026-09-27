import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './appointment-detail.css';

const ApproveIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;
const RejectIcon = (props) => <i className="fa-solid fa-circle-xmark" {...props}></i>;

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [confirmState, setConfirmState] = useState(null); // 'confirm' | 'cancel'
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Directly subscribe to the specific appointment document (1 document read instead of entire collection)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(firestore, 'appointments', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setAppointment({ id: docSnap.id, ...docSnap.data() });
        } else {
          setAppointment(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[AppointmentDetailPage] Document error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!appointment) return;
    ApiCaller(
      `${API_BASE_URL}/api/appointments/${appointment.id}/status`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Appointment status updated to ${newStatus}`, 'success');
        setConfirmState(null);
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Appointments', to: '/operator/appointments' },
    { label: appointment ? (appointment.clientName || appointment.name) : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!appointment || (appointment.status || '').toLowerCase() !== 'pending') return [];
    return [
      {
        label: 'Confirm Appointment',
        icon: 'fa-solid fa-check',
        onClick: () => setConfirmState('confirm'),
        className: 'btn-primary',
        disabled: isConfirmLoading,
      },
      {
        label: 'Cancel Appointment',
        icon: 'fa-solid fa-xmark',
        onClick: () => setConfirmState('cancel'),
        className: 'btn-danger',
        disabled: isConfirmLoading,
      },
    ];
  }, [appointment, isConfirmLoading]);

  const getStatusType = () => {
    if (!appointment) return 'neutral';
    const status = (appointment.status || '').toLowerCase();
    if (status === 'confirmed') return 'success';
    if (status === 'cancelled') return 'danger';
    return 'warning';
  };

  return (
    <RecordDetailLayout
      title={appointment ? (appointment.clientName || appointment.name) : 'Appointment Details'}
      subtitle={appointment?.serviceType || appointment?.service || 'General Inquiry'}
      status={appointment?.status ? appointment.status.toUpperCase() : 'PENDING'}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo="/operator/appointments"
      backLabel="Back to Appointments"
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !appointment}
      notFoundMessage="The appointment request could not be found."
    >
      {appointment && (
        <div className="appointment-detail-wrapper">
          <div className="details-grid-2">
            {/* Client Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user"></i> Client Information
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client Name</span>
                  <span className="detail-value">{appointment.clientName || appointment.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{appointment.clientEmail || appointment.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{appointment.clientPhone || appointment.phone || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Appointment Schedule */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-calendar"></i> Consult Schedule
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Preferred Date</span>
                  <span className="detail-value">{appointment.preferredDate || appointment.date || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Time</span>
                  <span className="detail-value">{appointment.preferredTime || appointment.time || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Requested At</span>
                  <span className="detail-value">
                    {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </article>
          </div>

          {/* Consultation Purpose */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-regular fa-comment-dots"></i> Purpose of Consultation
            </h2>
            <p className="purpose-text">
              {appointment.purpose || 'No consultation purpose description was provided.'}
            </p>
          </article>

          {/* Confirmations */}
          <ConfirmationModal
            isOpen={confirmState === 'confirm'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={ApproveIcon}
            Title="Confirm this appointment request?"
            Desc="The client will be notified that the consultation slot has been confirmed."
            BtnColor="var(--complete-green-dark)"
            confirmText="Confirm Request"
            isLoading={isConfirmLoading}
            OnConfirm={() => handleStatusChange('Confirmed')}
          />

          <ConfirmationModal
            isOpen={confirmState === 'cancel'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={RejectIcon}
            Title="Cancel this appointment request?"
            Desc="The client will be notified that the consultation slot has been cancelled."
            BtnColor="var(--error-red)"
            confirmText="Cancel Request"
            isLoading={isConfirmLoading}
            OnConfirm={() => handleStatusChange('Cancelled')}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
