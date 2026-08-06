import { collection, addDoc, getDocs, query, orderBy, limit, onSnapshot, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { uploadFileToBackend } from '../utils/fileUploadApi';

/**
 * Chat Service for Real-Time Messaging using Firestore
 * Follows Firestore Guidelines from CLAUDE.md:
 * - Use Firestore Standard
 * - Structure collections logically
 * - Validate data before writing
 * - Handle Firestore errors
 * - Handle permission-denied responses
 */

const COLLECTIONS = {
  CHATS: 'chats',
  MESSAGES: 'messages'
};

/**
 * Create a new chat conversation
 * @param {Object} chatData - Chat data (participants, etc.)
 * @returns {Promise<string>} Chat ID
 */
export const createChat = async (chatData) => {
  try {
    // Validate data before writing
    if (!chatData || !chatData.participants) {
      throw new Error('Invalid chat data: participants required');
    }

    const chatDoc = await addDoc(collection(firestore, COLLECTIONS.CHATS), {
      ...chatData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return chatDoc.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

/**
 * Get chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Chat data
 */
export const getChatById = async (chatId) => {
  try {
    const chatDoc = doc(firestore, `${COLLECTIONS.CHATS}/${chatId}`);
    const chatSnap = await getDoc(chatDoc);

    if (chatSnap.exists()) {
      return { id: chatSnap.id, ...chatSnap.data() };
    }

    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

/**
 * Send a message to a chat
 * @param {string} chatId - Chat ID
 * @param {Object} messageData - Message data (senderId, content, etc.)
 * @returns {Promise<string>} Message ID
 */
export const sendMessage = async (chatId, messageData) => {
  try {
    // Validate data before writing
    if (!chatId || !messageData || !messageData.senderId || !messageData.content) {
      throw new Error('Invalid message data: chatId, senderId, and content required');
    }

    const messageDoc = await addDoc(collection(firestore, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`), {
      ...messageData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // Update chat's updatedAt timestamp
    const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      updatedAt: new Date().toISOString(),
      lastMessage: messageData.content.substring(0, 100) // Preview
    });

    return messageDoc.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Send a file message (image, document, etc.) to a chat
 * @param {string} chatId - Chat ID
 * @param {File} file - File to upload
 * @param {string} senderId - Sender ID
 * @param {string} messageType - Type of file (image, pdf, etc.)
 * @returns {Promise<string>} Message ID
 */
export const sendFileMessage = async (chatId, file, senderId, messageType = 'file') => {
  try {
    // Validate file
    if (!file) {
      throw new Error('File is required');
    }

    // Validate file type and size (following File Uploads guidelines)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, PDF');
    }

    if (file.size > maxSizeInBytes) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Upload file via Backend API
    const { url: URL } = await uploadFileToBackend(file, `chat_files/${chatId}`);

    // Create message with file URL
    const messageData = {
      senderId,
      content: URL, // Store download URL as content
      messageType,
      fileName: file.name,
      fileSize: file.size
    };

    return await sendMessage(chatId, messageData);
  } catch (error) {
    console.error('Error sending file message:', error);
    throw error;
  }
};

/**
 * Listen for real-time messages in a chat
 * @param {string} chatId - Chat ID
 * @param {Function} callback - Callback function when messages update
 * @returns {Function} Unsubscribe function
 */
export const listenToMessages = (chatId, callback) => {
  try {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const messagesQuery = query(
      collection(firestore, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error in messages listener:', error);
        callback([]); // Return empty array on error
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    throw error;
  }
};

/**
 * Get recent messages from a chat (with pagination)
 * @param {string} chatId - Chat ID
 * @param {number} limitCount - Number of messages to retrieve
 * @returns {Promise<Array>} Messages array
 */
export const getRecentMessages = async (chatId, limitCount = 50) => {
  try {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const messagesQuery = query(
      collection(firestore, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Reverse to get chronological order

    return messages;
  } catch (error) {
    console.error('Error getting recent messages:', error);
    throw error;
  }
};

/**
 * Delete a message from a chat
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (chatId, messageId) => {
  try {
    if (!chatId || !messageId) {
      throw new Error('Chat ID and Message ID are required');
    }

    const messageRef = doc(firestore, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`, messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Update a message (e.g., for editing)
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateMessage = async (chatId, messageId, updates) => {
  try {
    if (!chatId || !messageId) {
      throw new Error('Chat ID and Message ID are required');
    }

    const messageRef = doc(firestore, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`, messageId);
    await updateDoc(messageRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Get user's chats
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Chats array
 */
export const getUserChats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const chatsQuery = query(
      collection(firestore, COLLECTIONS.CHATS),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(chatsQuery);
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};