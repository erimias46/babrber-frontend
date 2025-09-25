"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

export default function OnboardingRefreshPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const refreshOnboarding = async () => {
      try {
        setIsLoading(true);
        const response = await api.connectOnboard();
        const url = response.data?.url;

        if (url) {
          // Redirect to Stripe onboarding
          window.location.href = url;
        } else {
          setError("Failed to get onboarding URL");
        }
      } catch (err: any) {
        console.error("Onboarding refresh error:", err);
        setError(err.response?.data?.message || "Failed to refresh onboarding");
      } finally {
        setIsLoading(false);
      }
    };

    refreshOnboarding();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2">Refreshing Onboarding</h1>
        <p className="text-gray-600">
          Please wait while we set up your Stripe account...
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
        <h1 className="text-2xl font-semibold mb-2">Onboarding Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push("/profile")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return null;
}



