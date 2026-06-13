import React, { useState } from "react";
import { AnalysisResponse, QuarantineLog, RiskLevel } from "../types";
import ManualQuarantine from "./ManualQuarantine";
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Inbox, 
  FileText, 
  Clipboard, 
  ClipboardCheck, 
  Server, 
  UserX, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";

interface AnalysisDashboardProps {
  analysis: AnalysisResponse;
  originalSubject: string;
  originalSender: string;
  onLogAdded: (log: QuarantineLog) => void;
}

export default function AnalysisDashboard({ 
  analysis, 
  originalSubject, 
  originalSender,
  onLogAdded 
}: AnalysisDashboardProps) {
  const [copiedDraft, setCopiedDraft] = useState(false);

  const getRiskBadgeStyles = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.PHISHING:
        return "bg-rose-950/40 border-rose-900/50 text-rose-400 ring-rose-500/10";
      case RiskLevel.SPAM:
        return "bg-amber-950/40 border-amber-900/50 text-amber-400 ring-amber-500/10";
      case RiskLevel.AMAN:
        return "bg-emerald-950/40 border-emerald-900/50 text-emerald-400 ring-emerald-500/10";
      default:
        return "bg-[#1A1D24] border-slate-850 text-slate-300 ring-gray-500/10";
    }
  };

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.PHISHING: return "bg-rose-500";
      case RiskLevel.SPAM: return "bg-amber-500";
      case RiskLevel.AMAN: return "bg-emerald-500";
    }
  };

  const getSeverityBadge = (severity: "HIGH" | "MEDIUM" | "LOW") => {
    switch (severity) {
      case "HIGH":
        return "bg-rose-950/40 text-rose-400 border-rose-900/30";
      case "MEDIUM":
        return "bg-amber-950/40 text-amber-400 border-amber-900/30";
      case "LOW":
        return "bg-[#15171C] text-indigo-400 border-slate-800";
    }
  };

  const handleCopyDraft = () => {
    const fullDraft = `Subject: ${analysis.draftReply.subject}\n\n${analysis.draftReply.body}`;
    navigator.clipboard.writeText(fullDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="space-y-6" id="analysis-dashboard-section">
      
      {/* Top Threat Meter and Brief Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk meter Box */}
        <div className="md:col-span-1 bg-[#15171C] rounded-xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Penilaian Risiko AI
            </span>
            <div className="flex items-center gap-3 mb-4">
              <div className={`text-2xl font-black px-4 py-2 rounded-xl uppercase border ${getRiskBadgeStyles(analysis.riskLevel)}`}>
                {analysis.riskLevel}
              </div>
            </div>

            {/* Circular score visualization */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {analysis.riskScore}%
                </span>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-350">Skor Kerentanan Ancaman</span>
                <div className="w-full bg-[#0F1116] h-2.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getRiskBg(analysis.riskLevel)}`}
                    style={{ width: `${analysis.riskScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400 leading-normal">
            {analysis.riskLevel === RiskLevel.PHISHING ? (
              <>
                <ShieldAlert className="text-rose-500 shrink-0" size={16} />
                <span className="text-rose-400 font-medium">Sangat Berbahaya! Hindari interaksi tautan.</span>
              </>
            ) : analysis.riskLevel === RiskLevel.SPAM ? (
              <>
                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                <span className="text-amber-400 font-medium font-mono text-[11px]">Kategori spam promosi berulang.</span>
              </>
            ) : (
              <>
                <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
                <span className="text-emerald-400 font-medium">Email aman didisposisikan ke kotak masuk.</span>
              </>
            )}
          </div>
        </div>

        {/* Short Executive Summary Box */}
        <div className="md:col-span-2 bg-[#1A1D24] text-white rounded-xl p-6 flex flex-col justify-between shadow-xl border border-slate-800">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Ringkasan Eksekutif Keamanan Cyber (SOC)
              </span>
              <span className="text-[10px] text-teal-400 bg-teal-950/40 font-bold tracking-widest px-2 py-0.5 rounded border border-teal-850 uppercase font-mono">
                Model: {analysis.modelUsed || "3.5-flash"}
              </span>
            </div>
            <p className="text-sm font-normal text-slate-200 leading-relaxed italic">
              "{analysis.summary}"
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800 mt-4 text-[10px] font-mono text-slate-400 uppercase">
            <span>Subject: {originalSubject.substring(0, 40)}{originalSubject.length > 40 ? "..." : ""}</span>
            <span className="text-slate-700">•</span>
            <span>Pengirim: {originalSender}</span>
          </div>
        </div>
      </div>

      {/* Analysis Indicators Grid */}
      <div className="bg-[#15171C] rounded-xl border border-slate-800 p-6 shadow-xl">
        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-indigo-400" />
          Detail Indikator Kecurigaan Yang Ditemukan
        </h3>

        {analysis.indicators.length === 0 ? (
          <div className="p-6 bg-[#0F1116] border border-slate-800/80 rounded-xl text-center text-slate-400 text-sm">
            🛡️ Tidak ada indikator ancaman mencurigakan terdeteksi dalam pesan ini. Email ini dinilai sepenuhnya aman.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.indicators.map((indicator, index) => (
              <div 
                key={index}
                className="border border-slate-800/80 bg-[#1A1D24]/40 hover:bg-[#1A1D24]/80 p-4 rounded-xl flex flex-col justify-between gap-3 transition-colors text-slate-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">{indicator.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(indicator.severity)}`}>
                      {indicator.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-350 mt-1.5 leading-normal">
                    {indicator.description}
                  </p>
                </div>

                {indicator.evidence && (
                  <div className="bg-[#0D0E12] p-2.5 rounded border border-slate-800/60 font-mono text-[10px] text-indigo-300 leading-relaxed select-text uppercase tracking-tight">
                    <span className="font-bold text-[9px] text-slate-500 block mb-1">BUKTI HEADER/TEKS:</span>
                    {indicator.evidence}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draft Reply Area */}
      <div className="bg-[#15171C] rounded-xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-950/50 text-indigo-400 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Draf Balasan Tim SOC Untuk Pelapor</h3>
              <p className="text-xs text-slate-400">Salin draf tanggapan ini untuk dikirimkan kembali kepada karyawan yang menyetor laporan.</p>
            </div>
          </div>

          <button
            onClick={handleCopyDraft}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1D24] text-slate-300 rounded-lg border border-slate-850 hover:bg-[#15171C] transition-all focus:outline-none cursor-pointer text-xs font-semibold"
          >
            {copiedDraft ? (
              <>
                <ClipboardCheck size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Clipboard size={14} />
                <span>Salin Draft</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#0F1116] rounded-xl p-5 border border-slate-850 space-y-3 font-sans text-sm text-slate-200 leading-relaxed shadow-inner">
          <div className="flex border-b border-slate-800 pb-2.5">
            <strong className="text-xs font-semibold text-slate-400 w-20 uppercase tracking-widest shrink-0 mt-0.5">Subjek:</strong>
            <span className="text-white font-semibold text-xs leading-normal">{analysis.draftReply.subject}</span>
          </div>
          <div className="pt-1 whitespace-pre-wrap font-mono text-[11px] text-slate-300 leading-relaxed select-text bg-[#0A0B0E] p-3 rounded-lg border border-slate-850 max-h-[300px] overflow-y-auto">
            {analysis.draftReply.body}
          </div>
        </div>
      </div>

      {/* Manual Server-level actions Validator tool Integration */}
      <ManualQuarantine
        analysis={analysis}
        emailSubject={originalSubject}
        senderEmail={originalSender}
        onLogAdded={onLogAdded}
      />
      
    </div>
  );
}
