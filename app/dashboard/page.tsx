"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useLocation } from "@/lib/hooks/useLocation";
import { api } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SnapchatStyleMap } from "@/components/map/SnapchatStyleMap";
import { BarberList } from "@/components/map/BarberList";
import { Navbar } from "@/components/layout/Navbar";
import { useSocket } from "@/lib/socket/SocketContext";
import { useEffect, useState, useMemo } from "react";
import { Loader2, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { Barber, Location, User } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { coordinates, loading: locationLoading } = useLocation();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);

  // Ensure current user has all required fields for the map
  const currentUserForMap = useMemo(() => {
    if (!user) return null;

    return {
      ...user,
      // Ensure all required fields exist
      firstName: user.firstName || "User",
      lastName: user.lastName || "User",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      isActive: user.isActive !== undefined ? user.isActive : true,
      isOnline: user.isOnline !== undefined ? user.isOnline : true,
      avatar: user.avatar || null,
      profilePicture: user.profilePicture || null,
      services: user.services || [],
      location: user.location || null,
      businessName: user.businessName || "",
      specialties: user.specialties || [],
      workingHours: user.workingHours || {},
      isApproved: user.isApproved !== undefined ? user.isApproved : true,
      documents: user.documents || [],
      rating: user.rating || 0,
      totalRatings: user.totalRatings || 0,
      profileDescription: user.profileDescription || "",
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
  }, [user]);

  const {
    data: barbers,
    isLoading: barbersLoading,
    error: barbersError,
    refetch: refetchBarbers,
  } = useQuery({
    // Add fallback data to ensure map always renders
    placeholderData: [],
    queryKey: ["all-active-barbers", coordinates, retryCount],
    queryFn: async () => {
      if (!coordinates) {
        throw new Error("Location not available");
      }

      console.log("🔍 Fetching barbers with coordinates:", coordinates);

      const response = await api.getNearbyBarbers({
        longitude: coordinates[0],
        latitude: coordinates[1],
        onlineOnly: true,
        limit: 500,
        radius: 50000, // 50km radius
      });

      console.log("📡 API Response:", response.data);

      // Transform the data to match our map component expectations
      const transformedBarbers = response.data.data.map((barber: any) => ({
        ...barber,
        // Ensure location is properly formatted
        location: barber.location
          ? {
              type: "Point" as const,
              coordinates: barber.location.coordinates,
              address: barber.location.address || "Address not available",
            }
          : null,
        // Ensure services array exists
        services: barber.services || [],
        // Ensure other required fields
        isOnline: barber.isOnline || false,
        rating: barber.rating || 0,
        totalRatings: barber.totalRatings || 0,
        profileDescription: barber.profileDescription || "",
        phone: barber.phone || "",
        businessName: barber.businessName || "",
        specialties: barber.specialties || [],
        workingHours: barber.workingHours || {},
        isApproved: barber.isApproved || false,
        documents: barber.documents || [],
        isActive: barber.isActive || false,
        avatar: barber.avatar || null,
        profilePicture: barber.profilePicture || null,
        createdAt: barber.createdAt || new Date(),
        updatedAt: barber.updatedAt || new Date(),
      }));

      console.log("🎯 Transformed barbers for map:", transformedBarbers);

      // If no barbers found, return empty array
      if (transformedBarbers.length === 0) {
        console.log("⚠️ No barbers found in the area");
        return [];
      }

      return transformedBarbers;
    },
    enabled: !!user && user.role === "user" && !!coordinates,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update user location in backend when coordinates change
  useEffect(() => {
    if (coordinates && user) {
      const updateUserLocation = async () => {
        try {
          await api.updateLocation({
            coordinates: coordinates,
            address: "Current Location", // You could get this from reverse geocoding
          });
          console.log("✅ User location updated in backend");
        } catch (error) {
          console.error("❌ Failed to update user location:", error);
        }
      };

      updateUserLocation();
    }
  }, [coordinates, user]);

  // Listen for barber status changes
  useEffect(() => {
    if (!socket) return;

    const handleBarberStatusChange = (data: any) => {
      console.log("🔄 Barber status changed:", data);
      // Force a complete refresh of the barber data
      queryClient.invalidateQueries({ queryKey: ["all-active-barbers"] });
      refetchBarbers();
    };

    const handleBarberLocationUpdate = (data: any) => {
      console.log("📍 Barber location updated:", data);
      // Force a complete refresh of the barber data
      queryClient.invalidateQueries({ queryKey: ["all-active-barbers"] });
      refetchBarbers();
    };

    socket.on("barber:status-change", handleBarberStatusChange);
    socket.on("barber:location-update", handleBarberLocationUpdate);
    socket.on("barber:new-in-area", handleBarberStatusChange);

    return () => {
      socket.off("barber:status-change", handleBarberStatusChange);
      socket.off("barber:location-update", handleBarberLocationUpdate);
      socket.off("barber:new-in-area", handleBarberStatusChange);
    };
  }, [socket, queryClient, refetchBarbers]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    refetchBarbers();
  };

  const isLoading = locationLoading || barbersLoading;

  // Debug logging
  useEffect(() => {
    console.log("🧭 Dashboard Debug Info:");
    console.log("📍 User coordinates:", coordinates);
    console.log("👤 Current user:", currentUserForMap);
    console.log("✂️ Barbers data:", barbers);
    console.log("🔄 Loading states:", {
      locationLoading,
      barbersLoading,
      isLoading,
    });
  }, [
    coordinates,
    currentUserForMap,
    barbers,
    locationLoading,
    barbersLoading,
    isLoading,
  ]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  // Restrict map dashboard access to users only
  if (user.role !== "user") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            Map dashboard is only available for customers.
            {user.role === "barber" && " Please use your barber dashboard."}
            {user.role === "admin" && " Please use your admin dashboard."}
          </p>
        </div>
      </div>
    );
  }

  // Show location loading state
  if (locationLoading) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
        <div className="absolute top-0 left-0 right-0 z-10">
          <Navbar />
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-xl">Getting your location...</p>
            <p className="text-gray-400 text-sm mt-2">
              Please allow location access to find barbers near you
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for barbers (but still show map)
  const hasBarberError = !!barbersError;

  // Show loading state for barbers
  if (isLoading) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
        <div className="absolute top-0 left-0 right-0 z-10">
          <Navbar />
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-xl">Finding barbers near you...</p>
            <p className="text-gray-400 text-sm mt-2">
              {barbers?.length
                ? `${barbers.length} barbers found`
                : "Searching your area..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show map even if no barbers found (but show a warning)
  const hasBarbers = barbers && barbers.length > 0;

  // Debug logging before render
  console.log("🎯 Dashboard rendering map with:", {
    coordinates,
    barbersCount: barbers?.length,
    currentUserId: currentUserForMap?._id,
    userRole: currentUserForMap?.role,
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10">
        <Navbar />
      </div>
      
      {/* Map Container */}
      <div className="pt-16 sm:pt-20 flex-1 w-full">
        <SnapchatStyleMap
          userLocation={coordinates}
          barbers={barbers || []}
          currentUser={currentUserForMap as User}
        />
      </div>

      {/* Barber List at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <BarberList 
          barbers={barbers || []} 
          onBarberSelect={(barber) => {
            console.log('Selected barber:', barber);
            // You can add additional logic here if needed
          }}
        />
      </div>

      {/* Info overlay showing number of barbers found */}
      <div className="absolute top-20 sm:top-24 left-2 sm:left-4 z-30 max-w-[calc(100vw-1rem)] sm:max-w-none">
        <div className="bg-gray-800/95 backdrop-blur-sm text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {hasBarbers
                ? `${barbers.length} barber${barbers.length !== 1 ? "s" : ""}`
                : "No barbers"}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            {hasBarbers
              ? `${barbers.filter((b: Barber) => b.isOnline).length} online`
              : "Check back later"}
          </div>
        </div>
      </div>

      {/* Warning if no barbers */}
      {!hasBarbers && (
        <div className="absolute top-28 sm:top-32 left-2 sm:left-4 z-30 max-w-[calc(100vw-1rem)] sm:max-w-none">
          <div className="bg-yellow-600/95 backdrop-blur-sm text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg border border-yellow-500">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                No barbers nearby
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-yellow-200 mt-0.5 sm:mt-1 truncate">
              Check back later
            </div>
          </div>
        </div>
      )}

      {/* Error warning if API failed */}
      {hasBarberError && (
        <div className="absolute top-36 sm:top-40 left-2 sm:left-4 z-30 max-w-[calc(100vw-1rem)] sm:max-w-none">
          <div className="bg-red-600/95 backdrop-blur-sm text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg border border-red-500">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">API Error</span>
            </div>
            <div className="text-[10px] sm:text-xs text-red-200 mt-0.5 sm:mt-1 line-clamp-2">
              {barbersError instanceof Error
                ? barbersError.message
                : "Failed to fetch"}
            </div>
            <button
              onClick={handleRetry}
              className="mt-1.5 sm:mt-2 bg-red-700 hover:bg-red-800 text-white px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs transition-colors w-full"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Debug info overlay (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-30 max-w-[calc(50vw-1rem)] sm:max-w-none">
          <div className="bg-gray-800/95 backdrop-blur-sm text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg border border-gray-700 text-[10px] sm:text-xs">
            <div className="truncate">
              📍 {coordinates?.join(", ") || "No coords"}
            </div>
            <div className="truncate">
              👤 {currentUserForMap?.firstName || "Unknown"}
            </div>
            <div className="truncate">✂️ {barbers?.length || 0} barbers</div>
          </div>
        </div>
      )}

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-4 right-2 sm:right-4 z-30 md:hidden">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2.5 sm:p-3 rounded-full shadow-lg transition-colors touch-target"
            title="Refresh barbers"
            aria-label="Refresh barbers"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
