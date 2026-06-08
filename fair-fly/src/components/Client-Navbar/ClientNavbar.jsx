import React from 'react'
import './client-navbar.css'

export default function ClientNavbar({ onNavigate, currentPage }) {
  return (
    <nav className="client-nav">
        <a
          href="#"
          className="client-logo"
          onClick={(e) => {
            e.preventDefault()
            onNavigate && onNavigate('home')
          }}
        >
          <div className="client-logoIcon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                fill="white"
              />
              <path
                d="M2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span>
            <span className="fair">fair</span>
            <span className="fly">fly</span>
          </span>
        </a>

        <div className="navRight">
          <span className="welcome">
            Welcome, client@email.com
          </span>

          <a
            href="#"
            className="logout"
            onClick={(e) => {
              e.preventDefault()
              onNavigate && onNavigate('home')
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </a>
        </div>
      </nav>
  )
}
