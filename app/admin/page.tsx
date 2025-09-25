"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { TabbedAdminDashboard } from "@/components/admin/TabbedAdminDashboard";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getStats().then((res) => res.data.data),
  });

  const { data: platformAnalytics } = useQuery({
    queryKey: ["platform-analytics"],
    queryFn: () => api.getPlatformAnalytics().then((res) => res.data.data),
  });

  const { data: pendingBarbers } = useQuery({
    queryKey: ["pending-barbers"],
    queryFn: () => api.getPendingBarbers().then((res) => res.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () =>
      api.getUsers({ page: 1, limit: 10 }).then((res) => res.data.data),
  });

  const approveBarberMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      api.approveBarber(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-barbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Barber status updated successfully");
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated successfully");
    },
  });

  const handleGenerateReports = () => {
    api
      .generateWeeklyReports()
      .then(() => toast.success("Weekly reports triggered"))
      .catch(() => toast.error("Failed to generate reports"));
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="card text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              This page is only accessible to administrators
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Manage users, barbers, and platform statistics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="badge badge-error">👑 Administrator</div>
              <div className="text-sm text-gray-500">
                Welcome back, {user.firstName}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Dashboard */}
        <TabbedAdminDashboard
          stats={stats}
          platformAnalytics={platformAnalytics}
          pendingBarbers={pendingBarbers}
          usersData={usersData}
          onApproveBarber={(id, isApproved) =>
            approveBarberMutation.mutate({ id, isApproved })
          }
          onUpdateUserStatus={(id, isActive) =>
            updateUserStatusMutation.mutate({ id, isActive })
          }
          onGenerateReports={handleGenerateReports}
          isApprovingBarber={approveBarberMutation.isPending}
          isUpdatingUser={updateUserStatusMutation.isPending}
        />
      </main>
    </div>
  );
}
