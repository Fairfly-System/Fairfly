import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import "./admin-services.css";
import FilterChipGroup from "../../../components/UI/FilterChipGroup/FilterChipGroup";
import ServiceModal from "../../../components/Admin/Modals/ServiceModal/ServiceModal";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import DataTable from "../../../components/UI/DataTable/DataTable";
import PageHeader from "../../../components/UI/PageHeader/PageHeader";
import Breadcrumbs from "../../../components/UI/Breadcrumbs/Breadcrumbs";
import KpiCard from "../../../components/UI/KpiCard/KpiCard";
import { useAuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import ApiCaller from "../../../utils/ApiCaller";
import { API_BASE_URL } from "../../../utils/config";
import { useAdminContext } from "../../../context/AdminContext";
import { uploadFileToBackend } from "../../../utils/fileUploadApi";
import useDebounce from "../../../hooks/useDebounce";

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
  const CheckIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;

  const { userToken } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const { data: service, loading: serviceLoading } = useAdminContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

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
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingService(null);
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    if (!service) return [];
    return service.filter((item) => {
      const term = debouncedSearch.toLowerCase();
      const matchesSearch =
        (item.name || "").toLowerCase().includes(term) ||
        (item.category || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term) ||
        (Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase().includes(term)));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.status === "Active") ||
        (statusFilter === "disabled" && item.status === "Disabled") ||
        (statusFilter === "branch" && Boolean(item.isBranchExclusive));

      return matchesSearch && matchesStatus;
    });
  }, [service, debouncedSearch, statusFilter]);

  // Paginated slice
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Service Details",
        className: "service-name-cell",
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '3.25rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-block';
                    }
                  }}
                />
              ) : null}
              <i
                className="fa-regular fa-image"
                style={{
                  color: 'var(--text-light)',
                  fontSize: '1rem',
                  display: item.coverImage ? 'none' : 'inline-block'
                }}
              ></i>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <strong style={{ color: 'var(--text-dark)' }}>{item.name || "N/A"}</strong>
                {item.featured && (
                  <span title="Featured on Client Marketplace" style={{ color: 'var(--warning-yellow)', fontSize: '0.875rem' }}>
                    <i className="fa-solid fa-star"></i>
                  </span>
                )}
                {item.isBranchExclusive && (
                  <span
                    style={{
                      background: 'var(--purple-soft, #ede9fe)',
                      color: 'var(--purple, #7c3aed)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.125rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      border: '1px solid #ddd6fe'
                    }}
                    title={`Branch-exclusive service created by ${item.branchName || 'Branch Operator'}`}
                  >
                    <i className="fa-solid fa-store" style={{ fontSize: '0.625rem' }}></i> {item.branchName || 'Branch Exclusive'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600 }}>
                  {item.category || "General Services"}
                </span>
                {Array.isArray(item.tags) && item.tags.slice(0, 2).map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-mid)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
                {Array.isArray(item.tags) && item.tags.length > 2 && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "requirements",
        header: "Requirements & Attachments",
        render: (item) => {
          const reqsList = item.requirements || item.actions || [];
          const reqsCount = Array.isArray(reqsList) ? reqsList.length : 0;
          const hasAttachment = Array.isArray(reqsList) && reqsList.some(r => r.attachment && (r.attachment.url || r.attachment.pendingFile));

          return (
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
          );
        },
      },
      {
        key: "workflows",
        header: "Attached Workflows",
        render: (item) => {
          const workflowsCount = Array.isArray(item.workflowIds) ? item.workflowIds.length : 0;
          return (
            <span className="status-pill" style={{ background: 'var(--purple-light-2)', color: 'var(--purple)', fontSize: '0.75rem', fontWeight: 600 }}>
              <i className="fa-solid fa-diagram-project" style={{ marginRight: '0.25rem' }}></i>
              {workflowsCount} Workflow{workflowsCount !== 1 ? 's' : ''}
            </span>
          );
        },
      },
      {
        key: "processingTime",
        header: "Processing Time",
        render: (item) => formatProcessingTime(item.processingTime) || "N/A",
      },
      {
        key: "price",
        header: "Price",
        render: (item) => item.price ? item.price : `PHP ${Number(item.baseFee || 0).toLocaleString()}`,
      },
      {
        key: "status",
        header: "Status",
        render: (item) => (
          <span
            className={`status-pill ${
              item.status === "Active"
                ? "status-pill-active"
                : "status-pill-disabled"
            }`}
          >
            {item.status || "Active"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "actions-col",
        render: (item) => (
          <>
            <Link
              to={`/admin/services/${item.id}`}
              className="icon-btn view"
              title="View Details"
              style={{ color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-eye"></i>
            </Link>
            <button
              className="icon-btn edit"
              title="Edit Service"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() => handleOpenEditModal(item)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              className="icon-btn ban"
              title={item.status === "Active" ? "Disable" : "Enable"}
              disabled={isSubmitting || isConfirmLoading}
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
              title="Delete Service"
              disabled={isSubmitting || isConfirmLoading}
              onClick={() =>
                setConfirmState({ type: "delete", service: item })
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
    if (!service) return { message: 'Loading...', type: 'info' };
    const total = service.length;
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

  const processPendingFilesForService = async (serviceData) => {
    if (!serviceData) return serviceData;

    let coverImageUrl = serviceData.coverImage || '';

    // If there is a new pending cover photo file to upload
    if (serviceData.pendingCoverFile) {
      const { url: uploadedCoverUrl } = await uploadFileToBackend(
        serviceData.pendingCoverFile,
        'service_covers',
        userToken
      );
      coverImageUrl = uploadedCoverUrl;
    }

    let updatedRequirements = serviceData.requirements || [];
    if (Array.isArray(serviceData.requirements)) {
      updatedRequirements = await Promise.all(
        serviceData.requirements.map(async (req) => {
          if (req.attachment && req.attachment.pendingFile) {
            const file = req.attachment.pendingFile;
            const { url: downloadUrl } = await uploadFileToBackend(file, 'service_requirements', userToken);

            const { pendingFile, ...restAttachment } = req.attachment;
            return {
              ...req,
              attachment: {
                ...restAttachment,
                url: downloadUrl,
              },
            };
          }
          return req;
        })
      );
    }

    // Process Carousel Images
    let updatedCarouselImages = [];
    if (Array.isArray(serviceData.carouselImages)) {
      updatedCarouselImages = await Promise.all(
        serviceData.carouselImages.map(async (item) => {
          if (item?.pendingFile) {
            const { url: downloadUrl } = await uploadFileToBackend(
              item.pendingFile,
              'service_carousel',
              userToken
            );
            return downloadUrl;
          }
          if (typeof item === 'string') return item;
          return item?.url || '';
        })
      );
      updatedCarouselImages = updatedCarouselImages.filter(Boolean);
    }

    const { pendingCoverFile, coverImagePreview, ...cleanData } = serviceData;

    return {
      ...cleanData,
      coverImage: coverImageUrl,
      carouselImages: updatedCarouselImages,
      requirements: updatedRequirements,
    };
  };

  const handleFormSubmit = async (serviceData) => {
    if (editingService) {
      await handleEditServiceSubmit(serviceData);
    } else {
      await handleCreateServiceSubmit(serviceData);
    }
  };

  const handleCreateServiceSubmit = async (newServiceData) => {
    setIsSubmitting(true);
    try {
      const processedData = await processPendingFilesForService(newServiceData);
      return await ApiCaller(
        `${API_BASE_URL}/api/services`,
        "POST",
        processedData,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast("Service created successfully!", "success");
          setIsModalOpen(false);
          setEditingService(null);
        },
        (error) => {
          console.error("Error creating service:", error);
          addToast("Failed to create service: " + error.message, "error");
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error("Error uploading requirement attachment:", err);
      addToast("Failed to upload requirement attachment: " + err.message, "error");
      setIsSubmitting(false);
    }
  };

  const handleEditServiceSubmit = async (updatedServiceData) => {
    setIsSubmitting(true);
    try {
      const processedData = await processPendingFilesForService(updatedServiceData);
      return await ApiCaller(
        `${API_BASE_URL}/api/services/${editingService.id}`,
        "PUT",
        processedData,
        { Authorization: `Bearer ${userToken}` },
        () => {
          addToast("Service updated successfully!", "success");
          setIsModalOpen(false);
          setEditingService(null);
        },
        (error) => {
          console.error("Error updating service:", error);
          addToast("Failed to update service: " + error.message, "error");
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error("Error uploading requirement attachment:", err);
      addToast("Failed to upload requirement attachment: " + err.message, "error");
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/${serviceId}`,
      "DELETE",
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast("Service deleted successfully!", "success");
        setConfirmState(null);
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
    return ApiCaller(
      `${API_BASE_URL}/api/services/${serviceItem.id}`,
      "PATCH",
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Service ${newStatus === "Active" ? "enabled" : "disabled"} successfully!`, "success");
        setConfirmState(null);
      },
      (error) => {
        console.error("Error updating service status:", error);
        addToast("Failed to update service status: " + error.message, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleBulkStatusChange = async (ids, newStatus) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/bulk-status`,
      "POST",
      { ids, status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`${ids.length} service(s) ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully!`, "success");
        setSelectedIds([]);
        setConfirmState(null);
      },
      (error) => {
        console.error("Error bulk updating services:", error);
        addToast(`Failed to update services: ${error.message}`, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleBulkDelete = async (ids) => {
    return ApiCaller(
      `${API_BASE_URL}/api/services/bulk-delete`,
      "POST",
      { ids },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`${ids.length} service(s) deleted successfully!`, "success");
        setSelectedIds([]);
        setConfirmState(null);
      },
      (error) => {
        console.error("Error bulk deleting services:", error);
        addToast(`Failed to delete services: ${error.message}`, "error");
      },
      setIsConfirmLoading
    );
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    if (confirmState.type === "delete") {
      await handleDeleteService(confirmState.service.id);
    } else if (confirmState.type === "deactivate") {
      await handleDeactivateService(confirmState.service);
    } else if (confirmState.type === "bulk-enable") {
      await handleBulkStatusChange(confirmState.ids, "Active");
    } else if (confirmState.type === "bulk-disable") {
      await handleBulkStatusChange(confirmState.ids, "Disabled");
    } else if (confirmState.type === "bulk-delete") {
      await handleBulkDelete(confirmState.ids);
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Services" },
  ];

  const totalServices = Array.isArray(service) ? service.length : 0;
  const activeCount = Array.isArray(service) ? service.filter((s) => s.status === "Active").length : 0;
  const inactiveCount = totalServices - activeCount;
  const branchCount = Array.isArray(service) ? service.filter((s) => Boolean(s.isBranchExclusive)).length : 0;
  const categoriesCount = Array.isArray(service)
    ? new Set(service.map((s) => s.category).filter(Boolean)).size
    : 0;

  return (
    <main className="services-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Services Catalog Management"
        subtitle="Configure available franchise services, fees, requirements, and workflows"
        illustrationSrc="/pageImages/admin/services.png"
        primaryAction={{
          label: "Add Service",
          icon: "fa-solid fa-plus",
          onClick: handleOpenAddModal,
        }}
      />

      <section className="services-summary-grid">
        <KpiCard
          title="Total Services"
          value={totalServices}
          icon="fa-solid fa-layer-group"
          iconColor="var(--purple)"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="Active"
          value={activeCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark)"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="Inactive"
          value={inactiveCount}
          icon="fa-solid fa-ban"
          iconColor="var(--error-red-dark)"
          isLoading={serviceLoading}
        />
        <KpiCard
          title="Categories"
          value={categoriesCount}
          icon="fa-solid fa-tags"
          iconColor="#f0653e"
          isLoading={serviceLoading}
        />
      </section>

      <section className="card services-table-card">
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

          <FilterChipGroup
            chips={[
              { value: "all", label: `All (${totalServices})` },
              { value: "active", label: `Active (${activeCount})` },
              { value: "disabled", label: `Disabled (${inactiveCount})` },
              { value: "branch", label: `Branch Exclusive (${branchCount})` },
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
          data={paginatedServices}
          keyField="id"
          selectable={true}
          selectedIds={selectedIds}
          isLoading={serviceLoading}
          disabled={isConfirmLoading || isSubmitting}
          onSelectionChange={setSelectedIds}
          onBulkEnable={(ids) => setConfirmState({ type: "bulk-enable", ids })}
          onBulkDisable={(ids) => setConfirmState({ type: "bulk-disable", ids })}
          onBulkDelete={(ids) => setConfirmState({ type: "bulk-delete", ids })}
          emptyState={{
            icon: "fa-solid fa-layer-group",
            message: "No services match your search criteria",
          }}
        />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredServices.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
      </section>

      {/* Render Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingService={editingService}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Single Delete Confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "delete"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete this service?"
        Desc={`"${confirmState?.service?.name}" will be permanently removed. This action can't be undone.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Single Deactivate/Activate Confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "deactivate"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={BanIcon}
        Title={
          confirmState?.service?.status === "Active"
            ? "Disable this service?"
            : "Enable this service?"
        }
        Desc={
          confirmState?.service?.status === "Active"
            ? `"${confirmState?.service?.name}" will be disabled and hidden from operators.`
            : `"${confirmState?.service?.name}" will become active and available.`
        }
        BtnColor="var(--orange)"
        confirmText={
          confirmState?.service?.status === "Active" ? "Disable" : "Enable"
        }
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />

      {/* Bulk Delete confirmation */}
      <ConfirmationModal
        isOpen={confirmState?.type === "bulk-delete"}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title={`Delete ${confirmState?.ids?.length || 0} selected services?`}
        Desc={`${confirmState?.ids?.length || 0} services will be permanently removed. This action can't be undone.`}
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
        Title={`Enable ${confirmState?.ids?.length || 0} selected services?`}
        Desc={`${confirmState?.ids?.length || 0} services will become active and available to operators.`}
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
        Title={`Disable ${confirmState?.ids?.length || 0} selected services?`}
        Desc={`${confirmState?.ids?.length || 0} services will be disabled and hidden from operators.`}
        BtnColor="var(--orange)"
        confirmText="Disable Selected"
        isLoading={isConfirmLoading}
        OnConfirm={handleConfirm}
      />
    </main>
  );
}