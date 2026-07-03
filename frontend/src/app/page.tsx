"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  Download, LogOut, User, Sparkles
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

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#18181a]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[#E5C158]"
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#18181a] text-slate-100 font-sans overflow-x-hidden selection:bg-[#E5C158]/30">
      
      {/* Soft, minimal radial glow matching the reference image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[60vw] h-[60vw] bg-[#E5C158] opacity-[0.03] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold tracking-tight text-2xl text-white">FinExtract</span>
          </div>
          
          <div className="flex items-center space-x-8 text-sm text-slate-400 font-medium">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-4 w-4 text-[#E5C158]" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2 rounded-lg border border-slate-700 hover:border-[#E5C158] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center">
        
        {/* Centered Hero & Upload Block */}
        <section className="w-full flex flex-col items-center text-center space-y-12">
          
          {/* Typography */}
          <div className="max-w-2xl space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-semibold tracking-tight text-white leading-tight"
            >
              Fast And Simple <br /> Data Extraction
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 font-light leading-relaxed max-w-lg mx-auto"
            >
              Upload your financial statements to instantly extract, reconcile, and validate transaction data with high precision.
            </motion.p>
          </div>

          {/* Clean, Centered Upload Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="rounded-2xl border border-slate-800 bg-[#1e1e20] p-8 shadow-2xl relative overflow-hidden transition-all hover:border-slate-600">
              {uploading ? (
                <div className="py-8 text-center space-y-5">
                  <div className="flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-[#E5C158]" />
                    </motion.div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">Processing Document</h4>
                    <p className="text-sm text-[#E5C158] uppercase tracking-widest mt-1">{activeJobStatus}</p>
                    
                    {activeJobStatus === "completed" && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-emerald-400 text-sm mt-3 font-medium"
                      >
                        Wait for some time to get Excel download below
                      </motion.p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center cursor-pointer group">
                  <div className="h-16 w-16 bg-[#2a2a2d] rounded-full flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-[#333336] transition-all">
                    <Upload className="h-6 w-6 text-[#E5C158]" />
                  </div>
                  <span className="text-xl font-medium text-white mb-2">Initialize Extraction</span>
                  <span className="text-sm text-slate-500">Click or drag PDF (up to 50MB)</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />
                </div>
              )}

              {uploadError && (
                <div className="mt-4 border-t border-slate-800 pt-4 flex items-center justify-center space-x-2 text-rose-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Minimalist Stats Row (Styled like the '01 Financial Transaction' in reference) */}
        {stats && (
          <section className="w-full mt-24">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-slate-800 pt-12">
              {[
                { id: "01", label: "Documents Processed", value: stats.total_jobs },
                { id: "02", label: "Accuracy Rate", value: `${stats.audit_pass_rate}%` },
                { id: "03", label: "Total Transactions", value: stats.total_transactions },
                { id: "04", label: "Failed Extractions", value: stats.failed_jobs }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[#E5C158] font-semibold text-lg mb-1">{stat.id}</span>
                  <span className="text-white font-medium text-base mb-1">{stat.label}</span>
                  <span className="text-slate-400 text-sm">{stat.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Minimalist Table */}
        <section className="w-full mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-white">Recent Extractions</h2>
          </div>

          <div className="w-full overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Loading records...</div>
            ) : jobs.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No extractions found. Upload a document to start.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-sm font-medium">
                      <th className="pb-4 pr-6 font-normal">Source Document</th>
                      <th className="pb-4 px-6 font-normal">Status</th>
                      <th className="pb-4 px-6 font-normal">Entries</th>
                      <th className="pb-4 px-6 font-normal">Validation</th>
                      <th className="pb-4 px-6 font-normal">Date</th>
                      <th className="pb-4 pl-6 text-right font-normal">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-300">
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-800/50 hover:bg-[#1e1e20]/50 transition-colors">
                        <td className="py-5 pr-6 font-medium text-white flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="truncate max-w-[200px]">{job.original_filename}</span>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`capitalize ${
                            job.file_status === "completed" ? "text-[#E5C158]" :
                            job.file_status === "failed" ? "text-rose-400" :
                            "text-slate-400"
                          }`}>
                            {job.file_status}
                          </span>
                        </td>
                        <td className="py-5 px-6">{job.txn_count > 0 ? job.txn_count : "-"}</td>
                        <td className="py-5 px-6">
                          {job.file_status === "completed" ? (
                            <span className={job.audit_passed ? "text-emerald-400" : "text-rose-400"}>
                              {job.audit_passed ? "Valid" : "Mismatch"}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-5 px-6 text-slate-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-5 pl-6 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex px-4 py-1.5 rounded bg-[#E5C158]/10 text-[#E5C158] hover:bg-[#E5C158]/20 transition-colors font-medium text-xs"
                            >
                              Download Excel
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">Pending</span>
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

      <footer className="mt-20 border-t border-slate-800/50 py-8">
        <div className="max-w-[1000px] mx-auto px-6 text-center text-sm text-slate-600">
          &copy; {new Date().getFullYear()} FinExtract Solution. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
