import React, { useState } from 'react'
import './franchise-section.css'
import FranchiseApplicationForm from '../Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx'

const perks = [
  'ISO: 9001-2000 Ready Quality Management System accreditation',
  '2-Month Fast-Track Training Academy backed by 29 years of expertise',
  'Asset-light model with zero physical inventory required',
  'Centralized cloud booking and automated workflow software',
  'Exclusive territory rights and nationwide partner network',
  'Direct head office operational, ticketing, and marketing backup',
]

const stats = [
  {
    icon: 'fa-solid fa-clock-rotate-left',
    value: '29 Yrs',
    label: 'Industry Expertise',
    sub: 'Proven operating knowledge',
  },
  {
    icon: 'fa-solid fa-graduation-cap',
    value: '2 Mo',
    label: 'Mastery Training',
    sub: 'Structured curriculum',
  },
  {
    icon: 'fa-solid fa-cloud-arrow-up',
    value: '100%',
    label: 'Online System',
    sub: 'Virtual office ready',
  },
  {
    icon: 'fa-solid fa-boxes-stacked',
    value: 'Zero',
    label: 'Physical Inventory',
    sub: 'Upfront cashflow model',
  },
]

const steps = [
  'Submit your franchise inquiry application online',
  'Discovery consultation and territory evaluation',
  'Review and sign the FairFly franchise agreement',
  'Complete 2-month comprehensive academy training',
  'Launch your FairFly branch and start earning independently!',
]

export default function FranchiseSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (e) => {
    e.preventDefault()
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  return (
    <section id="franchise-section" className="fr-section">
      <div className="fr-wrap">
        <div className="fr-left">
          <div className="fr-badge">
            <i className="fa-solid fa-building-flag"></i> Franchise Opportunity
          </div>

          <h2 className="fr-title">
            Own a Fairfly
            <br />
            <span className="fr-titleOrange">Franchise Branch</span>
          </h2>

          <p className="fr-desc">
            Join the Fairfly family and build your own thriving travel business. We provide
            everything you need — a proven system, full training, brand support, and an
            established client base — so you can focus on growing your business and serving
            your community.
          </p>

          <ul className="fr-perks">
            {perks.map((p, i) => (
              <li key={i}>
                <i className="fa-solid fa-circle-check"></i>
                {p}
              </li>
            ))}
          </ul>

          <a href="#franchise" className="fr-cta" onClick={openModal}>
            <i className="fa-solid fa-suitcase"></i> Apply for Franchise
          </a>
        </div>

        <div className="fr-right">
          <div className="fr-stats">
            {stats.map((s, i) => (
              <div key={i} className="fr-statCard">
                <i className={`${s.icon} fr-statIcon`}></i>
                <p className="fr-statValue">{s.value}</p>
                <p className="fr-statLabel">{s.label}</p>
                <p className="fr-statSub">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="fr-steps-card">
            <p className="fr-steps-title">How to Get Started</p>
            <ol className="fr-steps-list">
              {steps.map((s, i) => (
                <li key={i}>
                  <span className="fr-stepNum">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <FranchiseApplicationForm isOpen={isModalOpen} onClose={closeModal} />
    </section>
  )
}
