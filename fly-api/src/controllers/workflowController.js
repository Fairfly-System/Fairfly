const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  WORKFLOW_TEMPLATES: 'workflowTemplates',
  WORKFLOW_INSTANCES: 'workflowInstances'
};

/**
 * ============================================================================
 * Workflow Templates
 * ============================================================================
 */

const getTemplates = async (req, res) => {
  try {
    const { status, type, limit } = req.query;

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (status) options.filters.push({ field: 'status', value: status });
    if (type) options.filters.push({ field: 'type', value: type });
    if (limit) options.limit = parseInt(limit, 10);

    const templates = await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_TEMPLATES, options);
    return res.status(200).json(templates);
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

    return res.status(200).json({ id, ...template });
  } catch (error) {
    console.error('Error getting workflow template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    if (!templateData || !templateData.name || !templateData.description || !templateData.steps) {
      return res.status(400).json({ error: 'Name, description, and steps are required' });
    }

    if (!Array.isArray(templateData.steps) || templateData.steps.length === 0) {
      return res.status(400).json({ error: 'Steps must be a non-empty array' });
    }

    const sanitizedData = {
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      version: 1
    };

    const docId = await addToDatabase(COLLECTIONS.WORKFLOW_TEMPLATES, sanitizedData);
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

    const dbPath = `${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    await updateToDatabase(dbPath, {
      ...updates,
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

    const dbPath = `${COLLECTIONS.WORKFLOW_TEMPLATES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    await deleteFromDatabase(dbPath);
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow template:', error);
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

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (templateId) options.filters.push({ field: 'templateId', value: templateId });
    if (status) options.filters.push({ field: 'status', value: status });
    if (clientId) options.filters.push({ field: 'clientId', value: clientId });
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

    const docId = await addToDatabase(COLLECTIONS.WORKFLOW_INSTANCES, sanitizedData);
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
  getInstances,
  getInstanceById,
  createInstance,
  transitionStep
};
