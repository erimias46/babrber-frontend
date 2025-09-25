"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MapPin, Scissors, Star, Users, Menu, X } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log("HomePage useEffect - loading:", loading, "user:", user);
    if (!loading && user) {
      console.log("User found, redirecting based on role:", user.role);
      switch (user.role) {
        case "admin":
          console.log("Redirecting to admin");
          router.push("/admin");
          break;
        case "barber":
          console.log("Redirecting to barber");
          router.push("/barber");
          break;
        default:
          console.log("Redirecting to dashboard");
          router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header with Mobile Menu */}
      <header className="bg-[#FF5A1F] sticky top-0 z-50 border-b border-black/20 shadow-lg">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center">
                <Scissors className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                BookaBeam
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link href="/auth/login">
                <Button
                  variant="secondary"
                  className="hover:scale-105 bg-white text-[#111111] hover:bg-gray-100 text-sm sm:text-base"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-black hover:bg-[#222222] text-white border border-white/20 text-sm sm:text-base">
                  <Star className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 space-y-3 animate-slide-in-from-bottom">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="secondary"
                  className="w-full bg-white text-[#111111] hover:bg-gray-100"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-black hover:bg-[#222222] text-white border border-white/20">
                  <Star className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Modern Hero Section */}
      <main className="container-responsive">
        <div className="hero-mobile text-center relative">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-[#FF5A1F] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-[#FF5A1F] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-[#FF5A1F] rounded-full text-white text-xs sm:text-sm font-medium mb-4 sm:mb-6 shadow-lg">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Trusted by 10,000+ customers
            </div>
          </div>

          <h1 className="hero-title-mobile mb-4 sm:mb-6">
            <span className="text-[#FF5A1F]">Find Your Perfect</span>
            <br className="hidden sm:block" />
            <span className="text-[#111111]">Barber, </span>
            <span className="text-[#FF5A1F]">Anywhere</span>
          </h1>

          <p className="hero-subtitle-mobile mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
            Connect with skilled barbers in your area. Book appointments
            instantly, read reviews, and get the perfect haircut with
            <span className="font-semibold text-[#FF5A1F]">
              {" "}
              transparent pricing
            </span>{" "}
            and
            <span className="font-semibold text-[#FF5A1F]">
              {" "}
              real-time tracking
            </span>
            .
          </p>

          <div className="button-group-mobile">
            <Link href="/auth/register?role=user">
              <Button
                size="lg"
                className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl bg-[#FF5A1F] hover:bg-[#E54D1A] text-white w-full sm:w-auto"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Find a Barber
              </Button>
            </Link>
            <Link href="/auth/register?role=barber">
              <Button
                variant="secondary"
                size="lg"
                className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-black hover:bg-[#222222] text-white border border-[#FF5A1F] w-full sm:w-auto"
              >
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Join as Barber
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-[#222222]">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#FF5A1F] rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs sm:text-sm">Real-time availability</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#FF5A1F] rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs sm:text-sm">Transparent pricing</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#FF5A1F] rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs sm:text-sm">Verified reviews</span>
            </div>
          </div>
        </div>

        {/* Modern Features */}
        <div className="section-margin">
          <div className="grid-features">
            <div className="card card-hover text-center group bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-[#FF5A1F]/20">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Location-Based
              </h3>
              <p className="text-sm sm:text-base text-[#222222] leading-relaxed">
                Find barbers near you with real-time location tracking, distance
                calculations, and transparent transportation fees.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs sm:text-sm text-[#FF5A1F]">
                <div className="w-2 h-2 bg-[#FF5A1F] rounded-full animate-pulse"></div>
                <span>Live tracking</span>
              </div>
            </div>

            <div className="card card-hover text-center group bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-[#FF5A1F]/20">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Rated & Reviewed
              </h3>
              <p className="text-sm sm:text-base text-[#222222] leading-relaxed">
                Read authentic reviews and ratings from real customers. Make
                informed choices with verified feedback.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF5A1F] fill-current"
                  />
                ))}
                <span className="text-xs sm:text-sm text-[#222222] ml-2">
                  4.9/5 average
                </span>
              </div>
            </div>

            <div className="card card-hover text-center group bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-[#FF5A1F]/20">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Instant Booking
              </h3>
              <p className="text-sm sm:text-base text-[#222222] leading-relaxed">
                Send requests instantly with real-time notifications. Get
                confirmed bookings in seconds, not hours.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs sm:text-sm text-[#FF5A1F]">
                <div className="w-2 h-2 bg-[#FF5A1F] rounded-full animate-pulse"></div>
                <span>Real-time booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern CTA Section */}
        <div className="section-margin relative">
          <div className="absolute inset-0 bg-[#FF5A1F] rounded-2xl sm:rounded-3xl transform rotate-1"></div>
          <div className="relative bg-[#FF5A1F] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5A1F]" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 mt-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of satisfied customers and professional barbers.
              Experience the future of haircut booking today.
            </p>

            <div className="button-group-mobile">
              <Link href="/auth/register">
                <Button
                  variant="secondary"
                  size="lg"
                  className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-white text-[#FF5A1F] hover:bg-gray-100 w-full sm:w-auto"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Sign Up Now
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-black hover:bg-[#222222] text-white border border-white/30 w-full sm:w-auto"
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Already a member?
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">10K+</div>
                <div className="text-xs sm:text-sm opacity-80">
                  Happy Customers
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">500+</div>
                <div className="text-xs sm:text-sm opacity-80">
                  Professional Barbers
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">4.9</div>
                <div className="text-xs sm:text-sm opacity-80">
                  Average Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
