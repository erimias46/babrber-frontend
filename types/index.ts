// User Types
export interface User {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  profilePicture?: string;
  role: "user" | "barber" | "admin";
  location?: Location;
  isActive: boolean;
  // Barber-specific fields (optional for non-barber users)
  businessName?: string;
  specialties?: string[];
  services?: Service[];
  workingHours?: WorkingHours;
  isApproved?: boolean;
  isOnline?: boolean;
  documents?: Document[];
  rating?: number;
  totalRatings?: number;
  profileDescription?: string;
  stripeAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// Barber Types
export interface Barber extends User {
  role: "barber";
  businessName?: string;
  specialties: string[];
  services: Service[];
  workingHours: WorkingHours;
  isApproved: boolean;
  isOnline: boolean;
  documents: Document[];
  rating: number;
  totalRatings: number;
  profileDescription?: string;
}

export interface Service {
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  transportationFee?: number; // base transportation fee
}

export interface WorkingHours {
  [key: string]: {
    isOpen: boolean;
    start?: string; // "09:00"
    end?: string; // "18:00"
  };
}

export interface Document {
  type: "license" | "certification" | "id";
  url: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
}

// Request Types
export interface HaircutRequest {
  _id: string;
  userId: string;
  barberId: string;
  serviceId: string;
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "completed"
    | "cancelled"
    | "rescheduled";
  scheduledTime?: Date;
  originalScheduledTime?: Date;
  location: Location;
  notes?: string;
  distance?: number; // distance in meters
  transportationFee?: number; // calculated transportation fee
  totalPrice?: number; // service price + transportation fee
  specialRequests?: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: "weekly" | "biweekly" | "monthly";
    interval: number;
    endDate?: Date;
  };
  groupBooking?: {
    isGroup: boolean;
    groupSize?: number;
    groupDiscount?: number;
  };
  waitlist?: {
    isOnWaitlist: boolean;
    waitlistPosition?: number;
    preferredTimes?: Date[];
  };
  cancellationPolicy?: {
    canCancel: boolean;
    cancellationDeadline?: Date;
    cancellationFee?: number;
  };
  reminderSent: boolean;
  reminderSentAt?: Date;

  // Payment & Deposit fields
  amount?: number; // total amount in cents
  currency?: string;
  platformCommissionPct?: number;
  platformCommissionAmount?: number;
  barberNetAmount?: number;

  // Deposit/remainder fields
  depositRequired?: boolean;
  depositType?: "percent" | "fixed";
  depositValue?: number;
  depositAmount?: number;
  depositPaymentIntentId?: string;
  depositChargeId?: string;
  depositPaidAmount?: number;

  remainderAmount?: number;
  remainderPaymentIntentId?: string;
  remainderChargeId?: string;

  // Legacy payment fields
  paymentIntentId?: string;
  chargeId?: string;
  transferId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Deposit Info returned from backend
export interface DepositInfo {
  depositRequired: boolean;
  phase: "deposit" | "remainder" | "full";
  depositAmount: number;
  remainderAmount: number;
  currency: string;
}

// Review Types
export interface Review {
  _id: string;
  requestId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "user" | "barber";
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Socket Events
export interface SocketEvents {
  // Request events
  "request:new": (request: HaircutRequest) => void;
  "request:accepted": (request: HaircutRequest) => void;
  "request:declined": (request: HaircutRequest) => void;
  "request:completed": (request: HaircutRequest) => void;
  "request:rescheduled": (request: HaircutRequest) => void;
  "request:status-update": (data: {
    requestId: string;
    status: string;
  }) => void;

  // Location events
  "barber:location-update": (data: {
    barberId: string;
    location: Location;
  }) => void;
  "barber:online-status": (data: {
    barberId: string;
    isOnline: boolean;
  }) => void;

  // Notification events
  "notification:new": (notification: any) => void;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  type: "request" | "reminder" | "system" | "payment" | "review";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// File Types
export interface File {
  _id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  userId: string;
  type: "avatar" | "portfolio" | "document" | "gallery";
  category?: string;
  tags?: string[];
  isPublic: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface Chat {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  recipient: User;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
