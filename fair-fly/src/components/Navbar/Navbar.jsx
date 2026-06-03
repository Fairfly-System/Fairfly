import React from 'react'
import './navbar.css'
import { NavLink } from 'react-router'

export default function Navbar() {
  return (
    <nav className="nav">
      <NavLink to="/home" className="logo">
        <div className="logoIcon">

        <img src='FairflyLogo.png'></img>

        </div>

      </NavLink>

      <div className="right">
        <NavLink to="/about" className="linkAbout">
          About
        </NavLink>

        <NavLink to="/login" className="linkLogin">
          Login
        </NavLink>

        <a href="#franchise" className="btnFranchise">
          <i class="fa-solid fa-suitcase"></i> Apply for Franchise
        </a>

      </div>
    </nav>
  )
}