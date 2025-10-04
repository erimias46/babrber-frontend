"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, apiClient, API_ORIGIN } from "@/lib/api/client";

const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  const normalized = url.replace("/api/files/uploads", "/uploads");
  return normalized.startsWith("http")
    ? normalized
    : `${API_ORIGIN}${normalized}`;
};
import {
  User,
  MapPin,
  Briefcase,
  Plus,
  Trash2,
  Navigation,
  Settings,
  DollarSign,
  Route,
  Calculator,
  Image,
} from "lucide-react";
import toast from "react-hot-toast";
import { LocationPicker } from "@/components/map/LocationPicker";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { useLocation } from "@/lib/hooks/useLocation";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { coordinates } = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    businessName: user?.businessName || "",
    profileDescription: user?.profileDescription || "",
    specialties: user?.specialties || [],
    services: user?.services || [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => {
      if (user?.role === "barber") {
        return api.updateBarberProfile(data);
      }
      return api.updateProfile(data);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: (data: { coordinates: [number, number]; address?: string }) =>
      api.updateLocation(data),
    onSuccess: (response) => {
      // Update user context with the latest location data from API response
      const updatedUser = response.data.data;
      updateUser(updatedUser);

      toast.success("Location updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowLocationPicker(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update location");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSpecialtyAdd = () => {
    setFormData((prev) => ({
      ...prev,
      specialties: [...prev.specialties, ""],
    }));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.map((s, i) => (i === index ? value : s)),
    }));
  };

  const handleSpecialtyRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const handleServiceAdd = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { name: "", description: "", price: 0, duration: 30 },
      ],
    }));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleServiceRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleLocationSelect = (location: {
    coordinates: [number, number];
    address?: string;
  }) => {
    updateLocationMutation.mutate(location);
  };

  // Portfolio management (barber only)
  const { data: myPortfolio } = useQuery({
    queryKey: ["my-portfolio"],
    queryFn: async () => {
      if (!user || user.role !== "barber") return [] as any[];
      const res = await api.getMyFiles({ type: "portfolio" });
      return res.data.data?.files || [];
    },
    enabled: !!user && user.role === "barber",
  });

  const uploadPortfolioMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      console.log("Uploading files:", files.length, "files");
      const formData = new FormData();
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      fileArray.forEach((f, index) => {
        console.log(`Adding file ${index}:`, f.name, f.type, f.size);
        formData.append("portfolio", f);
      });

      // Log FormData contents
      const entries = Array.from(formData.entries());
      entries.forEach(([key, value]) => {
        console.log("FormData entry:", key, value);
      });

      return api.uploadPortfolio(formData);
    },
    onSuccess: () => {
      toast.success("Portfolio uploaded");
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Upload failed");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => api.deleteFile(id),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Delete failed");
    },
  });

  // Documents management (barber only)
  const { data: myDocuments } = useQuery({
    queryKey: ["my-documents"],
    queryFn: async () => {
      if (!user || user.role !== "barber") return [] as any[];
      const res = await api.getMyFiles({ type: "document" });
      return res.data.data?.files || [];
    },
    enabled: !!user && user.role === "barber",
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("documents", f));
      return api.uploadDocuments(formData);
    },
    onSuccess: () => {
      toast.success("Documents uploaded");
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Upload failed");
    },
  });

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        businessName: user.businessName || "",
        profileDescription: user.profileDescription || "",
        specialties: user.specialties || [],
        services: user.services || [],
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your account information
          </p>
        </div>

        {/* Responsive tabs with horizontal scroll on mobile */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === "personal"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm sm:text-base">Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab("location")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === "location"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm sm:text-base">Location</span>
          </button>

          {user?.role === "barber" && (
            <button
              onClick={() => setActiveTab("business")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === "business"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-sm sm:text-base">Business Info</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === "personal" && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />

                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mt-4 sm:mt-6 text-center py-6 sm:py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Image className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-xs sm:text-sm">
                  Avatar upload temporarily disabled
                </p>
              </div>

              <div className="mt-4 sm:mt-6">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "location" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Location Management */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Location Settings
                  </h2>
                  <Button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="flex items-center w-full sm:w-auto text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" /> Update Location
                  </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {user?.location ? (
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-green-900 text-sm sm:text-base">
                            Current Location
                          </h3>
                          <p className="text-xs sm:text-sm text-green-700 mt-1 break-words">
                            {user?.location.address ||
                              `${user?.location.coordinates[1].toFixed(
                                6
                              )}, ${user?.location.coordinates[0].toFixed(6)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Navigation className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-yellow-900 text-sm sm:text-base">
                            No Location Set
                          </h3>
                          <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                            {user?.role === "barber"
                              ? "Set your location to receive nearby customer requests"
                              : "Set your location to find nearby barbers and get accurate transportation fees"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <h3 className="font-medium text-sm sm:text-base">
                      Location Map
                    </h3>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                      className="w-full sm:w-auto text-sm"
                    >
                      {showMap ? "Hide Map" : "Show Map"}
                    </Button>
                  </div>

                  {showMap && user?.location && (
                    <InteractiveMap
                      center={[
                        user?.location.coordinates[1],
                        user?.location.coordinates[0],
                      ]}
                      markers={[
                        {
                          id: "user",
                          position: [
                            user?.location.coordinates[1],
                            user?.location.coordinates[0],
                          ],
                          title: "Your Location",
                          type: user?.role === "barber" ? "barber" : "user",
                        },
                      ]}
                      height="400px"
                      className="rounded-lg border"
                    />
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "business" && user?.role === "barber" && (
            <div className="space-y-4 sm:space-y-8">
              {/* Business Info */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                  Business Information
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  <Input
                    label="Business Name (Optional)"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Description
                    </label>
                    <textarea
                      name="profileDescription"
                      value={formData.profileDescription}
                      onChange={handleInputChange}
                      rows={4}
                      className="input"
                      placeholder="Tell customers about yourself and your experience..."
                    />
                  </div>

                  {/* Stripe Connect */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Stripe Connect</h3>
                        <p className="text-sm text-gray-600">
                          {user?.stripeAccountId
                            ? `Connected: ${user?.stripeAccountId}`
                            : "Not connected"}
                        </p>
                      </div>
                      {!user?.stripeAccountId && (
                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await api.connectOnboard();
                              const url = res.data?.url;
                              if (url) {
                                window.location.href = url;
                              } else {
                                alert("Failed to get Stripe onboarding URL");
                              }
                            } catch (error: any) {
                              console.error("Stripe onboarding error:", error);
                              alert(
                                error.response?.data?.message ||
                                  "Failed to connect with Stripe"
                              );
                            }
                          }}
                        >
                          Connect with Stripe
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Deposit Settings */}
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-medium text-sm sm:text-base mb-3">
                      Deposit Settings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Require Deposit
                        </label>
                        <select
                          className="input"
                          value={(formData as any).requireDeposit ?? "inherit"}
                          onChange={(e) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              requireDeposit:
                                e.target.value === "inherit"
                                  ? undefined
                                  : e.target.value === "true",
                            }))
                          }
                        >
                          <option value="inherit">Inherit from admin</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deposit Type
                        </label>
                        <select
                          className="input"
                          value={(formData as any).depositType ?? "inherit"}
                          onChange={(e) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              depositType:
                                e.target.value === "inherit"
                                  ? undefined
                                  : (e.target.value as any),
                            }))
                          }
                        >
                          <option value="inherit">Inherit</option>
                          <option value="percent">Percent</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deposit Value
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={(formData as any).depositValue ?? ""}
                          onChange={(e) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              depositValue:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            }))
                          }
                          placeholder="e.g., 20 or 2500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percent (e.g., 20) or cents if fixed (e.g., 2500 =
                          $25)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* File uploads for barbers */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
                  <Image className="w-5 h-5 mr-2" /> Portfolio & Documents
                </h2>
                {/* Portfolio Upload */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Upload up to a few images showcasing your work
                      </p>
                    </div>
                    <label className="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md cursor-pointer text-sm w-full sm:w-auto justify-center whitespace-nowrap">
                      <Plus className="w-4 h-4 mr-2" /> Upload Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            uploadPortfolioMutation.mutate(files);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Portfolio Grid */}
                  {!myPortfolio || myPortfolio.length === 0 ? (
                    <div className="text-xs sm:text-sm text-gray-500 py-6 text-center">
                      No portfolio images yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {myPortfolio.map((file: any) => (
                        <div
                          key={file._id}
                          className="group relative aspect-square rounded-lg overflow-hidden border"
                        >
                          <img
                            src={resolveImageUrl(file.url)}
                            alt={file.originalName || "Portfolio image"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              const fallback = resolveImageUrl(file.url);
                              if (el.src !== fallback) el.src = fallback;
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => deleteFileMutation.mutate(file._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white/90 hover:bg-white text-gray-800 rounded-full p-1 shadow"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents Upload */}
                <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
                        Verification Documents
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Upload your license, certification, or ID for
                        verification
                      </p>
                    </div>
                    <label className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md cursor-pointer text-sm w-full sm:w-auto justify-center whitespace-nowrap">
                      <Plus className="w-4 h-4 mr-2" /> Upload Documents
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            uploadDocumentsMutation.mutate(e.target.files);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Documents List */}
                  {!myDocuments || myDocuments.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6 text-center">
                      No verification documents uploaded yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myDocuments.map((file: any) => (
                        <div
                          key={file._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {file.mimetype.includes("pdf") ? (
                                <span className="text-blue-600 font-bold text-sm">
                                  PDF
                                </span>
                              ) : file.mimetype.includes("doc") ? (
                                <span className="text-blue-600 font-bold text-sm">
                                  DOC
                                </span>
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  IMG
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                deleteFileMutation.mutate(file._id)
                              }
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Specialties */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Specialties
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSpecialtyAdd}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Specialty
                  </Button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {formData.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={specialty}
                        onChange={(e) =>
                          handleSpecialtyChange(index, e.target.value)
                        }
                        placeholder="e.g., Beard trimming, Hair coloring"
                      />
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleSpecialtyRemove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Services */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Services & Pricing
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleServiceAdd}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Service
                  </Button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {formData.services.map((service, index) => (
                    <div key={index} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="font-medium text-sm sm:text-base">
                          Service {index + 1}
                        </h3>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleServiceRemove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input
                          label="Service Name"
                          value={service.name}
                          onChange={(e) =>
                            handleServiceChange(index, "name", e.target.value)
                          }
                          placeholder="e.g., Haircut & Style"
                        />

                        <Input
                          label="Price ($)"
                          type="number"
                          value={service.price}
                          onChange={(e) =>
                            handleServiceChange(
                              index,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          min="0"
                          step="0.01"
                        />

                        <Input
                          label="Duration (minutes)"
                          type="number"
                          value={service.duration}
                          onChange={(e) =>
                            handleServiceChange(
                              index,
                              "duration",
                              Number(e.target.value)
                            )
                          }
                          min="15"
                          step="15"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={service.description}
                          onChange={(e) =>
                            handleServiceChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="input"
                          placeholder="Describe what's included in this service..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-center sm:justify-end">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Save All Changes
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Debug Section */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Debug Information
          </h4>
          <div className="text-xs text-gray-600 space-y-1 sm:space-y-2">
            <div className="truncate">
              API Base URL:{" "}
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
            </div>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div className="truncate">
              Timestamp: {new Date().toISOString()}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={async () => {
                  try {
                    console.log("🧪 Testing Stripe connection...");
                    const testRes = await apiClient.get("/stripe/test");
                    const testData = testRes.data; // Fix: use .data for axios response
                    console.log("🧪 Stripe test result:", testData);
                    alert(
                      `Stripe test: ${
                        testData.success ? "SUCCESS" : "FAILED"
                      }\n${testData.message}`
                    );
                  } catch (err) {
                    console.error("🧪 Stripe test failed:", err);
                    alert("Stripe test failed. Check console for details.");
                  }
                }}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Test Stripe Connection
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log("🔍 Testing API endpoint reachability...");
                    const testRes = await fetch(
                      "http://localhost:5000/api/health"
                    );
                    const testData = await testRes.json();
                    console.log("🔍 Health check result:", testData);
                    alert(`Health check: ${testData.status}`);
                  } catch (err) {
                    console.error("🔍 Health check failed:", err);
                    alert("Health check failed. Backend might be down.");
                  }
                }}
                className="text-green-600 hover:text-green-800 underline text-xs"
              >
                Test Backend Health
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log("🔌 Testing connect/onboard endpoint...");
                    const testRes = await fetch(
                      "http://localhost:5000/api/connect/onboard",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      }
                    );
                    const testData = await testRes.json();
                    console.log("🔌 Connect/onboard test result:", testData);
                    alert(
                      `Connect/onboard test: ${
                        testData.success ? "SUCCESS" : "FAILED"
                      }\n${testData.message || "No message"}`
                    );
                  } catch (err) {
                    console.error("🔌 Connect/onboard test failed:", err);
                    alert(
                      "Connect/onboard test failed. Check console for details."
                    );
                  }
                }}
                className="text-purple-600 hover:text-purple-800 underline text-xs"
              >
                Test Connect Endpoint
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
          initialLocation={
            user?.location
              ? [user?.location.coordinates[1], user?.location.coordinates[0]]
              : coordinates
              ? [coordinates[1], coordinates[0]]
              : undefined
          }
          title={`Set Your ${
            user?.role === "barber" ? "Business" : ""
          } Location`}
        />
      )}
    </div>
  );
}
