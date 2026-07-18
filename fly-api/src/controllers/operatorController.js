const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { staticDataCache } = require('../services/cacheService');
const admin = require('firebase-admin');
const COLLECTIONS = {
  USERS: 'users',
};
const CACHE_KEYS = {
  OPERATORS: 'operators-list'
};

/**
 * Create a new operator (Admin only)
 */
const createOperator = async (req, res) => {

  try {
    const operatorData = req.body;
    //Make an Account for the operator using Firebase Authentication
    try {
      const userRecord = await admin.auth().createUser({
        email: operatorData.email,
        password: operatorData.password,
        displayName: operatorData.branchName
      });
      console.log('Successfully created new user:', userRecord.uid);
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Failed to create operator account on Firebase: ' + error.message });
    }

    //Add the new operator to the database
    const docId = await addToDatabase(COLLECTIONS.USERS, {
      ...operatorData,
      role: 'operator',
      status: operatorData.status || 'Active', // Default to 'Active' if not provided
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.USERS);
    return res.status(201).json({ id: docId, message: 'Operator created successfully' });

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

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.USERS);

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

    //delete the operator from Firebase Authentication
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

    // Invalidate Cache
    staticDataCache.delete(CACHE_KEYS.USERS);

    return res.status(200).json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createOperator,
  updateOperator,
  deleteOperator
};
