import React, { useState, useMemo } from "react";
import "./admin-operators.css";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import FilterChipGroup from "../../../components/UI/FilterChipGroup/FilterChipGroup";
import OperatorModal from "../../../components/Admin/Modals/OperatorModal/OperatorModal";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import DataTable from "../../../components/UI/DataTable/DataTable";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;
const CheckIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;

export default function OperatorsContent() {
  const { data: operators, loading: operatorLoading } = useAdminContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
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
      const matchesSearch =
        (op.branchName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && op.status === "Active") ||
        (statusFilter === "disabled" && op.status === "Disabled");

      return matchesSearch && matchesStatus;
    });
  }, [operators, searchTerm, statusFilter]);

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
        header: "Branch Name",
        className: "branch-col",
        render: (op) => (
          <div className="branch-info">
            <div className="branch-avatar">
              <i className="fa-solid fa-building-user"></i>
            </div>
            <span>{op.branchName || "N/A"}</span>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        render: (op) => op.email || "N/A",
      },
      {
        key: "status",
        header: "Status",
        render: (op) => (
          <span
            className={`status-pill ${
              op.status === "Active"
                ? "status-pill-active"
                : "status-pill-disabled"
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
          <>
            <button
              className="icon-btn edit"
              title="Edit Operator"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleOpenEditModal(op)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>

            <button
              className="icon-btn ban"
              title={op.status === "Active" ? "Disable" : "Enable"}
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
              className="icon-btn delete"
              title="Delete"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() =>
                setConfirmState({ type: "delete", operator: op })
              }
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </>
        ),
      },
    ],
    [isSubmitting, isConfirmLoading]
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
        addToast("Failed to create operator: " + error.message, "error");
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
        addToast("Failed to update operator: " + error.message, "error");
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
        addToast("Failed to delete operator: " + error.message, "error");
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
        addToast("Failed to update operator status: " + error.message, "error");
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

  return (
    <div className="card operators-page page-fade-in">
      {/* Page Header */}
      <div className="operators-header">
        <div>
          <h2>Operator Management</h2>
          <p>Create, configure, and monitor franchise operator accounts</p>
        </div>

        <button className="operator-btn" onClick={handleOpenAddModal} disabled={isSubmitting || isConfirmLoading}>
          <i className="fa-solid fa-user-plus"></i>
          Add Operator
        </button>
      </div>

      <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

      {/* Toolbar Filter Row */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search by branch or email..."
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
                setSearchTerm("");
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <FilterChipGroup
          chips={[
            { value: "all", label: `All (${operators.length})` },
            { value: "active", label: `Active (${operators.filter((o) => o.status === "Active").length})` },
            { value: "disabled", label: `Disabled (${operators.filter((o) => o.status === "Disabled").length})` },
          ]}
          activeChip={statusFilter}
          onChipChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Standardized Reusable DataTable */}
      <DataTable
        columns={columns}
        data={paginatedOperators}
        keyField="id"
        selectable={true}
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
    </div>
  );
}
