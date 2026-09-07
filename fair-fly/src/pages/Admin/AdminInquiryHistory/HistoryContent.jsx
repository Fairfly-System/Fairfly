import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';
import { SkeletonTable } from '../../../components/UI/Skeleton/Skeleton';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import useDebounce from '../../../hooks/useDebounce';
import InquiryFormBuilderModal from '../../../components/Admin/Modals/InquiryFormBuilderModal/InquiryFormBuilderModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import './admin-inquiry-history.css';

export default function HistoryContent() {
  const navigate = useNavigate();
  const { data: rawInquiries, loading } = useAdminContext();

  // Search, Branch & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Modals state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [pdfModalData, setPdfModalData] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const inquiries = useMemo(() => {
    return Array.isArray(rawInquiries) ? rawInquiries : [];
  }, [rawInquiries]);

  // Extract unique branches from inquiries
  const uniqueBranches = useMemo(() => {
    const branches = new Set();
    inquiries.forEach((inq) => {
      const bName = inq.branchName || inq.preferredBranchLocation;
      if (bName && bName.trim()) {
        branches.add(bName.trim());
      }
    });
    return Array.from(branches).sort();
  }, [inquiries]);

  // KPIs
  const totalCount = inquiries.length;
  const confirmedCount = inquiries.filter((i) => (i.status || '').toLowerCase() === 'confirmed').length;
  const pendingCount = inquiries.filter((i) => (i.status || '').toLowerCase() === 'pending').length;
  const branchCount = uniqueBranches.length;

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const q = debouncedSearch.toLowerCase();
      const client = (inq.fullName || inq.clientName || '').toLowerCase();
      const contact = (inq.contactPerson || '').toLowerCase();
      const phone = (inq.phoneNumber || inq.cellphone || '').toLowerCase();
      const email = (inq.email || '').toLowerCase();
      const service = (inq.serviceType || '').toLowerCase();
      const formNo = (inq.formNo || '').toLowerCase();
      const branch = (inq.branchName || inq.preferredBranchLocation || '').toLowerCase();

      const matchesSearch =
        !q ||
        client.includes(q) ||
        contact.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        service.includes(q) ||
        formNo.includes(q) ||
        branch.includes(q);

      const inqStatus = (inq.status || 'pending').toLowerCase();
      const matchesStatus = statusFilter === 'all' || inqStatus === statusFilter.toLowerCase();

      const inqBranch = inq.branchName || inq.preferredBranchLocation || '';
      const matchesBranch = selectedBranch === 'all' || inqBranch === selectedBranch;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [inquiries, debouncedSearch, statusFilter, selectedBranch]);

  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInquiries.slice(start, start + pageSize);
  }, [filteredInquiries, currentPage, pageSize]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Inquiry Requests History' },
  ];

  return (
    <main className="inquiry-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Service Inquiry Requests History"
        subtitle="Centralized single source of truth for all client inquiries categorized across branches"
        illustrationSrc="/pageImages/admin/inquiry-history.png"
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowBuilderModal(true)}
          style={{ background: 'var(--purple, #7c3aed)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <i className="fa-solid fa-sliders"></i>
          <span>Customize Inquiry Form</span>
        </button>
      </PageHeader>

      {/* KPI Metrics */}
      <section className="services-summary-grid">
        <KpiCard
          title="Total Inquiries"
          value={totalCount}
          icon="fa-solid fa-file-lines"
          iconColor="var(--purple, #7c3aed)"
          isLoading={loading}
        />
        <KpiCard
          title="Confirmed & Transferred"
          value={confirmedCount}
          icon="fa-regular fa-circle-check"
          iconColor="var(--complete-green-dark, #059669)"
          isLoading={loading}
        />
        <KpiCard
          title="Pending Inquiries"
          value={pendingCount}
          icon="fa-regular fa-clock"
          iconColor="var(--amber, #d97706)"
          isLoading={loading}
        />
        <KpiCard
          title="Active Branches"
          value={branchCount}
          icon="fa-solid fa-code-branch"
          iconColor="var(--indigo, #4f46e5)"
          isLoading={loading}
        />
      </section>

      {/* Main Table Card */}
      <section className="card inquiry-table-card">
        {/* Toolbar */}
        <div className="inquiry-toolbar-row">
          <div className="search-box" style={{ maxWidth: '24rem', flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by client, service, branch, or form no..."
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
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="inquiry-branch-select-box">
            <label className="inquiry-branch-label">
              <i className="fa-solid fa-code-branch"></i> Branch:
            </label>
            <select
              className="inquiry-branch-select"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Branches ({totalCount})</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <FilterChipGroup
            chips={[
              { value: 'all', label: `All (${totalCount})` },
              { value: 'confirmed', label: `Confirmed (${confirmedCount})` },
              { value: 'pending', label: `Pending (${pendingCount})` },
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Inquiries Table */}
        <div className="inquiry-table-responsive">
          <table className="inquiry-data-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>Form No. / Date</th>
                <th>Client / Company Name</th>
                <th>Service Requested</th>
                <th>Branch Received From</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable columns={6} rows={5} />
              ) : paginatedInquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="empty-state-box">
                      <i className="fa-solid fa-file-circle-question empty-icon"></i>
                      <p>No inquiry records match your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInquiries.map((inq) => {
                  const statusLower = (inq.status || 'pending').toLowerCase();
                  let statusPillClass = 'status-pill status-pill-pending';
                  if (['confirmed', 'accepted', 'completed', 'active'].includes(statusLower)) {
                    statusPillClass = 'status-pill status-pill-active';
                  } else if (['cancelled', 'rejected'].includes(statusLower)) {
                    statusPillClass = 'status-pill status-pill-disabled';
                  }

                  return (
                    <tr key={inq.id}>
                      <td>
                        <div className="inquiry-form-meta">
                          <span className="inquiry-form-code">
                            <i className="fa-solid fa-file-lines"></i>
                            {inq.formNo || 'SAF-01'}
                          </span>
                          <span className="inquiry-date-sub">
                            <i className="fa-regular fa-calendar"></i>
                            {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="inquiry-client-meta">
                          <strong className="inquiry-client-name">
                            {inq.fullName || inq.clientName || 'Anonymous Client'}
                          </strong>
                          {(inq.email || inq.phoneNumber || inq.cellphone) && (
                            <span className="inquiry-client-sub">
                              <i className={inq.email ? 'fa-regular fa-envelope' : 'fa-solid fa-phone'}></i>
                              {inq.email || inq.phoneNumber || inq.cellphone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inquiry-service-badge">
                          <i className="fa-solid fa-briefcase"></i>
                          {inq.serviceType || 'General Travel Service'}
                        </span>
                      </td>
                      <td>
                        <span className="branch-tag">
                          <i className="fa-solid fa-building"></i>
                          {inq.branchName || 'FairFly Main'}
                        </span>
                      </td>
                      <td>
                        <span className={statusPillClass} style={{ textTransform: 'capitalize' }}>
                          {inq.status || 'Pending'}
                        </span>
                      </td>
                      <td className="actions-col" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="icon-btn pdf"
                            onClick={() => setPdfModalData(inq)}
                            title="Export PDF (SAF-01)"
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                          </button>

                          <button
                            type="button"
                            className="icon-btn view"
                            onClick={() => navigate(`/admin/inquiry-history/${inq.id}`)}
                            title="View Inquiry Record"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </div>
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
          totalItems={filteredInquiries.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Dynamic Form Builder Modal for Admin */}
      <InquiryFormBuilderModal
        isOpen={showBuilderModal}
        onClose={() => setShowBuilderModal(false)}
      />

      {/* PDF Export Preview Modal */}
      <PdfDocumentView
        isOpen={Boolean(pdfModalData)}
        onClose={() => setPdfModalData(null)}
        type="inquiry"
        data={pdfModalData}
      />
    </main>
  );
}