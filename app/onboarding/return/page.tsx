"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

export default function OnboardingReturnPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true);

        // Check Stripe account status to see if onboarding is complete
        const response = await api.getStripeAccountStatus();
        const statusData = response.data.data;

        console.log("Stripe account status:", statusData);

        if (statusData.hasAccount && statusData.canReceiveTransfers) {
          setIsSuccess(true);
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.push("/profile");
          }, 3000);
        } else if (statusData.hasAccount && !statusData.canReceiveTransfers) {
          setError(
            "Account created but onboarding incomplete. Please complete all required steps in Stripe."
          );
        } else {
          setError("Stripe account not found. Please try onboarding again.");
        }
      } catch (err: any) {
        console.error("Onboarding status check error:", err);
        setError(
          "Failed to verify onboarding status. Please check your connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2">Verifying Onboarding</h1>
        <p className="text-gray-600">
          Please wait while we verify your Stripe account...
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="text-green-600 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Onboarding Complete!</h1>
        <p className="text-gray-600 mb-4">
          Your Stripe account has been successfully connected. You can now
          receive payments for your services.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to your profile in a few seconds...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Onboarding Issue</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push("/profile")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
        >
          Return to Profile
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
