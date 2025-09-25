"use client";

import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import BarberDetailModal from "./BarberDetailModal";
import { useRouter } from "next/navigation";
import { User } from "@/types";

interface MarkerComponentProps {
  user: User;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
  isCurrentUser: boolean;
}

const MarkerComponent = ({
  user,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHovered,
  isCurrentUser,
}: MarkerComponentProps) => {
  const isActive = user.isOnline;
  const price =
    user.services && user.services.length > 0
      ? Math.min(...user.services.map((s) => s.price))
      : 25;

  // Different styling for current user vs barbers
  const markerSize = isCurrentUser ? "w-14 h-14" : "w-12 h-12";
  const borderColor = isCurrentUser
    ? "border-blue-500 border-4"
    : isActive
    ? "border-green-400 border-4"
    : "border-gray-400 border-4";

  // Get user's bitmoji/avatar
  const getUserAvatar = () => {
    if (user.avatar || user.profilePicture) {
      return (
        <img
          src={user.avatar || user.profilePicture}
          alt={user.firstName}
          className="w-full h-full object-cover"
        />
      );
    }

    // Default bitmoji based on user type
    if (isCurrentUser) {
      return "🧑‍💼"; // User bitmoji
    }
    return user.role === "barber" ? "💇‍♂️" : "👨‍🦲"; // Barber bitmoji
  };

  return (
    <div
      className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
      style={{
        animation: `bounce-in 0.5s ${Math.random() * 0.3}s ease-out forwards`,
        zIndex: isCurrentUser ? 1000 : 100, // Current user always on top
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative group">
        <div
          className={`${markerSize} rounded-full ${borderColor} overflow-hidden bg-white shadow-xl hover:scale-110 transition-all ${
            isCurrentUser ? "shadow-blue-500/50" : ""
          }`}
        >
          <div
            className={`w-full h-full ${
              isCurrentUser
                ? "bg-gradient-to-br from-blue-50 to-blue-100"
                : "bg-gradient-to-br from-blue-50 to-purple-50"
            } flex items-center justify-center text-2xl`}
          >
            {getUserAvatar()}
          </div>
        </div>

        {/* Online indicator for barbers */}
        {!isCurrentUser && isActive && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-pulse border-2 border-white">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        )}

        {/* Current user indicator */}
        {isCurrentUser && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-75"></div>
          </div>
        )}

        {/* Price tag for barbers only */}
        {!isCurrentUser && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-white text-green-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              ${price}
            </div>
          </div>
        )}

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap"
            >
              {isCurrentUser ? "You" : `${user.firstName} ${user.lastName}`}
              {!isCurrentUser && (
                <div className="text-xs text-gray-300">
                  {isActive ? "Online" : "Offline"} • Click to view
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface EnhancedMarkerProps {
  map: any; // Google Maps map object
  marker: any; // Google Maps marker object
  currentUser: User;
}

export function EnhancedMarker({
  map,
  marker,
  currentUser,
}: EnhancedMarkerProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const overlayRef = useRef<any>(null);

  const isCurrentUser = marker.user._id === currentUser._id;

  const handleMarkerClick = () => {
    if (isCurrentUser) {
      router.push("/profile");
    } else {
      setShowModal(true);
    }
  };

  useEffect(() => {
    if (!map || !(window as any).google?.maps?.OverlayView) {
      setError("Google Maps OverlayView not available");
      return;
    }

    try {
      class CustomMarker extends (window as any).google.maps.OverlayView {
        private position: any;
        private div: HTMLDivElement | null = null;

        constructor(position: any) {
          super();
          this.position = position;
        }

        onAdd() {
          try {
            this.div = document.createElement("div");
            this.div.style.position = "absolute";
            this.div.style.pointerEvents = "auto";

            const panes = this.getPanes();
            if (panes?.overlayMouseTarget) {
              panes.overlayMouseTarget.appendChild(this.div);
              setElement(this.div);
              setError(null);
            } else {
              setError("Failed to get map panes");
            }
          } catch (err) {
            setError(
              `Failed to add marker: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        draw() {
          try {
            if (!this.div) return;

            const overlayProjection = this.getProjection();
            if (!overlayProjection) {
              setError("Failed to get map projection");
              return;
            }

            const sw = overlayProjection.fromLatLngToDivPixel(this.position);
            if (sw) {
              this.div.style.left = `${sw.x}px`;
              this.div.style.top = `${sw.y}px`;
            }
          } catch (err) {
            setError(
              `Failed to draw marker: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        onRemove() {
          try {
            if (this.div && this.div.parentNode) {
              (this.div.parentNode as HTMLElement).removeChild(this.div);
              this.div = null;
            }
          } catch (err) {
            console.error("Error removing marker:", err);
          }
        }
      }

      const position = new (window as any).google.maps.LatLng(
        marker.position.lat,
        marker.position.lng
      );

      const customMarker = new CustomMarker(position);
      overlayRef.current = customMarker;
      customMarker.setMap(map);

      return () => {
        try {
          if (customMarker && customMarker.setMap) {
            customMarker.setMap(null);
          }
        } catch (err) {
          console.error("Error cleaning up marker:", err);
        }
      };
    } catch (err) {
      setError(
        `Failed to create marker: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, [map, marker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (overlayRef.current && overlayRef.current.setMap) {
          overlayRef.current.setMap(null);
        }
      } catch (err) {
        console.error("Error cleaning up marker on unmount:", err);
      }
    };
  }, []);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded z-50">
        Marker Error: {error}
      </div>
    );
  }

  if (!element) return null;

  return (
    <>
      {ReactDOM.createPortal(
        <MarkerComponent
          user={marker.user}
          onClick={handleMarkerClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          isHovered={isHovered}
          isCurrentUser={isCurrentUser}
        />,
        element
      )}
      <AnimatePresence>
        {showModal && (
          <BarberDetailModal
            barber={marker.user}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
