"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  User, Check, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

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

const SparkleStar = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="currentColor"/>
  </svg>
);

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
        headers: { Authorization: `Bearer ${token}` },
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
      setUploadError(err.message || "Failed to process document.");
      setUploading(false);
    }
  };

  const scrollToTable = () => {
    document.getElementById('history-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-[#DCA846]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#DCA846]/30 bg-black">
      
      {/* 
        DARK BLACK BACKGROUND WITH SOFT GOLD GLOW
        Fades perfectly into pure #000000 black at the edges.
      */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_70%_40%,_#2A2112_0%,_#050505_50%,_#000000_100%)]" />

      {/* Extra floating glow behind the extraction block to give it a 3D pop */}
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#DCA846] opacity-[0.10] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Decorative Smooth Stars */}
      <SparkleStar className="absolute top-[25%] left-[45%] w-6 h-6 text-[#DCA846] opacity-90 z-0 animate-pulse" />
      <SparkleStar className="absolute top-[35%] right-[15%] w-4 h-4 text-[#DCA846] opacity-70 z-0 animate-pulse" style={{ animationDelay: '1s' }} />
      <SparkleStar className="absolute bottom-[30%] left-[25%] w-5 h-5 text-[#DCA846] opacity-60 z-0 animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header - Super Clean */}
      <header className="relative z-20 w-full pt-10 pb-6">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-2xl text-white">
              Fin<span className="text-[#DCA846]">Extract</span>
            </span>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-10 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Service</a>
            <a href="#" className="hover:text-white transition-colors">How It Work</a>
            <a href="#" className="hover:text-white transition-colors">Benefits</a>
          </nav>

          <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="hidden sm:flex items-center space-x-2 text-slate-400">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 rounded-full border border-[#DCA846] text-[#DCA846] hover:bg-[#DCA846] hover:text-black transition-all font-semibold"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-16 py-12 lg:py-20 flex flex-col">
        
        {/* Split Hero Layout */}
        <section className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 mb-24">
          
          {/* Left Text & CTA */}
          <div className="w-full lg:w-[50%] flex flex-col z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight text-white leading-[1.05] mb-8"
            >
              Fast And Simple <br /> Data Extraction <br /> Solution
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mb-10 font-normal"
            >
              Easily convert and extract unstructured financial statements into clean, actionable Excel data. Drop your file, and let the system handle the reconciliation instantly.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 mb-24"
            >
              <button 
                onClick={() => document.getElementById('upload-input')?.click()}
                className="px-8 py-3.5 bg-[#DCA846] text-black font-bold rounded-full hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(220,168,70,0.3)] flex items-center"
              >
                Start Extraction
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button 
                onClick={scrollToTable}
                className="px-8 py-3.5 border border-[#DCA846] text-[#DCA846] font-bold rounded-full hover:bg-[#DCA846]/10 transition-all"
              >
                View History
              </button>
            </motion.div>

            {/* Bottom Left Minimal Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-12"
            >
              <div className="flex flex-col max-w-[200px]">
                <span className="text-[#DCA846] font-bold text-xl mb-1">01</span>
                <span className="text-white font-semibold text-base mb-1">Financial Processing</span>
                <span className="text-slate-500 text-xs leading-relaxed">Manage everything from this simple dashboard interface.</span>
              </div>
              <div className="flex flex-col max-w-[200px]">
                <span className="text-[#DCA846] font-bold text-xl mb-1">02</span>
                <span className="text-white font-semibold text-base mb-1">Easy To Use System</span>
                <span className="text-slate-500 text-xs leading-relaxed">Each upload delivers clean, balanced tabular records instantly.</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Super Smooth Extraction Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full lg:w-[50%] relative flex justify-center lg:justify-end items-center"
          >
            {/* Circular Text Badge */}
            <div className="absolute -left-6 bottom-16 w-32 h-32 z-20 hidden md:flex items-center justify-center">
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#DCA846] fill-current">
                  <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                  <text className="text-[10px] font-bold uppercase tracking-widest">
                    <textPath href="#circlePath">
                      extraction solution your one stop • 
                    </textPath>
                  </text>
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#DCA846] flex items-center justify-center z-10 shadow-lg">
                <Check className="w-5 h-5 text-black" />
              </div>
            </div>

            {/* Active Users Block */}
            <div className="absolute -bottom-4 right-8 z-20 flex items-center bg-[#111111]/90 backdrop-blur-md border border-[#DCA846]/30 rounded-full p-2 pr-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <div className="bg-[#DCA846] text-black font-bold text-lg px-4 py-1.5 rounded-full mr-3">
                {stats?.total_jobs ? `${stats.total_jobs}K` : '1.24M'}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-300 leading-tight">Documents</span>
                <span className="text-[10px] text-slate-500">Processed</span>
              </div>
            </div>

            {/* Main Dropzone Container */}
            <div className="w-full max-w-[460px] rounded-[2rem] bg-gradient-to-br from-[#222222] to-[#0A0A0A] p-[2px] shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative z-10">
              <div className="w-full h-full bg-[#111111] rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                
                {uploading ? (
                  <div className="py-12 flex flex-col items-center space-y-6">
                    <div className="relative">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#DCA846]" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white tracking-tight">Processing Data</h4>
                      <p className="text-xs text-[#DCA846] font-bold uppercase tracking-widest">{activeJobStatus}</p>
                      
                      {activeJobStatus === "completed" && (
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="text-emerald-400 text-sm font-semibold mt-6 bg-emerald-400/10 px-5 py-2.5 rounded-full border border-emerald-400/20"
                        >
                          Ready! Awaiting Excel download below.
                        </motion.p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => document.getElementById('upload-input')?.click()}
                    className="py-12 w-full flex flex-col items-center justify-center cursor-pointer transition-all"
                  >
                    <div className="w-24 h-24 rounded-[1.5rem] bg-[#1A1A1A] shadow-inner flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:shadow-[0_10px_30px_rgba(220,168,70,0.15)] transition-all duration-500 border border-white/5">
                      <Upload className="w-10 h-10 text-[#DCA846]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Upload PDF Document</h3>
                    <p className="text-sm text-slate-500 font-medium">Click to browse (Up to 50MB)</p>
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
                  <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Super Clean Smooth Table Section */}
        <section id="history-table" className="w-full mt-10 z-10 pt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 px-2">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Recent Extractions</h2>
              <p className="text-slate-500 text-sm font-medium">Track your processed files and download the output.</p>
            </div>
          </div>

          <div className="w-full rounded-3xl bg-[#111111] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#DCA846] animate-spin mb-4" />
                <span className="font-medium text-sm">Loading records...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-24 text-center text-slate-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <p className="font-medium">No documents processed yet. Upload to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0A0A0A]">
                      <th className="py-5 pl-10 pr-4 text-xs font-bold uppercase tracking-wider text-slate-600">Document Name</th>
                      <th className="py-5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                      <th className="py-5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Transactions</th>
                      <th className="py-5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Validation</th>
                      <th className="py-5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Date</th>
                      <th className="py-5 pr-10 pl-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#151515] transition-colors group">
                        <td className="py-6 pl-10 pr-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-white/5">
                              <FileText className="w-4 h-4 text-[#DCA846]" />
                            </div>
                            <span className="font-semibold text-white truncate max-w-[200px]">{job.original_filename}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <span className={`inline-flex items-center space-x-2 text-sm font-semibold ${
                            job.file_status === "completed" ? "text-[#DCA846]" :
                            job.file_status === "failed" ? "text-rose-400" :
                            "text-slate-400"
                          }`}>
                            {job.file_status === "completed" && <CheckCircle2 className="w-4 h-4" />}
                            {job.file_status === "failed" && <AlertTriangle className="w-4 h-4" />}
                            {job.file_status !== "completed" && job.file_status !== "failed" && <Clock className="w-4 h-4 animate-spin" />}
                            <span className="capitalize">{job.file_status}</span>
                          </span>
                        </td>
                        <td className="py-6 px-4 font-semibold text-slate-300">{job.txn_count > 0 ? job.txn_count : "---"}</td>
                        <td className="py-6 px-4">
                          {job.file_status === "completed" ? (
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${job.audit_passed ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"}`} />
                              <span className="text-sm font-semibold text-slate-300">{job.audit_passed ? "Valid" : "Mismatch"}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm font-medium">Pending</span>
                          )}
                        </td>
                        <td className="py-6 px-4 text-sm font-medium text-slate-500">
                          {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-6 pr-10 pl-4 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#DCA846] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_5px_15px_rgba(220,168,70,0.2)]"
                            >
                              Download CSV
                            </a>
                          ) : (
                            <span className="text-slate-600 text-sm font-medium">Processing...</span>
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
    </div>
  );
}