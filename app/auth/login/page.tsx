"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Demo user credentials from database
  const mockUsers = [
    {
      type: "Customer",
      email: "john.doe@example.com",
      password: "password123",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      type: "Barber",
      email: "tony.barber@example.com",
      password: "barber123",
      color: "bg-green-100 text-green-800 border-green-200",
    },
  ];

  const fillMockCredentials = (mockEmail: string, mockPassword: string) => {
    setEmail(mockEmail);
    setPassword(mockPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login(email, password);
      // Role-based navigation after successful login
      switch (userData.role) {
        case "admin":
          router.push("/admin");
          break;
        case "barber":
          router.push("/barber");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF5A1F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl sm:text-3xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6 sm:p-8 shadow-xl border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="form-stack">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
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

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Demo User Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-[#111111] mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Demo Accounts (Click to fill)
            </h3>
            <div className="space-y-2">
              {mockUsers.map((user, index) => (
                <button
                  key={index}
                  onClick={() => fillMockCredentials(user.email, user.password)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${user.color}`}
                >
                  <div className="text-xs font-semibold">{user.type}</div>
                  <div className="text-xs opacity-80 mt-0.5">{user.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-[#FF5A1F] hover:text-[#E54D1A] transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
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
