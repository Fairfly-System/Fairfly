import React, { useState, useMemo } from "react";
import "./admin-services.css";
import ModalWrapper from "../../../components/Admin/Modals/ModalWrapper";
import ServiceForm from "../../../components/Admin/Modals/ServiceForm";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import { useAuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";

export default function ServiceContent() {
  const UNIT_LABELS = {
    days: "Day/s",
    weeks: "Week/s",
    months: "Month/s",
  };

  function formatProcessingTime(processingTime) {
    if (!processingTime || typeof processingTime !== "object") {
      return processingTime;
    }
    const { min, max, unit } = processingTime;
    const label = UNIT_LABELS[unit] || unit;
    if (!min && !max) return "";
    if (min === max || !max) return `${min} ${label}`;
    return `${min}-${max} ${label}`;
  }

  const TrashIcon = (props) => (
    <i className="fa-solid fa-trash-can" {...props}></i>
  );
  const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

  const { userToken } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const { data: service, loading: serviceLoading } = useAdminContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (serviceItem) => {
    setEditingService(serviceItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    if (!service) return [];
    return service.filter((item) => {
      const matchesSearch =
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.status === "Active") ||
        (statusFilter === "disabled" && item.status === "Disabled");

      return matchesSearch && matchesStatus;
    });
  }, [service, searchTerm, statusFilter]);

  // Paginated slice
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  const handleFormSubmit = async (serviceData) => {
    if (editingService) {
      await handleEditServiceSubmit(serviceData);
    } else {
      await handleCreateServiceSubmit(serviceData);
    }
  };

  const handleCreateServiceSubmit = async (newServiceData) => {
    ApiCaller(
      `${API_BASE_URL}/api/services`,
      "POST",
      newServiceData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Service created successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        console.error("Error creating service:", error);
        addToast("Failed to create service: " + error.message, "error");
      },
      setIsSubmitting
    );
  };

  const handleEditServiceSubmit = async (updatedServiceData) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/${editingService.id}`,
      "PUT",
      updatedServiceData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Service updated successfully!", "success");
        handleCloseModal();
      },
      (error) => {
        console.error("Error updating service:", error);
        addToast("Failed to update service: " + error.message, "error");
      },
      setIsSubmitting
    );
  };

  const handleDeleteService = async (serviceId) => {
    ApiCaller(
      `${API_BASE_URL}/api/services/${serviceId}`,
      "DELETE",
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Service deleted successfully!", "success");
      },
      (error) => {
        console.error("Error deleting service:", error);
        addToast("Failed to delete service: " + error.message, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleDeactivateService = async (serviceItem) => {
    const newStatus = serviceItem.status === "Active" ? "Disabled" : "Active";
    ApiCaller(
      `${API_BASE_URL}/api/services/${serviceItem.id}`,
      "PATCH",
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Service ${newStatus === "Active" ? "enabled" : "disabled"} successfully!`, "success");
      },
      (error) => {
        console.error("Error updating service status:", error);
        addToast("Failed to update service status: " + error.message, "error");
      },
      setIsConfirmLoading
    );
  };

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

  // ── AlertBar logic (must be before any early return — Rules of Hooks) ─────
  const alertBarProps = useMemo(() => {
    const total    = service.length;
    const disabled = service.filter(s => s.status === 'Disabled').length;

    if (total === 0) {
      return { message: 'No services found. Add your first service to begin offering franchise options.', type: 'error' };
    }
    if (disabled > 0) {
      return {
        message: `${disabled} of ${total} service${total !== 1 ? 's' : ''} ${disabled !== 1 ? 'are' : 'is'} currently disabled and hidden from operators.`,
        type: 'warning',
      };
    }
    return {
      message: `All ${total} service${total !== 1 ? 's' : ''} are active and visible to operators.`,
      type: 'success',
    };
  }, [service]);

  if (serviceLoading) {
    return (
      <div className="card services-page page-fade-in">
        <div className="services-header">
          <div>
            <h2>Services Management</h2>
            <p>Loading services catalog...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card services-page page-fade-in">
      <div className="services-header">
        <div>
          <h2>Services Catalog Management</h2>
          <p>Configure available franchise services, fees, requirements, and workflows</p>
        </div>

        <button className="service-btn" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-plus"></i>
          Add Service
        </button>
      </div>

      <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

      {/* Toolbar Search & Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search service name or category..."
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
            All ({service.length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
          >
            Active ({service.filter((s) => s.status === "Active").length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "disabled" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("disabled");
              setCurrentPage(1);
            }}
          >
            Disabled ({service.filter((s) => s.status === "Disabled").length})
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Requirements & Attachments</th>
              <th>Attached Workflows</th>
              <th>Processing Time</th>
              <th>Price</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedServices.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table-cell">
                  <i className="fa-solid fa-layer-group empty-icon"></i>
                  <p>No services match your search criteria</p>
                </td>
              </tr>
            ) : (
              paginatedServices.map((item) => {
                const reqsList = item.requirements || item.actions || [];
                const reqsCount = Array.isArray(reqsList) ? reqsList.length : 0;
                const hasAttachment = Array.isArray(reqsList) && reqsList.some(r => r.attachment && r.attachment.url);
                const workflowsCount = Array.isArray(item.workflowIds) ? item.workflowIds.length : 0;

                return (
                  <tr key={item.id}>
                    <td className="service-name-cell">
                      <strong>{item.name || "N/A"}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <span className="status-pill status-active" style={{ fontSize: '0.75rem' }}>
                          {reqsCount} Requirement{reqsCount !== 1 ? 's' : ''}
                        </span>
                        {hasAttachment && (
                          <span className="status-pill" style={{ background: 'var(--purple-light-2)', color: 'var(--purple-dark)', fontSize: '0.6875rem' }}>
                            <i className="fa-solid fa-paperclip" style={{ marginRight: '0.25rem' }}></i> Attachment
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="status-pill" style={{ background: 'var(--purple-light-2)', color: 'var(--purple)', fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-diagram-project" style={{ marginRight: '0.25rem' }}></i>
                        {workflowsCount} Workflow{workflowsCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>{formatProcessingTime(item.processingTime) || "N/A"}</td>
                    <td>{item.price ? item.price : `PHP ${Number(item.baseFee || 0).toLocaleString()}`}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          item.status === "Active"
                            ? "status-pill-active"
                            : "status-pill-disabled"
                        }`}
                      >
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button
                        className="icon-btn edit"
                        title="Edit Service"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        className="icon-btn ban"
                        title={item.status === "Active" ? "Disable" : "Enable"}
                        onClick={() =>
                          setConfirmState({ type: "deactivate", service: item })
                        }
                      >
                        <i
                          className={`fa-solid ${
                            item.status === "Active" ? "fa-ban" : "fa-circle-check"
                          }`}
                        ></i>
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete"
                        onClick={() =>
                          setConfirmState({ type: "delete", service: item })
                        }
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredServices.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i
              className={`fa-solid ${editingService ? "fa-pen-to-square" : "fa-plus"}`}
              style={{ color: "var(--purple)" }}
            ></i>
            <span>{editingService ? "Edit Service" : "Create New Service"}</span>
          </div>
        }
        subtitle={
          editingService
            ? "Update service details, requirements, and attached workflows"
            : "Add a new service to the catalog"
        }
      >
        <ServiceForm
          key={editingService?.id || "new"}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          initialData={editingService}
        />
      </ModalWrapper>

      <ConfirmationModal
        isOpen={confirmState?.type === "delete"}
        onClose={() => setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete this service?"
        Desc={`"${confirmState?.service?.name}" will be permanently removed. This action can't be undone.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

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
            ? `"${confirmState?.service?.name}" will be hidden from operators until re-enabled.`
            : `"${confirmState?.service?.name}" will be enabled.`
        }
        BtnColor="var(--orange)"
        confirmText={
          confirmState?.service?.status === "Active" ? "Disable" : "Enable"
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </div>
  );
}