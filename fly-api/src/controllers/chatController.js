const { db } = require('../config/firebase');

const COLLECTIONS = {
  CHATS: 'chats',
  MESSAGES: 'messages'
};

/**
 * Create a new chat session
 */
const createChatSession = async (req, res) => {
  try {
    const chatData = req.body;
    if (!chatData || !chatData.participants) {
      return res.status(400).json({ error: 'Invalid chat data: participants required' });
    }

    const docRef = await db.collection(COLLECTIONS.CHATS).add({
      ...chatData, //Spread the chat data (Has chat information, i.e. participants (Has the IDs of the two users and their role), chat status)
      createdAt: new Date().toISOString(), //Set the creation time of the chat
      updatedAt: new Date().toISOString() //Set the update time of the chat
    });

    return res.status(201).json({ id: docRef.id, message: 'Chat session created' });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve chat details by ID
 */
const getChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Chat ID is required' });

    const chatDoc = await db.collection(COLLECTIONS.CHATS).doc(id).get(); //Get the chat document by ID
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    return res.status(200).json({ id: chatDoc.id, ...chatDoc.data() }); //Return the chat document with the ID
  } catch (error) {
    console.error('Error getting chat session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Send a message within a chat session
 */
const postMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const messageData = req.body;

    if (!id) return res.status(400).json({ error: 'Chat ID is required' });
    if (!messageData || !messageData.senderId || !messageData.content) {
      return res.status(400).json({ error: 'Sender ID and content are required' });
    }

    const now = new Date().toISOString();
    const messagePayload = {
      ...messageData, //Spread the message data
      timestamp: now, //Set the timestamp of the message
      createdAt: now //Set the creation time of the message
    };

    // Add to subcollection: chats/{id}/messages
    const msgRef = await db.collection(COLLECTIONS.CHATS).doc(id).collection(COLLECTIONS.MESSAGES).add(messagePayload); //Add the message to the subcollection

    // Update parent chat document meta
    await db.collection(COLLECTIONS.CHATS).doc(id).update({
      updatedAt: now,
      lastMessage: messageData.content.substring(0, 100)
    });

    return res.status(201).json({ id: msgRef.id, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Note: getMessages is intentionally omitted from the backend.
// The frontend subscribes directly to the chats/{id}/messages subcollection
// via Firestore's onSnapshot for real-time message updates.

module.exports = {
  createChatSession,
  getChatSession,
  postMessage
};

