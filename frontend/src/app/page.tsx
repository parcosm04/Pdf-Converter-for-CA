"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  Download, LogOut, User, Check
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

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

// 4-point star component
const SparkleStar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="currentColor"/>
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
      <div className="flex min-h-screen items-center justify-center bg-[#2B2B2B]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-[#DCA846]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#2A2A28] text-white font-sans overflow-x-hidden selection:bg-[#DCA846]/30">
      
      {/* Heavy Gold Radial Glow (Matches Dilocash) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[-10%] w-[70vw] h-[70vw] bg-[#DCA846] opacity-[0.15] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] bg-[#DCA846] opacity-[0.05] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Decorative Stars */}
      <SparkleStar className="absolute top-[22%] left-[40%] w-6 h-6 text-[#DCA846] opacity-80 z-0 animate-pulse" />
      <SparkleStar className="absolute top-[30%] right-[15%] w-4 h-4 text-[#DCA846] opacity-60 z-0 animate-pulse" style={{ animationDelay: '1s' }} />
      <SparkleStar className="absolute bottom-[35%] left-[30%] w-4 h-4 text-[#DCA846] opacity-40 z-0 animate-pulse" style={{ animationDelay: '2s' }} />
      <SparkleStar className="absolute bottom-[25%] right-[25%] w-5 h-5 text-[#DCA846] opacity-70 z-0 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Header */}
      <header className="relative z-20 w-full pt-8 pb-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-2xl text-white">
              Fin<span className="text-[#DCA846]">Extract</span>
            </span>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Service</a>
            <a href="#" className="hover:text-white transition-colors">How It Work</a>
            <a href="#" className="hover:text-white transition-colors">Benefits</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4 text-sm font-medium">
            <div className="hidden sm:flex items-center space-x-2 text-slate-300 mr-4">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2.5 rounded-lg border border-[#DCA846] text-[#DCA846] hover:bg-[#DCA846] hover:text-[#2A2A28] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 py-12 lg:py-20 flex flex-col">
        
        {/* Split Hero Layout */}
        <section className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 mb-24">
          
          {/* Left Text & CTA */}
          <div className="w-full lg:w-[55%] flex flex-col z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              Fast And Simple <br /> Data Extraction <br /> Solution
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-10 font-light"
            >
              Many financial statements are lost in unstructured formats. But, these documents can still be fully utilized. This platform provides you with an automated system to extract, reconcile, and validate transaction information seamlessly.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 mb-20"
            >
              <button 
                onClick={() => document.getElementById('upload-input')?.click()}
                className="px-8 py-3.5 bg-[#DCA846] text-[#2A2A28] font-semibold rounded-md hover:bg-[#e0b45c] transition-colors shadow-lg shadow-[#DCA846]/20"
              >
                Get It Now
              </button>
              <button 
                onClick={scrollToTable}
                className="px-8 py-3.5 border border-[#DCA846] text-[#DCA846] font-semibold rounded-md hover:bg-[#DCA846]/10 transition-colors"
              >
                View History
              </button>
            </motion.div>

            {/* Bottom Left Stats (01 and 02 blocks) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-12"
            >
              <div className="flex flex-col max-w-[200px]">
                <span className="text-[#DCA846] font-bold text-lg mb-1">01</span>
                <span className="text-white font-semibold text-base mb-2">Financial Parsing</span>
                <span className="text-slate-400 text-xs leading-relaxed">Manage everything from the internal app or website</span>
              </div>
              <div className="flex flex-col max-w-[200px]">
                <span className="text-[#DCA846] font-bold text-lg mb-1">02</span>
                <span className="text-white font-semibold text-base mb-2">Easy To Use System</span>
                <span className="text-slate-400 text-xs leading-relaxed">Each upload has its own unique parsed balance details</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side Extraction Block (Main Focus) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full lg:w-[45%] relative flex justify-center lg:justify-end items-center"
          >
            {/* Circular Text Badge */}
            <div className="absolute -left-12 bottom-12 w-32 h-32 z-20 hidden md:flex items-center justify-center">
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#DCA846] fill-current">
                  <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                  <text className="text-[10.5px] font-bold uppercase tracking-widest">
                    <textPath href="#circlePath">
                      extraction solution your one stop • 
                    </textPath>
                  </text>
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#DCA846] flex items-center justify-center z-10">
                <Check className="w-5 h-5 text-[#2A2A28]" />
              </div>
            </div>

            {/* Active Users Block */}
            <div className="absolute -bottom-6 right-0 z-20 flex items-center bg-[#DCA846]/10 backdrop-blur-md border border-[#DCA846]/30 rounded-md p-3 shadow-2xl">
              <div className="bg-[#DCA846] text-[#2A2A28] font-bold text-xl px-3 py-1 rounded-sm mr-4">
                {stats?.total_jobs ? `${stats.total_jobs}K` : '1.24M'}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex -space-x-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-slate-300 border border-[#2A2A28] flex items-center justify-center overflow-hidden">
                     <div className="w-full h-full bg-blue-500" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-300 border border-[#2A2A28] flex items-center justify-center overflow-hidden">
                     <div className="w-full h-full bg-emerald-500" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#DCA846] border border-[#2A2A28] flex items-center justify-center text-[10px] font-bold text-[#2A2A28]">+</div>
                </div>
                <span className="text-[10px] text-slate-300">World Active User</span>
              </div>
            </div>

            {/* Main Dropzone / Card */}
            <div className="w-full max-w-[420px] rounded-2xl bg-[#1A1A1A] border border-slate-700 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#DCA846] transition-colors duration-500 z-10">
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-white">Extraction Node</span>
                <Sparkles className="w-5 h-5 text-[#DCA846]" />
              </div>

              {uploading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#DCA846]" />
                  </motion.div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-semibold text-white">Processing Data</h4>
                    <p className="text-sm text-[#DCA846] uppercase tracking-widest">{activeJobStatus}</p>
                    
                    {activeJobStatus === "completed" && (
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-emerald-400 text-sm font-medium mt-4 bg-emerald-400/10 px-4 py-2 rounded-lg"
                      >
                        Wait for some time to get Excel download below
                      </motion.p>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('upload-input')?.click()}
                  className="py-12 border-2 border-dashed border-slate-700 rounded-xl hover:border-[#DCA846] hover:bg-[#DCA846]/5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                >
                  <div className="w-20 h-20 rounded-full bg-[#2A2A28] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(220,168,70,0.2)] transition-all">
                    <Upload className="w-8 h-8 text-[#DCA846]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Drop PDF Here</h3>
                  <p className="text-sm text-slate-400">Up to 50MB per file</p>
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
                <div className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Minimal Table Section */}
        <section id="history-table" className="w-full mt-24 z-10 pt-10 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Extraction History</h2>
              <p className="text-slate-400 text-sm">View and download your recently processed financial data.</p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-2 bg-[#1A1A1A] border border-slate-700 px-4 py-2 rounded-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-white uppercase tracking-wider font-semibold">System Online</span>
            </div>
          </div>

          <div className="w-full rounded-xl bg-[#1A1A1A] border border-slate-700 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#DCA846] animate-spin mb-4" />
                <span>Loading records...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p>No extractions found. Upload a document to start.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-700 bg-[#222222]">
                      <th className="py-5 pl-8 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Source Document</th>
                      <th className="py-5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="py-5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Entries</th>
                      <th className="py-5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Validation</th>
                      <th className="py-5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                      <th className="py-5 pr-8 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#222222] transition-colors group">
                        <td className="py-5 pl-8 pr-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-[#2A2A28] border border-slate-700 flex items-center justify-center group-hover:border-[#DCA846]/50 transition-colors">
                              <FileText className="w-5 h-5 text-[#DCA846]" />
                            </div>
                            <span className="font-medium text-white truncate max-w-[250px]">{job.original_filename}</span>
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            job.file_status === "completed" ? "bg-[#DCA846]/10 border-[#DCA846]/20 text-[#DCA846]" :
                            job.file_status === "failed" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                            "bg-slate-700/50 border-slate-600 text-slate-300"
                          }`}>
                            {job.file_status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {job.file_status === "failed" && <AlertTriangle className="w-3.5 h-3.5" />}
                            {job.file_status !== "completed" && job.file_status !== "failed" && <Clock className="w-3.5 h-3.5 animate-spin" />}
                            <span>{job.file_status}</span>
                          </span>
                        </td>
                        <td className="py-5 px-4 font-mono text-slate-300">{job.txn_count > 0 ? job.txn_count : "---"}</td>
                        <td className="py-5 px-4">
                          {job.file_status === "completed" ? (
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${job.audit_passed ? "bg-emerald-400" : "bg-rose-400"}`} />
                              <span className="text-sm font-medium text-slate-300">{job.audit_passed ? "Valid" : "Mismatch"}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">Pending</span>
                          )}
                        </td>
                        <td className="py-5 px-4 text-sm text-slate-400">
                          {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-5 pr-8 pl-4 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#DCA846] text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-[#e0b45c] transition-colors shadow-lg shadow-[#DCA846]/10"
                            >
                              Download CSV
                            </a>
                          ) : (
                            <button disabled className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed">
                              Processing
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
      <footer className="w-full border-t border-slate-700/50 mt-20 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 font-medium">
          <span>&copy; {new Date().getFullYear()} FinExtract Solution.</span>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
