"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  const search = useSearchParams();
  const sessionId = search.get("session_id");
  const router = useRouter();

  useEffect(() => {
    // Optionally, we could poll backend for confirmation using sessionId
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <div className="text-green-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Payment Successful</h1>
      <p className="text-gray-600 mb-4">Thank you! Your payment has been processed.</p>
      {sessionId && (
        <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
      )}
      <button
        onClick={() => router.push("/")}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-6"
      >
        Return Home
      </button>
    </div>
  );
}

