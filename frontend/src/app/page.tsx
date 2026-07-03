"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  Download, LogOut, User, Sparkles, Activity, ShieldCheck, ChevronRight, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
            setActiveJobId(null);
            setUploading(false);
            fetchDashboardData();
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

  const formatCurrency = (val: number | null) => {
    if (val === null) return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040814]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-cyan-400"
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#040814] text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Deep Space / Abstract Background matching the image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        {/* Intersection crosshairs overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_1px_at_0px_0px,#ffffff20,transparent)] bg-[size:3rem_3rem]" />
        
        {/* Large abstract glowing orbs */}
        <div className="absolute top-[-10%] left-[20%] h-[50vw] w-[50vw] rounded-full bg-blue-700/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[10%] h-[50vw] w-[50vw] rounded-full bg-indigo-900/20 blur-[150px] mix-blend-screen" />
      </div>

      {/* Modern Top Header */}
      <header className="relative z-20 border-b border-white/5 bg-[#040814]/50 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span className="font-light tracking-wide text-xl text-white">Fin<span className="font-medium">Extract</span></span>
            <div className="hidden sm:flex ml-6 pl-6 border-l border-white/10 items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">System Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-3 bg-white/[0.03] border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">{user.email}</span>
            </div>
            
            <button
              onClick={logout}
              className="group flex items-center space-x-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <span>Exit</span>
              <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 relative">
          
          {/* Connecting visual lines (decorative) */}
          <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent -z-10" />

          {/* Left Text */}
          <div className="w-full lg:w-1/2 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl font-light tracking-tight text-white leading-[1.1]"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-medium">Smart Finance</span>
              <br />
              for Modern Users
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 max-w-md font-light leading-relaxed"
            >
              Manage your data with simple, secure, and intelligent extraction solutions built for scale.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              <div className="inline-flex items-center space-x-3 bg-white/[0.03] border border-white/10 rounded-full pl-5 pr-2 py-2 backdrop-blur-md">
                <span className="text-sm font-medium text-slate-200 tracking-wide">+ {stats?.total_jobs || '15K'} Tasks</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Activity className="w-4 h-4 text-black" />
                </div>
              </div>
              
              <div className="inline-flex items-center space-x-2 bg-transparent border border-white/10 rounded-full px-5 py-3 hover:bg-white/5 transition-colors cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Explore now</span>
              </div>
            </motion.div>
          </div>

          {/* Right Upload / Status Card (Acting as the feature hero image) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 relative flex justify-center lg:justify-end"
          >
            {/* The main floating card */}
            <div className="w-full max-w-md relative">
              
              {/* Decorative floating badges */}
              <div className="absolute -left-12 top-10 flex items-center space-x-3 bg-white/[0.03] border border-white/10 rounded-full px-4 py-2.5 backdrop-blur-xl shadow-2xl z-20 hidden md:flex animate-[bounce_4s_infinite]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-sm font-medium text-slate-200">Secure System</span>
              </div>

              <div className="absolute -right-8 bottom-10 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl z-20 hidden md:block animate-[bounce_5s_infinite_reverse]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Performance</span>
                </div>
                <div className="flex items-end space-x-4">
                  <span className="text-2xl font-light text-white">{stats?.audit_pass_rate || '100'}%</span>
                  <Activity className="w-5 h-5 text-cyan-400 mb-1" />
                </div>
              </div>

              {/* Upload Interface */}
              <div className="relative rounded-3xl border border-white/10 bg-[#0B1221]/80 p-8 shadow-2xl backdrop-blur-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-50" />
                
                {/* Internal UI Header */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-300">Data Import</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono tracking-wider">SECURE</div>
                </div>

                {uploading ? (
                  <div className="relative z-10 border border-white/5 rounded-2xl bg-black/40 p-10 text-center space-y-6">
                    <div className="flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                        <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-cyan-400 border-opacity-80" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-medium text-white tracking-wide">Processing Document</h4>
                      <p className="text-sm text-cyan-400 uppercase tracking-widest">{activeJobStatus}</p>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" 
                        initial={{ width: "25%" }}
                        animate={{ width: activeJobStatus === "processing" ? "75%" : activeJobStatus === "completed" ? "100%" : "25%" }} 
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 border border-dashed border-white/20 group-hover:border-cyan-500/50 rounded-2xl bg-black/20 hover:bg-cyan-500/5 p-10 text-center transition-all duration-500 flex flex-col items-center cursor-pointer">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-500">
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <span className="text-lg font-medium text-white mb-2">Initialize Extraction</span>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">PDF up to 50MB</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                  </div>
                )}

                {uploadError && (
                  <div className="relative z-10 mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Dashboard Grid (Stats + List) */}
        <section className="space-y-8 pt-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light tracking-tight text-white">System <span className="font-medium">Overview</span></h2>
            <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Metrics</span>
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Processed", value: stats.total_jobs, sub: "Documents", icon: FileText },
                { label: "Validated", value: `${stats.audit_pass_rate}%`, sub: "Accuracy", icon: ShieldCheck },
                { label: "Records", value: stats.total_transactions.toLocaleString(), sub: "Extracted", icon: BarChart3 },
                { label: "Exceptions", value: stats.failed_jobs, sub: "Requires review", icon: AlertTriangle }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                    <stat.icon className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-light tracking-tight text-white">{stat.value}</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table Area */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md relative">
            
            {/* Table Header Decorative */}
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-black/20">
              <span className="text-sm font-medium text-slate-300 uppercase tracking-widest">Transaction Log</span>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>

            {loading ? (
              <div className="text-center py-20 text-sm text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-slate-600 animate-spin mb-4" />
                Syncing records...
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm font-light">
                No financial extractions on record. Initialize a task above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-medium uppercase tracking-widest text-slate-500 border-b border-white/5">
                      <th className="py-4 px-8 font-medium">Source</th>
                      <th className="py-4 px-8 font-medium">State</th>
                      <th className="py-4 px-8 font-medium">Entries</th>
                      <th className="py-4 px-8 font-medium">Reconciliation</th>
                      <th className="py-4 px-8 font-medium">Date</th>
                      <th className="py-4 px-8 text-right font-medium">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-5 px-8 flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                            <FileText className="h-3.5 w-3.5 text-cyan-400" />
                          </div>
                          <span className="truncate max-w-[200px] font-medium text-white">{job.original_filename}</span>
                        </td>
                        <td className="py-5 px-8">
                          <span className={`inline-flex items-center space-x-2 text-xs font-medium uppercase tracking-wider ${
                            job.file_status === "completed" ? "text-emerald-400" :
                            job.file_status === "failed" ? "text-rose-400" :
                            "text-amber-400"
                          }`}>
                            {job.file_status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                             job.file_status === "failed" ? <AlertTriangle className="h-3.5 w-3.5" /> :
                             <Clock className="h-3.5 w-3.5 animate-spin" />}
                            <span>{job.file_status}</span>
                          </span>
                        </td>
                        <td className="py-5 px-8 font-mono text-slate-400">
                          {job.txn_count > 0 ? job.txn_count.toString().padStart(3, '0') : "---"}
                        </td>
                        <td className="py-5 px-8">
                          {job.file_status === "completed" ? (
                            <div className="flex items-center space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${job.audit_passed ? "bg-emerald-400" : "bg-rose-400"}`} />
                              <span className="text-xs uppercase tracking-wider">{job.audit_passed ? "Valid" : "Mismatch"}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">Pending</span>
                          )}
                        </td>
                        <td className="py-5 px-8 font-mono text-slate-400 text-xs">
                          {new Date(job.created_at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="py-5 px-8 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white transition-all group"
                            >
                              <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <button disabled className="w-8 h-8 rounded-full bg-white/5 text-slate-600 flex items-center justify-center cursor-not-allowed">
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-12 bg-black/40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} FinExtract Systems</span>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span>Secure Digital Extraction</span>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Built for Modern Finance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
