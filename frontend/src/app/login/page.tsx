"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

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
    <div className="relative flex min-h-screen bg-[#030303] text-white font-sans overflow-hidden selection:bg-[#BF953F]/30">
      
      {/* --- Ultra-Premium Background Effects --- */}
      {/* Tech Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: 'linear-gradient(#BF953F 1px, transparent 1px), linear-gradient(90deg, #BF953F 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Deep Gold Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#BF953F] opacity-[0.06] blur-[150px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#AA771C] opacity-[0.08] blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen" />

      {/* Decorative Line */}
      <div className="absolute left-16 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#BF953F]/20 to-transparent z-0 hidden lg:block" />

      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Side: Branding */}
        <div className="flex-1 flex flex-col justify-center px-10 lg:px-24 xl:px-32 relative z-20 py-16 lg:py-0">
          <div className="mb-12">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#BF953F] to-[#AA771C] flex items-center justify-center shadow-[0_0_20px_rgba(191,149,63,0.4)] mb-6">
              <span className={`${playfair.className} font-bold text-[#030303] text-2xl leading-none`}>F</span>
            </div>
            <h1 className={`${playfair.className} text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6`}>
              <span className="block text-white mb-2">ACCESS THE</span>
              <span className="block bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent">
                GOLD STANDARD
              </span>
            </h1>
            <p className="text-slate-400 text-sm max-w-md font-light leading-relaxed mb-10">
              Enter the ecosystem designed for exclusive, high-precision financial data parsing and ledger management.
            </p>

            {/* Premium feature list */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full border border-[#BF953F]/40 flex items-center justify-center shrink-0 mt-1 shadow-[inset_0_0_10px_rgba(191,149,63,0.2)]">
                  <span className="text-[#BF953F] text-xs font-bold">01</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-1">Encrypted Pipelines</h4>
                  <p className="text-xs text-slate-500 max-w-[250px]">Your data is secured through military-grade hashing prior to extraction.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full border border-[#BF953F]/40 flex items-center justify-center shrink-0 mt-1 shadow-[inset_0_0_10px_rgba(191,149,63,0.2)]">
                  <span className="text-[#BF953F] text-xs font-bold">02</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-1">Guaranteed Precision</h4>
                  <p className="text-xs text-slate-500 max-w-[250px]">Built-in balancing algorithms ensure zero loss of transactional data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Block */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-20">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md rounded-2xl bg-[#080808]/90 backdrop-blur-xl border border-[#BF953F]/30 shadow-[inset_0_0_30px_rgba(191,149,63,0.05),_0_20px_50px_rgba(0,0,0,0.8)] p-1 overflow-hidden"
          >
            {/* Inner Metallic Border */}
            <div className="absolute inset-0 rounded-2xl border-[0.5px] border-white/5 pointer-events-none" />

            <div className="bg-[#0B0B0B] rounded-xl p-8 sm:p-10 relative z-10">
              
              <div className="mb-10 text-center">
                <h3 className={`${playfair.className} text-3xl font-bold text-white mb-2`}>
                  {isRegister ? "Join Ecosystem" : "Secure Login"}
                </h3>
                <p className="text-xs text-[#BF953F] uppercase tracking-widest font-bold">
                  {isRegister ? "Initialize new node credentials" : "Authenticate to proceed"}
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mb-8 border px-4 py-3 text-xs font-bold uppercase tracking-widest text-center rounded-sm ${error.includes("successfully") ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-rose-500/30 bg-rose-500/5 text-rose-400"}`}
                >
                  {error}
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Digital ID (Email)</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-sm border border-white/10 bg-[#111] px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:border-[#BF953F]/50 focus:bg-[#1A1A1A] focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                      placeholder="node@network.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Security Key</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-sm border border-white/10 bg-[#111] px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:border-[#BF953F]/50 focus:bg-[#1A1A1A] focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center rounded-sm bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] px-4 py-4 text-xs font-bold text-[#030303] hover:brightness-110 transition-all focus:outline-none disabled:opacity-70 shadow-[0_0_20px_rgba(191,149,63,0.2)] uppercase tracking-widest"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#030303]" />
                    ) : (
                      isRegister ? "Create Node" : "Authenticate"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center text-xs">
                <span className="text-slate-500 mb-2 font-medium">
                  {isRegister ? "Node already established?" : "Need network access?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="text-[#BF953F] hover:text-[#FCF6BA] transition-colors font-bold uppercase tracking-widest"
                >
                  {isRegister ? "Authenticate Here" : "Create Node Here"}
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
