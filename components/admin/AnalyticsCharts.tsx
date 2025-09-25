"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Card } from "@/components/ui/Card";
import { TrendingUp, Users, DollarSign, Star, MapPin } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsChartsProps {
  platformAnalytics: any;
}

export function AnalyticsCharts({ platformAnalytics }: AnalyticsChartsProps) {
  if (!platformAnalytics) return null;

  // User Growth Chart
  const userGrowthData = {
    labels: platformAnalytics.userGrowth?.map((item: any) => item.month) || [],
    datasets: [
      {
        label: "Total Users",
        data:
          platformAnalytics.userGrowth?.map((item: any) => item.count) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Request Trends Chart
  const requestTrendsData = {
    labels:
      platformAnalytics.requestTrends?.map((item: any) => item.month) || [],
    datasets: [
      {
        label: "Total Requests",
        data:
          platformAnalytics.requestTrends?.map((item: any) => item.count) || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Completed Requests",
        data:
          platformAnalytics.requestTrends?.map((item: any) => item.completed) ||
          [],
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Revenue Chart
  const revenueData = {
    labels:
      platformAnalytics.revenueTrends?.map((item: any) => item.month) || [],
    datasets: [
      {
        label: "Monthly Revenue ($)",
        data:
          platformAnalytics.revenueTrends?.map((item: any) => item.revenue) ||
          [],
        backgroundColor: "rgba(147, 51, 234, 0.8)",
        borderColor: "rgb(147, 51, 234)",
        borderWidth: 2,
      },
    ],
  };

  // Top Services Chart
  const topServicesData = {
    labels: platformAnalytics.topServices?.map((item: any) => item.name) || [],
    datasets: [
      {
        label: "Request Count",
        data:
          platformAnalytics.topServices?.map((item: any) => item.count) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // User Distribution Chart
  const userDistributionData = {
    labels: ["Customers", "Barbers", "Admins"],
    datasets: [
      {
        data: [
          platformAnalytics.totalUsers || 0,
          platformAnalytics.totalBarbers || 0,
          1, // Assuming 1 admin
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: "Growth Trends",
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: "Monthly Revenue",
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformAnalytics.totalUsers || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Barbers</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformAnalytics.totalBarbers || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(platformAnalytics.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {(platformAnalytics.averageRating || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            User Growth
          </h3>
          <Line data={userGrowthData} options={lineChartOptions} height={300} />
        </Card>

        {/* Request Trends Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
            Request Trends
          </h3>
          <Line
            data={requestTrendsData}
            options={lineChartOptions}
            height={300}
          />
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
            Monthly Revenue
          </h3>
          <Bar data={revenueData} options={barChartOptions} height={300} />
        </Card>

        {/* Top Services Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-600" />
            Top Services
          </h3>
          <Bar data={topServicesData} options={chartOptions} height={300} />
        </Card>
      </div>

      {/* User Distribution Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">
          User Distribution
        </h3>
        <div className="flex justify-center">
          <div className="w-80 h-80">
            <Doughnut
              data={userDistributionData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom" as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </Card>

      {/* Popular Locations */}
      {platformAnalytics.popularLocations &&
        platformAnalytics.popularLocations.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Popular Locations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformAnalytics.popularLocations.map(
                (location: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {location.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          {location.count} barbers
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>
        )}
    </div>
  );
}







