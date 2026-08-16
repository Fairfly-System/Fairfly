import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Pagination from '../../../components/UI/Pagination/Pagination';
import AdminModal from '../../../components/Admin/Modals/AdminModal/AdminModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './admin-admins.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function AdminsContent() {
  const { userToken, user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
  const { addToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Subscribe to real-time admins list
  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestore, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const d = doc.data();
          const isSuper = d.isSuperAdmin === true || d.email === 'admin@gmail.com';
          return {
            id: doc.id,
            ...d,
            isSuperAdmin: isSuper
          };
        });

        // Sort Super Admin first, then newest
        list.sort((a, b) => {
          if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
          if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setAdmins(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to admins:', error);
        addToast('Failed to load administrators', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [addToast]);

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (adminItem) => {
    setEditingAdmin(adminItem);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);

    if (editingAdmin) {
      // Update
      ApiCaller(
        `${API_BASE_URL}/api/admins/${editingAdmin.id}`,
        'PATCH',
        formData,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast('Administrator details updated successfully', 'success');
          setIsModalOpen(false);
          setEditingAdmin(null);
          setIsSubmitting(false);
        },
        (err) => {
          addToast(`Failed to update administrator: ${err.message}`, 'error');
          setIsSubmitting(false);
        },
        setIsSubmitting
      );
    } else {
      // Create
      ApiCaller(
        `${API_BASE_URL}/api/admins`,
        'POST',
        formData,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast('Support administrator created successfully', 'success');
          setIsModalOpen(false);
          setEditingAdmin(null);
          setIsSubmitting(false);
        },
        (err) => {
          addToast(`Failed to create administrator: ${err.message}`, 'error');
          setIsSubmitting(false);
        },
        setIsSubmitting
      );
    }
  };

  const handleDeactivateAdmin = async (targetAdmin) => {
    if (!targetAdmin) return;
    const newStatus = targetAdmin.status === 'Active' ? 'Inactive' : 'Active';
    setIsConfirmLoading(true);

    ApiCaller(
      `${API_BASE_URL}/api/admins/${targetAdmin.id}`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Administrator ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`, 'success');
        setConfirmState(null);
        setIsConfirmLoading(false);
      },
      (err) => {
        addToast(`Failed to update status: ${err.message}`, 'error');
        setIsConfirmLoading(false);
      },
      setIsConfirmLoading
    );
  };

  const handleDeleteAdmin = async (targetAdmin) => {
    if (!targetAdmin) return;
    setIsConfirmLoading(true);

    ApiCaller(
      `${API_BASE_URL}/api/admins/${targetAdmin.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Administrator deleted successfully', 'success');
        setConfirmState(null);
        setIsConfirmLoading(false);
      },
      (err) => {
        addToast(`Failed to delete administrator: ${err.message}`, 'error');
        setIsConfirmLoading(false);
      },
      setIsConfirmLoading
    );
  };

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (a.fullName || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (a.status || 'Active') === 'Active') ||
        (statusFilter === 'inactive' && (a.status || '') === 'Inactive');

      return matchSearch && matchStatus;
    });
  }, [admins, searchTerm, statusFilter]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAdmins.slice(start, start + pageSize);
  }, [filteredAdmins, currentPage, pageSize]);

  // Statistics
  const totalCount = admins.length;
  const superCount = admins.filter((a) => a.isSuperAdmin).length;
  const supportCount = totalCount - superCount;
  const activeCount = admins.filter((a) => (a.status || 'Active') === 'Active').length;

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Administrators' }
  ];

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Administrator',
        sortable: true,
        render: (a) => (
          <div className="admin-user-cell">
            <div className={`admin-avatar-bubble ${a.isSuperAdmin ? 'admin-avatar-bubble--super' : ''}`}>
              {a.fullName ? a.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-meta">
              <span className="admin-user-name">{a.fullName || a.username || 'Admin User'}</span>
              <span className="admin-user-email">{a.email}</span>
            </div>
          </div>
        )
      },
      {
        key: 'isSuperAdmin',
        header: 'Privilege Level',
        sortable: true,
        render: (a) => (
          a.isSuperAdmin ? (
            <span className="super-admin-badge">
              <i className="fa-solid fa-crown" style={{ color: '#eab308' }}></i>
              Super Admin
            </span>
          ) : (
            <span className="support-admin-badge">
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--purple)' }}></i>
              Support Admin
            </span>
          )
        )
      },
      {
        key: 'phone',
        header: 'Contact Phone',
        render: (a) => a.phone || 'N/A'
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (a) => (
          <span className={`status-pill ${a.status === 'Inactive' ? 'status-pill--disabled' : 'status-pill--active'}`}>
            {a.status || 'Active'}
          </span>
        )
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        sortable: true,
        render: (a) =>
          a.createdAt
            ? new Date(a.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Initial Setup'
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'actions-col',
        render: (a) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
            <Link
              to={`/admin/admins/${a.id}`}
              className="icon-btn view"
              title="View Profile & Audit"
            >
              <i className="fa-solid fa-eye"></i>
            </Link>

            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  className="icon-btn edit"
                  title="Edit Info"
                  onClick={() => handleOpenEditModal(a)}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>

                {!a.isSuperAdmin && (
                  <>
                    <button
                      type="button"
                      className={`icon-btn ${a.status === 'Inactive' ? 'check' : 'ban'}`}
                      title={a.status === 'Inactive' ? 'Enable Administrator' : 'Disable Administrator'}
                      onClick={() => setConfirmState({ type: 'status', admin: a })}
                    >
                      <i className={`fa-solid ${a.status === 'Inactive' ? 'fa-circle-check' : 'fa-ban'}`}></i>
                    </button>

                    <button
                      type="button"
                      className="icon-btn delete"
                      title="Delete Admin"
                      onClick={() => setConfirmState({ type: 'delete', admin: a })}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )
      }
    ],
    [isSuperAdmin]
  );

  return (
    <main className="admin-admins-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Administrator Accounts"
        subtitle="Manage Super Administrator and Support Administrator team accounts"
        illustrationSrc="/pageImages/admin/operators.png"
        primaryAction={
          isSuperAdmin
            ? {
                label: 'Add Administrator',
                icon: 'fa-solid fa-user-shield',
                onClick: handleOpenAddModal
              }
            : null
        }
      />

      {/* KPI Metrics */}
      <section className="services-summary-grid">
        <KpiCard
          title="Total Administrators"
          value={totalCount}
          icon="fa-solid fa-users-gear"
          iconColor="var(--purple)"
        />
        <KpiCard
          title="Super Administrators"
          value={superCount}
          icon="fa-solid fa-crown"
          iconColor="#eab308"
        />
        <KpiCard
          title="Support Administrators"
          value={supportCount}
          icon="fa-solid fa-shield-halved"
          iconColor="var(--complete-green-dark)"
        />
        <KpiCard
          title="Active Accounts"
          value={activeCount}
          icon="fa-solid fa-circle-check"
          iconColor="var(--complete-green-dark)"
        />
      </section>

      <section className="card admins-table-card">
        <AlertBar
          message={`Super Administrators have full system authority. Support Administrators assist branch operators and review client inquiries.`}
          type="info"
        />

        {/* Search & Filter Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              { label: 'All', value: 'all', count: totalCount },
              { label: 'Active', value: 'active', count: activeCount },
              { label: 'Inactive', value: 'inactive', count: totalCount - activeCount }
            ]}
            activeValue={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>

        {/* DataTable */}
        <DataTable
          data={paginatedAdmins}
          columns={columns}
          selectable={false}
          disabled={loading || isConfirmLoading}
          emptyState={{
            icon: 'fa-solid fa-user-slash',
            message: 'No administrator accounts match your criteria'
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredAdmins.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
        }}
        editingAdmin={editingAdmin}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={confirmState?.type === 'delete'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete Administrator?"
        Desc={`"${confirmState?.admin?.fullName || confirmState?.admin?.email}" will lose all administrative privileges permanently.`}
        BtnColor="var(--error-red)"
        confirmText="Delete Administrator"
        isLoading={isConfirmLoading}
        OnConfirm={() => handleDeleteAdmin(confirmState?.admin)}
      />

      <ConfirmationModal
        isOpen={confirmState?.type === 'status'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={BanIcon}
        Title={confirmState?.admin?.status === 'Active' ? 'Disable Administrator?' : 'Enable Administrator?'}
        Desc={
          confirmState?.admin?.status === 'Active'
            ? `"${confirmState?.admin?.fullName || confirmState?.admin?.email}" will be temporarily barred from accessing the Admin Portal.`
            : `"${confirmState?.admin?.fullName || confirmState?.admin?.email}" will regain administrative access.`
        }
        BtnColor="var(--orange)"
        confirmText={confirmState?.admin?.status === 'Active' ? 'Disable Account' : 'Enable Account'}
        isLoading={isConfirmLoading}
        OnConfirm={() => handleDeactivateAdmin(confirmState?.admin)}
      />
    </main>
  );
}
