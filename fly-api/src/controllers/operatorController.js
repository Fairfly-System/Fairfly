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

  let uid;// Variable to hold the UID of the newly created operator, We input this later when we add the operator to the database, we set the docID to the UID of the operator so that we can easily reference it later. This is important because we want to ensure that each operator has a unique identifier in our database, and using the UID from Firebase Authentication allows us to maintain consistency between our authentication system and our database records.

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
      // Store the UID for later use
      uid = userRecord.uid;
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Failed to create operator account on Firebase: ' + error.message });
    }

    //Add the new operator to the database
    try{
      const docId = await addToDocumentWithId(COLLECTIONS.USERS, uid, {
        ...operatorData,
        role: 'operator',
        status: operatorData.status || 'Active', // Default to 'Active' if not provided
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
