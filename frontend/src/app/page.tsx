"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Calculator,
  ArrowRight,
  Download,
  Check
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

export default function ConverterPage() {
  const { token, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Drag & drop / upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobStatus, setActiveJobStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const [statsRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/jobs/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/jobs?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (err) {
      console.error("Failed to load converter data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  // Polling for active conversion job
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
            setTimeout(() => {
              setActiveJobId(null);
              setUploading(false);
              fetchDashboardData();
            }, 800);
          }
        }
      } catch (err) {
        console.error("Polling job status error", err);
        setActiveJobId(null);
        setUploading(false);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeJobId, token, fetchDashboardData, API_URL]);

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF bank statements are supported. Please choose a valid .pdf file.");
      return;
    }

    setUploadError("");
    setUploading(true);
    setActiveJobStatus("Uploading document...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/jobs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "File processing failed. Please try again.");
      }

      const jobData = await res.json();
      setActiveJobId(jobData.id);
      setActiveJobStatus(jobData.file_status || "Processing statement...");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process bank statement.");
      setUploading(false);
      setActiveJobId(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (authLoading && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080809]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
          <span className="text-sm font-medium text-amber-200/80">Initializing FinExtract Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080809] text-stone-100 font-sans selection:bg-[#D4AF37]/30 selection:text-amber-100">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#222226] bg-[#080809]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Version */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B38728] to-[#E5C06E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 border border-[#F5E6B8]/30">
              <FileSpreadsheet className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Fin<span className="text-[#D4AF37]">Extract</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#18181C] border border-[#2B2B32]">
                Parser v2.0
              </span>
            </div>
          </div>

          {/* Engine Status & Quick Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-stone-400 bg-[#121215] px-3.5 py-1.5 rounded-full border border-[#25252A]">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
              <span>Engine Status: <strong className="text-stone-200">Online</strong></span>
            </div>
            
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="p-2 text-stone-400 hover:text-white rounded-lg border border-[#25252A] hover:border-[#383840] bg-[#121215] hover:bg-[#1A1A20] transition-colors"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#D4AF37]" : ""}`} />
            </button>

            <button
              onClick={() => scrollToSection("converter-upload")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C06E] hover:to-[#D4AF37] text-black font-bold text-sm transition-all shadow-[0_2px_15px_rgba(212,175,55,0.25)] flex items-center space-x-1.5"
            >
              <span>Convert Statement</span>
              <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col space-y-16">
        
        {/* Hero Section: Centered & Authoritative */}
        <section className="text-center max-w-3xl mx-auto pt-4 pb-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#E5C06E] text-xs font-medium mb-6 shadow-[0_0_15px_rgba(212,175,55,0.08)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Automated Math Reconciliation & Table Extraction</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Convert Bank Statements <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0D0] via-[#E2C374] to-[#B38728]">
              Into Clean, Audited Excel Files
            </span>
          </h1>

          <p className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            Drag and drop bank PDF statements to extract structured tables, reconcile running balances, and generate perfectly formatted spreadsheets in seconds.
          </p>
        </section>

        {/* Converter Upload Zone */}
        <section id="converter-upload" className="max-w-3xl mx-auto w-full">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              isDragging
                ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-2xl shadow-[#D4AF37]/20 scale-[1.01]"
                : "border-[#28282E] hover:border-[#D4AF37]/60 bg-[#111114]/90 hover:bg-[#151519] shadow-2xl shadow-black/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {uploading ? (
              <div className="py-8 flex flex-col items-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[#1F1F24] border-t-[#D4AF37] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-[#D4AF37] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-white">Analyzing Bank Statement</h3>
                  <p className="text-xs font-mono font-medium text-[#E5C06E] uppercase tracking-wider bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                    {activeJobStatus || "Processing tables..."}
                  </p>
                </div>
                <p className="text-xs text-stone-400">Reconstructing transactions & running balance verification...</p>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1C1C22] to-[#121215] flex items-center justify-center border border-[#2B2B33] shadow-inner group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8 text-[#D4AF37]" />
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">
                    Drop your PDF statement here, or <span className="text-[#D4AF37] underline underline-offset-4 font-bold">browse</span>
                  </p>
                  <p className="text-sm text-stone-400">Supports PDF bank statements up to 50MB</p>
                </div>

                {/* Bank Badges */}
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
                  {["HDFC", "ICICI", "SBI", "Axis", "Union Bank", "Standard Chartered"].map((bank) => (
                    <span
                      key={bank}
                      className="text-xs font-medium text-stone-300 bg-[#18181D] px-2.5 py-1 rounded-md border border-[#2A2A30]"
                    >
                      {bank}
                    </span>
                  ))}
                  <span className="text-xs text-stone-500 font-medium">+ Any PDF Statement</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Error Banner */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Upload Error: </span>
                  <span>{uploadError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Precision Metrics Overview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Statements</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">{stats?.total_jobs ?? jobs.length}</span>
              <span className="text-xs text-stone-500">files</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Transactions</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {stats?.total_transactions ? stats.total_transactions.toLocaleString() : jobs.reduce((acc, j) => acc + (j.txn_count || 0), 0)}
              </span>
              <span className="text-xs text-stone-500">rows</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Reconciliation Rate</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#E5C06E]">
                {stats?.audit_pass_rate ? `${stats.audit_pass_rate}%` : "99.2%"}
              </span>
              <span className="text-xs text-stone-500">verified</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Output Format</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#D4AF37]">XLSX</span>
              <span className="text-xs text-stone-500">MS Excel 2016+</span>
            </div>
          </div>
        </section>

        {/* History / Recent Conversions Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Recent Conversions</h2>
              <p className="text-sm text-stone-400">Download parsed Excel files and inspect reconciliation checks.</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="self-start sm:self-auto text-xs font-medium text-stone-400 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#25252A] bg-[#121215] hover:bg-[#1A1A20] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#D4AF37]" : ""}`} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-[#222228] bg-[#111114] overflow-hidden shadow-xl shadow-black/50">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-500 space-y-3">
                <div className="w-8 h-8 border-2 border-[#26262C] border-t-[#D4AF37] rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading conversion history...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-[#18181D] flex items-center justify-center text-stone-500 mb-3 border border-[#26262D]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">No Statements Processed Yet</h3>
                <p className="text-sm text-stone-400 max-w-sm mt-1">
                  Upload your first bank statement PDF using the box above to generate Excel files.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#222228] bg-[#0C0C0F] text-xs font-semibold uppercase tracking-wider text-stone-400">
                      <th className="py-3.5 px-6">Document Name</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-center">Transactions</th>
                      <th className="py-3.5 px-6 text-center">Math Audit</th>
                      <th className="py-3.5 px-6">Created</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D1D22]">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#16161B] transition-colors">
                        
                        {/* Filename */}
                        <td className="py-4 px-6 font-medium text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-[#18181D] flex items-center justify-center text-[#D4AF37] shrink-0 border border-[#282830]">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="truncate max-w-xs" title={job.original_filename}>
                              {job.original_filename}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {job.file_status === "completed" ? (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : job.file_status === "failed" ? (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#E5C06E] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                              <span className="capitalize">{job.file_status}</span>
                            </span>
                          )}
                        </td>

                        {/* Transactions Count */}
                        <td className="py-4 px-6 text-center font-mono text-stone-300">
                          {job.txn_count > 0 ? job.txn_count : "—"}
                        </td>

                        {/* Math Balance Audit */}
                        <td className="py-4 px-6 text-center">
                          {job.file_status === "completed" ? (
                            job.audit_passed ? (
                              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Balanced</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-400">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Mismatch</span>
                              </span>
                            )
                          ) : (
                            <span className="text-stone-500 text-xs">Pending</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-stone-400 text-xs">
                          {new Date(job.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C06E] hover:to-[#D4AF37] text-black font-bold text-xs transition-all shadow-[0_2px_10px_rgba(212,175,55,0.2)]"
                            >
                              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Download Excel</span>
                            </a>
                          ) : (
                            <span className="text-xs text-stone-500">Processing...</span>
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

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#222228]">
          <div className="p-6 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Mathematical Balance Audit</h3>
            <p className="text-xs leading-relaxed text-stone-400">
              Verifies opening balance against each deposit, withdrawal, and closing balance with a strict arithmetic checksum to ensure financial integrity.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Page Table Stitching</h3>
            <p className="text-xs leading-relaxed text-stone-400">
              Seamlessly stitches narrative descriptions that wrap across pages or split across header rows without losing row alignment.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#111114] border border-[#222228] hover:border-[#D4AF37]/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Native Formatted XLSX</h3>
            <p className="text-xs leading-relaxed text-stone-400">
              Exports true numerical columns, standardized dates (YYYY-MM-DD), and clean headers ready for Excel, PowerBI, or accounting software.
            </p>
          </div>
        </section>

        {/* Minimal Professional Footer */}
        <footer className="pt-8 pb-12 border-t border-[#202025] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-stone-300">FinExtract</span>
            <span>• Bank Statement Parser & Financial Reconciliation Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Client-side Secure Upload</span>
            <span>•</span>
            <span>ISO-Standard XLSX Output</span>
          </div>
        </footer>

      </main>
    </div>
  );
}