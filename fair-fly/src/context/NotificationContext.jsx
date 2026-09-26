import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuthContext } from './AuthContext';
import { useToast } from '../components/UI/toast/ToastProvider';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, userDetails } = useAuthContext();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (!user || !user.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to notifications where recipientUid is current user
    const qUser = query(
      collection(firestore, 'notifications'),
      where('recipientUid', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      qUser,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error in notifications onSnapshot listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // When a notification is marked as read, delete it from Firestore to save read/write bandwidth
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const docRef = doc(firestore, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting read notification from Firestore:', error);
    }
  }, []);

  // Mark all notifications as read: delete all notifications for the current user
  const markAllAsRead = useCallback(async () => {
    try {
      const currentList = notificationsRef.current;
      if (!currentList || currentList.length === 0) return;

      const batch = writeBatch(firestore);
      currentList.forEach((n) => {
        const docRef = doc(firestore, 'notifications', n.id);
        batch.delete(docRef);
      });

      await batch.commit();
      addToast('All notifications cleared', 'success');
    } catch (error) {
      console.error('Error clearing all notifications from Firestore:', error);
      addToast('Failed to clear notifications', 'error');
    }
  }, [addToast]);

  // Delete notification directly
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const docRef = doc(firestore, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Delete all notifications belonging to a specific tab when the user clicks or views it
  const clearNotificationsForTab = useCallback(async (tabLink) => {
    const currentList = notificationsRef.current;
    if (!tabLink || !Array.isArray(currentList) || currentList.length === 0) return;
    try {
      const linkPath = tabLink.toLowerCase();
      const tabSlug = linkPath.split('/').filter(Boolean).pop() || '';
      const isPortalRoot = linkPath === '/operator' || linkPath === '/admin' || linkPath === '/client';

      const matchingNotifs = currentList.filter((notif) => {
        const notifLink = (notif.link || '').toLowerCase();
        const notifType = (notif.type || '').toLowerCase();

        if (isPortalRoot) {
          return notifLink === linkPath && (notifType === 'system' || notifType === 'dashboard');
        }

        if (notifLink && (notifLink === linkPath || notifLink.startsWith(linkPath + '/') || notifLink.startsWith(linkPath + '?'))) {
          return true;
        }

        if (notifType) {
          if (tabSlug.includes(notifType) || (notifType === 'service' && tabSlug.includes('workflow'))) return true;
          if (notifType === 'franchise' && tabSlug.includes('franchise')) return true;
          if (notifType === 'appointment' && tabSlug.includes('appointment')) return true;
          if (notifType === 'ticket' && tabSlug.includes('ticket')) return true;
          if (notifType === 'message' && tabSlug.includes('message')) return true;
          if (notifType === 'resource' && tabSlug.includes('resource')) return true;
          if (notifType === 'inquiry' && (tabSlug.includes('inquir') || tabSlug.includes('inquiry-forms'))) return true;
          if (notifType === 'quotation' && tabSlug.includes('quotation')) return true;
        }
        return false;
      });

      if (matchingNotifs.length === 0) return;

      const batch = writeBatch(firestore);
      matchingNotifs.forEach((n) => {
        const docRef = doc(firestore, 'notifications', n.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing notifications for tab:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotificationsForTab
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
