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
import ClientEditModal from '../../../components/Admin/Modals/ClientEditModal/ClientEditModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import {
  fetchClients,
  updateClient,
  deleteClient,
  bulkStatusClients,
  bulkDeleteClients
} from '../../../services/adminService';
import useDebounce from '../../../hooks/useDebounce';
import './admin-clients.css';

export default function ClientsContent() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Fetch client list via GET API
  const loadClients = useCallback(() => {
    if (!userToken) return;
    fetchClients(
      userToken,
      (data) => {
        setClients(data || []);
      },
      (error) => {
        console.error('Error fetching clients:', error);
        addToast(error?.message || 'Failed to load client accounts', 'error');
      },
      setLoading
    );
  }, [userToken, addToast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Open Edit Modal
  const handleOpenEditModal = (clientItem) => {
    setEditingClient(clientItem);
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (formData) => {
    if (!editingClient) return;

    updateClient(
      userToken,
      editingClient.id,
      formData,
      () => {
        addToast('Client profile updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingClient(null);
        loadClients();
      },
      (error) => {
        console.error('Error updating client:', error);
        addToast(error?.message || 'Failed to update client', 'error');
      },
      setIsSubmitting
    );
  };

  // Toggle Client Status (Active / Deactivated)
  const handleToggleStatus = (clientItem) => {
    const isCurrentlyActive = clientItem.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Deactivated' : 'Active';

    setConfirmState({
      type: 'status',
      client: clientItem,
      newStatus,
      title: isCurrentlyActive ? 'Deactivate Client Account?' : 'Reactivate Client Account?',
      message: isCurrentlyActive
        ? `Are you sure you want to deactivate ${clientItem.fullName || clientItem.name || 'this client'}? They will be unable to book services or make appointments while deactivated.`
        : `Are you sure you want to reactivate ${clientItem.fullName || clientItem.name || 'this client'}? Their access to customer services will be restored.`,
      confirmLabel: isCurrentlyActive ? 'Deactivate Client' : 'Activate Client',
      confirmIcon: isCurrentlyActive ? 'fa-solid fa-ban' : 'fa-solid fa-check',
      isDanger: isCurrentlyActive
    });
  };

  // Delete Client
  const handleDeletePrompt = (clientItem) => {
    const isPending = clientItem.status === 'Pending' || clientItem.approvalStatus === 'Pending';
    setConfirmState({
      type: 'delete',
      client: clientItem,
      title: isPending ? 'Delete Spam / Pending Account?' : 'Delete Client Account?',
      message: isPending
        ? `Are you sure you want to permanently delete this registration for ${clientItem.fullName || clientItem.name || 'this applicant'} (${clientItem.email})? This will purge both auth credentials and database records to completely remove spam. This action cannot be undone.`
        : `Are you sure you want to permanently delete ${clientItem.fullName || clientItem.name || 'this client'} (${clientItem.email})? This will delete both authentication credentials and account records. This action cannot be undone.`,
      confirmLabel: isPending ? 'Delete Spam Account' : 'Delete Permanently',
      confirmIcon: 'fa-solid fa-trash-can',
      isDanger: true
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;

    if (confirmState.type === 'status') {
      updateClient(
        userToken,
        confirmState.client.id,
        { status: confirmState.newStatus },
        () => {
          addToast(`Client marked as ${confirmState.newStatus}`, 'success');
          setConfirmState(null);
          loadClients();
        },
        (error) => {
          console.error('Error toggling client status:', error);
          addToast(error?.message || 'Failed to update client status', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'delete') {
      deleteClient(
        userToken,
        confirmState.client.id,
        () => {
          addToast('Client account deleted successfully', 'success');
          setConfirmState(null);
          loadClients();
        },
        (error) => {
          console.error('Error deleting client:', error);
          addToast(error?.message || 'Failed to delete client', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'bulk-enable') {
      bulkStatusClients(
        userToken,
        confirmState.ids,
        'Active',
        () => {
          addToast(`${confirmState.ids.length} client(s) activated successfully!`, 'success');
          setSelectedIds([]);
          setConfirmState(null);
          loadClients();
        },
        (error) => {
          console.error('Error bulk activating clients:', error);
          addToast(error?.message || 'Failed to update clients', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'bulk-disable') {
      bulkStatusClients(
        userToken,
        confirmState.ids,
        'Deactivated',
        () => {
          addToast(`${confirmState.ids.length} client(s) deactivated successfully!`, 'success');
          setSelectedIds([]);
          setConfirmState(null);
          loadClients();
        },
        (error) => {
          console.error('Error bulk deactivating clients:', error);
          addToast(error?.message || 'Failed to update clients', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'bulk-delete') {
      bulkDeleteClients(
        userToken,
        confirmState.ids,
        () => {
          addToast(`${confirmState.ids.length} client(s) permanently deleted!`, 'success');
          setSelectedIds([]);
          setConfirmState(null);
          loadClients();
        },
        (error) => {
          console.error('Error bulk deleting clients:', error);
          addToast(error?.message || 'Failed to delete clients', 'error');
        },
        setIsConfirmLoading
      );
    }
  };

  // KPI Calculations
  const totalClients = clients.length;
  const pendingClients = clients.filter((c) => c.status === 'Pending' || c.approvalStatus === 'Pending').length;
  const activeClients = clients.filter((c) => c.status === 'Active' && c.approvalStatus !== 'Pending').length;
  const deactivatedClients = clients.filter((c) => c.status === 'Deactivated').length;
  const rejectedClients = clients.filter((c) => c.status === 'Rejected' || c.approvalStatus === 'Rejected').length;

  // Filter & Search Logic
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search match
      const query = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !query ||
        client.fullName?.toLowerCase().includes(query) ||
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.address?.toLowerCase().includes(query) ||
        client.idType?.toLowerCase().includes(query);

      // Status filter
      const isPending = client.status === 'Pending' || client.approvalStatus === 'Pending';
      const isRejected = client.status === 'Rejected' || client.approvalStatus === 'Rejected';

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'Pending' && isPending) ||
        (statusFilter === 'Active' && client.status === 'Active' && !isPending) ||
        (statusFilter === 'Deactivated' && client.status === 'Deactivated') ||
        (statusFilter === 'Rejected' && isRejected);

      return matchSearch && matchStatus;
    });
  }, [clients, debouncedSearch, statusFilter]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [debouncedSearch, statusFilter, pageSize]);

  // Filter Chips Configuration
  const filterChips = [
    { label: 'All Accounts', value: 'all', count: totalClients },
    { label: 'Pending Approval', value: 'Pending', count: pendingClients },
    { label: 'Active', value: 'Active', count: activeClients },
    { label: 'Deactivated', value: 'Deactivated', count: deactivatedClients },
    ...(rejectedClients > 0 ? [{ label: 'Rejected', value: 'Rejected', count: rejectedClients }] : [])
  ];

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Client Details',
      sortable: true,
      render: (row) => {
        const displayName = row.fullName || row.name || 'Anonymous Client';
        const isDeactivated = row.status === 'Deactivated';
        return (
          <div className="client-user-cell">
            <div className={`client-avatar-bubble ${isDeactivated ? 'deactivated' : ''}`}>
              {getInitials(displayName)}
            </div>
            <div className="client-user-meta">
              <span className="client-user-name">{displayName}</span>
              <span className="client-user-email">{row.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (row) => row.phone || 'N/A'
    },
    {
      key: 'address',
      header: 'Location / Address',
      render: (row) => row.address || 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const isPending = row.status === 'Pending' || row.approvalStatus === 'Pending';
        const isRejected = row.status === 'Rejected' || row.approvalStatus === 'Rejected';

        if (isPending) {
          return (
            <span className="status-pill status-pill--pending">
              <i className="fa-solid fa-clock" style={{ marginRight: '0.35rem', fontSize: '0.75rem' }}></i>
              Pending Review
            </span>
          );
        }
        if (isRejected) {
          return (
            <span className="status-pill status-pill--danger">
              <i className="fa-solid fa-circle-xmark" style={{ marginRight: '0.35rem', fontSize: '0.75rem' }}></i>
              Rejected
            </span>
          );
        }
        return (
          <span className={`status-pill ${row.status === 'Active' ? 'status-pill--active' : 'status-pill--disabled'}`}>
            {row.status || 'Active'}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Registered Date',
      sortable: true,
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : '—'
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'actions-col',
      render: (row) => {
        const isDeactivated = row.status === 'Deactivated';
        const isPending = row.status === 'Pending' || row.approvalStatus === 'Pending';

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
            <Link
              to={`/admin/clients/${row.id}`}
              className="icon-btn view"
              title={isPending ? 'Review ID & Application' : 'View Details'}
              style={isPending ? { borderColor: '#f59e0b', color: '#d97706', backgroundColor: '#fffbeb' } : {}}
            >
              <i className={`fa-solid ${isPending ? 'fa-id-card' : 'fa-eye'}`}></i>
            </Link>
            <button
              type="button"
              className="icon-btn edit"
              title="Edit Client"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleOpenEditModal(row)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              className={`icon-btn ${isDeactivated ? 'check' : 'ban'}`}
              title={isDeactivated ? 'Activate Client' : 'Deactivate Client'}
              disabled={isSubmitting || isConfirmLoading || isPending}
              onClick={() => handleToggleStatus(row)}
            >
              <i className={`fa-solid ${isDeactivated ? 'fa-circle-check' : 'fa-ban'}`}></i>
            </button>
            <button
              type="button"
              className="icon-btn delete"
              title={isPending ? 'Delete / Reject Spam' : 'Delete Client'}
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleDeletePrompt(row)}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        );
      }
    }
  ], [isSubmitting, isConfirmLoading]);

  // Alert Bar message
  const alertBarProps = useMemo(() => {
    if (loading) return { message: 'Loading client records...', type: 'info' };
    if (totalClients === 0) {
      return { message: 'No client accounts have been registered yet.', type: 'info' };
    }
    if (pendingClients > 0) {
      return {
        message: `${pendingClients} client account${pendingClients !== 1 ? 's are' : ' is'} pending government ID verification. Please review their submitted documents to approve access or reject spam accounts.`,
        type: 'warning'
      };
    }
    if (deactivatedClients > 0) {
      return {
        message: `${deactivatedClients} client account${deactivatedClients !== 1 ? 's are' : ' is'} currently deactivated. ${activeClients} of ${totalClients} account${totalClients !== 1 ? 's are' : ' is'} active in good standing.`,
        type: 'warning'
      };
    }
    return {
      message: `All ${totalClients} registered client accounts are active. Client passwords and emails are protected and cannot be modified by administrators.`,
      type: 'success'
    };
  }, [loading, totalClients, pendingClients, activeClients, deactivatedClients]);

  return (
    <div className="admin-clients-page">
      <Breadcrumbs
        items={[
          { label: 'Admin Portal', to: '/admin' },
          { label: 'Client Management', active: true }
        ]}
      />

      <PageHeader
        title="Client Accounts"
        subtitle="Manage customer profiles, contact info, and account access across FairFly"
        badge={`${totalClients} Client${totalClients !== 1 ? 's' : ''}`}
        badgeType="neutral"
      />

      {/* KPI Cards — Horizontal Flex Grid */}
      <div className="services-summary-grid kpi-grid-4">
        <KpiCard
          title="Total Registered Clients"
          value={totalClients}
          detail="Customer accounts registered"
          icon="fa-solid fa-user-group"
          iconColor="#6b21a8"
          badge="All"
          badgeType="neutral"
          isLoading={loading}
        />

        <KpiCard
          title="Pending Verification"
          value={pendingClients}
          detail="Awaiting ID review & approval"
          icon="fa-solid fa-id-card"
          iconColor="#d97706"
          badge={pendingClients > 0 ? `${pendingClients} Pending` : 'All Clear'}
          badgeType={pendingClients > 0 ? 'warn' : 'ok'}
          isLoading={loading}
        />

        <KpiCard
          title="Active Accounts"
          value={activeClients}
          detail="Clients in good standing"
          icon="fa-solid fa-user-check"
          iconColor="#16a34a"
          badge={totalClients > 0 ? `${Math.round((activeClients / totalClients) * 100)}%` : '0%'}
          badgeType="ok"
          isLoading={loading}
        />

        <KpiCard
          title="Deactivated Accounts"
          value={deactivatedClients}
          detail="Suspended or disabled accounts"
          icon="fa-solid fa-user-slash"
          iconColor="#ef4444"
          badge={deactivatedClients > 0 ? `${deactivatedClients} Inactive` : 'None'}
          badgeType={deactivatedClients > 0 ? 'warn' : 'ok'}
          isLoading={loading}
        />
      </div>

      <AlertBar
        type={alertBarProps.type}
        message={alertBarProps.message}
      />

      {/* Table Card */}
      <section className="card clients-table-card">
        {/* Controls: Search & Filters Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            chips={filterChips}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* The Reusable DataTable Component with Bulk Actions */}
        <DataTable
          columns={columns}
          data={paginatedClients}
          selectable={true}
          selectedIds={selectedIds}
          isLoading={loading}
          disabled={isConfirmLoading || isSubmitting}
          onSelectionChange={setSelectedIds}
          onBulkEnable={(ids) =>
            setConfirmState({
              type: 'bulk-enable',
              ids,
              title: `Activate ${ids.length} Client Account${ids.length !== 1 ? 's' : ''}?`,
              message: `Are you sure you want to activate ${ids.length} selected client account${ids.length !== 1 ? 's' : ''}? Access to customer services will be restored.`,
              confirmLabel: 'Activate Accounts',
              confirmIcon: 'fa-solid fa-circle-check',
              isDanger: false
            })
          }
          onBulkDisable={(ids) =>
            setConfirmState({
              type: 'bulk-disable',
              ids,
              title: `Deactivate ${ids.length} Client Account${ids.length !== 1 ? 's' : ''}?`,
              message: `Are you sure you want to deactivate ${ids.length} selected client account${ids.length !== 1 ? 's' : ''}? They will be unable to book services or make appointments while deactivated.`,
              confirmLabel: 'Deactivate Accounts',
              confirmIcon: 'fa-solid fa-ban',
              isDanger: true
            })
          }
          onBulkDelete={(ids) =>
            setConfirmState({
              type: 'bulk-delete',
              ids,
              title: `Delete ${ids.length} Client Account${ids.length !== 1 ? 's' : ''} Permanently?`,
              message: `Are you sure you want to permanently delete ${ids.length} client account${ids.length !== 1 ? 's' : ''}? This will delete both authentication credentials and database records from Firebase Auth and Firestore. This action cannot be undone.`,
              confirmLabel: 'Delete Permanently',
              confirmIcon: 'fa-solid fa-trash-can',
              isDanger: true
            })
          }
          emptyState={{
            icon: 'fa-solid fa-user-slash',
            message: searchTerm || statusFilter !== 'all'
              ? 'No client accounts match your search and filter criteria.'
              : 'No client accounts have been registered yet.'
          }}
        />

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Edit Client Modal */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
        onSubmit={handleEditSubmit}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        confirmIcon={confirmState?.confirmIcon}
        isDanger={confirmState?.isDanger}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
