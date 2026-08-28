const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  ACTIVE_SERVICES: 'activeServices',
  SERVICES: 'services',
  WORKFLOW_TEMPLATES: 'workflowTemplates'
};

const DEFAULT_FALLBACK_STEPS = [
  { stepNumber: 1, title: 'Receive client inquiry and requirements verification', description: 'Review client requirements and initial document submissions', thirdPartyLink: null },
  { stepNumber: 2, title: 'Verify client identity and supporting document copies', description: 'Check government ID validity and completeness of requirements', thirdPartyLink: null },
  { stepNumber: 3, title: 'Process application on official portal / office system', description: 'Submit transaction to partner office or official portal', thirdPartyLink: 'https://serbilis.psa.gov.ph' },
  { stepNumber: 4, title: 'Track processing status and await document release', description: 'Monitor application status and receive official documents', thirdPartyLink: null },
  { stepNumber: 5, title: 'Final quality audit & client release / turnover', description: 'Perform final document verification and deliver to client', thirdPartyLink: null },
];

/**
 * Helper to compile steps from Admin Workflow Templates attached to a Service
 */
async function compileWorkflowStepsForService(serviceId, serviceType, providedWorkflowIds) {
  let compiledRawSteps = [];

  try {
    let workflowIdsToFetch = Array.isArray(providedWorkflowIds) ? providedWorkflowIds : [];

    // If serviceId is provided, inspect the Admin service record from `services` collection
    if (serviceId) {
      const adminService = await getFromDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`);
      if (adminService && Array.isArray(adminService.workflowIds) && adminService.workflowIds.length > 0) {
        workflowIdsToFetch = adminService.workflowIds;
      }
    }

    // Fetch attached workflow templates from Firestore
    if (workflowIdsToFetch.length > 0) {
      for (const wfId of workflowIdsToFetch) {
        const wfTemplate = await getFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${wfId}`);
        if (wfTemplate && Array.isArray(wfTemplate.steps) && wfTemplate.steps.length > 0) {
          wfTemplate.steps.forEach((stepItem) => {
            if (typeof stepItem === 'string') {
              compiledRawSteps.push({ title: stepItem, description: '', thirdPartyLink: null });
            } else if (typeof stepItem === 'object') {
              compiledRawSteps.push({
                title: stepItem.title || stepItem.name || 'Workflow Step',
                description: stepItem.description || stepItem.instructions || '',
                thirdPartyLink: stepItem.thirdPartyLink || stepItem.link || stepItem.url || null,
                file: stepItem.file || stepItem.attachment || stepItem.document || null
              });
            }
          });
        }
      }
    }

    // If no workflow templates attached, check if matching workflowTemplate by name exists
    if (compiledRawSteps.length === 0 && serviceType) {
      const matchingTemplates = await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_TEMPLATES, {
        filters: [{ field: 'name', operator: '==', value: serviceType }]
      });
      if (matchingTemplates && matchingTemplates.length > 0 && Array.isArray(matchingTemplates[0].steps)) {
        matchingTemplates[0].steps.forEach((stepItem) => {
          if (typeof stepItem === 'string') {
            compiledRawSteps.push({ title: stepItem, description: '', thirdPartyLink: null, file: null });
          } else if (typeof stepItem === 'object') {
            compiledRawSteps.push({
              title: stepItem.title || stepItem.name || 'Workflow Step',
              description: stepItem.description || '',
              thirdPartyLink: stepItem.thirdPartyLink || stepItem.link || stepItem.url || null,
              file: stepItem.file || stepItem.attachment || stepItem.document || null
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Error compiling workflow steps from Admin templates:', err);
  }

  // If still empty, use standard fallbacks
  if (compiledRawSteps.length === 0) {
    compiledRawSteps = DEFAULT_FALLBACK_STEPS;
  }

  // Format with step numbers and initial statuses
  return compiledRawSteps.map((s, idx) => ({
    stepNumber: idx + 1,
    title: s.title,
    description: s.description || '',
    status: idx === 0 ? 'Currently Processing' : 'Pending',
    completedAt: null,
    thirdPartyLink: s.thirdPartyLink || null,
    file: s.file || null,
    notes: ''
  }));
}

/**
 * Get active services fulfillment list
 */
const getActiveServices = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'startedAt', direction: 'desc' }
    };

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.ACTIVE_SERVICES, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching active services:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Create a new active service record compiling steps from Admin Services & attached Workflow Templates
 */
const createActiveService = async (req, res) => {
  try {
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      serviceId, 
      serviceType, 
      priority, 
      workflowIds,
      branchUid,
      operatorId,
      branchName,
      additionalNotes,
      status
    } = req.body;

    if (!clientName || (!serviceType && !serviceId)) {
      return res.status(400).json({ error: 'Client name and service type are required' });
    }

    let finalServiceTitle = serviceType || 'General Service';
    let serviceRequirements = [];
    let price = 'Standard Fee';
    let isBranchExclusive = false;
    let exclusiveBranchUid = null;
    let exclusiveBranchName = null;

    if (serviceId) {
      const adminService = await getFromDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`);
      if (adminService) {
        finalServiceTitle = adminService.name || finalServiceTitle;
        serviceRequirements = adminService.requirements || adminService.actions || [];
        price = adminService.price || price;
        isBranchExclusive = Boolean(adminService.isBranchExclusive);
        exclusiveBranchUid = adminService.branchUid || adminService.createdByOperatorId || null;
        exclusiveBranchName = adminService.branchName || null;
      }
    }

    const compiledSteps = await compileWorkflowStepsForService(serviceId, finalServiceTitle, workflowIds);
    const now = new Date().toISOString();

    let targetBranchUid = isBranchExclusive && exclusiveBranchUid
      ? exclusiveBranchUid
      : (operatorId || branchUid || req.user?.uid || 'OP-ACCOUNT');

    let resolvedBranchName = isBranchExclusive && exclusiveBranchName
      ? exclusiveBranchName
      : (branchName || '');

    if (!resolvedBranchName && targetBranchUid !== 'OP-ACCOUNT') {
      const branchUser = await getFromDatabase(`users/${targetBranchUid}`);
      if (branchUser) {
        resolvedBranchName = branchUser.branchName || branchUser.name || '';
      }
    }

    const newService = {
      clientUid: req.user?.uid || req.body.clientUid || null,
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : '',
      clientPhone: clientPhone ? clientPhone.trim() : '',
      serviceId: serviceId || null,
      serviceUID: serviceId || null,
      serviceType: finalServiceTitle,
      price,
      requirements: serviceRequirements,
      priority: priority || 'Normal Priority',
      priorityType: (priority || '').toLowerCase().includes('high') ? 'high' : 'normal',
      status: status || 'Pending',
      currentStepIndex: 0,
      totalSteps: compiledSteps.length,
      startedAt: now,
      completedAt: null,
      steps: compiledSteps,
      operatorId: targetBranchUid,
      branchUid: targetBranchUid,
      branchName: resolvedBranchName || 'Branch Operator',
      additionalNotes: additionalNotes ? additionalNotes.trim() : ''
    };

    const docId = await addToDatabase(COLLECTIONS.ACTIVE_SERVICES, newService);
    return res.status(201).json({ id: docId, ...newService, message: 'Active service record created successfully' });
  } catch (error) {
    console.error('Error creating active service:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update step progress strictly sequentially
 */
const updateStepStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { stepIndex, newStatus } = req.body;

    if (stepIndex === undefined || !newStatus) {
      return res.status(400).json({ error: 'stepIndex and newStatus are required' });
    }

    const dbPath = `${COLLECTIONS.ACTIVE_SERVICES}/${id}`;
    const serviceRecord = await getFromDatabase(dbPath);
    if (!serviceRecord) {
      return res.status(404).json({ error: 'Active service record not found' });
    }

    const steps = [...(serviceRecord.steps || [])];
    const targetIdx = Number(stepIndex);

    if (targetIdx < 0 || targetIdx >= steps.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }

    // STRICT SEQUENTIAL CHECK: Cannot complete a step if preceding step is not completed
    if (newStatus === 'Completed') {
      if (targetIdx > 0 && steps[targetIdx - 1].status !== 'Completed') {
        return res.status(400).json({ 
          error: `Strict ordering rule: Step ${targetIdx + 1} cannot be completed until Step ${targetIdx} is finished.` 
        });
      }

      const now = new Date().toISOString();
      steps[targetIdx].status = 'Completed';
      steps[targetIdx].completedAt = now;

      // Unlock next step if exists
      let nextStepIdx = targetIdx;
      if (targetIdx + 1 < steps.length) {
        nextStepIdx = targetIdx + 1;
        if (steps[nextStepIdx].status === 'Pending') {
          steps[nextStepIdx].status = 'Currently Processing';
        }
      }

      // Check if all steps are completed
      const allCompleted = steps.every((s) => s.status === 'Completed');
      const overallStatus = allCompleted ? 'Completed' : 'Processing';
      const overallCompletedAt = allCompleted ? now : null;

      await updateToDatabase(dbPath, {
        steps,
        currentStepIndex: nextStepIdx,
        status: overallStatus,
        completedAt: overallCompletedAt,
        updatedAt: now
      });

      return res.status(200).json({ 
        message: `Step ${targetIdx + 1} marked as Completed.`,
        allCompleted
      });
    } else {
      // Toggle between 'Currently Processing' and 'Ongoing'
      steps[targetIdx].status = newStatus;
      await updateToDatabase(dbPath, {
        steps,
        updatedAt: new Date().toISOString()
      });

      return res.status(200).json({ message: `Step ${targetIdx + 1} status updated to ${newStatus}` });
    }
  } catch (error) {
    console.error('Error updating step status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getActiveServices,
  createActiveService,
  updateStepStatus,
  compileWorkflowStepsForService
};
