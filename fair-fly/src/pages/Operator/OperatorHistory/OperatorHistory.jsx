import { useState } from 'react';
import './operator-history.css';

export default function OperatorHistory() {
  const [tab, setTab] = useState('appointments');

  return (
    <div className="card op-history">
      <div className="op-history-header">
        <i className="fa-solid fa-clock-rotate-left" style={{ color: '#16a34a' }}></i>
        <div>
          <h2>History</h2>
          <p>View past appointments and completed services</p>
        </div>
      </div>

      <div className="op-tab-strip">
        <button
          className={`op-tab ${tab === 'appointments' ? 'active' : ''}`}
          onClick={() => setTab('appointments')}
        >
          Appointment History
        </button>
        <button
          className={`op-tab ${tab === 'services' ? 'active' : ''}`}
          onClick={() => setTab('services')}
        >
          Service History
        </button>
      </div>

      <div className="op-history-empty">
        {tab === 'appointments' ? (
          <>
            <i className="fa-regular fa-calendar"></i>
            <h3>No appointment history yet</h3>
            <p>Completed and cancelled appointments will appear here</p>
          </>
        ) : (
          <>
            <i className="fa-regular fa-file-lines"></i>
            <h3>No service history yet</h3>
            <p>Completed and cancelled services will appear here</p>
          </>
        )}
      </div>
    </div>
  );
}
