"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  Clock,
  Star,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications(currentPage, pageSize);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "reminder":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "system":
        return <Info className="w-5 h-5 text-gray-600" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case "review":
        return <Star className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
      refetch();
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const totalPages = Math.ceil((notifications?.total || 0) / pageSize);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#111111]">
                Notifications
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Stay updated with your latest activities and updates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full border border-red-200">
                  {unreadCount} unread
                </span>
              )}
              <Button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                variant="secondary"
                size="sm"
                className="border-2"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-2 border-gray-100 shadow-lg">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5A1F] mx-auto"></div>
              <p className="text-gray-500 mt-2 font-medium">
                Loading notifications...
              </p>
            </div>
          ) : notifications?.notifications?.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#FF5A1F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#FF5A1F]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 font-medium">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-gray-200">
              {notifications?.notifications?.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 border-l-4 ${getPriorityColor(
                    notification.priority
                  )} ${
                    !notification.isRead
                      ? "bg-white border-2 border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3
                            className={`text-sm font-semibold ${
                              notification.isRead
                                ? "text-gray-600"
                                : "text-[#111111]"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/20">
                              New
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              notification.priority === "high"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : notification.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {notification.priority}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600 font-medium">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsRead(notification._id)}
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100 border"
                              >
                                <Check className="w-4 h-4 text-gray-600" />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(notification._id)}
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 border"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-sm font-medium ${
                          notification.isRead
                            ? "text-gray-500"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>

                      {notification.data && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <pre className="text-xs text-gray-600 overflow-x-auto font-medium">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;

                  return (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? "primary" : "secondary"}
                      size="sm"
                      className="w-10 h-10 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
