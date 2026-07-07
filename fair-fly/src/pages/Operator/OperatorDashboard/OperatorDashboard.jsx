import { useState } from 'react';
import AddServiceModal from '../../../components/OperatorComponents/AddServiceModal/AddServiceModal';
import './operator-dashboard.css';

const SERVICES = [
  {
    name: 'Maria Santos',
    type: 'PSA',
    priority: 'Normal Priority',
    priorityType: 'normal',
    started: 'March 20, 2026',
    step: 4,
    total: 8,
  },
  {
    name: 'Juan Dela Cruz',
    type: 'Passport',
    priority: 'High Priority',
    priorityType: 'high',
    started: 'March 18, 2026',
    step: 6,
    total: 8,
  },
  {
    name: 'Anna Reyes',
    type: 'VISA',
    priority: 'Normal Priority',
    priorityType: 'normal',
    started: 'March 22, 2026',
    step: 2,
    total: 9,
  },
];

export default function OperatorDashboard() {
  const [showAddService, setShowAddService] = useState(false);
  
  return (
    <div className="card op-dashboard">
      <div className="op-dashboard-header">
        <div>
          <h2>Active Services</h2>
          <p>Services currently being processed</p>
        </div>
        <button className="op-dashboard-btn" onClick={() => setShowAddService(true)}>
          <i className="fa-solid fa-plus"></i>

          Add Service

        </button>
      </div>

      {showAddService && <AddServiceModal onClose={() => setShowAddService(false)} />}

      <div className="op-service-list">
        {SERVICES.map((s) => {
          const pct = Math.round((s.step / s.total) * 100);
          return (
            <div key={s.name} className="op-service-card">
              <div className="op-service-card-top">
                <div className="op-service-meta">
                  <span className="op-service-name">{s.name}</span>
                  <span className="op-service-type">{s.type}</span>
                  <span className={`op-priority ${s.priorityType}`}>{s.priority}</span>
                </div>
                <button className="op-view-btn">
                  <i className="fa-regular fa-file-lines"></i>
                  View Workflow
                </button>
              </div>

              <p className="op-service-started">Started: {s.started}</p>

              <div className="op-progress-row">
                <span className="op-progress-label">Progress</span>
                <span className="op-progress-step">Step {s.step} of {s.total}</span>
              </div>
              <div className="op-progress-track">
                <div className="op-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
