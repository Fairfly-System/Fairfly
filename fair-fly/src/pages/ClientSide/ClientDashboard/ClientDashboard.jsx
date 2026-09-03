import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { fetchServices } from '../../../services/serviceService';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import ClientInquiryModal from '../../../components/Client/ClientInquiryModal/ClientInquiryModal';
import ClientServicesMarketplace from '../../../components/Client/ClientServicesMarketplace/ClientServicesMarketplace';
import WelcomeHero from '../../../components/UI/WelcomeHero/WelcomeHero';
import './client-dashboard.css';

export default function ClientDashboard() {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedServiceIdForModal, setSelectedServiceIdForModal] = useState('');

  const [catalogServices, setCatalogServices] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Fetch Services Catalog via GET
  useEffect(() => {
    setLoadingCatalog(true);
    fetchServices(
      (data) => {
        const list = (data || []).filter((s) => s.status !== 'Disabled' && s.status !== 'Inactive');
        setCatalogServices(list);
        setLoadingCatalog(false);
      },
      (error) => {
        console.error('[ClientDashboard] Error fetching services catalog:', error);
        setLoadingCatalog(false);
      },
      setLoadingCatalog
    );
  }, []);

  const handleRequestServiceFromCard = (service) => {
    setSelectedServiceIdForModal(service.id);
    setShowServiceRequestModal(true);
  };

  const handleCloseServiceModal = () => {
    setShowServiceRequestModal(false);
    setSelectedServiceIdForModal('');
  };

  return (
    <div className="client-dashboard-page">
      <WelcomeHero
        title="Welcome to Fairfly Client Portal"
        subtitle="Explore our verified travel and document services, filter by category or tags, and request branch processing online."
        illustrationSrc="/pageImages/client/dashboard.png"
      />

      {/* Quick Action Cards Grid */}
      <div className="client-action-grid">
        {/* Quick Request */}
        <article className="card client-action-card">
          <div className="client-card-header">
            <div className="client-icon-bubble client-icon-bubble--primary">
              <i className="fa-solid fa-file-circle-plus"></i>
            </div>
            <div>
              <h2>Custom Service Request</h2>
              <p>Submit custom requirements or start an official service inquiry (SAF-01-002)</p>
            </div>
          </div>

          <div className="client-card-body">
            <p>
              Submit custom requirements for travel packages, PSA documents, passport renewals, VISA assistance, and airline bookings assigned directly to your preferred branch.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowInquiryModal(true)}
            >
              <i className="fa-solid fa-plus-circle"></i>
              Request Custom Service
            </button>
          </div>
        </article>

        {/* Track Ongoing Requests */}
        <article className="card client-action-card">
          <div className="client-card-header">
            <div className="client-icon-bubble client-icon-bubble--primary">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h2>Track Active Requests</h2>
              <p>View step milestones, requirements, and live fulfillment progress</p>
            </div>
          </div>

          <div className="client-card-body">
            <p>
              Check the real-time processing status of your submitted documents, view agency approvals, and track completion estimates on your dedicated tracking page.
            </p>

            <NavLink
              to="/client/tracking"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              Open Tracking Dashboard
            </NavLink>
          </div>
        </article>

        {/* Schedule Appointment Card */}
        <article className="card client-action-card">
          <div className="client-card-header">
            <div className="client-icon-bubble client-icon-bubble--secondary">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <h2>Schedule Branch Visit</h2>
              <p>Book a face-to-face consultation at any Fairfly branch location</p>
            </div>
          </div>

          <div className="client-card-body">
            <p>
              Schedule a branch visit for in-person consultations, document turnover, or expedited branch processing with our operator teams.
            </p>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAppointmentModal(true)}
            >
              <i className="fa-solid fa-calendar-day"></i>
              Schedule Appointment
            </button>
          </div>
        </article>
      </div>

      {/* Shopping UI / Aside Filter Marketplace */}
      <ClientServicesMarketplace
        services={catalogServices}
        loading={loadingCatalog}
        onRequestService={handleRequestServiceFromCard}
      />

      {/* Modals */}
      <ClientInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
      />

      <ClientServiceRequestModal
        isOpen={showServiceRequestModal}
        initialServiceId={selectedServiceIdForModal}
        onClose={handleCloseServiceModal}
      />

      <ClientAppointmentForm
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
      />
    </div>
  );
}