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

const bulkStatusServices = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    await Promise.all(
      ids.map((id) =>
        updateToDatabase(`${COLLECTIONS.SERVICES}/${id}`, {
          status,
          updatedAt: new Date().toISOString()
        })
      )
    );

    staticDataCache.delete(CACHE_KEYS.SERVICES);
    return res.status(200).json({ message: `${ids.length} services updated successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk updating services:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const bulkDeleteServices = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await Promise.all(
      ids.map((id) => deleteFromDatabase(`${COLLECTIONS.SERVICES}/${id}`))
    );

    staticDataCache.delete(CACHE_KEYS.SERVICES);
    return res.status(200).json({ message: `${ids.length} services deleted successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting services:', error);
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
    const cachedData = staticDataCache.get(CACHE_KEYS.QUICK_LINKS);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const rawData = await getAllFromDatabase(COLLECTIONS.QUICK_LINKS);
    const linksList = rawData 
      ? Object.entries(rawData).map(([id, val]) => ({ id, ...val }))
      : [];

    staticDataCache.set(CACHE_KEYS.QUICK_LINKS, linksList, 300);

    return res.status(200).json(linksList);
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createQuickLink = async (req, res) => {
  try {
    const { title, url, category } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const docId = await addToDatabase(COLLECTIONS.QUICK_LINKS, {
      title,
      url,
      category: category || 'Other',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

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

    staticDataCache.delete(CACHE_KEYS.QUICK_LINKS);

    return res.status(200).json({ message: 'Quick link deleted successfully' });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const bulkDeleteQuickLinks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await Promise.all(
      ids.map((id) => deleteFromDatabase(`${COLLECTIONS.QUICK_LINKS}/${id}`))
    );

    staticDataCache.delete(CACHE_KEYS.QUICK_LINKS);
    return res.status(200).json({ message: `${ids.length} quick links deleted successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting quick links:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createService,
  updateService,
  deleteService,
  bulkStatusServices,
  bulkDeleteServices,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  bulkDeleteQuickLinks
};
