"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useSocket } from "@/lib/socket/SocketContext";
import toast from "react-hot-toast";

export const useChat = (chatId?: string) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  // Get all chats (only on initial load, no polling)
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.getChats().then((res) => res.data),
    staleTime: Infinity, // Don't refetch automatically
  });

  // Get messages for specific chat (only on initial load, no polling)
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () =>
      chatId ? api.getChatMessages(chatId).then((res) => res.data) : null,
    enabled: !!chatId,
    staleTime: Infinity, // Don't refetch automatically
  });

  // Combine server messages with optimistic messages
  const allMessages = chatId 
    ? [...(messages?.data || []), ...optimisticMessages.filter(m => m.chatId === chatId)]
    : [];

  // Create or get chat
  const createChatMutation = useMutation({
    mutationFn: (participantId: string) => api.createOrGetChat(participantId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      return response.data.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start chat");
    },
  });

  // Send message with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      api.sendMessage(chatId, content),
    onMutate: async ({ chatId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["chat-messages", chatId] });

      // Create optimistic message
      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        chat: chatId,
        sender: { _id: "current_user", firstName: "You", lastName: "", profilePicture: "" },
        recipient: { _id: "recipient", firstName: "", lastName: "", profilePicture: "" },
        content,
        createdAt: new Date().toISOString(),
        read: false,
        isOptimistic: true,
        chatId,
      };

      // Add to optimistic messages
      setOptimisticMessages(prev => [...prev, optimisticMessage]);

      return { optimisticMessage };
    },
    onSuccess: (response, { chatId }) => {
      // Remove optimistic message and let socket handle the real update
      setOptimisticMessages(prev => 
        prev.filter(m => !(m.chatId === chatId && m.isOptimistic))
      );
    },
    onError: (error, { chatId, content }) => {
      // Remove failed optimistic message
      setOptimisticMessages(prev => 
        prev.filter(m => !(m.chatId === chatId && m.content === content && m.isOptimistic))
      );
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  // Mark chat as read
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => api.markChatAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Join chat room
    if (chatId) {
      socket.emit("join_chat", chatId);
    }

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        // Add new message to optimistic messages if it's not from current user
        if (data.message.sender._id !== "current_user") {
          setOptimisticMessages(prev => [...prev, { ...data.message, chatId: data.chatId }]);
        }
      }
      
      // Update chats list to show latest message
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [
          ...prev.filter((id) => id !== data.userId),
          data.userId,
        ]);
      } else {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    // Listen for message read confirmations
    const handleMessageRead = (data: any) => {
      if (data.chatId === chatId) {
        // Update read status in optimistic messages
        setOptimisticMessages(prev => 
          prev.map(msg => 
            msg.chatId === data.chatId && msg.sender._id !== "current_user" 
              ? { ...msg, read: true }
              : msg
          )
        );
      }
    };

    // Listen for user online/offline status
    const handleUserStatusChange = (data: any) => {
      // Update user status in chats
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read", handleMessageRead);
    socket.on("user_status_change", handleUserStatusChange);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("message_read", handleMessageRead);
      socket.off("user_status_change", handleUserStatusChange);

      if (chatId) {
        socket.emit("leave_chat", chatId);
      }
    };
  }, [socket, chatId, queryClient]);

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (socket && chatId) {
      socket.emit("typing", { chatId, isTyping: true });
    }
  }, [socket, chatId]);

  const stopTyping = useCallback(() => {
    if (socket && chatId) {
      socket.emit("typing", { chatId, isTyping: false });
    }
  }, [socket, chatId]);

  // Helper functions
  const createChat = (participantId: string) =>
    createChatMutation.mutateAsync(participantId);
    
  const sendMessage = (content: string) => {
    if (chatId) {
      sendMessageMutation.mutate({ chatId, content });
    }
  };
  
  const markAsRead = (chatId: string) => markAsReadMutation.mutate(chatId);

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => api.deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete chat");
    },
  });

  // Delete all chats mutation
  const deleteAllChatsMutation = useMutation({
    mutationFn: () => api.deleteAllChats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete all chats"
      );
    },
  });

  const deleteChat = (chatId: string) => deleteChatMutation.mutate(chatId);
  const deleteAllChats = () => deleteAllChatsMutation.mutate();

  return {
    chats: chats?.data || [],
    messages: allMessages,
    chatsLoading,
    messagesLoading,
    typingUsers,
    createChat,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    isCreatingChat: createChatMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    deleteChat,
    deleteAllChats,
    isDeletingChat: deleteChatMutation.isPending,
    isDeletingAllChats: deleteAllChatsMutation.isPending,
  };
};
