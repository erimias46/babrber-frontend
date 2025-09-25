"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, MessageCircle, Search } from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChatWindow } from "./ChatWindow";
import { Chat, User } from "@/types";
import { toast } from "react-hot-toast";

interface ChatListModalProps {
  onClose: () => void;
  openChatId?: string | null; // NEW: optional prop to open a specific chat
}

export function ChatListModal({ onClose, openChatId }: ChatListModalProps) {
  const { user } = useAuth();
  const {
    chats,
    chatsLoading,
    createChat,
    deleteChat,
    deleteAllChats,
    isDeletingChat,
    isDeletingAllChats,
  } = useChat();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  // Track if we've already attempted to create a chat for this openChatId
  const [chatCreationAttempted, setChatCreationAttempted] = useState<
    string | null
  >(null);

  // Reset attempt if openChatId changes
  useEffect(() => {
    setChatCreationAttempted(null);
  }, [openChatId]);

  // Listen for user status changes
  useEffect(() => {
    const handleUserStatusChange = (event: CustomEvent) => {
      const { userId, isOnline } = event.detail;
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    // Listen for custom events from socket context
    window.addEventListener(
      "user-status-change",
      handleUserStatusChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "user-status-change",
        handleUserStatusChange as EventListener
      );
    };
  }, []);

  // Open a specific chat if openChatId is provided
  useEffect(() => {
    if (openChatId && chats && Array.isArray(chats)) {
      // If openChatId matches a chat, open it
      const foundChat = chats.find((chat: Chat) => chat._id === openChatId);
      if (foundChat) {
        setSelectedChatId(openChatId);
      } else if (
        typeof createChat === "function" &&
        chatCreationAttempted !== openChatId
      ) {
        setChatCreationAttempted(openChatId);
        createChat(openChatId).then((chat: any) => {
          if (chat && chat.data && chat.data._id) {
            setSelectedChatId(chat.data._id);
          } else if (chat && chat._id) {
            setSelectedChatId(chat._id);
          }
        });
      }
    }
  }, [openChatId, chats, createChat, chatCreationAttempted]);

  // Error handling for missing user or chats
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-semibold">
            User not found. Please log in again.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded bg-blue-500 text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  if (!chats) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-semibold">
            Could not load chats. Please try again later.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded bg-blue-500 text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const filteredChats = Array.isArray(chats)
    ? chats.filter((chat: Chat) => {
        const otherParticipant = chat.participants.find(
          (p: User) => p._id !== user._id
        );
        if (!otherParticipant) return false;

        const searchLower = searchQuery.toLowerCase();
        return (
          otherParticipant.firstName.toLowerCase().includes(searchLower) ||
          otherParticipant.lastName.toLowerCase().includes(searchLower) ||
          (chat.lastMessage?.content || "").toLowerCase().includes(searchLower)
        );
      })
    : [];

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToChatList = () => {
    setSelectedChatId(null);
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p: User) => p._id !== user._id);
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (selectedChatId) {
    return (
      <ChatWindow
        chatId={selectedChatId}
        onClose={() => setSelectedChatId(null)}
        onBack={() => setSelectedChatId(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-md sm:max-w-lg max-h-screen h-full sm:h-[600px] rounded-2xl overflow-y-auto border border-gray-200 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
              Messages
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/50 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          {/* Delete All Chats Button */}
          <div className="flex justify-end mb-2">
            <button
              className="text-xs px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete all chats? This cannot be undone."
                  )
                ) {
                  deleteAllChats();
                }
              }}
              disabled={isDeletingAllChats}
            >
              {isDeletingAllChats ? "Deleting..." : "Delete All Chats"}
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 p-8">
              <MessageCircle className="w-16 h-16 mb-4 text-blue-300" />
              <p className="text-lg font-medium text-gray-700">
                {searchQuery ? "No chats found" : "No conversations yet"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Start chatting with barbers to see them here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredChats.map((chat: Chat) => {
                const otherParticipant = getOtherParticipant(chat);
                if (!otherParticipant) return null;
                const unreadCount = chat.unreadCount ?? 0;
                const fullName = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
                return (
                  <div
                    key={chat._id}
                    className="flex items-center group hover:bg-blue-50 transition-colors"
                  >
                    <button
                      onClick={() => handleChatSelect(chat._id)}
                      className="flex-1 p-4 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={
                              otherParticipant.profilePicture ||
                              `https://i.pravatar.cc/150?u=${otherParticipant._id}`
                            }
                            alt={fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-blue-200 transition-colors"
                          />
                          {/* Online/Offline Status */}
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                              isUserOnline(otherParticipant._id)
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          {otherParticipant.role === "barber" && (
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm">
                              <span className="text-xs">✂️</span>
                            </div>
                          )}
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-xs font-medium text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {otherParticipant.firstName}{" "}
                                {otherParticipant.lastName}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isUserOnline(otherParticipant._id)
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {isUserOnline(otherParticipant._id)
                                  ? "Online"
                                  : "Offline"}
                              </span>
                            </div>
                            {chat.lastMessage && (
                              <span className="text-xs text-gray-500 font-medium">
                                {formatLastMessageTime(chat.updatedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-0.5">
                            {chat.lastMessage?.content ||
                              "Start a conversation"}
                          </p>
                        </div>
                      </div>
                    </button>
                    {/* Delete Chat Button */}
                    <button
                      className="text-xs px-2 py-1 m-2 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                      onClick={() => {
                        if (window.confirm("Delete this chat?")) {
                          deleteChat(chat._id);
                        }
                      }}
                      disabled={isDeletingChat}
                    >
                      {isDeletingChat ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
