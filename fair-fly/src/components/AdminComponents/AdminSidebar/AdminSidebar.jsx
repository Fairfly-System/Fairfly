import './admin-sidebar.css';
import { NavLink } from 'react-router';

export default function AdminSidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/">
       <i class="fa-solid fa-chart-line"></i>
        Analytics
      </NavLink>

      <NavLink to="services">
        <i class="fa-regular fa-file-lines"></i>
        Services
      </NavLink>

      <NavLink to="operators">
        <i class="fa-solid fa-users"></i>
        Operators
      </NavLink>

      <a href="#">
        <i class="fa-solid fa-briefcase"></i>
        Applications
      </a>

      <a href="#">
        <i class="fa-solid fa-clipboard-list"></i>
        Inquiry History
      </a>

      <a href="#">
        <i class="fa-solid fa-link"></i>
        Quick Links
      </a>
    </aside>
  );
}