import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

interface Notification {
  _id: string;
  userId: string;
  type: "request" | "reminder" | "system" | "payment" | "review";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export function useNotifications(page: number = 1, limit: number = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] =
    useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await api.getNotifications({ page, limit });
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.data.data);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markAsRead(id);
      // Update local state
      if (notifications) {
        setNotifications({
          ...notifications,
          notifications: notifications.notifications.map((notification) =>
            notification._id === id
              ? { ...notification, isRead: true }
              : notification
          ),
        });
      }
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      // Update local state
      if (notifications) {
        setNotifications({
          ...notifications,
          notifications: notifications.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        });
      }
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      // Update local state
      if (notifications) {
        setNotifications({
          ...notifications,
          notifications: notifications.notifications.filter(
            (notification) => notification._id !== id
          ),
          total: notifications.total - 1,
        });
      }
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  };

  const refetch = () => {
    fetchNotifications();
    fetchUnreadCount();
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, page, limit]);

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}
