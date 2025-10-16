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
  Bell,
  MessageCircle,
  Menu,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { useChat } from "@/lib/hooks/useChat";
import { Chat } from "@/types";
import { useEffect } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chats } = useChat();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

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

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Chat Icon for Mobile */}
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
            {/* Notifications Bell for Mobile */}
            <NotificationsBell />
            {/* Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="p-6 h-full overflow-y-auto flex flex-col">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#FF5A1F] rounded-full flex items-center justify-center overflow-hidden">
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
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {user.role} Account
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="space-y-2 flex-1">
            <Link
              href={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center w-full p-4 rounded-xl transition-colors ${
                pathname === getDashboardLink() ||
                pathname === "/dashboard" ||
                pathname === "/barber" ||
                pathname === "/admin"
                  ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <MapPin
                className={`w-5 h-5 mr-3 ${
                  pathname === getDashboardLink() ||
                  pathname === "/dashboard" ||
                  pathname === "/barber" ||
                  pathname === "/admin"
                    ? "text-[#FF5A1F]"
                    : "text-gray-700"
                }`}
              />
              <span
                className={`font-semibold ${
                  pathname === getDashboardLink() ||
                  pathname === "/dashboard" ||
                  pathname === "/barber" ||
                  pathname === "/admin"
                    ? "text-[#FF5A1F]"
                    : "font-medium text-gray-900"
                }`}
              >
                Dashboard
              </span>
            </Link>

            {user.role === "user" && (
              <Link
                href="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center w-full p-4 rounded-xl transition-colors ${
                  pathname === "/requests"
                    ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <Settings
                  className={`w-5 h-5 mr-3 ${
                    pathname === "/requests"
                      ? "text-[#FF5A1F]"
                      : "text-gray-700"
                  }`}
                />
                <span
                  className={`${
                    pathname === "/requests"
                      ? "font-semibold text-[#FF5A1F]"
                      : "font-medium text-gray-900"
                  }`}
                >
                  My Requests
                </span>
              </Link>
            )}

            <Link
              href="/reviews"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center w-full p-4 rounded-xl transition-colors ${
                pathname === "/reviews"
                  ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Star
                className={`w-5 h-5 mr-3 ${
                  pathname === "/reviews" ? "text-[#FF5A1F]" : "text-gray-700"
                }`}
              />
              <span
                className={`${
                  pathname === "/reviews"
                    ? "font-semibold text-[#FF5A1F]"
                    : "font-medium text-gray-900"
                }`}
              >
                Reviews
              </span>
            </Link>

            <Link
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center w-full p-4 rounded-xl transition-colors relative ${
                pathname === "/chat"
                  ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <MessageCircle
                className={`w-5 h-5 mr-3 ${
                  pathname === "/chat" ? "text-[#FF5A1F]" : "text-gray-700"
                }`}
              />
              <span
                className={`${
                  pathname === "/chat"
                    ? "font-semibold text-[#FF5A1F]"
                    : "font-medium text-gray-900"
                }`}
              >
                Chat
              </span>
              {totalUnreadMessages > 0 && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white font-semibold">
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center w-full p-4 rounded-xl transition-colors ${
                pathname === "/notifications"
                  ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Bell
                className={`w-5 h-5 mr-3 ${
                  pathname === "/notifications"
                    ? "text-[#FF5A1F]"
                    : "text-gray-700"
                }`}
              />
              <span
                className={`${
                  pathname === "/notifications"
                    ? "font-semibold text-[#FF5A1F]"
                    : "font-medium text-gray-900"
                }`}
              >
                Notifications
              </span>
            </Link>
          </div>

          {/* Mobile Menu Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center w-full p-4 rounded-xl transition-colors ${
                pathname === "/profile"
                  ? "bg-[#FF5A1F]/10 hover:bg-[#FF5A1F]/20"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Settings
                className={`w-5 h-5 mr-3 ${
                  pathname === "/profile" ? "text-[#FF5A1F]" : "text-gray-700"
                }`}
              />
              <span
                className={`${
                  pathname === "/profile"
                    ? "font-semibold text-[#FF5A1F]"
                    : "font-medium text-gray-900"
                }`}
              >
                Profile Settings
              </span>
            </Link>

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3 text-red-600" />
              <span className="font-semibold text-red-600">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
