"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  User,
  MapPin,
  Settings,
  LogOut,
  MessageCircle,
  Star,
} from "lucide-react";
import { useState } from "react";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useChat } from "@/lib/hooks/useChat";
import { Chat } from "@/types";
import { API_ORIGIN } from "@/lib/api/client";

const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  const normalized = url.replace("/api/files/uploads", "/uploads");
  return normalized.startsWith("http")
    ? normalized
    : `${API_ORIGIN}${normalized}`;
};

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
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

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="container-responsive">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href={getDashboardLink()}
              className="flex items-center space-x-2 sm:space-x-3 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF5A1F] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
                <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-[#111111] hidden sm:inline">
                BookaBeam
              </span>
            </Link>
            {/* Role Badge */}
            <div
              className={`badge ${
                user.role === "admin"
                  ? "badge-error"
                  : user.role === "barber"
                  ? "badge-success"
                  : "badge-info"
              } hidden sm:inline-flex`}
            >
              {user.role === "admin"
                ? "👑 Admin"
                : user.role === "barber"
                ? "✂️ Barber"
                : "👤 Customer"}
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href={getDashboardLink()}>
              <Button variant="secondary" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            {user.role === "user" && (
              <Link href="/requests">
                <Button variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  My Requests
                </Button>
              </Link>
            )}
            <Link href="/reviews">
              <Button variant="secondary" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </Button>
            </Link>

            {/* Interactive Icons */}
            <div className="flex items-center space-x-2">
              {/* Chat Icon */}
              <Link
                href="/chat"
                className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-gray-700" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-semibold">
                    {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications Bell */}
              <NotificationsBell />
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={resolveImageUrl(user.avatar)}
                      alt={user.firstName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  )}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl py-2 z-50 border-2 border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={resolveImageUrl(user.avatar)}
                            alt={user.firstName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {user.role} Account
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-xl mx-2"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-600" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-xl mx-2"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tablet Nav - Simplified */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Link
                href="/chat"
                className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-gray-700" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-semibold">
                    {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                  </span>
                )}
              </Link>
              <NotificationsBell />
            </div>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              <div className="w-7 h-7 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img
                    src={resolveImageUrl(user.avatar)}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-4 mt-3 w-64 bg-white rounded-2xl shadow-xl py-2 z-50 border-2 border-gray-100 top-full">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={resolveImageUrl(user.avatar)}
                          alt={user.firstName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400 capitalize">
                        {user.role} Account
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-xl mx-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-600" />
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-xl mx-2"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile - Only show user avatar and notifications */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Notifications Bell for Mobile */}
            <NotificationsBell />
            {/* User Avatar */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              <div className="w-7 h-7 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img
                    src={resolveImageUrl(user.avatar)}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-4 mt-3 w-64 bg-white rounded-2xl shadow-xl py-2 z-50 border-2 border-gray-100 top-full">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={resolveImageUrl(user.avatar)}
                          alt={user.firstName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400 capitalize">
                        {user.role} Account
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-xl mx-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-600" />
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-xl mx-2"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </nav>
  );
}
