const { db } = require('../config/firebase');

/**
 * Adds a new document to a Firestore collection with an auto-generated ID.
 * @param {string} collectionName 
 * @param {Object} data 
 * @returns {Promise<string>} The new document ID
 */
const addToDatabase = async (collectionName, data) => {
  try {
    const docRef = await db.collection(collectionName).add(data);
    return docRef.id;
  } catch (error) {
    console.error(`Firebase Admin SDK: Error adding to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Retrieves a single document from a Firestore path.
 * @param {string} path - (e.g. 'users/userId')
 * @returns {Promise<Object|null>}
 */
const getFromDatabase = async (path) => {
  try {
    const docSnap = await db.doc(path).get();
    return docSnap.exists ? docSnap.data() : null;
  } catch (error) {
    console.error(`Firebase Admin SDK: Error getting doc from ${path}:`, error);
    throw error;
  }
};

/**
 * Overwrites a Firestore document.
 * @param {string} path 
 * @param {Object} data 
 */
const setToDatabase = async (path, data) => {
  try {
    await db.doc(path).set(data);
  } catch (error) {
    console.error(`Firebase Admin SDK: Error setting doc at ${path}:`, error);
    throw error;
  }
};

/**
 * Updates specific fields on an existing Firestore document.
 * @param {string} path 
 * @param {Object} data 
 */
const updateToDatabase = async (path, data) => {
  try {
    await db.doc(path).update(data);
  } catch (error) {
    console.error(`Firebase Admin SDK: Error updating doc at ${path}:`, error);
    throw error;
  }
};

/**
 * Deletes a Firestore document.
 * @param {string} path 
 */
const deleteFromDatabase = async (path) => {
  try {
    await db.doc(path).delete();
  } catch (error) {
    console.error(`Firebase Admin SDK: Error deleting doc at ${path}:`, error);
    throw error;
  }
};

/**
 * Retrieves all documents in a collection.
 * @param {string} collectionName 
 * @returns {Promise<Array>} Array of document objects with `id` key
 */
const getAllFromDatabase = async (collectionName) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Firebase Admin SDK: Error listing collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Query Firestore collection using filters, sorting, and limit constraints.
 * @param {string} collectionName 
 * @param {Object} options 
 * @param {Array} options.filters - Array of { field, operator, value }
 * @param {Object} options.orderBy - { field, direction }
 * @param {number} options.limit - Max number of documents
 */
const queryDatabaseAdvanced = async (collectionName, options = {}) => {
  try {
    let queryRef = db.collection(collectionName);

    // Apply filters
    if (options.filters && Array.isArray(options.filters)) {
      options.filters.forEach(filter => {
        queryRef = queryRef.where(filter.field, filter.operator || '==', filter.value);
      });
    }

    // Apply sorting
    if (options.orderBy && options.orderBy.field) {
      queryRef = queryRef.orderBy(options.orderBy.field, options.orderBy.direction || 'desc');
    }

    // Apply limit
    if (options.limit) {
      queryRef = queryRef.limit(options.limit); //Limit the number of documents returned
    }

    const snapshot = await queryRef.get(); //Get the query results
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); //Returns the results in the format of { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error(`Firebase Admin SDK: Error querying ${collectionName}:`, error); //Log the error
    throw error; //Throw the error
  }
};

module.exports = {
  addToDatabase,
  getFromDatabase,
  setToDatabase,
  updateToDatabase,
  deleteFromDatabase,
  getAllFromDatabase,
  queryDatabaseAdvanced
};
