import './admin-sidebar.css';
import { NavLink } from 'react-router';

export default function AdminSidebar() {
  return (
    <aside className="card sidebar">
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

      <a href="#">
        <i className="fa-solid fa-briefcase"></i>
        Franchise Apps
      </a>

      <a href="#">
        <i className="fa-solid fa-clipboard-list"></i>
        Inquiry History
      </a>

      <a href="#">
        <i className="fa-solid fa-link"></i>
        Quick Links
      </a>
    </aside>
  );
}