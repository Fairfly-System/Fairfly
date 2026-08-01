const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { staticDataCache } = require('../services/cacheService');

const COLLECTIONS = {
  SERVICES: 'services',
  QUICK_LINKS: 'quickLinks'
};

const CACHE_KEYS = {
  SERVICES: 'services-list',
  QUICK_LINKS: 'quicklinks-list'
};

/**
 * ============================================================================
 * Services CRUD
 * ============================================================================
 */

const createService = async (req, res) => {
  try {
    const serviceData = req.body;
    if(!serviceData || !serviceData.name || !serviceData.price || !serviceData.processingTime) {
      return res.status(400).json({ error: 'Invalid service data' });
    }

    const docId = await addToDatabase(COLLECTIONS.SERVICES, {
      ...serviceData,
      requirements: Array.isArray(serviceData.requirements) ? serviceData.requirements : (serviceData.actions || []),
      workflowIds: Array.isArray(serviceData.workflowIds) ? serviceData.workflowIds : [],
      status: serviceData.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.SERVICES);

    return res.status(201).json({ id: docId, message: 'Service created successfully' });
  } catch (error) {
    console.error('Error creating service:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    const dbPath = `${COLLECTIONS.SERVICES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const sanitizedUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.requirements) {
      sanitizedUpdates.requirements = updates.requirements;
    }

    if (updates.workflowIds) {
      sanitizedUpdates.workflowIds = updates.workflowIds;
    }

    await updateToDatabase(dbPath, sanitizedUpdates);

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.SERVICES);

    return res.status(200).json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    const dbPath = `${COLLECTIONS.SERVICES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await deleteFromDatabase(dbPath);

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.SERVICES);

    return res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * ============================================================================
 * Quick Links CRUD
 * ============================================================================
 */

const getQuickLinks = async (req, res) => {
  try {
    let quickLinks = staticDataCache.get(CACHE_KEYS.QUICK_LINKS);
    if (quickLinks) {
      console.log('Serving quick links list from cache.');
      return res.status(200).json(quickLinks);
    }

    console.log('Cache miss for quick links list. Fetching from Firestore.');
    quickLinks = await getAllFromDatabase(COLLECTIONS.QUICK_LINKS);
    staticDataCache.set(CACHE_KEYS.QUICK_LINKS, quickLinks);
    return res.status(200).json(quickLinks);
  } catch (error) {
    console.error('Error getting quick links:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createQuickLink = async (req, res) => {
  try {
    const linkData = req.body;
    if (!linkData || !linkData.title || !linkData.url || !linkData.category) {
      return res.status(400).json({ error: 'Title, URL, and category are required' });
    }

    const docId = await addToDatabase(COLLECTIONS.QUICK_LINKS, {
      ...linkData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.QUICK_LINKS);

    return res.status(201).json({ id: docId, message: 'Quick link created successfully' });
  } catch (error) {
    console.error('Error creating quick link:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Quick link ID is required' });
    }

    const dbPath = `${COLLECTIONS.QUICK_LINKS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Quick link not found' });
    }

    await updateToDatabase(dbPath, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.QUICK_LINKS);

    return res.status(200).json({ message: 'Quick link updated successfully' });
  } catch (error) {
    console.error('Error updating quick link:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Quick link ID is required' });
    }

    const dbPath = `${COLLECTIONS.QUICK_LINKS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Quick link not found' });
    }

    await deleteFromDatabase(dbPath);

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.QUICK_LINKS);

    return res.status(200).json({ message: 'Quick link deleted successfully' });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createService,
  updateService,
  deleteService,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink
};
