
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  organization_id: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const autoGuestLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/guest`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("finextract_token", data.access_token);
        setToken(data.access_token);
        await fetchUserProfile(data.access_token);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Auto guest login failed", err);
      setLoading(false);
    }
  };

  // Check for stored token on client mount
  useEffect(() => {
    const storedToken = localStorage.getItem("finextract_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      autoGuestLogin();
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token is invalid/expired -> auto authenticate as guest
        autoGuestLogin();
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      autoGuestLogin();
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem("finextract_token", newToken);
    setToken(newToken);
    setLoading(true);
    await fetchUserProfile(newToken);
  };

  const logout = () => {
    localStorage.removeItem("finextract_token");
    setToken(null);
    setUser(null);
    autoGuestLogin();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
