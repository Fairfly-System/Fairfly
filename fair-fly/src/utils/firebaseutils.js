import { db, storage } from "../firebase-config";
import { ref, uploadBytes, getDownloadURL, deleteObject, list } from "firebase/storage";
import { ref as dbRef, set, get , update} from "firebase/database";

/**
 * 
 * @param {*} file -> The file to be uploaded
 * @param {*} path -> The path to the file in the storage bucket
 * @returns the snapshot and the download URL
 */
export async function uploadAndGetDownloadURLFromFirebase(file, path){
    try{
        const storageRef = ref(storage, path);//Set the reference for Uploading and getting download URL
        const snapshot = await uploadBytes(storageRef, file);
        const URL = await getDownloadURL(storageRef);
        return { snapshot, URL };
    }catch(e){
        console.log(e)
    }
}

/**
 * 
 * @param {*} file -> File to be uploaded
 * @param {*} storagePath -> The path to the file in the storage bucket
 * @param {*} dbPath -> The path to the object in the database
 * @param {*} urlFieldName -> The field name in the database where the download URL will be stored
 * @param {*} extraData -> Extra data to be set on the object
 */
export async function uploadAndSetMetaData(file, storagePath, dbPath, urlFieldName, extraData={}){//Where extra data is a JSON to be set on the object field. (EG. When uploading a photo, upload photo to a specied storagePath, and set The Metadata of the photo on the chosen path/obj)
    try{
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, storagePath);
        const metaData = {...extraData, [urlFieldName]: URL, createdAt: new Date().toISOString()};
        await setToDatabase(dbPath, metaData);
    }
    catch(e){
        console.log(e)
    }
}

/**
 * 
 * @param {*} file -> File to be uploaded
 * @param {*} path -> The path to the file in the storage bucket
 * @param {*} dbPath -> The path to the object in the database
 * @param {*} fieldName -> The field name in the database where the download URL will be stored
 */
export async function uploadAndSetDownloadURL(file, path, dbPath, fieldName){
    try{
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, path);
        setToDatabase(dbPath, {[fieldName]: URL});
    }catch(e){
        console.log(e)
    }
}

/**
 * 
 * @param {*} file -> File to be uploaded
 * @param {*} path -> The path to the file in the storage bucket
 * @param {*} dbPath -> The path to the object in the database
 * @param {*} fieldName -> The field name in the database where the download URL will be stored 
 */
export async function uploadAndUpdateDownloadURL(file, path, dbPath, fieldName){
    try{
        const { snapshot, URL } = await uploadAndGetDownloadURLFromFirebase(file, path);
        updateToDatabase(dbPath, {[fieldName]: URL});
    }catch(e){
        console.log(e)
    }
}

/**
 * 
 * @param {*} filePathOrURL -> The path to the file in the storage bucket
 */
export async function deleteFromFirebase(filePathOrURL) { 
    try {
        let storagePath = filePathOrURL;

        // If input is a full URL, convert it to a Storage path
        if (filePathOrURL.startsWith("https://")) {
        const pathEncoded = filePathOrURL.split("/o/")[1]?.split("?")[0];
            if (!pathEncoded) throw new Error("Invalid storage URL");
            storagePath = decodeURIComponent(pathEncoded);
        }

        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);

    } catch (e) {
        console.error("Failed to delete file from storage:", e);
    }
}

/**
 * 
 * @param {*} folderPath -> The path to the folder in the storage bucket
 */
export async function deleteFolderFromFirebase(folderPath) {//Deletes a folder and all its contents recursively
  const folderRef = ref(storage, folderPath);

  try {
    // Helper function to handle paginated listing
    async function deletePaginated(ref) {
      let pageToken = undefined;

      do {
        const listResult = await list(ref, { maxResults: 1000, pageToken }); //pageToken is used to paginate the list of files and folders

        // Delete all files in this batch
        const deleteFiles = listResult.items.map((itemRef) => deleteObject(itemRef));
        await Promise.all(deleteFiles); //Promise all to delete all files in the batch to avoid timeouts and to wait for all deletions to finish

        // Recursively delete all subfolders
        const deleteSubfolders = listResult.prefixes.map((subfolderRef) => //Since folders can't be deleted individually, we need to delete all their subfolders recursively
          deletePaginated(subfolderRef) //Use the function recursively to delete all subfolders
        );
        await Promise.all(deleteSubfolders); //Wait for all of them to finish

        pageToken = listResult.nextPageToken; //Set the next page token to the current one
      } while (pageToken);
    }

    await deletePaginated(folderRef);
    console.log(`Deleted folder and all contents: ${folderPath}`);
  } catch (e) {
    console.error(`Error deleting folder ${folderPath}:`, e);
  }
}

/**
 * Writes data to a specific path in Firebase Realtime Database.
 * Overwrites existing data at that location.
 *
 * @param {string} path
 * @param {any} data
 * @returns {Promise<void>}
 */
export async function setToDatabase(path, data) {
  try {
    const Ref = dbRef(db, path);
    await set(Ref, data);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Updates specific fields at a path in Firebase Realtime Database.
 * Only provided keys are updated.
 *
 * @param {string} path
 * @param {Object} data
 * @returns {Promise<void>}
 */
export async function updateToDatabase(path, data) {
  try {
    const Ref = dbRef(db, path);
    await update(Ref, data);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Retrieves raw data from a Firebase Realtime Database path.
 *
 * @param {string} path
 * @returns {Promise<any>}
 */
export async function getFromDatabase(path) {
  try {
    const Ref = dbRef(db, path);
    const snapshot = await get(Ref);
    return snapshot.val();
  } catch (e) {
    console.log(e);
  }
}

/**
 * Retrieves data and converts object values into an array.
 * ⚠️ Use only when data is stored as an object map.
 *
 * @param {string} path
 * @returns {Promise<Array<any>>}
 */
export async function getFromDatabaseToJson(path) {
  try {
    const Ref = dbRef(db, path);
    const snapshot = await get(Ref);
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  } catch (e) {
    console.log(e);
    return [];
  }
}

/**
 * Deletes data at a specific path in Firebase Realtime Database.
 * (Internally sets value to null)
 *
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteFromDatabase(path) {
  try {
    const Ref = dbRef(db, path);
    await set(Ref, null);
  } catch (e) {
    console.log(e);
  }
}
