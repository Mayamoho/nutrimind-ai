/**
 * Notification Context
 * Manages in-app notifications state and real-time updates
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface Notification {
  id: number;
  user_email: string;
  notification_type: string;
  title: string;
  message: string;
  scheduled_time: string;
  sent_time?: string;
  status: 'pending' | 'sent' | 'dismissed';
  metadata?: any;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => void;
  dismissNotification: (id: number) => void;
  dismissAll: () => void;
  markAsRead: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  console.log('[NotificationContext] Provider initialized');

  // Calculate unread count (pending notifications)
  const unreadCount = notifications.filter(n => n.status === 'pending').length;

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    // Throttle fetches to once every 30 seconds
    if (now - lastFetch < 30000 && lastFetch > 0) {
      console.log('[NotificationContext] Fetch throttled, last fetch was', now - lastFetch, 'ms ago');
      return;
    }
    
    setIsLoading(true);
    console.log('[NotificationContext] Fetching notifications...');
    try {
      const response = await api.get('/notifications/pending?limit=20');
      console.log('[NotificationContext] API response:', response);
      console.log('[NotificationContext] Response type:', typeof response);
      console.log('[NotificationContext] Is array?', Array.isArray(response));
      
      // Handle different response formats
      let notificationsData = response;
      if (response && response.data) {
        notificationsData = response.data;
      }
      
      // Ensure we have an array
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
      console.log('[NotificationContext] Notifications array:', notificationsArray);
      
      // Sort notifications by created_at descending (newest first)
      const sortedNotifications = notificationsArray.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sortedNotifications);
      setLastFetch(now);
      console.log('[NotificationContext] Set', sortedNotifications.length, 'notifications');
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notifications:', error);
      console.error('[NotificationContext] Error details:', error.response || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetch]);

  // Dismiss a notification
  const dismissNotification = useCallback(async (id: number) => {
    try {
      await api.put(`/notifications/${id}/dismiss`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, []);

  // Mark notification as read (but keep it in list)
  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.put(`/notifications/${id}/dismiss`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'dismissed' as const } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    const pendingNotifications = notifications.filter(n => n.status === 'pending');
    const dismissPromises = pendingNotifications.map(n => dismissNotification(n.id));
    
    try {
      await Promise.all(dismissPromises);
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }, [notifications, dismissNotification]);

  // Auto-fetch notifications every minute
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    dismissNotification,
    dismissAll,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
