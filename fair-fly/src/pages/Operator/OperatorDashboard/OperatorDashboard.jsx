import { useState, useMemo } from 'react';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AddServiceModal from '../../../components/Operator/AddServiceModal/AddServiceModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import './operator-dashboard.css';

const INITIAL_SERVICES = [
  {
    id: 1,
    name: 'Maria Santos',
    type: 'PSA Certificate',
    priority: 'Normal Priority',
    priorityType: 'normal',
    started: 'March 20, 2026',
    step: 4,
    total: 8,
  },
  {
    id: 2,
    name: 'Juan Dela Cruz',
    type: 'Passport Renewal',
    priority: 'High Priority',
    priorityType: 'high',
    started: 'March 18, 2026',
    step: 6,
    total: 8,
  },
  {
    id: 3,
    name: 'Anna Reyes',
    type: 'VISA Assistance',
    priority: 'Normal Priority',
    priorityType: 'normal',
    started: 'March 22, 2026',
    step: 2,
    total: 9,
  },
];

export default function OperatorDashboard() {
  const [showAddService, setShowAddService] = useState(false);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || s.priorityType === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [services, searchTerm, priorityFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  return (
    <div className="card op-dashboard page-fade-in">
      <div className="op-dashboard-header">
        <div>
          <h2>Active Services Fulfillment</h2>
          <p>Real-time processing status of client service workflows</p>
        </div>
        <button className="op-dashboard-btn" onClick={() => setShowAddService(true)}>
          <i className="fa-solid fa-plus"></i>
          Add Service
        </button>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search by client name or service type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <FilterChipGroup
          chips={[
            { value: 'all', label: `All (${services.length})` },
            { value: 'high', label: `High Priority (${services.filter((s) => s.priorityType === 'high').length})` },
            { value: 'normal', label: `Normal Priority (${services.filter((s) => s.priorityType === 'normal').length})` },
          ]}
          activeChip={priorityFilter}
          onChipChange={(val) => {
            setPriorityFilter(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {showAddService && <AddServiceModal onClose={() => setShowAddService(false)} />}

      <div className="op-service-list">
        {paginatedServices.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-solid fa-list-check empty-icon"></i>
            <p>No active services match your criteria</p>
          </div>
        ) : (
          paginatedServices.map((s) => {
            const pct = Math.round((s.step / s.total) * 100);
            return (
              <div key={s.id} className="op-service-card">
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
                  <span className="op-progress-label">Fulfillment Progress</span>
                  <span className="op-progress-step">
                    Step {s.step} of {s.total} ({pct}%)
                  </span>
                </div>
                <div className="op-progress-track">
                  <div className="op-progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredServices.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
