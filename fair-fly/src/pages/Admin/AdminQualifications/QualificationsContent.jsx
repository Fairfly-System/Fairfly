import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import useFirestorePagination from '../../../hooks/useFirestorePagination';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './admin-qualifications.css';

export default function QualificationsContent() {
  const navigate = useNavigate();
  const { userToken, userDetails, user } = useAuthContext();
  const { addToast } = useToast();

  const isSuperAdmin =
    userDetails?.isSuperAdmin === true ||
    userDetails?.email === 'admin@gmail.com' ||
    user?.email === 'admin@gmail.com';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const q = debouncedSearch.toLowerCase().trim();
    return (
      (app.branchName || '').toLowerCase().includes(q) ||
      (app.operatorName || '').toLowerCase().includes(q) ||
      (app.email || '').toLowerCase().includes(q) ||
      (app.reason || '').toLowerCase().includes(q)
    );
  }, [debouncedSearch]);

  const {
    data: applications,
    loading,
    currentPage,
    pageSize,
    totalItems,
    setCurrentPage,
    setPageSize,
    refetchCount
  } = useFirestorePagination({
    collectionName: 'qualificationApplications',
    filters: firestoreFilters,
    filterKey: statusFilter,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    initialPageSize: 8,
    searchTerm: debouncedSearch,
    searchFilterFn,
  });

  // KPI stats via zero-document server aggregations
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  const fetchKpiCounts = useCallback(async () => {
    try {
      const col = collection(firestore, 'qualificationApplications');
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
      console.warn('[QualificationsContent] Count notice:', e.message);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    fetchKpiCounts();
  }, [fetchKpiCounts]);

  const { total: totalApps, pending: pendingCount, approved: approvedCount, rejected: rejectedCount } = counts;

  const handleReviewSubmit = async (app, status) => {
    if (!app) return;

    ApiCaller(
      `${API_BASE_URL}/api/qualifications/${app.id}/review`,
      'PATCH',
      { status, adminNotes: app.adminNotes || '' },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(
          `Qualification application for ${app.branchName || 'Operator'} ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
          status === 'approved' ? 'success' : 'info'
        );
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update qualification application status.'), 'error');
      },
      setIsSubmitting
    );
  };

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: 'branchName',
        header: 'Branch & Operator',
        sortable: true,
        render: (app) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-dark)' }}>{app.branchName || 'Branch Operator'}</strong>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-mid)'
                }}
              >
                {app.operatorName || 'Operator'}
              </span>
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
              {app.email || 'N/A'} {app.contactNumber ? `• ${app.contactNumber}` : ''}
            </span>
          </div>
        )
      },
      {
        key: 'reason',
        header: 'Application Reason / Experience',
        render: (app) => (
          <div style={{ maxWidth: '20rem' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--text-mid)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
              title={app.reason}
            >
              {app.reason || 'No justification provided'}
            </p>
          </div>
        )
      },
      {
        key: 'documents',
        header: 'Documents',
        render: (app) => {
          const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-xs, 0.25rem)',
                background: docCount > 0 ? 'var(--purple-light-2, #f5f3ff)' : 'var(--bg, #f8fafc)',
                color: docCount > 0 ? 'var(--purple, #7c3aed)' : 'var(--text-light, #94a3b8)',
                border: `1px solid ${docCount > 0 ? '#ddd6fe' : 'var(--border-color, #e2e8f0)'}`
              }}
              title={`${docCount} uploaded document${docCount !== 1 ? 's' : ''}`}
            >
              <i className="fa-solid fa-paperclip"></i>
              {docCount} {docCount === 1 ? 'file' : 'files'}
            </span>
          );
        }
      },
      {
        key: 'createdAt',
        header: 'Date Submitted',
        sortable: true,
        render: (app) => {
          if (!app.createdAt) return 'N/A';
          try {
            return new Date(app.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch {
            return app.createdAt;
          }
        }
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (app) => {
          const status = (app.status || 'pending').toLowerCase();
          let pillClass = 'status-pill status-pill-pending';
          if (status === 'approved') pillClass = 'status-pill status-pill-active';
          if (status === 'rejected') pillClass = 'status-pill status-pill-disabled';

          return (
            <span className={pillClass} style={{ textTransform: 'capitalize' }}>
              {status}
            </span>
          );
        }
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (app) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
            <button
              type="button"
              className="icon-btn view"
              title="View Application Details"
              onClick={() => {
                navigate(`/admin/qualifications/${app.id}`);
              }}
            >
              <i className="fa-solid fa-eye"></i>
            </button>
            {isSuperAdmin && app.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="icon-btn check"
                  title="Quick Approve"
                  onClick={() => handleReviewSubmit(app, 'approved')}
                  disabled={isSubmitting}
                >
                  <i className="fa-solid fa-circle-check"></i>
                </button>
                <button
                  type="button"
                  className="icon-btn ban"
                  title="Quick Reject"
                  onClick={() => handleReviewSubmit(app, 'rejected')}
                  disabled={isSubmitting}
                >
                  <i className="fa-solid fa-ban"></i>
                </button>
              </>
            )}
          </div>
        )
      }
    ],
    [isSuperAdmin, isSubmitting, navigate]
  );

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Qualifications' }
  ];

  return (
    <main className="admin-qualifications-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Operator Qualification Applications"
        subtitle="Review qualification requests allowing branch operators to publish custom branch-exclusive services"
        illustrationSrc="/pageImages/admin/operators.png"
      />

      {/* KPI Section */}
      <section className="services-summary-grid">
        <KpiCard
          title="Total Applications"
          value={totalApps}
          icon="fa-solid fa-clipboard-list"
          iconColor="var(--purple)"
          isLoading={loading}
        />
        <KpiCard
          title="Pending Review"
          value={pendingCount}
          icon="fa-regular fa-clock"
          iconColor="var(--warning-yellow)"
          isLoading={loading}
        />
        <KpiCard
          title="Approved"
          value={approvedCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
          isLoading={loading}
        />
        <KpiCard
          title="Rejected"
          value={rejectedCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
          isLoading={loading}
        />
      </section>

      <section className="card qualifications-table-card">
        {pendingCount > 0 && (
          <AlertBar
            message={`${pendingCount} qualification request${pendingCount !== 1 ? 's' : ''} awaiting review. Approved operators gain custom service creation privileges.`}
            type="warning"
          />
        )}

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by branch name, operator, or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
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
              { label: 'Rejected', value: 'rejected', count: rejectedCount }
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Table */}
        <DataTable
          data={applications}
          columns={columns}
          isLoading={loading}
          emptyState={{
            icon: 'fa-solid fa-user-check',
            message: 'No qualification applications match your criteria'
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>
    </main>
  );
}

