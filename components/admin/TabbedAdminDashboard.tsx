"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AdminSettingsPanel } from "./AdminSettingsPanel";
import { PaymentManagement } from "./PaymentManagement";
import {
  BarChart2,
  Users,
  UserCheck,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  TrendingUp,
  Settings,
  Shield,
  FileText,
  MapPin,
} from "lucide-react";

interface TabbedAdminDashboardProps {
  stats: any;
  platformAnalytics: any;
  pendingBarbers: any[];
  usersData: any;
  onApproveBarber: (id: string, isApproved: boolean) => void;
  onUpdateUserStatus: (id: string, isActive: boolean) => void;
  onGenerateReports: () => void;
  isApprovingBarber: boolean;
  isUpdatingUser: boolean;
}

export function TabbedAdminDashboard({
  stats,
  platformAnalytics,
  pendingBarbers,
  usersData,
  onApproveBarber,
  onUpdateUserStatus,
  onGenerateReports,
  isApprovingBarber,
  isUpdatingUser,
}: TabbedAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart2,
      description: "Platform statistics and key metrics",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Detailed charts and insights",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage customers and barbers",
    },
    {
      id: "approvals",
      label: "Barber Approvals",
      icon: UserCheck,
      description: "Review and approve barber applications",
    },
    {
      id: "payments",
      label: "Payment Management",
      icon: Shield,
      description: "Manage payments and releases",
    },
    {
      id: "settings",
      label: "Platform Settings",
      icon: Settings,
      description: "Configure platform parameters",
    },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Modern Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Users
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.users.total || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">↗ +12% this month</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Approved Barbers
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.users.barbers.approved || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">↗ +8% this month</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Pending Approvals
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.users.barbers.pending || 0}
              </p>
              <p className="text-xs text-yellow-600 mt-1">⚠ Needs attention</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Requests
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.requests.total || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">↗ +24% this month</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2" /> Quick Actions
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Button
            onClick={onGenerateReports}
            className="h-20 flex flex-col items-center justify-center"
          >
            <TrendingUp className="w-6 h-6 mb-2" />
            Generate Weekly Reports
          </Button>
          <Button
            variant="secondary"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => setActiveTab("approvals")}
          >
            <UserCheck className="w-6 h-6 mb-2" />
            Review Pending Approvals
          </Button>
          <Button
            variant="secondary"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="w-6 h-6 mb-2" />
            Platform Settings
          </Button>
        </div>
      </Card>

      {/* Platform Statistics */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">Platform Statistics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {stats?.requests.completed || 0}
            </div>
            <p className="text-gray-600">Completed Services</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats?.users.barbers.total || 0}
            </div>
            <p className="text-gray-600">Total Barbers</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats?.reviews.total || 0}
            </div>
            <p className="text-gray-600">Total Reviews</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart2 className="w-5 h-5 mr-2" /> Platform Analytics
          </h2>
          <Button size="sm" onClick={onGenerateReports}>
            <TrendingUp className="w-4 h-4 mr-2" /> Generate Weekly Reports
          </Button>
        </div>
        <AnalyticsCharts platformAnalytics={platformAnalytics} />
      </Card>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-6">Recent Users</h2>
        <div className="space-y-4">
          {usersData?.users?.map((user: any) => (
            <div key={user._id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">
                      {user.firstName} {user.lastName}
                    </h3>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "barber"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {user.role !== "admin" && (
                  <Button
                    size="sm"
                    variant={user.isActive ? "danger" : "primary"}
                    onClick={() => onUpdateUserStatus(user._id, !user.isActive)}
                    loading={isUpdatingUser}
                  >
                    {user.isActive ? "Ban" : "Unban"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderApprovalsTab = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-6">Pending Barber Approvals</h2>

        {pendingBarbers?.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending approvals
            </h3>
            <p className="text-gray-600">
              All barber applications have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBarbers?.map((barber: any) => (
              <div key={barber._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {barber.firstName} {barber.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{barber.email}</p>
                    {barber.businessName && (
                      <p className="text-sm text-gray-600">
                        {barber.businessName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Applied: {new Date(barber.createdAt).toLocaleDateString()}
                    </p>

                    {barber.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {barber.specialties.map((specialty: string) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => onApproveBarber(barber._id, true)}
                      loading={isApprovingBarber}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onApproveBarber(barber._id, false)}
                      loading={isApprovingBarber}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <AdminSettingsPanel />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "analytics":
        return renderAnalyticsTab();
      case "users":
        return renderUsersTab();
      case "approvals":
        return renderApprovalsTab();
      case "payments":
        return <PaymentManagement />;
      case "settings":
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-600">
          {tabs.find((tab) => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">{renderTabContent()}</div>
    </div>
  );
}
