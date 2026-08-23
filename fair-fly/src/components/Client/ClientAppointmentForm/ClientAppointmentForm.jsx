import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './client-appointment-form.css';

export default function ClientAppointmentForm({ isOpen, onClose, onAppointmentCreated }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceType, setServiceType] = useState('Passport Processing');
  const [branchUid, setBranchUid] = useState('');
  const [branchName, setBranchName] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [purpose, setPurpose] = useState('');

  const [branchesList, setBranchesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Pre-fill user details
  useEffect(() => {
    if (userDetails || user) {
      setClientName(userDetails?.name || userDetails?.displayName || user?.displayName || '');
      setClientEmail(userDetails?.email || user?.email || '');
      setClientPhone(userDetails?.phone || userDetails?.contactNumber || '');
    }
  }, [user, userDetails, isOpen]);

  // Load branches and services dynamically
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingOptions(true);

    const loadData = async () => {
      try {
        // 1. Fetch Branches
        ApiCaller(
          `${API_BASE_URL}/api/operators/branches`,
          'GET',
          null,
          userToken ? { Authorization: `Bearer ${userToken}` } : {},
          (data) => {
            const list = Array.isArray(data) ? data : [];
            if (list.length > 0) {
              setBranchesList(list);
              setBranchUid(list[0].uid);
              setBranchName(list[0].branchName || list[0].name || 'Main Branch');
            } else {
              fetchBranchesFirestore();
            }
          },
          () => fetchBranchesFirestore()
        );

        // 2. Fetch Services
        ApiCaller(
          `${API_BASE_URL}/api/services`,
          'GET',
          null,
          userToken ? { Authorization: `Bearer ${userToken}` } : {},
          (data) => {
            const list = Array.isArray(data) ? data : [];
            const activeOnly = list.filter((s) => s.status !== 'Disabled' && s.status !== 'Inactive');
            if (activeOnly.length > 0) {
              setServicesList(activeOnly);
              setServiceType(activeOnly[0].name);
            }
          },
          null,
          setIsLoadingOptions
        );
      } catch (err) {
        console.error('Error loading appointment form options:', err);
        setIsLoadingOptions(false);
      }
    };

    const fetchBranchesFirestore = async () => {
      try {
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        const q = query(collection(db, 'users'), where('role', '==', 'operator'));
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            uid: doc.id,
            branchName: d.branchName || d.name || 'Branch Operator',
            address: d.address || '',
            status: d.status || 'Active'
          };
        }).filter((b) => b.status !== 'Inactive');
        if (list.length > 0) {
          setBranchesList(list);
          setBranchUid(list[0].uid);
          setBranchName(list[0].branchName);
        }
      } catch (err) {
        console.error('Firestore branch fallback error:', err);
      }
    };

    loadData();
  }, [isOpen, userToken]);

  const handleBranchChange = (e) => {
    const chosenUid = e.target.value;
    setBranchUid(chosenUid);
    const chosen = branchesList.find((b) => b.uid === chosenUid);
    if (chosen) {
      setBranchName(chosen.branchName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientName.trim() || !clientPhone.trim() || !preferredDate) {
      addToast('Please fill in your name, contact number, and preferred date', 'warning');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      clientUid: user?.uid || '',
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      preferredBranchLocation: branchName || 'Main Branch',
      branchUid: branchUid || '',
      branchName: branchName || 'Main Branch',
      preferredDate: preferredDate,
      preferredTime: preferredTime || '10:00 AM',
      serviceType: serviceType || 'General Consultation',
      purpose: purpose.trim() || 'Consultation & In-Person Document Turnover',
      status: 'Pending'
    };

    ApiCaller(
      `${API_BASE_URL}/api/appointments`,
      'POST',
      payload,
      userToken ? { Authorization: `Bearer ${userToken}` } : {},
      (data) => {
        addToast('Appointment scheduled successfully! Your branch will review and confirm.', 'success');
        setIsSubmitting(false);
        if (onAppointmentCreated) onAppointmentCreated(data);
        onClose();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Unable to schedule appointment. Please check your chosen date and try again.'), 'error');
        setIsSubmitting(false);
      },
      setIsSubmitting
    );
  };

  // Min date today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="38rem"
      title="Schedule Branch Appointment"
      subtitle="Book a face-to-face consultation or document turnover at your preferred branch"
      isLoading={isSubmitting}
    >
      {isLoadingOptions ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
          <p>Loading available branches and appointment slots...</p>
        </div>
      ) : (
        <form className="appointmentForm form-column" onSubmit={handleSubmit}>
          {/* Client Details */}
          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">
                Full Name <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Juan Dela Cruz"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="form-column">
              <label className="form-label">
                Contact Number <span className="req-star">*</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="0912 345 6789"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="juan@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          {/* Service & Branch Selection */}
          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">
                <i className="fa-solid fa-concierge-bell" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Service of Interest
              </label>
              <select
                className="form-select"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {servicesList.length > 0 ? (
                  servicesList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Passport Processing">Passport Processing</option>
                    <option value="Visa & Embassy Assistance">Visa & Embassy Assistance</option>
                    <option value="PSA Documents">PSA Documents</option>
                    <option value="Tour Packages">Tour Packages</option>
                    <option value="Airline Ticketing">Airline Ticketing</option>
                    <option value="General Consultation">General Consultation</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-column">
              <label className="form-label">
                <i className="fa-solid fa-building" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Processing Branch <span className="req-star">*</span>
              </label>
              <select
                className="form-select"
                value={branchUid}
                onChange={handleBranchChange}
                required
              >
                {branchesList.length > 0 ? (
                  branchesList.map((b) => (
                    <option key={b.uid} value={b.uid}>
                      {b.branchName} {b.address ? `(${b.address})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="">Main Branch</option>
                )}
              </select>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">
                <i className="fa-regular fa-calendar" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Preferred Date <span className="req-star">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                min={todayStr}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
            </div>

            <div className="form-column">
              <label className="form-label">
                <i className="fa-regular fa-clock" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Preferred Time
              </label>
              <select
                className="form-select"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          {/* Purpose / Additional Notes */}
          <div className="form-column">
            <label className="form-label">Purpose / Additional Notes</label>
            <textarea
              rows="3"
              className="form-textarea"
              placeholder="Describe your inquiry, documents you will bring, or specific requirements..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              <i className="fa-solid fa-calendar-check"></i>
              {isSubmitting ? 'Booking Appointment...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}