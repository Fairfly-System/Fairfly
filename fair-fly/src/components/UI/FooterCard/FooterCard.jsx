import React from 'react';
import './footer-card.css';
import { NavLink } from 'react-router';

export default function FooterCard() {
  return (
    <section className="footer-section">
      <div className="footer-card">
        <div className="footer-card-eyebrow">
          <span className="footer-eyebrow-accent" />
          <span>NEXT-STAGE ONBOARDING · GET STARTED TODAY</span>
        </div>
        <h2 className="footer-title">
          READY TO START YOUR JOURNEY <br />
          WITH <span className="footer-title-accent">FAIRFLY?</span>
        </h2>
        <p className="footer-sub">
          Join dozens of satisfied travelers and entrepreneurs who trust FairFly for expedited documentation, flight booking, and franchise operations nationwide.
        </p>
        <div className="footer-actions">
          <NavLink to="/register" className="footer-btn primary">
            <span>CREATE AN ACCOUNT</span>
            <i className="fa-solid fa-arrow-right"></i>
          </NavLink>
          <NavLink to="/services" className="footer-btn secondary">
            <span>EXPLORE SERVICES</span>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </NavLink>
        </div>
      </div>
    </section>
  );
}
