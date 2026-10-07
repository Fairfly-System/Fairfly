import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';
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

  // Normalize client remarks
  let remarksText = '';
  if (typeof data.clientRemarks === 'string' && data.clientRemarks.trim()) {
    remarksText = data.clientRemarks.trim();
  } else if (typeof data.remarks === 'string' && data.remarks.trim()) {
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
      .filter((r) => {
        const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
        return name !== 'specified requirements of client' &&
               name !== 'client specified requirements' &&
               name !== 'specified requirements of the client' &&
               name !== 'specified requirements';
      })
      .map(r => typeof r === 'string' ? `• ${r}` : `• ${r.name || r.title || 'Requirement'}`)
      .join('\n');
  }

  const operatorRemarks = (typeof data.operatorRemarks === 'string' && data.operatorRemarks.trim())
    ? data.operatorRemarks.trim()
    : (typeof data.remarks === 'string' && data.remarks.trim() ? data.remarks.trim() : '');

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
    remarks: operatorRemarks || '',
    preparedByName: data.preparedByName || data.preparedBy || 'Emmanuel Manlapig',
    preparedByTitle: data.preparedByTitle || 'Business Head',
    preparedByContact: data.preparedByContact || '0997 4763844'
  };
}

/**
 * Normalizes official E-Receipt data for rendering in the ADF-07-002 receipt form
 */
function normalizeReceiptPdfData(data) {
  if (!data) return {};

  const totalAmountNum = Number(data.amount || data.totalAmount || data.rate || 0);
  const rawMethod = data.paymentMethod || data.paymentMethodType || (data.provider === 'cash' ? 'Cash' : 'Online (PayMongo)');
  const normalizedMethod = (typeof rawMethod === 'string' && rawMethod.toLowerCase().includes('cash'))
    ? 'Direct Cash (Counter Receipt)'
    : (rawMethod || 'Online Payment Gateway');

  const resolvedQuoteNo = data.quoteNo || data.quotation?.quoteNo || (data.quotationId ? (String(data.quotationId).startsWith('QT-') ? String(data.quotationId) : `QT-${String(data.quotationId).substring(0, 8)}`) : '');
  const resolvedPaymentId = data.paymentId || data.paymentRef || data.providerPaymentId || (data.receiptNo ? `PAY-${data.receiptNo.replace('RCT-', '')}` : '');

  const resolvedClientName = (data.clientName && data.clientName !== 'Valued Client')
    ? data.clientName
    : (data.fullName || data.customerName || data.quotation?.clientName || data.payerName || data.clientName || 'Valued Client');

  return {
    receiptNo: data.receiptNo || 'RCT-2026-OFFICIAL',
    receiptId: data.receiptId || data.id || '',
    formNo: data.formNo || 'ADF-07-002',
    serviceCode: data.serviceCode || data.trackingReference || 'SRV-2026-OFFICIAL',
    fulfillmentId: data.fulfillmentId || data.activeServiceId || 'SVC-PENDING',
    quotationId: data.quotationId || data.quotation?.id || '',
    quoteNo: resolvedQuoteNo,
    paymentId: resolvedPaymentId,
    providerPaymentId: data.providerPaymentId || '',
    clientName: resolvedClientName,
    clientEmail: data.clientEmail || data.email || data.quotation?.clientEmail || '',
    clientPhone: data.clientPhone || data.phoneNumber || data.cellphone || data.quotation?.clientPhone || '',
    contactPerson: data.contactPerson || data.quotation?.contactPerson || '',
    serviceTitle: data.serviceTitle || data.serviceType || data.quotation?.serviceTitle || 'Travel & Tour Package',
    description: data.description || data.remarks || data.quotation?.remarks || 'Standard tour & travel service fulfillment',
    tourDates: data.tourDates || data.quotation?.tourDates || 'As arranged with client',
    inclusions: data.inclusions || data.quotation?.inclusions || '',
    exclusions: data.exclusions || data.quotation?.exclusions || '',
    rateBreakdown: data.rateBreakdown || data.quotation?.rateBreakdown || '',
    rate: Number(data.rate || data.quotation?.rate || totalAmountNum),
    taxAmount: Number(data.taxAmount || data.quotation?.taxAmount || 0),
    totalAmount: totalAmountNum,
    currency: data.currency || 'PHP',
    paymentMethod: normalizedMethod,
    status: (data.status || data.paymentStatus || 'PAID').toUpperCase(),
    issuedAt: data.issuedAt || data.paidAt || data.createdAt || new Date().toISOString(),
    paidAt: data.paidAt || data.issuedAt || data.createdAt || new Date().toISOString(),
    branchName: data.branchName || data.quotation?.branchName || 'FairFly Travel & Tours - Baliuag Branch',
    receivedByOperatorName: data.receivedByOperatorName || data.preparedByName || data.preparedBy || data.quotation?.preparedByName || data.quotation?.preparedBy || 'Emmanuel Manlapig',
    qrTrackingUrl: data.qrTrackingUrl || '',
    qrCodeDataUrl: data.qrCodeDataUrl || '',
    businessName: data.businessName || 'FairFly Travel & Tours',
    legalNotice: data.legalNotice || 'This electronic receipt is an official acknowledgment of payment received by FairFly Travel and Tours.'
  };
}

