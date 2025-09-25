"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Send, Smile } from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { useAuth } from "@/lib/auth/AuthContext";
import { Message } from "@/types";

interface OptimisticMessage extends Message {
  isOptimistic?: boolean;
}

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
  onBack?: () => void;
}

export function ChatWindow({ chatId, onClose, onBack }: ChatWindowProps) {
  const { user } = useAuth();
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
    }
  }, [chatId, markAsRead]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
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

      // Stop typing indicator
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  // Get other participant info
  const otherParticipant =
    messages[0]?.sender._id === user?._id
      ? messages[0]?.recipient
      : messages[0]?.sender;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-lg h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/50 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="relative">
              <img
                src={
                  otherParticipant?.profilePicture ||
                  `https://i.pravatar.cc/150?u=${otherParticipant?._id}`
                }
                alt={otherParticipant?.firstName || "User"}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              {otherParticipant?.role === "barber" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs">✂️</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-600 capitalize font-medium">
                  {otherParticipant?.role}
                </p>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/50 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                {/* Date divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    {formatDate(date)}
                  </div>
                </div>

                {/* Messages */}
                {(dayMessages as OptimisticMessage[]).map((message, index) => {
                  const isOwn =
                    message.sender._id === user?._id ||
                    message.sender._id === "current_user";
                  const showAvatar =
                    index === 0 ||
                    (dayMessages as OptimisticMessage[])[index - 1]?.sender
                      ._id !== message.sender._id;
                  const isOptimistic = message.isOptimistic;

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
                        className={`flex items-end space-x-2 max-w-xs ${
                          isOwn ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        {!isOwn && showAvatar && (
                          <img
                            src={
                              message.sender.profilePicture ||
                              `https://i.pravatar.cc/150?u=${message.sender._id}`
                            }
                            alt={message.sender.firstName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}

                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm relative ${
                            isOwn
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          } ${isOptimistic ? "opacity-70" : ""}`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p
                              className={`text-xs ${
                                isOwn ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                            {isOwn && (
                              <div className="flex items-center space-x-1 ml-2">
                                {isOptimistic ? (
                                  <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                ) : message.read ? (
                                  <span className="text-blue-200 text-xs">
                                    ✓✓
                                  </span>
                                ) : (
                                  <span className="text-blue-200 text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
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
        <div className="p-4 border-t border-gray-200 bg-white">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center space-x-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                disabled={isSendingMessage}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSendingMessage}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isSendingMessage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} className="text-white ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
