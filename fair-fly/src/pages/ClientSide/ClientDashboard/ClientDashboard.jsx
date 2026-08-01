import React, { useState } from 'react'
import './client-dashboard.css'
import AppointmentModal from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import ClientServiceTracker from '../../../components/Client/ClientServiceTracker/ClientServiceTracker';
import ClientNavbar from '../../../components/Client/ClientNavbar/ClientNavbar';

export default function ClientDashboard({ onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState({
        title: `Request Service Appointment`,
        dateRequested: `2023-03-01`,
        status: `completed`,
        progress: 40,
        estimatedCompletion: `2023-03-01`
    });

  return (

    <div className="page">
      
      <ClientNavbar></ClientNavbar>

      <main className="main">
        <h1 className="pageTitle">Welcome to Your Dashboard</h1>

        <p className="pageSub">
          Request a service appointment or track your existing requests here!
        </p>

        <div className="appointmentCard">
          <div className="appointmentHeader">
            <div className="appointmentIconWrap">
                <p><i class="fa-solid fa-calendar"></i></p>
            </div>

            <div>
              <h2 className="appointmentTitle">
                Request Service Appointment
              </h2>

              <p className="appointmentSub">
                Schedule a face-to-face meeting with our agency for any of our
                services
              </p>
            </div>
          </div>

          <div className="appointmentBody">
            <p className="appointmentDesc">
              Book an appointment to visit our branch and avail any of our
              travel services including PSA documents, passport processing,
              VISA assistance, package tours, and airline tickets.
            </p>

          <button
            className="scheduleBtn"
            onClick={() => setShowModal(true)}
          >
            <i className="fa-solid fa-calendar"></i>
            Schedule Appointment
          </button>

            <ClientAppointmentForm
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            />
            
          </div>
        </div>

        <div className="servicesCard">
          <h2 className="servicesTitle">My Services</h2>

          <p className="servicesSub">
            Track the progress of your availed services
          </p>

          <div className="servicesList">

            <ClientServiceTracker service={services}></ClientServiceTracker>

          </div>
        </div>
      </main>
    </div>
    
  )
}