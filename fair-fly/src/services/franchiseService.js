import {
  addToDatabase,
  getAllFromDatabase,
  queryDatabaseAdvanced,
  getFromDatabase,
  updateToDatabase,
  deleteFromDatabase
} from '../utils/firebaseutils';
import { globalRateLimiter } from '../utils/rateLimiter';
import { auth } from '../firebase';

/**
 * Franchise Management Service
 * Handles CRUD operations for franchise applications, operators, and services
 *
 * This service now delegates all Firestore operations to firebaseutils.js
 * for consistency, maintainability, and better error handling.
 */

const COLLECTIONS = {
  FRANCHISE_APPLICATIONS: 'franchiseApplications',
  OPERATORS: 'operators',
  SERVICES: 'services',
  QUICK_LINKS: 'quickLinks'
};

/**
 * Franchise Application Functions
 */

export const submitFranchiseApplication = async (applicationData) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`submit-app-${userId}`)) {
      throw new Error('Too many submissions. Please try again in a minute.');
    }

    if (!applicationData) {
      throw new Error('Application data is required');
    }

    const requiredFields = ['fullName', 'phoneNumber', 'email', 'preferredBranchLocation'];
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const sanitizedData = {
      ...applicationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
    };

    // Use addToDatabase (Firestore generates the ID, removes redundant uuidv4)
    return await addToDatabase(COLLECTIONS.FRANCHISE_APPLICATIONS, sanitizedData);
  } catch (error) {
    console.error('Error submitting franchise application:', error);
    throw error;
  }
};

export const getFranchiseApplicationById = async (applicationId) => {
  try {
    if (!applicationId) throw new Error('Application ID is required');

    const data = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${applicationId}`);
    return data ? { id: applicationId, ...data } : null;
  } catch (error) {
    console.error('Error getting franchise application:', error);
    throw error;
  }
};

export const getFranchiseApplications = async (filters = {}) => {
  try {
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: filters.limit
    };

    if (filters.status) options.filters.push({ field: 'status', value: filters.status });
    if (filters.startDate) options.filters.push({ field: 'createdAt', operator: '>=', value: filters.startDate });
    if (filters.endDate) options.filters.push({ field: 'createdAt', operator: '<=', value: filters.endDate });

    return await queryDatabaseAdvanced(COLLECTIONS.FRANCHISE_APPLICATIONS, options);
  } catch (error) {
    console.error('Error getting franchise applications:', error);
    throw error;
  }
};

export const updateFranchiseApplicationStatus = async (applicationId, status) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`update-app-status-${userId}`)) {
      throw new Error('Too many updates. Please slow down.');
    }

    if (!applicationId || !status) throw new Error('Application ID and status are required');

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');

    await updateToDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${applicationId}`, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating franchise application status:', error);
    throw error;
  }
};

export const deleteFranchiseApplication = async (applicationId) => {
  try {
    if (!applicationId) throw new Error('Application ID is required');
    await deleteFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${applicationId}`);
  } catch (error) {
    console.error('Error deleting franchise application:', error);
    throw error;
  }
};

/**
 * Operator Management Functions
 */

export const createOperator = async (operatorData) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`create-operator-${userId}`)) {
      throw new Error('Too many operator creations. Please wait.');
    }

    if (!operatorData) throw new Error('Operator data is required');

    const requiredFields = ['branchName', 'username'];
    for (const field of requiredFields) {
      if (!operatorData[field]) throw new Error(`Missing required field: ${field}`);
    }

    // Check unique username
    const existing = await queryDatabase(COLLECTIONS.OPERATORS, 'username', operatorData.username);
    if (existing && existing.length > 0) throw new Error('Username already exists');

    const sanitizedData = {
      ...operatorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active',
      servicesHandled: 0,
    };

    return await addToDatabase(COLLECTIONS.OPERATORS, sanitizedData);
  } catch (error) {
    console.error('Error creating operator:', error);
    throw error;
  }
};

export const getOperatorById = async (operatorId) => {
  try {
    if (!operatorId) throw new Error('Operator ID is required');
    const data = await getFromDatabase(`${COLLECTIONS.OPERATORS}/${operatorId}`);
    return data ? { id: operatorId, ...data } : null;
  } catch (error) {
    console.error('Error getting operator:', error);
    throw error;
  }
};

export const getOperators = async (filters = {}) => {
  try {
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: filters.limit
    };

    if (filters.status) options.filters.push({ field: 'status', value: filters.status });
    if (filters.branchName) options.filters.push({ field: 'branchName', value: filters.branchName });

    return await queryDatabaseAdvanced(COLLECTIONS.OPERATORS, options);
  } catch (error) {
    console.error('Error getting operators:', error);
    throw error;
  }
};

export const updateOperator = async (operatorId, updates) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`update-operator-${userId}`)) {
      throw new Error('Too many updates. Please wait.');
    }

    if (!operatorId) throw new Error('Operator ID is required');
    await updateToDatabase(`${COLLECTIONS.OPERATORS}/${operatorId}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating operator:', error);
    throw error;
  }
};

