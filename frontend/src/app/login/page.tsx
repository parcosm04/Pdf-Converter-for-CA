"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, ChevronRight, Sparkles, Activity, ShieldCheck, Wallet } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="relative flex min-h-screen bg-[#040814] text-slate-100 font-sans overflow-hidden">
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Grid and Crosshairs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Deep glows */}
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-[100%] bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[40%] rounded-[100%] bg-cyan-600/10 blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] h-[30%] w-[30%] rounded-[100%] bg-[#38bdf8]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        
        {/* Left Side: Presentation/Aesthetic */}
        <div className="hidden lg:flex flex-col justify-between w-[55%] p-16 relative">
          
          {/* Logo / Top */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-xl font-light tracking-wide text-white">Fin<span className="font-semibold">Extract</span></span>
            </div>
            <span className="text-xs tracking-[0.2em] text-slate-500 uppercase">Platform Access</span>
          </div>

          {/* Main Hero Text */}
          <div className="flex flex-col z-10 mt-20 relative">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-6xl sm:text-7xl font-light tracking-tight text-white leading-[1.1]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-medium">Smart Extraction</span>
                <br />
                for Modern<br />Finance.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <p className="text-lg text-slate-400 max-w-md font-light leading-relaxed">
                Seamlessly convert unstructured PDF statements into structured, reconcilable financial data.
              </p>
            </motion.div>

            {/* Connecting line graphic */}
            <div className="absolute top-[10%] left-[90%] w-[200px] h-[1px] bg-gradient-to-r from-white/20 to-transparent hidden xl:block" />
            <div className="absolute top-[10%] left-[90%] w-[1px] h-[100px] bg-gradient-to-b from-white/20 to-transparent hidden xl:block" />
            <div className="absolute top-[10%] left-[90%] w-1.5 h-1.5 rounded-full bg-cyan-400 hidden xl:block -translate-x-[3px] -translate-y-[3px] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>

          {/* Floating Elements (simulating the presentation aesthetic) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="absolute top-[30%] right-10 flex flex-col gap-6"
          >
            {/* Pill 1 */}
            <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/10 rounded-full pl-2 pr-5 py-2 backdrop-blur-md shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/5">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-slate-200">135K% Performance</span>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/10 rounded-full px-5 py-3 backdrop-blur-md shadow-2xl ml-12">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="text-sm font-medium text-slate-200">Secure System</span>
            </div>
          </motion.div>

          {/* Bottom */}
          <div className="text-xs text-slate-600 tracking-wider uppercase">
            © 2026 FinExtract Systems
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
          {/* Subtle line separator */}
          <div className="absolute left-0 top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Mobile Title (Hidden on LG) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10">
              <Sparkles className="w-8 h-8 text-cyan-400 mb-4" />
              <h2 className="text-3xl font-light tracking-tight text-white">
                Fin<span className="font-semibold">Extract</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">Smart Extraction for Modern Finance</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Internal glow for the card */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  {isRegister ? "Create account" : "Welcome back"}
                </h3>
                <p className="text-sm text-slate-400 mt-2 font-light">
                  {isRegister ? "Enter your details to get started." : "Enter your credentials to access your workspace."}
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center space-x-2 ${error.includes("successfully") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-between overflow-hidden rounded-full bg-white/5 border border-white/10 p-1.5 pr-2 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                  >
                    <span className="pl-5 text-sm font-medium text-white tracking-wide">
                      {loading ? "Authenticating..." : isRegister ? "Create Account" : "Access Platform"}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:scale-95 transition-transform">
                      <ChevronRight className="w-5 h-5 text-black" />
                    </div>
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {isRegister ? "Already a member?" : "New to the platform?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{isRegister ? "Sign in" : "Create account"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
