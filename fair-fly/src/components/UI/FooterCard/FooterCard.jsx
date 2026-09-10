import React from 'react'
import './footer-card.css'
import { NavLink } from 'react-router'

export default function FooterCard() {
  return (
    <section className="footer-section">
      <div className="footer-card">
        <h2 className="footer-title">
          Ready to Start Your Journey with <span className="footer-title-accent">Fairfly</span>?
        </h2>
        <p className="footer-sub">
          Join dozens of satisfied travelers and entrepreneurs who trust Fairfly for expedited documentation, flight booking, and franchise operations nationwide.
        </p>
        <NavLink to="/register" className="footer-btn">
          <span>Create an Account</span>
          <i className="fa-solid fa-arrow-right"></i>
        </NavLink>
      </div>
    </section>
  )
}
