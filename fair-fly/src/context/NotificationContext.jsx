import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const docRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(docRef, {
        read: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read in Firestore:', error);
    }
  }, []);

  // Mark all notifications for current user as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadList = notifications.filter((n) => !n.read);
      if (unreadList.length === 0) return;

      const batch = writeBatch(firestore);
      const now = new Date().toISOString();

      unreadList.forEach((n) => {
        const docRef = doc(firestore, 'notifications', n.id);
        batch.update(docRef, { read: true, updatedAt: now });
      });

      await batch.commit();
      addToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      addToast('Failed to mark notifications as read', 'error');
    }
  }, [notifications, addToast]);

  // Delete notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const docRef = doc(firestore, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
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
        removeNotification
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
