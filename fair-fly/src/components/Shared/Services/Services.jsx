import React from 'react'
import './services.css'

export default function Services() {
const services = [
  {

    icon: (
      <p>
        <i class="fa-solid fa-plane-up"></i>
      </p>
    ),
    iconBg: 'linear-gradient(135deg, #F97316, #FB923C)',
    title: 'Package Tours',
    desc: 'Customized tour packages worldwide',
    
  },
  {
    icon: (
      <p>
        <i class="fa-solid fa-passport"></i>
      </p>
    ),
    iconBg: 'linear-gradient(135deg, #9B5CF6, #C084FC)',
    title: 'Passport Processing',
    desc: 'Complete passport application assistance',
  },
  {
    icon: (
      <p>
        <i class="fa-solid fa-location-dot"></i>
      </p>
    ),
    iconBg: 'linear-gradient(135deg, #22C55E, #16A34A)',
    title: 'VISA Assistance',
    desc: 'Expert guidance for visa applications',
  },
  {
  icon: (
        <p>
          <i class="fa-regular fa-file-lines"></i>
        </p>
      ),
      iconBg: 'linear-gradient(135deg, #4B6FFF, #6B8FFF)',
      title: 'PSA Birth Certificate',
      desc: 'Fast processing of PSA documents',
    },
  {
    icon: (
      <p>
        <i class="fa-solid fa-ticket"></i>
      </p>
    ),
    iconBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
    title: 'Airline Tickets',
    desc: 'Best deals on flight bookings',
  },
  {
    icon: (
      <p>
        <i class="fa-solid fa-file-circle-check"></i>
      </p>
    ),
    iconBg: 'linear-gradient(135deg, #6B6FF5, #4B4FD5)',
    title: 'Document Services',
    desc: 'All travel document requirements',
  },
]


  return (
    <section id="services" className="section">
      <div className="header">
        <h2 className="title">Our Services</h2>
        <p className="service-sub">Comprehensive travel solutions for all your needs</p>
      </div>

      <div className="grid">
        {services.map((s, i) => (
          <article key={i} className="card">
            <div className="iconWrap" style={{ background: s.iconBg }}>
              {s.icon}
            </div>
            <h3 className="cardTitle">{s.title}</h3>
            <p className="cardDesc">{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
