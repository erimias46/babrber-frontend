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
      <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF5A1F] rounded-xl flex items-center justify-center">
                <Scissors className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#111111]">
                BookaBeam
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="secondary" className="text-sm sm:text-base">
                  <Users className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="text-sm sm:text-base">
                  <Star className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#111111]" />
              ) : (
                <Menu className="w-6 h-6 text-[#111111]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 space-y-3 border-t border-gray-100">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full">
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
        <div className="hero-mobile text-center relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-[#FF5A1F]/20 rounded-full filter blur-3xl"></div>
            <div className="absolute top-40 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-[#FF5A1F]/10 rounded-full filter blur-3xl"></div>
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-[#FF5A1F]/10 rounded-full text-[#FF5A1F] text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-[#FF5A1F]/20">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 fill-current" />
              Trusted by 10,000+ customers
            </div>
          </div>

          <h1 className="hero-title-mobile mb-4 sm:mb-6 font-extrabold">
            <span className="block text-[#111111]">
              Find Your Perfect Barber
            </span>
            <span className="block text-[#FF5A1F]">Anywhere, Anytime</span>
          </h1>

          <p className="hero-subtitle-mobile mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed text-gray-600">
            Connect with skilled barbers in your area. Book appointments
            instantly, read reviews, and get the perfect haircut with
            transparent pricing and real-time tracking.
          </p>

          <div className="button-group-mobile max-w-lg mx-auto">
            <Link href="/auth/register?role=user" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Find a Barber
              </Button>
            </Link>
            <Link
              href="/auth/register?role=barber"
              className="w-full sm:w-auto"
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 border-[#FF5A1F]/20 hover:border-[#FF5A1F]/40"
              >
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#FF5A1F]" />
                Join as Barber
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-6 sm:gap-8">
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-700 font-medium">
                Real-time availability
              </span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-700 font-medium">
                Transparent pricing
              </span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-700 font-medium">
                Verified reviews
              </span>
            </div>
          </div>
        </div>

        {/* Modern Features */}
        <div className="section-margin">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] mb-4">
              Why Choose BookaBeam?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of barbering with our innovative platform
            </p>
          </div>

          <div className="grid-features">
            <div className="card card-hover text-center group bg-white border-2 border-gray-100">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Location-Based
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Find barbers near you with real-time location tracking, distance
                calculations, and transparent transportation fees.
              </p>
              <div className="mt-4 inline-flex items-center px-3 py-1.5 bg-[#FF5A1F]/10 rounded-full text-xs sm:text-sm text-[#FF5A1F] font-medium">
                <div className="w-1.5 h-1.5 bg-[#FF5A1F] rounded-full mr-2"></div>
                Live tracking
              </div>
            </div>

            <div className="card card-hover text-center group bg-white border-2 border-gray-100">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Rated & Reviewed
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
                <span className="text-xs sm:text-sm text-gray-700 ml-2 font-medium">
                  4.9/5 average
                </span>
              </div>
            </div>

            <div className="card card-hover text-center group bg-white border-2 border-gray-100">
              <div className="bg-[#FF5A1F] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#111111]">
                Instant Booking
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Send requests instantly with real-time notifications. Get
                confirmed bookings in seconds, not hours.
              </p>
              <div className="mt-4 inline-flex items-center px-3 py-1.5 bg-[#FF5A1F]/10 rounded-full text-xs sm:text-sm text-[#FF5A1F] font-medium">
                <div className="w-1.5 h-1.5 bg-[#FF5A1F] rounded-full mr-2"></div>
                Real-time booking
              </div>
            </div>
          </div>
        </div>

        {/* Modern CTA Section */}
        <div className="section-margin">
          <div className="relative bg-gradient-to-br from-[#FF5A1F] to-[#E54D1A] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl mb-6 shadow-xl">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5A1F]" />
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 opacity-95 max-w-2xl mx-auto">
                Join thousands of satisfied customers and professional barbers.
                Experience the future of haircut booking today.
              </p>

              <div className="button-group-mobile max-w-lg mx-auto">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-white text-[#FF5A1F] hover:bg-gray-50 border-0 shadow-lg"
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 hover:border-white/50 backdrop-blur-sm"
                  >
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Already a member?
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold mb-1">
                    10K+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Happy Customers
                  </div>
                </div>
                <div className="text-center border-l border-r border-white/20">
                  <div className="text-3xl sm:text-4xl font-bold mb-1">
                    500+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Professional Barbers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold mb-1">4.9</div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 mt-16 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2025 BookaBeam. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
