import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import './pdf-document.css';

// Helper to safely parse requirements and remarks across all legacy and new inquiry formats
function parseInquiryData(inquiry) {
  if (!inquiry) return { requirementsList: [], requirementsText: '', remarksText: '' };

  let requirementsList = [];
  let requirementsText = '';
  let remarksText = '';

  // 1. Parse Requirements
  if (Array.isArray(inquiry.requirements)) {
    requirementsList = inquiry.requirements.map((req, idx) => {
      if (typeof req === 'string') {
        return { id: `req_${idx}`, name: req, required: true, file: null, value: '' };
      }
      if (typeof req === 'object' && req !== null) {
        return {
          id: req.id || `req_${idx}`,
          name: req.name || req.title || `Requirement ${idx + 1}`,
          required: req.required !== false,
          file: req.file || null,
          value: typeof req.value === 'object' ? JSON.stringify(req.value) : (req.value || '')
        };
      }
      return { id: `req_${idx}`, name: String(req), required: true, file: null, value: '' };
    });
  } else if (typeof inquiry.requirements === 'string' && inquiry.requirements.trim()) {
    requirementsText = inquiry.requirements.trim();
  } else if (typeof inquiry.requirements === 'object' && inquiry.requirements !== null) {
    if (inquiry.requirements.name || inquiry.requirements.title) {
      requirementsList = [{
        id: inquiry.requirements.id || 'req_0',
        name: inquiry.requirements.name || inquiry.requirements.title,
        required: inquiry.requirements.required !== false,
        file: inquiry.requirements.file || null,
        value: typeof inquiry.requirements.value === 'object' ? JSON.stringify(inquiry.requirements.value) : (inquiry.requirements.value || '')
      }];
    } else {
      requirementsText = Object.entries(inquiry.requirements)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
    }
  }

  // 2. Parse Remarks
  if (typeof inquiry.remarks === 'string' && inquiry.remarks.trim()) {
    remarksText = inquiry.remarks.trim();
  } else if (typeof inquiry.remarks === 'object' && inquiry.remarks !== null) {
    remarksText = Object.entries(inquiry.remarks)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  // 3. Fallback to notes / details (Legacy format parser: "Requirements | Remarks: ...")
  const legacyRaw = typeof inquiry.notes === 'string' ? inquiry.notes : typeof inquiry.details === 'string' ? inquiry.details : '';
  if (legacyRaw) {
    if (legacyRaw.includes(' | Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split(' | Remarks: ');
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = reqPart.trim();
      }
      if (!remarksText && remPart) {
        remarksText = remPart.trim();
      }
    } else if (legacyRaw.includes('Remarks: ')) {
      const [reqPart, remPart] = legacyRaw.split('Remarks: ');
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = reqPart.trim();
      }
      if (!remarksText && remPart) {
        remarksText = remPart.trim();
      }
    } else {
      if (!requirementsText && requirementsList.length === 0) {
        requirementsText = legacyRaw.trim();
      }
    }
  } else if (typeof inquiry.notes === 'object' && inquiry.notes !== null) {
    if (!requirementsText && requirementsList.length === 0) {
      requirementsText = Object.entries(inquiry.notes)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
    }
  }

  return {
    requirementsList,
    requirementsText: requirementsText || (requirementsList.length === 0 ? 'Standard service requirements.' : ''),
    remarksText: remarksText || 'No additional remarks recorded.'
  };
}

