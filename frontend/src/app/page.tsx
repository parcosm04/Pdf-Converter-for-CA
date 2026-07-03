"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  Download, LogOut, User, Sparkles, Shield, BarChart3, Zap, Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface Job {
  id: string;
  original_filename: string;
  file_status: string;
  opening_balance: number | null;
  closing_balance: number | null;
  audit_passed: boolean;
  txn_count: number;
  error_message: string | null;
  created_at: string;
}

interface Stats {
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  total_transactions: number;
  audit_pass_rate: number;
}

export default function DashboardPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobStatus, setActiveJobStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const statsRes = await fetch(`${API_URL}/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const jobsRes = await fetch(`${API_URL}/jobs?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token, fetchDashboardData]);

  useEffect(() => {
    if (!activeJobId || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${activeJobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const job: Job = await res.json();
          setActiveJobStatus(job.file_status);
          
          if (job.file_status === "completed" || job.file_status === "failed") {
            if (job.file_status === "completed") {
              setTimeout(() => {
                setActiveJobId(null);
                setUploading(false);
                fetchDashboardData();
              }, 4000);
            } else {
              setActiveJobId(null);
              setUploading(false);
              fetchDashboardData();
            }
          }
        }
      } catch (err) {
        console.error("Polling job status error", err);
        setActiveJobId(null);
        setUploading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, token, fetchDashboardData, API_URL]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    const file = files[0];
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a valid PDF document.");
      return;
    }

    setUploadError("");
    setUploading(true);
    setActiveJobStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/jobs/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed.");
      }

      const jobData = await res.json();
      setActiveJobId(jobData.id);
      setActiveJobStatus(jobData.file_status);
    } catch (err: any) {
      setUploadError(err.message || "Failed to dispatch upload task.");
      setUploading(false);
    }
  };

  const scrollToTable = () => {
    document.getElementById('history-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#BF953F]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-[#BF953F]/30">
      
      {/* --- Ultra-Premium Background Effects --- */}
      {/* Tech Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: 'linear-gradient(#BF953F 1px, transparent 1px), linear-gradient(90deg, #BF953F 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Deep Gold Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[#BF953F] opacity-[0.08] blur-[150px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] bg-[#AA771C] opacity-[0.05] blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      
      {/* Connecting Circuit Lines (Simulated with absolute divs) */}
      <div className="absolute top-[35%] left-[20%] w-[1px] h-[30%] bg-gradient-to-b from-transparent via-[#BF953F]/20 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[45%] right-[25%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-[#BF953F]/20 to-transparent pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-20 w-full pt-8 pb-4 border-b border-[#BF953F]/10 bg-gradient-to-b from-[#030303] to-transparent">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#BF953F] to-[#AA771C] flex items-center justify-center shadow-[0_0_15px_rgba(191,149,63,0.4)]">
              <span className={`${playfair.className} font-bold text-[#030303] text-lg leading-none`}>F</span>
            </div>
            <span className={`${playfair.className} font-bold tracking-widest text-xl uppercase bg-gradient-to-r from-[#e6c875] via-[#fff3c7] to-[#e6c875] bg-clip-text text-transparent`}>
              FinExtract
            </span>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-10 text-xs font-semibold tracking-widest uppercase text-slate-400">
            <a href="#" className="hover:text-[#BF953F] transition-colors">Platform</a>
            <a href="#" className="hover:text-[#BF953F] transition-colors">Ecosystem</a>
            <a href="#" className="hover:text-[#BF953F] transition-colors">Technology</a>
          </nav>

          <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="hidden sm:flex items-center space-x-2 text-slate-400 mr-2">
              <User className="h-4 w-4 text-[#BF953F]" />
              <span className="text-xs uppercase tracking-wider">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 rounded border border-[#BF953F]/50 text-[#BF953F] text-xs font-bold uppercase tracking-widest hover:bg-[#BF953F] hover:text-[#030303] transition-all shadow-[0_0_15px_rgba(191,149,63,0.1)] hover:shadow-[0_0_20px_rgba(191,149,63,0.4)]"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full flex flex-col items-center pt-20 pb-32">
        
        {/* Hero Section */}
        <div className="text-center w-full max-w-5xl mx-auto px-6 mb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={`${playfair.className} text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.15] mb-8`}>
              <span className="block text-white mb-2">FINEXTRACT NODE —</span>
              <span className="block bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent">
                DIGITAL LEDGER ON THE
              </span>
              <span className="block text-white font-light italic mt-2">FINANCIAL NETWORK</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed mb-10"
          >
            A reliable and stable asset parsing engine that ensures robust growth and protection of your transactional data through ultra-secure extraction protocols.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button 
              onClick={() => document.getElementById('upload-input')?.click()}
              className="px-10 py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-[#030303] text-sm font-bold uppercase tracking-widest rounded-sm shadow-[0_0_30px_rgba(191,149,63,0.3)] hover:shadow-[0_0_50px_rgba(191,149,63,0.5)] transition-all transform hover:-translate-y-1"
            >
              Initialize Node
            </button>
          </motion.div>
        </div>

        {/* Central Extraction Block (The "Vault") */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full max-w-[600px] px-6 relative z-20 mb-32"
        >
          {/* Decorative Connecting Line Top */}
          <div className="absolute -top-16 left-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent to-[#BF953F]/50" />
          <div className="absolute -top-16 left-1/2 -ml-1 w-2 h-2 rounded-full border border-[#BF953F] bg-[#030303]" />

          <div className="rounded-2xl bg-[#080808]/80 backdrop-blur-xl border border-[#BF953F]/30 shadow-[inset_0_0_30px_rgba(191,149,63,0.05),_0_20px_50px_rgba(0,0,0,0.8)] p-1 relative overflow-hidden group">
            
            {/* Inner Metallic Border */}
            <div className="absolute inset-0 rounded-2xl border-[0.5px] border-white/5 pointer-events-none" />
            
            <div className="bg-[#0B0B0B] rounded-xl p-10 lg:p-14 relative z-10 flex flex-col items-center text-center">
              
              {uploading ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-8 w-full">
                  <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-[#BF953F]/20" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full border-t-2 border-[#BF953F] shadow-[0_0_15px_rgba(191,149,63,0.5)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-[#BF953F]" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className={`${playfair.className} text-2xl font-bold text-white tracking-wide`}>Decrypting Data</h4>
                    <p className="text-xs text-[#BF953F] uppercase tracking-[0.2em] font-bold">{activeJobStatus}</p>
                    
                    {activeJobStatus === "completed" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="mt-6 border border-emerald-500/30 bg-emerald-500/5 px-6 py-3 rounded text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]"
                      >
                        Ledger compiled. Awaiting Excel download below.
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('upload-input')?.click()}
                  className="w-full py-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500"
                >
                  <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-[#BF953F] blur-xl opacity-20 rounded-full" />
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#BF953F]/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(191,149,63,0.1)] relative z-10">
                      <Upload className="w-10 h-10 text-[#BF953F]" />
                    </div>
                  </div>
                  <h3 className={`${playfair.className} text-3xl font-bold text-white mb-3`}>Deploy PDF Document</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Max encrypted payload: 50MB</p>
                  <input
                    id="upload-input"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {uploadError && (
                <div className="mt-8 border border-rose-500/30 bg-rose-500/5 px-6 py-4 rounded text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center space-x-3 w-full justify-center">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Features Section (Like the 4 gold icons in reference) */}
        <div className="w-full max-w-[1200px] px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
          {[
            { icon: <Shield className="w-8 h-8" />, title: "SECURE INVESTORS", desc: "Enterprise-grade security protocols for all parsed documentation." },
            { icon: <BarChart3 className="w-8 h-8" />, title: "GLOBAL LEDGER", desc: "Standardized output mapping directly to your ERP systems." },
            { icon: <Zap className="w-8 h-8" />, title: "RAPID ECOSYSTEM", desc: "Instantaneous processing utilizing deep learning extraction." },
            { icon: <Lock className="w-8 h-8" />, title: "PRIVATE RETAIL", desc: "Complete data sovereignty with auto-purging architecture." },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#050505] border border-[#BF953F]/30 flex items-center justify-center mb-6 text-[#BF953F] shadow-[0_10px_30px_rgba(191,149,63,0.15)] relative">
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(191,149,63,0.3)] pointer-events-none" />
                {feature.icon}
              </div>
              <h4 className={`${playfair.className} text-lg font-bold text-white mb-3 uppercase tracking-wider`}>{feature.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Premium Ledger / Table */}
        <div id="history-table" className="w-full max-w-[1200px] px-6">
          <div className="text-center mb-16">
            <h2 className={`${playfair.className} text-3xl md:text-4xl font-bold text-white mb-4`}>
              <span className="bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent">GOLD RUSH</span> WITH FINEXTRACT
            </h2>
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">The financial parsing journey begins here in our digital ledger.</p>
          </div>

          <div className="w-full bg-[#080808]/80 backdrop-blur-lg border border-[#BF953F]/20 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-[#BF953F]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#BF953F] mb-4" />
                <span className="text-xs uppercase tracking-widest font-bold">Syncing Ledger...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-24 text-center text-slate-500 flex flex-col items-center">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-xs uppercase tracking-widest">No entries found in the ledger.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#BF953F]/20 bg-[#0A0A0A]">
                      <th className="py-6 pl-8 pr-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Source Node</th>
                      <th className="py-6 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Status</th>
                      <th className="py-6 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Txn Block</th>
                      <th className="py-6 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Validation</th>
                      <th className="py-6 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Timestamp</th>
                      <th className="py-6 pr-8 pl-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-[#BF953F]">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#111] transition-colors group">
                        <td className="py-5 pl-8 pr-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded bg-[#111] border border-[#BF953F]/30 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="font-semibold text-slate-200 text-sm truncate max-w-[200px]">{job.original_filename}</span>
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex items-center space-x-2">
                            {job.file_status === "completed" && <div className="w-1.5 h-1.5 rounded-full bg-[#BF953F] shadow-[0_0_8px_#BF953F]" />}
                            {job.file_status === "failed" && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />}
                            {job.file_status !== "completed" && job.file_status !== "failed" && <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />}
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{job.file_status}</span>
                          </div>
                        </td>
                        <td className="py-5 px-4 font-mono text-slate-300 text-xs">{job.txn_count > 0 ? job.txn_count : "---"}</td>
                        <td className="py-5 px-4">
                          {job.file_status === "completed" ? (
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${job.audit_passed ? "text-emerald-400" : "text-rose-400"}`}>
                              {job.audit_passed ? "Valid Hash" : "Hash Mismatch"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-5 px-4 text-xs font-mono text-slate-400">
                          {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                        <td className="py-5 pr-8 pl-4 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-6 py-2 rounded-sm bg-gradient-to-r from-[#BF953F] to-[#AA771C] text-[#030303] font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(191,149,63,0.2)]"
                            >
                              Download CSV
                            </a>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="w-full border-t border-[#BF953F]/10 relative z-10 bg-[#030303]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className={`${playfair.className} font-bold text-[#BF953F] text-lg`}>FinExtract</span>
            <span className="text-slate-600 text-[10px] uppercase tracking-widest">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center space-x-8 text-[10px] uppercase tracking-widest font-bold text-slate-500">
            <a href="#" className="hover:text-[#BF953F] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#BF953F] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#BF953F] transition-colors">Audit Report</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
/ /   T r i g g e r   V e r c e l   B u i l d  
 