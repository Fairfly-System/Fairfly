const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { staticDataCache } = require('../services/cacheService');
const { deleteRecordStorageFiles } = require('../services/storageService');

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
      category: serviceData.category || 'General Services',
      tags: Array.isArray(serviceData.tags) ? serviceData.tags.map(t => String(t).trim()).filter(Boolean) : [],
      coverImage: serviceData.coverImage || serviceData.coverPhoto || serviceData.coverPhotoUrl || '',
      carouselImages: Array.isArray(serviceData.carouselImages) ? serviceData.carouselImages.filter(Boolean) : [],
      description: serviceData.description || '',
      featured: Boolean(serviceData.featured),
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

    if (updates.category !== undefined) {
      sanitizedUpdates.category = updates.category || 'General Services';
    }

    if (updates.tags !== undefined) {
      sanitizedUpdates.tags = Array.isArray(updates.tags)
        ? updates.tags.map(t => String(t).trim()).filter(Boolean)
        : [];
    }

    if (updates.coverImage !== undefined || updates.coverPhoto !== undefined || updates.coverPhotoUrl !== undefined) {
      sanitizedUpdates.coverImage = updates.coverImage !== undefined 
        ? updates.coverImage 
        : (updates.coverPhoto !== undefined ? updates.coverPhoto : updates.coverPhotoUrl || '');
    }

    if (updates.carouselImages !== undefined) {
      sanitizedUpdates.carouselImages = Array.isArray(updates.carouselImages)
        ? updates.carouselImages.filter(Boolean)
        : [];
    }

    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description || '';
    }

    if (updates.featured !== undefined) {
      sanitizedUpdates.featured = Boolean(updates.featured);
    }

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

    // Clean up attached files from Firebase Storage
    await deleteRecordStorageFiles(existing);

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

    const existingRecords = await Promise.all(
      ids.map(id => getFromDatabase(`${COLLECTIONS.SERVICES}/${id}`))
    );

    await Promise.all(
      ids.map((id) => deleteFromDatabase(`${COLLECTIONS.SERVICES}/${id}`))
    );

    // Clean up attached files from Firebase Storage for all deleted services
    await deleteRecordStorageFiles(existingRecords);

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
      return res.status(400).json({ error: 'Quick Link ID is required' });
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
      return res.status(400).json({ error: 'Quick Link ID is required' });
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

const getServices = async (req, res) => {
  try {
    const cachedData = staticDataCache.get(CACHE_KEYS.SERVICES);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const rawData = await getAllFromDatabase(COLLECTIONS.SERVICES);
    const servicesList = rawData 
      ? Object.entries(rawData).map(([id, val]) => ({ id, ...val }))
      : [];

    staticDataCache.set(CACHE_KEYS.SERVICES, servicesList, 300);

    return res.status(200).json(servicesList);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    const dbPath = `${COLLECTIONS.SERVICES}/${id}`;
    const service = await getFromDatabase(dbPath);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.status(200).json({ id, ...service });
  } catch (error) {
    console.error('Error getting service by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getServices,
  getServiceById,
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
