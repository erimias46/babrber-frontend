"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, AuthResponse } from "@/types";
import { api } from "@/lib/api/client";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // Also check for token in cookies as fallback
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const cookieToken = getCookie("token");
    const finalToken = storedToken || cookieToken;

    if (finalToken && storedUser) {
      setToken(finalToken);
      setUser(JSON.parse(storedUser));

      // Ensure both localStorage and cookie have the token
      if (!storedToken && cookieToken) {
        localStorage.setItem("token", cookieToken);
      }
      if (!cookieToken && storedToken) {
        document.cookie = `token=${storedToken}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=Lax`;
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting login...");
      const response = await api.login({ email, password });
      console.log("Login response:", response.data);

      const { user: userData, token: userToken } = response.data
        .data as AuthResponse;

      console.log("Setting user data:", userData);
      console.log("Setting token:", userToken);

      setUser(userData);
      setToken(userToken);
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set token in cookie for middleware
      document.cookie = `token=${userToken}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`;

      toast.success("Login successful!");
      console.log("Login completed successfully");

      return userData;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.register(data);
      const { user: userData, token: userToken } = response.data
        .data as AuthResponse;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set token in cookie for middleware
      document.cookie = `token=${userToken}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`;

      toast.success("Registration successful!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear token cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    toast.success("Logged out successfully");
    window.location.href = "/"; // Redirect to main page
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