export const deleteOperator = async (operatorId) => {
  try {
    if (!operatorId) throw new Error('Operator ID is required');
    await deleteFromDatabase(`${COLLECTIONS.OPERATORS}/${operatorId}`);
  } catch (error) {
    console.error('Error deleting operator:', error);
    throw error;
  }
};

/**
 * Service Management Functions
 */

export const createService = async (serviceData) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`create-service-${userId}`)) {
      throw new Error('Too many service creations. Please wait.');
    }

    if (!serviceData) throw new Error('Service data is required');
    const requiredFields = ['name', 'price'];
    for (const field of requiredFields) {
      if (!serviceData[field]) throw new Error(`Missing required field: ${field}`);
    }

    const sanitizedData = {
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active'
    };

    return await addToDatabase(COLLECTIONS.SERVICES, sanitizedData);
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const getServiceById = async (serviceId) => {
  try {
    if (!serviceId) throw new Error('Service ID is required');
    const data = await getFromDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`);
    return data ? { id: serviceId, ...data } : null;
  } catch (error) {
    console.error('Error getting service:', error);
    throw error;
  }
};

export const getServices = async (filters = {}) => {
  try {
    const options = {
      filters: [],
      orderBy: { field: 'name', direction: 'asc' },
      limit: filters.limit
    };

    if (filters.status) options.filters.push({ field: 'status', value: filters.status });

    return await queryDatabaseAdvanced(COLLECTIONS.SERVICES, options);
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

export const updateService = async (serviceId, updates) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`update-service-${userId}`)) {
      throw new Error('Too many updates. Please wait.');
    }

    if (!serviceId) throw new Error('Service ID is required');
    await updateToDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    if (!serviceId) throw new Error('Service ID is required');
    await deleteFromDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

/**
 * Quick Links Management Functions
 */

export const createQuickLink = async (linkData) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    if (!globalRateLimiter.isAllowed(`create-link-${userId}`)) {
      throw new Error('Too many link creations. Please wait.');
    }

    if (!linkData) throw new Error('Link data is required');
    const requiredFields = ['title', 'url'];
    for (const field of requiredFields) {
      if (!linkData[field]) throw new Error(`Missing required field: ${field}`);
    }

    const sanitizedData = {
      ...linkData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active'
    };

    return await addToDatabase(COLLECTIONS.QUICK_LINKS, sanitizedData);
  } catch (error) {
    console.error('Error creating quick link:', error);
    throw error;
  }
};

export const getQuickLinks = async () => {
  try {
    const options = {
      filters: [{ field: 'status', value: 'Active' }],
      orderBy: { field: 'createdAt', direction: 'asc' }
    };
    return await queryDatabaseAdvanced(COLLECTIONS.QUICK_LINKS, options);
  } catch (error) {
    console.error('Error getting quick links:', error);
    throw error;
  }
};