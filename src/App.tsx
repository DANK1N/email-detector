/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { EmailData, AnalysisResponse, QuarantineLog, RiskLevel } from "./types";
import EmailForm from "./components/EmailForm";
import AnalysisDashboard from "./components/AnalysisDashboard";
import { ShieldAlert, ShieldCheck, MailWarning, History, Database, Search, AlertCircle, Info, Trash2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"analyze" | "logs">("analyze");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Storage for currently analyzed email details
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse | null>(null);
  const [originalEmail, setOriginalEmail] = useState<EmailData | null>(null);
  
  // History logs registry
  const [logs, setLogs] = useState<QuarantineLog[]>([]);

  // On mount: Seed mock historical logs if none exist, then load logs
  useEffect(() => {
    const existing = localStorage.getItem("quarantine_logs");
    if (!existing) {
      const mockLogs: QuarantineLog[] = [
        {
          id: "QRT-A8F9D",
          timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString("id-ID"), // 2 hours ago
          emailSubject: "[URGENT] Segera Verifikasi Kartu Kredit BCA Anda!",
          senderEmail: "verify[at]bca-security-update[dot]ru",
          riskLevel: RiskLevel.PHISHING,
          operatorName: "danangrafli54@gmail.com",
          approvedChecks: ["senderConfirmed", "linksInspected", "falsePositiveChecked", "policyAligned"],
          actionTaken: "Domain Blocked (bca-security-update.ru)",
          notes: "Tindakan disetujui secara manual. Terbukti domain phishing tiruan dari Rusia."
        },
        {
          id: "QRT-C1X4E",
          timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString("id-ID"), // 1 day ago
          emailSubject: "Klaim Hadiah 10 Miliar Anda Sekarang Juga Tanpa Biaya!",
          senderEmail: "rewards[at]pasar-promo-diskon[dot]net",
          riskLevel: RiskLevel.SPAM,
          operatorName: "system-auto@pmo.id",
          approvedChecks: ["senderConfirmed", "linksInspected", "policyAligned"],
          actionTaken: "Flagged as Server Spam",
          notes: "Laporan spam pemasaran massal mencurigakan dengan sapaan generik."
        }
      ];
      localStorage.setItem("quarantine_logs", JSON.stringify(mockLogs));
      setLogs(mockLogs);
    } else {
      setLogs(JSON.parse(existing));
    }
  }, []);

  const handleAnalyze = async (sanitizedData: EmailData, originalData: EmailData) => {
    setIsLoading(true);
    setError(null);
    setCurrentAnalysis(null);
    setOriginalEmail(originalData);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Terjadi kesalahan server saat memproses analisis.");
      }

      const results: AnalysisResponse = await response.json();
      setCurrentAnalysis(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungi API Analitik Keamanan Email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogAdded = (newLog: QuarantineLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat registri log karantina manual?")) {
      localStorage.removeItem("quarantine_logs");
      setLogs([]);
    }
  };

  const getRiskColorClass = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.PHISHING: return "text-rose-400 bg-rose-950/30 border-rose-900/40";
      case RiskLevel.SPAM: return "text-amber-400 bg-amber-950/30 border-amber-900/40";
      case RiskLevel.AMAN: return "text-emerald-400 bg-emerald-950/30 border-emerald-900/40";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-200 font-sans antialiased" id="application-root">
      {/* Top Banner Navigation bar */}
      <header className="bg-[#0F1116] border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo / Human literal branding */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-900/20">
                <MailWarning size={20} id="logo-icon" />
              </div>
              <div>
                <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
                  SentinelMail AI
                </h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Intelijen Deteksi Phishing & SOP Karantina Manual
                </p>
              </div>
            </div>

            {/* Platform Nav Tabs */}
            <div className="flex gap-1.5 bg-[#15171C] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("analyze")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "analyze"
                    ? "bg-[#1A1D24] text-white border border-slate-700/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Search size={14} className="text-indigo-400" />
                Analisis Email
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "logs"
                    ? "bg-[#1A1D24] text-white border border-slate-700/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <History size={14} className="text-indigo-400" />
                Registri Log Karantina ({logs.length})
              </button>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main body of the application */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === "analyze" ? (
          <div className="space-y-8">
            {/* Short overview explanation */}
            <div className="bg-[#15171C] text-slate-300 rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Pusat Deteksi SOC: Netralisir, Evaluasi & Karantina</h4>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Sistem ini secara instan menetralisir tautan mencurigakan (<code className="text-indigo-300">http</code> &rarr; <code className="text-indigo-300">hxxp</code>) sebelum diproses oleh model AI siber Gemini untuk meminimalkan risiko eksekusi link berbahaya, memvalidasi anomali, merangkum draf respons balasan, serta mengunduh ruleset karantina.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded px-2.5 py-1 uppercase shrink-0 font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                KEPATUHAN SIBER AKTIF
              </span>
            </div>

            {/* Step 1: Input form (always visible for analyzing) */}
            <EmailForm onAnalyze={handleAnalyze} isLoading={isLoading} />

            {/* Error notifications */}
            {error && (
              <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-200 flex gap-3 text-sm items-start shadow-inner">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <strong className="font-semibold block text-rose-300">Gagal Melakukan Analisis</strong>
                  <p className="text-xs text-rose-400 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Step 2: Analysis Results and Dashboard */}
            {currentAnalysis && originalEmail && (
              <div className="border-t border-slate-800 pt-8 mt-12 space-y-6">
                <div className="flex items-center gap-3 mb-2" id="results-anchor">
                  <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                  <div>
                    <h2 className="font-extrabold text-white text-lg tracking-tight">Hasil Analisis Keamanan & Validasi Tindakan</h2>
                    <p className="text-xs text-slate-400">Hasil audit Gemini Security SOC terhadap email yang dilaporkan.</p>
                  </div>
                </div>

                <AnalysisDashboard
                  analysis={currentAnalysis}
                  originalSubject={originalEmail.subject}
                  originalSender={originalEmail.senderDisplay ? `"${originalEmail.senderDisplay}" <${originalEmail.senderEmail}>` : originalEmail.senderEmail}
                  onLogAdded={handleLogAdded}
                />
              </div>
            )}
            
          </div>
        ) : (
          /* AUDIT LOGS VIEW */
          <div className="space-y-6">
            <div className="bg-[#15171C] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 mb-5">
                <div>
                  <h2 className="font-bold text-white text-lg flex items-center gap-2">
                    <Database size={20} className="text-indigo-400" />
                    Registri Log Karantina & Pemblokiran Server (Audit Kepatuhan)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Daftar tindakan manual yang divalidasi dan dijalankan oleh analis keamanan di tingkat server.</p>
                </div>

                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 rounded-lg transition-all focus:outline-none border border-rose-900/30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Hapus Seluruh Log
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-800 rounded-xl space-y-2 bg-[#0F1116]/40">
                  <p>Tidak ada registri log karantina yang tercatat saat ini.</p>
                  <p className="text-xs text-slate-500">Silakan lakukan verifikasi dan setujui tindakan manual di bagian bawah hasil deteksi email baru.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 bg-[#1A1D24]/40 hover:bg-[#1A1D24]/70 transition-all space-y-4 shadow-sm"
                    >
                      {/* Title line */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">[{log.id}]</span>
                          <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRiskColorClass(log.riskLevel)}`}>
                            {log.riskLevel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          Operator: <span className="font-semibold text-white">{log.operatorName}</span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Subjek Email:</span>
                            <span className="text-sm font-semibold text-white">{log.emailSubject}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pengirim:</span>
                            <span className="text-xs font-mono text-slate-300">{log.senderEmail}</span>
                          </div>
                        </div>

                        <div className="md:col-span-4 bg-[#0F1116] p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Aturan Server:</span>
                            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                              🛡️ {log.actionTaken}
                            </span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-slate-800/60">
                            <span className="text-[9px] text-slate-500 uppercase">Checklist Tervalidasi:</span>
                            <span className="text-[10px] font-semibold text-emerald-400 block">
                              ✓ {log.approvedChecks.length} Kriteria Terpenuhi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Justification note */}
                      <div className="p-3 bg-[#0F1116]/80 border border-slate-850 rounded-lg text-xs text-slate-300 italic">
                        <strong className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2 font-mono not-italic">Catatan / Justifikasi Analis:</strong>
                        "{log.notes}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-200 text-xs flex gap-3 leading-relaxed">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Kepatuhan Audit Regulasi:</strong>
                <p className="mt-1 text-emerald-400/80">
                  Seluruh log audit di atas disimpan secara lokal di repositori web browser ini (melalui localStorage) untuk keperluan simulasi dan demo SOC. Sesuai standard kepatuhan ISO 27001, logs verifikasi manual harus disinkronisasikan ke SIEM korporat secara berkala.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-slate-800 bg-[#0F1116] py-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 SentinelMail AI — Sistem Verifikasi & Karantina Siber Cepat Indonesia. Rekomendasi mail server tetap divalidasi oleh keputusan peninjau manusia.</p>
        </div>
      </footer>
    </div>
  );
}
