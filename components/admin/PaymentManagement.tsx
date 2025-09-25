"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

export function PaymentManagement() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("completed");

  // Fetch all requests that might need payment release
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["admin-requests", selectedStatus],
    queryFn: () =>
      api
        .getAdminRequests({
          status: selectedStatus === "all" ? undefined : selectedStatus,
        })
        .then((res) => res.data),
  });

  const requests = requestsData?.data || [];

  const releasePaymentMutation = useMutation({
    mutationFn: (bookingId: string) => api.releasePayout(bookingId),
    onSuccess: (response, bookingId) => {
      toast.success(`Payment released successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.includes("not ready to receive transfers")) {
        toast.error(
          "Barber's Stripe account is not fully set up. They need to complete onboarding.",
          {
            duration: 6000,
          }
        );
      } else {
        toast.error(errorMessage || "Failed to release payment");
      }
    },
  });

  const refundPaymentMutation = useMutation({
    mutationFn: ({
      bookingId,
      amount,
    }: {
      bookingId: string;
      amount?: number;
    }) => api.refundBooking(bookingId, amount),
    onSuccess: () => {
      toast.success("Refund processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process refund");
    },
  });

  const getPaymentStatus = (request: any) => {
    if (request.transferId) return "released";
    if (request.status === "completed") return "ready_for_release";
    if (request.depositRequired) {
      if (request.depositPaidAmount && request.remainderPaymentIntentId)
        return "fully_paid";
      if (request.depositPaidAmount) return "deposit_paid";
      return "pending_payment";
    }
    if (request.paymentIntentId) return "fully_paid";
    return "pending_payment";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "released":
        return "text-green-600 bg-green-100";
      case "ready_for_release":
        return "text-blue-600 bg-blue-100";
      case "fully_paid":
        return "text-green-600 bg-green-100";
      case "deposit_paid":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "released":
        return "Payment Released";
      case "ready_for_release":
        return "Ready for Release";
      case "fully_paid":
        return "Fully Paid";
      case "deposit_paid":
        return "Deposit Paid Only";
      default:
        return "Pending Payment";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const filteredRequests = requests.filter((request: any) => {
    if (selectedStatus === "completed") return request.status === "completed";
    if (selectedStatus === "ready_for_release")
      return request.status === "completed" && !request.transferId;
    if (selectedStatus === "released") return request.transferId;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h2>
          <p className="text-gray-600">Manage payment releases and refunds</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input"
          >
            <option value="completed">All Completed</option>
            <option value="ready_for_release">Ready for Release</option>
            <option value="released">Already Released</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {(
                  filteredRequests.reduce(
                    (sum: number, req: any) => sum + (req.amount || 0),
                    0
                  ) / 100
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Release
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredRequests.filter(
                    (req: any) => req.status === "completed" && !req.transferId
                  ).length
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Released</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredRequests.filter((req: any) => req.transferId).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Partial Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredRequests.filter(
                    (req: any) =>
                      req.depositPaidAmount && !req.remainderPaymentIntentId
                  ).length
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Requests</h3>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => {
                const paymentStatus = getPaymentStatus(request);
                return (
                  <div
                    key={request._id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {request.barberId?.firstName}{" "}
                              {request.barberId?.lastName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              paymentStatus
                            )}`}
                          >
                            {getStatusLabel(paymentStatus)}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Total: </span>$
                            {((request.amount || 0) / 100).toFixed(2)}
                          </div>
                          {request.depositRequired && (
                            <>
                              <div>
                                <span className="font-medium">Deposit: </span>$
                                {((request.depositAmount || 0) / 100).toFixed(
                                  2
                                )}
                                {request.depositPaidAmount ? " ✓" : " ✗"}
                              </div>
                              <div>
                                <span className="font-medium">Remainder: </span>
                                $
                                {((request.remainderAmount || 0) / 100).toFixed(
                                  2
                                )}
                                {request.remainderPaymentIntentId ? " ✓" : " ✗"}
                              </div>
                            </>
                          )}
                          <div>
                            <span className="font-medium">Barber Net: </span>$
                            {((request.barberNetAmount || 0) / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {request.status === "completed" &&
                          !request.transferId && (
                            <Button
                              size="sm"
                              onClick={() =>
                                releasePaymentMutation.mutate(request._id)
                              }
                              loading={releasePaymentMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Release $
                              {((request.barberNetAmount || 0) / 100).toFixed(
                                2
                              )}
                            </Button>
                          )}

                        {(request.depositPaidAmount ||
                          request.paymentIntentId) && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              refundPaymentMutation.mutate({
                                bookingId: request._id,
                              })
                            }
                            loading={refundPaymentMutation.isPending}
                          >
                            Refund
                          </Button>
                        )}

                        {request.transferId && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Released
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
