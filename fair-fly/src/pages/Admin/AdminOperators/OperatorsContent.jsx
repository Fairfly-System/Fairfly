import React, { useState, useMemo } from "react";
import "./admin-operators.css";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import ModalWrapper from "../../../components/Admin/Modals/ModalWrapper";
import OperatorForm from "../../../components/Admin/Modals/OperatorForm";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Confirmation modal state: { type: 'delete' | 'deactivate', operator } | null
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

  // Submit forms (Create/Edit)
  const handleFormSubmit = async (operatorData) => {
    if (editingOperator) {
      await handleEditOperatorSubmit(operatorData);
    } else {
      await handleCreateOperatorSubmit(operatorData);
    }
  };

  const handleCreateOperatorSubmit = async (newOperatorData) => {
    ApiCaller(
      `${API_BASE_URL}/api/operators`,
      "POST",
      newOperatorData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator created successfully!", "success");
        handleCloseModal();
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
    ApiCaller(
      `${API_BASE_URL}/api/operators/${editingOperator.id}`,
      "PATCH",
      dataToUpdate,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator updated successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        console.error("Error updating operator:", error);
        addToast("Failed to update operator: " + error.message, "error");
      },
      setIsSubmitting
    );
  };

  const handleDeleteOperator = async (operatorId) => {
    ApiCaller(
      `${API_BASE_URL}/api/operators/${operatorId}`,
      "DELETE",
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Operator deleted successfully!", "success");
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
    ApiCaller(
      `${API_BASE_URL}/api/operators/${operator.id}`,
      "PATCH",
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Operator ${newStatus === "Active" ? "enabled" : "disabled"} successfully!`, "success");
      },
      (error) => {
        console.error("Error updating operator status:", error);
        addToast("Failed to update operator status: " + error.message, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsConfirmLoading(true);
    try {
      if (confirmState.type === "delete") {
        await handleDeleteOperator(confirmState.operator.id);
      } else if (confirmState.type === "deactivate") {
        await handleDeactivateOperator(confirmState.operator);
      }
      setConfirmState(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // ── AlertBar logic (must be before any early return — Rules of Hooks) ─────
  const alertBarProps = useMemo(() => {
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

        <button className="operator-btn" onClick={handleOpenAddModal}>
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

        <div className="filter-chips">
          <button
            className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            All ({operators.length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
          >
            Active ({operators.filter((o) => o.status === "Active").length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "disabled" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("disabled");
              setCurrentPage(1);
            }}
          >
            Disabled ({operators.filter((o) => o.status === "Disabled").length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Email</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOperators.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  <i className="fa-solid fa-user-slash empty-icon"></i>
                  <p>No operators match your criteria</p>
                </td>
              </tr>
            ) : (
              paginatedOperators.map((op) => (
                <tr key={op.id}>
                  <td className="branch-col">
                    <div className="branch-info">
                      <div className="branch-avatar">
                        <i className="fa-solid fa-building-user"></i>
                      </div>
                      <span>{op.branchName || "N/A"}</span>
                    </div>
                  </td>
                  <td>{op.email || "N/A"}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        op.status === "Active"
                          ? "status-pill-active"
                          : "status-pill-disabled"
                      }`}
                    >
                      {op.status || "Active"}
                    </span>
                  </td>
                  <td className="actions-col">
                    <button
                      className="icon-btn edit"
                      title="Edit Operator"
                      onClick={() => handleOpenEditModal(op)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>

                    <button
                      className="icon-btn ban"
                      title={op.status === "Active" ? "Disable" : "Enable"}
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
                      onClick={() =>
                        setConfirmState({ type: "delete", operator: op })
                      }
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOperators.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Render the Operator Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i
              className={`fa-solid ${
                editingOperator ? "fa-pen-to-square" : "fa-user-plus"
              }`}
              style={{ color: "var(--purple)" }}
            ></i>
            <span>
              {editingOperator
                ? "Edit Operator Account"
                : "Create Operator Account"}
            </span>
          </div>
        }
        subtitle={
          editingOperator
            ? "Update this operator's details"
            : "Add a new franchise operator account"
        }
      >
        <OperatorForm
          key={editingOperator?.id || "new"}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          initialData={editingOperator}
        />
      </ModalWrapper>

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "delete"}
        onClose={() => setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete this operator?"
        Desc={`"${confirmState?.operator?.branchName}" will be permanently removed. This action can't be undone.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Deactivate/Activate confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "deactivate"}
        onClose={() => setConfirmState(null)}
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
    </div>
  );
}
