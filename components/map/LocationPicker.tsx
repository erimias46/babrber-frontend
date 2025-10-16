"use client";

import { useState } from "react";
import { InteractiveMap } from "./InteractiveMap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { MapPin, Search, Check, X } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (location: {
    coordinates: [number, number];
    address?: string;
  }) => void;
  onCancel?: () => void;
  initialLocation?: [number, number];
  title?: string;
}

export function LocationPicker({
  onLocationSelect,
  onCancel,
  initialLocation,
  title = "Select Your Location",
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleMapLocationSelect = (location: {
    lat: number;
    lng: number;
    address?: string;
  }) => {
    setSelectedLocation(location);
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const response = await geocoder.geocode({ address: searchQuery });

      if (response.results.length > 0) {
        const result = response.results[0];
        const location = result.geometry.location;

        setSelectedLocation({
          lat: location.lat(),
          lng: location.lng(),
          address: result.formatted_address,
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        coordinates: [selectedLocation.lng, selectedLocation.lat], // Note: MongoDB uses [lng, lat]
        address: selectedLocation.address,
      });
    }
  };

  const markers = selectedLocation
    ? [
        {
          id: "selected",
          position: [selectedLocation.lat, selectedLocation.lng] as [
            number,
            number
          ],
          title: "Selected Location",
          type: "user" as const,
        },
      ]
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full h-full sm:h-auto flex items-center justify-center">
        <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-3 sm:p-6 flex flex-col h-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                {title}
              </h2>
              {onCancel && (
                <Button variant="secondary" size="sm" onClick={onCancel}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search for an address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSearchLocation()
                      }
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleSearchLocation}
                    loading={isSearching}
                    disabled={!searchQuery.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Search className="w-4 h-4 sm:mr-0" />
                    <span className="sm:hidden ml-2">Search</span>
                  </Button>
                </div>
              </div>

              {/* Map */}
              <div className="mb-4 sm:mb-6 h-[300px] sm:h-[400px]">
                <InteractiveMap
                  center={
                    selectedLocation
                      ? [selectedLocation.lat, selectedLocation.lng]
                      : initialLocation || [40.7128, -74.006]
                  }
                  markers={markers}
                  onLocationSelect={handleMapLocationSelect}
                  height="100%"
                  className="border rounded-lg w-full h-full"
                />
              </div>

              {/* Selected Location Info */}
              {selectedLocation && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary-900 text-sm sm:text-base">
                        Selected Location
                      </h3>
                      <p className="text-xs sm:text-sm text-primary-700 mt-1 break-words">
                        {selectedLocation.address ||
                          `${selectedLocation.lat.toFixed(
                            6
                          )}, ${selectedLocation.lng.toFixed(6)}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Helper Text */}
              <div className="mb-4 text-xs sm:text-sm text-gray-600">
                <p>
                  💡 Click anywhere on the map to select a location, or search
                  for an address above.
                </p>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t flex-shrink-0 bg-white">
              {onCancel && (
                <Button
                  variant="secondary"
                  onClick={onCancel}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                disabled={!selectedLocation}
                className="flex items-center justify-center w-full sm:w-auto"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Location
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
