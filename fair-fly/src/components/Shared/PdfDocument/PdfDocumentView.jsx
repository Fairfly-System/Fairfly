import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import './pdf-document.css';

// Standard official service categories listed on SAF-01-002
const OFFICIAL_SERVICES = [
  'NSO',
  'Passport',
  'VISA Assistance',
  'Package Tour',
  'Ticket',
  'Others'
];

/**
 * Normalizes inquiry data for rendering in the SAF-01-002 inquiry form
 */
function normalizeInquiryPdfData(data) {
  if (!data) return {};

  const servicesOffered = Array.isArray(data.servicesOffered)
    ? data.servicesOffered
    : (data.serviceType ? [data.serviceType] : []);

  // Normalize specified requirements of client
  let specifiedReqs = '';
  if (typeof data.specifiedRequirements === 'string' && data.specifiedRequirements.trim()) {
    specifiedReqs = data.specifiedRequirements.trim();
  } else if (typeof data.requirements === 'string' && data.requirements.trim()) {
    specifiedReqs = data.requirements.trim();
  } else if (Array.isArray(data.requirements) && data.requirements.length > 0) {
    specifiedReqs = data.requirements
      .map(r => typeof r === 'string' ? `• ${r}` : `• ${r.name || r.title || 'Requirement'}${r.value ? `: ${r.value}` : ''}`)
      .join('\n');
  } else if (data.notes) {
    specifiedReqs = String(data.notes).trim();
  }

  // Normalize remarks
  let remarksText = '';
  if (typeof data.remarks === 'string' && data.remarks.trim()) {
    remarksText = data.remarks.trim();
  } else if (typeof data.notes === 'string' && data.notes.trim() && data.notes !== specifiedReqs) {
    remarksText = data.notes.trim();
  }

  return {
    clientName: data.clientName || data.fullName || 'N/A',
    address: data.address || '',
    contactPerson: data.contactPerson || data.fullName || '',
    telNo: data.telNo || '',
    cellphone: data.cellphone || data.phoneNumber || '',
    email: data.email || '',
    population: data.population || '',
    contractNo: data.contractNo || '',
    isNo: data.isNo || '',
    dateInquired: data.dateInquired || (data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : ''),
    servicesOffered,
    specifiedRequirements: specifiedReqs || 'No specified requirements recorded.',
    remarks: remarksText || '',
    agentName: data.agentName || data.preparedByName || 'Agent',
    agentSignature: data.agentSignature || '',
    acknowledgedBy: data.acknowledgedBy || '',
    acknowledgedSignature: data.acknowledgedSignature || '',
    branchName: data.branchName || 'Fairfly-Baliuag',
    formNo: data.formNo || 'SAF-01-002',
    controlNo: data.controlNo || '23-001'
  };
}

/**
 * Normalizes quotation data for rendering in the ADF-07-001 quotation form
 */
