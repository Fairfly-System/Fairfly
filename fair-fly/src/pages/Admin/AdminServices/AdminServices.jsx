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
import { firestore, storage } from "../../../firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { useAuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../components/toast/ToastProvider";

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

export default function AdminServices() {
  const { userToken } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = add mode, object = edit mode
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state
  const { addToast } = useToast();

  // Confirmation modal state: { type: 'delete' | 'deactivate', service } | null
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "services"),
      (snapshot) => {
        const services = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(services);
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
    setIsSubmitting(true); // Set submission state to true
    try {
      //Post the new service data to the backend
      const response = await fetch("http://localhost:5001/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
        },
        body: JSON.stringify(newServiceData),
      });
      if (!response.ok) {
        let errorText = await response.json();
        throw new Error(errorText.statusText || "Failed to add service");
      }
      console.log(response);
      addToast("Service added successfully!", "success");
      handleCloseModal(); // Close modal on successful submission
    } catch (error) {
      addToast("Failed to add service: " + error, "error");
      console.error("Error adding service:", error);
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  // Handle edit form submission logic
  const handleEditServiceSubmit = async (updatedServiceData) => {
    setIsSubmitting(true);
    try {
      //Send updated service data to the backend
      const response = await fetch(
        `http://localhost:5001/api/services/${editingService.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
          },
          body: JSON.stringify(updatedServiceData),
        },
      );
      if (!response.ok) {
        let errorText = await response.json();
        throw new Error(errorText.statusText || "Failed to update service");
      }
      console.log(response);
      addToast("Service updated successfully!", "success");
      handleCloseModal(); // Close modal on successful submission
    } catch (error) {
      addToast("Failed to update service: " + error, "error");
      console.error("Error updating service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ConfirmationModal
  const handleDeleteService = async (serviceId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/services/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken}`, // Include the token in the Authorization header
          },
        },
      );
      if (!response.ok) {
        let errorText = await response.json();
        throw new Error(errorText.statusText || "Failed to delete service");
      }
      addToast("Service deleted successfully!", "success");
      setServices((prevServices) =>
        prevServices.filter((service) => service.id !== serviceId),
      );
    } catch (error) {
      console.error("Error deleting service:", error);
      addToast("Failed to delete service: " + error.message, "error");
    }
  };

  // Toggles a service's status between Active/Inactive
  const handleDeactivateService = async (service) => {
    const newStatus = service.status === "Active" ? "Inactive" : "Active";

    try {
      const response = await fetch(
        `http://localhost:5001/api/services/${service.id}`,
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
        let errorText = await response.json();
        throw new Error(
          errorText.statusText || "Failed to update service status",
        );
      }
      addToast(
        `Service ${newStatus === "Active" ? "activated" : "deactivated"} successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Error updating service status:", error);
      addToast("Failed to update service status: " + error.message, "error");
    }
  };

  // Runs whichever action the confirmation modal is currently open for
  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsConfirmLoading(true);
    try {
      if (confirmState.type === "delete") {
        await handleDeleteService(confirmState.service.id);
      } else if (confirmState.type === "deactivate") {
        await handleDeactivateService(confirmState.service);
      }
      setConfirmState(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  if (loading) {
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
          {services.length === 0 ? (
            <tr>
              <td colSpan="5">No services found</td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>PHP {service.price}</td>
                <td>{service.processingTime}</td>
                <td>
                  <span
                    className={`service-badge ${service.status === "Inactive" ? "service-badge-inactive" : ""}`}>
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