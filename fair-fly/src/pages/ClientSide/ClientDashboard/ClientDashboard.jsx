import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import ClientServiceTracker from '../../../components/Client/ClientServiceTracker/ClientServiceTracker';
import ClientNavbar from '../../../components/Client/ClientNavbar/ClientNavbar';
import './client-dashboard.css';

export default function ClientDashboard() {
  const { user } = useAuthContext();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);

  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Firestore Real-time listener for Client's active services
  useEffect(() => {
    let unsubscribe;

    try {
      setLoadingServices(true);
      const activeServicesRef = collection(db, 'activeServices');

      // If client is logged in, query where clientUid == user.uid, otherwise get real-time snapshot
      let q = activeServicesRef;
      if (user?.uid) {
        q = query(activeServicesRef, where('clientUid', '==', user.uid));
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort by startedAt desc
          list.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
          setActiveServices(list);
          setLoadingServices(false);
        },
        (error) => {
          console.error('[ClientDashboard] Error subscribing to activeServices onSnapshot:', error);
          // Fallback snapshot without filter if query index fails
          onSnapshot(activeServicesRef, (snap) => {
            const allList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const userOnly = user?.uid ? allList.filter((s) => s.clientUid === user.uid) : allList;
            setActiveServices(userOnly);
            setLoadingServices(false);
          });
        }
      );
    } catch (err) {
      console.error('[ClientDashboard] Setup onSnapshot error:', err);
      setLoadingServices(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return (
    <div className="page">
      <ClientNavbar />

      <main className="main">
        <h1 className="pageTitle">Welcome to Your Dashboard</h1>

        <p className="pageSub">
          Request a service, schedule an appointment, and track your active requests in real-time!
        </p>

        {/* Action Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Request Service Card */}
          <div className="appointmentCard" style={{ margin: 0 }}>
            <div className="appointmentHeader">
              <div className="appointmentIconWrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <p><i className="fa-solid fa-file-circle-plus"></i></p>
              </div>

              <div>
                <h2 className="appointmentTitle">Request a Service</h2>
                <p className="appointmentSub">
                  Select a travel service and choose your preferred branch for processing
                </p>
              </div>
            </div>

            <div className="appointmentBody">
              <p className="appointmentDesc">
                Avail travel services online including PSA documents, passport processing, VISA assistance, package tours, and airline tickets assigned directly to your branch of choice.
              </p>

              <button
                className="scheduleBtn"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: '#ffffff' }}
                onClick={() => setShowServiceRequestModal(true)}
              >
                <i className="fa-solid fa-plus-circle"></i>
                Request Service Online
              </button>
            </div>
          </div>

          {/* Schedule Appointment Card */}
          <div className="appointmentCard" style={{ margin: 0 }}>
            <div className="appointmentHeader">
              <div className="appointmentIconWrap">
                <p><i className="fa-solid fa-calendar-check"></i></p>
              </div>

              <div>
                <h2 className="appointmentTitle">Schedule Branch Appointment</h2>
                <p className="appointmentSub">
                  Book a face-to-face meeting with our agency branch
                </p>
              </div>
            </div>

            <div className="appointmentBody">
              <p className="appointmentDesc">
                Book an appointment to visit our physical branch office for face-to-face consultations, document turn-over, or in-person assistance.
              </p>

              <button
                className="scheduleBtn"
                onClick={() => setShowAppointmentModal(true)}
              >
                <i className="fa-solid fa-calendar-day"></i>
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ClientServiceRequestModal
          isOpen={showServiceRequestModal}
          onClose={() => setShowServiceRequestModal(false)}
        />

        <ClientAppointmentForm
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
        />

        {/* Services Tracker List */}
        <div className="servicesCard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 className="servicesTitle" style={{ margin: 0 }}>My Active Services</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
              <i className="fa-solid fa-bolt" style={{ color: '#eab308', marginRight: '0.35rem' }}></i>
              Live Real-Time Updates
            </span>
          </div>

          <p className="servicesSub">
            Track step-by-step fulfillment progress for your requested services
          </p>

          <div className="servicesList" style={{ marginTop: '1rem' }}>
            {loadingServices ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <p>Connecting to real-time service tracking...</p>
              </div>
            ) : activeServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }}></i>
                <h3 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 0.5rem 0' }}>No Active Service Requests</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                  You haven't requested any services yet. Click "Request Service Online" above to select a service and assigned branch.
                </p>
                <button
                  className="scheduleBtn"
                  style={{ display: 'inline-flex', width: 'auto', padding: '0.6rem 1.25rem' }}
                  onClick={() => setShowServiceRequestModal(true)}
                >
                  <i className="fa-solid fa-plus-circle"></i>
                  Request Your First Service
                </button>
              </div>
            ) : (
              activeServices.map((srv) => (
                <ClientServiceTracker key={srv.id} service={srv} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}