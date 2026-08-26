import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import "./admin-operators.css";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import FilterChipGroup from "../../../components/UI/FilterChipGroup/FilterChipGroup";
import OperatorModal from "../../../components/Admin/Modals/OperatorModal/OperatorModal";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import DataTable from "../../../components/UI/DataTable/DataTable";
import PageHeader from "../../../components/UI/PageHeader/PageHeader";
import Breadcrumbs from "../../../components/UI/Breadcrumbs/Breadcrumbs";
import KpiCard from "../../../components/UI/KpiCard/KpiCard";
import { createOperator, updateOperator, deleteOperator } from "../../../services/adminService";
import useDebounce from "../../../hooks/useDebounce";
import toFriendlyMessage from "../../../utils/friendlyErrors";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;
const CheckIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;

export default function OperatorsContent() {
  console.log('[OperatorsContent] Rendering list view');
  const { data: operators, loading: operatorLoading } = useAdminContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const { userToken, user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
  const assignedOperators = useMemo(() => userDetails?.assignedOperators || [], [userDetails]);
  const [assignmentScope, setAssignmentScope] = useState('all'); // 'all' | 'assigned'
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const handleOpenAddModal = () => {
    setEditingOperator(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (operator) => {
    setEditingOperator(operator);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingOperator(null);
  };

  // Filtered operators
  const filteredOperators = useMemo(() => {
    if (!operators) return [];
    return operators.filter((op) => {
      // Assignment scope filter
      if (assignmentScope === 'assigned' && assignedOperators.length > 0) {
        if (!assignedOperators.includes(op.id)) {
          return false;
        }
      }

      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (op.branchName || "").toLowerCase().includes(q) ||
        (op.email || "").toLowerCase().includes(q) ||
        (op.address || "").toLowerCase().includes(q);
      
      const opStatus = (op.status || "Active").toLowerCase();
      const filter = (statusFilter || "all").toLowerCase();
      const matchesStatus = filter === "all" || opStatus === filter;

      return matchesSearch && matchesStatus;
    });
  }, [operators, debouncedSearch, statusFilter, assignmentScope, assignedOperators]);

  // Paginated operators slice
  const paginatedOperators = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOperators.slice(start, start + pageSize);
  }, [filteredOperators, currentPage, pageSize]);

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: "branchName",
        header: "Operator / Branch",
        sortable: true,
        render: (op) => {
          const isAssignedToMe = assignedOperators.includes(op.id);
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: "var(--text-dark)" }}>
                  {op.branchName}
                </span>
                {isAssignedToMe && (
                  <span
                    style={{
                      background: 'var(--purple-light-2)',
                      color: 'var(--purple-dark)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.125rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    title="You are assigned as the direct support lead for this branch"
                  >
                    <i className="fa-solid fa-shield-halved" style={{ fontSize: '0.625rem' }}></i> Assigned to You
                  </span>
                )}
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "var(--text-light)",
                }}
              >
                {op.email}
              </span>
            </div>
          );
        },
      },
      {
        key: "address",
        header: "Location",
        sortable: true,
        render: (op) => op.address || "N/A",
      },
      {
        key: "contactNumber",
        header: "Contact",
        render: (op) => op.contactNumber || "N/A",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (op) => (
          <span
            className={`status-pill ${
              op.status === "Active" ? "status-pill--active" : "status-pill--disabled"
            }`}
          >
            {op.status || "Active"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "actions-col",
        render: (op) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
            <Link
              to={`/admin/operators/${op.id}`}
              className="icon-btn view"
              title="View Details"
            >
              <i className="fa-solid fa-eye"></i>
            </Link>

            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  className="icon-btn edit"
                  title="Edit Operator"
                  disabled={isSubmitting || isConfirmLoading}
                  onClick={() => handleOpenEditModal(op)}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>

                <button
                  type="button"
                  className={`icon-btn ${op.status === "Active" ? "ban" : "check"}`}
                  title={op.status === "Active" ? "Disable Operator" : "Enable Operator"}
                  disabled={isSubmitting || isConfirmLoading}
                  onClick={() =>
                    setConfirmState({ type: "deactivate", operator: op })
                  }
                >
                  <i
                    className={`fa-solid ${
                      op.status === "Active" ? "fa-ban" : "fa-circle-check"
                    }`}
                  ></i>
                </button>
                <button
                  type="button"
                  className="icon-btn delete"
                  title="Delete Operator"
                  disabled={isSubmitting || isConfirmLoading}
                  onClick={() =>
                    setConfirmState({ type: "delete", operator: op })
                  }
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [isSubmitting, isConfirmLoading, isSuperAdmin]
  );

  // AlertBar logic
  const alertBarProps = useMemo(() => {
    if (!operators) return { message: 'Loading...', type: 'info' };
    const total    = operators.length;
    const active   = operators.filter(o => o.status === 'Active').length;
    const disabled = operators.filter(o => o.status === 'Disabled').length;

    if (total === 0) {
      return { message: 'No operator accounts yet. Create the first franchise branch to get started.', type: 'info' };
    }
    if (disabled > 0) {
      return {
        message: `${disabled} operator account${disabled !== 1 ? 's' : ''} ${disabled !== 1 ? 'are' : 'is'} currently disabled. ${active} of ${total} branch${total !== 1 ? 'es are' : ' is'} active.`,
        type: 'warning',
      };
    }
    return {
      message: `All ${total} operator account${total !== 1 ? 's' : ''} are active across ${total} franchise branch${total !== 1 ? 'es' : ''}.`,
      type: 'success',
    };
  }, [operators]);

  // Submit forms (Create/Edit)
  const handleFormSubmit = async (operatorData) => {
    if (editingOperator) {
      await handleEditOperatorSubmit(operatorData);
    } else {
      await handleCreateOperatorSubmit(operatorData);
    }
  };

  const handleCreateOperatorSubmit = async (newOperatorData) => {
    return ApiCaller(
      `${API_BASE_URL}/api/operators`,
      "POST",
      newOperatorData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator created successfully!", "success");
        setIsModalOpen(false);
        setEditingOperator(null);
      },
      (error) => {
        console.error("Error creating operator:", error);
        addToast(toFriendlyMessage(error, "Failed to create operator branch account."), "error");
      },
      setIsSubmitting
    );
  };

  const handleEditOperatorSubmit = async (updatedOperatorData) => {
    const { email, ...dataToUpdate } = updatedOperatorData;
    return ApiCaller(
      `${API_BASE_URL}/api/operators/${editingOperator.id}`,
      "PATCH",
      dataToUpdate,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator updated successfully!", "success");
        setIsModalOpen(false);
        setEditingOperator(null);
      },
      (error) => {
        console.error("Error updating operator:", error);
        addToast(toFriendlyMessage(error, "Failed to update operator details."), "error");
      },
      setIsSubmitting
    );
  };

  const handleDeleteOperator = async (operatorId) => {
    return ApiCaller(
      `${API_BASE_URL}/api/operators/${operatorId}`,
      "DELETE",
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator deleted successfully!", "success");
        setConfirmState(null);
      },
      (error) => {
        console.error("Error deleting operator:", error);
        addToast(toFriendlyMessage(error, "Failed to delete operator."), "error");
      },
      setIsConfirmLoading
    );
  };

  const handleDeactivateOperator = async (operator) => {
    const newStatus = operator.status === "Active" ? "Disabled" : "Active";
    return ApiCaller(
      `${API_BASE_URL}/api/operators/${operator.id}`,
      "PATCH",
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Operator ${newStatus === "Active" ? "enabled" : "disabled"} successfully!`, "success");
        setConfirmState(null);
      },
      (error) => {
        console.error("Error updating operator status:", error);
        addToast(toFriendlyMessage(error, "Failed to update operator status."), "error");
      },
      setIsConfirmLoading
    );
  };

  const handleBulkStatusChange = async (ids, newStatus) => {
    return ApiCaller(
      `${API_BASE_URL}/api/operators/bulk-status`,
      "POST",
      { ids, status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`${ids.length} operator(s) ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully!`, "success");
        setSelectedIds([]);
        setConfirmState(null);
      },
      (error) => {
        console.error("Error bulk updating operators:", error);
        addToast(`Failed to update operators: ${error.message}`, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleBulkDelete = async (ids) => {
    return ApiCaller(
      `${API_BASE_URL}/api/operators/bulk-delete`,
      "POST",
      { ids },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`${ids.length} operator(s) deleted successfully!`, "success");
        setSelectedIds([]);
        setConfirmState(null);
      },
      (error) => {
        console.error("Error bulk deleting operators:", error);
        addToast(`Failed to delete operators: ${error.message}`, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    if (confirmState.type === "delete") {
      await handleDeleteOperator(confirmState.operator.id);
    } else if (confirmState.type === "deactivate") {
      await handleDeactivateOperator(confirmState.operator);
    } else if (confirmState.type === "bulk-enable") {
      await handleBulkStatusChange(confirmState.ids, "Active");
    } else if (confirmState.type === "bulk-disable") {
      await handleBulkStatusChange(confirmState.ids, "Disabled");
    } else if (confirmState.type === "bulk-delete") {
      await handleBulkDelete(confirmState.ids);
    }
  };

  // Early loading return AFTER all hooks are declared
  if (operatorLoading) {
    return (
      <div className="card operators-page page-fade-in">
        <div className="operators-header">
          <div>
            <h2>Operator Accounts</h2>
            <p>Loading operator records...</p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Operators" },
  ];

  const totalOperators = Array.isArray(operators) ? operators.length : 0;
  const activeCount = useMemo(
    () => (operators ? operators.filter((op) => op.status === "Active").length : 0),
    [operators]
  );
  const inactiveCount = useMemo(
    () => (operators ? operators.filter((op) => op.status === "Disabled").length : 0),
    [operators]
  );
  const assignedOperatorsCount = useMemo(
    () => (Array.isArray(operators) && assignedOperators.length > 0 ? operators.filter((op) => assignedOperators.includes(op.id)).length : 0),
    [operators, assignedOperators]
  );

  return (
    <main className="operators-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Branch Operators & Franchises"
        subtitle="Manage branch locations, operator credentials, and operational status"
        illustrationSrc="/pageImages/admin/operators.png"
        primaryAction={
          isSuperAdmin
            ? {
                label: "Add Operator",
                icon: "fa-solid fa-plus",
                onClick: handleOpenAddModal,
              }
            : undefined
        }
      />

      {/* KPI Cards Row */}
      <section className="kpi-grid-4">
        <KpiCard
          title="Total Operators"
          value={totalOperators}
          icon="fa-solid fa-building-user"
          iconColor="var(--purple)"
        />
        <KpiCard
          title="Active"
          value={activeCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
        />
        <KpiCard
          title="Disabled"
          value={inactiveCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
        />
        <KpiCard
          title="My Assigned"
          value={assignedOperatorsCount}
          icon="fa-solid fa-user-check"
          iconColor="var(--blue)"
        />
      </section>

      <section className="card operators-table-card">
        <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

        {/* Scope Filter for Admins with Assigned Operators */}
        {assignedOperators.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fa-solid fa-filter" style={{ color: 'var(--purple)' }}></i> Operator View Scope:
            </span>
            <FilterChipGroup
              chips={[
                { label: "All Branch Operators", value: "all", count: totalOperators },
                { label: "My Assigned Branches", value: "assigned", count: assignedOperatorsCount },
              ]}
              activeChip={assignmentScope}
              onChipChange={(val) => {
                setAssignmentScope(val);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* Toolbar Filter Row */}
        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by branch name, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { label: "All", value: "all", count: totalOperators },
              { label: "Active", value: "active", count: activeCount },
              { label: "Disabled", value: "disabled", count: inactiveCount },
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* The Reusable DataTable Component */}
        <DataTable
          data={paginatedOperators}
          columns={columns}
          selectable={isSuperAdmin}
          selectedIds={selectedIds}
          disabled={isConfirmLoading || isSubmitting}
          onSelectionChange={setSelectedIds}
          onBulkEnable={(ids) => setConfirmState({ type: "bulk-enable", ids })}
          onBulkDisable={(ids) => setConfirmState({ type: "bulk-disable", ids })}
          onBulkDelete={(ids) => setConfirmState({ type: "bulk-delete", ids })}
          emptyState={{
            icon: "fa-solid fa-user-slash",
            message: "No operators match your criteria",
          }}
        />

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOperators.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
      </section>

      {/* Render the Operator Modal */}
      <OperatorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingOperator={editingOperator}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Single Delete confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "delete"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete this operator?"
        Desc={`"${confirmState?.operator?.branchName}" will be permanently removed. This action can't be undone.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Single Deactivate/Activate confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "deactivate"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={BanIcon}
        Title={
          confirmState?.operator?.status === "Active"
            ? "Disable this operator?"
            : "Enable this operator?"
        }
        Desc={
          confirmState?.operator?.status === "Active"
            ? `"${confirmState?.operator?.branchName}" will lose access until re-enabled.`
            : `"${confirmState?.operator?.branchName}" will regain access.`
        }
        BtnColor="var(--orange)"
        confirmText={
          confirmState?.operator?.status === "Active" ? "Disable" : "Enable"
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Bulk Delete confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "bulk-delete"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title={`Delete ${confirmState?.ids?.length || 0} selected operators?`}
        Desc={`${confirmState?.ids?.length || 0} operator accounts will be permanently removed. This action can't be undone.`}
        BtnColor="var(--error-red)"
        confirmText="Delete Selected"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Bulk Enable confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "bulk-enable"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={CheckIcon}
        Title={`Enable ${confirmState?.ids?.length || 0} selected operators?`}
        Desc={`${confirmState?.ids?.length || 0} operator accounts will regain access.`}
        BtnColor="var(--purple)"
        confirmText="Enable Selected"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Bulk Disable confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "bulk-disable"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={BanIcon}
        Title={`Disable ${confirmState?.ids?.length || 0} selected operators?`}
        Desc={`${confirmState?.ids?.length || 0} operator accounts will lose access until re-enabled.`}
        BtnColor="var(--orange)"
        confirmText="Disable Selected"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </main>
  );
}
