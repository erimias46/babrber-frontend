"use client";

import { useState, useEffect } from "react";

interface LocationState {
  coordinates: [number, number] | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    // Try to get cached location first
    const cachedLocation = localStorage.getItem("cachedLocation");
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        if (parsed.coordinates && parsed.timestamp) {
          // Use cached location if it's less than 1 hour old
          const age = Date.now() - parsed.timestamp;
          if (age < 60 * 60 * 1000) {
            setLocation({
              coordinates: parsed.coordinates,
              error: null,
              loading: false,
            });
            return;
          }
        }
      } catch (e) {
        // Invalid cached data, remove it
        localStorage.removeItem("cachedLocation");
      }
    }

    if (!navigator.geolocation) {
      setLocation({
        coordinates: null,
        error: "Geolocation is not supported by this browser",
        loading: false,
      });
      return;
    }

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
        });

        // Cache the location
        localStorage.setItem(
          "cachedLocation",
          JSON.stringify({
            coordinates: coords,
            timestamp: Date.now(),
          })
        );
      },
      (error) => {
        setLocation({
          coordinates: null,
          error: error.message,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const refreshLocation = () => {
    setLocation((prev) => ({ ...prev, loading: true }));

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
        });

        // Cache the location
        localStorage.setItem(
          "cachedLocation",
          JSON.stringify({
            coordinates: coords,
            timestamp: Date.now(),
          })
        );
      },
      (error) => {
        setLocation({
          coordinates: null,
          error: error.message,
          loading: false,
        });
      }
    );
  };

  const clearCachedLocation = () => {
    localStorage.removeItem("cachedLocation");
    setLocation({
      coordinates: null,
      error: null,
      loading: false,
    });
  };

  return { ...location, refreshLocation, clearCachedLocation };
}
