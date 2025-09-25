"use client";
import { SnapchatStyleMap } from "@/components/map/SnapchatStyleMap";
import { Navbar } from "@/components/layout/Navbar";

// Mock user and barbers for testing
const mockUser = {
  _id: "test-user-1",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  role: "user" as const,
  email: "test@example.com",
  password: "hashedpassword",
  phone: "+1234567890",
  isOnline: true,
  avatar: undefined,
  profilePicture: undefined,
  services: [],
  location: undefined,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBarbers = [
  {
    _id: "barber-1",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    role: "barber" as const,
    email: "john@barbershop.com",
    password: "hashedpassword",
    phone: "+1234567890",
    isOnline: true,
    avatar: undefined,
    profilePicture: undefined,
    businessName: "John's Barbershop",
    specialties: ["Haircuts", "Beard Trimming", "Styling"],
    services: [
      {
        name: "Haircut",
        description: "Professional haircut",
        price: 25,
        duration: 30,
      },
      {
        name: "Beard Trim",
        description: "Beard trimming and shaping",
        price: 15,
        duration: 15,
      },
    ],
    workingHours: {
      monday: { isOpen: true, start: "09:00", end: "18:00" },
      tuesday: { isOpen: true, start: "09:00", end: "18:00" },
      wednesday: { isOpen: true, start: "09:00", end: "18:00" },
      thursday: { isOpen: true, start: "09:00", end: "18:00" },
      friday: { isOpen: true, start: "09:00", end: "18:00" },
      saturday: { isOpen: true, start: "10:00", end: "16:00" },
      sunday: { isOpen: false },
    },
    isApproved: true,
    documents: [],
    rating: 4.5,
    totalRatings: 23,
    profileDescription: "Professional barber with 5 years of experience",
    isActive: true,
    location: {
      type: "Point" as const,
      coordinates: [-74.006, 40.7128] as [number, number],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "barber-2",
    firstName: "Mike",
    lastName: "Smith",
    name: "Mike Smith",
    role: "barber" as const,
    email: "mike@barbershop.com",
    password: "hashedpassword",
    phone: "+1234567891",
    isOnline: true,
    avatar: undefined,
    profilePicture: undefined,
    businessName: "Mike's Cuts",
    specialties: ["Haircuts", "Full Service", "Styling"],
    services: [
      {
        name: "Haircut",
        description: "Professional haircut",
        price: 30,
        duration: 45,
      },
      {
        name: "Full Service",
        description: "Haircut and styling",
        price: 45,
        duration: 60,
      },
    ],
    workingHours: {
      monday: { isOpen: true, start: "08:00", end: "19:00" },
      tuesday: { isOpen: true, start: "08:00", end: "19:00" },
      wednesday: { isOpen: true, start: "08:00", end: "19:00" },
      thursday: { isOpen: true, start: "08:00", end: "19:00" },
      friday: { isOpen: true, start: "08:00", end: "19:00" },
      saturday: { isOpen: true, start: "09:00", end: "17:00" },
      sunday: { isOpen: false },
    },
    isApproved: true,
    documents: [],
    rating: 4.8,
    totalRatings: 45,
    profileDescription: "Experienced barber specializing in modern cuts",
    isActive: true,
    location: {
      type: "Point" as const,
      coordinates: [-74.01, 40.715] as [number, number],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "barber-3",
    firstName: "Alex",
    lastName: "Johnson",
    name: "Alex Johnson",
    role: "barber" as const,
    email: "alex@barbershop.com",
    password: "hashedpassword",
    phone: "+1234567892",
    isOnline: false,
    avatar: undefined,
    profilePicture: undefined,
    businessName: "Alex's Barber Studio",
    specialties: ["Haircuts", "Classic Styles"],
    services: [
      {
        name: "Haircut",
        description: "Classic haircut",
        price: 20,
        duration: 25,
      },
    ],
    workingHours: {
      monday: { isOpen: true, start: "10:00", end: "17:00" },
      tuesday: { isOpen: true, start: "10:00", end: "17:00" },
      wednesday: { isOpen: true, start: "10:00", end: "17:00" },
      thursday: { isOpen: true, start: "10:00", end: "17:00" },
      friday: { isOpen: true, start: "10:00", end: "17:00" },
      saturday: { isOpen: false },
      sunday: { isOpen: false },
    },
    isApproved: false,
    documents: [],
    rating: 4.2,
    totalRatings: 12,
    profileDescription: "Traditional barber with classic techniques",
    isActive: true,
    location: {
      type: "Point" as const,
      coordinates: [-74.008, 40.71] as [number, number],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
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
