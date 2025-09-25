"use client";
import { useRouter } from "next/navigation";

export default function CheckoutCancelPage() {
  const router = useRouter();
  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <div className="text-yellow-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2l-7-12a2 2 0 00-4 0L3 17a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Payment Canceled</h1>
      <p className="text-gray-600 mb-4">Your payment was canceled. You can try again anytime.</p>
      <button
        onClick={() => router.back()}
        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}

