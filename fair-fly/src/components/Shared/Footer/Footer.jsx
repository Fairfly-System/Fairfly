import React from 'react'
import './footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="left">
        <a href="#" className="logo">

            <img src='FairflyLogo.png'></img>

        </a>
      </div>

      <p className="copy">© 2026 Fairfly Travel & Tours. All rights reserved.</p>

      {/* <div className="links">
        <a href="#admin" className="link">Admin Portal</a>
        <a href="#operator" className="link">Operator Portal</a>
      </div> */}
      
    </footer>
  )
}
