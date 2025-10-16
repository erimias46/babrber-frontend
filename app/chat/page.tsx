"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { MessageCircle, Search, X, ArrowLeft, Send, Smile } from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { Chat, User as UserType, Message } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { API_ORIGIN } from "@/lib/api/client";

const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  const normalized = url.replace("/api/files/uploads", "/uploads");
  return normalized.startsWith("http")
    ? normalized
    : `${API_ORIGIN}${normalized}`;
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const barberId = searchParams.get("barberId");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [chatCreationAttempted, setChatCreationAttempted] = useState<
    string | null
  >(null);

  const {
    chats,
    chatsLoading,
    createChat,
    deleteChat,
    deleteAllChats,
    isDeletingChat,
    isDeletingAllChats,
  } = useChat();

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

  // Open a specific chat if barberId is provided
  useEffect(() => {
    if (barberId && chats && Array.isArray(chats)) {
      const foundChat = chats.find((chat: Chat) => chat._id === barberId);
      if (foundChat) {
        setSelectedChatId(barberId);
      } else if (
        typeof createChat === "function" &&
        chatCreationAttempted !== barberId
      ) {
        setChatCreationAttempted(barberId);
        createChat(barberId).then((chat: any) => {
          if (chat && chat.data && chat.data._id) {
            setSelectedChatId(chat.data._id);
          } else if (chat && chat._id) {
            setSelectedChatId(chat._id);
          }
        });
      }
    }
  }, [barberId, chats, createChat, chatCreationAttempted]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Please log in to access chat
            </h2>
            <button
              className="mt-4 px-6 py-2 rounded bg-blue-600 text-white font-semibold"
              onClick={() => router.push("/auth/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredChats = Array.isArray(chats)
    ? chats.filter((chat: Chat) => {
        const otherParticipant = chat.participants.find(
          (p: UserType) => p._id !== user._id
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

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p: UserType) => p._id !== user._id);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            Messages
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">
            Chat with barbers and customers
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Chat List */}
          <div
            className={`${
              selectedChatId ? "hidden lg:flex" : "flex"
            } flex-col w-full lg:w-96 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`}
          >
            {/* Search and Actions */}
            <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
                <button
                  className="text-xs px-2 sm:px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
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
                  {isDeletingAllChats ? "..." : "Delete All"}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <MessageCircle className="w-16 h-16 mb-4 text-blue-300" />
                  <p className="text-base font-medium text-gray-700">
                    {searchQuery ? "No chats found" : "No conversations yet"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 text-center">
                    Start chatting with barbers to see them here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredChats.map((chat: Chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    if (!otherParticipant) return null;
                    const unreadCount = chat.unreadCount ?? 0;

                    return (
                      <div
                        key={chat._id}
                        className={`flex items-center group hover:bg-blue-50 transition-colors ${
                          selectedChatId === chat._id ? "bg-blue-50" : ""
                        }`}
                      >
                        <button
                          onClick={() => setSelectedChatId(chat._id)}
                          className="flex-1 p-3 sm:p-4 text-left min-w-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  resolveImageUrl(otherParticipant.avatar) ||
                                  otherParticipant.profilePicture ||
                                  `https://i.pravatar.cc/150?u=${otherParticipant._id}`
                                }
                                alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                  isUserOnline(otherParticipant._id)
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm text-gray-900 truncate">
                                  {otherParticipant.firstName}{" "}
                                  {otherParticipant.lastName}
                                </h3>
                                {chat.lastMessage && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatLastMessageTime(chat.updatedAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {chat.lastMessage?.content ||
                                  "Start a conversation"}
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          className="text-xs px-2 py-1 m-2 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 flex-shrink-0"
                          onClick={() => {
                            if (window.confirm("Delete this chat?")) {
                              deleteChat(chat._id);
                            }
                          }}
                          disabled={isDeletingChat}
                        >
                          {isDeletingChat ? "..." : "Delete"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          {selectedChatId ? (
            <ChatWindowContent
              chatId={selectedChatId}
              onBack={() => setSelectedChatId(null)}
              user={user}
            />
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center text-gray-500 p-8">
                <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-700">
                  Select a conversation
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Choose a chat from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Chat Window Component
function ChatWindowContent({
  chatId,
  onBack,
  user,
}: {
  chatId: string;
  onBack: () => void;
  user: any;
}) {
  const {
    messages,
    messagesLoading,
    sendMessage,
    markAsRead,
    typingUsers,
    startTyping,
    stopTyping,
    isSendingMessage,
  } = useChat(chatId);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
    }
  }, [chatId, markAsRead]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage("");

      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  const otherParticipant =
    messages[0]?.sender._id === user?._id
      ? messages[0]?.recipient
      : messages[0]?.sender;

  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/50 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative flex-shrink-0">
            <img
              src={
                resolveImageUrl(otherParticipant?.avatar) ||
                otherParticipant?.profilePicture ||
                `https://i.pravatar.cc/150?u=${otherParticipant?._id}`
              }
              alt={otherParticipant?.firstName || "User"}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            {otherParticipant?.role === "barber" && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs">✂️</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 capitalize">
              {otherParticipant?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Smile className="w-16 h-16 mx-auto mb-4 text-blue-300" />
              <p className="text-lg font-medium text-gray-700">
                No messages yet
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm border border-gray-200">
                  {formatDate(date)}
                </div>
              </div>

              {(dayMessages as any[]).map((message, index) => {
                const isOwn =
                  message.sender._id === user?._id ||
                  message.sender._id === "current_user";
                const showAvatar =
                  index === 0 ||
                  (dayMessages as any[])[index - 1]?.sender._id !==
                    message.sender._id;

                return (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    } mb-2`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[75%] sm:max-w-md ${
                        isOwn ? "flex-row-reverse" : ""
                      }`}
                    >
                      {!isOwn && showAvatar && (
                        <img
                          src={
                            resolveImageUrl(message.sender.avatar) ||
                            message.sender.profilePicture ||
                            `https://i.pravatar.cc/150?u=${message.sender._id}`
                          }
                          alt={message.sender.firstName}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      )}

                      <div
                        className={`px-3 sm:px-4 py-2 rounded-2xl shadow-sm ${
                          isOwn
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">typing...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 sm:gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-full text-sm sm:text-base text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
            disabled={isSendingMessage}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSendingMessage}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex-shrink-0"
          >
            {isSendingMessage ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={18} className="text-white ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useRef } from "react";