export default function PdfDocumentView({ isOpen, onClose, type = 'quotation', data }) {
  const printableRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedQr, setGeneratedQr] = useState(null);

  const isQuotation = type === 'quotation';
  const isReceipt = type === 'receipt';
  const isInquiry = !isQuotation && !isReceipt;

  const inquiryData = isInquiry ? normalizeInquiryPdfData(data) : null;
  const quotationData = isQuotation ? normalizeQuotationPdfData(data) : null;
  const receiptData = isReceipt ? normalizeReceiptPdfData(data) : null;

  // Prevent background body scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Dynamically generate QR code if missing in receipt payload
  useEffect(() => {
    if (isReceipt && receiptData) {
      if (receiptData.qrCodeDataUrl) {
        setGeneratedQr(receiptData.qrCodeDataUrl);
      } else {
        const frontendBaseUrl = window.location.origin || 'http://localhost:5173';
        const targetCode = receiptData.serviceCode || receiptData.fulfillmentId || receiptData.receiptNo;
        const trackingUrl = `${frontendBaseUrl}/track?trackingId=${encodeURIComponent(targetCode)}`;
        
        QRCode.toDataURL(trackingUrl, {
          margin: 1,
          width: 256,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        })
          .then((url) => setGeneratedQr(url))
          .catch((err) => console.warn('[PdfDocumentView] QR generation failed:', err));
      }
    }
  }, [isReceipt, receiptData?.serviceCode, receiptData?.qrCodeDataUrl]);

  if (!isOpen || !data) return null;

  const referenceNo = isReceipt
    ? receiptData.receiptNo
    : isQuotation 
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

  const formattedDateTime = (dateStr) => {
    if (!dateStr) return new Date().toLocaleString('en-US');
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const element = printableRef.current;
      const docTypePrefix = isReceipt ? 'Receipt' : isQuotation ? 'Quotation' : 'Inquiry';
      const fileCode = isReceipt
        ? receiptData.receiptNo
        : isQuotation
        ? quotationData.quoteNo
        : inquiryData.controlNo;

      const opt = {
        margin: [4, 4, 4, 4],
        filename: `FairFly_${docTypePrefix}_${(fileCode || 'Document').replace(/\s+/g, '_')}.pdf`,
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

  return createPortal(
    <div className="pdf-export-modal-overlay" onClick={onClose}>
      <div className="pdf-export-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar */}
        <div className="pdf-modal-header">
          <h2 className="pdf-modal-title">
            <i
              className={`fa-solid ${
                isReceipt
                  ? 'fa-receipt'
                  : isQuotation
                  ? 'fa-file-invoice-dollar'
                  : 'fa-file-lines'
              }`}
              style={{ color: 'var(--purple, #7c3aed)' }}
            ></i>
            <span>
              {isReceipt
                ? 'Official E-Receipt Preview'
                : isQuotation
                ? 'Quotation Document Preview'
                : 'Official Inquiry Form Preview'}
            </span>
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
              aria-label="Close Preview"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="pdf-modal-body">
          <div ref={printableRef} className="pdf-sheet">
            {isReceipt ? (
              /* ============================================================ */
              /* OFFICIAL FAIRFLY E-RECEIPT (ADF-07-002 / RCT)                */
              /* ============================================================ */
              <div className="receipt-pdf-container">
                {/* Top Header Row with Branding & Official Receipt Badge */}
                <div className="receipt-pdf-top">
                  <div className="pdf-logo-wrapper">
                    <img src="/FairflyLogo.png" alt="FairFly Travel & Tours" className="pdf-logo-img" />
                    <span className="receipt-brand-tagline">Your Trusted Gateway to Seamless Journeys</span>
                  </div>
                  <div className="receipt-badge-block">
                    <div className="receipt-main-badge">OFFICIAL E-RECEIPT</div>
                    <div className="receipt-no-tag">{receiptData.receiptNo}</div>
                    <div className="receipt-form-code">Form Code: {receiptData.formNo}</div>
                  </div>
                </div>

                {/* Receipt Metadata Ribbon */}
                <div className="receipt-ribbon-grid">
                  <div className="ribbon-col">
                    <span className="ribbon-label">Date & Time Issued:</span>
                    <strong className="ribbon-val">{formattedDateTime(receiptData.issuedAt)}</strong>
                  </div>
                  <div className="ribbon-col">
                    <span className="ribbon-label">Payment Channel:</span>
                    <strong className="ribbon-val">{receiptData.paymentMethod}</strong>
                  </div>
                  <div className="ribbon-col">
                    <span className="ribbon-label">Payment Status:</span>
                    <span className="receipt-status-confirmed">
                      <i className="fa-solid fa-circle-check"></i> {receiptData.status}
                    </span>
                  </div>
                </div>

                {/* 2-Column Info Section: Billed Client & Payment Details */}
                <div className="receipt-two-col-grid">
                  <div className="receipt-col-card">
                    <div className="col-card-title">
                      <i className="fa-solid fa-user-check"></i>
                      <span>Billed & Issued To</span>
                    </div>
                    <div className="col-card-body">
                      <div className="receipt-info-row">
                        <span className="info-k">Client / Company:</span>
                        <span className="info-v font-bold">{receiptData.clientName}</span>
                      </div>
                      {receiptData.contactPerson && (
                        <div className="receipt-info-row">
                          <span className="info-k">Contact Person:</span>
                          <span className="info-v">{receiptData.contactPerson}</span>
                        </div>
                      )}
                      {receiptData.clientEmail && (
                        <div className="receipt-info-row">
                          <span className="info-k">Email Address:</span>
                          <span className="info-v">{receiptData.clientEmail}</span>
                        </div>
                      )}
                      {receiptData.clientPhone && (
                        <div className="receipt-info-row">
                          <span className="info-k">Contact Phone:</span>
                          <span className="info-v">{receiptData.clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="receipt-col-card">
                    <div className="col-card-title">
                      <i className="fa-solid fa-building-flag"></i>
                      <span>Transaction & Branch Details</span>
                    </div>
                    <div className="col-card-body">
                      <div className="receipt-info-row">
                        <span className="info-k">Handling Branch:</span>
                        <span className="info-v">{receiptData.branchName}</span>
                      </div>
                      <div className="receipt-info-row">
                        <span className="info-k">Received By:</span>
                        <span className="info-v">{receiptData.receivedByOperatorName}</span>
                      </div>
                      {receiptData.quoteNo && (
                        <div className="receipt-info-row">
                          <span className="info-k">Quotation Ref:</span>
                          <span className="info-v text-mono">{receiptData.quoteNo}</span>
                        </div>
                      )}
                      {receiptData.paymentId && (
                        <div className="receipt-info-row">
                          <span className="info-k">Payment Ref:</span>
                          <span className="info-v text-mono">{receiptData.paymentId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Itemization & Billing Table */}
                <table className="receipt-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Service Description & Package</th>
                      <th style={{ width: '25%' }}>Tour Schedule / Notes</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Tax / Fees</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="item-title">{receiptData.serviceTitle}</div>
                        {receiptData.inclusions && (
                          <div className="item-sub">
                            <strong>Inclusions:</strong> {receiptData.inclusions}
                          </div>
                        )}
                        {receiptData.description && (
                          <div className="item-sub">{receiptData.description}</div>
                        )}
                      </td>
                      <td>
                        <div className="item-schedule">{receiptData.tourDates || 'As agreed'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {receiptData.taxAmount > 0
                          ? `₱${receiptData.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : 'Included'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="item-price">
                          ₱{receiptData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label-cell">
                        TOTAL AMOUNT RECEIVED ({receiptData.currency}):
                      </td>
                      <td className="total-val-cell">
                        ₱{receiptData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* QR Code Tracking & Service Code Highlight Card */}
                <div className="receipt-qr-card">
                  <div className="qr-image-wrapper">
                    {generatedQr ? (
                      <img src={generatedQr} alt="Service Tracking QR Code" className="receipt-qr-img" />
                    ) : (
                      <div className="qr-loading-box">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      </div>
                    )}
                  </div>

                  <div className="qr-details-wrapper">
                    <div className="qr-callout-header">
                      <i className="fa-solid fa-qrcode" style={{ color: 'var(--purple, #7c3aed)' }}></i>
                      <span>SCAN TO TRACK SERVICE IN REAL-TIME</span>
                    </div>
                    <p className="qr-instructions">
                      Scan this QR code with any smartphone camera to open the <strong>No-Account Service Tracker</strong> on the FairFly Landing Page. Live milestones and embassy/fulfillment steps are updated in real time.
                    </p>

                    {/* Prominent High-Entropy Service Code for Manual Entry */}
                    <div className="receipt-code-highlight-box">
                      <span className="code-label">Service Tracking Code (Manual Entry):</span>
                      <strong className="code-value">{receiptData.serviceCode}</strong>
                    </div>

                    <div className="receipt-fulfillment-id-row">
                      <span>Service Fulfillment ID:</span>
                      <code>{receiptData.fulfillmentId}</code>
                    </div>
                  </div>
                </div>

                {/* Legal Certification Notice & Official Seal */}
                <div className="receipt-legal-notice">
                  <i className="fa-solid fa-shield-check" style={{ color: '#16a34a' }}></i>
                  <span>{receiptData.legalNotice}</span>
                </div>

                {/* Official Accreditation Footer */}
                <div className="quotation-pdf-footer">
                  <div className="quotation-accreditation">
                    <div className="dot-badge-icon">
                      <i className="fa-solid fa-certificate"></i> ACCREDITED
                    </div>
                    <div className="accreditation-code">{receiptData.formNo}</div>
                  </div>
                  <div className="quotation-address">
                    <div>Unit 35 A Square Mall Brgy. Pinagbarilan Baliuag 3006 Bulacan</div>
                    <div>Telephone. No. +63 (44) 813 3801 • fairflytravel19@yahoo.com</div>
                    <div>FairFly Travel & Tours System · Digitally Authenticated Record</div>
                  </div>
                </div>
              </div>
            ) : isQuotation ? (
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
    </div>,
    document.body
  );
}
