import React from 'react';
import './training-comparison.css';

const trainingBenefits = [
  {
    code: '[ ACAD-01 ]',
    icon: 'fa-solid fa-graduation-cap',
    title: 'Intensive 2-Month Fast Track',
    desc: 'Master ticketing systems, visa regulations, tour packaging, and document verification in an accelerated 8-week curriculum.'
  },
  {
    code: '[ MENT-02 ]',
    icon: 'fa-solid fa-chalkboard-user',
    title: 'Dedicated Training Room & Direct Mentorship',
    desc: 'Learn directly from industry veterans with 29+ years of combined travel and tourism expertise.'
  },
  {
    code: '[ DRILL-03 ]',
    icon: 'fa-solid fa-book-open-reader',
    title: 'Turnkey SOPs & Real Transaction Drills',
    desc: 'Practice on real-world cases with ready-to-use procedure manuals, intake templates, and workflow checklists.'
  },
  {
    code: '[ RISK-04 ]',
    icon: 'fa-solid fa-shield-halved',
    title: 'Drastically Minimized Business Risk',
    desc: 'Avoid costly rookie mistakes, regulatory penalties, and lost client trust from day one of opening.'
  }
];

const trialAndErrorRisks = [
  {
    code: '[ SLOW-01 ]',
    icon: 'fa-solid fa-person-falling',
    title: 'Trial & Error "On the Street"',
    desc: 'Navigating complex airline rules and visa requirements without guidance, risking expensive client re-bookings.'
  },
  {
    code: '[ LOSS-02 ]',
    icon: 'fa-solid fa-money-bill-wave',
    title: 'Expensive Business Mistakes',
    desc: 'Paying out of pocket for miscalculated fares, missing documents, or non-refundable reservation errors.'
  },
  {
    code: '[ FRAG-03 ]',
    icon: 'fa-solid fa-puzzle-piece',
    title: 'Fragmented Trainings & Seminars',
    desc: 'Spending thousands on disconnected weekend seminars that leave huge gaps in practical day-to-day operations.'
  },
  {
    code: '[ GUESS-04 ]',
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
          <div className="tc-eyebrow">
            <span className="tc-eyebrow-accent" />
            <span>ACADEMY & KNOWLEDGE TRANSFER · 60-DAY OPERATIONAL DRILLS</span>
          </div>
          <h2 className="tc-title">
            29 YEARS OF TRAVEL EXPERTISE, <br />
            <span className="tc-title-accent">ACQUIRED IN JUST 2 MONTHS.</span>
          </h2>
          <p className="tc-subtitle">
            Where do you want to learn your craft? Through expensive trial-and-error mistakes on your own,
            or inside a proven, structured mentorship academy?
          </p>
        </div>

        <div className="tc-grid">
          
          {/* FairFly Academy Card */}
          <article className="tc-card tc-card-system">
            <div className="tc-card-header">
              <span className="tc-card-tag tag-success">[ FAIRFLY STRUCTURED ACADEMY ]</span>
              <h3 className="tc-card-heading">ACCELERATED MASTERY & MENTORSHIP</h3>
              <p className="tc-card-sub">Proven curriculum backed by 29 years of operational wisdom.</p>
            </div>

            <div className="tc-points-list">
              {trainingBenefits.map((point, idx) => (
                <div key={idx} className="tc-point-item">
                  <span className="tc-point-code">{point.code}</span>
                  <div className="tc-point-icon tc-icon-system">
                    <i className={point.icon}></i>
                  </div>
                  <div className="tc-point-body">
                    <h4 className="tc-point-title">{point.title}</h4>
                    <p className="tc-point-desc">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Traditional Route Card */}
          <article className="tc-card tc-card-traditional">
            <div className="tc-card-header">
              <span className="tc-card-tag tag-warning">[ UNGUIDED TRIAL & ERROR ]</span>
              <h3 className="tc-card-heading">PAINFUL SLOW GUESSWORK</h3>
              <p className="tc-card-sub">Learning through lost clients, unassisted re-bookings, and capital drain.</p>
            </div>

            <div className="tc-points-list">
              {trialAndErrorRisks.map((point, idx) => (
                <div key={idx} className="tc-point-item">
                  <span className="tc-point-code">{point.code}</span>
                  <div className="tc-point-icon tc-icon-traditional">
                    <i className={point.icon}></i>
                  </div>
                  <div className="tc-point-body">
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
