"use client";

import Link from "next/link";
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

export function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    (sum, chat) => sum + (chat.unreadCount || 0),
    0
  );

  return (
    <nav className="glass sticky top-0 z-50 backdrop-blur-xl border-b border-white/20">
      <div className="container-responsive">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href={getDashboardLink()}
              className="flex items-center space-x-2 sm:space-x-3 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold gradient-text hidden sm:inline">
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
              <Button variant="secondary" size="sm" className="nav-item">
                <MapPin className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            {user.role === "user" && (
              <Link href="/requests">
                <Button variant="secondary" size="sm" className="nav-item">
                  <Settings className="w-4 h-4 mr-2" />
                  My Requests
                </Button>
              </Link>
            )}
            <Link href="/reviews">
              <Button variant="secondary" size="sm" className="nav-item">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </Button>
            </Link>

            {/* Interactive Icons */}
            <div className="flex items-center space-x-2">
              {/* Chat Icon */}
              <Link
                href="/chat"
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 touch-target"
              >
                <MessageCircle className="w-5 h-5" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
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
                className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20 touch-target"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-xl py-2 z-50 border border-white/20">
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
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
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/10 transition-colors duration-200 rounded-xl mx-2"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
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
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 touch-target"
              >
                <MessageCircle className="w-5 h-5" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                    {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                  </span>
                )}
              </Link>
              <NotificationsBell />
            </div>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20 touch-target"
            >
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-xl py-2 z-50 border border-white/20 top-full">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
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
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/10 transition-colors duration-200 rounded-xl mx-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
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
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 touch-target"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Panel */}
        <div
          className={`mobile-nav-panel md:hidden ${
            mobileMenuOpen ? "open" : "closed"
          }`}
        >
          <div className="p-6 h-full overflow-y-auto">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {user.role} Account
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Mobile Menu Items */}
            <div className="space-y-3">
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                <span className="font-medium">Dashboard</span>
              </Link>

              {user.role === "user" && (
                <Link
                  href="/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-5 h-5 mr-3 text-green-600" />
                  <span className="font-medium">My Requests</span>
                </Link>
              )}

              <Link
                href="/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Star className="w-5 h-5 mr-3 text-orange-600" />
                <span className="font-medium">Reviews</span>
              </Link>

              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative"
              >
                <MessageCircle className="w-5 h-5 mr-3 text-purple-600" />
                <span className="font-medium">Chat</span>
                {totalUnreadMessages > 0 && (
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white">
                    {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                  </span>
                )}
              </Link>

              <div className="pt-4">
                <NotificationsBell />
              </div>
            </div>

            {/* Mobile Menu Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Settings className="w-5 h-5 mr-3 text-blue-600" />
                <span className="font-medium text-blue-900">
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
                <span className="font-medium text-red-900">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
