import { useState, useMemo } from 'react';
import './operator-history.css';
import Pagination from '../../../components/UI/Pagination/Pagination';

const MOCK_APPT_HISTORY = [
  { id: 1, name: 'Juan Dela Cruz', service: 'Passport Processing', date: 'March 20, 2026', status: 'Completed' },
  { id: 2, name: 'Maria Santos', service: 'VISA Assistance', date: 'March 18, 2026', status: 'Completed' },
  { id: 3, name: 'Ana Reyes', service: 'Package Tour', date: 'March 15, 2026', status: 'Cancelled' },
];

const MOCK_SERVICE_HISTORY = [
  { id: 101, client: 'Mark Bonifacio', service: 'PSA Birth Certificate', date: 'March 22, 2026', status: 'Completed' },
  { id: 102, client: 'Liza Soberano', service: 'US Visa Renewal', date: 'March 19, 2026', status: 'Completed' },
];

export default function OperatorHistory() {
  const [tab, setTab] = useState('appointments');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const activeData = tab === 'appointments' ? MOCK_APPT_HISTORY : MOCK_SERVICE_HISTORY;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeData.slice(start, start + pageSize);
  }, [activeData, currentPage, pageSize]);

  return (
    <div className="card op-history page-fade-in">
      <div className="op-history-header">
        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--complete-green)' }}></i>
        <div>
          <h2>History Records</h2>
          <p>View past appointments and completed service fulfillments</p>
        </div>
      </div>

      <div className="op-tab-strip">
        <button
          className={`op-tab ${tab === 'appointments' ? 'active' : ''}`}
          onClick={() => {
            setTab('appointments');
            setCurrentPage(1);
          }}
        >
          Appointment History ({MOCK_APPT_HISTORY.length})
        </button>
        <button
          className={`op-tab ${tab === 'services' ? 'active' : ''}`}
          onClick={() => {
            setTab('services');
            setCurrentPage(1);
          }}
        >
          Service History ({MOCK_SERVICE_HISTORY.length})
        </button>
      </div>

      {activeData.length === 0 ? (
        <div className="op-history-empty">
          <i className="fa-regular fa-clock"></i>
          <h3>No records found</h3>
          <p>Completed and processed items will appear here</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name / Client</th>
                <th>Service Type</th>
                <th>Date Completed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name || item.client}</strong>
                  </td>
                  <td>{item.service}</td>
                  <td>{item.date}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        item.status === 'Completed'
                          ? 'status-pill-completed'
                          : 'status-pill-disabled'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={activeData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