function normalizeQuotationPdfData(data) {
  if (!data) return {};

  let requirementsText = '';
  if (typeof data.requirements === 'string' && data.requirements.trim()) {
    requirementsText = data.requirements.trim();
  } else if (Array.isArray(data.requirements)) {
    requirementsText = data.requirements
      .map(r => typeof r === 'string' ? `• ${r}` : `• ${r.name || r.title || 'Requirement'}`)
      .join('\n');
  } else if (data.specifiedRequirements) {
    requirementsText = String(data.specifiedRequirements).trim();
  }

  return {
    quoteNo: data.quoteNo || 'QT-001',
    quotationDate: data.quotationDate || (data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : ''),
    clientName: data.clientName || 'N/A',
    contactPerson: data.contactPerson || '',
    requirements: requirementsText,
    tourDates: data.tourDates || '',
    inclusions: data.inclusions || '',
    exclusions: data.exclusions || '',
    rateBreakdown: data.rateBreakdown || (data.rate ? `Php ${Number(data.rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''),
    rate: Number(data.rate || 0),
    totalAmount: Number(data.totalAmount || data.rate || 0),
    remarks: data.remarks || '',
    preparedByName: data.preparedByName || data.preparedBy || 'Emmanuel Manlapig',
    preparedByTitle: data.preparedByTitle || 'Business Head',
    preparedByContact: data.preparedByContact || '0997 4763844'
  };
}

export default function PdfDocumentView({ isOpen, onClose, type = 'quotation', data }) {
  const printableRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !data) return null;

  const isQuotation = type === 'quotation';
  const inquiryData = !isQuotation ? normalizeInquiryPdfData(data) : null;
  const quotationData = isQuotation ? normalizeQuotationPdfData(data) : null;

  const referenceNo = isQuotation 
    ? quotationData.quoteNo 
    : `${inquiryData.formNo} (${inquiryData.controlNo})`;

  const formattedDocDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const element = printableRef.current;
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `FairFly_${isQuotation ? 'Quotation' : 'Inquiry'}_${(isQuotation ? quotationData.quoteNo : inquiryData.controlNo).replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF automatically. Please use the Print button to print or save as PDF.');
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
            <span>{isQuotation ? 'Quotation Document Preview' : 'Official Inquiry Form Preview'}</span>
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
            {isQuotation ? (
              /* ============================================================ */
              /* OFFICIAL FAIRFLY QUOTATION (ADF-07-001)                      */
              /* ============================================================ */
              <div className="quotation-pdf-container">
                {/* Header with Logo and Date */}
                <div className="quotation-pdf-top">
                  <div className="pdf-logo-wrapper">
                    <img src="/FairflyLogo.png" alt="FairFly Travel & Tours" className="pdf-logo-img" />
                  </div>
                  <div className="quotation-date-text">
                    {formattedDocDate(quotationData.quotationDate)}
                  </div>
                </div>

                <h1 className="quotation-pdf-title">Q U O T A T I O N</h1>

                {/* 2-Column Bordered Table */}
                <table className="quotation-table">
                  <tbody>
                    <tr>
                      <th className="quotation-th">
                        NAME OF CLIENT/ <br />
                        CONTACT PERSON
                      </th>
                      <td className="quotation-td">
                        <div className="quotation-bold-text">{quotationData.clientName}</div>
                        {quotationData.contactPerson && (
                          <div>{quotationData.contactPerson}</div>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">REQUIREMENTS</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.requirements || 'Standard service requirements'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">TOUR DATE:</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.tourDates || 'As agreed with client'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">INCLUSIONS:</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.inclusions || 'Standard service package inclusions'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">EXCLUSIONS:</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.exclusions || 'Toll Fee, personal expenses, and incidental items'}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">RATE:</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.rateBreakdown || `Php ${quotationData.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">TOTAL AMOUNT:</th>
                      <td className="quotation-td">
                        <div className="quotation-bold-text">
                          Php {quotationData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="quotation-th">REMARKS:</th>
                      <td className="quotation-td">
                        <div className="quotation-multiline">
                          {quotationData.remarks || '- Initial payment upon confirmation\n- Full payment on or before tour commencement'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Sign-off */}
                <div className="quotation-prepared-by-block">
                  <div className="prepared-label">Prepared by:</div>
                  <div className="prepared-sig-space"></div>
                  <div className="prepared-name">{quotationData.preparedByName}</div>
                  <div className="prepared-sub">{quotationData.preparedByTitle}</div>
                  {quotationData.preparedByContact && (
                    <div className="prepared-sub">{quotationData.preparedByContact}</div>
                  )}
                </div>

                {/* Official Footer with DOT Accreditation */}
                <div className="quotation-pdf-footer">
                  <div className="quotation-accreditation">
                    <div className="dot-badge-icon">
                      <i className="fa-solid fa-certificate"></i> ACCREDITED
                    </div>
                    <div className="accreditation-code">ADF-07-001</div>
                  </div>
                  <div className="quotation-address">
                    <div>Unit 35 A Square Mall Brgy. Pinagbarilan Baliuag 3006 Bulacan</div>
                    <div>Telephone. No. +63 (44) 813 3801</div>
                    <div>fairflytravel19@yahoo.com</div>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* OFFICIAL INQUIRY FORM (SAF-01-002)                           */
              /* ============================================================ */
              <div className="inquiry-official-form">
                {/* Top Header */}
                <div className="inquiry-form-header">
                  <div className="inquiry-form-brand">
                    <img src="/FairflyLogo.png" alt="FairFly Travel & Tours" className="inquiry-brand-logo" />
                  </div>
                  <div className="inquiry-form-center-title">
                    INQUIRY FORM
                  </div>
                  <div className="inquiry-control-box">
                    <div className="inquiry-control-row">
                      <span className="ctrl-label">Form No.:</span>
                      <span className="ctrl-val">{inquiryData.formNo}</span>
                    </div>
                    <div className="inquiry-control-row highlight">
                      <span className="ctrl-label">Control No.:</span>
                      <span className="ctrl-val">{inquiryData.controlNo}</span>
                    </div>
                  </div>
                </div>

                {/* Client Profile Table Grid */}
                <table className="inquiry-info-table">
                  <tbody>
                    <tr>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">Name of Client/Company:</span>
                        <span className="cell-value bold">{inquiryData.clientName}</span>
                      </td>
                      <td className="info-cell">
                        <span className="cell-label">Population:</span>
                        <span className="cell-value">{inquiryData.population}</span>
                      </td>
                      <td className="info-cell">
                        <span className="cell-label">Date Inquired:</span>
                        <span className="cell-value">{inquiryData.dateInquired}</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">Address:</span>
                        <span className="cell-value">{inquiryData.address}</span>
                      </td>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">Tel No.:</span>
                        <span className="cell-value">{inquiryData.telNo}</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">Contact Person:</span>
                        <span className="cell-value">{inquiryData.contactPerson}</span>
                      </td>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">Cellphone No.:</span>
                        <span className="cell-value">{inquiryData.cellphone}</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="info-cell" colSpan="2">
                        <span className="cell-label">E-mail Address:</span>
                        <span className="cell-value">{inquiryData.email}</span>
                      </td>
                      <td className="info-cell">
                        <span className="cell-label">Contract No.</span>
                        <span className="cell-value">{inquiryData.contractNo}</span>
                      </td>
                      <td className="info-cell">
                        <span className="cell-label">I.S. No.</span>
                        <span className="cell-value">{inquiryData.isNo}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 3-Column Table: Services Offered | Specified Requirements of Client | Remarks */}
                <table className="inquiry-spec-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Services Offered:</th>
                      <th style={{ width: '50%' }}>Specified Requirements of Client</th>
                      <th style={{ width: '25%' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {/* Services Offered Checkboxes */}
                      <td className="services-checkboxes-cell">
                        <div className="services-check-list">
                          {OFFICIAL_SERVICES.map((srv) => {
                            const isSelected = inquiryData.servicesOffered.some((s) => {
                              const cleanS = String(s).toLowerCase();
                              const cleanTarget = srv.toLowerCase();
                              if (cleanTarget === 'others') {
                                return !OFFICIAL_SERVICES.slice(0, 5).some(o => cleanS.includes(o.toLowerCase()));
                              }
                              return cleanS.includes(cleanTarget);
                            });

                            return (
                              <div key={srv} className="pdf-check-item">
                                <span className={`pdf-check-box ${isSelected ? 'checked' : ''}`}>
                                  {isSelected ? <i className="fa-solid fa-check" style={{ fontSize: '9px' }}></i> : ''}
                                </span>
                                <span className="pdf-check-label">{srv}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Specified Requirements of Client */}
                      <td className="spec-reqs-cell">
                        <div className="spec-reqs-content">
                          {inquiryData.specifiedRequirements}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="remarks-cell">
                        <div className="remarks-content">
                          {inquiryData.remarks}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Sign-off Bottom Row */}
                <table className="inquiry-sign-table">
                  <tbody>
                    <tr>
                      <td className="sign-cell" style={{ width: '50%' }}>
                        <div className="sign-title">Agent:</div>
                        <div className="sign-signature-area">
                          {inquiryData.agentSignature ? (
                            <span className="sign-digital">{inquiryData.agentSignature}</span>
                          ) : (
                            <span className="sign-placeholder">{inquiryData.agentName}</span>
                          )}
                        </div>
                        <div className="sign-sub">Name/Signature</div>
                      </td>
                      <td className="sign-cell" style={{ width: '50%' }}>
                        <div className="sign-title">Acknowledged by:</div>
                        <div className="sign-signature-area">
                          {inquiryData.acknowledgedSignature ? (
                            <span className="sign-digital">{inquiryData.acknowledgedSignature}</span>
                          ) : (
                            <span className="sign-placeholder">{inquiryData.acknowledgedBy}</span>
                          )}
                        </div>
                        <div className="sign-sub">Name/Signature</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Branch attribution footer */}
                <div className="inquiry-form-footer">
                  <span>{inquiryData.branchName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

