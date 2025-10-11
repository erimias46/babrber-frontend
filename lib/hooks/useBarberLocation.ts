"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/lib/socket/SocketContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api/client";
import toast from "react-hot-toast";

interface LocationState {
  coordinates: [number, number] | null;
  error: string | null;
  loading: boolean;
  isTracking: boolean;
}

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number; // in milliseconds
  persistWhenOffline?: boolean;
}

export function useBarberLocation(options: LocationTrackingOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 30000, // 30 seconds
    updateInterval = 60000, // 1 minute
    persistWhenOffline = true,
  } = options;

  const { socket } = useSocket();
  const { user, updateUser, token } = useAuth();
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    error: null,
    loading: true,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isOnlineRef = useRef<boolean>(navigator.onLine);

  // Check if user is a barber
  const isBarber = user?.role === "barber";

  // Load cached location on mount
  useEffect(() => {
    const cachedLocation = localStorage.getItem("barberLocation");
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        if (parsed.coordinates && parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          // Use cached location if it's less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            setLocation({
              coordinates: parsed.coordinates,
              error: null,
              loading: false,
              isTracking: false,
            });
            return;
          }
        }
      } catch (e) {
        localStorage.removeItem("barberLocation");
      }
    }
  }, []);

  // Update location in database
  const updateLocationInDB = useCallback(
    async (coordinates: [number, number], address?: string) => {
      if (!isBarber) return;

      try {
        const response = await api.updateLocation({
          coordinates,
          address,
        });

        // Update user context with latest location
        const updatedUser = response.data.data;
        updateUser(updatedUser);

        // Emit location update via socket
        if (socket) {
          socket.emit("barber:location-update", {
            coordinates,
            address,
          });
        }

        // Cache the location
        localStorage.setItem(
          "barberLocation",
          JSON.stringify({
            coordinates,
            address,
            timestamp: Date.now(),
          })
        );

        // Cache in service worker for background updates
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_LOCATION',
            coordinates,
            address,
            token: token
          });
        }

        lastUpdateRef.current = Date.now();
      } catch (error) {
        console.error("Failed to update location in database:", error);
        // Still cache the location locally for offline persistence
        localStorage.setItem(
          "barberLocation",
          JSON.stringify({
            coordinates,
            address,
            timestamp: Date.now(),
          })
        );

        // Cache in service worker for background updates
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_LOCATION',
            coordinates,
            address,
            token: token
          });
        }
      }
    },
    [isBarber, socket, updateUser, token]
  );

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!isBarber || !navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        loading: false,
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, isTracking: true }));

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        setLocation({
          coordinates: coords,
          error: null,
          loading: false,
          isTracking: true,
        });

        // Update location in database
        updateLocationInDB(coords);

        // Start watching position changes
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newCoords: [number, number] = [
              position.coords.longitude,
              position.coords.latitude,
            ];

            setLocation((prev) => ({
              ...prev,
              coordinates: newCoords,
              error: null,
            }));

            // Only update database if location changed significantly
            const now = Date.now();
            if (now - lastUpdateRef.current > updateInterval) {
              updateLocationInDB(newCoords);
            }
          },
          (error) => {
            console.error("Location watch error:", error);
            setLocation((prev) => ({
              ...prev,
              error: error.message,
            }));
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          }
        );

        // Set up periodic updates
        intervalRef.current = setInterval(() => {
          if (location.coordinates && user?.isOnline) {
            updateLocationInDB(location.coordinates);
          }
        }, updateInterval);
      },
      (error) => {
        setLocation({
          coordinates: null,
          error: error.message,
          loading: false,
          isTracking: false,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [isBarber, enableHighAccuracy, timeout, maximumAge, updateInterval, updateLocationInDB, user?.isOnline, location.coordinates]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setLocation((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Start tracking when barber goes online
  useEffect(() => {
    if (isBarber && user?.isOnline && !location.isTracking) {
      startTracking();
    } else if (isBarber && !user?.isOnline && location.isTracking) {
      stopTracking();
    }
  }, [isBarber, user?.isOnline, location.isTracking, startTracking, stopTracking]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      if (isBarber && user?.isOnline && location.coordinates) {
        // Update location when coming back online
        updateLocationInDB(location.coordinates);
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isBarber, user?.isOnline, location.coordinates, updateLocationInDB]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Manual location refresh
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setLocation((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        setLocation((prev) => ({
          ...prev,
          coordinates: coords,
          error: null,
          loading: false,
        }));

        updateLocationInDB(coords);
        toast.success("Location updated!");
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        toast.error("Failed to get location");
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updateLocationInDB]);

  // Clear cached location
  const clearCachedLocation = useCallback(() => {
    localStorage.removeItem("barberLocation");
    setLocation({
      coordinates: null,
      error: null,
      loading: false,
      isTracking: false,
    });
  }, []);

  return {
    ...location,
    startTracking,
    stopTracking,
    refreshLocation,
    clearCachedLocation,
  };
}
