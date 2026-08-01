import { NavLink } from 'react-router';
import './operator-sidebar.css';

export default function OperatorSidebar() {
  return (
    <aside className="op-sidebar">
      <NavLink to="/operator" end>
        <i className="fa-solid fa-table-cells-large"></i>
        Dashboard
      </NavLink>

      <NavLink to="/operator/appointments">
        <i className="fa-regular fa-calendar"></i>
        Appointments
        <span className="op-sidebar-badge">3</span>
      </NavLink>

      <NavLink to="/operator/workflows">
        <i className="fa-regular fa-file-lines"></i>
        Workflows
      </NavLink>

      <NavLink to="/operator/history">
        <i className="fa-solid fa-clock-rotate-left"></i>
        History
      </NavLink>

      <NavLink to="/operator/quick-links">
        <i className="fa-solid fa-globe"></i>
        Quick Links
      </NavLink>

      <NavLink to="/operator/inquiry-forms">
        <i className="fa-solid fa-file-pen"></i>
        Inquiry Forms
      </NavLink>
    </aside>
  );
}
