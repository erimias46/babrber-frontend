"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [realTimeUnreadCount, setRealTimeUnreadCount] = useState<number>(0);
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  // Listen for real-time unread count updates
  useEffect(() => {
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      setRealTimeUnreadCount(event.detail.unreadCount);
    };

    // Get initial count from localStorage
    const storedCount = localStorage.getItem("unreadNotifications");
    if (storedCount) {
      setRealTimeUnreadCount(parseInt(storedCount));
    }

    window.addEventListener(
      "unread-count-updated",
      handleUnreadCountUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "unread-count-updated",
        handleUnreadCountUpdate as EventListener
      );
    };
  }, []);

  // Use real-time count if available, fallback to API count
  const displayUnreadCount =
    realTimeUnreadCount > 0 ? realTimeUnreadCount : unreadCount;

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {displayUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
            {displayUnreadCount > 9 ? "9+" : displayUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 glass rounded-2xl shadow-xl py-2 z-50 border border-white/20">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="font-medium">Notifications</div>
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            {!notifications || notifications.notifications?.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                No notifications yet
              </div>
            ) : (
              notifications.notifications?.map((n: any) => (
                <div
                  key={n._id}
                  className="px-4 py-3 hover:bg-white/10 transition flex items-start gap-3"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      n.isRead ? "bg-gray-300" : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="p-1 rounded hover:bg-white/20"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="p-1 rounded hover:bg-white/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
