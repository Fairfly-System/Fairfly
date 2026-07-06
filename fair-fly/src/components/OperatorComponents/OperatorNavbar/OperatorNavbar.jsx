import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import TeamChatModal from '../../AdminComponents/TeamChatModal/TeamChatModal';
import './operator-navbar.css';

export default function OperatorNavbar() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="op-nav">
      <div className="op-nav-brand">
                <NavLink to="/home">
                  <div className="client-logoIcon">
                    <img src="/FairflyLogo.png" alt="Fairfly Logo" />
                  </div>
                </NavLink>

            <div className='admin-right'>
            <p id='top-title'>Fairfly Operator</p>
            <p id='down-title'>Service Management Portal</p>
            </div>
      </div>

      <div className="op-nav-actions">
        <button className="op-nav-chat" onClick={() => setIsChatOpen(true)}>
          <i className="fa-regular fa-message"></i>
          Team Chat
        </button>
        <a href="#" className="op-nav-logout" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Logout
        </a>
      </div>

      {isChatOpen && <TeamChatModal onClose={() => setIsChatOpen(false)} />}
    </nav>
  );
}
