import './admin-franchise-apps.css';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import FranchiseCard from '../../../components/Admin/FranchiseeApplication/FranchiseeCard';
import { useState, useRef, useMemo } from 'react';
import Loader from '../../../components/Admin/Loader/Loader';
import ApplicationModal from '../../../components/Admin/Modals/ApplicationModal/ApplicationModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { useAdminContext } from '../../../context/AdminContext';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';

export default function FranchiseContent() {
  const { data: franchiseApplications, loading: franchiseLoading } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const modalRef = useRef(null);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  async function handleApplicationStatusChange(applicationId, isApproved) {
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications/${applicationId}/status`,
      'PATCH',
      { status: isApproved ? 'approved' : 'rejected' },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Application ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
      },
      (error) => {
        addToast(`Failed to update application status: ${error.message}`, 'error');
        console.error('Error updating application status:', error);
      },
      setIsLoading
    );
  }

  // Filtered applications
  const filteredApplications = useMemo(() => {
    if (!franchiseApplications) return [];
    return franchiseApplications.filter((app) => {
      const matchesSearch =
        (app.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.preferredBranchLocation || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (app.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [franchiseApplications, searchTerm, statusFilter]);

  // Paginated slice
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // ── AlertBar logic ────────────────────────────────────────────────────────
  const alertBarProps = useMemo(() => {
    const total    = franchiseApplications.length;
    const pending  = franchiseApplications.filter(a => a.status === 'pending').length;
    const approved = franchiseApplications.filter(a => a.status === 'approved').length;
    const rejected = franchiseApplications.filter(a => a.status === 'rejected').length;

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
  }, [franchiseApplications]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Franchise Applications' },
  ];

  const totalApps = Array.isArray(franchiseApplications) ? franchiseApplications.length : 0;
  const pendingCount = Array.isArray(franchiseApplications) ? franchiseApplications.filter((a) => a.status === 'pending').length : 0;
  const approvedCount = Array.isArray(franchiseApplications) ? franchiseApplications.filter((a) => a.status === 'approved').length : 0;
  const rejectedCount = Array.isArray(franchiseApplications) ? franchiseApplications.filter((a) => a.status === 'rejected').length : 0;

  return (
    <main className="franchise-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Franchise Applications"
        subtitle="Review, approve, and manage submitted franchise partner applications"
        illustrationSrc="/pageImages/admin/franchise-apps.png"
      />

      <section className="services-summary-grid">
        <KpiCard
          title="Total Applications"
          value={totalApps}
          icon="fa-solid fa-file-signature"
          iconColor="var(--purple)"
        />
        <KpiCard
          title="Pending Review"
          value={pendingCount}
          icon="fa-regular fa-clock"
          iconColor="var(--orange)"
        />
        <KpiCard
          title="Approved"
          value={approvedCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
        />
        <KpiCard
          title="Rejected"
          value={rejectedCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
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
              { value: 'pending', label: `Pending (${pendingCount})` },
              { value: 'approved', label: `Approved (${approvedCount})` },
              { value: 'rejected', label: `Rejected (${rejectedCount})` },
              { value: 'all', label: `All (${totalApps})` },
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
          <Loader text="Loading franchise applications..." />
        ) : paginatedApplications.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-solid fa-folder-open empty-icon"></i>
            <p>No franchise applications match your selected filters</p>
          </div>
        ) : (
          <div className="franchise-cards-list">
            {paginatedApplications.map((application) => (
              <FranchiseCard
                key={application.id}
                avatar={`https://placehold.co/400x400/6B6FF5/FFFFFF?text=` + (application.fullName || 'F').substring(0, 1).toUpperCase()}
                name={application.fullName}
                email={application.email}
                status={(application.status || 'PENDING').toUpperCase()}
                contactNumber={application.phoneNumber}
                address={application.preferredBranchLocation}
                experience={application.businessExperience + ' year(s)'}
                investmentCapacity={'PHP ' + application.investmentCapacity}
                preferredMeetingDate={
                  application.preferredMeetingDate
                    ? new Date(application.preferredMeetingDate).toLocaleDateString()
                    : 'N/A'
                }
                additionalMessage={application.additionalMessage}
                onView={() => modalRef.current.openModal(application)}
              />
            ))}
          </div>
        )}

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredApplications.length}
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
    </main>
  );
}