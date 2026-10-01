const { 
  getFromDatabase, 
  queryDatabaseAdvanced 
} = require('../services/firebaseService');

const COLLECTIONS = {
  ACTIVE_SERVICES: 'activeServices',
  QUOTATIONS: 'quotations',
  INQUIRIES: 'inquiries'
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
 * Resolves Quotation ID/Number, Inquiry ID/Control Number, or Active Service ID.
 */
const getPublicTrackingStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    if (!trackingId || typeof trackingId !== 'string') {
      return res.status(400).json({ error: 'Tracking reference ID is required' });
    }

    const queryId = trackingId.trim();
    const cleanUpper = queryId.toUpperCase();

    let matchedService = null;
    let matchedQuotation = null;
    let matchedInquiry = null;

    // 1. Try direct ID lookup in activeServices
    try {
      matchedService = await getFromDatabase(`${COLLECTIONS.ACTIVE_SERVICES}/${queryId}`);
    } catch (err) {}

    // 2. Try direct ID lookup in quotations
    if (!matchedService) {
      try {
        matchedQuotation = await getFromDatabase(`${COLLECTIONS.QUOTATIONS}/${queryId}`);
      } catch (err) {}
    }

    // 3. Try direct ID lookup in inquiries
    if (!matchedService && !matchedQuotation) {
      try {
        matchedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${queryId}`);
      } catch (err) {}
    }

    // 4. If not found by document ID, search by custom identifiers (quoteNo, controlNo)
    if (!matchedService && !matchedQuotation && !matchedInquiry) {
      // Check quotations by quoteNo (exact or case-insensitive)
      const quoteMatches = await queryDatabaseAdvanced(COLLECTIONS.QUOTATIONS, {
        filters: [{ field: 'quoteNo', operator: '==', value: queryId }],
        limit: 1
      });

      if (quoteMatches && quoteMatches.length > 0) {
        matchedQuotation = quoteMatches[0];
      } else if (cleanUpper.startsWith('QT-') || cleanUpper.startsWith('QUO-')) {
        // Try uppercase variant if entered in lowercase
        const upperMatches = await queryDatabaseAdvanced(COLLECTIONS.QUOTATIONS, {
          filters: [{ field: 'quoteNo', operator: '==', value: cleanUpper }],
          limit: 1
        });
        if (upperMatches && upperMatches.length > 0) {
          matchedQuotation = upperMatches[0];
        }
      }
    }

    if (!matchedService && !matchedQuotation && !matchedInquiry) {
      // Check inquiries by controlNo
      const inqMatches = await queryDatabaseAdvanced(COLLECTIONS.INQUIRIES, {
        filters: [{ field: 'controlNo', operator: '==', value: queryId }],
        limit: 1
      });
      if (inqMatches && inqMatches.length > 0) {
        matchedInquiry = inqMatches[0];
      }
    }

    // If still not found, return 404
    if (!matchedService && !matchedQuotation && !matchedInquiry) {
      return res.status(404).json({
        error: 'No active request found matching this reference code. Please verify your Quotation Number, Inquiry Code, or Service Tracking ID.'
      });
    }

    // 5. Cross-reference related documents for unified status
    // If we have a quotation, check for active service or linked inquiry
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
    }

    // If we have an inquiry, check for linked quotation or active service
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
    }

    // If we have a service, check for originating quotation or inquiry
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
    }

    // 6. Calculate progress stage (1 to 5)
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

    // 7. Extract sanitized client and branch details
    const rawClientName = matchedService?.clientName || matchedQuotation?.clientName || matchedInquiry?.clientName || matchedInquiry?.fullName || '';
    const maskedName = maskClientName(rawClientName);
    const serviceTitle = matchedService?.serviceType || matchedQuotation?.serviceTitle || matchedInquiry?.serviceType || 'Travel Service Request';
    const branchName = matchedService?.branchName || matchedQuotation?.branchName || matchedInquiry?.branchName || 'FairFly Branch Office';
    const dateInitiated = matchedService?.createdAt || matchedQuotation?.createdAt || matchedInquiry?.createdAt || null;
    const lastUpdated = matchedService?.updatedAt || matchedQuotation?.updatedAt || matchedInquiry?.updatedAt || dateInitiated;

    // 8. Sanitize procedure steps (if active service is present)
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

    // 9. Quotation public summary (if available)
    const quotationSummary = matchedQuotation
      ? {
          quoteNo: matchedQuotation.quoteNo || null,
          totalAmount: Number(matchedQuotation.totalAmount || matchedQuotation.rate || 0),
          status: matchedQuotation.status || 'Draft',
          paymentStatus: matchedQuotation.paymentStatus || 'UNPAID',
          tourDates: matchedQuotation.tourDates || null,
          inclusions: matchedQuotation.inclusions || null,
          exclusions: matchedQuotation.exclusions || null,
          quotationDate: matchedQuotation.quotationDate || null
        }
      : null;

    // 10. Inquiry public summary (if available)
    const inquirySummary = matchedInquiry
      ? {
          controlNo: matchedInquiry.controlNo || null,
          formNo: matchedInquiry.formNo || 'SAF-01-002',
          status: matchedInquiry.status || 'submitted',
          dateInquired: matchedInquiry.dateInquired || null
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
      foundType: matchedService ? 'active_service' : (matchedQuotation ? 'quotation' : 'inquiry'),
      status: statusLabel,
      statusType,
      statusDescription,
      currentStage,
      totalStages: 5,
      serviceTitle,
      branchName,
      clientName: maskedName,
      dateInitiated,
      lastUpdated,
      timeline: lifecycleTimeline,
      steps: sanitizedSteps,
      quotation: quotationSummary,
      inquiry: inquirySummary
    });
  } catch (error) {
    console.error('Error fetching public tracking status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getPublicTrackingStatus
};
