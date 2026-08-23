import React from 'react';
import './training-comparison.css';

const trainingBenefits = [
  {
    icon: 'fa-solid fa-graduation-cap',
    title: 'Intensive 2-Month Fast Track',
    desc: 'Master ticketing systems, visa regulations, tour packaging, and document verification in an accelerated 8-week curriculum.'
  },
  {
    icon: 'fa-solid fa-chalkboard-user',
    title: 'Dedicated Training Room & Direct Mentorship',
    desc: 'Learn directly from industry veterans with 29+ years of combined travel and tourism expertise.'
  },
  {
    icon: 'fa-solid fa-book-open-reader',
    title: 'Turnkey SOPs & Real Transaction Drills',
    desc: 'Practice on real-world cases with ready-to-use procedure manuals, intake templates, and workflow checklists.'
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Drastically Minimized Business Risk',
    desc: 'Avoid costly rookie mistakes, regulatory penalties, and lost client trust from day one of opening.'
  }
];

const trialAndErrorRisks = [
  {
    icon: 'fa-solid fa-person-falling',
    title: 'Trial & Error "On the Street"',
    desc: 'Navigating complex airline rules and visa requirements without guidance, risking expensive client re-bookings.'
  },
  {
    icon: 'fa-solid fa-money-bill-wave',
    title: 'Expensive Business Mistakes',
    desc: 'Paying out of pocket for miscalculated fares, missing documents, or non-refundable reservation errors.'
  },
  {
    icon: 'fa-solid fa-puzzle-piece',
    title: 'Fragmented Trainings & Seminars',
    desc: 'Spending thousands on disconnected weekend seminars that leave huge gaps in practical day-to-day operations.'
  },
  {
    icon: 'fa-solid fa-hourglass-end',
    title: 'Years of Slow, Painful Guesswork',
    desc: 'Taking 3 to 5 years just to learn what FairFly teaches in 2 focused months.'
  }
];

export default function TrainingComparison() {
  return (
    <section id="training-comparison" className="tc-section">
      <div className="tc-container">
        
        <div className="tc-header">
          <div className="tc-badge">
            <i className="fa-solid fa-user-graduate"></i> FairFly Academy & Knowledge Transfer
          </div>
          <h2 className="tc-title">
            29 Years of Travel Industry Expertise, <br />
            <span className="tc-title-accent">Acquired in Just 2 Months</span>
          </h2>
          <p className="tc-subtitle">
            Where do you want to learn your craft? Through expensive trial-and-error mistakes on your own,
            or inside a proven, structured mentorship academy?
          </p>
        </div>

        <div className="tc-grid">
          
          {/* FairFly Academy Card */}
          <article className="tc-card tc-card-system card">
            <div className="tc-card-header">
              <div className="tc-card-badge tc-badge-success">
                <i className="fa-solid fa-circle-check"></i> FairFly Structured Academy
              </div>
              <h3 className="tc-card-heading">Accelerated Mastery & Mentorship</h3>
              <p className="tc-card-sub">Proven curriculum backed by 29 years of operational wisdom.</p>
            </div>

            <div className="tc-points-list">
              {trainingBenefits.map((point, idx) => (
                <div key={idx} className="tc-point-item">
                  <div className="tc-point-icon tc-icon-system">
                    <i className={point.icon}></i>
                  </div>
                  <div>
                    <h4 className="tc-point-title">{point.title}</h4>
                    <p className="tc-point-desc">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Traditional Route Card */}
          <article className="tc-card tc-card-traditional card">
            <div className="tc-card-header">
              <div className="tc-card-badge tc-badge-warning">
                <i className="fa-solid fa-triangle-exclamation"></i> Learning On Your Own
              </div>
              <h3 className="tc-card-heading">Costly Trial & Error</h3>
              <p className="tc-card-sub">High failure rate learning directly from business expenses and losses.</p>
            </div>

            <div className="tc-points-list">
              {trialAndErrorRisks.map((point, idx) => (
                <div key={idx} className="tc-point-item">
                  <div className="tc-point-icon tc-icon-traditional">
                    <i className={point.icon}></i>
                  </div>
                  <div>
                    <h4 className="tc-point-title">{point.title}</h4>
                    <p className="tc-point-desc">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

        </div>

      </div>
    </section>
  );
}
