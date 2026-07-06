import {
  addToDatabase,
  getAllFromDatabase,
  queryDatabaseAdvanced,
  getFromDatabase,
  updateToDatabase,
  deleteFromDatabase
} from '../utils/firebaseutils';

/**
 * Workflow Template Service
 * Handles CRUD operations for workflow templates
 *
 * This service now delegates all Firestore operations to firebaseutils.js
 * for consistency, maintainability, and better error handling.
 */

const COLLECTIONS = {
  WORKFLOW_TEMPLATES: 'workflowTemplates',
  WORKFLOW_INSTANCES: 'workflowInstances'
};

/**
 * Workflow Template Functions
 */

export const createWorkflowTemplate = async (templateData) => {
  try {
    if (!templateData) {
      throw new Error('Template data is required');
    }

    const requiredFields = ['name', 'description', 'steps'];
    for (const field of requiredFields) {
      if (!templateData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(templateData.steps) || templateData.steps.length === 0) {
      throw new Error('Steps must be a non-empty array');
    }

    for (let i = 0; i < templateData.steps.length; i++) {
      const step = templateData.steps[i];
      if (!step.name || !step.description) {
        throw new Error(`Step ${i + 1} must have name and description`);
      }
    }

    const sanitizedData = {
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      version: 1
    };

    return await addToDatabase(COLLECTIONS.WORKFLOW_TEMPLATES, sanitizedData);
  } catch (error) {
    console.error('Error creating workflow template:', error);
    throw error;
  }
};

export const getWorkflowTemplateById = async (templateId) => {
  try {
    if (!templateId) throw new Error('Template ID is required');
    const data = await getFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${templateId}`);
    return data ? { id: templateId, ...data } : null;
  } catch (error) {
    console.error('Error getting workflow template:', error);
    throw error;
  }
};

export const getWorkflowTemplates = async (filters = {}) => {
  try {
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: filters.limit
    };

    if (filters.status) options.filters.push({ field: 'status', value: filters.status });
    if (filters.type) options.filters.push({ field: 'type', value: filters.type });

    return await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_TEMPLATES, options);
  } catch (error) {
    console.error('Error getting workflow templates:', error);
    throw error;
  }
};

export const updateWorkflowTemplate = async (templateId, updates) => {
  try {
    if (!templateId) throw new Error('Template ID is required');

    if (updates.steps) {
      if (!Array.isArray(updates.steps) || updates.steps.length === 0) {
        throw new Error('Steps must be a non-empty array');
      }
      for (let i = 0; i < updates.steps.length; i++) {
        const step = updates.steps[i];
        if (!step.name || !step.description) {
          throw new Error(`Step ${i + 1} must have name and description`);
        }
      }
    }

    const currentTemplate = await getWorkflowTemplateById(templateId);
    const version = updates.version || (currentTemplate?.version || 0) + 1;

    await updateToDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${templateId}`, {
      ...updates,
      updatedAt: new Date().toISOString(),
      version
    });
  } catch (error) {
    console.error('Error updating workflow template:', error);
    throw error;
  }
};

export const deleteWorkflowTemplate = async (templateId) => {
  try {
    if (!templateId) throw new Error('Template ID is required');
    await deleteFromDatabase(`${COLLECTIONS.WORKFLOW_TEMPLATES}/${templateId}`);
  } catch (error) {
    console.error('Error deleting workflow template:', error);
    throw error;
  }
};

