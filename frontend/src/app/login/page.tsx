"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// 4-point star component
const SparkleStar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="currentColor"/>
  </svg>
);

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Registration failed.");
        }
        
        setIsRegister(false);
        setError("Account created successfully! Please log in.");
        setLoading(false);
      } else {
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
    <div className="relative flex min-h-screen bg-[#2A2A28] text-white font-sans overflow-hidden selection:bg-[#DCA846]/30">
      
      {/* Heavy Gold Radial Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] bg-[#DCA846] opacity-[0.12] blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* Decorative Stars */}
      <SparkleStar className="absolute top-[20%] left-[20%] w-6 h-6 text-[#DCA846] opacity-80 z-0 animate-pulse" />
      <SparkleStar className="absolute top-[70%] right-[20%] w-5 h-5 text-[#DCA846] opacity-60 z-0 animate-pulse" style={{ animationDelay: '1s' }} />
      <SparkleStar className="absolute bottom-[20%] left-[30%] w-4 h-4 text-[#DCA846] opacity-40 z-0 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-center min-h-screen px-6 py-12">
        
        {/* Left Side: Branding (Dilocash style) */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-12 max-w-xl">
          <span className="font-bold tracking-tight text-3xl text-white mb-8">
            Fin<span className="text-[#DCA846]">Extract</span>
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Secure & Smart <br /> Access Portal
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-10 font-light max-w-md">
            Join the platform that simplifies digital data extraction. Manage all your financial statement parsing in one premium ecosystem.
          </p>

          <div className="flex flex-col max-w-[250px]">
            <span className="text-[#DCA846] font-bold text-lg mb-1">01</span>
            <span className="text-white font-semibold text-base mb-2">Trusted By Professionals</span>
            <span className="text-slate-400 text-xs leading-relaxed">Secure data pipelines with high accuracy validation systems.</span>
          </div>
        </div>

        {/* Right Side: Form Block */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md lg:w-1/2"
        >
          <div className="rounded-2xl border border-slate-700 bg-[#1A1A1A] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            <div className="lg:hidden font-bold tracking-tight text-2xl text-white mb-8 text-center">
              Fin<span className="text-[#DCA846]">Extract</span>
            </div>

            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {isRegister ? "Sign Up" : "Log In"}
              </h3>
              <p className="text-sm text-slate-400 mt-2 font-light">
                {isRegister ? "Create an account to start extracting." : "Welcome back. Please enter your details."}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mb-6 rounded-md border px-4 py-3 text-sm flex items-center space-x-2 ${error.includes("successfully") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}
              >
                <span>{error}</span>
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-slate-700 bg-[#222222] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#DCA846] focus:bg-[#2A2A28] focus:outline-none transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-slate-700 bg-[#222222] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#DCA846] focus:bg-[#2A2A28] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center rounded-md bg-[#DCA846] px-4 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#e0b45c] transition-colors focus:outline-none disabled:opacity-70 shadow-lg shadow-[#DCA846]/20 uppercase tracking-wider"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#1A1A1A]" />
                  ) : (
                    isRegister ? "Sign Up" : "Log In"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center justify-center text-sm">
              <span className="text-slate-500 mb-2">
                {isRegister ? "Already have an account?" : "Don't have an account?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="text-[#DCA846] hover:text-white transition-colors font-bold uppercase tracking-wider"
              >
                {isRegister ? "Log In" : "Sign Up"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
