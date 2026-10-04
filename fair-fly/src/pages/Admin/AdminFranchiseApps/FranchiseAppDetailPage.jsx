import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './franchise-app-detail.css';

const ApproveIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;
const RejectIcon = (props) => <i className="fa-solid fa-circle-xmark" {...props}></i>;

export default function FranchiseAppDetailPage({ isHistoryMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [confirmState, setConfirmState] = useState(null); // 'reject'
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    notes: ''
  });

  // Directly subscribe to the specific franchise application document
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(firestore, 'franchiseApplications', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const raw = docSnap.data();
          const derivedFullName = raw.fullName ||
            [raw.firstName, raw.middleInitial, raw.lastName].filter(Boolean).join(' ').trim() || 'Franchise Applicant';
          const data = {
            id: docSnap.id,
            ...raw,
            fullName: derivedFullName,
            phone: raw.phoneNumber || raw.phone || ''
          };
          setApplication(data);
          setScheduleData({
            date: data.scheduledAppointmentDate || data.preferredMeetingDate || '',
            startTime: data.scheduledStartTime || data.preferredMeetingStartTime || '10:00',
            endTime: data.scheduledEndTime || data.preferredMeetingEndTime || '11:00',
            location: data.preferredBranchLocation || 'Main Office',
            notes: ''
          });
        } else {
          setApplication(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[FranchiseAppDetailPage] Document error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const handleStatusChange = async (isApproved) => {
    if (!application) return;
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications/${application.id}/status`,
      'PATCH',
      { status: isApproved ? 'approved' : 'rejected' },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Application ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        setConfirmState(null);
        navigate(isHistoryMode ? '/admin/inquiry-history' : '/admin/franchise-apps');
      },
      (error) => {
        addToast(`Failed to update application: ${error.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleScheduleAppointment = (e) => {
    e.preventDefault();
    if (!scheduleData.date || !scheduleData.startTime || !scheduleData.endTime) {
      addToast('Please provide an appointment date, start time, and end time.', 'error');
      return;
    }

    if (scheduleData.startTime >= scheduleData.endTime) {
      addToast('Start time must be earlier than end time.', 'error');
      return;
    }

    const payload = {
      franchiseApplicationId: application.id,
      appointmentDate: scheduleData.date,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      location: scheduleData.location || application.preferredBranchLocation || 'Head Office / Online',
      notes: scheduleData.notes || ''
    };

    ApiCaller(
      `${API_BASE_URL}/api/appointments/schedule-franchise`,
      'POST',
      payload,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Franchise consultation appointment scheduled successfully!', 'success');
        setShowScheduleModal(false);
      },
      (error) => {
        // Display clear conflict error message from backend
        addToast(error.message || 'Time slot overlaps with an existing appointment.', 'error');
      },
      setIsScheduling
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    isHistoryMode 
      ? { label: 'Inquiry History', to: '/admin/inquiry-history' }
      : { label: 'Franchise Applications', to: '/admin/franchise-apps' },
    { label: application ? application.fullName : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!application) return [];
    const list = [];

    if (application.status === 'pending' || application.status === 'appointment_scheduled') {
      list.push({
        label: application.status === 'appointment_scheduled' ? 'Reschedule Consultation' : 'Schedule Consultation Appointment',
        icon: 'fa-regular fa-calendar-check',
        onClick: () => setShowScheduleModal(true),
        className: 'btn-primary',
        disabled: isConfirmLoading || isScheduling,
      });
    }

    if (application.status !== 'rejected') {
      list.push({
        label: 'Reject Application',
        icon: 'fa-solid fa-xmark',
        onClick: () => setConfirmState('reject'),
        className: 'btn-danger',
        disabled: isConfirmLoading || isScheduling,
      });
    }

    return list;
  }, [application, isConfirmLoading, isScheduling]);

  const getStatusType = () => {
    if (!application) return 'neutral';
    switch (application.status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'appointment_scheduled': return 'info';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <RecordDetailLayout
      title={application?.fullName || 'Application Details'}
      subtitle={application?.email || 'applicant@email.com'}
      status={application?.status ? application.status.toUpperCase() : 'PENDING'}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo={isHistoryMode ? '/admin/inquiry-history' : '/admin/franchise-apps'}
      backLabel={isHistoryMode ? 'Back to History' : 'Back to Applications'}
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !application}
      notFoundMessage="The franchise application could not be found."
    >
      {application && (
        <div className="franchise-detail-wrapper">
          <div className="details-grid-2">
            {/* Applicant Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tie"></i> Applicant Profile
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{application.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{application.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <span className="detail-value">{application.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Location</span>
                  <span className="detail-value">{application.preferredBranchLocation || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Application Meta */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-info"></i> Application Submission Details
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Application ID</span>
                  <span className="detail-value text-mono">{application.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submission Date</span>
                  <span className="detail-value">
                    {application.createdAt ? new Date(application.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Status</span>
                  <span className={`status-pill ${getStatusType() === 'success' ? 'status-pill-active' : getStatusType() === 'danger' ? 'status-pill-disabled' : 'status-pill-pending'}`}>
                    {application.status || 'Pending'}
                  </span>
                </div>
              </div>
            </article>
          </div>

          {/* Form Detailed Responses & Preferences */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-calendar-check"></i> Consultation Schedule Preference
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Preferred Date</span>
                  <span className="detail-value">
                    {application.noPreferenceSchedule
                      ? 'No preference (Admin to schedule)'
                      : (application.preferredMeetingDate || 'None provided')}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Time Slot</span>
                  <span className="detail-value">
                    {application.preferredMeetingStartTime && application.preferredMeetingEndTime
                      ? `${application.preferredMeetingStartTime} - ${application.preferredMeetingEndTime}`
                      : (application.preferredMeetingTime || 'Flexible')}
                  </span>
                </div>
                {application.status === 'appointment_scheduled' && (
                  <div className="detail-item scheduled-highlight">
                    <span className="detail-label">Scheduled Appointment</span>
                    <span className="detail-value text-bold" style={{ color: 'var(--purple)' }}>
                      <i className="fa-regular fa-clock" /> {application.scheduledAppointmentDate || application.preferredMeetingDate} ({application.scheduledStartTime || '10:00'} - {application.scheduledEndTime || '11:00'})
                    </span>
                  </div>
                )}
              </div>
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-briefcase"></i> Business Background
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Business Experience</span>
                  <span className="detail-value">{application.businessExperience || 'None specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Investment Capacity</span>
                  <span className="detail-value">{application.investmentCapacity || 'None specified'}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Proof of Capability & Documents */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-solid fa-file-shield"></i> Proof of Capability & Supporting Documents
            </h2>
            {application.proofOfCapability && application.proofOfCapability.length > 0 ? (
              <div className="proofs-grid">
                {application.proofOfCapability.map((docItem, index) => {
                  const ext = (docItem.name || docItem.fileName || '').split('.').pop().toLowerCase();
                  const iconClass = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
                    ? 'fa-solid fa-file-image'
                    : ext === 'pdf'
                    ? 'fa-solid fa-file-pdf'
                    : ['doc', 'docx'].includes(ext)
                    ? 'fa-solid fa-file-word'
                    : ['xls', 'xlsx'].includes(ext)
                    ? 'fa-solid fa-file-excel'
                    : 'fa-solid fa-file-lines';

                  const sizeMb = docItem.size ? `${(docItem.size / (1024 * 1024)).toFixed(2)} MB` : '';

                  return (
                    <div key={docItem.storagePath || index} className="proof-card">
                      <div className="proof-icon-box">
                        <i className={iconClass} />
                      </div>
                      <div className="proof-info">
                        <span className="proof-filename" title={docItem.name || docItem.fileName}>
                          {docItem.name || docItem.fileName || `Document ${index + 1}`}
                        </span>
                        {sizeMb && <span className="proof-meta">{sizeMb}</span>}
                      </div>
                      <div className="proof-actions">
                        {docItem.url && (
                          <a
                            href={docItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="proof-action-btn"
                            title="Preview / Open Document"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                          </a>
                        )}
                        {docItem.url && (
                          <a
                            href={docItem.url}
                            download={docItem.name || docItem.fileName}
                            className="proof-action-btn"
                            title="Download Document"
                          >
                            <i className="fa-solid fa-download" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-proofs-text">
                <i className="fa-solid fa-circle-info" /> No capability proof documents were attached with this application.
              </p>
            )}
          </article>

          {/* Schedule Consultation Modal */}
          <BaseModal
            isOpen={showScheduleModal}
            onClose={() => !isScheduling && setShowScheduleModal(false)}
            title="Schedule Franchise Consultation"
            subtitle={`Select an appointment time for ${application.fullName}. Collisions with other admin appointments are checked automatically.`}
            maxWidth="36rem"
          >
            <form onSubmit={handleScheduleAppointment} className="schedule-consultation-form">
              <div className="formGroup">
                <label className="form-label">Consultation Date *</label>
                <input
                  type="date"
                  className="modalInput"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                  disabled={isScheduling}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="formGroup">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="modalInput"
                    value={scheduleData.startTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                    disabled={isScheduling}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="modalInput"
                    value={scheduleData.endTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                    disabled={isScheduling}
                    required
                  />
                </div>
              </div>

              <div className="formGroup">
                <label className="form-label">Meeting Location / Channel</label>
                <input
                  type="text"
                  className="modalInput"
                  placeholder="e.g. FairFly Head Office or Online Conference Link"
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                  disabled={isScheduling}
                />
              </div>

              <div className="formGroup">
                <label className="form-label">Internal Notes (Optional)</label>
                <textarea
                  className="modalInput"
                  rows={3}
                  placeholder="Agenda notes or preparation instructions..."
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  disabled={isScheduling}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={isScheduling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isScheduling}
                >
                  {isScheduling ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Checking Conflicts & Booking...
                    </>
                  ) : (
                    'Confirm Consultation'
                  )}
                </button>
              </div>
            </form>
          </BaseModal>

          {/* Confirmations */}
          <ConfirmationModal
            isOpen={confirmState === 'reject'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={RejectIcon}
            Title="Reject this franchise application?"
            Desc={`"${application.fullName}" application will be marked as rejected. This action can be reversed in history.`}
            BtnColor="var(--error-red)"
            confirmText="Reject Application"
            isLoading={isConfirmLoading}
            OnConfirm={() => handleStatusChange(false)}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
