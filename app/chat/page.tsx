"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChatListModal } from "@/components/chat/ChatListModal";
import { Navbar } from "@/components/layout/Navbar";

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const barberId = searchParams.get("barberId");
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  useEffect(() => {
    // If a barberId is provided, set it as the open chat (if a chat exists)
    if (barberId) {
      setOpenChatId(barberId);
    }
  }, [barberId]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Navbar />
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please log in to access chat
          </h2>
          <button
            className="mt-4 px-6 py-2 rounded bg-blue-600 text-white font-semibold"
            onClick={() => router.push("/auth/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Determine dashboard route based on user role
  const dashboardRoute = user.role === "barber" ? "/barber" : "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-2xl">
          <ChatListModal
            onClose={() => router.push(dashboardRoute)}
            openChatId={openChatId}
          />
        </div>
      </main>
    </div>
  );
}
