const { db } = require('../config/firebase');
const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { deleteRecordStorageFiles } = require('../services/storageService');
const { ID_PREFIXES } = require('../utils/idGenerator');

const COLLECTIONS = {
  WORKFLOW_TEMPLATES: 'workflowTemplates',
  WORKFLOW_INSTANCES: 'workflowInstances',
  SERVICES: 'services'
};

/**
 * Cascade helper: Removes deleted workflow IDs from all services referencing them
 * @param {string[]} workflowIds Array of deleted workflow template IDs
 */
async function cascadeRemoveWorkflowFromServices(workflowIds) {
  if (!Array.isArray(workflowIds) || workflowIds.length === 0) return;

  try {
    const servicesRef = db.collection(COLLECTIONS.SERVICES);

    for (const workflowId of workflowIds) {
      const snapshot = await servicesRef.where('workflowIds', 'array-contains', workflowId).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          const serviceData = doc.data();
          const updatedWorkflowIds = (serviceData.workflowIds || []).filter(id => id !== workflowId);
          batch.update(doc.ref, {
            workflowIds: updatedWorkflowIds,
            updatedAt: new Date().toISOString()
          });
        });
        await batch.commit();
      }
    }
  } catch (error) {
    console.error('Error cascading workflow deletion to services:', error);
  }
}

/**
 * ============================================================================
 * Workflow Templates
 * ============================================================================
 */

