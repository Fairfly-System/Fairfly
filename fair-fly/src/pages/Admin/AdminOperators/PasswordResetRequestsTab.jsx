import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  fetchPasswordResetRequests, 
  approvePasswordResetRequest, 
  rejectPasswordResetRequest,
  fetchPasswordResetRequestById 
} from "../../../services/passwordResetService";
import { useAuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import FilterChipGroup from "../../../components/UI/FilterChipGroup/FilterChipGroup";
import DataTable from "../../../components/UI/DataTable/DataTable";
import Pagination from "../../../components/UI/Pagination/Pagination";
import ConfirmationModal from "../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal";
import BaseModal from "../../../components/UI/ModalBase/BaseModal";
import useDebounce from "../../../hooks/useDebounce";
import toFriendlyMessage from "../../../utils/friendlyErrors";

export default function PasswordResetRequestsTab() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals
  const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject', request: {...} }
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inspect Modal
  const [inspectRequest, setInspectRequest] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const loadRequests = useCallback(() => {
    if (!userToken) return;
    setLoading(true);
    fetchPasswordResetRequests(
      userToken,
      statusFilter,
      (data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching reset requests:", err);
        addToast(toFriendlyMessage(err, "Failed to load password reset requests."), "error");
        setLoading(false);
      }
    );
  }, [userToken, statusFilter, addToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (statusFilter !== "all") {
      list = list.filter((r) => (r.status || "").toUpperCase() === statusFilter.toUpperCase());
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(q) ||
          (r.operatorName || "").toLowerCase().includes(q) ||
          (r.operatorEmail || "").toLowerCase().includes(q) ||
          (r.branchName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, debouncedSearch]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Handle Approve
  const handleApprove = () => {
    if (!actionModal?.request?.id) return;
    setIsSubmitting(true);
    approvePasswordResetRequest(
      userToken,
      actionModal.request.id,
      (res) => {
        setIsSubmitting(false);
        setActionModal(null);
        addToast(
          res?.message || `Approved reset for ${actionModal.request.operatorEmail}. Reset link emailed.`,
          "success"
        );
        loadRequests();
      },
      (err) => {
        setIsSubmitting(false);
        addToast(toFriendlyMessage(err, "Failed to approve password reset request."), "error");
      }
    );
  };

  // Handle Reject
  const handleReject = () => {
    if (!actionModal?.request?.id) return;
    setIsSubmitting(true);
    rejectPasswordResetRequest(
      userToken,
      actionModal.request.id,
      rejectReason,
      () => {
        setIsSubmitting(false);
        setActionModal(null);
        setRejectReason("");
        addToast(`Rejected reset request for ${actionModal.request.operatorEmail}.`, "info");
        loadRequests();
      },
      (err) => {
        setIsSubmitting(false);
        addToast(toFriendlyMessage(err, "Failed to reject password reset request."), "error");
      }
    );
  };

  // Handle Inspect Request Details
  const handleInspect = (req) => {
    setInspectRequest(req);
    setInspectLoading(true);
    fetchPasswordResetRequestById(
      userToken,
      req.id,
      (data) => {
        setInspectRequest(data);
        setInspectLoading(false);
      },
      () => setInspectLoading(false)
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PENDING":
        return <span className="badge badge-warning"><i className="fa-solid fa-clock"></i> Pending Review</span>;
      case "APPROVED":
        return <span className="badge badge-success"><i className="fa-solid fa-circle-check"></i> Approved</span>;
      case "REJECTED":
        return <span className="badge badge-danger"><i className="fa-solid fa-circle-xmark"></i> Rejected</span>;
      case "COMPLETED":
        return <span className="badge badge-info"><i className="fa-solid fa-check-double"></i> Completed</span>;
      case "EXPIRED":
        return <span className="badge badge-secondary"><i className="fa-solid fa-hourglass-end"></i> Expired</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const columns = [
    {
      header: "Request ID",
      accessor: "id",
      render: (r) => <strong className="font-mono text-xs">{r.id}</strong>
    },
    {
      header: "Operator",
      accessor: "operatorName",
      render: (r) => (
        <div className="operator-cell">
          <div className="operator-name">{r.operatorName || "Operator"}</div>
          <div className="operator-subtext text-xs text-muted">{r.operatorEmail}</div>
        </div>
      )
    },
    {
      header: "Branch",
      accessor: "branchName",
      render: (r) => (
        <div>
          <span className="font-medium">{r.branchName || "Branch Office"}</span>
          {r.branchUid && <div className="text-xs text-muted font-mono">{r.branchUid}</div>}
        </div>
      )
    },
    {
      header: "Submitted",
      accessor: "createdAt",
      render: (r) => (
        <span className="text-xs">
          {r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (r) => getStatusBadge(r.status)
    },
    {
      header: "Reviewed By",
      accessor: "reviewedByName",
      render: (r) => (
        <div className="text-xs">
          {r.reviewedByName ? (
            <>
              <div>{r.reviewedByName}</div>
              <div className="text-muted">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ""}</div>
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (r) => {
        const isPending = (r.status || "").toUpperCase() === "PENDING";
        return (
          <div className="table-actions" style={{ display: "flex", gap: "0.4rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => handleInspect(r)}
              title="Inspect Verification Details"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-success btn-xs"
                  onClick={() => setActionModal({ type: "approve", request: r })}
                  title="Approve & Send Reset Link"
                  style={{ background: "#10b981", color: "#fff", border: "none" }}
                >
                  <i className="fa-solid fa-check"></i> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => {
                    setRejectReason("");
                    setActionModal({ type: "reject", request: r });
                  }}
                  title="Reject Request"
                  style={{ background: "#ef4444", color: "#fff", border: "none" }}
                >
                  <i className="fa-solid fa-xmark"></i> Reject
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  const filterChips = [
    { label: "All Requests", value: "all" },
    { label: "Pending Review", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Expired", value: "EXPIRED" }
  ];

  return (
    <div className="password-reset-tab page-fade-in" style={{ marginTop: "1rem" }}>
      {/* Search & Filters */}
      <div className="filter-chip-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <FilterChipGroup
          chips={filterChips}
          activeValue={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />

        <div className="search-input-wrapper" style={{ minWidth: "18rem" }}>
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search by operator, email, branch, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Requests Data Table */}
      <DataTable
        columns={columns}
        data={paginatedRequests}
        loading={loading}
        emptyMessage="No operator password reset requests found."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredRequests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
      />

      {/* Approve Confirmation Modal */}
      {actionModal?.type === "approve" && (
        <ConfirmationModal
          isOpen={true}
          title="Approve Operator Password Reset"
          message={`Are you sure you want to approve the password reset request for "${actionModal.request.operatorName}" (${actionModal.request.operatorEmail})? This will generate an official single-use Firebase Auth reset link and email it directly to the operator's registered address.`}
          confirmLabel="Approve & Send Email"
          cancelLabel="Cancel"
          variant="primary"
          isLoading={isSubmitting}
          onConfirm={handleApprove}
          onCancel={() => setActionModal(null)}
        />
      )}

      {/* Reject Confirmation Modal with Reason */}
      {actionModal?.type === "reject" && (
        <BaseModal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title="Reject Operator Password Reset"
          subtitle={`Rejecting request for ${actionModal.request.operatorEmail}`}
          maxWidth="32rem"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Please provide an administrative reason for rejecting this operator's password reset request. This note will be recorded in the security audit log.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reject-reason">
                Rejection Reason / Notes
              </label>
              <textarea
                id="reject-reason"
                className="form-input"
                rows={3}
                placeholder="e.g. Identity could not be verified; unassigned branch; contact head office directly."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActionModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReject}
                disabled={isSubmitting}
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Inspect Verification Factors Modal */}
      {inspectRequest && (
        <BaseModal
          isOpen={true}
          onClose={() => setInspectRequest(null)}
          title="Password Reset Request Details"
          subtitle={`Request ID: ${inspectRequest.id}`}
          maxWidth="40rem"
        >
          {inspectLoading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <i className="fa-solid fa-spinner fa-spin text-xl"></i>
              <p className="text-sm text-muted" style={{ marginTop: "0.5rem" }}>Loading operator security profile...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div className="text-xs text-muted">Operator Name</div>
                  <div className="font-semibold">{inspectRequest.operatorName || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Registered Email</div>
                  <div className="font-mono text-sm">{inspectRequest.operatorEmail}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Assigned Branch</div>
                  <div className="font-semibold">{inspectRequest.branchName || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Operator UID</div>
                  <div className="font-mono text-xs">{inspectRequest.operatorUid || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Current Status</div>
                  <div>{getStatusBadge(inspectRequest.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Submitted At</div>
                  <div className="text-sm">{inspectRequest.createdAt ? new Date(inspectRequest.createdAt).toLocaleString() : "N/A"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <div className="text-xs font-bold" style={{ color: "#475569", marginBottom: "0.25rem" }}>
                  Submitted Reason:
                </div>
                <div className="text-sm">{inspectRequest.reason || "None specified"}</div>
              </div>

              {inspectRequest.operatorProfile && (
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
                  <div className="text-xs font-bold" style={{ color: "#475569", marginBottom: "0.5rem" }}>
                    Verified Database Profile:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>Account Status: <strong style={{ color: inspectRequest.operatorProfile.status === "Active" ? "#10b981" : "#ef4444" }}>{inspectRequest.operatorProfile.status}</strong></div>
                    <div>Franchise Qualified: <strong>{inspectRequest.operatorProfile.isQualified ? "Yes" : "No"}</strong></div>
                    <div>Account Created: <span>{inspectRequest.operatorProfile.createdAt ? new Date(inspectRequest.operatorProfile.createdAt).toLocaleDateString() : "N/A"}</span></div>
                    <div>Role: <span>{inspectRequest.operatorProfile.role}</span></div>
                  </div>
                </div>
              )}

              {inspectRequest.reviewNotes && (
                <div style={{ background: "#fef2f2", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                  <div className="text-xs font-bold" style={{ color: "#991b1b", marginBottom: "0.25rem" }}>
                    Reviewer Notes / Rejection Reason:
                  </div>
                  <div className="text-sm text-red-800">{inspectRequest.reviewNotes}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInspectRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </BaseModal>
      )}
    </div>
  );
}
