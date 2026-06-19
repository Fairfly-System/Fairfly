import React from 'react'
import './about.css'

const branches = [
  {
    name: 'Fairfly Baliuag',
    manager: 'Emmanuel Manlapig',
    iconBg: 'linear-gradient(135deg, #4B6FFF, #6B8FFF)',
    address: 'Unit 35 Ground Flr. A Square Mall Brgy. Pinagbarilan, Baliuag, Philippines, 3006',
    phones: ['+63 923 720 8565'],
    email: 'fairflytravel19@yahoo.com',
    hours: 'Monday - Saturday: 9:00 AM - 6:00 PM | Sunday: Closed',
  }
]

const BuildingIcon = ({ bg }) => (
  <div className="branchIcon"style={{ background: bg }}>
    <p><i class="fa-solid fa-building-flag"></i></p>
  </div>
)

const PinIcon = () => (
  <p><i class="fa-solid fa-location-dot"></i></p>
)

const PhoneIcon = () => (
  <p><i class="fa-solid fa-phone"></i></p>
)

const MailIcon = () => (
  <p><i class="fa-solid fa-envelope"></i></p>
)

const ClockIcon = () => (
  <p><i class="fa-solid fa-clock"></i></p>
)

export default function About() {
  return (
    <div className="about-page">

      <div className="about-header">
        <h1 className="about-title">
          About <span className="titleBlue">Fair</span>
          <span className="titleOrange">fly</span>{' '}
          Travel & Tours
        </h1>
        <p className="subtitle">
          Your trusted partner in travel documentation and tour services across the Philippines and the World.
        </p>
      </div>

      <section className="about-section">
        <h2 className="sectionTitle">Our Branches.</h2>

        <div className="branchesList">
          {branches.map((b, i) => (
            <div key={i} className="branchCard">

              <div className="branchLeft">
                <BuildingIcon bg={b.iconBg} />
                <div>
                  <p className="branchName">{b.name}</p>
                  <p className="branchManager">{b.manager}</p>
                </div>
              </div>

              <div className="branchMiddle">
                <span className="infoIcon" style={{ color: '#6B6FF5' }}><PinIcon /></span>
                <p className="branchAddress">{b.address}</p>
              </div>

              <div className="branchRight">
                <div className="infoRow">
                  <span className="infoIcon" style={{ color: '#6B6FF5' }}><PhoneIcon /></span>
                  <div>
                    {b.phones.map((ph, j) => (
                      <p key={j} className="infoText">{ph}</p>
                    ))}
                  </div>
                </div>
                <div className="infoRow">
                  <span className="infoIcon" style={{ color: '#F97316' }}><MailIcon /></span>
                  <a href={`mailto:${b.email}`} className="emailLink">{b.email}</a>
                </div>
                <div className="infoRow">
                  <span className="infoIcon" style={{ color: '#6B6FF5' }}><ClockIcon /></span>
                  <p className="infoText">{b.hours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <div className="headOfficeCard">
          <div className="headOfficeLeft">
            <div className="headOfficeTitle">
              <span style={{ fontSize: '1.2rem' }}><i class="fa-regular fa-building"></i></span>
              <h3>Head Office</h3>
            </div>
            <p className="headOfficeAddr">
              Unit 35 Ground Flr. A Square Mall Brgy. Pinagbarilan, Baliuag, Philippines, 3006
            </p>
          </div>
          <div className="headOfficeRight">
            <a href="mailto:fairflytravel19@yahoo.com" className="emailLink">fairflytravel19@yahoo.com</a>
            <p className="infoText">Franchise Inquiries: +63 923 720 8565</p>
          </div>
        </div>
      </section>

      <section className="connectSection">
        <h2 className="sectionTitle">Connect With Us</h2>
        <div className="socialBtns">
          <a href="https://www.facebook.com/squaretravels.ph/" target="_blank" rel="noreferrer" className="socialBtn" style={{ background: '#1877F2' }}>
            <p><i class="fa-brands fa-square-facebook"></i></p>

          </a>
          <a href="https://www.facebook.com/squaretravels.ph/" target="_blank" rel="noreferrer" className="socialBtn" style={{ background: '#229ED9' }}>
            <p><i class="fa-brands fa-facebook-messenger"></i></p>

          </a>
        </div>
      </section>

    </div>
  )
}
