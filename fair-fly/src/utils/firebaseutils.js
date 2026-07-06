import { db, storage, firestore } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, list } from "firebase/storage";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";

/**
 * Uploads a file to Firebase Storage and retrieves its download URL.
 */
export async function uploadAndGetDownloadURLFromFirebase(file, path) {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const URL = await getDownloadURL(storageRef);
        return { snapshot, URL };
    } catch (e) {
        console.error("uploadAndGetDownloadURLFromFirebase error:", e);
        throw e;
    }
}

/**
 * Uploads a file and sets metadata in Firestore.
 */
export async function uploadAndSetMetaData(file, storagePath, dbPath, urlFieldName, extraData = {}) {
    try {
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, storagePath);
        const metaData = { ...extraData, [urlFieldName]: URL, createdAt: new Date().toISOString() };
        await setToDatabase(dbPath, metaData);
        return { snapshot, URL };
    } catch (e) {
        console.error("uploadAndSetMetaData error:", e);
        throw e;
    }
}

/**
 * Simple wrapper to upload a file and set only the download URL in Firestore.
 */
export async function uploadAndSetDownloadURL(file, path, dbPath, fieldName) {
    try {
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, path);
        await updateToDatabase(dbPath, { [fieldName]: URL });
        return { snapshot, URL };
    } catch (e) {
        console.error("uploadAndSetDownloadURL error:", e);
        throw e;
    }
}

/**
 * Uploads a file and updates an existing download URL in Firestore.
 */
export async function uploadAndUpdateDownloadURL(file, path, dbPath, fieldName) {
    try {
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, path);
        await updateToDatabase(dbPath, { [fieldName]: URL });
        return { snapshot, URL };
    } catch (e) {
        console.error("uploadAndUpdateDownloadURL error:", e);
        throw e;
    }
}

/**
 * Higher-level function to upload file and store structured metadata.
 */
export async function uploadAndStoreFileMetadata(file, storagePath, firestorePath, urlFieldName, extraData = {}) {
    try {
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, storagePath);
        const metaData = { ...extraData, [urlFieldName]: URL, createdAt: new Date().toISOString() };
        await setToDatabase(firestorePath, metaData);
        return { snapshot, URL };
    } catch (e) {
        console.error("uploadAndStoreFileMetadata error:", e);
        throw e;
    }
}

/**
 * Deletes a file from Firebase Storage.
 */
export async function deleteFromFirebase(filePathOrURL) {
    try {
        let storagePath = filePathOrURL;
        if (filePathOrURL.startsWith("https://")) {
            const pathEncoded = filePathOrURL.split("/o/")[1]?.split("?")[0];
            if (!pathEncoded) throw new Error("Invalid storage URL");
            storagePath = decodeURIComponent(pathEncoded);
        }
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
    } catch (e) {
        console.error("Failed to delete file from storage:", e);
        throw e;
    }
}

/**
 * Deletes a folder and all its contents recursively from Firebase Storage.
 */
export async function deleteFolderFromFirebase(folderPath) {
    const folderRef = ref(storage, folderPath);
    try {
        async function deletePaginated(ref) {
            let pageToken = undefined;
            do {
                const listResult = await list(ref, { maxResults: 1000, pageToken });
                const deleteFiles = listResult.items.map((itemRef) => deleteObject(itemRef));
                await Promise.all(deleteFiles);
                const deleteSubfolders = listResult.prefixes.map((subfolderRef) => deletePaginated(subfolderRef));
                await Promise.all(deleteSubfolders);
                pageToken = listResult.nextPageToken;
            } while (pageToken);
        }
        await deletePaginated(folderRef);
    } catch (e) {
        console.error(`Error deleting folder ${folderPath}:`, e);
        throw e;
    }
}

/**
 * Writes data to a specific Firestore document path (Overwrites).
 * @param {string} path - Firestore document path (e.g., 'users/userId')
 * @param {Object} data - Data to write
 */
export async function setToDatabase(path, data) {
    try {
        const docRef = doc(firestore, path);
        await setDoc(docRef, data);
    } catch (e) {
        console.error("setToDatabase error:", e);
        throw e;
    }
}

/**
 * Updates specific fields in a Firestore document.
 * @param {string} path - Firestore document path
 * @param {Object} data - Fields to update
 */
export async function updateToDatabase(path, data) {
    try {
        const docRef = doc(firestore, path);
        await updateDoc(docRef, data);
    } catch (e) {
        console.error("updateToDatabase error:", e);
        throw e;
    }
}

/**
 * Retrieves a single document from Firestore.
 * @param {string} path - Firestore document path
 * @returns {Promise<Object|null>} Document data or null
 */
export async function getFromDatabase(path) {
    try {
        const docRef = doc(firestore, path);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        console.error("getFromDatabase error:", e);
        return null;
    }
}

/**
 * Alias for getFromDatabase.
 */
export async function getFromDatabaseToJson(path) {
    return await getFromDatabase(path);
}

/**
 * Deletes a document from Firestore.
 * @param {string} path - Firestore document path
 */
export async function deleteFromDatabase(path) {
    try {
        const docRef = doc(firestore, path);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("deleteFromDatabase error:", e);
        throw e;
    }
}

/**
 * Adds a new document to a collection with an auto-generated ID.
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Data to add
 * @returns {Promise<string>} The auto-generated ID
 */
export async function addToDatabase(collectionName, data) {
    try {
        const colRef = collection(firestore, collectionName);
        const docRef = await addDoc(colRef, data);
        return docRef.id;
    } catch (e) {
        console.error(`addToDatabase error in ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Gets all documents from a collection.
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} Array of documents {id, ...data}
 */
export async function getAllFromDatabase(collectionName) {
    try {
        const colRef = collection(firestore, collectionName);
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error(`getAllFromDatabase error in ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Advanced query function for Firestore.
 *
 * @param {string} collectionName - The name of the collection to query.
 * @param {Object} options - Query options.
 * @param {Array} options.filters - Array of filter objects { field, operator, value }.
 * @param {Object} options.orderBy - Order by object { field, direction }.
 * @param {number} options.limit - Maximum number of documents to return.
 * @returns {Promise<Array>} Array of matching documents {id, ...data}
 */
export async function queryDatabaseAdvanced(collectionName, options = {}) {
    try {
        let q = collection(firestore, collectionName);

        // Apply filters
        if (options.filters && Array.isArray(options.filters)) {
            options.filters.forEach(filter => {
                q = query(q, where(filter.field, filter.operator || '==', filter.value));
            });
        }

        // Apply ordering
        if (options.orderBy && options.orderBy.field) {
            q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'desc'));
        }

        // Apply limit
        if (options.limit) {
            q = query(q, limit(options.limit));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error(`queryDatabaseAdvanced error in ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Simple query wrapper for backward compatibility or simple equality checks.
 */
export async function queryDatabase(collectionName, field, value) {
    return await queryDatabaseAdvanced(collectionName, {
        filters: [{ field, value }]
    });
}
