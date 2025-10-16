"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export function StripeAccountStatus() {
  const queryClient = useQueryClient();

  const {
    data: statusData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["stripe-account-status"],
    queryFn: () => api.getStripeAccountStatus().then((res) => res.data.data),
  });

  const onboardMutation = useMutation({
    mutationFn: () => api.connectOnboard(),
    onSuccess: (response) => {
      if (response.data.url) {
        window.open(response.data.url, "_blank");
        toast.success("Opening Stripe onboarding...");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to start onboarding"
      );
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!statusData?.hasAccount)
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (!statusData?.canReceiveTransfers)
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!statusData?.hasAccount) return "border-red-200 bg-red-50";
    if (!statusData?.canReceiveTransfers)
      return "border-yellow-200 bg-yellow-50";
    return "border-green-200 bg-green-50";
  };

  return (
    <Card className={`p-4 sm:p-6 ${getStatusColor()}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-gray-900">
              Payment Account
            </h3>
            <p className="text-sm text-gray-600">{statusData?.message}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          className="flex items-center space-x-1 w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!statusData?.hasAccount || statusData?.needsOnboarding ? (
          <>
            <Button
              onClick={() => onboardMutation.mutate()}
              loading={onboardMutation.isPending}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {statusData?.hasAccount
                  ? "Complete Onboarding"
                  : "Start Onboarding"}
              </span>
            </Button>
            {!statusData?.canReceiveTransfers && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-yellow-800">
                    Action Required
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Complete the onboarding process to receive payments.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 border border-green-200 rounded-lg w-full">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Ready to receive payments!
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
