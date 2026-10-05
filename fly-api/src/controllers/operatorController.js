const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase,
  addToDocumentWithId
} = require('../services/firebaseService');
const { staticDataCache, userCache } = require('../services/cacheService');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');
const admin = require('firebase-admin');
const COLLECTIONS = {
  USERS: 'users',
  FRANCHISE_APPLICATIONS: 'franchiseApplications',
  APPOINTMENTS: 'appointments'
};
const CACHE_KEYS = {
  BRANCHES: 'branches-list'
};

/**
 * Create a new operator (Admin only)
 */
const createOperator = async (req, res) => {
  let uid;

  try {
    const operatorData = req.body;
    try {
      const generatedUid = generatePrefixedId(ID_PREFIXES.OPERATOR);
      const userRecord = await admin.auth().createUser({
        uid: generatedUid,
        email: operatorData.email,
        password: operatorData.password,
        displayName: operatorData.branchName
      });
      console.log('Successfully created new operator user:', userRecord.uid);
      uid = userRecord.uid;
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Failed to create operator account on Firebase: ' + error.message });
    }

    try {
      const { password: _plainPassword, ...cleanOperatorData } = operatorData;
      await addToDocumentWithId(COLLECTIONS.USERS, uid, {
        ...cleanOperatorData,
        role: 'operator',
        isQualified: Boolean(operatorData.isQualified) || false,
        status: operatorData.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Post-consultation franchise approval linking
      if (operatorData.franchiseApplicationId) {
        const appDbPath = `${COLLECTIONS.FRANCHISE_APPLICATIONS}/${operatorData.franchiseApplicationId}`;
        const existingApp = await getFromDatabase(appDbPath);
        if (existingApp) {
          await updateToDatabase(appDbPath, {
            status: 'approved',
            operatorId: uid,
            updatedAt: new Date().toISOString()
          });

          // Also link consultation appointment if present
          const apptId = operatorData.appointmentId || existingApp.consultationAppointmentId;
          if (apptId) {
            const apptDbPath = `${COLLECTIONS.APPOINTMENTS}/${apptId}`;
            const existingAppt = await getFromDatabase(apptDbPath);
            if (existingAppt) {
              await updateToDatabase(apptDbPath, {
                operatorId: uid,
                status: 'Completed',
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error adding operator to database:', error);
      return res.status(500).json({ error: 'Failed to add operator to database: ' + error.message });
    }
    
    staticDataCache.delete(CACHE_KEYS.BRANCHES);
    return res.status(201).json({ id: uid, message: 'Operator created successfully' });

  } catch (error) {
    console.error('Error creating operator:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update operator details (Admin only)
 */
const updateOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const dbPath = `${COLLECTIONS.USERS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    const sanitizedUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.isQualified !== undefined) {
      sanitizedUpdates.isQualified = Boolean(updates.isQualified);
    }

    if (updates.status !== undefined) {
      sanitizedUpdates.status = updates.status;
      const isDisabling = updates.status === 'Disabled' || updates.status === 'Deactivated' || updates.status === 'Inactive';
      try {
        await admin.auth().updateUser(id, { disabled: isDisabling });
        if (isDisabling) {
          await admin.auth().revokeRefreshTokens(id);
        }
      } catch (authErr) {
        console.warn(`[Operator] Could not sync disabled state to Firebase Auth for operator ${id}:`, authErr.message);
      }
    }

    await updateToDatabase(dbPath, sanitizedUpdates);

    // Invalidate userCache & branches cache
    if (userCache) {
      userCache.del(id);
    }
    staticDataCache.delete(CACHE_KEYS.BRANCHES);

    return res.status(200).json({ message: 'Operator updated successfully' });
  } catch (error) {
    console.error('Error updating operator:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Delete an operator (Admin only)
 */
const deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    try {
      await admin.auth().deleteUser(id);
      console.log('Successfully deleted user:', id);
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete operator account from Firebase' });
    }

    const dbPath = `${COLLECTIONS.USERS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    await deleteFromDatabase(dbPath);
    if (userCache) {
      userCache.del(id);
    }
    staticDataCache.delete(CACHE_KEYS.BRANCHES);

    return res.status(200).json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Bulk update operator status (Admin only)
 */
const bulkStatusOperators = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    const isDisabling = status === 'Disabled' || status === 'Deactivated' || status === 'Inactive';

    await Promise.all(
      ids.map(async (id) => {
        await updateToDatabase(`${COLLECTIONS.USERS}/${id}`, {
          status,
          updatedAt: new Date().toISOString()
        });
        if (userCache) {
          userCache.del(id);
        }
        try {
          await admin.auth().updateUser(id, { disabled: isDisabling });
          if (isDisabling) {
            await admin.auth().revokeRefreshTokens(id);
          }
        } catch (authErr) {
          console.warn(`[Operator] Could not sync disabled state in bulk to Firebase Auth for ${id}:`, authErr.message);
        }
      })
    );

    staticDataCache.delete(CACHE_KEYS.BRANCHES);
    return res.status(200).json({ message: `${ids.length} operators updated successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk updating operators:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Bulk delete operators (Admin only)
 */
const bulkDeleteOperators = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await Promise.all(
      ids.map(async (id) => {
        try {
          await admin.auth().deleteUser(id);
        } catch (err) {
          console.error(`Error deleting Firebase Auth user ${id}:`, err);
        }
        await deleteFromDatabase(`${COLLECTIONS.USERS}/${id}`);
      })
    );

    staticDataCache.delete(CACHE_KEYS.BRANCHES);
    return res.status(200).json({ message: `${ids.length} operators deleted successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting operators:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get all operators (Admin only)
 */
const getOperators = async (req, res) => {
  try {
    const { queryDatabaseAdvanced } = require('../services/firebaseService');
    const operators = await queryDatabaseAdvanced(COLLECTIONS.USERS, {
      filters: [{ field: 'role', operator: '==', value: 'operator' }]
    });

    const sorted = (operators || []).map((op) => {
      const { password: _pw, ...cleanOp } = op;
      return {
        id: op.id,
        uid: op.id,
        ...cleanOp
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json(sorted);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get single operator by ID (Admin only)
 */
const getOperatorById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Operator ID is required' });

    const dbPath = `${COLLECTIONS.USERS}/${id}`;
    const operator = await getFromDatabase(dbPath);
    if (!operator || operator.role !== 'operator') {
      return res.status(404).json({ error: 'Operator not found' });
    }

    const { password: _pw, ...cleanOperator } = operator;
    return res.status(200).json({ id, uid: id, ...cleanOperator });
  } catch (error) {
    console.error('Error fetching operator by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Helper to fetch active branches (cached for 5 minutes)
 */
const fetchActiveBranchesInternal = async () => {
  const cached = staticDataCache.get(CACHE_KEYS.BRANCHES);
  if (cached) {
    return cached;
  }

  const { queryDatabaseAdvanced } = require('../services/firebaseService');
  const operators = await queryDatabaseAdvanced(COLLECTIONS.USERS, {
    filters: [{ field: 'role', operator: '==', value: 'operator' }]
  });

  const activeBranches = (operators || [])
    .filter((op) => op.status !== 'Inactive' && op.status !== 'Disabled' && op.status !== 'Deactivated')
    .map((op) => {
      const branchTitle = op.branchName || op.name || 'Branch Operator';
      const branchLocation = op.address || op.location || '';
      return {
        uid: op.id,
        id: op.id,
        branchName: branchTitle,
        name: branchTitle,
        address: branchLocation,
        location: branchLocation,
        email: op.email || '',
        contactNumber: op.contactNumber || op.phone || '',
        isQualified: op.isQualified === true
      };
    });

  staticDataCache.set(CACHE_KEYS.BRANCHES, activeBranches, 300);
  return activeBranches;
};

/**
 * Get active branches/operators list (Specifically for Form dropdown selection)
 * Supports optional search filtering via ?search= or ?q=
 */
const getBranches = async (req, res) => {
  try {
    let activeBranches = await fetchActiveBranchesInternal();

    const search = (req.query.search || req.query.q || '').trim().toLowerCase();
    if (search) {
      activeBranches = activeBranches.filter((b) =>
        (b.branchName || '').toLowerCase().includes(search) ||
        (b.address || '').toLowerCase().includes(search) ||
        (b.email || '').toLowerCase().includes(search)
      );
    }

    return res.status(200).json(activeBranches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const { getOperatorLogs } = require('../services/operatorLoggerService');

/**
 * Get paginated activity logs for an operator
 * Accessible by Admins (for any operator) or the specific Operator (for their own logs).
 * GET /api/operators/:id/logs?limit=5&startAfterId=...&onlyActive=true
 */
const getOperatorActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.userDetails?.role || req.user?.role;
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    // Target operator UID resolution: 'me' resolves to current user
    const targetOperatorId = (id === 'me') ? req.user.uid : id;

    // RBAC: Operators can only read their own logs
    if (isOperator && targetOperatorId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own activity history.' });
    }

    if (!isAdmin && !isOperator) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
    }

    const limitCount = parseInt(req.query.limit, 10) || 5;
    const startAfterId = req.query.startAfterId || null;
    const onlyActive = req.query.onlyActive !== 'false';

    const result = await getOperatorLogs({
      operatorId: targetOperatorId,
      limitCount,
      startAfterId,
      onlyActive
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching operator activity logs:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  getOperators,
  getOperatorById,
  getBranches,
  fetchActiveBranchesInternal,
  createOperator,
  updateOperator,
  deleteOperator,
  bulkStatusOperators,
  bulkDeleteOperators,
  getOperatorActivityLogs
};

