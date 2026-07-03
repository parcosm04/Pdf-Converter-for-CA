"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SparkleStar = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
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
          throw new Error(data.detail || "Incorrect credentials.");
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
    <div className="relative flex min-h-screen text-white font-sans overflow-hidden selection:bg-[#DCA846]/30 bg-black">
      
      {/* DARK BLACK BACKGROUND WITH GOLD GLOW */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_70%_50%,_#2A2112_0%,_#050505_50%,_#000000_100%)]" />

      {/* Extra floating glow behind form */}
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#DCA846] opacity-[0.10] blur-[120px] rounded-full pointer-events-none z-0" />

      <SparkleStar className="absolute top-[20%] left-[25%] w-6 h-6 text-[#DCA846] opacity-90 z-0 animate-pulse" />
      <SparkleStar className="absolute top-[70%] right-[25%] w-4 h-4 text-[#DCA846] opacity-70 z-0 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-center min-h-screen px-6 py-12">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-16 max-w-xl">
          <span className="font-bold tracking-tight text-3xl text-white mb-8">
            Fin<span className="text-[#DCA846]">Extract</span>
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Secure & Smart <br /> Access Portal
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 font-normal max-w-md">
            Join the platform that simplifies digital data extraction. Manage all your financial statement parsing in one premium ecosystem.
          </p>
        </div>

        {/* Right Side: Super Smooth Form Block */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px] lg:w-1/2"
        >
          <div className="rounded-[2rem] bg-gradient-to-br from-[#222222] to-[#0A0A0A] p-[2px] shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative">
            <div className="bg-[#111111] rounded-[2rem] p-10 relative z-10 border border-white/5">
              
              <div className="lg:hidden font-bold tracking-tight text-2xl text-white mb-8 text-center">
                Fin<span className="text-[#DCA846]">Extract</span>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {isRegister ? "Sign up to start extracting your data." : "Enter your credentials to access your dashboard."}
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium flex items-center justify-center text-center ${error.includes("successfully") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}
                >
                  {error}
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-2xl border border-white/5 bg-[#1A1A1A] px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-[#DCA846]/50 outline-none transition-shadow"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-2xl border border-white/5 bg-[#1A1A1A] px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-[#DCA846]/50 outline-none transition-shadow"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center rounded-full bg-[#DCA846] px-4 py-4 text-sm font-bold text-black hover:brightness-110 transition-all focus:outline-none disabled:opacity-70 shadow-[0_10px_20px_rgba(220,168,70,0.2)]"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-black" />
                    ) : (
                      isRegister ? "Sign Up" : "Log In"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center text-sm font-medium">
                <span className="text-slate-500 mb-2">
                  {isRegister ? "Already have an account?" : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="text-[#DCA846] hover:brightness-110 transition-all font-bold"
                >
                  {isRegister ? "Log In" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
