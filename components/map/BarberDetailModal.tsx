"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { api, API_ORIGIN } from "@/lib/api/client";

const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  const normalized = url.replace("/api/files/uploads", "/uploads");
  return normalized.startsWith("http")
    ? normalized
    : `${API_ORIGIN}${normalized}`;
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useLocation } from "@/lib/hooks/useLocation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Barber, Service } from "@/types";

interface BarberDetailModalProps {
  barber: Barber;
  onClose: () => void;
}

const BarberDetailModal = ({ barber, onClose }: BarberDetailModalProps) => {
  const [activeTab, setActiveTab] = useState("info");
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<
    number | null
  >(null);
  const { createChat, isCreatingChat } = useChat();
  const { coordinates } = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Service request mutation
  const createRequestMutation = useMutation({
    mutationFn: (requestData: any) => api.createRequest(requestData),
    onSuccess: () => {
      toast.success("Service request sent successfully!");
      setShowBookingForm(false);
      setSelectedService(null);
      setSelectedServiceIndex(null);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const services = barber.services || [];

  const tabs = [
    { id: "info", label: "Info", icon: Sparkles },
    { id: "portfolio", label: "Portfolio", icon: CheckCircle },
    { id: "services", label: "Services", icon: Clock },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  // Fetch user's requests to block duplicate booking while active
  const { data: myRequests } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => api.getMyRequests().then((res) => res.data.data),
  });

  const hasActiveRequestWithBarber = Array.isArray(myRequests)
    ? myRequests.some(
        (r: any) =>
          r.barberId?._id === barber._id &&
          ["pending", "accepted", "rescheduled"].includes(r.status)
      )
    : false;

  // Fetch real reviews for this barber
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["barber-reviews", barber._id],
    queryFn: () => api.getUserReviews(barber._id).then((res) => res.data.data),
  });

  // Portfolio files for this barber (public)
  const { data: portfolioFiles, isLoading: portfolioLoading } = useQuery({
    queryKey: ["barber-portfolio", barber._id],
    queryFn: () =>
      api
        .getPublicFiles(barber._id, { type: "portfolio" })
        .then((res) => res.data.data),
  });

  const handleStartChat = async () => {
    try {
      const response = await createChat(barber._id);
      setChatId(response.data._id);
      setShowChat(true);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleServiceRequest = (service: any) => {
    setSelectedService(service);
    const idx = (barber.services || []).findIndex((s: any) => s === service);
    setSelectedServiceIndex(idx >= 0 ? idx : null);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = (bookingData: any) => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }
    if (!coordinates) {
      toast.error("Location not available. Please enable location access.");
      return;
    }
    const requestData = {
      barberId: barber._id,
      serviceId: String((selectedService as any)?._id || ""),
      scheduledTime: bookingData.scheduledTime,
      notes: bookingData.notes || "",
      location: {
        type: "Point",
        coordinates: coordinates,
        address: user?.location?.address,
      },
    } as any;
    console.log(
      "[BOOKING][CLIENT][MODAL] Submitting createRequest:",
      requestData
    );
    createRequestMutation.mutate(requestData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end animate-modal-backdrop">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-gray-900 w-full max-h-[85vh] rounded-t-3xl overflow-hidden border-t border-gray-700 shadow-2xl glow-blue"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-gray-800/90 via-gray-900/95 to-black/90 backdrop-blur-xl border-b border-gray-700/50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
          >
            <X size={24} />
          </button>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-16 h-16 rounded-full border-4 border-gray-600/50 bg-gradient-to-br from-gray-700 to-gray-800 shadow-2xl relative overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-3xl relative z-10">
                {barber.profilePicture || barber.avatar ? (
                  <img
                    src={resolveImageUrl(
                      barber.profilePicture || barber.avatar
                    )}
                    alt={barber.firstName}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  "👨‍🦲"
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-sm"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {barber.firstName} {barber.lastName}
              </h2>
              <div className="flex items-center text-sm text-gray-400">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span>
                  {barber.rating?.toFixed(1) || "N/A"} (
                  {barber.totalRatings || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "info" && (
                <div className="space-y-4 text-gray-300">
                  <p>{barber.profileDescription}</p>
                  <div className="mt-1">
                    {barber.isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-300 border border-blue-400/30">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verified
                        Barber
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-600/30 text-gray-300 border border-gray-500/30">
                        Pending Verification
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-blue-400" />
                    <span>
                      {barber.location?.address || "Address not available"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-blue-400" />
                    <span>{barber.phone}</span>
                  </div>
                </div>
              )}
              {activeTab === "portfolio" && (
                <div>
                  {portfolioLoading ? (
                    <div className="text-gray-400">Loading portfolio...</div>
                  ) : !portfolioFiles || portfolioFiles.length === 0 ? (
                    <div className="text-gray-400">No portfolio images yet</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {portfolioFiles.slice(0, 9).map((file: any) => (
                        <div
                          key={file._id}
                          className="relative aspect-square overflow-hidden rounded-xl border border-gray-700/60"
                        >
                          <img
                            src={resolveImageUrl(file.url)}
                            alt={file.originalName || "Portfolio image"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              const fallback = resolveImageUrl(file.url);
                              if (el.src !== fallback) el.src = fallback;
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "services" && (
                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300 group"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-200 group-hover:text-white">
                          {service.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/30">
                          ${service.price}
                        </span>
                        <button
                          onClick={() => {
                            if (hasActiveRequestWithBarber) {
                              toast.error(
                                "You already have an active request with this barber"
                              );
                              return;
                            }
                            handleServiceRequest(service);
                          }}
                          disabled={
                            !barber.isOnline || hasActiveRequestWithBarber
                          }
                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>
                            {hasActiveRequestWithBarber ? "Pending" : "Book"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {hasActiveRequestWithBarber && (
                    <div className="text-sm text-yellow-400">
                      You already have an active request with this barber. Wait
                      until it is completed.
                    </div>
                  )}
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-3">
                  {reviewsLoading ? (
                    <div className="text-gray-400">Loading reviews...</div>
                  ) : !reviews || reviews.length === 0 ? (
                    <div className="text-gray-400">No reviews yet</div>
                  ) : (
                    reviews.map((review: any) => (
                      <div
                        key={review._id}
                        className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-300 mr-2">
                              {review.reviewerId?.firstName}{" "}
                              {review.reviewerId?.lastName}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={
                                    i < review.rating
                                      ? "text-yellow-400"
                                      : "text-gray-600"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-300">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm flex space-x-4">
          <button
            onClick={handleStartChat}
            disabled={isCreatingChat}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <MessageSquare size={18} />
            <span>{isCreatingChat ? "Starting..." : "Message"}</span>
          </button>
          <button
            onClick={() => setActiveTab("services")}
            disabled={!barber.isOnline}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 border border-green-500/50 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <Calendar size={18} />
              <span>{barber.isOnline ? "Book Service" : "Offline"}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
          </button>
        </div>
      </motion.div>

      {/* Chat Window */}
      {showChat && chatId && (
        <ChatWindow
          chatId={chatId}
          onClose={() => {
            setShowChat(false);
            setChatId(null);
          }}
        />
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedService && (
        <BookingFormModal
          service={selectedService}
          barber={barber}
          onSubmit={handleBookingSubmit}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedService(null);
          }}
          isLoading={createRequestMutation.isPending}
        />
      )}
    </div>
  );
};

interface BookingFormModalProps {
  service: Service;
  barber: Barber;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

// Booking Form Modal Component
const BookingFormModal = ({
  service,
  barber,
  onSubmit,
  onClose,
  isLoading,
}: BookingFormModalProps) => {
  const [formData, setFormData] = useState({
    scheduledTime: "",
    notes: "",
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ["barber-slots", barber._id, service.duration],
    queryFn: () =>
      api
        .getBarberSlots(barber._id, {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          serviceDurationMinutes: service.duration,
        })
        .then((r) => r.data.data.slots),
  });

  // Group slots by date
  const slotsByDate = (slotsData || []).reduce((acc: any, slot: any) => {
    const date = new Date(slot.start).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const availableDates = Object.keys(slotsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduledTime) {
      toast.error("Please select a date and time");
      return;
    }
    onSubmit(formData);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot("");
    setFormData({ ...formData, scheduledTime: "" });
  };

  const handleTimeSelect = (slot: any) => {
    setSelectedTimeSlot(slot.start);
    setFormData({ ...formData, scheduledTime: slot.start });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Book Service</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white">
                  {service.name}
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {service.description || "Professional service"}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-300">
                    <Clock size={16} className="mr-1" />
                    <span className="text-sm">{service.duration} minutes</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatPrice(service.price)}
                </div>
                <p className="text-xs text-gray-400">Total Amount</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loadingSlots ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">
                Loading available times...
              </span>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <p className="text-gray-400">
                No available slots for the next 7 days
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please try again later or contact the barber directly
              </p>
            </div>
          ) : (
            <>
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Select Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedDate === date
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {formatDate(date)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {slotsByDate[date].length} slot
                        {slotsByDate[date].length !== 1 ? "s" : ""} available
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-gray-300">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Available Times for {formatDate(selectedDate)}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slotsByDate[selectedDate].map((slot: any) => (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => handleTimeSelect(slot)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedTimeSlot === slot.start
                            ? "border-green-500 bg-green-500/20 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {formatTime(slot.start)}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Special Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests or notes for the barber..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Summary */}
              {formData.scheduledTime && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg p-4"
                >
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Booking Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Service:</span>
                      <span className="text-white">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">
                        {service.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date & Time:</span>
                      <span className="text-white">
                        {formatDate(selectedDate)} at{" "}
                        {formatTime(formData.scheduledTime)}
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-300">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-green-400">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.scheduledTime}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Send Booking Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BarberDetailModal;
