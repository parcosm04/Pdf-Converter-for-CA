"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Landmark } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Registration failed.");
        }
        
        // Auto-login after registration
        setIsRegister(false);
        setError("Account created successfully! Please log in.");
        setLoading(false);
      } else {
        // Login flow
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Incorrect email or password.");
        }

        const data = await res.json();
        await login(data.access_token);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[60%] rounded-full bg-violet-900/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-4">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {isRegister ? "Create your account" : "Sign in to UBSP"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister ? "Get access to financial document parsing" : "Enter your credentials to access the parser console"}
          </p>
        </div>

        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${error.includes("successfully") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                isRegister ? "Register Account" : "Access Console"
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-400">
          {isRegister ? "Already have an account?" : "New to UBSP?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="font-medium text-blue-500 hover:text-blue-400 focus:outline-none"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
