import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router';
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
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin, fetchOperators } from '../../../services/adminService';
import useDebounce from '../../../hooks/useDebounce';
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
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [operatorsMap, setOperatorsMap] = useState({});

  // Fetch operators list for branch mapping
  const loadOperators = useCallback(() => {
    if (!userToken) return;
    fetchOperators(
      userToken,
      (data) => {
        const map = {};
        (data || []).forEach((d) => {
          map[d.id || d.uid] = d;
        });
        setOperatorsMap(map);
      },
      (error) => {
        console.error('Error fetching operators for admins:', error);
      }
    );
  }, [userToken]);

  // Fetch admins list via GET
  const loadAdmins = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchAdmins(
      userToken,
      (data) => {
        setAdmins(data || []);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching admins:', error);
        addToast('Failed to load administrators', 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [userToken, addToast]);

  useEffect(() => {
    loadOperators();
    loadAdmins();
  }, [loadOperators, loadAdmins]);

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (adminItem) => {
    setEditingAdmin(adminItem);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingAdmin) {
      // Update
      updateAdmin(
        userToken,
        editingAdmin.id,
        formData,
        () => {
          addToast('Administrator details updated successfully', 'success');
          setIsModalOpen(false);
          setEditingAdmin(null);
          loadAdmins();
        },
        (err) => {
          addToast(`Failed to update administrator: ${err.message}`, 'error');
        },
        setIsSubmitting
      );
    } else {
      // Create
      createAdmin(
        userToken,
        formData,
        () => {
          addToast('Support administrator created successfully', 'success');
          setIsModalOpen(false);
          setEditingAdmin(null);
          loadAdmins();
        },
        (err) => {
          addToast(`Failed to create administrator: ${err.message}`, 'error');
        },
        setIsSubmitting
      );
    }
  };

  const handleDeactivateAdmin = async (targetAdmin) => {
    if (!targetAdmin) return;
    const newStatus = targetAdmin.status === 'Active' ? 'Inactive' : 'Active';

    updateAdmin(
      userToken,
      targetAdmin.id,
      { status: newStatus },
      () => {
        addToast(`Administrator ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`, 'success');
        setConfirmState(null);
        loadAdmins();
      },
      (err) => {
        addToast(`Failed to update status: ${err.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleDeleteAdmin = async (targetAdmin) => {
    if (!targetAdmin) return;

    deleteAdmin(
      userToken,
      targetAdmin.id,
      () => {
        addToast('Administrator deleted successfully', 'success');
        setConfirmState(null);
        loadAdmins();
      },
      (err) => {
        addToast(`Failed to delete administrator: ${err.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  // Filtered admins with debounced search
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (a.fullName || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || (a.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [admins, debouncedSearch, statusFilter]);

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
        key: 'assignedOperators',
        header: 'Assigned Branches',
        render: (a) => {
          if (a.isSuperAdmin) {
            return (
              <span className="assigned-op-pill all-branches">
                <i className="fa-solid fa-crown" style={{ fontSize: '0.625rem' }}></i> All Branches
              </span>
            );
          }
          const list = a.assignedOperators || [];
          if (list.length === 0) {
            return <span className="assigned-op-pill none">None Assigned</span>;
          }
          if (list.length <= 2) {
            return (
              <div className="assigned-operators-cell">
                {list.map((opId) => {
                  const op = operatorsMap[opId];
                  return (
                    <span key={opId} className="assigned-op-pill">
                      {op?.branchName || op?.name || 'Branch'}
                    </span>
                  );
                })}
              </div>
            );
          }
          const firstOp = operatorsMap[list[0]];
          return (
            <div className="assigned-operators-cell">
              <span className="assigned-op-pill">
                {firstOp?.branchName || firstOp?.name || 'Branch'}
              </span>
              <span className="assigned-op-pill" style={{ background: 'var(--bg)', color: 'var(--text-dark)' }}>
                +{list.length - 1} more
              </span>
            </div>
          );
        }
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
          isLoading={loading}
        />
        <KpiCard
          title="Super Administrators"
          value={superCount}
          icon="fa-solid fa-crown"
          iconColor="#eab308"
          isLoading={loading}
        />
        <KpiCard
          title="Support Administrators"
          value={supportCount}
          icon="fa-solid fa-shield-halved"
          iconColor="var(--complete-green-dark)"
          isLoading={loading}
        />
        <KpiCard
          title="Active Accounts"
          value={activeCount}
          icon="fa-solid fa-circle-check"
          iconColor="var(--complete-green-dark)"
          isLoading={loading}
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
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* DataTable */}
        <DataTable
          data={paginatedAdmins}
          columns={columns}
          selectable={false}
          isLoading={loading}
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
