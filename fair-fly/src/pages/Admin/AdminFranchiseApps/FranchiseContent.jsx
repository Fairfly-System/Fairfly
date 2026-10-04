import './admin-franchise-apps.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import FranchiseCard from '../../../components/Admin/FranchiseeApplication/FranchiseeCard';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { SkeletonCard } from '../../../components/UI/Skeleton/Skeleton';
import ApplicationModal from '../../../components/Admin/Modals/ApplicationModal/ApplicationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import FranchiseApplicationFormBuilderModal from '../../../components/Admin/Modals/FranchiseApplicationFormBuilderModal/FranchiseApplicationFormBuilderModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import useFirestorePagination from '../../../hooks/useFirestorePagination';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';

export default function FranchiseContent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('pending');

  const modalRef = useRef(null);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  // Query-level Firestore filter
  const firestoreFilters = useMemo(() => {
    if (statusFilter && statusFilter !== 'all') {
      return [where('status', '==', statusFilter.toLowerCase())];
    }
    return [];
  }, [statusFilter]);

  // Client search predicate for bounded candidate pool
  const searchFilterFn = useCallback((app) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    const appFullName = app.fullName || [app.firstName, app.middleInitial, app.lastName].filter(Boolean).join(' ').trim();
    return (
      appFullName.toLowerCase().includes(q) ||
      (app.email || '').toLowerCase().includes(q) ||
      (app.preferredBranchLocation || '').toLowerCase().includes(q)
    );
  }, [debouncedSearch]);

  const {
    data: franchiseApplications,
    loading: franchiseLoading,
    currentPage,
    pageSize,
    totalItems,
    setCurrentPage,
    setPageSize,
    refetchCount
  } = useFirestorePagination({
    collectionName: 'franchiseApplications',
    filters: firestoreFilters,
    filterKey: statusFilter,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    searchTerm: debouncedSearch,
    searchFilterFn,
  });

  // KPI server-side aggregations: zero document bodies transferred
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  const fetchKpiCounts = useCallback(async () => {
    try {
      const col = collection(firestore, 'franchiseApplications');
      const [totalSnap, pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
        getCountFromServer(col),
        getCountFromServer(query(col, where('status', '==', 'pending'))),
        getCountFromServer(query(col, where('status', '==', 'approved'))),
        getCountFromServer(query(col, where('status', '==', 'rejected'))),
      ]);
      setCounts({
        total: totalSnap.data().count,
        pending: pendingSnap.data().count,
        approved: approvedSnap.data().count,
        rejected: rejectedSnap.data().count,
      });
    } catch (e) {
      console.warn('[FranchiseContent] KPI count notice:', e.message);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    fetchKpiCounts();
  }, [fetchKpiCounts]);

  async function handleApplicationStatusChange(applicationId, isApproved) {
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications/${applicationId}/status`,
      'PATCH',
      { status: isApproved ? 'approved' : 'rejected' },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Application ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        fetchKpiCounts();
        refetchCount();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Could not update application status. Please try again.'), 'error');
        console.error('Error updating application status:', error);
      },
      setIsLoading
    );
  }

  // ── AlertBar logic ────────────────────────────────────────────────────────
  const alertBarProps = useMemo(() => {
    const { total, pending, approved, rejected } = counts;
    if (total === 0) {
      return { message: 'No franchise applications have been submitted yet.', type: 'info' };
    }
    if (pending > 0) {
      return {
        message: `${pending} application${pending !== 1 ? 's' : ''} awaiting review. ${approved} approved, ${rejected} rejected out of ${total} total.`,
        type: 'warning',
      };
    }
    return {
      message: `All ${total} application${total !== 1 ? 's' : ''} have been reviewed. ${approved} approved, ${rejected} rejected.`,
      type: 'success',
    };
  }, [counts]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Franchise Applications' },
  ];

  const { total: totalApps, pending: pendingCount, approved: approvedCount, rejected: rejectedCount } = counts;

  return (
    <main className="franchise-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Franchise Applications"
        subtitle="Review, approve, and manage submitted franchise partner applications"
        illustrationSrc="/pageImages/admin/franchise-apps.png"
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowFormBuilder(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', borderColor: 'var(--purple, #7c3aed)', color: 'var(--purple, #7c3aed)' }}
        >
          <i className="fa-solid fa-sliders" aria-hidden="true"></i>
          <span>Customize Application Form</span>
        </button>
      </PageHeader>

      <section className="services-summary-grid">
        <KpiCard
          title="Total Applications"
          value={totalApps}
          icon="fa-solid fa-file-signature"
          iconColor="var(--purple)"
          isLoading={franchiseLoading}
        />
        <KpiCard
          title="Pending Review"
          value={pendingCount}
          icon="fa-regular fa-clock"
          iconColor="var(--orange)"
          isLoading={franchiseLoading}
        />
        <KpiCard
          title="Approved"
          value={approvedCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
          isLoading={franchiseLoading}
        />
        <KpiCard
          title="Rejected"
          value={rejectedCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
          isLoading={franchiseLoading}
        />
      </section>

      <section className="card franchise-table-card">
        <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

        {/* Toolbar Filter Row */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search applicant name, email, or location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { label: 'All', value: 'all', count: totalApps },
              { label: 'Pending', value: 'pending', count: pendingCount },
              { label: 'Approved', value: 'approved', count: approvedCount },
              { label: 'Rejected', value: 'rejected', count: rejectedCount },
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Cards Grid */}
        {franchiseLoading ? (
          <div className="franchise-cards-list" aria-busy="true">
            <SkeletonCard count={4} lines={4} hasAvatar={true} />
          </div>
        ) : franchiseApplications.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-solid fa-folder-open empty-icon"></i>
            <p>No franchise applications match your selected filters</p>
          </div>
        ) : (
          <div className="franchise-cards-list">
            {franchiseApplications.map((application) => {
              const appFullName = application.fullName || [application.firstName, application.middleInitial, application.lastName].filter(Boolean).join(' ').trim() || 'Franchise Applicant';
              return (
                <FranchiseCard
                  key={application.id}
                  avatar={`https://placehold.co/400x400/6B6FF5/FFFFFF?text=` + (appFullName || 'F').substring(0, 1).toUpperCase()}
                  name={appFullName}
                  email={application.email}
                  status={(application.status || 'PENDING').toUpperCase()}
                  contactNumber={application.phoneNumber}
                  address={application.preferredBranchLocation}
                  experience={application.businessExperience ? application.businessExperience + ' year(s)' : 'N/A'}
                  investmentCapacity={application.investmentCapacity ? (application.investmentCapacity.startsWith('₱') ? application.investmentCapacity : 'PHP ' + application.investmentCapacity) : 'N/A'}
                  preferredMeetingDate={
                    application.preferredMeetingDate
                      ? new Date(application.preferredMeetingDate).toLocaleDateString()
                      : 'N/A'
                  }
                  additionalMessage={application.additionalMessage}
                  onView={() => navigate(`/admin/franchise-apps/${application.id}`)}
                />
              );
            })}
          </div>
        )}

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      <ApplicationModal
        ref={modalRef}
        isLoading={isLoading}
        handleApprove={handleApplicationStatusChange}
        handleReject={handleApplicationStatusChange}
      />

      <FranchiseApplicationFormBuilderModal
        isOpen={showFormBuilder}
        onClose={() => setShowFormBuilder(false)}
      />
    </main>
  );
}