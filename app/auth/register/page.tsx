"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Eye, EyeOff, Scissors, User } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set role from URL params
  useState(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "barber") {
      setFormData((prev) => ({ ...prev, role: "barber" }));
    }
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // Use Next.js router for navigation
      router.push("/dashboard");
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-[#FF5A1F]/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-[#FF5A1F]/5 rounded-full filter blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to Home Link */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#FF5A1F] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF5A1F] rounded-2xl flex items-center justify-center shadow-lg">
              {formData.role === "barber" ? (
                <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            Create Account
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Join as a{" "}
            <span className="font-semibold text-[#FF5A1F]">
              {formData.role === "barber" ? "Professional Barber" : "Customer"}
            </span>
          </p>
        </div>

        {/* Registration Form */}
        <Card className="p-6 sm:p-8 shadow-xl border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="form-stack">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#111111] mb-3">
                I want to join as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "user" }))
                  }
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                    formData.role === "user"
                      ? "border-[#FF5A1F] bg-[#FF5A1F]/10 text-[#FF5A1F] shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-semibold">Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "barber" }))
                  }
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                    formData.role === "barber"
                      ? "border-[#FF5A1F] bg-[#FF5A1F]/10 text-[#FF5A1F] shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Scissors className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-semibold">Barber</span>
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="form-grid">
              <Input
                label="First Name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
              />
              <Input
                label="Last Name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>

            {/* Contact Fields */}
            <div className="form-grid">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Password Fields */}
            <div className="form-grid">
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[calc(50%+12px)] transform -translate-y-1/2 p-2 text-gray-500 hover:text-[#FF5A1F] transition-colors touch-target rounded-lg hover:bg-[#FF5A1F]/10"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[calc(50%+12px)] transform -translate-y-1/2 p-2 text-gray-500 hover:text-[#FF5A1F] transition-colors touch-target rounded-lg hover:bg-[#FF5A1F]/10"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-[#FF5A1F] hover:text-[#E54D1A] transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
