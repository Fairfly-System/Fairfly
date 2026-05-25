import React from 'react'
import './navbar.css'

export default function Navbar() {
  return (
    <nav className="nav">
      <a href="#" className="logo">
        <div className="logoIcon">

        <img src='FairflyLogo.png'></img>

        </div>

      </a>

      <div className="right">
        <a href="#about" className="linkAbout">
          About
        </a>

        <a href="#login" className="linkLogin">
          Login
        </a>

        <a href="#franchise" className="btnFranchise">
          <i class="fa-solid fa-suitcase"></i> Apply for Franchise
        </a>

      </div>
    </nav>
  )
}