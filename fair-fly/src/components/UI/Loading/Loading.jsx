import React from 'react';
import './Loading.css';

/**
 * Root Application Skeleton Shell.
 * Displayed while initial user authentication state is resolving.
 */
const Loading = ({ text = 'Fairfly' }) => {
  return (
    <div className="loading-app-shell" aria-busy="true" aria-label={`Loading ${text}...`}>
      <aside className="loading-app-sidebar">
        <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', marginBottom: '2rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%', height: '1.25rem', marginBottom: '1.25rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '85%', height: '1.25rem', marginBottom: '1.25rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '65%', height: '1.25rem', marginBottom: '1.25rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', height: '1.25rem', marginBottom: '1.25rem' }} />
      </aside>

      <main className="loading-app-main">
        <header className="loading-app-header">
          <div className="skeleton skeleton-title" style={{ width: '25%', height: '1.75rem', margin: 0 }} />
          <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem' }} />
        </header>

        <section className="loading-app-grid">
          <div className="card skeleton" style={{ height: '7.5rem' }} />
          <div className="card skeleton" style={{ height: '7.5rem' }} />
          <div className="card skeleton" style={{ height: '7.5rem' }} />
          <div className="card skeleton" style={{ height: '7.5rem' }} />
        </section>

        <section className="card skeleton" style={{ height: '20rem', marginTop: '0.5rem' }} />
      </main>
    </div>
  );
};

export default Loading;
