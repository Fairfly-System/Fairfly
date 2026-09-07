import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { API_BASE_URL } from '../utils/config';

/**
 * Get eligible contacts the current user is permitted to chat with
 */
export const getEligibleContacts = async () => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/contacts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch contacts');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching eligible contacts:', error);
    throw error;
  }
};

/**
 * Get or create a 1-to-1 direct conversation with a recipient
 */
export const getOrCreateDirectChat = async (recipientId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ recipientId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize conversation');
    }

    return await res.json();
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

/**
 * Send a direct message in a conversation via backend API
 */
export const sendDirectMessage = async (conversationId, { content, messageType = 'text', fileMetadata = null }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content, messageType, fileMetadata })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message');
    }

    return await res.json();
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

/**
 * Mark a conversation as read for current user
 */
export const markChatAsRead = async (conversationId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.warn('Failed to mark conversation as read');
    }
  } catch (error) {
    console.warn('Error in markChatAsRead:', error);
  }
};

/**
 * Real-time listener for user's conversations list
 */
export const subscribeToConversations = (userUid, callback) => {
  if (!userUid) return () => { };

  try {
    const q = query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', userUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        conversations.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        callback(conversations);
      },
      (error) => {
        console.error('Error in subscribeToConversations:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up conversations listener:', error);
    return () => { };
  }
};

/**
 * Real-time listener for messages in a specific conversation
 */
export const subscribeToMessages = (conversationId, callback) => {
  if (!conversationId) return () => { };

  try {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error in subscribeToMessages:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    return () => { };
  }
};

/**
 * Real-time listener for Head Office announcements
 */
export const subscribeToAnnouncements = (callback) => {
  try {
    const q = query(
      collection(firestore, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        callback(list);
      },
      (error) => {
        console.error('Error in subscribeToAnnouncements:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up announcements listener:', error);
    return () => { };
  }
};

/**
 * Post a new Head Office announcement (Admin Only)
 */
export const postAnnouncement = async ({ title, content, priority = 'Normal', photos = [] }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, priority, photos })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post announcement');
    }

    return await res.json();
  } catch (error) {
    console.error('Error posting announcement:', error);
    throw error;
  }
};

/**
 * Update an existing Head Office announcement (Admin Only)
 */
export const updateAnnouncement = async (id, { title, content, priority, photos }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/announcements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, priority, photos })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update announcement');
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

/**
 * Delete an announcement and its attached photos from storage (Admin Only)
 */
export const deleteAnnouncement = async (id) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/chats/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete announcement');
    }

    return await res.json();
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};