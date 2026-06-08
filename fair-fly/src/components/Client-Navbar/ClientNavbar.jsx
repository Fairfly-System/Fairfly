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

        <img src='FairflyLogo.png'></img>

        </div>

        </a>

        <div className="client-navRight">
          <span className="client-welcome">
            Welcome, client@email.com
          </span>

          <a
            href="#"
            className="client-logout"
            onClick={(e) => {
              e.preventDefault()
              onNavigate && onNavigate('home')
            }}
          >
            <p><i class="fa-solid fa-arrow-right-from-bracket"></i></p>
            Logout
          </a>
        </div>
      </nav>
  )
}