export const duplicateWorkflowTemplate = async (templateId, modifications = {}) => {
  try {
    if (!templateId) throw new Error('Template ID is required');

    const originalTemplate = await getWorkflowTemplateById(templateId);
    if (!originalTemplate) throw new Error('Original template not found');

    const newTemplateData = {
      ...originalTemplate,
      ...modifications,
      name: modifications.name || `${originalTemplate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    delete newTemplateData.id;

    return await createWorkflowTemplate(newTemplateData);
  } catch (error) {
    console.error('Error duplicating workflow template:', error);
    throw error;
  }
};

/**
 * Workflow Instance Functions
 */

export const createWorkflowInstance = async (templateId, instanceData) => {
  try {
    if (!templateId) throw new Error('Template ID is required');

    const template = await getWorkflowTemplateById(templateId);
    if (!template) throw new Error('Template not found');

    const sanitizedData = {
      templateId,
      ...instanceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'initiated',
      currentStepIndex: 0,
      templateSnapshot: {
        name: template.name,
        description: template.description,
        steps: template.steps
      }
    };

    return await addToDatabase(COLLECTIONS.WORKFLOW_INSTANCES, sanitizedData);
  } catch (error) {
    console.error('Error creating workflow instance:', error);
    throw error;
  }
};

export const getWorkflowInstanceById = async (instanceId) => {
  try {
    if (!instanceId) throw new Error('Instance ID is required');
    const data = await getFromDatabase(`${COLLECTIONS.WORKFLOW_INSTANCES}/${instanceId}`);
    return data ? { id: instanceId, ...data } : null;
  } catch (error) {
    console.error('Error getting workflow instance:', error);
    throw error;
  }
};

export const getWorkflowInstances = async (filters = {}) => {
  try {
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: filters.limit
    };

    if (filters.status) options.filters.push({ field: 'status', value: filters.status });
    if (filters.templateId) options.filters.push({ field: 'templateId', value: filters.templateId });

    return await queryDatabaseAdvanced(COLLECTIONS.WORKFLOW_INSTANCES, options);
  } catch (error) {
    console.error('Error getting workflow instances:', error);
    throw error;
  }
};

export const updateWorkflowInstance = async (instanceId, updates) => {
  try {
    if (!instanceId) throw new Error('Instance ID is required');
    await updateToDatabase(`${COLLECTIONS.WORKFLOW_INSTANCES}/${instanceId}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating workflow instance:', error);
    throw error;
  }
};

export const completeWorkflowStep = async (instanceId, stepData = {}) => {
  try {
    if (!instanceId) throw new Error('Instance ID is required');

    const instance = await getWorkflowInstanceById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');

    const currentStepIndex = instance.currentStepIndex || 0;
    const templateSnapshot = instance.templateSnapshot;

    if (!templateSnapshot || !templateSnapshot.steps) {
      throw new Error('Template snapshot not found in instance');
    }

    const steps = templateSnapshot.steps;
    const nextStepIndex = currentStepIndex + 1;
    const status = nextStepIndex >= steps.length ? 'completed' : 'in_progress';

    const updates = {
      currentStepIndex: nextStepIndex,
      status,
      updatedAt: new Date().toISOString(),
      stepCompletions: {
        ...(instance.stepCompletions || {}),
        [currentStepIndex]: {
          ...stepData,
          completedAt: new Date().toISOString()
        }
      }
    };

    await updateToDatabase(`${COLLECTIONS.WORKFLOW_INSTANCES}/${instanceId}`, updates);

    const updatedData = await getWorkflowInstanceById(instanceId);
    return updatedData;
  } catch (error) {
    console.error('Error completing workflow step:', error);
    throw error;
  }
};

export const cancelWorkflowInstance = async (instanceId) => {
  try {
    if (!instanceId) throw new Error('Instance ID is required');
    await updateToDatabase(`${COLLECTIONS.WORKFLOW_INSTANCES}/${instanceId}`, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling workflow instance:', error);
    throw error;
  }
};

export const getCurrentWorkflowStep = async (instanceId) => {
  try {
    if (!instanceId) throw new Error('Instance ID is required');
    const instance = await getWorkflowInstanceById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');

    const currentStepIndex = instance.currentStepIndex || 0;
    const templateSnapshot = instance.templateSnapshot;

    if (!templateSnapshot || !templateSnapshot.steps) {
      throw new Error('Template snapshot not found in instance');
    }

    const steps = templateSnapshot.steps;
    if (currentStepIndex >= steps.length) return null;

    return {
      index: currentStepIndex,
      ...steps[currentStepIndex]
    };
  } catch (error) {
    console.error('Error getting current workflow step:', error);
    throw error;
  }
};
