"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  X,
  Calendar,
  MessageCircle,
  CreditCard,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { useLocation } from "@/lib/hooks/useLocation";
import { useEffect } from "react";
import { useSocket } from "@/lib/socket/SocketContext";

export default function RequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [rescheduleFor, setRescheduleFor] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"requests" | "barbers">(
    "requests"
  );
  const [showBooking, setShowBooking] = useState<string | null>(null); // barberId
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const { coordinates, loading: locationLoading } = useLocation();

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => api.getMyRequests().then((res) => res.data.data),
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: isConnected ? false : 60 * 1000, // Poll every minute if not connected
  });

  // Ensure requests is always an array
  const requestsArray = requests || [];

  // Fetch online barbers near user
  const {
    data: barbers,
    isLoading: barbersLoading,
    refetch: refetchBarbers,
  } = useQuery({
    queryKey: ["all-active-barbers-for-requests", coordinates],
    queryFn: async () => {
      if (!coordinates) return [];
      const response = await api.getNearbyBarbers({
        longitude: coordinates[0],
        latitude: coordinates[1],
        onlineOnly: true,
        limit: 100,
      });
      return response.data.data;
    },
    enabled: !!user && !!coordinates && activeTab === "barbers",
  });

  // Ensure barbers is always an array
  const barbersArray = barbers || [];

  // Add effect to handle socket connection and debugging
  useEffect(() => {
    if (socket && isConnected) {
      console.log("🔌 Requests page: Socket connected successfully");
    } else {
      console.log("🔌 Requests page: Socket not connected", {
        socket: !!socket,
        isConnected,
      });
    }
  }, [socket, isConnected]);

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    toast.success("Refreshing requests...", { duration: 2000 });
  };

  // Booking mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => api.createRequest(data),
    onSuccess: () => {
      toast.success("Request sent successfully!");
      setShowBooking(null);
      setSelectedService("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.cancelAppointment(id, { reason }),
    onSuccess: () => {
      toast.success("Request cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({
      id,
      newTime,
      reason,
    }: {
      id: string;
      newTime: string;
      reason?: string;
    }) => api.rescheduleAppointment(id, { newTime, reason }),
    onSuccess: () => {
      toast.success("Request rescheduled");
      setRescheduleFor(null);
      setNewTime("");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reschedule request"
      );
    },
  });

  // Payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: ({
      bookingId,
      phase,
    }: {
      bookingId: string;
      phase?: "deposit" | "remainder" | "full";
    }) => api.createCheckoutSession(bookingId, phase),
    onSuccess: (response) => {
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create payment session"
      );
    },
  });

  // Distance calculation (Haversine)
  function calculateDistance(barberCoords: number[]) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2)
      return null;
    if (!Array.isArray(barberCoords) || barberCoords.length < 2) return null;

    const R = 6371; // km
    const dLat = ((barberCoords[1] - coordinates[1]) * Math.PI) / 180;
    const dLon = ((barberCoords[0] - coordinates[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coordinates[1] * Math.PI) / 180) *
        Math.cos((barberCoords[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateTransportationFee(distance: number | null) {
    if (!distance) return 5;
    const baseFee = 5;
    const perKmFee = 2;
    return Math.max(baseFee, baseFee + distance * perKmFee);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          {/* Responsive tabs with horizontal scroll */}
          <div className="flex gap-2 border-b-2 border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
            <button
              className={`px-4 sm:px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === "requests"
                  ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FF5A1F]/5"
                  : "border-transparent text-gray-500 hover:text-[#FF5A1F] hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("requests")}
            >
              My Requests
            </button>
            <button
              className={`px-4 sm:px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === "barbers"
                  ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FF5A1F]/5"
                  : "border-transparent text-gray-500 hover:text-[#FF5A1F] hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("barbers")}
            >
              Online Barbers
            </button>
          </div>
        </div>
        {activeTab === "requests" && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111] mb-1 sm:mb-2">
                  My Requests
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600">
                  Track your haircut bookings and appointments
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="badge bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/20 text-xs sm:text-sm font-semibold">
                  {requestsArray.length} Total
                </div>
                {/* Socket connection indicator */}
                <div
                  className={`badge text-xs font-semibold ${
                    isConnected
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {isConnected ? "🟢 Live" : "🔴 Offline"}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleManualRefresh}
                  title="Refresh requests"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="hidden sm:flex"
                >
                  <MapPin className="w-4 h-4 mr-2" /> Find More Barbers
                </Button>
                <Button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="sm:hidden"
                  size="sm"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "requests" && (
          <>
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card h-24 animate-pulse" />
                ))}
              </div>
            ) : requestsArray.length === 0 ? (
              <div className="card text-center py-12 sm:py-16 border-2 border-gray-100">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#FF5A1F]/10 rounded-full"></div>
                  </div>
                  <Clock className="w-16 h-16 sm:w-20 sm:h-20 text-[#FF5A1F] mx-auto mb-4 sm:mb-6 relative z-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111] mb-2 sm:mb-3">
                  No requests yet
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  Start your journey by finding skilled barbers in your area and
                  sending your first request.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                  <Button
                    onClick={() => (window.location.href = "/dashboard")}
                    className="w-full sm:w-auto"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Find Barbers
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => (window.location.href = "/profile")}
                    className="w-full sm:w-auto"
                  >
                    <User className="w-4 h-4 mr-2" /> Complete Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {requestsArray.map((request: any) => (
                  <div
                    key={request._id}
                    className="card card-hover p-4 sm:p-6 border-2 border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Header with Barber Info and Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FF5A1F] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-xl font-bold text-[#111111] truncate">
                                {request.barberId.firstName}{" "}
                                {request.barberId.lastName}
                              </h3>
                              {request.barberId.businessName && (
                                <p className="text-sm sm:text-base text-gray-600 font-medium truncate">
                                  {request.barberId.businessName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {request.depositRequired &&
                            request.depositPaidAmount ? (
                              <div className="badge bg-green-100 text-green-800 border border-green-200 text-sm font-semibold">
                                Deposit Paid
                              </div>
                            ) : null}
                            <div
                              className={`badge ${getStatusColor(
                                request.status
                              )} text-sm font-semibold capitalize border`}
                            >
                              {request.status}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center text-gray-600 gap-2 sm:gap-3">
                              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5A1F] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-semibold block text-gray-700">
                                  Service
                                </span>
                                <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                                  {(() => {
                                    const services =
                                      request.barberId?.services || [];
                                    const match = services.find(
                                      (s: any) =>
                                        String(s?._id || "") ===
                                        String(request.serviceId || "")
                                    );
                                    return (
                                      match?.name ||
                                      request.serviceName ||
                                      "General Service"
                                    );
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 gap-2 sm:gap-3">
                              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5A1F] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-semibold block text-gray-700">
                                  Requested
                                </span>
                                <p className="text-xs sm:text-sm text-gray-900 font-medium">
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            {request.scheduledTime && (
                              <div className="flex items-center text-gray-600 gap-2 sm:gap-3">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5A1F] flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-semibold block text-gray-700">
                                    Scheduled
                                  </span>
                                  <p className="text-xs sm:text-sm text-gray-900 font-medium">
                                    {new Date(
                                      request.scheduledTime
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {request.location?.address && (
                              <div className="flex items-center text-gray-600 gap-2 sm:gap-3">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5A1F] flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-semibold block text-gray-700">
                                    Location
                                  </span>
                                  <p className="text-xs sm:text-sm text-gray-900 font-medium break-words">
                                    {request.location.address}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Information */}
                        {(request.status === "accepted" ||
                          request.status === "rescheduled" ||
                          request.status === "completed") &&
                          request.amount && (
                            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                                Payment Details
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                  {request.depositRequired ? (
                                    <>
                                      {/* Show deposit first when required */}
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          {!request.depositPaidAmount
                                            ? "Pay Now (Deposit):"
                                            : "Deposit Paid:"}
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            !request.depositPaidAmount
                                              ? "text-green-600 font-bold"
                                              : ""
                                          }`}
                                        >
                                          $
                                          {(
                                            (request.depositAmount || 0) / 100
                                          ).toFixed(2)}
                                          {request.depositPaidAmount
                                            ? " ✓"
                                            : ""}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          {request.depositPaidAmount &&
                                          !request.remainderPaymentIntentId
                                            ? "Pay Later (Remainder):"
                                            : "Remainder:"}
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            request.depositPaidAmount &&
                                            !request.remainderPaymentIntentId &&
                                            request.remainderAmount > 0
                                              ? "text-blue-600 font-bold"
                                              : ""
                                          }`}
                                        >
                                          $
                                          {(
                                            (request.remainderAmount || 0) / 100
                                          ).toFixed(2)}
                                          {request.remainderPaymentIntentId
                                            ? " ✓"
                                            : ""}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm border-t pt-2 mt-2">
                                        <span className="text-gray-600">
                                          Total Amount:
                                        </span>
                                        <span className="font-medium">
                                          $
                                          {(
                                            (request.amount || 0) / 100
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Show full amount when no deposit required */}
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          {!request.paymentIntentId
                                            ? "Pay Now:"
                                            : "Amount Paid:"}
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            !request.paymentIntentId
                                              ? "text-green-600 font-bold"
                                              : ""
                                          }`}
                                        >
                                          $
                                          {(
                                            (request.amount || 0) / 100
                                          ).toFixed(2)}
                                          {request.paymentIntentId ? " ✓" : ""}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {request.depositRequired && (
                                    <>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          Deposit Status:
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            request.depositPaidAmount
                                              ? "text-green-600"
                                              : "text-orange-600"
                                          }`}
                                        >
                                          {request.depositPaidAmount
                                            ? "Paid"
                                            : "Pending"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          Remainder Status:
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            request.remainderPaymentIntentId
                                              ? "text-green-600"
                                              : "text-orange-600"
                                          }`}
                                        >
                                          {request.remainderPaymentIntentId
                                            ? "Paid"
                                            : "Pending"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {!request.depositRequired && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        Payment Status:
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          request.paymentIntentId
                                            ? "text-green-600"
                                            : "text-orange-600"
                                        }`}
                                      >
                                        {request.paymentIntentId
                                          ? "Paid"
                                          : "Pending"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-3 sm:pt-4 border-t border-gray-200 gap-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {request.status === "pending" && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  cancelRequestMutation.mutate({
                                    id: request._id,
                                  })
                                }
                                loading={cancelRequestMutation.isPending}
                                className="shadow-md text-xs sm:text-sm"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />{" "}
                                Cancel
                              </Button>
                            )}
                            {(request.status === "accepted" ||
                              request.status === "rescheduled") && (
                              <>
                                {rescheduleFor === request._id ? (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                    <input
                                      type="datetime-local"
                                      value={newTime}
                                      onChange={(e) =>
                                        setNewTime(e.target.value)
                                      }
                                      className="input text-sm w-full sm:w-auto"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          newTime &&
                                          rescheduleMutation.mutate({
                                            id: request._id,
                                            newTime,
                                          })
                                        }
                                        loading={rescheduleMutation.isPending}
                                        className="flex-1 sm:flex-none"
                                      >
                                        <Calendar className="w-4 h-4 mr-2" />{" "}
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setRescheduleFor(null)}
                                        className="flex-1 sm:flex-none"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      setRescheduleFor(request._id)
                                    }
                                    className="w-full sm:w-auto"
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />{" "}
                                    Reschedule
                                  </Button>
                                )}
                              </>
                            )}

                            {/* Payment buttons for accepted requests */}
                            {(request.status === "accepted" ||
                              request.status === "rescheduled") && (
                              <>
                                {/* Show payment status and buttons */}
                                {request.depositRequired &&
                                  !request.depositPaidAmount && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        createPaymentMutation.mutate({
                                          bookingId: request._id,
                                          phase: "deposit",
                                        })
                                      }
                                      loading={createPaymentMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Pay Deposit $
                                      {(
                                        (request.depositAmount || 0) / 100
                                      ).toFixed(2)}
                                    </Button>
                                  )}

                                {request.depositRequired &&
                                  request.depositPaidAmount &&
                                  !request.remainderPaymentIntentId &&
                                  request.remainderAmount &&
                                  request.remainderAmount > 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        createPaymentMutation.mutate({
                                          bookingId: request._id,
                                          phase: "remainder",
                                        })
                                      }
                                      loading={createPaymentMutation.isPending}
                                      className="bg-[#FF5A1F] hover:bg-[#E54D1A] text-white"
                                    >
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Pay Remainder $
                                      {(
                                        (request.remainderAmount || 0) / 100
                                      ).toFixed(2)}
                                    </Button>
                                  )}

                                {!request.depositRequired &&
                                  !request.paymentIntentId && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        createPaymentMutation.mutate({
                                          bookingId: request._id,
                                          phase: "full",
                                        })
                                      }
                                      loading={createPaymentMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Pay $
                                      {((request.amount || 0) / 100).toFixed(2)}
                                    </Button>
                                  )}

                                {/* Show payment completed status */}
                                {((request.depositRequired &&
                                  request.depositPaidAmount &&
                                  request.remainderPaymentIntentId) ||
                                  (!request.depositRequired &&
                                    request.paymentIntentId)) && (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Payment Complete
                                  </div>
                                )}
                              </>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/barber/${request.barberId._id}`)
                              }
                              className="text-xs sm:text-sm"
                            >
                              View Barber
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "barbers" && (
          <div>
            {locationLoading ? (
              <div className="text-center py-12">Getting your location...</div>
            ) : barbersLoading ? (
              <div className="text-center py-12">Loading online barbers...</div>
            ) : !coordinates ? (
              <div className="text-center py-12 text-red-500">
                Location not available. Please enable location access.
              </div>
            ) : barbersArray.length === 0 ? (
              <div className="text-center py-12">
                No online barbers found near you.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {barbersArray.map((barber: any) => {
                  const distance =
                    barber.location?.coordinates &&
                    Array.isArray(barber.location.coordinates)
                      ? calculateDistance(barber.location.coordinates)
                      : null;
                  return (
                    <Card
                      key={barber._id}
                      className="p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                            {barber.avatar ? (
                              <img
                                src={barber.avatar}
                                alt={barber.firstName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              "💇‍♂️"
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg">
                              {barber.firstName} {barber.lastName}
                            </div>
                            {barber.businessName && (
                              <div className="text-sm text-gray-500">
                                {barber.businessName}
                              </div>
                            )}
                            <div className="flex items-center text-yellow-500 text-sm">
                              <span className="mr-1">★</span>{" "}
                              {barber.rating?.toFixed(1) || "-"}
                            </div>
                          </div>
                          {/* Message Icon for users only */}
                          {user && user.role === "user" && (
                            <button
                              title="Message Barber"
                              className="ml-2 p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              onClick={() =>
                                (window.location.href = `/chat?barberId=${
                                  barber._id || ""
                                }`)
                              }
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {distance !== null && (
                            <span>Distance: {distance.toFixed(2)} km</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {(barber.services || []).length} services available
                        </div>
                      </div>
                      <Button
                        className="mt-2"
                        onClick={() => {
                          const hasActive = requestsArray.some(
                            (r: any) =>
                              r.barberId?._id === barber._id &&
                              ["pending", "accepted", "rescheduled"].includes(
                                r.status
                              )
                          );
                          if (hasActive) {
                            toast.error(
                              "You already have an active request with this barber"
                            );
                            return;
                          }
                          setShowBooking(barber._id);
                        }}
                        disabled={requestsArray.some(
                          (r: any) =>
                            r.barberId?._id === barber._id &&
                            ["pending", "accepted", "rescheduled"].includes(
                              r.status
                            )
                        )}
                      >
                        {requestsArray.some(
                          (r: any) =>
                            r.barberId?._id === barber._id &&
                            ["pending", "accepted", "rescheduled"].includes(
                              r.status
                            )
                        )
                          ? "Request Pending"
                          : "Book"}
                      </Button>
                      {/* Booking Modal */}
                      {showBooking === barber._id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                            <button
                              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                              onClick={() => setShowBooking(null)}
                            >
                              ×
                            </button>
                            <h3 className="text-xl font-bold mb-4">
                              Book {barber.firstName} {barber.lastName}
                            </h3>
                            <div className="mb-4">
                              <label className="block text-sm font-medium mb-1">
                                Select Service
                              </label>
                              <select
                                value={selectedService}
                                onChange={(e) =>
                                  setSelectedService(e.target.value)
                                }
                                className="input w-full"
                              >
                                <option value="">Choose a service</option>
                                {(barber.services || []).map(
                                  (service: any, idx: number) => (
                                    <option key={idx} value={idx}>
                                      {service.name} - ${service.price}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                            {/* Price Breakdown */}
                            {selectedService &&
                              coordinates &&
                              barber.location?.coordinates && (
                                <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                                  {(() => {
                                    const selectedServiceData =
                                      (barber.services || [])[
                                        parseInt(selectedService)
                                      ];
                                    if (!selectedServiceData) return null;

                                    const dist =
                                      barber.location?.coordinates &&
                                      Array.isArray(barber.location.coordinates)
                                        ? calculateDistance(
                                            barber.location.coordinates
                                          )
                                        : null;
                                    const transportationFee =
                                      calculateTransportationFee(dist);
                                    const totalPrice =
                                      selectedServiceData.price +
                                      transportationFee;
                                    return (
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            {selectedServiceData.name}
                                          </span>
                                          <span className="font-medium">
                                            $
                                            {selectedServiceData.price.toFixed(
                                              2
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Transportation (
                                            {dist ? dist.toFixed(1) : "0"} km)
                                          </span>
                                          <span className="font-medium">
                                            ${transportationFee.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                                          <span>Total</span>
                                          <span className="text-primary-600">
                                            ${totalPrice.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            <Input
                              label="Notes (Optional)"
                              placeholder="Any special requests or notes..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                            <Button
                              className="w-full mt-4"
                              onClick={() => {
                                if (!selectedService) {
                                  toast.error("Please select a service");
                                  return;
                                }
                                if (!coordinates) {
                                  toast.error("Location not available");
                                  return;
                                }
                                if (!user) {
                                  toast.error("User not authenticated");
                                  return;
                                }

                                const selectedServiceData = (
                                  barber.services || []
                                ).find(
                                  (s: any, idx: number) =>
                                    String(idx) === selectedService
                                );
                                if (!selectedServiceData) {
                                  toast.error("Selected service not found");
                                  return;
                                }

                                const dist =
                                  barber.location?.coordinates &&
                                  Array.isArray(barber.location.coordinates)
                                    ? calculateDistance(
                                        barber.location.coordinates
                                      )
                                    : null;
                                const transportationFee =
                                  calculateTransportationFee(dist);
                                const totalPrice =
                                  selectedServiceData.price + transportationFee;
                                createRequestMutation.mutate({
                                  barberId: barber._id || "",
                                  serviceId: String(
                                    (selectedServiceData as any)?._id || ""
                                  ),
                                  location: {
                                    type: "Point",
                                    coordinates: coordinates,
                                    address:
                                      user.location?.address ||
                                      "User's current location",
                                  },
                                  notes,
                                  distance: dist ? dist * 1000 : null,
                                  transportationFee,
                                  totalPrice,
                                });
                              }}
                              loading={createRequestMutation.isPending}
                              disabled={!selectedService}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "accepted":
      return "bg-green-100 text-green-800 border-green-200";
    case "declined":
      return "bg-red-100 text-red-800 border-red-200";
    case "completed":
      return "bg-[#FF5A1F]/10 text-[#FF5A1F] border-[#FF5A1F]/20";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "rescheduled":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
