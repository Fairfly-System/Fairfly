import './admin-sidebar.css';
import { NavLink } from 'react-router';

export default function AdminSidebar() {
  return (
    <aside className="card sidebar">
      <div className="sidebar-links">
        <NavLink to="/admin" end>
          <i className="fa-solid fa-arrow-trend-up"></i>
          Analytics
        </NavLink>

        <NavLink to="/admin/services">
          <i className="fa-regular fa-file-lines"></i>
          Services
        </NavLink>

        <NavLink to="/admin/operators">
          <i className="fa-solid fa-users"></i>
          Operators
        </NavLink>

        <NavLink to="/admin/franchise-apps">
          <i className="fa-solid fa-briefcase"></i>
          Franchise Application
        </NavLink>

        <NavLink to="/admin/inquiry-history">
          <i className="fa-solid fa-clipboard-list"></i>
          Inquiry History
        </NavLink>

        <NavLink to="/admin/quick-links">
          <i className="fa-solid fa-link"></i>
          Quick Links
        </NavLink>
      </div>
    </aside>
  );
}