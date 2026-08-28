const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { staticDataCache } = require('../services/cacheService');
const { deleteRecordStorageFiles, extractStorageUrls, deleteFilesFromStorage } = require('../services/storageService');

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

    const isOperator = req.userDetails?.role === 'operator';
    if (isOperator) {
      if (!req.userDetails?.isQualified) {
        return res.status(403).json({ error: 'Forbidden: Only qualified operators can create branch-exclusive services' });
      }
    }

    const createdByOperatorId = isOperator ? req.user.uid : (serviceData.createdByOperatorId || null);
    const branchUid = isOperator ? req.user.uid : (serviceData.branchUid || null);
    const branchName = isOperator
      ? (req.userDetails?.branchName || req.userDetails?.name || 'Branch Operator')
      : (serviceData.branchName || null);
    const isBranchExclusive = isOperator ? true : Boolean(serviceData.isBranchExclusive);

    const docId = await addToDatabase(COLLECTIONS.SERVICES, {
      ...serviceData,
      createdByOperatorId,
      branchUid,
      branchName,
      isBranchExclusive,
      category: serviceData.category || 'General Services',
      tags: Array.isArray(serviceData.tags) ? serviceData.tags.map(t => String(t).trim()).filter(Boolean) : [],
      coverImage: serviceData.coverImage || serviceData.coverPhoto || serviceData.coverPhotoUrl || '',
      carouselImages: Array.isArray(serviceData.carouselImages) ? serviceData.carouselImages.filter(Boolean) : [],
      description: serviceData.description || '',
      featured: isOperator ? false : Boolean(serviceData.featured),
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

    const isOperator = req.userDetails?.role === 'operator';
    if (isOperator) {
      if (!req.userDetails?.isQualified) {
        return res.status(403).json({ error: 'Forbidden: Only qualified operators can update services' });
      }
      if (existing.createdByOperatorId !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: You can only edit services created by your branch' });
      }
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
      sanitizedUpdates.featured = isOperator ? false : Boolean(updates.featured);
    }

    if (updates.requirements) {
      sanitizedUpdates.requirements = updates.requirements;
    }

    if (updates.workflowIds) {
      sanitizedUpdates.workflowIds = updates.workflowIds;
    }

    if (updates.isBranchExclusive !== undefined && !isOperator) {
      sanitizedUpdates.isBranchExclusive = Boolean(updates.isBranchExclusive);
    }

    if (updates.branchUid !== undefined && !isOperator) {
      sanitizedUpdates.branchUid = updates.branchUid;
    }

    if (updates.branchName !== undefined && !isOperator) {
      sanitizedUpdates.branchName = updates.branchName;
    }

    // Extract existing vs updated storage file URLs to perform diffing cleanup
    const existingStorageUrls = extractStorageUrls(existing);
    const updatedStorageUrls = extractStorageUrls(sanitizedUpdates);
    const removedStorageUrls = existingStorageUrls.filter((url) => !updatedStorageUrls.includes(url));

    await updateToDatabase(dbPath, sanitizedUpdates);

    // Delete removed photos and attachments from Firebase Storage
    if (removedStorageUrls.length > 0) {
      console.log(`[StorageDiff] Detected ${removedStorageUrls.length} removed file(s) on service update (${id}). Cleaning up from Firebase Storage...`, removedStorageUrls);
      await deleteFilesFromStorage(removedStorageUrls);
    }

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

    const isOperator = req.userDetails?.role === 'operator';
    if (isOperator) {
      if (existing.createdByOperatorId !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: You can only delete services created by your branch' });
      }
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
    const { branchUid } = req.query;

    let servicesList = staticDataCache.get(CACHE_KEYS.SERVICES);
    if (!servicesList) {
      const rawData = await getAllFromDatabase(COLLECTIONS.SERVICES);
      servicesList = rawData 
        ? Object.entries(rawData).map(([id, val]) => ({ id, ...val }))
        : [];
      staticDataCache.set(CACHE_KEYS.SERVICES, servicesList, 300);
    }

    if (branchUid) {
      const filtered = servicesList.filter((s) => !s.isBranchExclusive || s.branchUid === branchUid);
      return res.status(200).json(filtered);
    }

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
