import React, { useState } from 'react';
import './franchise-section.css';
import FranchiseApplicationForm from '../Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx';

const perks = [
  'ISO: 9001-2000 Ready Quality Management System accreditation',
  '2-Month Fast-Track Training Academy backed by 29 years of expertise',
  'Asset-light model with zero physical inventory required',
  'Centralized cloud booking and automated workflow software',
  'Exclusive territory rights and nationwide partner network',
  'Direct head office operational, ticketing, and marketing backup',
];

const stats = [
  {
    code: '[ 29 YRS ]',
    icon: 'fa-solid fa-clock-rotate-left',
    value: '29 YRS',
    label: 'Industry Expertise',
    sub: 'Proven operating knowledge',
  },
  {
    code: '[ 2 MOS ]',
    icon: 'fa-solid fa-graduation-cap',
    value: '2 MOS',
    label: 'Mastery Training',
    sub: 'Structured curriculum',
  },
  {
    code: '[ 100% ]',
    icon: 'fa-solid fa-cloud-arrow-up',
    value: '100%',
    label: 'Online System',
    sub: 'Virtual office ready',
  },
  {
    code: '[ ZERO ]',
    icon: 'fa-solid fa-boxes-stacked',
    value: 'ZERO',
    label: 'Physical Inventory',
    sub: 'Upfront cashflow model',
  },
];

const steps = [
  'Submit your franchise inquiry application online',
  'Discovery consultation and territory evaluation',
  'Review and sign the FairFly franchise agreement',
  'Complete 2-month comprehensive academy training',
  'Launch your FairFly branch and start earning independently!',
];

export default function FranchiseSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <section id="franchise-section" className="fr-section">
      <div className="fr-container">
        <div className="fr-wrap">
          {/* Left Column */}
          <div className="fr-left">
            <div className="fr-eyebrow">
              <span className="fr-eyebrow-accent" />
              <span>EXPANSION NETWORK · TURNKEY OPERATOR OPPORTUNITY</span>
            </div>

            <h2 className="fr-title">
              OWN A FAIRFLY <br />
              <span className="fr-title-accent">FRANCHISE BRANCH.</span>
            </h2>

            <p className="fr-desc">
              Join the FairFly family and build your own thriving travel business. We provide
              everything you need — a proven system, full training, brand support, and an
              established client base — so you can focus on growing your business and serving
              your community.
            </p>

            <ul className="fr-perks">
              {perks.map((p, i) => (
                <li key={i}>
                  <i className="fa-solid fa-check"></i>
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <a href="#franchise" className="fr-cta" onClick={openModal}>
              <span>APPLY FOR FRANCHISE</span>
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>

          {/* Right Column */}
          <div className="fr-right">
            {/* Sharp Stats Grid */}
            <div className="fr-stats">
              {stats.map((s, i) => (
                <div key={i} className="fr-statCard">
                  <span className="fr-statCode">{s.code}</span>
                  <p className="fr-statValue">{s.value}</p>
                  <p className="fr-statLabel">{s.label}</p>
                  <p className="fr-statSub">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Sharp Steps Card */}
            <div className="fr-steps-card">
              <div className="fr-steps-header">
                <span className="fr-steps-tag">[ ONBOARDING PIPELINE ]</span>
                <p className="fr-steps-title">HOW TO GET STARTED</p>
              </div>
              <ol className="fr-steps-list">
                {steps.map((s, i) => (
                  <li key={i}>
                    <span className="fr-stepNum">[ 0{i + 1} ]</span>
                    <span className="fr-stepText">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <FranchiseApplicationForm isOpen={isModalOpen} onClose={closeModal} />
    </section>
  );
}
