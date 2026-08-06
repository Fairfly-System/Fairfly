import './admin-sidebar.css';
import { NavLink } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, userDetails } = useAuthContext();

  /** Derive initials for avatar fallback */
  const getInitials = () => {
    if (userDetails?.name) {
      return userDetails.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return 'A';
  };

  /** Humanize role for display */
  const displayRole = () => {
    const role = userDetails?.role || 'admin';
    if (role === 'admin') return 'Super Administrator';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Close button — mobile only */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/FairflyLogo.png" alt="Fairfly Logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Fairfly Admin</span>
            <span className="sidebar-brand-subtitle">Management Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-links">
          <NavLink to="/admin" end onClick={onClose}>
            <i className="fa-solid fa-arrow-trend-up"></i>
            Analytics
          </NavLink>

          <NavLink to="/admin/services" onClick={onClose}>
            <i className="fa-regular fa-file-lines"></i>
            Services
          </NavLink>

          <NavLink to="/admin/workflow-templates" onClick={onClose}>
            <i className="fa-solid fa-diagram-project"></i>
            Workflows
          </NavLink>

          <NavLink to="/admin/operators" onClick={onClose}>
            <i className="fa-solid fa-users"></i>
            Operators
          </NavLink>

          <NavLink to="/admin/franchise-apps" onClick={onClose}>
            <i className="fa-solid fa-briefcase"></i>
            Franchise Application
          </NavLink>

          <NavLink to="/admin/tickets" onClick={onClose}>
            <i className="fa-solid fa-ticket"></i>
            Tickets
          </NavLink>

          <NavLink to="/admin/inquiry-history" onClick={onClose}>
            <i className="fa-solid fa-clipboard-list"></i>
            Inquiry History
          </NavLink>

          <NavLink to="/admin/quick-links" onClick={onClose}>
            <i className="fa-solid fa-link"></i>
            Quick Links
          </NavLink>
        </nav>

        {/* User profile */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{getInitials()}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">
              {userDetails?.name || user?.email || 'Admin User'}
            </span>
            <span className="sidebar-profile-role">{displayRole()}</span>
          </div>
        </div>
      </aside>
    </>
  );
}