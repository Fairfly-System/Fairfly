import React, { useState } from 'react'
import './client-dashboard.css'
import ClientNavbar from '../../components/Client-Navbar/ClientNavbar'

const services = [
  {
    title: 'PSA Birth Certificate',
    requested: 'March 20, 2026',
    progress: 60,
    status: 'In Progress',
    estimated: 'March 28, 2026',
    steps: [
      { label: 'Receive client inquiry and requirements', done: true },
      { label: 'Verify client documents and IDs', done: true },
      { label: 'Submit request to PSA office', done: true },
      { label: 'Track application status', done: true },
      { label: 'Receive PSA certificate', current: true },
      { label: 'Quality check and verification' },
      { label: 'Notify client for pickup/delivery' },
      { label: 'Complete service and collect payment' },
    ],
    defaultOpen: true,
  },
  {
    title: 'Passport Processing',
    requested: 'March 10, 2026',
    progress: 100,
    status: 'Complete',
    estimated: 'March 25, 2026',
    steps: [
      { label: 'Receive client inquiry and requirements', done: true },
      { label: 'Verify client documents and IDs', done: true },
      { label: 'Submit passport application', done: true },
      { label: 'Track application status', done: true },
      { label: 'Receive passport', done: true },
      { label: 'Quality check and verification', done: true },
      { label: 'Notify client for pickup/delivery', done: true },
      { label: 'Complete service and collect payment', done: true },
    ],
    defaultOpen: false,
  },
  {
    title: 'Package Tour',
    requested: 'March 22, 2026',
    progress: 30,
    status: 'In Progress',
    estimated: 'April 5, 2026',
    steps: [
      { label: 'Receive client inquiry and requirements', done: true },
      { label: 'Verify client documents and IDs', done: true },
      { label: 'Book tour packages and accommodations', current: true },
      { label: 'Confirm bookings with clients' },
      { label: 'Prepare travel documents' },
      { label: 'Final briefing with client' },
      { label: 'Complete service and collect payment' },
    ],
    defaultOpen: false,
  },
]

function StatusBadge({ status }) {
  const isComplete = status === 'Complete'

  return (
    <span className={`badge ${isComplete ? 'badgeComplete' : 'badgeInProgress'}`}>
      {isComplete ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'inline', verticalAlign: 'middle' }}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          &nbsp;Complete
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'inline', verticalAlign: 'middle' }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          &nbsp;In Progress
        </>
      )}
    </span>
  )
}

function ServiceCard({ service }) {
  const [open, setOpen] = useState(service.defaultOpen)

  return (
    <div className="serviceCard">
      <div className="serviceHeader">
        <div>
          <h3 className="serviceTitle">{service.title}</h3>
          <p className="serviceDate">Requested: {service.requested}</p>
        </div>

        <StatusBadge status={service.status} />
      </div>

      <div className="progressRow">
        <span className="progressLabel">Progress</span>
        <span className="progressPct">{service.progress}%</span>
      </div>

      <div className="progressTrack">
        <div
          className={`progressBar ${
            service.status === 'Complete' ? 'progressBarComplete' : ''
          }`}
          style={{ width: `${service.progress}%` }}
        />
      </div>

      <p className="estimated">
        Estimated Completion: {service.estimated}
      </p>

      <button
        className="toggleBtn"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>

        {open ? 'Hide Workflow Steps' : 'View Workflow Steps'}
      </button>

      {open && (
        <div className="workflow">
          <p className="workflowTitle">Service Workflow Progress</p>

          <ul className="stepList">
            {service.steps.map((step, i) => (
              <li
                key={i}
                className={`step ${
                  step.done ? 'stepDone' : ''
                } ${step.current ? 'stepCurrent' : ''}`}
              >
                <span className="stepIcon">
                  {step.done ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#22C55E"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 12l3 3 5-5"
                        stroke="#22C55E"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : step.current ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#6B6FF5"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="5" fill="#6B6FF5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#d1d5db"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </span>

                <div>
                  <span className="stepLabel">{step.label}</span>

                  {step.current && (
                    <span className="currentTag">Current Step</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ClientDashboard({ onNavigate }) {
  return (

    <div className="page">
      
      <ClientNavbar></ClientNavbar>

      <main className="main">
        <h1 className="pageTitle">Welcome to Your Dashboard</h1>

        <p className="pageSub">
          Request a service appointment or track your existing requests
        </p>

        <div className="appointmentCard">
          <div className="appointmentHeader">
            <div className="appointmentIconWrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B6FF5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
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

            <button className="scheduleBtn">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>

              Schedule Appointment
            </button>
          </div>
        </div>

        <div className="servicesCard">
          <h2 className="servicesTitle">My Services</h2>

          <p className="servicesSub">
            Track the progress of your service requests
          </p>

          <div className="servicesList">
            {services.map((service, index) => (
              <ServiceCard key={index} service={service} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}