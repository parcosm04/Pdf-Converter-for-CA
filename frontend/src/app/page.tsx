"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Clock, 
  ArrowRightLeft, FileSpreadsheet, Download, LogOut, Landmark, User
} from "lucide-react";

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

  const API_URL = "http://localhost:8000/api/v1";

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Fetch statistics
      const statsRes = await fetch(`${API_URL}/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch jobs list
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
  }, [token]);

  // Load stats and job history
  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token, fetchDashboardData]);

  // Poll status of active uploads
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
  }, [activeJobId, token, fetchDashboardData]);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <Landmark className="mx-auto h-10 w-10 animate-pulse text-blue-500" />
          <p className="mt-4 text-sm text-slate-400">Loading console interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Landmark className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-lg tracking-wider text-white">UBSP CONSOLE</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-400">
              <User className="h-4 w-4 text-slate-500" />
              <span>{user.email}</span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-sm font-semibold text-rose-500 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* KPI metrics cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-sm font-medium text-slate-500">Statements Processed</span>
              <div className="flex items-baseline space-x-2 mt-4">
                <span className="text-3xl font-bold text-white">{stats.total_jobs}</span>
                <span className="text-xs text-slate-500">total tasks</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-sm font-medium text-slate-500">Audit Pass Rate</span>
              <div className="flex items-baseline space-x-2 mt-4">
                <span className="text-3xl font-bold text-emerald-400">{stats.audit_pass_rate}%</span>
                <span className="text-xs text-slate-500">math validated</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-sm font-medium text-slate-500">Parsed Transactions</span>
              <div className="flex items-baseline space-x-2 mt-4">
                <span className="text-3xl font-bold text-blue-400">
                  {stats.total_transactions.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">records structured</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-sm font-medium text-slate-500">Failed Tasks</span>
              <div className="flex items-baseline space-x-2 mt-4">
                <span className={`text-3xl font-bold ${stats.failed_jobs > 0 ? "text-rose-400" : "text-slate-400"}`}>
                  {stats.failed_jobs}
                </span>
                <span className="text-xs text-slate-500">exceptions</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload & Active job module */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white tracking-wide">Import Statement</h3>
            
            {uploading ? (
              <div className="bg-slate-900/50 border border-blue-500/20 rounded-2xl p-8 text-center space-y-4">
                <div className="flex items-center justify-center text-blue-500 animate-spin">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white">Analyzing Layout and Table Structures</h4>
                  <p className="text-sm text-slate-400 capitalize">Current state: {activeJobStatus}</p>
                </div>
                <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 animate-pulse" 
                    style={{ 
                      width: activeJobStatus === "processing" ? "75%" : 
                             activeJobStatus === "completed" ? "100%" : "25%" 
                    }} 
                  />
                </div>
              </div>
            ) : (
              <div className="relative group border-2 border-dashed border-slate-800 hover:border-blue-500/30 rounded-2xl bg-slate-900/20 p-10 text-center transition flex flex-col items-center justify-center cursor-pointer">
                <Upload className="h-10 w-10 text-slate-500 group-hover:text-blue-500 transition mb-4" />
                <span className="text-sm font-semibold text-white">Drag & drop bank statement PDF</span>
                <span className="text-xs text-slate-500 mt-1">Accepts standard digital bank PDFs up to 50MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm">
                {uploadError}
              </div>
            )}
          </div>

          {/* Quick guide Panel */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-white tracking-wide">Parser Capabilities</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5" />
                <span>Supports HDFC, ICICI, and custom layouts</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5" />
                <span>Multi-line narration paragraph merging</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5" />
                <span>Reconciles opening/closing balances</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5" />
                <span>Prunes data automatically after 24 hrs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Jobs history list */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-wide">Processing History</h3>

          {loading ? (
            <div className="text-center py-10 text-sm text-slate-500">Querying parser records...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No files processed yet. Upload your first statement above.
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Statement File</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Txns</th>
                      <th className="py-4 px-6">Opening Balance</th>
                      <th className="py-4 px-6">Closing Balance</th>
                      <th className="py-4 px-6">Balance Match</th>
                      <th className="py-4 px-6">Processed Date</th>
                      <th className="py-4 px-6 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6 flex items-center space-x-2.5 font-medium text-white">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="truncate max-w-[200px]">{job.original_filename}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                            job.file_status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            job.file_status === "failed" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                            "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}>
                            {job.file_status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {job.file_status === "failed" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {job.file_status !== "completed" && job.file_status !== "failed" && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                            {job.file_status}
                          </span>
                        </td>
                        <td className="py-4 px-6">{job.txn_count > 0 ? job.txn_count : "-"}</td>
                        <td className="py-4 px-6">{formatCurrency(job.opening_balance)}</td>
                        <td className="py-4 px-6">{formatCurrency(job.closing_balance)}</td>
                        <td className="py-4 px-6">
                          {job.file_status === "completed" ? (
                            <span className={`inline-flex items-center font-semibold text-xs ${job.audit_passed ? "text-emerald-400" : "text-rose-400"}`}>
                              {job.audit_passed ? "YES" : "NO"}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {job.file_status === "completed" ? (
                            <a
                              href={`${API_URL}/jobs/${job.id}/download?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white transition-colors"
                              title="Download Styled Excel Workbook"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          ) : (
                            <button disabled className="p-2 text-slate-700 cursor-not-allowed">
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950 mt-auto">
        <p>&copy; {new Date().getFullYear()} Universal Bank Statement Parser (UBSP). Designed for enterprise financial reconciliation.</p>
      </footer>
    </div>
  );
}
