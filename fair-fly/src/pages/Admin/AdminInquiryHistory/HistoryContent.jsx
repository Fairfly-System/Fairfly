import { useAdminContext } from "../../../context/AdminContext";
import { useState, useRef, useMemo } from "react";
import ApplicationModal from "../../../components/Admin/Modals/ApplicationModal/ApplicationModal";
import FranchiseCard from "../../../components/Admin/FranchiseeApplication/FranchiseeCard";
import Pagination from "../../../components/UI/Pagination/Pagination";
import AlertBar from "../../../components/UI/AlertBar/AlertBar";
import "./admin-inquiry-history.css";

export default function HistoryContent() {
  const { data: franchiseApplications, loading: franchiseLoading } = useAdminContext();
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Non-pending history applications
  const historyApplications = useMemo(() => {
    if (!franchiseApplications) return [];
    return franchiseApplications.filter((app) => app.status !== "pending");
  }, [franchiseApplications]);

  const filteredHistory = useMemo(() => {
    return historyApplications.filter((app) => {
      const matchesSearch =
        (app.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.preferredBranchLocation || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (app.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [historyApplications, searchTerm, statusFilter]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  // ── AlertBar logic ────────────────────────────────────────────────────────
  const alertBarProps = useMemo(() => {
    const total    = historyApplications.length;
    const approved = historyApplications.filter(a => a.status === 'approved').length;
    const rejected = historyApplications.filter(a => a.status === 'rejected').length;

    if (total === 0) {
      return { message: 'No processed applications yet. History will appear here after franchise applications are reviewed.', type: 'info' };
    }
    if (rejected === 0) {
      return {
        message: `All ${total} processed application${total !== 1 ? 's' : ''} were approved.`,
        type: 'success',
      };
    }
    return {
      message: `${approved} approved and ${rejected} rejected out of ${total} total processed application${total !== 1 ? 's' : ''}.`,
      type: 'info',
    };
  }, [historyApplications]);

  return (
    <div className="card inquiry-page page-fade-in">
      <div className="inquiry-header">
        <div className="inquiry-header-icon">
          <i className="fa-solid fa-clipboard-list"></i>
        </div>
        <div>
          <h2>Franchising Inquiry History</h2>
          <p>Complete record of processed (approved and rejected) franchise applications</p>
        </div>
      </div>

      <AlertBar message={alertBarProps.message} type={alertBarProps.type} />

      {/* Toolbar Search & Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search by name, email, or location..."
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
            All History ({historyApplications.length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "approved" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("approved");
              setCurrentPage(1);
            }}
          >
            Approved ({historyApplications.filter((a) => a.status === "approved").length})
          </button>
          <button
            className={`filter-chip ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("rejected");
              setCurrentPage(1);
            }}
          >
            Rejected ({historyApplications.filter((a) => a.status === "rejected").length})
          </button>
        </div>
      </div>

      <div className="franchise-cards-container">
        {franchiseLoading ? (
          <div className="empty-state-box">
            <p>Loading inquiry history...</p>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="empty-state-box">
            <i className="fa-solid fa-clock-rotate-left empty-icon"></i>
            <p>No historical records match your criteria</p>
          </div>
        ) : (
          <div className="franchise-cards-list">
            {paginatedHistory.map((application) => (
              <FranchiseCard
                key={application.id}
                avatar={`https://placehold.co/400x400/6B6FF5/FFFFFF?text=` + (application.fullName || 'F').substring(0, 1).toUpperCase()}
                name={application.fullName}
                email={application.email}
                status={(application.status || 'PROCESSED').toUpperCase()}
                contactNumber={application.phoneNumber}
                address={application.preferredBranchLocation}
                experience={application.businessExperience + " year(s)"}
                investmentCapacity={"PHP " + application.investmentCapacity}
                preferredMeetingDate={
                  application.preferredMeetingDate
                    ? new Date(application.preferredMeetingDate).toLocaleDateString()
                    : 'N/A'
                }
                additionalMessage={application.additionalMessage}
                onView={() => modalRef.current.openModal(application)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredHistory.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ApplicationModal ref={modalRef} isLoading={isLoading} showButtons={false} />
    </div>
  );
}