"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { EnhancedMarker } from "./EnhancedMarker";
import { User, Barber, Location } from "@/types";
import { useGoogleMaps } from "@/lib/hooks/useGoogleMaps";

const mapThemes = {
  dark: {
    name: "dark",
    styles: [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#212121" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "administrative.country",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
      },
      {
        featureType: "administrative.land_parcel",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bdbdbd" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#181818" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1b1b1b" }],
      },
      {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [{ color: "#2c2c2c" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#373737" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3c3c3c" }],
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry",
        stylers: [{ color: "#4e4e4e" }],
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
      },
      {
        featureType: "transit",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3d3d3d" }],
      },
    ],
  },
};

interface SnapchatStyleMapProps {
  userLocation: [number, number] | null;
  barbers: Barber[];
  currentUser: User | null;
}

export function SnapchatStyleMap({
  userLocation,
  barbers,
  currentUser,
}: SnapchatStyleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapState, setMapState] = useState<{
    isLoaded: boolean;
    isInitializing: boolean;
    error: string | null;
    retryCount: number;
  }>({
    isLoaded: false,
    isInitializing: false,
    error: null,
    retryCount: 0,
  });

  const { loaded: mapsLoaded, error: mapsError } = useGoogleMaps();

  // Memoize the center position to prevent unnecessary recalculations
  const mapCenter = useMemo(() => {
    if (userLocation) {
      return { lat: userLocation[1], lng: userLocation[0] };
    }
    return { lat: 40.7128, lng: -74.006 }; // Default to NYC
  }, [userLocation]);

  // Memoize filtered barbers to prevent unnecessary re-renders
  const filteredBarbers = useMemo(() => {
    return barbers.filter(
      (barber) => barber.isOnline && barber.location?.coordinates
    );
  }, [barbers]);

  // Memoize markers data
  const markersData = useMemo(() => {
    const allMarkers = [];

    // Add current user marker if location is available
    if (userLocation && currentUser) {
      console.log("📍 Adding user marker:", {
        userId: currentUser._id,
        position: { lat: userLocation[1], lng: userLocation[0] },
      });
      allMarkers.push({
        id: `user-${currentUser._id}`,
        position: { lat: userLocation[1], lng: userLocation[0] },
        type: "user" as const,
        user: currentUser,
      });
    } else {
      console.log("⚠️ User marker not added:", {
        userLocation: !!userLocation,
        currentUser: !!currentUser,
      });
    }

    // Add barber markers
    filteredBarbers.forEach((barber) => {
      if (barber.location?.coordinates) {
        console.log("✂️ Adding barber marker:", {
          barberId: barber._id,
          position: {
            lat: (barber.location as Location).coordinates[1],
            lng: (barber.location as Location).coordinates[0],
          },
        });
        allMarkers.push({
          id: `barber-${barber._id}`,
          position: {
            lat: (barber.location as Location).coordinates[1],
            lng: (barber.location as Location).coordinates[0],
          },
          type: "barber" as const,
          user: barber,
        });
      } else {
        console.log("⚠️ Barber marker not added (no location):", barber._id);
      }
    });

    console.log("🎯 Total markers created:", allMarkers.length);
    return allMarkers;
  }, [userLocation, currentUser, filteredBarbers]);

  // Initialize map function
  const initializeMap = useCallback(async () => {
    console.log("🗺️ initializeMap called with:", {
      mapRef: !!mapRef.current,
      mapsLoaded,
      isInitializing: mapState.isInitializing,
      googleMaps: !!(window as any).google?.maps,
    });

    if (!mapRef.current || !mapsLoaded || mapState.isInitializing) {
      console.log("⚠️ Map initialization skipped:", {
        mapRef: !!mapRef.current,
        mapsLoaded,
        isInitializing: mapState.isInitializing,
      });
      return;
    }

    // Check if Google Maps is available
    if (!(window as any).google?.maps) {
      setMapState((prev) => ({
        ...prev,
        error: "Google Maps not available",
        isInitializing: false,
      }));
      return;
    }

    setMapState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Clear any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }

      // Create new map instance
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 18, // Very zoomed in for precise user location
        styles: mapThemes.dark.styles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: (window as any).google.maps.ControlPosition?.RIGHT_TOP || 1,
        },
        gestureHandling: "greedy",
        disableDefaultUI: false,
        backgroundColor: "#212121",
      });

      mapInstanceRef.current = map;

      // Wait for map to be ready
      await new Promise<void>((resolve) => {
        const listener = map.addListener("idle", () => {
          if ((window as any).google?.maps?.event?.removeListener) {
            (window as any).google.maps.event.removeListener(listener);
          }
          resolve();
        });
      });

      setMapState((prev) => ({
        ...prev,
        isLoaded: true,
        isInitializing: false,
        error: null,
      }));

      console.log("[SnapchatStyleMap] Map initialized successfully");
      
      // Auto-center and zoom to user location if available
      if (userLocation && userLocation.length === 2) {
        const userLatLng = { lat: userLocation[1], lng: userLocation[0] };
        map.setCenter(userLatLng);
        map.setZoom(18); // Very zoomed in for precise location awareness
        
        // Add a slight delay to ensure smooth transition
        setTimeout(() => {
          map.panTo(userLatLng);
        }, 500);
      }
    } catch (error) {
      console.error("[SnapchatStyleMap] Failed to initialize map:", error);
      setMapState((prev) => ({
        ...prev,
        error: `Failed to initialize map: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        isInitializing: false,
      }));
    }
  }, [mapsLoaded, mapCenter, mapState.isInitializing, userLocation]);

  // Handle map errors and retry
  const handleRetry = useCallback(() => {
    setMapState((prev) => ({
      ...prev,
      error: null,
      retryCount: prev.retryCount + 1,
    }));

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    // Reinitialize after a short delay
    setTimeout(() => {
      initializeMap();
    }, 100);
  }, [initializeMap]);

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (mapInstanceRef.current && userLocation && userLocation.length === 2) {
      const userLatLng = { lat: userLocation[1], lng: userLocation[0] };
      mapInstanceRef.current.setCenter(userLatLng);
      mapInstanceRef.current.setZoom(18); // Very zoomed in for street-level detail
      mapInstanceRef.current.panTo(userLatLng);
    }
  }, [userLocation]);

  // Initialize map when dependencies change
  useEffect(() => {
    if (mapsLoaded && !mapState.isLoaded && !mapState.isInitializing) {
      initializeMap();
    }
  }, [mapsLoaded, mapState.isLoaded, mapState.isInitializing, initializeMap]);

  // Handle maps error
  useEffect(() => {
    if (mapsError) {
      setMapState((prev) => ({
        ...prev,
        error: mapsError,
      }));
    }
  }, [mapsError]);

  // Update map center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation && mapState.isLoaded) {
      mapInstanceRef.current.setCenter(mapCenter);
    }
  }, [userLocation, mapCenter, mapState.isLoaded]);

  // Cleanup markers when component unmounts or barbers change
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, [filteredBarbers]);

  // Render error state
  if (mapState.error) {
    return (
      <div className="h-full w-full min-h-[400px] flex items-center justify-center bg-gray-800 text-red-500 text-center p-8">
        <div className="max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <div className="text-2xl font-bold mb-2">Map Error</div>
          <div className="text-sm mb-4">{mapState.error}</div>
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <div className="mt-4 text-xs text-gray-400">
            Retry count: {mapState.retryCount}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[400px] relative">
      <div ref={mapRef} className="h-full w-full min-h-[400px]" />

      {/* Loading overlay */}
      {(!mapState.isLoaded || !mapsLoaded || mapState.isInitializing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-lg">
              {mapState.isInitializing
                ? "Initializing Map..."
                : "Loading Map..."}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Please wait while we set up your map experience
            </p>
          </div>
        </div>
      )}

      {/* Render markers when map is loaded */}
      {mapState.isLoaded && mapInstanceRef.current && (
        <>
          {console.log("🎯 Rendering markers:", markersData.length)}
          {markersData.map(
            (marker) =>
              currentUser && (
                <EnhancedMarker
                  key={marker.id}
                  map={mapInstanceRef.current}
                  marker={marker}
                  currentUser={currentUser}
                />
              )
          )}
        </>
      )}
    </div>
  );
}
