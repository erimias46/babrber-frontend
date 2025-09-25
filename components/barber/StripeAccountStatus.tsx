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
    <Card className={`p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">
              Stripe Account Status
            </h3>
            <p className="text-sm text-gray-600">{statusData?.message}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {statusData?.hasAccount && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Details Submitted:</span>
              <span
                className={`ml-2 font-medium ${
                  statusData.detailsSubmitted
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {statusData.detailsSubmitted ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Charges Enabled:</span>
              <span
                className={`ml-2 font-medium ${
                  statusData.chargesEnabled ? "text-green-600" : "text-red-600"
                }`}
              >
                {statusData.chargesEnabled ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Payouts Enabled:</span>
              <span
                className={`ml-2 font-medium ${
                  statusData.payoutsEnabled ? "text-green-600" : "text-red-600"
                }`}
              >
                {statusData.payoutsEnabled ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Can Receive Transfers:</span>
              <span
                className={`ml-2 font-medium ${
                  statusData.canReceiveTransfers
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {statusData.canReceiveTransfers ? "✓" : "✗"}
              </span>
            </div>
          </div>

          {statusData.capabilities && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Account Capabilities:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(statusData.capabilities).map(
                  ([capability, status]) => (
                    <div key={capability} className="flex justify-between">
                      <span className="text-gray-600">{capability}:</span>
                      <span
                        className={`font-medium ${
                          status === "active"
                            ? "text-green-600"
                            : status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {status as string}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-3">
        {!statusData?.hasAccount || statusData?.needsOnboarding ? (
          <Button
            onClick={() => onboardMutation.mutate()}
            loading={onboardMutation.isPending}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>
              {statusData?.hasAccount
                ? "Complete Onboarding"
                : "Start Onboarding"}
            </span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Ready to receive payments!
            </span>
          </div>
        )}
      </div>

      {!statusData?.canReceiveTransfers && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Action Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your Stripe account needs to be fully set up to receive
                payments. Complete the onboarding process to enable payment
                releases.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
