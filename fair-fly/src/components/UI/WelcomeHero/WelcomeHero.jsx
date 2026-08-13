import React from 'react';
import './welcome-hero.css';

/**
 * WelcomeHero — dashboard greeting hero banner with semantic header & image performance controls.
 *
 * Props:
 *  userName        {string}  — User's name (e.g., "Admin", "John")
 *  subtitle        {string}  — A short helpful summary sentence
 *  illustrationSrc {string}  — Optional path to a travel-themed illustration
 *  dateDisplay     {string}  — Optional custom date string. If omitted, formats today's date.
 */
export default function WelcomeHero({
  userName,
  subtitle,
  illustrationSrc,
  dateDisplay,
}) {
  // Generate date display if not provided
  const formattedDate = dateDisplay || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="welcome-hero card">
      <div className="welcome-hero-content">
        <div className="welcome-hero-date">
          <i className="fa-regular fa-calendar-days"></i> {formattedDate}
        </div>
        
        <h1 className="welcome-hero-title">
          Welcome back, <span className="welcome-hero-name">{userName || 'User'}</span>!
        </h1>
        
        {subtitle && <p className="welcome-hero-subtitle">{subtitle}</p>}
      </div>

      {illustrationSrc && (
        <div className="welcome-hero-illustration">
          <img
            src={illustrationSrc}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
        </div>
      )}
    </header>
  );
}
