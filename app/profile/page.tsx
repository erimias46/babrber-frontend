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
  const [showMap, setShowMap] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return api.uploadAvatar(formData);
    },
    onSuccess: () => {
      toast.success("Avatar updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Refresh user data
      api.getProfile().then((res) => {
        updateUser(res.data.data);
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Upload
      uploadAvatarMutation.mutate(file);
    }
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
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Navbar />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-[#111111]">
            Profile Settings
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">
            Manage your account information
          </p>
        </div>

        {/* Responsive tabs with horizontal scroll on mobile */}
        <div className="flex gap-2 mb-4 sm:mb-6 lg:mb-8 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all border-2 ${
              activeTab === "personal"
                ? "bg-[#FF5A1F] text-white border-[#FF5A1F]"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm sm:text-base">Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab("location")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all border-2 ${
              activeTab === "location"
                ? "bg-[#FF5A1F] text-white border-[#FF5A1F]"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm sm:text-base">Location</span>
          </button>

          {user?.role === "barber" && (
            <button
              onClick={() => setActiveTab("business")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all border-2 ${
                activeTab === "business"
                  ? "bg-[#FF5A1F] text-white border-[#FF5A1F]"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-sm sm:text-base">Business Info</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === "personal" && (
            <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-[#111111] mb-4 sm:mb-6">
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

              {/* Avatar Upload */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm font-semibold text-[#111111] mb-2">
                  Profile Picture
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Display */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[#FF5A1F]/10 border-4 border-[#FF5A1F]/20 flex items-center justify-center shadow-lg">
                      {avatarPreview || user?.avatar ? (
                        <img
                          src={avatarPreview || resolveImageUrl(user?.avatar)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                <span class="text-3xl sm:text-4xl text-gray-500 font-bold">
                                  ${user?.firstName?.[0] || "?"}${
                              user?.lastName?.[0] || ""
                            }
                                </span>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="text-3xl sm:text-4xl text-gray-400 font-bold">
                          {user?.firstName?.[0] || "?"}
                          {user?.lastName?.[0] || ""}
                        </div>
                      )}
                    </div>
                    {uploadAvatarMutation.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <label className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF5A1F] hover:bg-[#E54D1A] text-white rounded-xl cursor-pointer transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                      <User className="w-4 h-4 mr-2" />
                      {uploadAvatarMutation.isPending
                        ? "Uploading..."
                        : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadAvatarMutation.isPending}
                      />
                    </label>
                    <p className="text-xs text-gray-600 font-medium">
                      JPG, PNG or GIF (max 10MB)
                    </p>
                  </div>
                </div>
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
              <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
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
                    <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-green-900 text-sm sm:text-base">
                            Current Location
                          </h3>
                          <p className="text-xs sm:text-sm text-green-700 mt-1 break-words font-medium">
                            {user?.location.address ||
                              `${user?.location.coordinates[1].toFixed(
                                6
                              )}, ${user?.location.coordinates[0].toFixed(6)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl border-2 border-yellow-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Navigation className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-yellow-900 text-sm sm:text-base">
                            No Location Set
                          </h3>
                          <p className="text-xs sm:text-sm text-yellow-700 mt-1 font-medium">
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
                    <div className="w-full h-[300px] sm:h-[400px]">
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
                        height="100%"
                        className="rounded-lg border w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "business" && user?.role === "barber" && (
            <div className="space-y-4 sm:space-y-8">
              {/* Business Info */}
              <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-[#111111] mb-4 sm:mb-6">
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
                      className="input w-full resize-y"
                      placeholder="Tell customers about yourself and your experience..."
                    />
                  </div>

                  {/* Stripe Connect */}
                  <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-[#111111]">
                          Stripe Connect
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 break-words font-medium">
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
                          className="w-full sm:w-auto whitespace-nowrap"
                        >
                          Connect with Stripe
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Deposit Settings */}
                  <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50">
                    <h3 className="font-semibold text-sm sm:text-base mb-3 text-[#111111]">
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
              <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-[#111111] mb-4 sm:mb-6 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-[#FF5A1F]" /> Portfolio &
                  Documents
                </h2>
                {/* Portfolio Upload */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Upload up to a few images showcasing your work
                      </p>
                    </div>
                    <label className="inline-flex items-center px-3 py-2.5 bg-[#FF5A1F] hover:bg-[#E54D1A] text-white rounded-xl cursor-pointer text-sm font-semibold w-full sm:w-auto justify-center whitespace-nowrap shadow-md transition-all">
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
                          className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow"
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
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
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
                <div className="mt-6 sm:mt-8 pt-6 border-t-2 border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                        Verification Documents
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Upload your license, certification, or ID for
                        verification
                      </p>
                    </div>
                    <label className="inline-flex items-center px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl cursor-pointer text-sm font-semibold w-full sm:w-auto justify-center whitespace-nowrap shadow-md transition-all">
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow gap-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-[#FF5A1F]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#FF5A1F]/20">
                              {file.mimetype.includes("pdf") ? (
                                <span className="text-[#FF5A1F] font-bold text-xs">
                                  PDF
                                </span>
                              ) : file.mimetype.includes("doc") ? (
                                <span className="text-[#FF5A1F] font-bold text-xs">
                                  DOC
                                </span>
                              ) : (
                                <span className="text-[#FF5A1F] font-bold text-xs">
                                  IMG
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#111111] truncate">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-gray-600 font-medium">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF5A1F] hover:text-[#E54D1A] text-sm font-semibold whitespace-nowrap"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                deleteFileMutation.mutate(file._id)
                              }
                              className="text-red-600 hover:text-red-700 text-sm font-semibold whitespace-nowrap"
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
              <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
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
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <Input
                          value={specialty}
                          onChange={(e) =>
                            handleSpecialtyChange(index, e.target.value)
                          }
                          placeholder="e.g., Beard trimming, Hair coloring"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleSpecialtyRemove(index)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Services */}
              <Card className="p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
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
                    <div
                      key={index}
                      className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="font-semibold text-sm sm:text-base text-[#111111]">
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
                          className="input w-full resize-y"
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
