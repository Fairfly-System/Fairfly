import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import AddServiceModal from '../../../components/Operator/AddServiceModal/AddServiceModal';
import QualificationApplicationModal from '../../../components/Operator/QualificationApplicationModal/QualificationApplicationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import WelcomeHero from '../../../components/UI/WelcomeHero/WelcomeHero';
import useDebounce from '../../../hooks/useDebounce';
import './operator-dashboard.css';

function DashboardContent() {
  const { data: dbServices, loading } = useOperatorContext();
  const { user, userDetails } = useAuthContext();
  const navigate = useNavigate();
  const [showAddService, setShowAddService] = useState(false);
  const [showQualModal, setShowQualModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Assigned Support Lead state
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchAssignedAdmin = async () => {
      setLoadingAdmin(true);
      try {
        const q = query(
          collection(firestore, 'users'),
          where('role', '==', 'admin'),
          where('assignedOperators', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setAssignedAdmin({ id: snapshot.docs[0].id, ...docData });
        } else {
          // Check if the operator already has an ongoing conversation with an admin
          const convQ = query(
            collection(firestore, 'conversations'),
            where('participants', 'array-contains', user.uid)
          );
          const convSnap = await getDocs(convQ);
          const adminConv = convSnap.docs.find((d) => {
            const data = d.data();
            const roles = data.participantRoles || {};
            return Object.entries(roles).some(([uid, role]) => uid !== user.uid && role === 'admin');
          });

          if (adminConv) {
            const data = adminConv.data();
            const adminId = data.participants?.find((p) => p !== user.uid);
            const adminDetail = data.participantDetails?.[adminId];
            if (adminId && adminDetail) {
              setAssignedAdmin({
                id: adminId,
                ...adminDetail
              });
              return;
            }
          }

          // Fallback to central super admin
          const fallbackQuery = query(
            collection(firestore, 'users'),
            where('role', '==', 'admin')
          );
          const allAdminsSnap = await getDocs(fallbackQuery);
          const superAdminDoc = allAdminsSnap.docs.find(
            (d) => d.data()?.isSuperAdmin || d.data()?.email === 'admin@gmail.com'
          ) || allAdminsSnap.docs[0];
          if (superAdminDoc) {
            setAssignedAdmin({ id: superAdminDoc.id, ...superAdminDoc.data() });
          }
        }
      } catch (err) {
        console.error('Error fetching assigned admin support lead:', err);
      } finally {
        setLoadingAdmin(false);
      }
    };

    fetchAssignedAdmin();
  }, [user?.uid]);

  const handleMessageSupportLead = () => {
    if (assignedAdmin?.id) {
      navigate('/operator/messages', {
        state: {
          partnerId: assignedAdmin.id,
          partnerName: assignedAdmin.fullName || assignedAdmin.name || assignedAdmin.username || 'Admin Support',
          partnerRole: 'admin',
        }
      });
    } else {
      navigate('/operator/messages');
    }
  };

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
      const search = debouncedSearch.toLowerCase();

      const matchesSearch = nameStr.includes(search) || typeStr.includes(search) || branchStr.includes(search);
      const matchesPriority =
        priorityFilter === 'all' || (s.priorityType || '').toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesPriority;
    });
  }, [dbServices, user, userDetails, debouncedSearch, priorityFilter]);

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

      {/* Qualification Status / Callout Banner */}
      <section
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          background: userDetails?.isQualified
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(167, 139, 250, 0.04) 100%)'
            : 'var(--bg-card, #ffffff)',
          border: `1px solid ${userDetails?.isQualified ? '#ddd6fe' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: userDetails?.isQualified ? 'var(--purple-soft, #ede9fe)' : 'var(--bg, #f1f5f9)',
              color: userDetails?.isQualified ? 'var(--purple, #7c3aed)' : 'var(--text-mid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0
            }}
          >
            <i className={`fa-solid ${userDetails?.isQualified ? 'fa-certificate' : 'fa-award'}`}></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                {userDetails?.isQualified ? 'Qualified Operator Account' : 'Become a Qualified Operator'}
              </h4>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: userDetails?.isQualified ? 'var(--purple)' : 'var(--bg-muted, #e2e8f0)',
                  color: userDetails?.isQualified ? '#ffffff' : 'var(--text-mid)'
                }}
              >
                {userDetails?.isQualified ? 'Active Privilege' : 'Standard'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
              {userDetails?.isQualified
                ? 'Your branch is verified to create and publish branch-exclusive services to the Client Marketplace.'
                : 'Apply for qualification to offer custom travel packages, set branch fees, and receive direct client orders.'}
            </p>
          </div>
        </div>

        <div>
          {userDetails?.isQualified ? (
            <Link
              to="/operator/services"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              <i className="fa-solid fa-list-check"></i> Manage Branch Services
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowQualModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--purple)', fontSize: '0.875rem' }}
            >
              <i className="fa-solid fa-paper-plane"></i> Apply for Qualification
            </button>
          )}
        </div>
      </section>

      {/* Assigned Support Lead Banner */}
      <section className="card op-support-lead-card">
        <div className="op-support-lead-left">
          <div className="op-support-avatar">
            <i className="fa-solid fa-headset"></i>
          </div>
          <div className="op-support-info">
            <div className="op-support-title-row">
              <span className="op-support-badge">
                <i className="fa-solid fa-shield-halved"></i> Dedicated Support Contact
              </span>
              <span className="op-support-role">Head Office Support</span>
            </div>
            <h3 className="op-support-name">
              {assignedAdmin ? (assignedAdmin.fullName || assignedAdmin.name || assignedAdmin.username || 'Assigned Admin Lead') : 'FairFly Central Administration'}
            </h3>
            <div className="op-support-contacts">
              <span className="op-support-contact-item">
                <i className="fa-solid fa-envelope"></i> {assignedAdmin?.email || 'admin@fairfly.ph'}
              </span>
              {assignedAdmin?.phone && (
                <span className="op-support-contact-item">
                  <i className="fa-solid fa-phone"></i> {assignedAdmin.phone}
                </span>
              )}
              <span className="op-support-status">
                <span className="status-dot-online"></span> Active Branch Liaison
              </span>
            </div>
          </div>
        </div>
        <div className="op-support-lead-actions">
          <button
            type="button"
            className="btn-primary op-message-lead-btn"
            onClick={handleMessageSupportLead}
          >
            <i className="fa-regular fa-comment-dots"></i>
            <span>Message Support Lead</span>
          </button>
        </div>
      </section>

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
                    <Link to={`/operator/services/${s.id}/procedure`} className="op-perform-procedure-btn">
                      <i className="fa-solid fa-play"></i>
                      <span>Perform Workflow Procedure</span>
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

      {/* Qualification Application Modal */}
      <QualificationApplicationModal
        isOpen={showQualModal}
        onClose={() => setShowQualModal(false)}
      />
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
