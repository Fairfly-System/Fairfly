import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AddServiceModal from '../../../components/Operator/AddServiceModal/AddServiceModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import WelcomeHero from '../../../components/UI/WelcomeHero/WelcomeHero';
import './operator-dashboard.css';

function DashboardContent() {
  const { data: dbServices, loading } = useOperatorContext();
  const { user, userDetails } = useAuthContext();
  const [showAddService, setShowAddService] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredServices = useMemo(() => {
    if (!dbServices) return [];

    // Filter by branch operator if role is operator
    let list = dbServices;
    if (user?.uid && userDetails?.role === 'operator') {
      const assigned = dbServices.filter(
        (s) => s.operatorId === user.uid || s.branchUid === user.uid
      );
      if (assigned.length > 0) {
        list = assigned;
      }
    }

    return list.filter((s) => {
      const nameStr = (s.clientName || s.name || '').toLowerCase();
      const typeStr = (s.serviceType || s.type || '').toLowerCase();
      const branchStr = (s.branchName || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = nameStr.includes(search) || typeStr.includes(search) || branchStr.includes(search);
      const matchesPriority =
        priorityFilter === 'all' || (s.priorityType || '').toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesPriority;
    });
  }, [dbServices, user, userDetails, searchTerm, priorityFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  return (
    <main className="operator-dashboard page-fade-in">
      <WelcomeHero
        userName={userDetails?.name || 'Operator'}
        subtitle="Real-time processing status & step-by-step guided procedures for client services"
        illustrationSrc="/pageImages/operator/dashboard.png"
      />

      <section className="card op-dashboard">
        <div className="op-dashboard-header">
          <div>
            <h2>Active Services Fulfillment</h2>
            <p>Real-time processing status & step-by-step guided procedures for client services</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddService(true)}>
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
                <article key={s.id} className="op-service-card">
                  <div className="op-service-card-top">
                    <div className="op-service-meta">
                      <span className="op-service-name">{clientName}</span>
                      <span className="op-service-type">{serviceType}</span>
                      {s.branchName && (
                        <span className="op-service-type" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                          <i className="fa-solid fa-building" style={{ marginRight: '0.3rem' }}></i>
                          {s.branchName}
                        </span>
                      )}
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
                </article>
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
      </section>
    </main>
  );
}

export default function OperatorDashboard() {
  return (
    <OperatorProvider targetCollection="activeServices">
      <DashboardContent />
    </OperatorProvider>
  );
}
