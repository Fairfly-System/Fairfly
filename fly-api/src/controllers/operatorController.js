const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase,
  addToDocumentWithId
} = require('../services/firebaseService');
const { staticDataCache } = require('../services/cacheService');
const admin = require('firebase-admin');
const COLLECTIONS = {
  USERS: 'users',
};

/**
 * Create a new operator (Admin only)
 */
const createOperator = async (req, res) => {
  let uid;

  try {
    const operatorData = req.body;
    try {
      const userRecord = await admin.auth().createUser({
        email: operatorData.email,
        password: operatorData.password,
        displayName: operatorData.branchName
      });
      console.log('Successfully created new user:', userRecord.uid);
      uid = userRecord.uid;
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Failed to create operator account on Firebase: ' + error.message });
    }

    try {
      await addToDocumentWithId(COLLECTIONS.USERS, uid, {
        ...operatorData,
        role: 'operator',
        status: operatorData.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding operator to database:', error);
      return res.status(500).json({ error: 'Failed to add operator to database: ' + error.message });
    }
    
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

    await updateToDatabase(dbPath, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

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

    await Promise.all(
      ids.map((id) =>
        updateToDatabase(`${COLLECTIONS.USERS}/${id}`, {
          status,
          updatedAt: new Date().toISOString()
        })
      )
    );

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

    return res.status(200).json({ message: `${ids.length} operators deleted successfully`, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting operators:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createOperator,
  updateOperator,
  deleteOperator,
  bulkStatusOperators,
  bulkDeleteOperators
};
