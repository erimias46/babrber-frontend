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
  const [filterRating, setFilterRating] = useState<number | null>(null);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Reviews</h1>
          <p className="text-gray-600">
            See what customers are saying about our barbers
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={filterRating || ""}
                  onChange={(e) =>
                    setFilterRating(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <div className="text-center py-20">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review: any) => (
              <Card key={review._id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-lg">
                          {review.reviewerId?.firstName?.[0]}
                          {review.reviewerId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.reviewerId?.firstName}{" "}
                          {review.reviewerId?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Reviewed {review.revieweeId?.firstName}{" "}
                          {review.revieweeId?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
