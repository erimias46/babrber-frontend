"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useSocket } from "@/lib/socket/SocketContext";
import { useLocation } from "@/lib/hooks/useLocation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SnapchatStyleMap } from "@/components/map/SnapchatStyleMap";
import { LocationPicker } from "@/components/map/LocationPicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiClient } from "@/lib/api/client";
import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  User,
  Star,
  Settings,
  Navigation,
  Route,
  Calculator,
  TrendingUp,
  Calendar,
  CheckCircle,
  BarChart3,
  Wallet,
  Users,
  AlertCircle,
  Activity,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { StripeAccountStatus } from "@/components/barber/StripeAccountStatus";

export default function BarberDashboard() {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const { coordinates } = useLocation();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, requests, location, availability, pricing
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showAvailabilityLocationPicker, setShowAvailabilityLocationPicker] =
    useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState<{
    start: string;
    end: string;
    location?: { coordinates: [number, number]; address?: string };
  }>({ start: "", end: "" });
  const [settingsForm, setSettingsForm] = useState<{
    slotIntervalMinutes: number;
    bufferMinutes: number;
  }>({
    slotIntervalMinutes: (user as any)?.slotIntervalMinutes || 30,
    bufferMinutes: (user as any)?.bufferMinutes || 10,
  });

  const {
    data: myBlocks,
    refetch: refetchBlocks,
    isFetching: isFetchingBlocks,
  } = useQuery({
    queryKey: ["my-availability-blocks"],
    queryFn: () =>
      api.getMyAvailabilityBlocks().then((r) => r.data.data.blocks),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => api.deleteAvailabilityBlock(id),
    onSuccess: () => {
      toast.success("Availability block deleted");
      refetchBlocks();
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to delete block");
    },
  });
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["barber-requests"],
    queryFn: () => api.getBarberRequests().then((res) => res.data.data),
  });

  // Debug: Log requests data to see what fields are available
  useEffect(() => {
    if (requests && requests.length > 0) {
      console.log("Sample request data:", requests[0]);
      console.log("All requests:", requests);
    }
  }, [requests]);

  // Calculate stats from requests
  const stats = {
    totalEarnings:
      requests?.reduce((sum: number, req: any) => {
        if (req.status === "completed") {
          // Try different price fields in order of preference
          const earnings =
            req.barberNetAmount || req.amount || req.totalPrice || 0;
          return sum + earnings / 100; // Convert cents to dollars
        }
        return sum;
      }, 0) || 0,
    thisWeekEarnings:
      requests?.reduce((sum: number, req: any) => {
        const requestDate = new Date(req.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (req.status === "completed" && requestDate >= weekAgo) {
          const earnings =
            req.barberNetAmount || req.amount || req.totalPrice || 0;
          return sum + earnings / 100; // Convert cents to dollars
        }
        return sum;
      }, 0) || 0,
    totalCustomers:
      new Set(
        requests
          ?.filter((req: any) => req.status === "completed")
          .map((req: any) => req.userId._id)
      ).size || 0,
    completionRate:
      requests?.length > 0
        ? Math.round(
            (requests.filter((req: any) => req.status === "completed").length /
              requests.length) *
              100
          )
        : 0,
    averageRating: user?.rating || 0,
    responseTime: "< 5 min", // This could be calculated from actual data
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateRequestStatus(id, status),
    onSuccess: (response, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });

      if (status === "accepted" && response.data.deposit) {
        const deposit = response.data.deposit;
        const amount =
          deposit.phase === "deposit"
            ? deposit.depositAmount
            : deposit.remainderAmount;
        const formattedAmount = (amount / 100).toFixed(2);

        toast.success(
          `Request accepted! Customer needs to pay $${formattedAmount} ${
            deposit.phase === "deposit" ? "(deposit)" : "(full amount)"
          }`,
          { duration: 6000 }
        );
      } else {
        toast.success("Request updated successfully");
      }
    },
  });

  const releasePaymentMutation = useMutation({
    mutationFn: (bookingId: string) => api.releasePayout(bookingId),
    onSuccess: (response) => {
      const amount = response.data.transferId
        ? "Payment released successfully!"
        : "Payment release initiated";
      toast.success(amount);
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stripe-account-status"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.includes("not ready to receive transfers")) {
        toast.error(
          "Your Stripe account needs to be fully set up. Check the Stripe Account Status above.",
          {
            duration: 6000,
          }
        );
      } else {
        toast.error(errorMessage || "Failed to release payment");
      }
    },
  });

  const updateOnlineStatusMutation = useMutation({
    mutationFn: (online: boolean) => api.updateOnlineStatus(online),
    onSuccess: (response, online) => {
      const updatedUser = response.data.data;
      setIsOnline(online);

      // Update user data in localStorage and context
      updateUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      socket?.emit("barber:online-status", { isOnline: online });
      toast.success(online ? "You are now online" : "You are now offline");

      // Refresh user profile to get latest data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => {
      console.error("Error updating online status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update online status"
      );
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: (data: { coordinates: [number, number]; address?: string }) =>
      api.updateLocation(data),
    onSuccess: (response) => {
      // Update user context with the latest location data from API response
      const updatedUser = response.data.data;
      updateUser(updatedUser);

      toast.success("Location updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowLocationPicker(false);

      // Emit updated location to socket for real-time updates
      if (socket && updatedUser.location?.coordinates) {
        socket.emit("barber:location-update", {
          coordinates: updatedUser.location.coordinates,
          address: updatedUser.location.address,
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update location");
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      price: number;
      duration: number;
    }) => api.addService(data),
    onSuccess: async () => {
      toast.success("Service added successfully!");
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      setShowAddService(false);
      setServiceForm({ name: "", description: "", price: "", duration: "" });
      // Refetch user profile and update UI
      const profile = await api.getProfile();
      updateUser(profile.data.data);
    },
    onError: (error: any) => {
      console.error("Error adding service:", error);
      toast.error(error.response?.data?.message || "Failed to add service");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({
      serviceIndex,
      data,
    }: {
      serviceIndex: number;
      data: {
        name?: string;
        description?: string;
        price?: number;
        duration?: number;
      };
    }) => api.updateService(serviceIndex, data),
    onSuccess: async () => {
      toast.success("Service updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      setEditingService(null);
      setServiceForm({ name: "", description: "", price: "", duration: "" });
      setShowAddService(false);
      // Refetch user profile and update UI
      const profile = await api.getProfile();
      updateUser(profile.data.data);
    },
    onError: (error: any) => {
      console.error("Error updating service:", error);
      toast.error(error.response?.data?.message || "Failed to update service");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceIndex: number) => api.deleteService(serviceIndex),
    onSuccess: async () => {
      toast.success("Service deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      // Refetch user profile and update UI
      const profile = await api.getProfile();
      updateUser(profile.data.data);
    },
    onError: (error: any) => {
      console.error("Error deleting service:", error);
      toast.error(error.response?.data?.message || "Failed to delete service");
    },
  });

  useEffect(() => {
    if (user?.role === "barber") {
      setIsOnline(user.isOnline || false);
    }
  }, [user]);

  // Listen for socket connection and maintain online status
  useEffect(() => {
    if (socket && user?.role === "barber" && user.location?.coordinates) {
      // Emit location and online status on connection
      socket.emit("barber:location-update", {
        coordinates: user.location.coordinates,
        address: user.location.address,
      });

      if (isOnline) {
        socket.emit("barber:online-status", { isOnline: true });
      }
    }
  }, [socket, user, isOnline]);

  const handleStatusUpdate = (requestId: string, status: string) => {
    updateStatusMutation.mutate({ id: requestId, status });
  };

  const toggleOnlineStatus = () => {
    updateOnlineStatusMutation.mutate(!isOnline);
  };

  const handleLocationSelect = (location: {
    coordinates: [number, number];
    address?: string;
  }) => {
    updateLocationMutation.mutate(location);
  };

  const handleAddService = () => {
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    addServiceMutation.mutate({
      name: serviceForm.name,
      description: serviceForm.description,
      price: parseFloat(serviceForm.price),
      duration: parseInt(serviceForm.duration),
    });
  };

  const handleUpdateService = () => {
    if (editingService === null) return;

    const updateData: any = {};
    if (serviceForm.name) updateData.name = serviceForm.name;
    if (serviceForm.description !== undefined)
      updateData.description = serviceForm.description;
    if (serviceForm.price) updateData.price = parseFloat(serviceForm.price);
    if (serviceForm.duration)
      updateData.duration = parseInt(serviceForm.duration);

    updateServiceMutation.mutate({
      serviceIndex: editingService,
      data: updateData,
    });
  };

  const handleEditService = (index: number, service: any) => {
    setEditingService(index);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration.toString(),
    });
    setShowAddService(true);
  };

  const handleDeleteService = (index: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(index);
    }
  };

  const resetServiceForm = () => {
    setServiceForm({ name: "", description: "", price: "", duration: "" });
    setEditingService(null);
    setShowAddService(false);
  };

  if (user?.role !== "barber") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only for barbers</p>
        </div>
      </div>
    );
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Card>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Pending Approval
            </h1>
            <p className="text-gray-600 mb-6">
              Your barber account is currently under review. You'll be notified
              once it's approved.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                This process usually takes 1-2 business days. Make sure you've
                uploaded all required documents.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Barber Dashboard
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Manage your requests and availability
            </p>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div
              className={`flex items-center px-3 py-2 rounded-lg ${
                isOnline
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline ? "bg-green-400" : "bg-gray-400"
                }`}
              ></div>
              {isOnline ? "Online" : "Offline"}
            </div>
            <Button
              onClick={toggleOnlineStatus}
              loading={updateOnlineStatusMutation.isPending}
              variant={isOnline ? "danger" : "primary"}
            >
              {isOnline ? "Go Offline" : "Go Online"}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "requests"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Requests</span>
                <span className="sm:hidden">Requests</span>
                {requests?.filter((r: any) => r.status === "pending").length >
                  0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {requests.filter((r: any) => r.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "location"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Location & Map</span>
                <span className="sm:hidden">Location</span>
              </button>
              <button
                onClick={() => setActiveTab("pricing")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "pricing"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Services & Pricing</span>
                <span className="sm:hidden">Pricing</span>
              </button>
              <button
                onClick={() => setActiveTab("availability")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "availability"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Availability</span>
                <span className="sm:hidden">Schedule</span>
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "payments"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Payments & Deposits</span>
                <span className="sm:hidden">Payments</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-4 sm:space-y-6 overflow-x-auto">
            {/* Enhanced Stats Cards - Only on Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center">
                  <div className="bg-green-500 p-3 rounded-lg shadow-lg">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-green-700 font-medium">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ${stats.totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600">
                      +${stats.thisWeekEarnings.toFixed(2)} this week
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-lg shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-blue-700 font-medium">
                      Total Customers
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.totalCustomers}
                    </p>
                    <p className="text-xs text-blue-600">
                      {requests?.filter((r: any) => r.status === "pending")
                        .length || 0}{" "}
                      pending
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-3 rounded-lg shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-purple-700 font-medium">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.completionRate}%
                    </p>
                    <p className="text-xs text-purple-600">
                      {requests?.filter((r: any) => r.status === "completed")
                        .length || 0}{" "}
                      completed
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <div className="flex items-center">
                  <div className="bg-yellow-500 p-3 rounded-lg shadow-lg">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-yellow-700 font-medium">
                      Rating
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {stats.responseTime} avg response
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            {/* Quick Actions */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Quick Actions
                </h2>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-green-400" : "bg-gray-400"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      isOnline ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Button
                  onClick={toggleOnlineStatus}
                  loading={updateOnlineStatusMutation.isPending}
                  variant={isOnline ? "danger" : "primary"}
                  className="flex items-center justify-center"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {isOnline ? "Go Offline" : "Go Online"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setActiveTab("requests")}
                  className="flex items-center justify-center"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Requests
                  {requests?.filter((r: any) => r.status === "pending").length >
                    0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {
                        requests.filter((r: any) => r.status === "pending")
                          .length
                      }
                    </span>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setShowLocationPicker(true)}
                  className="flex items-center justify-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Update Location
                </Button>
              </div>

              {/* Stripe Debug Section */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Stripe Connection Debug
                </h4>
                <div className="text-xs text-yellow-700 space-y-2">
                  <div>
                    Stripe Account ID:{" "}
                    {user?.stripeAccountId || "Not connected"}
                  </div>
                  <div>User Role: {user?.role}</div>
                  <div>User ID: {user?._id}</div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          console.log(
                            "🧪 Barber Dashboard: Testing Stripe connection..."
                          );
                          const res = await apiClient.get("/stripe/test");
                          const data = res.data;
                          console.log("🧪 Stripe test result:", data);
                          toast.success(
                            `Stripe test: ${
                              data.success ? "SUCCESS" : "FAILED"
                            }`
                          );
                        } catch (err) {
                          console.error("🧪 Stripe test failed:", err);
                          toast.error("Stripe test failed");
                        }
                      }}
                    >
                      Test Stripe
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          console.log(
                            "🔌 Barber Dashboard: Testing connectOnboard..."
                          );
                          const res = await api.connectOnboard();
                          console.log("🔌 ConnectOnboard result:", res);
                          toast.success("ConnectOnboard API call successful");
                        } catch (err: any) {
                          console.error("🔌 ConnectOnboard failed:", err);
                          toast.error(
                            `ConnectOnboard failed: ${
                              err.response?.data?.message || err.message
                            }`
                          );
                        }
                      }}
                    >
                      Test Connect
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity & Earnings Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Activity */}
              <Card>
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Requests
                </h3>

                <div className="space-y-4">
                  {requests?.slice(0, 5).map((request: any) => {
                    // Determine payment status
                    const isFullyPaid = request.depositRequired
                      ? request.depositPaidAmount &&
                        request.remainderPaymentIntentId
                      : request.paymentIntentId;

                    const depositPaid = request.depositPaidAmount;
                    const remainderPaid = request.remainderPaymentIntentId;
                    const fullPaid = request.paymentIntentId;

                    return (
                      <div
                        key={request._id}
                        className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {/* Status Indicator */}
                            <div className="relative">
                              <div
                                className={`w-4 h-4 rounded-full ${
                                  request.status === "completed"
                                    ? "bg-green-500"
                                    : request.status === "accepted"
                                    ? "bg-blue-500"
                                    : request.status === "pending"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              ></div>
                              {request.status === "completed" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                              )}
                            </div>

                            {/* Customer Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {request.userId.firstName}{" "}
                                  {request.userId.lastName}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    request.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : request.status === "accepted"
                                      ? "bg-blue-100 text-blue-800"
                                      : request.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}{" "}
                                •{" "}
                                {new Date(request.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>

                              {/* Payment Status */}
                              <div className="flex items-center space-x-2">
                                {request.status === "accepted" && (
                                  <div className="flex items-center space-x-1">
                                    {request.depositRequired ? (
                                      <>
                                        {/* Deposit Status */}
                                        <div className="flex items-center space-x-1">
                                          <div
                                            className={`w-2 h-2 rounded-full ${
                                              depositPaid
                                                ? "bg-green-500"
                                                : "bg-orange-400"
                                            }`}
                                          ></div>
                                          <span className="text-xs text-gray-600">
                                            Deposit {depositPaid ? "✓" : "⏳"}
                                          </span>
                                        </div>

                                        {/* Remainder Status */}
                                        <div className="flex items-center space-x-1">
                                          <div
                                            className={`w-2 h-2 rounded-full ${
                                              remainderPaid
                                                ? "bg-green-500"
                                                : "bg-orange-400"
                                            }`}
                                          ></div>
                                          <span className="text-xs text-gray-600">
                                            Remainder{" "}
                                            {remainderPaid ? "✓" : "⏳"}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            fullPaid
                                              ? "bg-green-500"
                                              : "bg-orange-400"
                                          }`}
                                        ></div>
                                        <span className="text-xs text-gray-600">
                                          Payment {fullPaid ? "✓" : "⏳"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {request.status === "completed" && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-green-600 font-medium">
                                      Fully Paid ✓
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            {(request.amount ||
                              request.barberNetAmount ||
                              request.totalPrice) && (
                              <div className="text-sm font-bold text-green-600">
                                $
                                {(
                                  (request.barberNetAmount ||
                                    request.amount ||
                                    request.totalPrice ||
                                    0) / 100
                                ).toFixed(2)}
                              </div>
                            )}
                            {request.status === "accepted" && !isFullyPaid && (
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                Payment Required
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Service Info */}
                        {request.serviceName && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Service: {request.serviceName}
                              </span>
                              {request.location?.address && (
                                <span className="text-xs text-gray-400 truncate max-w-32">
                                  📍 {request.location.address}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }) || (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-sm font-medium mb-1">
                        No recent requests
                      </h4>
                      <p className="text-xs">New bookings will appear here</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Earnings Breakdown */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-green-600" />
                  Earnings Breakdown
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        This Week
                      </p>
                      <p className="text-xs text-green-600">7 days</p>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      ${stats.thisWeekEarnings.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        This Month
                      </p>
                      <p className="text-xs text-blue-600">30 days</p>
                    </div>
                    <span className="text-lg font-bold text-blue-700">
                      ${(stats.totalEarnings * 0.8).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-900">
                        All Time
                      </p>
                      <p className="text-xs text-purple-600">Total</p>
                    </div>
                    <span className="text-lg font-bold text-purple-700">
                      ${stats.totalEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Performance Insights
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    Response Time
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {stats.responseTime}
                  </p>
                  <p className="text-xs text-blue-600">Average response</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    Success Rate
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {stats.completionRate}%
                  </p>
                  <p className="text-xs text-green-600">Jobs completed</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-yellow-700 font-medium">
                    Customer Rating
                  </p>
                  <p className="text-xl font-bold text-yellow-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-yellow-600">Out of 5.0</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "requests" && (
          <Card className="overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                All Requests
              </h2>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  {requests?.length || 0} total requests
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                      </div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No requests yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  When customers book your services, their requests will appear
                  here with payment status and details.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests?.map((request: any) => {
                  // Determine payment status
                  const isFullyPaid = request.depositRequired
                    ? request.depositPaidAmount &&
                      request.remainderPaymentIntentId
                    : request.paymentIntentId;

                  const depositPaid = request.depositPaidAmount;
                  const remainderPaid = request.remainderPaymentIntentId;
                  const fullPaid = request.paymentIntentId;

                  return (
                    <div
                      key={request._id}
                      className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:-translate-y-1"
                    >
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                        <div className="flex items-center space-x-3">
                          {/* Status Indicator */}
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                request.status === "completed"
                                  ? "bg-green-500"
                                  : request.status === "accepted"
                                  ? "bg-blue-500"
                                  : request.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            {request.status === "completed" && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          {/* Customer Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 gap-1">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                {request.userId.firstName}{" "}
                                {request.userId.lastName}
                              </h3>
                              <span
                                className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full w-fit ${
                                  request.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : request.status === "accepted"
                                    ? "bg-blue-100 text-blue-800"
                                    : request.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}{" "}
                              •{" "}
                              {new Date(request.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="text-left sm:text-right flex-shrink-0">
                          {(request.amount ||
                            request.barberNetAmount ||
                            request.totalPrice) && (
                            <div className="text-xl font-bold text-green-600 mb-1">
                              $
                              {(
                                (request.barberNetAmount ||
                                  request.amount ||
                                  request.totalPrice ||
                                  0) / 100
                              ).toFixed(2)}
                            </div>
                          )}
                          {request.transportationFee && (
                            <div className="text-xs text-gray-500">
                              +${request.transportationFee.toFixed(2)} transport
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Status Section */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Payment Status
                          </h4>
                          {request.status === "accepted" && !isFullyPaid && (
                            <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                              Payment Required
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4">
                          {request.status === "accepted" && (
                            <div className="flex items-center space-x-2">
                              {request.depositRequired ? (
                                <>
                                  {/* Deposit Status */}
                                  <div className="flex items-center space-x-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        depositPaid
                                          ? "bg-green-500"
                                          : "bg-orange-400"
                                      }`}
                                    ></div>
                                    <span className="text-sm text-gray-600">
                                      Deposit{" "}
                                      {depositPaid ? "✓ Paid" : "⏳ Pending"}
                                    </span>
                                  </div>

                                  {/* Remainder Status */}
                                  <div className="flex items-center space-x-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        remainderPaid
                                          ? "bg-green-500"
                                          : "bg-orange-400"
                                      }`}
                                    ></div>
                                    <span className="text-sm text-gray-600">
                                      Remainder{" "}
                                      {remainderPaid ? "✓ Paid" : "⏳ Pending"}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      fullPaid
                                        ? "bg-green-500"
                                        : "bg-orange-400"
                                    }`}
                                  ></div>
                                  <span className="text-sm text-gray-600">
                                    Payment {fullPaid ? "✓ Paid" : "⏳ Pending"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {request.status === "completed" && (
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-sm text-green-600 font-medium">
                                Fully Paid ✓
                              </span>
                            </div>
                          )}

                          {request.status === "pending" && (
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-sm text-yellow-600 font-medium">
                                Awaiting Response
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Location */}
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            {request.location.address ? (
                              <div>
                                <a
                                  href={`https://www.google.com/maps?q=${request.location.coordinates[1]},${request.location.coordinates[0]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  📍 {request.location.address}
                                </a>
                                <div className="text-xs text-gray-500 mt-1">
                                  {request.location.coordinates[1].toFixed(6)},{" "}
                                  {request.location.coordinates[0].toFixed(6)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <a
                                  href={`https://www.google.com/maps?q=${request.location.coordinates[1]},${request.location.coordinates[0]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  📍{" "}
                                  {request.location.coordinates[1].toFixed(6)},{" "}
                                  {request.location.coordinates[0].toFixed(6)}
                                </a>
                                <div className="text-xs text-gray-500 mt-1">
                                  Click to open in Google Maps
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Distance */}
                        {request.distance && (
                          <div className="flex items-center space-x-2">
                            <Route className="w-4 h-4 text-purple-500" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {(request.distance / 1000).toFixed(1)} km away
                              </span>
                              <div className="text-xs text-gray-500">
                                Travel distance
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Service & Notes */}
                      <div className="space-y-3">
                        {request.serviceName && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                              <strong>Service:</strong> {request.serviceName}
                            </span>
                          </div>
                        )}

                        {request.notes && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-blue-900 mb-1">
                                  Customer Notes
                                </div>
                                <p className="text-sm text-blue-800">
                                  {request.notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {request._id.slice(-8)}
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleStatusUpdate(request._id, "accepted")
                                  }
                                  loading={updateStatusMutation.isPending}
                                  className="shadow-md bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept Request
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() =>
                                    handleStatusUpdate(request._id, "declined")
                                  }
                                  loading={updateStatusMutation.isPending}
                                  className="shadow-md"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Decline
                                </Button>
                              </>
                            )}

                            {request.status === "accepted" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(request._id, "completed")
                                }
                                loading={updateStatusMutation.isPending}
                                disabled={
                                  // Disable if payment is not fully completed
                                  request.depositRequired
                                    ? !request.depositPaidAmount ||
                                      !request.remainderPaymentIntentId
                                    : !request.paymentIntentId
                                }
                                className={
                                  // Disable if payment is not fully completed
                                  (
                                    request.depositRequired
                                      ? !request.depositPaidAmount ||
                                        !request.remainderPaymentIntentId
                                      : !request.paymentIntentId
                                  )
                                    ? "opacity-50 cursor-not-allowed bg-gray-400"
                                    : "shadow-md bg-blue-600 hover:bg-blue-700"
                                }
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {request.depositRequired
                                  ? !request.depositPaidAmount ||
                                    !request.remainderPaymentIntentId
                                    ? "Complete (Payment Required)"
                                    : "Mark Complete"
                                  : !request.paymentIntentId
                                  ? "Complete (Payment Required)"
                                  : "Mark Complete"}
                              </Button>
                            )}

                            {request.status === "completed" &&
                              !request.transferId && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() =>
                                    releasePaymentMutation.mutate(request._id)
                                  }
                                  loading={releasePaymentMutation.isPending}
                                  className="shadow-md bg-green-600 hover:bg-green-700"
                                >
                                  💰 Release Payment $
                                  {(
                                    (request.barberNetAmount || 0) / 100
                                  ).toFixed(2)}
                                </Button>
                              )}

                            {request.status === "completed" &&
                              request.transferId && (
                                <div className="flex items-center text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  <span className="font-medium">
                                    Payment Released
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === "location" && (
          <div className="space-y-4 sm:space-y-6 overflow-x-auto">
            {/* Location Management */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Location Management
                </h2>
                <Button
                  onClick={() => setShowLocationPicker(true)}
                  className="flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update Location
                </Button>
              </div>

              <div className="space-y-4">
                {user.location ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-green-900">
                          Current Location
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          {user.location.address ||
                            `${user.location.coordinates[1].toFixed(
                              6
                            )}, ${user.location.coordinates[0].toFixed(6)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <Navigation className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-yellow-900">
                          No Location Set
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Set your location to receive nearby customer requests
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="font-medium">Service Area Map</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                </div>

                {showMap && user.location && (
                  <div className="w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden border border-gray-200">
                    <SnapchatStyleMap
                      userLocation={[
                        user.location.coordinates[1],
                        user.location.coordinates[0],
                      ]}
                      barbers={[
                        {
                          ...user,
                          role: "barber" as const,
                          specialties: user.specialties || [],
                          services: user.services || [],
                          workingHours: user.workingHours || {},
                          isApproved: user.isApproved || false,
                          isOnline: isOnline,
                          documents: user.documents || [],
                          rating: user.rating || 4.8,
                          totalRatings: user.totalRatings || 0,
                          email: user.email,
                          password: user.password,
                          phone: user.phone,
                          isActive: user.isActive,
                          createdAt: user.createdAt,
                          updatedAt: user.updatedAt,
                        },
                      ]}
                      currentUser={user}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-4 sm:space-y-6 overflow-x-auto">
            {/* Service Pricing */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Services & Pricing
                </h2>
                <Button
                  className="flex items-center"
                  onClick={() => setShowAddService(true)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>

              {user.services && user.services.length > 0 ? (
                <div className="space-y-4">
                  {user.services.map((service: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-1">
                            {service.name}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-3">
                            {service.description}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-green-600 mr-1 flex-shrink-0" />
                              <span className="font-medium text-green-600 text-sm sm:text-base">
                                ${service.price}
                              </span>
                            </div>

                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-blue-600 mr-1 flex-shrink-0" />
                              <span className="text-blue-600 text-sm sm:text-base">
                                {service.duration} min
                              </span>
                            </div>

                            <div className="flex items-center">
                              <Calculator className="w-4 h-4 text-purple-600 mr-1 flex-shrink-0" />
                              <span className="text-purple-600 text-sm sm:text-base">
                                Transport: $5.00 base
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col sm:ml-4 space-x-2 sm:space-x-0 sm:space-y-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditService(index, service)}
                            className="flex-1 sm:flex-none"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                            onClick={() => handleDeleteService(index)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No services added yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add your services and pricing to start receiving bookings
                  </p>
                  <Button>Add Your First Service</Button>
                </div>
              )}
            </Card>

            {/* Transportation Fee Settings */}
            <Card>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                Transportation Fee Settings
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 sm:mb-6">
                <div className="flex items-start">
                  <Calculator className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-blue-900 text-sm sm:text-base">
                      How Transportation Fees Work
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      Transportation fees are automatically calculated based on
                      distance:
                    </p>
                    <ul className="text-xs sm:text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Base fee: $5.00 (minimum charge)</li>
                      <li>• Distance fee: $2.00 per kilometer</li>
                      <li>• Total = Base fee + (Distance × $2.00)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Fee Structure</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Base Fee</span>
                      <span className="font-medium">$5.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Per Kilometer</span>
                      <span className="font-medium">$2.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Example Calculations</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">1 km away:</span>
                      <span>$5.00 + $2.00 = $7.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">3 km away:</span>
                      <span>$5.00 + $6.00 = $11.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">5 km away:</span>
                      <span>$5.00 + $10.00 = $15.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "availability" && (
          <div className="space-y-4 sm:space-y-6 overflow-x-auto">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Availability
                </h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        // Compute current week range (Mon-Sun)
                        const today = new Date();
                        const day = today.getDay();
                        const diff = (day === 0 ? -6 : 1) - day;
                        const weekStartDate = new Date(today);
                        weekStartDate.setDate(today.getDate() + diff);
                        weekStartDate.setHours(0, 0, 0, 0);
                        const weekEndDate = new Date(weekStartDate);
                        weekEndDate.setDate(weekStartDate.getDate() + 6);
                        weekEndDate.setHours(23, 59, 59, 999);

                        const weekBlocks = (myBlocks || []).filter((b: any) => {
                          const s = new Date(b.start);
                          return s >= weekStartDate && s <= weekEndDate;
                        });
                        if (weekBlocks.length === 0) {
                          toast.error("No blocks in this week to copy");
                          return;
                        }
                        await Promise.all(
                          weekBlocks.map((b: any) =>
                            api.createAvailabilityBlock({
                              start: new Date(
                                new Date(b.start).getTime() +
                                  7 * 24 * 60 * 60 * 1000
                              ).toISOString(),
                              end: new Date(
                                new Date(b.end).getTime() +
                                  7 * 24 * 60 * 60 * 1000
                              ).toISOString(),
                              location: b.location
                                ? {
                                    coordinates: [
                                      b.location.coordinates[0],
                                      b.location.coordinates[1],
                                    ],
                                    address: b.location.address,
                                  }
                                : undefined,
                            })
                          )
                        );
                        toast.success("Week copied to next week");
                        refetchBlocks();
                      } catch (e: any) {
                        toast.error(
                          e?.response?.data?.message || "Failed to copy week"
                        );
                      }
                    }}
                  >
                    Copy This Week → Next
                  </Button>
                  <Button onClick={() => setShowAvailabilityModal(true)}>
                    + Add Availability Block
                  </Button>
                </div>
              </div>

              {/* Placeholder calendar scaffold */}
              <div className="grid grid-cols-7 gap-2 text-sm">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-center font-medium text-gray-600"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const today = new Date();
                  const day = today.getDay();
                  const diff = (day === 0 ? -6 : 1) - day + i;
                  const dayDate = new Date(today);
                  dayDate.setDate(today.getDate() + diff);
                  dayDate.setHours(0, 0, 0, 0);

                  const blocksForDay = (myBlocks || []).filter((b: any) => {
                    const s = new Date(b.start);
                    return (
                      s.getFullYear() === dayDate.getFullYear() &&
                      s.getMonth() === dayDate.getMonth() &&
                      s.getDate() === dayDate.getDate()
                    );
                  });

                  const onDayClick = () => {
                    const start = new Date(dayDate);
                    start.setHours(9, 0, 0, 0);
                    const end = new Date(start);
                    end.setMinutes(
                      end.getMinutes() +
                        (settingsForm.slotIntervalMinutes || 30)
                    );
                    setAvailabilityForm({
                      start: start.toISOString().slice(0, 16),
                      end: end.toISOString().slice(0, 16),
                    } as any);
                    setShowAvailabilityModal(true);
                  };

                  return (
                    <div
                      key={i}
                      className="min-h-[180px] border rounded-lg bg-white p-1 cursor-pointer hover:bg-gray-50"
                      onClick={onDayClick}
                      title="Click to add a block on this day"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {dayDate.toLocaleDateString()}
                      </div>
                      <div className="space-y-1">
                        {blocksForDay.map((b: any) => (
                          <div
                            key={b._id}
                            className="group text-xs bg-green-50 border border-green-200 rounded px-2 py-1 flex items-center justify-between hover:bg-green-100"
                          >
                            <span>
                              {new Date(b.start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(b.end).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="text-gray-700 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBlockId(b._id);
                                  setAvailabilityForm({
                                    start: new Date(b.start)
                                      .toISOString()
                                      .slice(0, 16),
                                    end: new Date(b.end)
                                      .toISOString()
                                      .slice(0, 16),
                                  } as any);
                                  setShowAvailabilityModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  (async () => {
                                    const newEnd = new Date(
                                      new Date(b.end).getTime() +
                                        (settingsForm.slotIntervalMinutes ||
                                          30) *
                                          60000
                                    );
                                    try {
                                      await api.updateAvailabilityBlock(b._id, {
                                        end: newEnd.toISOString(),
                                      });
                                      toast.success("Block extended");
                                      refetchBlocks();
                                    } catch (err: any) {
                                      toast.error(
                                        err.response?.data?.message ||
                                          "Failed to update block"
                                      );
                                    }
                                  })();
                                }}
                                title="Quick extend by one interval"
                              >
                                Extend
                              </button>
                              <button
                                className="text-red-600 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlockMutation.mutate(b._id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Tip: Click a day to add a block. Drag interactions coming soon.
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Slot Settings</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={settingsForm.slotIntervalMinutes}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        slotIntervalMinutes: parseInt(e.target.value || "0"),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buffer (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={settingsForm.bufferMinutes}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bufferMinutes: parseInt(e.target.value || "0"),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={async () => {
                    try {
                      await api.updateAvailabilitySettings({
                        slotIntervalMinutes: settingsForm.slotIntervalMinutes,
                        bufferMinutes: settingsForm.bufferMinutes,
                      });
                      toast.success("Slot settings saved");
                    } catch (e: any) {
                      toast.error(
                        e.response?.data?.message || "Failed to save settings"
                      );
                    }
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Blocks</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetchBlocks()}
                >
                  Refresh
                </Button>
              </div>
              {isFetchingBlocks ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : !myBlocks || myBlocks.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No availability blocks yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {myBlocks.map((b: any) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {new Date(b.start).toLocaleString()} —{" "}
                          {new Date(b.end).toLocaleString()}
                        </div>
                        {b.location?.address && (
                          <div className="text-gray-600">
                            📍 {b.location.address}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => deleteBlockMutation.mutate(b._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
          initialLocation={
            user.location
              ? [user.location.coordinates[1], user.location.coordinates[0]]
              : coordinates
              ? [coordinates[1], coordinates[0]]
              : undefined
          }
          title="Set Your Business Location"
        />
      )}

      {/* Service Management Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingService !== null ? "Edit Service" : "Add New Service"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Haircut, Beard Trim"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Service description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        duration: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={
                  editingService !== null
                    ? handleUpdateService
                    : handleAddService
                }
                className="flex-1"
                disabled={
                  addServiceMutation.isPending ||
                  updateServiceMutation.isPending
                }
              >
                {addServiceMutation.isPending || updateServiceMutation.isPending
                  ? "Saving..."
                  : editingService !== null
                  ? "Update Service"
                  : "Add Service"}
              </Button>
              <Button
                variant="secondary"
                onClick={resetServiceForm}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Block Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingBlockId
                ? "Edit Availability Block"
                : "Add Availability Block"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={availabilityForm.start}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      start: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={availabilityForm.end}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      end: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional Location
                </label>
                <div className="flex items-center space-x-2">
                  {availabilityForm.location ? (
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-700">
                        📍{" "}
                        {availabilityForm.location.address ||
                          `${availabilityForm.location.coordinates[1].toFixed(
                            6
                          )}, ${availabilityForm.location.coordinates[0].toFixed(
                            6
                          )}`}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg border text-gray-500 text-sm">
                      No location set
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAvailabilityLocationPicker(true)}
                  >
                    Set Location
                  </Button>
                  {availabilityForm.location && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          location: undefined,
                        })
                      }
                      className="text-red-600 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={async () => {
                  try {
                    if (editingBlockId) {
                      await api.updateAvailabilityBlock(editingBlockId, {
                        start: availabilityForm.start,
                        end: availabilityForm.end,
                        location: availabilityForm.location,
                      });
                      toast.success("Availability block updated");
                    } else {
                      await api.createAvailabilityBlock({
                        start: availabilityForm.start,
                        end: availabilityForm.end,
                        location: availabilityForm.location,
                      });
                      toast.success("Availability block added");
                    }
                    setEditingBlockId(null);
                    setShowAvailabilityModal(false);
                    refetchBlocks();
                  } catch (e: any) {
                    toast.error(
                      e.response?.data?.message || "Failed to add block"
                    );
                  }
                }}
                className="flex-1"
              >
                {editingBlockId ? "Update" : "Save"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAvailabilityModal(false);
                  setEditingBlockId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payments & Deposits Tab */}
      {activeTab === "payments" && (
        <div className="space-y-4 sm:space-y-6 overflow-x-auto">
          {/* Stripe Account Status */}
          <StripeAccountStatus />

          {/* Payment Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold">
                  Deposit Settings
                </h3>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                    (user as any)?.requireDeposit !== false
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {(user as any)?.requireDeposit !== false
                    ? "Enabled"
                    : "Disabled"}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Deposit Type:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-right">
                    {(user as any)?.depositType === "fixed"
                      ? "Fixed Amount"
                      : "Percentage"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Deposit Value:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-right">
                    {(user as any)?.depositType === "fixed"
                      ? `$${((user as any)?.depositValue || 0) / 100}`
                      : `${(user as any)?.depositValue || 0}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Inherit from Admin:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-right">
                    {(user as any)?.inheritDepositFromAdmin !== false
                      ? "Yes"
                      : "No"}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold">
                  Stripe Connection
                </h3>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                    user?.stripeAccountId
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user?.stripeAccountId ? "Connected" : "Not Connected"}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                    Account ID:
                  </span>
                  <span className="text-xs font-mono text-gray-500 truncate text-right">
                    {user?.stripeAccountId || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Payment Processing:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-right">
                    {user?.stripeAccountId ? "Active" : "Inactive"}
                  </span>
                </div>
                {!user?.stripeAccountId && (
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={async () => {
                      try {
                        const response = await apiClient.post(
                          "/connect/onboard"
                        );
                        const data = response.data;
                        if (data.success && data.url) {
                          window.open(data.url, "_blank");
                        } else {
                          toast.error("Failed to create onboarding link");
                        }
                      } catch (error) {
                        console.error("Stripe onboarding error:", error);
                        toast.error("Failed to start Stripe onboarding");
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Payment Information */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Wallet className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Platform Commission
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900">20%</p>
                <p className="text-xs text-blue-600">Default platform fee</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Payment Method
                  </span>
                </div>
                <p className="text-lg font-bold text-green-900">Stripe</p>
                <p className="text-xs text-green-600">
                  Secure payment processing
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Settings className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">
                    Payout Schedule
                  </span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  On Completion
                </p>
                <p className="text-xs text-purple-600">Automatic release</p>
              </div>
            </div>
          </Card>

          {/* Recent Payment Activity */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">
              Recent Payment Activity
            </h3>
            <div className="space-y-3">
              {requests
                ?.filter((r: any) => r.status === "completed" && r.amount)
                .slice(0, 5)
                .map((request: any) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Service Completed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.scheduledTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${(request.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Net: $
                        {((request.barberNetAmount || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              {(!requests ||
                requests.filter(
                  (r: any) => r.status === "completed" && r.amount
                ).length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No completed payments yet</p>
                  <p className="text-sm">
                    Your earnings will appear here after service completion
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Settings Help */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">How Payments Work</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Deposit Collection
                  </p>
                  <p>
                    Customers pay a deposit when booking (percentage or fixed
                    amount)
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Service Completion
                  </p>
                  <p>Remainder payment is collected after service completion</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Payout Release</p>
                  <p>
                    Your net earnings (after 20% platform commission) are
                    automatically transferred to your Stripe account
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Location Picker Modal for Availability Blocks */}
      {showAvailabilityLocationPicker && (
        <LocationPicker
          onLocationSelect={(location) => {
            setAvailabilityForm({ ...availabilityForm, location });
            setShowAvailabilityLocationPicker(false);
          }}
          onCancel={() => {
            setShowAvailabilityLocationPicker(false);
          }}
          initialLocation={
            availabilityForm.location
              ? [
                  availabilityForm.location.coordinates[1],
                  availabilityForm.location.coordinates[0],
                ]
              : user.location
              ? [user.location.coordinates[1], user.location.coordinates[0]]
              : coordinates
              ? [coordinates[1], coordinates[0]]
              : undefined
          }
          title="Set Block Location"
        />
      )}
    </div>
  );
}
