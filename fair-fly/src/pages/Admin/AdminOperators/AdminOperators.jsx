import React, { useState, useEffect } from "react";
import "./admin-operators.css";
import { firestore, storage } from "../../../firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { useToast } from "../../../components/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import ModalWrapper from "../../../components/AdminComponents/Modals/ModalWrapper";
import OperatorForm from "../../../components/AdminComponents/Modals/OperatorForm";
import ConfirmationModal from "../../../components/AdminComponents/Modals/ConfirmationModal";
import {
  createOperator,
  getOperators,
  deleteOperator,
} from "../../../services/franchiseService";

// Wrappers so ConfirmationModal's `Icon` prop (expects a component) works with Font Awesome classes
const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function AdminOperators() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null); // null = add mode, object = edit mode
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state

  // Confirmation modal state: { type: 'delete' | 'deactivate', operator } | null
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  //subscribe to the operators collection in Firestore and update the state when changes occur
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        // Filter only operators from the users collection
        const operators = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.role === "operator");
        setOperators(operators);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

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
    try {
      setIsSubmitting(true); // Set submission state to true
      // Post the new operator data to the backend
      const response = await fetch("http://localhost:5001/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
        },
        body: JSON.stringify(newOperatorData),
      });
      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.statusMessage || "Failed to create operator");
      }
      addToast("Operator created successfully!", "success");
      handleCloseModal();
    } catch (error) {
      console.error("Error creating operator:", error);
      addToast("Failed to create operator: " + error.message, "error");
      handleCloseModal(); // Close modal on error
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  // Handle edit form submission logic (email is intentionally excluded from the payload)
  const handleEditOperatorSubmit = async (updatedOperatorData) => {
    try {
      setIsSubmitting(true);
      const { email, password, ...editableData } = updatedOperatorData; // strip email/password before sending
      const response = await fetch(
        `http://localhost:5001/api/operators/${editingOperator.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
          },
          body: JSON.stringify(editableData),
        },
      );
      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.statusMessage || "Failed to update operator");
      }
      addToast("Operator updated successfully!", "success");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating operator:", error);
      addToast("Failed to update operator: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actual delete call — now triggered from the ConfirmationModal instead of window.confirm
  const handleDeleteOperator = async (operatorId) => {
    try {
      // Send a DELETE request to the backend to delete the operator
      const response = await fetch(
        `http://localhost:5001/api/operators/${operatorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to delete operator: " + response.error);
      }
      addToast("Operator deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting operator:", error);
      addToast("Failed to delete operator: " + error.message, "error");
    }
  };

  // Toggles an operator's status between Active/Inactive
  const handleDeactivateOperator = async (operator) => {
    const newStatus = operator.status === "Active" ? "Inactive" : "Active";
    try {
      const response = await fetch(
        `http://localhost:5001/api/operators/${operator.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to update operator status");
      }
      addToast(
        `Operator ${newStatus === "Active" ? "activated" : "deactivated"} successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Error updating operator status:", error);
      addToast("Failed to update operator status: " + error.message, "error");
    }
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

  if (loading) {
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
            <th>Services Handled</th>
            <th>Status</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {operators.length === 0 ? (
            <tr>
              <td colSpan="5">No operators found</td>
            </tr>
          ) : (
            operators.map((op) => (
              <tr key={op.id}>
                <td>{op.branchName || "N/A"}</td>
                <td>{op.email || "N/A"}</td>
                <td>{op.servicesHandled || 0} services</td>
                <td>
                  <span
                    className={`operator-badge ${op.status === "Inactive" ? "operator-badge-inactive" : ""}`}>
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
        onClose={handleCloseModal}
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
