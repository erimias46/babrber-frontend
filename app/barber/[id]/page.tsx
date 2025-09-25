"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  Route,
  Calculator,
  Navigation,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation } from "@/lib/hooks/useLocation";
import { InteractiveMap } from "@/components/map/InteractiveMap";

export default function BarberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { coordinates: userCoordinates } = useLocation();
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { data: barber, isLoading } = useQuery({
    queryKey: ["barber", params.id],
    queryFn: () =>
      api.getBarber(params.id as string).then((res) => res.data.data),
  });

  // Portfolio images (public) for this barber
  const { data: portfolioFiles } = useQuery({
    queryKey: ["barber-portfolio", params.id],
    queryFn: async () => {
      if (!params.id) return [] as any[];
      const res = await api.getPublicFiles(params.id as string, {
        type: "portfolio",
      });
      return res.data.data || [];
    },
    enabled: !!params.id,
  });

  const {
    data: reviews,
    error: reviewsError,
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ["barber-reviews", params.id],
    queryFn: async () => {
      try {
        console.log("Fetching reviews for barber ID:", params.id);
        const res = await api.getUserReviews(params.id as string);
        console.log("Reviews API response:", res.data);
        console.log("Reviews data from API:", res.data.data);
        console.log("Reviews count from API:", res.data.data?.length);
        return res.data.data;
      } catch (error) {
        console.error("Error in reviews queryFn:", error);
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch my requests to determine review eligibility
  const { data: myRequests } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () =>
      api.getMyRequests().then((res) => {
        console.log("My requests API response:", res.data);
        return res.data.data;
      }),
    enabled: !!user,
  });

  const canWriteReview = useMemo(() => {
    if (!user || !myRequests) return false;
    // Reviews are allowed for completed or accepted bookings
    // Users can write multiple reviews for different completed requests
    return myRequests.some(
      (r: any) =>
        r.barberId?._id === params.id &&
        ["completed", "accepted"].includes(r.status)
    );
  }, [user, myRequests, params.id]);

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const createReviewMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Submitting review:", data);
      return api.createReview(data);
    },
    onSuccess: (response) => {
      console.log("Review submitted successfully:", response);
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      setSelectedRequestId("");
      queryClient.invalidateQueries({
        queryKey: ["barber-reviews", params.id],
      });
    },
    onError: (error: any) => {
      console.error("Review submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    },
  });

  const completedRequests = useMemo(() => {
    if (!myRequests) return [];
    const completed = myRequests
      .filter(
        (r: any) =>
          r.barberId?._id === params.id &&
          ["completed", "accepted"].includes(r.status)
      )
      .sort((a: any) => new Date(a.updatedAt).getTime());

    console.log("Completed requests for review:", completed);
    return completed;
  }, [myRequests, params.id]);

  const [selectedRequestId, setSelectedRequestId] = useState<string>("");

  // Debug logging - moved after all variables are declared
  useEffect(() => {
    console.log("Reviews data:", reviews);
    console.log("Can write review:", canWriteReview);
    console.log("Completed requests:", completedRequests);
  }, [reviews, canWriteReview, completedRequests]);

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => api.createRequest(data),
    onSuccess: () => {
      toast.success("Request sent successfully!");
      setShowRequestForm(false);
      setSelectedService("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const calculateDistance = (barberCoords: [number, number]) => {
    if (!userCoordinates) return null;

    const R = 6371; // Earth's radius in km
    const dLat = ((barberCoords[1] - userCoordinates[1]) * Math.PI) / 180;
    const dLon = ((barberCoords[0] - userCoordinates[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userCoordinates[1] * Math.PI) / 180) *
        Math.cos((barberCoords[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const calculateTransportationFee = (distance: number | null) => {
    if (!distance) return 5; // Base fee
    const baseFee = 5;
    const perKmFee = 2;
    return Math.max(baseFee, baseFee + distance * perKmFee);
  };

  const handleSendRequest = () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (!userCoordinates) {
      toast.error("Please enable location access");
      return;
    }

    const distance = barber.location
      ? calculateDistance(barber.location.coordinates)
      : null;
    const transportationFee = calculateTransportationFee(distance);
    const selectedServiceData = barber.services.find(
      (s: any) => String(s?._id) === String(selectedService)
    );
    const totalPrice = selectedServiceData.price + transportationFee;

    console.log("[BOOKING][CLIENT] Submitting createRequest:", {
      barberId: params.id,
      serviceId: (selectedServiceData as any)?._id || selectedService,
      scheduledTime,
      location: {
        type: "Point",
        coordinates: userCoordinates,
        address: user?.location?.address,
      },
      notes,
      distance: distance ? distance * 1000 : null,
      transportationFee,
      totalPrice,
    });
    createRequestMutation.mutate({
      barberId: params.id,
      serviceId: (selectedServiceData as any)?._id || selectedService,
      location: {
        type: "Point",
        coordinates: userCoordinates,
        address: user?.location?.address,
      },
      notes,
      distance: distance ? distance * 1000 : null, // Convert to meters
      transportationFee,
      totalPrice,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Barber not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Barber Info */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {barber.firstName} {barber.lastName}
                  </h1>
                  {barber.businessName && (
                    <p className="text-xl text-gray-600 mt-1">
                      {barber.businessName}
                    </p>
                  )}
                  <div className="flex items-center mt-2">
                    <Star className="w-5 h-5 text-yellow-400 mr-1" />
                    <span className="font-medium">
                      {barber.rating.toFixed(1)} ({barber.totalRatings} reviews)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      barber.isOnline
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        barber.isOnline ? "bg-green-400" : "bg-gray-400"
                      }`}
                    ></div>
                    {barber.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </div>

              {/* Trust badge */}
              <div className="mt-3">
                {barber.isApproved ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                    <CheckCircle className="w-4 h-4 mr-1 text-blue-600" />
                    Verified Barber
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200">
                    Pending Verification
                  </span>
                )}
              </div>

              {barber.profileDescription && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-gray-600">{barber.profileDescription}</p>
                </div>
              )}

              {barber.specialties?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.map((specialty: string) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Gallery */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Portfolio</h3>
                {!portfolioFiles || portfolioFiles.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No portfolio images yet
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolioFiles.slice(0, 9).map((file: any) => (
                      <div
                        key={file._id}
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={file.url}
                          alt={file.originalName || "Portfolio image"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {barber.services?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Services</h3>
                  <div className="space-y-3">
                    {barber.services.map((service: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-lg font-semibold">
                            <DollarSign className="w-5 h-5" />
                            {service.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Reviews */}
            <Card className="mt-8">
              <h3 className="font-semibold mb-4">Reviews</h3>

              {/* Debug info */}
              <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                <p>Debug: Reviews count: {reviews?.length || 0}</p>
                <p>Debug: Can write review: {canWriteReview ? "Yes" : "No"}</p>
                <p>Debug: Completed requests: {completedRequests.length}</p>
                <p>Debug: Selected request: {selectedRequestId || "None"}</p>
                <p>Debug: Reviews loading: {reviewsLoading ? "Yes" : "No"}</p>
                <p>Debug: Reviews error: {reviewsError ? "Yes" : "No"}</p>
                {reviews && (
                  <div>
                    <p>Debug: Reviews data structure:</p>
                    {reviews.map((review: any, index: number) => (
                      <div
                        key={index}
                        className="mt-1 p-1 bg-white rounded border"
                      >
                        <p>Review {index + 1}:</p>
                        <p>ID: {review._id}</p>
                        <p>Rating: {review.rating}</p>
                        <p>Comment: {review.comment || "NO COMMENT"}</p>
                        <p>
                          Reviewer: {review.reviewerId?.firstName}{" "}
                          {review.reviewerId?.lastName}
                        </p>
                        <p>Created: {review.createdAt}</p>
                      </div>
                    ))}
                  </div>
                )}
                {reviewsError && (
                  <p>Debug: Error details: {JSON.stringify(reviewsError)}</p>
                )}
              </div>

              {canWriteReview && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Completed Booking to Review
                    </label>
                    <select
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Choose a completed booking</option>
                      {completedRequests.map((request: any) => (
                        <option key={request._id} value={request._id}>
                          {request.serviceId?.name ||
                            request.selectedService ||
                            "Service"}{" "}
                          - {new Date(request.updatedAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        className={`mr-1 ${
                          i <= rating ? "text-yellow-500" : "text-gray-300"
                        }`}
                        onClick={() => setRating(i)}
                        aria-label={`Rate ${i}`}
                      >
                        <Star className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Write your review..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={() => {
                        if (!rating) {
                          toast.error("Please select a rating");
                          return;
                        }
                        if (!selectedRequestId) {
                          toast.error(
                            "Please select a completed booking to review"
                          );
                          return;
                        }
                        createReviewMutation.mutate({
                          requestId: selectedRequestId,
                          revieweeId: params.id,
                          rating,
                          comment,
                        });
                      }}
                      loading={createReviewMutation.isPending}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Error loading reviews</p>
                  <p className="text-sm text-gray-600">
                    Please try refreshing the page
                  </p>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">Error details</summary>
                    <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-auto">
                      {JSON.stringify(reviewsError, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No reviews yet</p>
                  {reviews && (
                    <p className="text-xs text-gray-500 mt-1">
                      Reviews array length: {reviews.length}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div
                      key={review._id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium">
                            {review.reviewerId?.firstName}{" "}
                            {review.reviewerId?.lastName}
                          </span>
                          <div className="flex items-center ml-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Always show comment field for debugging */}
                      <div className="mt-2">
                        <p className="text-gray-600">
                          <strong>Comment:</strong>{" "}
                          {review.comment || "No comment"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Comment type: {typeof review.comment}, Length:{" "}
                          {review.comment?.length || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Request Form */}
          <div>
            <Card>
              <h3 className="font-semibold mb-4">Book Service</h3>

              {!showRequestForm ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    if (
                      myRequests?.some(
                        (r: any) =>
                          r.barberId?._id === params.id &&
                          ["pending", "accepted", "rescheduled"].includes(
                            r.status
                          )
                      )
                    ) {
                      toast.error(
                        "You already have an active request with this barber"
                      );
                      return;
                    }
                    setShowRequestForm(true);
                  }}
                  disabled={
                    !barber.isOnline ||
                    myRequests?.some(
                      (r: any) =>
                        r.barberId?._id === params.id &&
                        ["pending", "accepted", "rescheduled"].includes(
                          r.status
                        )
                    )
                  }
                >
                  {barber.isOnline
                    ? myRequests?.some(
                        (r: any) =>
                          r.barberId?._id === params.id &&
                          ["pending", "accepted", "rescheduled"].includes(
                            r.status
                          )
                      )
                      ? "Request Pending"
                      : "Send Request"
                    : "Barber Offline"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Service
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="input"
                    >
                      <option value="">Choose a service</option>
                      {barber.services?.map((service: any, index: number) => (
                        <option key={index} value={service._id}>
                          {service.name} - ${service.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Breakdown */}
                  {selectedService && userCoordinates && barber.location && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Price Breakdown
                      </h4>
                      {(() => {
                        const selectedServiceData = barber.services.find(
                          (s: any) => String(s?._id) === String(selectedService)
                        );
                        const distance = calculateDistance(
                          barber.location.coordinates
                        );
                        const transportationFee =
                          calculateTransportationFee(distance);
                        const totalPrice =
                          (selectedServiceData?.price || 0) + transportationFee;

                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {selectedServiceData?.name}
                              </span>
                              <span className="font-medium">
                                $
                                {Number(
                                  selectedServiceData?.price || 0
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Transportation (
                                {distance ? distance.toFixed(1) : "0"} km)
                              </span>
                              <span className="font-medium">
                                ${transportationFee.toFixed(2)}
                              </span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                              <span>Total</span>
                              <span className="text-primary-600">
                                ${totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <Input
                    label="Notes (Optional)"
                    placeholder="Any special requests or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSendRequest}
                      loading={createRequestMutation.isPending}
                      className="flex-1"
                      disabled={!selectedService}
                    >
                      {selectedService ? "Send Request" : "Select Service"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowRequestForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Distance & Transportation Info */}
            {barber.location && userCoordinates && (
              <Card className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Location & Distance</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {barber.location.address || "Location available"}
                    </span>
                  </div>

                  {(() => {
                    const distance = calculateDistance(
                      barber.location.coordinates
                    );
                    const transportationFee =
                      calculateTransportationFee(distance);

                    return (
                      <>
                        {distance && (
                          <div className="flex items-center text-gray-600">
                            <Route className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {distance.toFixed(1)} km from your location
                            </span>
                          </div>
                        )}

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Calculator className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-900">
                                Transportation Fee
                              </span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-blue-900">
                                {transportationFee.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            Base fee: $5.00 + $
                            {distance ? (distance * 2).toFixed(2) : "0.00"} per
                            km
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {showMap && (
                  <div className="mt-4">
                    <InteractiveMap
                      center={[
                        (barber.location.coordinates[1] + userCoordinates[1]) /
                          2,
                        (barber.location.coordinates[0] + userCoordinates[0]) /
                          2,
                      ]}
                      zoom={12}
                      markers={[
                        {
                          id: "user",
                          position: [userCoordinates[1], userCoordinates[0]],
                          title: "Your Location",
                          type: "user",
                        },
                        {
                          id: "barber",
                          position: [
                            barber.location.coordinates[1],
                            barber.location.coordinates[0],
                          ],
                          title: `${barber.firstName} ${barber.lastName}`,
                          type: "barber",
                        },
                      ]}
                      height="300px"
                      className="rounded-lg border"
                    />
                  </div>
                )}
              </Card>
            )}

            {barber.location && !userCoordinates && (
              <Card className="mt-6">
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {barber.location.address || "Location available"}
                  </span>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <Navigation className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      Enable location access to see distance and transportation
                      fees
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
