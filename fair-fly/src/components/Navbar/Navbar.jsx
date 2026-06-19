import React, { useState } from 'react';
import './navbar.css';
import { NavLink } from 'react-router';
import FranchiseApplicationForm from '../FranchiseApplicationForm/FranchiseApplicationForm.jsx';
export default function Navbar() {
  // State to track whether the franchise modal is open or closed
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <nav className="nav">
        <NavLink to="/home" className="logo">
          <div className="logoIcon">
            <img src="/FairflyLogo.png" alt="Fairfly Logo" />
          </div>
        </NavLink>

        <div className="right">
          <NavLink to="/about" className="linkAbout">
            About
          </NavLink>

          <NavLink to="/login" className="linkLogin">
            Login
          </NavLink>

          <a href="#franchise" className="btnFranchise" onClick={openModal}>
            <i className="fa-solid fa-suitcase"></i> Apply for Franchise
          </a>
        </div>
      </nav>

      <FranchiseApplicationForm isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}