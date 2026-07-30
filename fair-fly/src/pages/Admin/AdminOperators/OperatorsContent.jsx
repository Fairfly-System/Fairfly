import React, { useState } from "react";
import "./admin-operators.css";
import { useToast } from "../../../components/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import ModalWrapper from "../../../components/AdminComponents/Modals/ModalWrapper";
import OperatorForm from "../../../components/AdminComponents/Modals/OperatorForm";
import ConfirmationModal from "../../../components/AdminComponents/Modals/ConfirmationModal";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";

const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function OperatorsContent() {
  const {data: operators, loading: operatorLoading} = useAdminContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Routes to create or edit depending on mode
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
      (data) => {
        addToast("Operator created successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        console.error("Error creating operator:", error);
        addToast("Failed to create operator: " + error.message, "error");
      },
      setIsSubmitting,
    );
  };

  // Handle edit form submission logic (email is intentionally excluded from the payload)
  const handleEditOperatorSubmit = async (updatedOperatorData) => {
    const { email, ...dataToUpdate } = updatedOperatorData; // Exclude email from the payload
    ApiCaller(
      `${API_BASE_URL}/api/operators/${editingOperator.id}`,
      "PATCH",
      dataToUpdate,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast("Operator updated successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        console.error("Error updating operator:", error);
        addToast("Failed to update operator: " + error.message, "error");
      },
      setIsSubmitting,
    );
  };

  // Actual delete call — now triggered from the ConfirmationModal instead of window.confirm
  const handleDeleteOperator = async (operatorId) => {
    ApiCaller(
      `${API_BASE_URL}/api/operators/${operatorId}`,
      "DELETE",
      null,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast("Operator deleted successfully!", "success");
      },
      (error) => {
        console.error("Error deleting operator:", error);
        addToast("Failed to delete operator: " + error.message, "error");
      },
      setIsConfirmLoading,
    );
  };

  // Toggles an operator's status between Active/Disabled
  const handleDeactivateOperator = async (operator) => {
    const newStatus = operator.status === "Active" ? "Disabled" : "Active";
    ApiCaller(
      `${API_BASE_URL}/api/operators/${operator.id}`,
      "PATCH",
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast(`Operator ${newStatus === "Active" ? "enabled" : "disabled"} successfully!`, "success");
      },
      (error) => {
        console.error("Error updating operator status:", error);
        addToast("Failed to update operator status: " + error.message, "error");
      },
      setIsConfirmLoading,
    );
  };

  // Runs whichever action the confirmation modal is currently open for
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

  if (operatorLoading) {
    return (
      <div className="card operators-page">
        <div className="operators-header">
          <div>
            <h2>Page Management</h2>
            <p>Loading operator accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card operators-page">
      <div className="operators-header">
        <div>
          <h2>Page Management</h2>
          <p>Create and manage franchise operator accounts</p>
        </div>

        {/* Trigger button */}
        <button className="operator-btn" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-user-plus"></i>
          Add Operator
        </button>
      </div>

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
          {operators.length === 0 ? (
            <tr>
              <td colSpan="4">No operators found</td>
            </tr>
          ) : (
            operators.map((op) => (
              <tr key={op.id}>
                <td>{op.branchName || "N/A"}</td>
                <td>{op.email || "N/A"}</td>
                <td>
                  <span
                    className={`operator-badge ${op.status === "Disabled" ? "operator-badge-inactive" : ""}`}>
                    {op.status}
                  </span>
                </td>
                <td className="actions-col">
                  <button
                    className="icon-btn edit"
                    title="Edit"
                    onClick={() => handleOpenEditModal(op)}>
                    <i className="fa-solid fa-pen-to-square edit"></i>
                  </button>

                  <button
                    className="icon-btn ban"
                    title={op.status === "Active" ? "Disable" : "Enable"}
                    onClick={() =>
                      setConfirmState({ type: "deactivate", operator: op })
                    }>
                    <i
                      className={`fa-solid ${op.status === "Active" ? "fa-ban" : "fa-circle-check"}`}></i>
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete"
                    onClick={() =>
                      setConfirmState({ type: "delete", operator: op })
                    }>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Render the Operator Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal} //Pass the close handler to the modal (Can be called by handlers in this component)
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i
              className={`fa-solid ${editingOperator ? "fa-pen-to-square" : "fa-user-plus"}`}
              style={{ color: "#16a34a" }}></i>
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
        }>
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
        BtnColor="#ef4444"
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
        BtnColor="#f97316"
        confirmText={
          confirmState?.operator?.status === "Active" ? "Disable" : "Enable"
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </div>
  );
}
