"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useChat } from "@/lib/hooks/useChat";
import { Chat } from "@/types";
import {
  MapPin,
  Settings,
  Star,
  MessageCircle,
  Bell,
  User,
} from "lucide-react";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

export function BottomNavigation() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { chats } = useChat();

  if (!user) return null;

  const getDashboardLink = () => {
    switch (user.role) {
      case "admin":
        return "/admin";
      case "barber":
        return "/barber";
      default:
        return "/dashboard";
    }
  };

  // Calculate total unread messages
  const totalUnreadMessages = chats.reduce(
    (sum: number, chat: Chat) => sum + (chat.unreadCount || 0),
    0
  );

  const isActive = (path: string) => {
    if (path === getDashboardLink()) {
      return (
        pathname === getDashboardLink() ||
        pathname === "/dashboard" ||
        pathname === "/barber" ||
        pathname === "/admin"
      );
    }
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {/* Dashboard */}
        <Link
          href={getDashboardLink()}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            isActive(getDashboardLink())
              ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <MapPin
            className={`w-5 h-5 mb-1 ${
              isActive(getDashboardLink()) ? "text-[#FF5A1F]" : ""
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isActive(getDashboardLink()) ? "text-[#FF5A1F]" : ""
            }`}
          >
            Dashboard
          </span>
        </Link>

        {/* My Requests (for users only) */}
        {user.role === "user" && (
          <Link
            href="/requests"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
              isActive("/requests")
                ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Settings
              className={`w-5 h-5 mb-1 ${
                isActive("/requests") ? "text-[#FF5A1F]" : ""
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isActive("/requests") ? "text-[#FF5A1F]" : ""
              }`}
            >
              Requests
            </span>
          </Link>
        )}

        {/* Reviews */}
        <Link
          href="/reviews"
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            isActive("/reviews")
              ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Star
            className={`w-5 h-5 mb-1 ${
              isActive("/reviews") ? "text-[#FF5A1F]" : ""
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isActive("/reviews") ? "text-[#FF5A1F]" : ""
            }`}
          >
            Reviews
          </span>
        </Link>

        {/* Chat */}
        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 relative ${
            isActive("/chat")
              ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="relative">
            <MessageCircle
              className={`w-5 h-5 mb-1 ${
                isActive("/chat") ? "text-[#FF5A1F]" : ""
              }`}
            />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-semibold">
                {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
              </span>
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              isActive("/chat") ? "text-[#FF5A1F]" : ""
            }`}
          >
            Chat
          </span>
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            isActive("/notifications")
              ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="relative">
            <Bell
              className={`w-5 h-5 mb-1 ${
                isActive("/notifications") ? "text-[#FF5A1F]" : ""
              }`}
            />
            {/* We'll add unread count badge here if needed */}
          </div>
          <span
            className={`text-xs font-medium ${
              isActive("/notifications") ? "text-[#FF5A1F]" : ""
            }`}
          >
            Notifications
          </span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            isActive("/profile")
              ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User
            className={`w-5 h-5 mb-1 ${
              isActive("/profile") ? "text-[#FF5A1F]" : ""
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isActive("/profile") ? "text-[#FF5A1F]" : ""
            }`}
          >
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