export default function PdfDocumentView({ isOpen, onClose, type = 'quotation', data }) {
  const printableRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !data) return null;

  const isQuotation = type === 'quotation';
  const referenceNo = isQuotation 
    ? (data.quoteNo || 'QT-001')
    : (data.formNo || 'SAF-001');

  const formattedDate = data.quotationDate 
    ? new Date(data.quotationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : data.dateInquired
      ? new Date(data.dateInquired).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const parsedInquiry = !isQuotation ? parseInquiryData(data) : null;

  const handleDownloadPdf = async () => {
    if (!printableRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const element = printableRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `FairFly_${isQuotation ? 'Quotation' : 'Inquiry'}_${referenceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF. Please use the Print button as an alternative.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-export-modal-overlay" onClick={onClose}>
      <div className="pdf-export-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar */}
        <div className="pdf-modal-header">
          <h2 className="pdf-modal-title">
            <i className={`fa-solid ${isQuotation ? 'fa-file-invoice-dollar' : 'fa-file-lines'}`} style={{ color: 'var(--purple, #7c3aed)' }}></i>
            <span>{isQuotation ? 'Quotation Document Preview' : 'Inquiry Intake Document Preview'}</span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>({referenceNo})</span>
          </h2>

          <div className="pdf-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <i className="fa-solid fa-print"></i>
              <span>Print</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.8125rem', background: 'var(--purple, #7c3aed)' }}
            >
              {isExporting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="pdf-modal-body">
          <div ref={printableRef} className="pdf-sheet">
            <div>
              {/* Header */}
              <header className="pdf-header">
                <div className="pdf-logo-wrapper">
                  <img src="/FairflyLogo.png" alt="FairFly Travel & Tours" className="pdf-logo-img" />
                </div>
                <div className="pdf-meta-box">
                  <span className="pdf-meta-ref">{referenceNo}</span>
                  <span>{formattedDate}</span>
                  {(data.branchName || data.preferredBranchLocation) && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>
                      Branch: {data.branchName || data.preferredBranchLocation}
                    </span>
                  )}
                </div>
              </header>

              {/* Document Title */}
              <h1 className="pdf-doc-title">
                {isQuotation ? 'Q U O T A T I O N' : 'I N Q U I R Y   I N T A K E'}
              </h1>

              {/* Quotation Structure */}
              {isQuotation ? (
                <table className="pdf-table">
                  <tbody>
                    <tr>
                      <th>
                        NAME OF CLIENT /<br />
                        CONTACT PERSON
                      </th>
                      <td>
                        <div className="pdf-client-name">{data.clientName || 'N/A'}</div>
                        {data.contactPerson && (
                          <div className="pdf-contact-person">{data.contactPerson}</div>
                        )}
                        {data.clientPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Tel/Mobile: {data.clientPhone}</div>
                        )}
                        {data.clientEmail && (
                          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Email: {data.clientEmail}</div>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th>REQUIREMENTS</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {typeof data.requirements === 'string' ? data.requirements : data.serviceTitle || 'Standard Tour / Transport Service'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th>TOUR DATE / ITINERARY:</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {data.tourDates || 'As agreed with client'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th>INCLUSIONS:</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {data.inclusions || 'Standard service inclusions'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th>EXCLUSIONS:</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {data.exclusions || 'Toll fees, personal expenses, and incidental items'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th>RATE / BREAKDOWN:</th>
                      <td>
                        {data.rateBreakdown ? (
                          <div style={{ fontWeight: 600 }}>{data.rateBreakdown}</div>
                        ) : (
                          <div>PHP {Number(data.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th>TOTAL AMOUNT:</th>
                      <td>
                        <div className="pdf-rate-highlight">
                          PHP {Number(data.totalAmount || data.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th>REMARKS:</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {data.remarks || '- Initial payment upon reservation confirmation\n- Full payment on or before service commencement'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Inquiry Intake Structure */
                <table className="pdf-table">
                  <tbody>
                    <tr>
                      <th>CLIENT INFORMATION</th>
                      <td>
                        <div className="pdf-client-name">{data.fullName || data.clientName || 'N/A'}</div>
                        <div><strong>Contact Person:</strong> {data.contactPerson || data.fullName || 'N/A'}</div>
                        <div><strong>Phone:</strong> {data.phoneNumber || data.cellphone || 'N/A'} {data.telNo ? `· Tel: ${data.telNo}` : ''}</div>
                        <div><strong>Email:</strong> {data.email || 'N/A'}</div>
                        <div><strong>Address:</strong> {data.address || 'N/A'}</div>
                        {data.population && <div><strong>Pax Count:</strong> {data.population}</div>}
                      </td>
                    </tr>

                    <tr>
                      <th>SERVICE REQUESTED</th>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#111827', marginBottom: '0.25rem' }}>
                          {data.serviceType || data.serviceTitle || 'General Inquiry'}
                        </div>
                        {data.servicePrice && (
                          <div style={{ fontSize: '0.8125rem', color: '#6366f1', fontWeight: 600 }}>
                            Fee / Price: {data.servicePrice}
                          </div>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th>REQUIREMENTS CHECKLIST</th>
                      <td>
                        {parsedInquiry?.requirementsList && parsedInquiry.requirementsList.length > 0 ? (
                          <ul className="pdf-bullet-list">
                            {parsedInquiry.requirementsList.map((req, idx) => {
                              const reqName = req.name || `Requirement ${idx + 1}`;
                              const isFulfilled = Boolean(req.file?.url || req.value);
                              return (
                                <li key={idx}>
                                  <strong>{reqName}</strong> — {isFulfilled ? '✓ Verified / Submitted' : 'Pending Document'}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="pdf-multiline-text">{parsedInquiry?.requirementsText || 'Standard client requirements'}</div>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th>REMARKS & INTERNAL NOTES</th>
                      <td>
                        <div className="pdf-multiline-text">
                          {parsedInquiry?.remarksText || 'No additional notes provided.'}
                        </div>
                      </td>
                    </tr>

                    {data.customFields && typeof data.customFields === 'object' && Object.keys(data.customFields).length > 0 && (
                      <tr>
                        <th>ADDITIONAL SPECIFICATIONS</th>
                        <td>
                          {Object.entries(data.customFields).map(([k, v]) => (
                            <div key={k}>
                              <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Prepared By Section */}
              <div className="pdf-sign-off-section">
                <div className="pdf-prepared-by-box">
                  <span className="pdf-prepared-label">Prepared by:</span>
                  <span className="pdf-signature-line">
                    {data.preparedByName || data.preparedBy || data.agentName || 'Emmanuel Manlapig'}
                  </span>
                  <span className="pdf-prepared-name">
                    {data.preparedByName || data.preparedBy || data.agentName || 'Emmanuel Manlapig'}
                  </span>
                  <span className="pdf-prepared-title">
                    {data.preparedByTitle || 'Business Head'}
                  </span>
                  {(data.preparedByContact || data.agentContact) && (
                    <span className="pdf-prepared-contact">
                      {data.preparedByContact || data.agentContact}
                    </span>
                  )}
                </div>

                {data.acknowledgedBy && (
                  <div className="pdf-prepared-by-box" style={{ textAlign: 'right' }}>
                    <span className="pdf-prepared-label">Acknowledged by:</span>
                    <span className="pdf-signature-line">{data.acknowledgedBy}</span>
                    <span className="pdf-prepared-name">{data.acknowledgedBy}</span>
                    <span className="pdf-prepared-title">Supervisor / Manager</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Matching Attached PDF */}
            <footer className="pdf-footer">
              <div className="pdf-accreditation-box">
                <span className="pdf-accreditation-code">ADF-07-001</span>
                <span style={{ fontSize: '0.675rem', color: '#6b7280' }}>DOT Accredited Travel & Tours</span>
              </div>
              <div className="pdf-address-box">
                <div>Unit 35 A Square Mall Brgy. Pinagbarilan Baliuag 3006 Bulacan</div>
                <div>Telephone No. +63 (44) 813 3801</div>
                <div>fairflytravel19@yahoo.com</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
