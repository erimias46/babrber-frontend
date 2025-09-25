"use client";
import { SnapchatStyleMap } from "@/components/map/SnapchatStyleMap";
import { Navbar } from "@/components/layout/Navbar";

// Mock user and barbers for testing
const mockUser = {
  _id: "test-user-1",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  role: "user",
  email: "test@example.com",
  isOnline: true,
  avatar: null,
  profilePicture: null,
  services: [],
  location: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockBarbers = [
  {
    _id: "barber-1",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    role: "barber",
    email: "john@barbershop.com",
    isOnline: true,
    avatar: null,
    profilePicture: null,
    services: [
      { name: "Haircut", price: 25, duration: 30 },
      { name: "Beard Trim", price: 15, duration: 15 },
    ],
    location: {
      type: "Point",
      coordinates: [-74.006, 40.7128],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "barber-2",
    firstName: "Mike",
    lastName: "Smith",
    name: "Mike Smith",
    role: "barber",
    email: "mike@barbershop.com",
    isOnline: true,
    avatar: null,
    profilePicture: null,
    services: [
      { name: "Haircut", price: 30, duration: 45 },
      { name: "Full Service", price: 45, duration: 60 },
    ],
    location: {
      type: "Point",
      coordinates: [-74.01, 40.715],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "barber-3",
    firstName: "Alex",
    lastName: "Johnson",
    name: "Alex Johnson",
    role: "barber",
    email: "alex@barbershop.com",
    isOnline: false,
    avatar: null,
    profilePicture: null,
    services: [{ name: "Haircut", price: 20, duration: 25 }],
    location: {
      type: "Point",
      coordinates: [-74.008, 40.71],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function MapTestPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      <div className="absolute top-0 left-0 right-0 z-10">
        <Navbar />
      </div>
      <div className="pt-20 h-full w-full">
        <SnapchatStyleMap
          userLocation={[-74.005, 40.713]}
          barbers={mockBarbers}
          currentUser={mockUser}
        />
      </div>
    </div>
  );
}
