import { Outlet } from 'react-router';
import OperatorNavbar from '../../../components/OperatorComponents/OperatorNavbar/OperatorNavbar';
import OperatorSidebar from '../../../components/OperatorComponents/OperatorSidebar/OperatorSidebar';
import './operator-layout.css';

export default function OperatorLayout() {
  return (
    <>
      <OperatorNavbar />

      <div className="op-layout-stats">
        <div className="card op-stat">
          <div className="op-stat-top">
            <span>Active Services</span>
            <i className="fa-regular fa-clipboard-list" style={{ color: '#3b82f6' }}></i>
          </div>
          <h2>3</h2>
          <p>Currently processing</p>
        </div>

        <div className="card op-stat">
          <div className="op-stat-top">
            <span>Completed Today</span>
            <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
          </div>
          <h2>12</h2>
          <p style={{ color: '#16a34a' }}>+3 from yesterday</p>
        </div>

        <div className="card op-stat">
          <div className="op-stat-top">
            <span>Pending Actions</span>
            <i className="fa-regular fa-clock" style={{ color: '#f97316' }}></i>
          </div>
          <h2>5</h2>
          <p style={{ color: '#f97316' }}>Requires attention</p>
        </div>
      </div>

      <div className="op-layout-body">
        <OperatorSidebar />
        <main className="op-layout-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
