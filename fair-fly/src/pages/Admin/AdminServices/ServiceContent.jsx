import React, { useState, useEffect } from "react";
import "./admin-services.css";
import ModalWrapper from "../../../components/AdminComponents/Modals/ModalWrapper";
import ServiceForm from "../../../components/AdminComponents/Modals/ServiceForm";
import ConfirmationModal from "../../../components/AdminComponents/Modals/ConfirmationModal";
import {
  createService,
  getServices,
  deleteService,
} from "../../../services/franchiseService";
import { useAuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../components/toast/ToastProvider";
import ApiCaller from "../../../utils/ApiCaller";
import { useAdminContext } from "../../../context/AdminContext";

export default function ServiceContent() {
// Unit labels used when converting the form's { min, max, unit } object into a string
const UNIT_LABELS = {
  days: "Day/s",
  weeks: "Week/s",
  months: "Month/s",
};

// Converts { min, max, unit } -> "7-10 Day/s" (or "7 Day/s" if min === max)
function formatProcessingTime(processingTime) {
  if (!processingTime || typeof processingTime !== "object") {
    return processingTime; // already a string (or empty) - leave as-is
  }
  const { min, max, unit } = processingTime;
  const label = UNIT_LABELS[unit] || unit;
  if (!min && !max) return "";
  if (min === max || !max) return `${min} ${label}`;
  return `${min}-${max} ${label}`;
}

// Wrappers so ConfirmationModal's `Icon` prop (expects a component)
const TrashIcon = (props) => (
  <i className="fa-solid fa-trash-can" {...props}></i>
);
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

  const { userToken } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = add mode, object = edit mode
  const {data: service, loading: serviceLoading} = useAdminContext(); // Fetch services from AdminContext
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state
  const { addToast } = useToast();

  // Confirmation modal state: { type: 'delete' | 'deactivate', service } | null
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  // Handle form submission logic (routes to add or edit)
  const handleFormSubmit = async (serviceData) => {
    const normalizedData = {
      ...serviceData,
      processingTime: formatProcessingTime(serviceData.processingTime),
    };
    if (editingService) {
      await handleEditServiceSubmit(normalizedData);
    } else {
      await handleAddServiceSubmit(normalizedData);
    }
  };

  const handleAddServiceSubmit = async (newServiceData) => {
    ApiCaller(
      'http://localhost:5001/api/services',
      'POST',
      newServiceData,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast("Service added successfully!", "success");
        handleCloseModal(); // Close modal on successful submission
      },
      (error) => {
        addToast("Failed to add service: " + error.message, "error");
        console.error("Error adding service:", error);
      },
      setIsSubmitting
    )
  };

  // Handle edit form submission logic
  const handleEditServiceSubmit = async (updatedServiceData) => {
    ApiCaller(
      `http://localhost:5001/api/services/${editingService.id}`,
      'PATCH',
      updatedServiceData,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast("Service updated successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        addToast("Failed to update service: " + error.message, "error");
        console.error("Error updating service:", error);
      },
      setIsSubmitting
    );
  };

  // ConfirmationModal
  const handleDeleteService = async (serviceId) => {
    ApiCaller(
      `http://localhost:5001/api/services/${serviceId}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast("Service deleted successfully!", "success");
        setConfirmState(null); // Close the confirmation modal
      },
      (error) => {
        addToast("Failed to delete service: " + error.message, "error");
        console.error("Error deleting service:", error);
      },
      setIsConfirmLoading
    );
  };

  // Toggles a service's status between Active/Inactive
  const handleDeactivateService = async (service) => {
    const { updatedAt, createdAt, ...cleanedStatus } = service; //Exclude updatedAt and createdAt from the service object before sending to backend
    ApiCaller(
      `http://localhost:5001/api/services/${service.id}`,
      'PATCH',
      {...cleanedStatus, status: service.status === "Active" ? "Disabled" : "Active" },
      { Authorization: `Bearer ${userToken}` },
      (data) => {
        addToast(`Service ${service.status === "Active" ? "disabled" : "enabled"} successfully!`, "success");
        setConfirmState(null); // Close the confirmation modal
      },
      (error) => {
        addToast(`Failed to ${service.status === "Active" ? "disable" : "enable"} service: ` + error.message, "error");
        console.error(`Error ${service.status === "Active" ? "disabling" : "enabling"} service:`, error);
      },
      setIsConfirmLoading
    );
  };

  // Runs whichever action the confirmation modal is currently open for
  const handleConfirm = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === "delete") {
        await handleDeleteService(confirmState.service.id);
      } else if (confirmState.type === "deactivate") {
        await handleDeactivateService(confirmState.service);
      }
    } catch (error) {
      console.error("Error handling confirmation action:", error);
      addToast("An error occurred while processing your request.", "error");
    }
  };

  if (serviceLoading) {
    return (
      <div className="card services-page">
        <div className="services-header">
          <div>
            <h2>Service Management</h2>
            <p>Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card services-page">
      <div className="services-header">
        <div>
          <h2>Service Management</h2>
          <p>Create, update, or delete services</p>
        </div>

        <button className="service-btn" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-plus"></i>
          Add Service
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Price</th>
            <th>Processing Time</th>
            <th>Status</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {service.length === 0 ? (
            <tr>
              <td colSpan="5">No services found</td>
            </tr>
          ) : (
            service.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>PHP {service.price}</td>
                <td>{service.processingTime}</td>
                <td>
                  <span
                    className={`service-badge ${service.status === "Disabled" ? "inactive" : ""}`}>
                    {service.status}
                  </span>
                </td>
                <td className="actions-col">
                  <button
                    className="icon-btn edit"
                    title="Edit"
                    onClick={() => handleOpenEditModal(service)}>
                    <i className="fa-solid fa-pen-to-square edit"></i>
                  </button>
                  <button
                    className="icon-btn ban"
                    title={service.status === "Active" ? "Disable" : "Enable"}
                    onClick={() =>
                      setConfirmState({ type: "deactivate", service })
                    }>
                    <i
                      className={`fa-solid ${service.status === "Active" ? "fa-ban" : "fa-circle-check"}`}></i>
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete"
                    onClick={() =>
                      setConfirmState({ type: "delete", service })
                    }>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i
              className={`fa-solid ${editingService ? "fa-pen-to-square" : "fa-plus"}`}
              style={{ color: "#5865f2" }}></i>
            <span>{editingService ? "Edit Service" : "Add New Service"}</span>
          </div>
        }
        subtitle={
          editingService
            ? "Update this service's details"
            : "Create a new service offering"
        }>
        <ServiceForm
          key={editingService?.id || "new"}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          initialData={editingService}
        />
      </ModalWrapper>

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "delete"}
        onClose={() => setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete this service?"
        Desc={`"${confirmState?.service?.name}" will be permanently removed. This action can't be undone.`}
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
          confirmState?.service?.status === "Active"
            ? "Disable this service?"
            : "Enable this service?"
        }
        Desc={
          confirmState?.service?.status === "Active"
            ? `"${confirmState?.service?.name}" will be hidden from operator/s until re-enabled.`
            : `"${confirmState?.service?.name}" will become visible to operator/s again.`
        }
        BtnColor="#f97316"
        confirmText={
          confirmState?.service?.status === "Active" ? "Disable" : "Enable"
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </div>
  );
}