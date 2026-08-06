import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AddServiceModal from '../../../components/Operator/AddServiceModal/AddServiceModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import './operator-dashboard.css';

function DashboardContent() {
  const { data: dbServices, loading } = useOperatorContext();
  const [showAddService, setShowAddService] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredServices = useMemo(() => {
    if (!dbServices) return [];
    return dbServices.filter((s) => {
      const nameStr = (s.clientName || s.name || '').toLowerCase();
      const typeStr = (s.serviceType || s.type || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = nameStr.includes(search) || typeStr.includes(search);
      const matchesPriority =
        priorityFilter === 'all' || (s.priorityType || '').toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesPriority;
    });
  }, [dbServices, searchTerm, priorityFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  return (
    <div className="card op-dashboard page-fade-in">
      <div className="op-dashboard-header">
        <div>
          <h2>Active Services Fulfillment</h2>
          <p>Real-time processing status & step-by-step guided procedures for client services</p>
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
            { value: 'all', label: `All (${(dbServices || []).length})` },
            { value: 'high', label: `High Priority (${(dbServices || []).filter((s) => s.priorityType === 'high').length})` },
            { value: 'normal', label: `Normal Priority (${(dbServices || []).filter((s) => s.priorityType === 'normal').length})` },
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
        {loading ? (
          <div className="empty-state-box"><p>Loading active services...</p></div>
        ) : paginatedServices.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-solid fa-list-check empty-icon"></i>
            <p>No active services match your criteria</p>
          </div>
        ) : (
          paginatedServices.map((s) => {
            const steps = s.steps || [];
            const completedCount = steps.filter((step) => step.status === 'Completed').length;
            const totalSteps = steps.length || s.total || 5;
            const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
            const clientName = s.clientName || s.name || 'Client Service';
            const serviceType = s.serviceType || s.type || 'General Service';
            const priority = s.priority || 'Normal Priority';
            const priorityType = s.priorityType || 'normal';

            return (
              <div key={s.id} className="op-service-card">
                <div className="op-service-card-top">
                  <div className="op-service-meta">
                    <span className="op-service-name">{clientName}</span>
                    <span className="op-service-type">{serviceType}</span>
                    <span className={`op-priority ${priorityType}`}>{priority}</span>
                  </div>
                  <Link to={`/operator/services/${s.id}/procedure`} className="op-view-btn">
                    <i className="fa-regular fa-file-lines"></i>
                    Perform Workflow Procedure
                  </Link>
                </div>

                <p className="op-service-started">
                  Started: {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : s.started || 'Recently'}
                </p>

                <div className="op-progress-row">
                  <span className="op-progress-label">Fulfillment Progress</span>
                  <span className="op-progress-step">
                    {completedCount} of {totalSteps} Steps ({pct}%)
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

export default function OperatorDashboard() {
  return (
    <OperatorProvider targetCollection="activeServices">
      <DashboardContent />
    </OperatorProvider>
  );
}
