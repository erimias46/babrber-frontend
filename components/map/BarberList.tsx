"use client";

import { useState } from "react";
import { Barber } from "@/types";
import { Star, MapPin, Clock, ChevronUp, ChevronDown } from "lucide-react";
import BarberDetailModal from "./BarberDetailModal";

interface BarberListProps {
  barbers: Barber[];
  onBarberSelect?: (barber: Barber) => void;
  className?: string;
}

export function BarberList({ barbers, onBarberSelect, className = "" }: BarberListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Group barbers by location for better organization
  const groupedBarbers = barbers.reduce((acc, barber) => {
    if (!barber.location?.address) return acc;
    
    const address = barber.location.address;
    if (!acc[address]) {
      acc[address] = [];
    }
    acc[address].push(barber);
    return acc;
  }, {} as Record<string, Barber[]>);

  const handleBarberClick = (barber: Barber) => {
    setSelectedBarber(barber);
    onBarberSelect?.(barber);
  };

  const getDistance = (barber: Barber) => {
    // Mock distance calculation - in real app, calculate based on coordinates
    return Math.floor(Math.random() * 5) + 1;
  };

  const getAverageRating = (barber: Barber) => {
    // Mock rating - in real app, calculate from reviews
    return (Math.random() * 2 + 3).toFixed(1);
  };

  if (barbers.length === 0) {
    return (
      <div className={`bg-white border-t border-gray-200 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No barbers found in your area</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white border-t border-gray-200 shadow-lg ${className}`}>
        {/* Header */}
        <div 
          className="p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                {isExpanded 
                  ? `${barbers.length} Barber${barbers.length !== 1 ? 's' : ''} Available`
                  : `${barbers.length} Barber${barbers.length !== 1 ? 's' : ''} Nearby`
                }
              </h3>
              {!isExpanded && barbers.length > 2 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Tap to see all
                </span>
              )}
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Barber List */}
        <div className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'
        }`}>
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedBarbers).slice(0, isExpanded ? undefined : 1).map(([address, locationBarbers]) => (
              <div key={address} className="p-3 sm:p-4">
                {/* Location Header */}
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 truncate">
                    {address}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({locationBarbers.length} barber{locationBarbers.length !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Barbers in this location */}
                <div className="space-y-2">
                  {(isExpanded ? locationBarbers : locationBarbers.slice(0, 2)).map((barber) => (
                    <div
                      key={barber._id}
                      onClick={() => handleBarberClick(barber)}
                      className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700 group-hover:scale-105 transition-transform">
                          {barber.firstName?.[0]}{barber.lastName?.[0]}
                        </div>
                        {/* Online indicator */}
                        <div className="relative -mt-2 -mr-1">
                          <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                      </div>

                      {/* Barber Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {barber.firstName} {barber.lastName}
                          </h4>
                          {barber.isApproved && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 mt-1">
                          {/* Rating */}
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">
                              {getAverageRating(barber)}
                            </span>
                          </div>

                          {/* Distance */}
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {getDistance(barber)} mi
                            </span>
                          </div>

                          {/* Availability */}
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-green-600 font-medium">
                              Available now
                            </span>
                          </div>
                        </div>

                        {/* Services preview */}
                        {barber.services && barber.services.length > 0 && (
                          <div className="mt-1">
                            <div className="flex flex-wrap gap-1">
                              {barber.services.slice(0, 2).map((service, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700"
                                >
                                  {service.name}
                                </span>
                              ))}
                              {barber.services.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{barber.services.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-semibold text-green-600">
                          ${barber.services?.[0]?.price || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">starting</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator for collapsed state */}
                  {!isExpanded && locationBarbers.length > 2 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        +{locationBarbers.length - 2} more barber{locationBarbers.length - 2 !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Show more locations indicator for collapsed state */}
            {!isExpanded && Object.keys(groupedBarbers).length > 1 && (
              <div className="p-3 sm:p-4 text-center border-t border-gray-100">
                <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  +{Object.keys(groupedBarbers).length - 1} more location{Object.keys(groupedBarbers).length - 1 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barber Detail Modal */}
      {selectedBarber && (
        <BarberDetailModal
          barber={selectedBarber}
          onClose={() => setSelectedBarber(null)}
        />
      )}
    </>
  );
}
