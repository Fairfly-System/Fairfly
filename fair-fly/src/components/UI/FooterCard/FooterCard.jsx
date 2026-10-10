import React from 'react';
import './footer-card.css';
import { NavLink } from 'react-router';

export default function FooterCard() {
  return (
    <section className="footer-section">
      <div className="footer-card">
        <div className="footer-card-eyebrow">
          <span className="footer-eyebrow-accent" />
          <span>Next-stage onboarding · Get started today</span>
        </div>
        <h2 className="footer-title">
          Ready to start your journey <br />
          with <span className="footer-title-accent">Fairfly?</span>
        </h2>
        <p className="footer-sub">
          Join dozens of satisfied travelers and entrepreneurs who trust FairFly for expedited documentation, flight booking, and franchise operations nationwide.
        </p>
        <div className="footer-actions">
          <NavLink to="/register" className="footer-btn primary">
            <span>Create an account</span>
            <i className="fa-solid fa-arrow-right"></i>
          </NavLink>
          <NavLink to="/services" className="footer-btn secondary">
            <span>Explore services</span>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </NavLink>
        </div>
      </div>
    </section>
  );
}
