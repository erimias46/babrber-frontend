"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGoogleMaps } from "@/lib/hooks/useGoogleMaps";

interface MapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    type: "user" | "barber";
    onClick?: () => void;
  }>;
  onLocationSelect?: (location: {
    lat: number;
    lng: number;
    address?: string;
  }) => void;
  height?: string;
  className?: string;
}

export function InteractiveMap({
  center = [40.7128, -74.006], // Default to NYC
  zoom = 13,
  markers = [],
  onLocationSelect,
  height = "400px",
  className = "",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { loaded: mapsLoaded, error: mapsError } = useGoogleMaps();
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (mapsLoaded && mapRef.current && !mapInstanceRef.current) {
      try {
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapInstanceRef.current = map;
        setMapInitialized(true);
      } catch (err) {
        console.error("Failed to initialize map", err);
      }
    }
  }, [mapsLoaded, center, zoom]);

  useEffect(() => {
    if (mapInitialized && onLocationSelect) {
      const clickListener = mapInstanceRef.current.addListener(
        "click",
        async (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const geocoder = new (window as any).google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({
                location: { lat, lng },
              });
              const address = response.results[0]?.formatted_address;
              onLocationSelect({ lat, lng, address });
            } catch (err) {
              onLocationSelect({ lat, lng });
            }
          }
        }
      );
      return () => {
        (window as any).google.maps.event.removeListener(clickListener);
      };
    }
  }, [mapInitialized, onLocationSelect]);

  // Update markers when they change
  useEffect(() => {
    if (!mapInitialized) return;

    // Simple marker handling (clear and add)
    // A more robust solution would be to diff markers
    const currentMarkers: any[] = [];
    markers.forEach((marker) => {
      const mapMarker = new (window as any).google.maps.Marker({
        position: { lat: marker.position[0], lng: marker.position[1] },
        map: mapInstanceRef.current,
        title: marker.title,
        icon: {
          url:
            marker.type === "barber"
              ? "/icons/barber-marker.svg"
              : "/icons/user-marker.svg",
          scaledSize: new (window as any).google.maps.Size(40, 40),
          anchor: new (window as any).google.maps.Point(20, 20),
        },
      });

      if (marker.onClick) {
        mapMarker.addListener("click", marker.onClick);
      }
      currentMarkers.push(mapMarker);
    });

    return () => {
      currentMarkers.forEach((m) => m.setMap(null));
    };
  }, [markers, mapInitialized]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(15);
        }

        if (onLocationSelect) {
          onLocationSelect({ lat, lng });
        }
      },
      (error) => {
        console.error("Failed to get current location", error);
      }
    );
  };

  if (mapsError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{mapsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} style={{ height }} className="w-full" />

      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {mapInitialized && (
        <Button
          size="sm"
          className="absolute top-4 right-4 shadow-lg"
          onClick={getCurrentLocation}
        >
          <Navigation className="w-4 h-4 mr-2" />
          My Location
        </Button>
      )}
    </div>
  );
}