const getTemplates = async (req, res) => {
  try {
    const { status, type, serviceType, limit } = req.query;
    const requestedType = serviceType || type;

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (status) options.filters.push({ field: 'status', value: status });
    if (requestedType) {
      options.filters.push({ field: 'serviceType', value: requestedType });
    }
    if (limit) options.limit = parseInt(limit, 10);

    let templates = await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_TEMPLATES, options);

    // Fallback if legacy templates only have 'type' field
    if (requestedType && templates.length === 0) {
      const legacyOptions = {
        filters: options.filters.filter(f => f.field !== 'serviceType'),
        orderBy: options.orderBy
      };
      legacyOptions.filters.push({ field: 'type', value: requestedType });
      templates = await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_TEMPLATES, legacyOptions);
    }

    const normalized = templates.map(t => ({
      ...t,
      serviceType: t.serviceType || t.type || 'General',
      type: t.type || t.serviceType || 'General'
    }));

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Error getting workflow templates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Template ID is required' });

    const template = await getFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    return res.status(200).json({
      id,
      ...template,
      serviceType: template.serviceType || template.type || 'General',
      type: template.type || template.serviceType || 'General'
    });
  } catch (error) {
    console.error('Error getting workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.jar', '.vbs', '.js', '.scr', '.com', '.pif', '.application', '.gadget', '.msp', '.hta', '.cpl', '.msc'];

function hasExecutableAttachment(steps) {
  if (!Array.isArray(steps)) return false;
  for (const step of steps) {
    if (step.file && step.file.url) {
      const cleanUrl = step.file.url.split('?')[0].toLowerCase();
      const cleanName = (step.file.name || '').toLowerCase();
      if (EXECUTABLE_EXTENSIONS.some(ext => cleanUrl.endsWith(ext) || cleanName.endsWith(ext))) {
        return true;
      }
    }
  }
  return false;
}

const createTemplate = async (req, res) => {
  try {
    const isOperator = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    if (isOperator && !req.userDetails?.isQualified) {
      return res.status(403).json({ error: 'Forbidden: Only qualified operators are permitted to create workflow templates.' });
    }

    const templateData = req.body;
    if (!templateData || !templateData.name || !templateData.description || !templateData.steps) {
      return res.status(400).json({ error: 'Name, description, and steps are required' });
    }

    if (!Array.isArray(templateData.steps) || templateData.steps.length === 0) {
      return res.status(400).json({ error: 'Steps must be a non-empty array' });
    }

    if (hasExecutableAttachment(templateData.steps)) {
      return res.status(400).json({ error: 'Executable files (.exe, .bat, .sh, etc.) are prohibited for security.' });
    }

    const resolvedType = (templateData.serviceType || templateData.type || 'General').trim();

    const operatorBranchName = req.userDetails?.branchName || req.userDetails?.branchLocation || null;

    const sanitizedData = {
      ...templateData,
      serviceType: resolvedType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: templateData.status || 'active',
      version: 1,
      createdBy: req.user.uid,
      createdByRole: req.userDetails?.role || 'admin',
      branchUid: isOperator ? req.user.uid : (templateData.branchUid || null),
      branchName: isOperator ? operatorBranchName : (templateData.branchName || null)
    };
    delete sanitizedData.type;

    const docId = await addToDatabase(COLLECTIONS.WORKFLOW_TEMPLATES, sanitizedData, ID_PREFIXES.WORKFLOW_TEMPLATE);
    return res.status(201).json({ id: docId, message: 'Template created successfully' });
  } catch (error) {
    console.error('Error creating workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) return res.status(400).json({ error: 'Template ID is required' });

    const isOperator = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    if (isOperator && !req.userDetails?.isQualified) {
      return res.status(403).json({ error: 'Forbidden: Only qualified operators are permitted to update workflow templates.' });
    }

    if (updates.steps && hasExecutableAttachment(updates.steps)) {
      return res.status(400).json({ error: 'Executable files (.exe, .bat, .sh, etc.) are prohibited for security.' });
    }

    const dbPath = `${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    if (isOperator) {
      const isOwner = (existing.branchUid && existing.branchUid === req.user.uid) ||
                      (existing.createdBy && existing.createdBy === req.user.uid);
      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden: Operators can only update workflow templates created by their branch.' });
      }
    }

    const sanitizedUpdates = { ...updates };
    if (updates.serviceType !== undefined || updates.type !== undefined) {
      const resolvedType = (updates.serviceType || updates.type || existing.serviceType || existing.type || 'General').trim();
      sanitizedUpdates.serviceType = resolvedType;
      sanitizedUpdates.type = resolvedType;
    }

    // Strip protected ownership metadata to prevent privilege tampering
    delete sanitizedUpdates.createdBy;
    delete sanitizedUpdates.createdByRole;
    delete sanitizedUpdates.branchUid;
    delete sanitizedUpdates.branchName;

    await updateToDatabase(dbPath, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Template ID is required' });

    const isOperator = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    if (isOperator && !req.userDetails?.isQualified) {
      return res.status(403).json({ error: 'Forbidden: Only qualified operators are permitted to delete workflow templates.' });
    }

    const dbPath = `${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    if (isOperator) {
      const isOwner = (existing.branchUid && existing.branchUid === req.user.uid) ||
                      (existing.createdBy && existing.createdBy === req.user.uid);
      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden: Operators can only delete workflow templates created by their branch.' });
      }
    }

    await deleteFromDatabase(dbPath);

    // Clean up attached files from Firebase Storage
    await deleteRecordStorageFiles(existing);

    // Cascade remove deleted workflow ID from all services
    await cascadeRemoveWorkflowFromServices([id]);

    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const bulkDeleteTemplates = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const isOperator = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    if (isOperator && !req.userDetails?.isQualified) {
      return res.status(403).json({ error: 'Forbidden: Only qualified operators are permitted to delete workflow templates.' });
    }

    const existingRecords = await Promise.all(
      ids.map(id => getFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`))
    );

    if (isOperator) {
      const unauthorized = existingRecords.some(rec => {
        if (!rec) return false;
        const isOwner = (rec.branchUid && rec.branchUid === req.user.uid) ||
                        (rec.createdBy && rec.createdBy === req.user.uid);
        return !isOwner;
      });
      if (unauthorized) {
        return res.status(403).json({ error: 'Forbidden: Operators can only delete workflow templates created by their branch.' });
      }
    }

    await Promise.all(
      ids.map((id) => deleteFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`))
    );

    // Clean up attached files from Firebase Storage for all deleted templates
    await deleteRecordStorageFiles(existingRecords);

    // Cascade remove all deleted workflow IDs from all services
    await cascadeRemoveWorkflowFromServices(ids);

    return res.status(200).json({ message: `${ids.length} workflow templates deleted successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting workflow templates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Template ID is required' });

    const isOperator = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    if (isOperator && !req.userDetails?.isQualified) {
      return res.status(403).json({ error: 'Forbidden: Only qualified operators are permitted to duplicate workflow templates.' });
    }

    const dbPath = `${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`;
    const sourceTemplate = await getFromDatabase(dbPath);
    if (!sourceTemplate) {
      return res.status(404).json({ error: 'Workflow template not found' });
    }

    const operatorBranchName = req.userDetails?.branchName || req.userDetails?.branchLocation || null;

    // Use custom copy name from body if provided, otherwise default to '${source.name} (Copy)'
    const copyName = (req.body && req.body.name && typeof req.body.name === 'string' && req.body.name.trim())
      ? req.body.name.trim()
      : `${sourceTemplate.name || 'Workflow'} (Copy)`;

    const duplicatedData = {
      name: copyName,
      description: sourceTemplate.description || '',
      serviceType: sourceTemplate.serviceType || sourceTemplate.type || 'General',
      steps: Array.isArray(sourceTemplate.steps) ? sourceTemplate.steps : [],
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.uid,
      createdByRole: req.userDetails?.role || 'admin',
      branchUid: isOperator ? req.user.uid : null,
      branchName: isOperator ? operatorBranchName : null
    };

    if (sourceTemplate.category) {
      duplicatedData.category = sourceTemplate.category;
    }

    const docId = await addToDatabase(COLLECTIONS.WORKFLOW_TEMPLATES, duplicatedData, ID_PREFIXES.WORKFLOW_TEMPLATE);
    return res.status(201).json({ id: docId, message: 'Template duplicated successfully' });
  } catch (error) {
    console.error('Error duplicating workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * ============================================================================
 * Workflow Instances
 * ============================================================================
 */

const getInstances = async (req, res) => {
  try {
    const { templateId, status, clientId, limit } = req.query;
    const userRole = req.userDetails?.role;

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (userRole === 'client') {
      options.filters.push({ field: 'clientId', operator: '==', value: req.user.uid });
    } else if (clientId) {
      options.filters.push({ field: 'clientId', operator: '==', value: clientId });
    }

    if (templateId) options.filters.push({ field: 'templateId', operator: '==', value: templateId });
    if (status) options.filters.push({ field: 'status', operator: '==', value: status });
    if (limit) options.limit = parseInt(limit, 10);

    const instances = await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_INSTANCES, options);
    return res.status(200).json(instances);
  } catch (error) {
    console.error('Error getting workflow instances:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getInstanceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Instance ID is required' });

    const instance = await getFromDatabase(`${COLLECTIONS.WORKFLOW_INSTANCES}/${id}`);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const userRole = req.userDetails?.role;
    const isOwner = instance.clientId === req.user?.uid;
    const isStaff = userRole === 'admin' || userRole === 'operator' || userRole === 'branch_operator';

    if (!isStaff && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this workflow instance.' });
    }

    return res.status(200).json({ id, ...instance });
  } catch (error) {
    console.error('Error getting workflow instance:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createInstance = async (req, res) => {
  try {
    const instanceData = req.body;
    if (!instanceData || !instanceData.templateId || !instanceData.clientId) {
      return res.status(400).json({ error: 'Template ID and Client ID are required' });
    }

    // Retrieve template to fetch snapshot details
    const template = await getFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${instanceData.templateId}`);
    if (!template) {
      return res.status(400).json({ error: 'Valid workflow template is required' });
    }

    const sanitizedData = {
      ...instanceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      currentStepIndex: 0,
      stepsSnapshot: template.steps.map((step, idx) => ({
        ...step,
        status: idx === 0 ? 'current' : 'pending',
        startedAt: idx === 0 ? new Date().toISOString() : null,
        completedAt: null,
        notes: ''
      }))
    };

    const docId = await addToDatabase(COLLECTIONS.WORKFLOW_INSTANCES, sanitizedData, ID_PREFIXES.WORKFLOW_INSTANCE);
    return res.status(201).json({ id: docId, message: 'Workflow instance created successfully' });
  } catch (error) {
    console.error('Error creating workflow instance:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const transitionStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextStepIndex, stepNotes } = req.body;

    if (!id) return res.status(400).json({ error: 'Instance ID is required' });
    if (nextStepIndex === undefined) return res.status(400).json({ error: 'Next step index is required' });

    const dbPath = `${COLLECTIONS.WORKFLOW_INSTANCES}/${id}`;
    const instance = await getFromDatabase(dbPath);
    if (!instance) return res.status(404).json({ error: 'Instance not found' });

    const { stepsSnapshot, currentStepIndex } = instance;
    if (nextStepIndex < 0 || nextStepIndex >= stepsSnapshot.length) {
      return res.status(400).json({ error: 'Invalid step index transition' });
    }

    const updatedSteps = [...stepsSnapshot];
    const now = new Date().toISOString();

    // Mark current step as completed
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      status: 'completed',
      completedAt: now,
      notes: stepNotes || updatedSteps[currentStepIndex].notes || ''
    };

    // Mark next step as current
    updatedSteps[nextStepIndex] = {
      ...updatedSteps[nextStepIndex],
      status: 'current',
      startedAt: now
    };

    // Check if the final step has been completed
    let newStatus = 'active';
    if (nextStepIndex === stepsSnapshot.length - 1 && updatedSteps[nextStepIndex].status === 'completed') {
      newStatus = 'completed';
    }

    await updateToDatabase(dbPath, {
      currentStepIndex: nextStepIndex,
      stepsSnapshot: updatedSteps,
      status: newStatus,
      updatedAt: now
    });

    return res.status(200).json({ message: 'Step transitioned successfully' });
  } catch (error) {
    console.error('Error transitioning workflow instance step:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bulkDeleteTemplates,
  duplicateTemplate,
  getInstances,
  getInstanceById,
  createInstance,
  transitionStep
};
