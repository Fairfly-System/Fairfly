import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import ClientServiceTracker from '../../../components/Client/ClientServiceTracker/ClientServiceTracker';
import AppNavbar from '../../../components/UI/AppNavbar/AppNavbar';
import WelcomeHero from '../../../components/UI/WelcomeHero/WelcomeHero';
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
    <div className="client-dashboard-page page-fade-in">
      <AppNavbar
        portalName="Client"
        portalSubtitle="Travel Services & Bookings"
        showSidebarOffset={false}
      />

      <main className="main">
        <WelcomeHero
          title="Welcome to Your Dashboard"
          subtitle="Request a service, schedule an appointment, and track your active requests in real-time!"
          illustrationSrc="/pageImages/client/dashboard.png"
        />

        {/* Action Cards Grid */}
        <div className="client-action-grid">
          {/* Request Service Card */}
          <article className="card client-action-card">
            <div className="client-card-header">
              <div className="client-icon-bubble client-icon-bubble--primary">
                <i className="fa-solid fa-file-circle-plus"></i>
              </div>

              <div>
                <h2>Request a Service</h2>
                <p>Select a travel service and choose your preferred branch for processing</p>
              </div>
            </div>

            <div className="client-card-body">
              <p>
                Avail travel services online including PSA documents, passport processing, VISA assistance, package tours, and airline tickets assigned directly to your branch of choice.
              </p>

              <button
                className="btn-primary"
                onClick={() => setShowServiceRequestModal(true)}
              >
                <i className="fa-solid fa-plus-circle"></i>
                Request Service Online
              </button>
            </div>
          </article>

          {/* Schedule Appointment Card */}
          <article className="card client-action-card">
            <div className="client-card-header">
              <div className="client-icon-bubble client-icon-bubble--secondary">
                <i className="fa-solid fa-calendar-check"></i>
              </div>

              <div>
                <h2>Schedule Branch Appointment</h2>
                <p>Book a face-to-face meeting with our agency branch</p>
              </div>
            </div>

            <div className="client-card-body">
              <p>
                Book an appointment to visit our physical branch office for face-to-face consultations, document turn-over, or in-person assistance.
              </p>

              <button
                className="btn-secondary"
                onClick={() => setShowAppointmentModal(true)}
              >
                <i className="fa-solid fa-calendar-day"></i>
                Schedule Appointment
              </button>
            </div>
          </article>
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
        <section className="card client-services-card">
          <div className="client-services-header">
            <div>
              <h2>My Active Services</h2>
              <p>Track step-by-step fulfillment progress for your requested services</p>
            </div>
            <span className="client-realtime-badge">
              <i className="fa-solid fa-bolt"></i>
              Live Real-Time Updates
            </span>
          </div>

          <div className="servicesList">
            {loadingServices ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-light)' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <p>Connecting to real-time service tracking...</p>
              </div>
            ) : activeServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}></i>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', margin: '0 0 0.5rem 0' }}>No Active Service Requests</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: '0 0 1.25rem 0' }}>
                  You haven't requested any services yet. Click "Request Service Online" above to select a service and assigned branch.
                </p>
                <button
                  className="btn-primary"
                  style={{ display: 'inline-flex', width: 'auto' }}
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
        </section>
      </main>
    </div>
  );
}