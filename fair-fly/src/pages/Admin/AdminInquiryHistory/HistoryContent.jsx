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
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
              <i className="fa-solid fa-code-branch" style={{ color: 'var(--purple)', marginRight: '0.25rem' }}></i> Branch:
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
                <th>Requirements</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable columns={7} rows={5} />
              ) : paginatedInquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="empty-state-box" style={{ border: 'none', margin: 0, padding: 0 }}>
                      <i className="fa-solid fa-file-circle-question empty-icon"></i>
                      <p>No inquiry records match your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInquiries.map((inq) => {
                  const isConf = (inq.status || '').toLowerCase() === 'confirmed';
                  const reqs = Array.isArray(inq.requirements) ? inq.requirements : [];
                  const uploadedCount = reqs.filter(r => r.file?.url || r.value).length;
                  const totalReqs = reqs.length;

                  return (
                    <tr key={inq.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                            {inq.formNo || 'SAF-01'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--text-dark)' }}>
                            {inq.fullName || inq.clientName || 'Anonymous Client'}
                          </strong>
                          {inq.email && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              {inq.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--purple)' }}>
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
                        <span className="req-count-badge">
                          <i className="fa-solid fa-paperclip"></i>
                          {uploadedCount} / {totalReqs} Files
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${isConf ? 'status-pill-active' : 'status-pill-pending'}`}>
                          {inq.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setPdfModalData(inq)}
                            title="Export PDF"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`/admin/inquiry-history/${inq.id}`)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--purple)' }}
                          >
                            <span>View</span>
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