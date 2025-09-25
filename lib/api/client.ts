import axios from "axios";
import { ApiResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = (() => {
  try {
    const url = new URL(API_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    // Fallback for simple strings
    return API_URL.replace(/\/api$/, "");
  }
})();

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // Allow browser to set multipart boundaries for FormData
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
    }
  } else {
    // Default JSON for non-FormData requests
    if (config.headers && !(config.headers as any)["Content-Type"]) {
      (config.headers as any)["Content-Type"] = "application/json";
    }
  }
  return config;
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Clear token cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Use window.location for 401 errors as this might happen outside React context
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    apiClient.post("/auth/login", data),

  register: (data: any) => apiClient.post("/auth/register", data),

  // Users
  getProfile: () => apiClient.get("/users/profile"),

  updateProfile: (data: any) => apiClient.put("/users/profile", data),

  updateLocation: (data: { coordinates: [number, number]; address?: string }) =>
    apiClient.put("/users/location", data),

  // Barbers
  getNearbyBarbers: (params: {
    longitude: number;
    latitude: number;
    radius?: number;
    services?: string;
    specialties?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    availability?: string;
    sortBy?: string;
    onlineOnly?: boolean;
    searchQuery?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get("/barbers/nearby", { params }),

  getBarber: (id: string) => apiClient.get(`/barbers/${id}`),

  updateBarberProfile: (data: any) => apiClient.put("/barbers/profile", data),

  updateOnlineStatus: (isOnline: boolean) =>
    apiClient.put("/barbers/online-status", { isOnline }),

  // Services
  addService: (data: {
    name: string;
    description?: string;
    price: number;
    duration: number;
  }) => apiClient.post("/barbers/services", data),

  updateService: (
    serviceIndex: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
    }
  ) => apiClient.put(`/barbers/services/${serviceIndex}`, data),

  deleteService: (serviceIndex: number) =>
    apiClient.delete(`/barbers/services/${serviceIndex}`),

  // Requests
  createRequest: (data: any) => apiClient.post("/requests", data),

  getMyRequests: () => apiClient.get("/requests/my-requests"),

  getBarberRequests: () => apiClient.get("/requests/barber-requests"),

  updateRequestStatus: (id: string, status: string) =>
    apiClient.put(`/requests/${id}/status`, { status }),

  // Advanced Booking Features
  createRecurringBooking: (data: any) =>
    apiClient.post("/requests/recurring", data),

  createGroupBooking: (data: any) => apiClient.post("/requests/group", data),

  addToWaitlist: (data: any) => apiClient.post("/requests/waitlist", data),

  rescheduleAppointment: (id: string, data: any) =>
    apiClient.put(`/requests/${id}/reschedule`, data),

  cancelAppointment: (id: string, data: any) =>
    apiClient.put(`/requests/${id}/cancel`, data),

  // Reviews
  createReview: (data: any) => apiClient.post("/reviews", data),

  getUserReviews: (userId: string) => apiClient.get(`/reviews/user/${userId}`),

  getAllReviews: (params?: {
    searchQuery?: string;
    filterRating?: number;
    sortBy?: string;
  }) => apiClient.get("/reviews", { params }),

  // Admin
  getPendingBarbers: () => apiClient.get("/admin/pending-barbers"),

  approveBarber: (id: string, isApproved: boolean) =>
    apiClient.put(`/admin/barber/${id}/approval`, { isApproved }),

  getStats: () => apiClient.get("/admin/stats"),

  getUsers: (params: { page?: number; limit?: number }) =>
    apiClient.get("/admin/users", { params }),

  updateUserStatus: (id: string, isActive: boolean) =>
    apiClient.put(`/admin/user/${id}/status`, { isActive }),

  // Admin Settings
  getSettings: () => apiClient.get("/admin/settings"),
  updateSettings: (data: any) => apiClient.put("/admin/settings", data),

  // Admin Requests
  getAdminRequests: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get("/admin/requests", { params }),

  // Stripe
  connectOnboard: () => apiClient.post("/connect/onboard", {}),
  getStripeAccountStatus: () => apiClient.get("/stripe/account-status"),
  createCheckoutSession: (
    bookingId: string,
    phase?: "deposit" | "remainder" | "full"
  ) => apiClient.post("/checkout/session", { bookingId, phase }),
  releasePayout: (bookingId: string) =>
    apiClient.post("/payout/release", { bookingId }),
  refundBooking: (bookingId: string, amount?: number) =>
    apiClient.post("/refunds/refund-booking", { bookingId, amount }),

  // Notifications
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/notifications", { params }),

  getUnreadCount: () => apiClient.get("/notifications/unread-count"),

  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.put("/notifications/mark-all-read"),

  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),

  // Files
  uploadAvatar: (formData: FormData) =>
    apiClient.post("/files/avatar", formData),

  uploadPortfolio: (formData: FormData) =>
    apiClient.post("/files/portfolio", formData),

  uploadDocuments: (formData: FormData) =>
    apiClient.post("/files/documents", formData),

  uploadGallery: (formData: FormData) =>
    apiClient.post("/files/gallery", formData),

  getMyFiles: (params?: {
    type?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get("/files", { params }),

  getPublicFiles: (
    userId: string,
    params?: { type?: string; category?: string }
  ) => apiClient.get(`/files/public/${userId}`, { params }),

  updateFile: (id: string, data: any) => apiClient.put(`/files/${id}`, data),

  deleteFile: (id: string) => apiClient.delete(`/files/${id}`),

  // Analytics
  getPlatformAnalytics: () => apiClient.get("/analytics/platform"),

  getBarberAnalytics: () => apiClient.get("/analytics/barber"),

  generateWeeklyReports: () => apiClient.post("/analytics/generate-reports"),

  // Chats
  getChats: () => apiClient.get("/chats"),

  createOrGetChat: (participantId: string) =>
    apiClient.post("/chats", { participantId }),

  getChatMessages: (
    chatId: string,
    params?: { page?: number; limit?: number }
  ) => apiClient.get(`/chats/${chatId}/messages`, { params }),

  sendMessage: (chatId: string, content: string) =>
    apiClient.post(`/chats/${chatId}/messages`, { content }),

  markChatAsRead: (chatId: string) => apiClient.put(`/chats/${chatId}/read`),

  deleteChat: (chatId: string) => apiClient.delete(`/chats/${chatId}`),

  deleteAllChats: () => apiClient.delete("/chats"),

  // Availability
  createAvailabilityBlock: (data: {
    start: string | Date;
    end: string | Date;
    location?: { coordinates: [number, number]; address?: string };
    timezone?: string;
  }) => apiClient.post("/availability/blocks", data),

  deleteAvailabilityBlock: (id: string) =>
    apiClient.delete(`/availability/blocks/${id}`),

  updateAvailabilityBlock: (
    id: string,
    data: {
      start?: string | Date;
      end?: string | Date;
      location?: { coordinates: [number, number]; address?: string };
      timezone?: string;
    }
  ) => apiClient.put(`/availability/blocks/${id}`, data),

  updateAvailabilitySettings: (data: {
    workingHours?: any;
    timeOff?: { start: string | Date; end: string | Date; reason?: string }[];
    availabilityOverrides?: {
      date: string;
      isOpen: boolean;
      start?: string;
      end?: string;
    }[];
    bufferMinutes?: number;
    slotIntervalMinutes?: number;
  }) => apiClient.put("/availability/settings", data),

  getMyAvailabilityBlocks: (params?: { from?: string; to?: string }) =>
    apiClient.get("/availability/my/blocks", { params }),

  getBarberSlots: (
    barberId: string,
    params: {
      from: string;
      to: string;
      serviceDurationMinutes: number;
    }
  ) => apiClient.get(`/availability/${barberId}/slots`, { params }),
};
