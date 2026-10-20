const { db, admin, bucket } = require('../config/firebase');
const { createNotification } = require('../services/notificationService');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');

const COLLECTIONS = {
  RESOURCES: 'resources',
  USERS: 'users'
};

/**
 * Create a new resource document (Admin only)
 */
const createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      fileExtension,
      visibility = 'all'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Resource title is required' });
    }
    if (!fileUrl) {
      return res.status(400).json({ error: 'Resource file URL is required' });
    }

    const now = new Date().toISOString();
    const formattedTags = Array.isArray(tags)
      ? tags.map(t => (t.startsWith('#') ? t : `#${t}`.trim()))
      : [];

    const newResource = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Documentation & Guides',
      tags: formattedTags,
      fileUrl: fileUrl.trim(),
      fileName: fileName || 'resource-file',
      fileSize: Number(fileSize) || 0,
      fileType: fileType || 'application/octet-stream',
      visibility: visibility || 'all',
      downloadCount: 0,
      uploadedByUid: req.user.uid,
      uploadedByName: req.userDetails?.fullName || req.userDetails?.name || req.userDetails?.username || 'Admin',
      uploadedByRole: 'admin',
      createdAt: now,
      updatedAt: now
    };

    const docId = generatePrefixedId(ID_PREFIXES.RESOURCE);
    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(docId);
    await docRef.set(newResource);
    const createdData = { 
      id: docId, 
      ...newResource, 
      fileExtension: (newResource.fileName && newResource.fileName.includes('.') ? newResource.fileName.split('.').pop().toLowerCase() : '') 
    };

    // Dispatch notifications to operators if visibility allows
    if (visibility !== 'admin') {
      db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'operator')
        .get()
        .then(snapshot => {
          snapshot.docs.forEach(opDoc => {
            createNotification({
              recipientUid: opDoc.id,
              recipientRole: 'operator',
              title: 'New Resource Available',
              message: `New material uploaded: "${newResource.title}" (${newResource.category})`,
              type: 'resource',
              link: '/operator/resources',
              metadata: { resourceId: docRef.id, category: newResource.category }
            });
          });
        })
        .catch(err => console.warn('Resource notification dispatch warning:', err.message));
    }

    return res.status(201).json({
      message: 'Resource uploaded and published successfully',
      resource: createdData
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * List resources with optional category, tag, or visibility filtering
 */
const getResources = async (req, res) => {
  try {
    const { category, tag, search, visibility } = req.query;
    const userRole = req.userDetails?.role || 'client';

    let queryRef = db.collection(COLLECTIONS.RESOURCES);

    // Operator cannot see admin-only resources
    if (userRole === 'operator') {
      queryRef = queryRef.where('visibility', 'in', ['all', 'operator']);
    } else if (visibility && visibility !== 'all') {
      queryRef = queryRef.where('visibility', '==', visibility);
    }

    if (category && category !== 'all') {
      queryRef = queryRef.where('category', '==', category);
    }

    const snapshot = await queryRef.get();
    let resources = snapshot.docs.map(doc => {
      const data = doc.data();
      const derivedExt = data.fileExtension || (data.fileName && data.fileName.includes('.') ? data.fileName.split('.').pop().toLowerCase() : '');
      return { id: doc.id, ...data, fileExtension: derivedExt };
    });

    // Client-side sort by createdAt desc
    resources.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Tag filter
    if (tag && tag !== 'all') {
      const targetTag = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;
      resources = resources.filter(r => 
        Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase() === targetTag)
      );
    }

    // Search filter (title, description, fileName)
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      resources = resources.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.fileName && r.fileName.toLowerCase().includes(q)) ||
        (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    const pageNum = parseInt(req.query.page, 10);
    const limitNum = parseInt(req.query.limit, 10);

    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      const total = resources.length;
      const paginated = resources.slice((p - 1) * l, p * l);
      return res.status(200).json({
        data: paginated,
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      });
    }

    return res.status(200).json(resources);
  } catch (error) {
    console.error('Error listing resources:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Get a single resource by ID
 */
const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const rawData = doc.data();
    const derivedExt = rawData.fileExtension || (rawData.fileName && rawData.fileName.includes('.') ? rawData.fileName.split('.').pop().toLowerCase() : '');
    const data = { id: doc.id, ...rawData, fileExtension: derivedExt };
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error getting resource by id:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Update resource metadata (Admin only)
 */
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, visibility } = req.body;

    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (title && title.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category) updates.category = category;
    if (visibility) updates.visibility = visibility;
    if (Array.isArray(tags)) {
      updates.tags = tags.map(t => (t.startsWith('#') ? t : `#${t}`.trim()));
    }

    await docRef.update(updates);

    return res.status(200).json({
      message: 'Resource updated successfully',
      id,
      updates
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Delete a resource (Admin only)
 */
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await docRef.delete();
    return res.status(200).json({ message: 'Resource deleted successfully', id });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Record a resource download (Increments downloadCount)
 */
const recordDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const adminSDK = require('firebase-admin');
    await docRef.update({
      downloadCount: adminSDK.firestore.FieldValue.increment(1),
      lastDownloadedAt: new Date().toISOString()
    });

    const updatedDoc = await docRef.get();
    return res.status(200).json({
      message: 'Download recorded',
      downloadCount: updatedDoc.data().downloadCount || 1,
      fileUrl: existing.data().fileUrl
    });
  } catch (error) {
    console.error('Error recording download:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Stream/download a resource file directly with attachment disposition
 */
const downloadResourceFile = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTIONS.RESOURCES).doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = existing.data();
    if (!resource.fileUrl) {
      return res.status(400).json({ error: 'No file URL associated with this resource' });
    }

    // Increment downloadCount asynchronously
    docRef.update({
      downloadCount: admin.firestore.FieldValue.increment(1),
      lastDownloadedAt: new Date().toISOString()
    }).catch((err) => console.warn('[Resource] Failed to increment download count:', err.message));

    const safeFileName = (resource.fileName || resource.title || 'resource-material')
      .replace(/[/\\?%*:|"<>]/g, '_');

    res.setHeader('Content-Type', resource.fileType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(safeFileName)}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`
    );

    // 1. Try streaming directly from storage bucket if path is present or can be extracted
    let storagePath = resource.storagePath || null;
    if (!storagePath && resource.fileUrl) {
      const match = resource.fileUrl.match(/\/o\/([^?]+)/);
      if (match) {
        storagePath = decodeURIComponent(match[1]);
      }
    }

    if (storagePath && bucket) {
      const file = bucket.file(storagePath);
      const [exists] = await file.exists();
      if (exists) {
        return file
          .createReadStream()
          .on('error', (err) => {
            console.error('[Resource] Storage stream error:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to stream resource file' });
            }
          })
          .pipe(res);
      }
    }

    // 2. Fallback: fetch directly from fileUrl and pipe to response
    const fetchRes = await fetch(resource.fileUrl);
    if (!fetchRes.ok) {
      throw new Error(`Failed to fetch file from storage: ${fetchRes.statusText}`);
    }

    const { Readable } = require('stream');
    return Readable.fromWeb(fetchRes.body)
      .on('error', (err) => {
        console.error('[Resource] Remote stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream remote file' });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error('Error downloading resource file:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  recordDownload,
  downloadResourceFile
};
