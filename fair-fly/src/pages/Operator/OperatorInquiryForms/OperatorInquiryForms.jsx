import { useState, useMemo } from 'react';
import CreateInquiryFormModal from '../../../components/Operator/CreateInquiryFormModal/CreateInquiryFormModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import './operator-inquiry-forms.css';

const MOCK_INQUIRY_FORMS = [
  { id: 1, title: 'General Travel Inquiry Form', fieldsCount: 5, status: 'Active', date: 'March 15, 2026' },
  { id: 2, title: 'US Visa Assessment Questionnaire', fieldsCount: 8, status: 'Active', date: 'March 18, 2026' },
  { id: 3, title: 'PSA Document Request Form', fieldsCount: 4, status: 'Active', date: 'March 22, 2026' },
];

export default function OperatorInquiryForms() {
  const [showModal, setShowModal] = useState(false);
  const [forms, setForms] = useState(MOCK_INQUIRY_FORMS);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredForms = useMemo(() => {
    return forms.filter((f) =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [forms, searchTerm]);

  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredForms.slice(start, start + pageSize);
  }, [filteredForms, currentPage, pageSize]);

  return (
    <div className="card op-inquiry page-fade-in">
      <div className="op-inquiry-header">
        <div className="op-inquiry-title">
          <i className="fa-solid fa-file-pen" style={{ color: 'var(--purple)' }}></i>
          <div>
            <h2>Inquiry Forms</h2>
            <p>Create, customize, and publish client inquiry intake forms</p>
          </div>
        </div>
        <button className="op-inquiry-btn" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus"></i>
          Create Inquiry Form
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search inquiry forms..."
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
      </div>

      {/* Forms List Container */}
      <div className="op-inquiry-list">
        {paginatedForms.length === 0 ? (
          <div className="op-inquiry-empty">
            <i className="fa-regular fa-folder-open"></i>
            <h3>No inquiry forms found</h3>
            <p>Create your first custom form for client lead intake</p>
          </div>
        ) : (
          paginatedForms.map((form) => (
            <div key={form.id} className="op-inquiry-card">
              <div className="op-inquiry-card-main">
                <div className="op-inquiry-icon">
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div>
                  <p className="op-inquiry-card-title">{form.title}</p>
                  <p className="op-inquiry-card-meta">
                    {form.fieldsCount} Fields · Created {form.date}
                  </p>
                </div>
              </div>
              <div className="op-inquiry-card-actions">
                <span className="status-pill status-pill-active">{form.status}</span>
                <button className="icon-btn edit" title="Edit Form">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredForms.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {showModal && <CreateInquiryFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
