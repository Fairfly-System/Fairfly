import React, { useState } from 'react'
import './franchise-section.css'
import FranchiseApplicationForm from '../Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx'

const perks = [
  'Complete business setup support & onboarding',
  'Exclusive territory rights in your area',
  'Centralized booking & management software',
  'Ongoing training and marketing materials',
  'Access to our nationwide supplier network',
  'Dedicated franchise support team',
]

const stats = [
  {
    icon: 'fa-solid fa-sack-dollar',
    value: '\u20B1500K',
    label: 'Starting Investment',
    sub: 'Flexible payment options',
  },
  {
    icon: 'fa-solid fa-arrow-trend-up',
    value: '3-6 mo',
    label: 'Avg. Payback Period',
    sub: 'Based on active branches',
  },
  {
    icon: 'fa-solid fa-people-group',
    value: '100+',
    label: 'Trusted Clients Nationwide',
    sub: 'And expanding in 2026',
  },

]

const steps = [
  'Submit your franchise application online',
  'Schedule a discovery call with our team',
  'Review and sign the franchise agreement',
  'Complete onboarding training (2 weeks)',
  'Open your Fairfly branch and start serving clients!',
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
