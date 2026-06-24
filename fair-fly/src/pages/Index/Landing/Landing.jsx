import React from 'react'
import './landing.css'
import Services from '../../../components/Services/Services'
import FooterCard from '../../../components/FooterCard/FooterCard'

export default function Landing() {
  return (
    <>
    <section className="hero">
      <div className="badge">
        <span className="dot" />
        Trusted Travel Partner
      </div>

      <h1 className="heading">
        Your Journey Starts Here
        <br />
        With<span className="headingGradient"> Fairfly Travel & Tours</span>
      </h1>

      <p className="sub">
        Professional travel services for documents, visas, tour packages, and more. We
        make your travel dreams a reality.
      </p>

      <div className="actions">
        <a href="/register" className="btnPrimary">
          Get Started <i class="fa-solid fa-arrow-right"></i>
        </a>
        <a href="/login" className="btnSecondary">
          Sign In
        </a>
      </div>

    </section>

    <Services></Services>
    <FooterCard></FooterCard>
    </>
  )
}
