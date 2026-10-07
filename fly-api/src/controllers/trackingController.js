const { 
  getFromDatabase, 
  queryDatabaseAdvanced 
} = require('../services/firebaseService');
const { db } = require('../config/firebase');

const COLLECTIONS = {
  ACTIVE_SERVICES: 'activeServices',
  QUOTATIONS: 'quotations',
  INQUIRIES: 'inquiries',
  RECEIPTS: 'receipts'
};

function maskClientName(name) {
  if (!name || typeof name !== 'string') return 'Valued Client';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const single = parts[0];
    return single.length > 2 ? `${single[0]}***${single[single.length - 1]}` : `${single[0]}*`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0] || '';
  return `${first} ${lastInitial}.`;
}

/**
 * Public Request Tracking Endpoint
 * Strictly resolves official Service Tracking IDs (SRV-2026-XXXXXX or SVC-...)
 * Quotation IDs (QT-...), Inquiry IDs (INQ-...), and Receipt Numbers (RCT-...) are strictly disallowed.
 */
const getPublicTrackingStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    if (!trackingId || typeof trackingId !== 'string') {
      return res.status(400).json({ error: 'Tracking reference ID is required.' });
    }

    const queryId = trackingId.trim();
    const cleanUpper = queryId.toUpperCase();

    // Explicit rejection for disallowed reference formats
    if (cleanUpper.startsWith('QT-') || cleanUpper.startsWith('QUO-') || cleanUpper.startsWith('QTN-')) {
      return res.status(400).json({
        error: 'Quotation IDs (QT-...) cannot be tracked here. Only official Service Tracking IDs (e.g., SRV-2026-XXXXXX) are allowed on the public tracker.'
      });
    }

    if (cleanUpper.startsWith('INQ-') || cleanUpper.startsWith('SAF-')) {
      return res.status(400).json({
        error: 'Inquiry reference codes (INQ-...) cannot be tracked here. Only official Service Tracking IDs (e.g., SRV-2026-XXXXXX) are allowed on the public tracker.'
      });
    }

    if (cleanUpper.startsWith('RCT-')) {
      return res.status(400).json({
        error: 'Receipt Numbers (RCT-...) cannot be tracked directly. Please enter the Service Tracking ID (SRV-2026-XXXXXX) indicated on your receipt.'
      });
    }

    if (cleanUpper.startsWith('PAY-') || cleanUpper.startsWith('USR-') || cleanUpper.startsWith('TKT-') || cleanUpper.startsWith('APT-')) {
      return res.status(400).json({
        error: 'Invalid reference code. Only official Service Tracking IDs (e.g., SRV-2026-XXXXXX) are allowed on the public tracker.'
      });
    }

    let matchedService = null;
    let matchedQuotation = null;
    let matchedInquiry = null;
    let matchedReceipt = null;

    // 1. Query activeServices collection by serviceCode
    try {
      const srvSnap = await db.collection(COLLECTIONS.ACTIVE_SERVICES)
        .where('serviceCode', '==', queryId)
        .limit(1)
        .get();
      if (!srvSnap.empty) {
        matchedService = { id: srvSnap.docs[0].id, ...srvSnap.docs[0].data() };
      } else if (cleanUpper.startsWith('SRV-')) {
        const upperSnap = await db.collection(COLLECTIONS.ACTIVE_SERVICES)
          .where('serviceCode', '==', cleanUpper)
          .limit(1)
          .get();
        if (!upperSnap.empty) {
          matchedService = { id: upperSnap.docs[0].id, ...upperSnap.docs[0].data() };
        }
      }
    } catch (err) {
      console.warn('[Tracking] Error querying activeServices by serviceCode:', err.message);
    }

    // 2. Try direct ID lookup in activeServices (for direct SVC-... fulfillment IDs)
    if (!matchedService) {
      try {
        const serviceDoc = await getFromDatabase(`${COLLECTIONS.ACTIVE_SERVICES}/${queryId}`);
        if (serviceDoc) {
          matchedService = { id: queryId, ...serviceDoc };
        }
      } catch (err) {}
    }

    // 3. Query receipts by serviceCode (to resolve linked fulfillment)
    if (!matchedService) {
      try {
        const rctSnap = await db.collection(COLLECTIONS.RECEIPTS)
          .where('serviceCode', '==', queryId)
          .limit(1)
          .get();
        if (!rctSnap.empty) {
          matchedReceipt = { id: rctSnap.docs[0].id, ...rctSnap.docs[0].data() };
        } else if (cleanUpper.startsWith('SRV-')) {
          const upperCodeSnap = await db.collection(COLLECTIONS.RECEIPTS)
            .where('serviceCode', '==', cleanUpper)
            .limit(1)
            .get();
          if (!upperCodeSnap.empty) {
            matchedReceipt = { id: upperCodeSnap.docs[0].id, ...upperCodeSnap.docs[0].data() };
          }
        }
      } catch (err) {
        console.warn('[Tracking] Error querying receipts by serviceCode:', err.message);
      }
    }

    // If still not resolved to an active service or receipt by serviceCode, return 404
    if (!matchedService && !matchedReceipt) {
      return res.status(404).json({
        error: `No active service found matching Tracking ID "${queryId}". Please verify your Service Tracking ID (e.g. SRV-2026-XXXXXX).`
      });
    }

    // 9. Cross-reference related documents for unified status
    if (matchedReceipt) {
      if (matchedReceipt.fulfillmentId && !matchedService) {
        try {
          matchedService = await getFromDatabase(`${COLLECTIONS.ACTIVE_SERVICES}/${matchedReceipt.fulfillmentId}`);
        } catch (err) {}
      }
      if (matchedReceipt.quotationId && !matchedQuotation) {
        try {
          matchedQuotation = await getFromDatabase(`${COLLECTIONS.QUOTATIONS}/${matchedReceipt.quotationId}`);
        } catch (err) {}
      }
      if (matchedReceipt.inquiryId && !matchedInquiry) {
        try {
          matchedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${matchedReceipt.inquiryId}`);
        } catch (err) {}
      }
    }

    if (matchedQuotation) {
      if (matchedQuotation.activeServiceId && !matchedService) {
        try {
          matchedService = await getFromDatabase(`${COLLECTIONS.ACTIVE_SERVICES}/${matchedQuotation.activeServiceId}`);
        } catch (err) {}
      }
      if (matchedQuotation.inquiryId && !matchedInquiry) {
        try {
          matchedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${matchedQuotation.inquiryId}`);
        } catch (err) {}
      }
      if (matchedQuotation.receiptId && !matchedReceipt) {
        try {
          matchedReceipt = await getFromDatabase(`${COLLECTIONS.RECEIPTS}/${matchedQuotation.receiptId}`);
        } catch (err) {}
      }
    }

    if (matchedInquiry) {
      if (matchedInquiry.confirmedActiveServiceId && !matchedService) {
        try {
          matchedService = await getFromDatabase(`${COLLECTIONS.ACTIVE_SERVICES}/${matchedInquiry.confirmedActiveServiceId}`);
        } catch (err) {}
      }
      if (matchedInquiry.confirmedQuotationId && !matchedQuotation) {
        try {
          matchedQuotation = await getFromDatabase(`${COLLECTIONS.QUOTATIONS}/${matchedInquiry.confirmedQuotationId}`);
        } catch (err) {}
      }
      if (matchedInquiry.confirmedReceiptId && !matchedReceipt) {
        try {
          matchedReceipt = await getFromDatabase(`${COLLECTIONS.RECEIPTS}/${matchedInquiry.confirmedReceiptId}`);
        } catch (err) {}
      }
    }

    if (matchedService) {
      if (matchedService.quotationId && !matchedQuotation) {
        try {
          matchedQuotation = await getFromDatabase(`${COLLECTIONS.QUOTATIONS}/${matchedService.quotationId}`);
        } catch (err) {}
      }
      if (matchedService.inquiryId && !matchedInquiry) {
        try {
          matchedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${matchedService.inquiryId}`);
        } catch (err) {}
      }
      if (matchedService.receiptId && !matchedReceipt) {
        try {
          matchedReceipt = await getFromDatabase(`${COLLECTIONS.RECEIPTS}/${matchedService.receiptId}`);
        } catch (err) {}
      }
    }

    // Try fetching receipt by quotationId if not yet resolved and quotation is PAID
    if (!matchedReceipt && matchedQuotation) {
      const qPaid = (matchedQuotation.status || '').toUpperCase() === 'PAID' || (matchedQuotation.paymentStatus || '').toUpperCase() === 'PAID';
      if (qPaid) {
        const rSnap = await db.collection(COLLECTIONS.RECEIPTS)
          .where('quotationId', '==', matchedQuotation.id || matchedQuotation.quotationId)
          .limit(1)
          .get();
        if (!rSnap.empty) {
          matchedReceipt = { id: rSnap.docs[0].id, ...rSnap.docs[0].data() };
        }
      }
    }

    // 10. Calculate progress stage (1 to 5)
    let currentStage = 1;
    let statusLabel = 'Request Received';
    let statusType = 'info'; // 'info', 'warning', 'primary', 'success', 'danger'
    let statusDescription = 'Your request has been recorded and is queued for branch operator assessment.';

    if (matchedService) {
      const sStatus = (matchedService.status || '').toLowerCase();
      if (sStatus === 'completed') {
        currentStage = 5;
        statusLabel = 'Service Completed';
        statusType = 'success';
        statusDescription = 'All milestones have been successfully completed and documents are ready.';
      } else if (sStatus === 'cancelled') {
        currentStage = 4;
        statusLabel = 'Service Cancelled';
        statusType = 'danger';
        statusDescription = 'This service request was cancelled. Please contact your handling branch.';
      } else {
        currentStage = 4;
        statusLabel = 'In Progress · Milestone Processing';
        statusType = 'primary';
        statusDescription = 'Your service is actively being processed by our branch operators.';
      }
    } else if (matchedQuotation) {
      const qStatus = (matchedQuotation.status || '').toLowerCase();
      const pStatus = (matchedQuotation.paymentStatus || '').toLowerCase();

      if (pStatus === 'paid') {
        currentStage = 4;
        statusLabel = 'Payment Confirmed · Processing';
        statusType = 'primary';
        statusDescription = 'Payment has been confirmed. Service workflow milestones are being initialized.';
      } else if (qStatus === 'accepted') {
        currentStage = 3;
        statusLabel = 'Quotation Accepted · Awaiting Payment';
        statusType = 'warning';
        statusDescription = 'Quotation has been accepted. Service fulfillment starts upon payment.';
      } else if (qStatus === 'rejected') {
        currentStage = 3;
        statusLabel = 'Quotation Declined';
        statusType = 'danger';
        statusDescription = 'This quotation was declined. Please reach out to your branch for a revised quote.';
      } else {
        currentStage = 3;
        statusLabel = 'Quotation Ready for Review';
        statusType = 'success';
        statusDescription = 'Official quotation has been prepared with full price and inclusion breakdown.';
      }
    } else if (matchedInquiry) {
      const inqStatus = (matchedInquiry.status || '').toLowerCase();
      if (inqStatus === 'under_review' || inqStatus === 'assigned') {
        currentStage = 2;
        statusLabel = 'Under Branch Review';
        statusType = 'info';
        statusDescription = 'Our branch operations team is actively assessing your specifications.';
      } else {
        currentStage = 1;
        statusLabel = 'Inquiry Submitted';
        statusType = 'info';
        statusDescription = 'Your inquiry has been submitted and assigned to the branch office.';
      }
    }

    // 11. Extract client and branch details
    const rawClientName = matchedReceipt?.clientName || matchedQuotation?.clientName || matchedService?.clientName || matchedInquiry?.clientName || matchedInquiry?.fullName || '';
    const rawContactPerson = matchedReceipt?.contactPerson || matchedQuotation?.contactPerson || matchedInquiry?.contactPerson || '';
    const rawClientEmail = matchedReceipt?.clientEmail || matchedQuotation?.clientEmail || matchedInquiry?.email || '';
    const rawClientPhone = matchedReceipt?.clientPhone || matchedQuotation?.clientPhone || matchedInquiry?.cellphone || matchedInquiry?.phoneNumber || matchedInquiry?.telNo || '';
    const maskedName = maskClientName(rawClientName);
    const serviceTitle = matchedReceipt?.serviceTitle || matchedQuotation?.serviceTitle || matchedService?.serviceType || matchedInquiry?.serviceType || 'Travel Service Request';
    const branchName = matchedReceipt?.branchName || matchedQuotation?.branchName || matchedService?.branchName || matchedInquiry?.branchName || 'FairFly Branch Office';
    const dateInitiated = matchedService?.createdAt || matchedQuotation?.createdAt || matchedInquiry?.createdAt || matchedReceipt?.createdAt || null;
    const lastUpdated = matchedService?.updatedAt || matchedQuotation?.updatedAt || matchedInquiry?.updatedAt || dateInitiated;

    // Resolved service tracking code and fulfillment ID
    const effectiveServiceCode = matchedReceipt?.serviceCode || matchedService?.serviceCode || matchedQuotation?.serviceCode || null;
    const effectiveFulfillmentId = matchedService?.id || matchedQuotation?.activeServiceId || matchedReceipt?.fulfillmentId || null;

    // 12. Sanitize procedure steps
    const sanitizedSteps = Array.isArray(matchedService?.steps)
      ? matchedService.steps.map((st, idx) => ({
          stepNumber: st.stepNumber || idx + 1,
          title: st.title || `Milestone ${idx + 1}`,
          description: st.description || '',
          status: st.status || 'Pending',
          completedAt: st.completedAt || null,
          hasLink: Boolean(st.thirdPartyLink || st.link)
        }))
      : [];

    // 13. Quotation public summary
    const quotationSummary = matchedQuotation
      ? {
          id: matchedQuotation.id,
          quoteNo: matchedQuotation.quoteNo || null,
          clientName: matchedQuotation.clientName || rawClientName || null,
          contactPerson: matchedQuotation.contactPerson || rawContactPerson || null,
          clientEmail: matchedQuotation.clientEmail || rawClientEmail || null,
          clientPhone: matchedQuotation.clientPhone || rawClientPhone || null,
          serviceTitle: matchedQuotation.serviceTitle || serviceTitle,
          totalAmount: Number(matchedQuotation.totalAmount || matchedQuotation.rate || 0),
          rate: Number(matchedQuotation.rate || matchedQuotation.totalAmount || 0),
          taxAmount: Number(matchedQuotation.taxAmount || 0),
          rateBreakdown: matchedQuotation.rateBreakdown || null,
          status: matchedQuotation.status || 'Draft',
          paymentStatus: matchedQuotation.paymentStatus || 'UNPAID',
          paymentId: matchedQuotation.paymentId || null,
          tourDates: matchedQuotation.tourDates || null,
          inclusions: matchedQuotation.inclusions || null,
          exclusions: matchedQuotation.exclusions || null,
          quotationDate: matchedQuotation.quotationDate || null,
          branchName: matchedQuotation.branchName || branchName,
          preparedByName: matchedQuotation.preparedByName || matchedQuotation.preparedBy || null
        }
      : null;

    // 14. Inquiry public summary
    const inquirySummary = matchedInquiry
      ? {
          id: matchedInquiry.id,
          controlNo: matchedInquiry.controlNo || null,
          formNo: matchedInquiry.formNo || 'SAF-01-002',
          clientName: matchedInquiry.clientName || matchedInquiry.fullName || null,
          contactPerson: matchedInquiry.contactPerson || null,
          status: matchedInquiry.status || 'submitted',
          dateInquired: matchedInquiry.dateInquired || null
        }
      : null;

    // 15. Safe Public Receipt details (if receipt available)
    const receiptSummary = matchedReceipt
      ? {
          id: matchedReceipt.id || matchedReceipt.receiptId,
          receiptId: matchedReceipt.id || matchedReceipt.receiptId,
          receiptNo: matchedReceipt.receiptNo,
          formNo: matchedReceipt.formNo || 'ADF-07-002',
          serviceCode: matchedReceipt.serviceCode || effectiveServiceCode,
          fulfillmentId: matchedReceipt.fulfillmentId || effectiveFulfillmentId,
          quotationId: matchedReceipt.quotationId || matchedQuotation?.id || null,
          quoteNo: matchedReceipt.quoteNo || matchedQuotation?.quoteNo || null,
          paymentId: matchedReceipt.paymentId || matchedQuotation?.paymentId || (matchedReceipt.receiptNo ? `PAY-${matchedReceipt.receiptNo.replace('RCT-', '')}` : 'PAY-CONFIRMED'),
          providerPaymentId: matchedReceipt.providerPaymentId || null,
          clientName: matchedReceipt.clientName || rawClientName || 'Valued Client',
          contactPerson: matchedReceipt.contactPerson || rawContactPerson || null,
          clientEmail: matchedReceipt.clientEmail || rawClientEmail || null,
          clientPhone: matchedReceipt.clientPhone || rawClientPhone || null,
          serviceTitle: matchedReceipt.serviceTitle || matchedQuotation?.serviceTitle || serviceTitle,
          description: matchedReceipt.description || matchedQuotation?.serviceTitle || serviceTitle || 'Standard tour & travel service fulfillment',
          operatorRemarks: matchedReceipt.operatorRemarks || matchedQuotation?.operatorRemarks || matchedQuotation?.remarks || null,
          clientRemarks: matchedReceipt.clientRemarks || matchedQuotation?.clientRemarks || null,
          tourDates: matchedReceipt.tourDates || matchedQuotation?.tourDates || 'As arranged with client',
          inclusions: matchedReceipt.inclusions || matchedQuotation?.inclusions || null,
          exclusions: matchedReceipt.exclusions || matchedQuotation?.exclusions || null,
          rate: Number(matchedReceipt.rate || matchedQuotation?.rate || matchedReceipt.amount || 0),
          taxAmount: Number(matchedReceipt.taxAmount || matchedQuotation?.taxAmount || 0),
          rateBreakdown: matchedReceipt.rateBreakdown || matchedQuotation?.rateBreakdown || null,
          amount: Number(matchedReceipt.amount || matchedQuotation?.totalAmount || matchedQuotation?.rate || 0),
          currency: matchedReceipt.currency || 'PHP',
          paymentMethod: matchedReceipt.paymentMethod || 'Direct Payment',
          branchName: matchedReceipt.branchName || matchedQuotation?.branchName || branchName,
          receivedByOperatorName: matchedReceipt.receivedByOperatorName || matchedQuotation?.preparedByName || matchedQuotation?.preparedBy || 'Emmanuel Manlapig',
          status: (matchedReceipt.status || 'PAID').toUpperCase(),
          paidAt: matchedReceipt.paidAt || matchedReceipt.issuedAt || matchedQuotation?.paidAt || now,
          issuedAt: matchedReceipt.issuedAt || matchedReceipt.createdAt || now,
          qrTrackingUrl: matchedReceipt.qrTrackingUrl,
          qrCodeDataUrl: matchedReceipt.qrCodeDataUrl,
          businessName: matchedReceipt.businessName || 'FairFly Travel & Tours',
          legalNotice: matchedReceipt.legalNotice || 'This electronic receipt is an official acknowledgment of payment received by FairFly Travel and Tours.'
        }
      : null;

    // Standardized 5-Phase Lifecycle Timeline
    const lifecycleTimeline = [
      {
        stageNumber: 1,
        title: 'Request Intake',
        desc: 'Inquiry and requirements submitted',
        isCompleted: currentStage > 1,
        isCurrent: currentStage === 1
      },
      {
        stageNumber: 2,
        title: 'Branch Assessment',
        desc: 'Specialists review documentation and itinerary',
        isCompleted: currentStage > 2,
        isCurrent: currentStage === 2
      },
      {
        stageNumber: 3,
        title: 'Quotation Issued',
        desc: 'Official quotation prepared and ready',
        isCompleted: currentStage > 3,
        isCurrent: currentStage === 3
      },
      {
        stageNumber: 4,
        title: 'Service Processing',
        desc: 'Executing procedure milestones & embassy filings',
        isCompleted: currentStage > 4,
        isCurrent: currentStage === 4
      },
      {
        stageNumber: 5,
        title: 'Delivery & Release',
        desc: 'Fulfillment completed and documents delivered',
        isCompleted: currentStage === 5,
        isCurrent: currentStage === 5
      }
    ];

    return res.status(200).json({
      trackingReference: queryId,
      serviceCode: effectiveServiceCode,
      fulfillmentId: effectiveFulfillmentId,
      foundType: matchedService ? 'active_service' : (matchedReceipt ? 'receipt' : (matchedQuotation ? 'quotation' : 'inquiry')),
      status: statusLabel,
      statusType,
      statusDescription,
      currentStage,
      totalStages: 5,
      serviceTitle,
      branchName,
      clientName: maskedName,
      fullName: rawClientName,
      contactPerson: rawContactPerson || null,
      dateInitiated,
      lastUpdated,
      timeline: lifecycleTimeline,
      steps: sanitizedSteps,
      quotation: quotationSummary,
      inquiry: inquirySummary,
      receipt: receiptSummary
    });
  } catch (error) {
    console.error('Error fetching public tracking status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getPublicTrackingStatus
};
