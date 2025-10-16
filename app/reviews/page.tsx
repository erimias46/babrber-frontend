"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Star, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">(
    "newest"
  );

  // Fetch all reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["all-reviews", searchQuery, filterRating, sortBy],
    queryFn: () =>
      api
        .getAllReviews({ searchQuery, filterRating, sortBy })
        .then((res) => res.data?.data || []),
    enabled: true,
  });

  const filteredReviews = reviews || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            All Reviews
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            See what customers are saying about our barbers
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-4 sm:mb-6 p-4 sm:p-6 border-2 border-gray-100 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF5A1F] w-5 h-5" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-[#FF5A1F]"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#111111] mb-2">
                Filter by Rating
              </label>
              <select
                value={filterRating || ""}
                onChange={(e) =>
                  setFilterRating(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent transition-all"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#111111] mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-4 border-[#FF5A1F] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card className="p-6 sm:p-8 border-2 border-gray-100">
            <div className="text-center py-12 sm:py-20">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FF5A1F]/10 rounded-full"></div>
                </div>
                <Star className="w-12 h-12 sm:w-16 sm:h-16 text-[#FF5A1F] mx-auto relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] mb-2">
                No reviews found
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredReviews.map((review: any) => (
              <Card
                key={review._id}
                className="p-4 sm:p-6 border-2 border-gray-100 hover:border-[#FF5A1F]/30 transition-all duration-200 card-hover"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF5A1F] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white font-bold text-sm sm:text-lg">
                        {review.reviewerId?.firstName?.[0]}
                        {review.reviewerId?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-[#111111] truncate">
                        {review.reviewerId?.firstName}{" "}
                        {review.reviewerId?.lastName}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Reviewed{" "}
                        <span className="font-semibold text-[#FF5A1F]">
                          {review.revieweeId?.firstName}{" "}
                          {review.revieweeId?.lastName}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:text-right">
                    <div className="flex items-center gap-0.5 bg-[#FF5A1F]/10 px-2 py-1 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            i < review.rating
                              ? "text-[#FF5A1F] fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {review.comment && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
