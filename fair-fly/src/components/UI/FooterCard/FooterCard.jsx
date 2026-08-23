import React from 'react'
import './footer-card.css'
import { NavLink } from 'react-router'

export default function FooterCard() {
  return (
    <section className="footer-section">
      <div className="footer-card">
        <h2 className="footer-title">Ready to Start Your Journey with Us?</h2>
        <p className="footer-sub">
          Join dozens of satisfied travelers who trust Fairfly for their travel needs
        </p>
        <NavLink to="/register" className="footer-btn">
          Create an Account <i className="fa-solid fa-arrow-right"></i>
        </NavLink>
      </div>
    </section>
  )
}
