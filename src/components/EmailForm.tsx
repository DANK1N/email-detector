import React, { useState, useEffect } from "react";
import { EmailData } from "../types";
import { parseRawEmail, sanitizeEmailData } from "../utils/sanitizer";
import { SAMPLE_EMAILS } from "../utils/samples";
import { UploadCloud, FileText, AlertCircle, Sparkles, AlertTriangle, Eye, ShieldCheck, Mail, Info, FileCode } from "lucide-react";

interface EmailFormProps {
  onAnalyze: (sanitizedData: EmailData, originalData: EmailData) => void;
  isLoading: boolean;
}

export default function EmailForm({ onAnalyze, isLoading }: EmailFormProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "structured">("raw");
  
  // RAW email state
  const [rawText, setRawText] = useState("");
  
  // Structured email states
  const [emailState, setEmailState] = useState<EmailData>({
    senderDisplay: "",
    senderEmail: "",
    recipientEmail: "",
    returnPath: "",
    subject: "",
    body: "",
    attachments: "",
    links: ""
  });

  const [isDragging, setIsDragging] = useState(false);

  // Automatically update structured fields when RAW email is edited
  useEffect(() => {
    if (activeTab === "raw") {
      const parsed = parseRawEmail(rawText);
      setEmailState(parsed);
    }
  }, [rawText, activeTab]);

  // Handle file drop to read raw content
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setRawText(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadSample = (sampleId: string) => {
    const sample = SAMPLE_EMAILS.find(s => s.id === sampleId);
    if (sample) {
      if (activeTab === "raw") {
        // Build a mock raw header + body text block
        const mockRaw = `Return-Path: <${sample.data.returnPath}>
From: "${sample.data.senderDisplay}" <${sample.data.senderEmail}>
To: <${sample.data.recipientEmail}>
Subject: ${sample.data.subject}

${sample.data.body}`;
        setRawText(mockRaw);
      } else {
        setEmailState(sample.data);
      }
    }
  };

  // Run sanitization for preview
  const sanitized = sanitizeEmailData(emailState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate we have at least subject and body
    if (!emailState.body.trim()) {
      alert("Isi pesan email (body) tidak boleh kosong untuk dianalisis!");
      return;
    }
    // Perform analysis with Sanitized Data ONLY (complying strictly with rule)
    onAnalyze(sanitized, emailState);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="email-form-section">
      {/* Left panel: Input Options */}
      <div className="lg:col-span-7 bg-[#15171C] rounded-xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div>
              <h2 className="font-bold text-white text-xl tracking-tight">Karantina & Input Data Email</h2>
              <p className="text-xs text-slate-400 mt-1">Tulis atau paste draf email mencurigakan untuk dievaluasi oleh SOC AI.</p>
            </div>
            <ShieldCheck className="text-indigo-400 h-6 w-6" />
          </div>

          {/* Quick Samples Section */}
          <div className="mb-6">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Pilih Skenario Contoh Uji (Analisis Instan):
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_EMAILS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadSample(s.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    s.expectedRisk === "PHISHING"
                      ? "bg-rose-950/20 border-rose-900/40 text-rose-300 hover:bg-rose-900/30"
                      : s.expectedRisk === "SPAM"
                      ? "bg-amber-950/20 border-amber-900/40 text-amber-300 hover:bg-amber-900/30"
                      : "bg-emerald-950/20 border-emerald-900/40 text-emerald-300 hover:bg-emerald-900/30"
                  }`}
                >
                  🎯 {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Tabs Selector */}
          <div className="flex bg-[#0F1116] p-1 rounded-xl mb-5 border border-slate-805/80">
            <button
              onClick={() => setActiveTab("raw")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "raw"
                  ? "bg-[#1A1D24] text-white border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode size={14} className="text-indigo-400" />
              Teks Mentah (Raw Email)
            </button>
            <button
              onClick={() => setActiveTab("structured")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "structured"
                  ? "bg-[#1A1D24] text-white border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail size={14} className="text-indigo-400" />
              Kolom Terstruktur
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "raw" ? (
              /* RAW TEXT AREA & DRAG-AND-DROP FILE */
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-950/30"
                      : "border-slate-850 hover:border-slate-800 bg-[#0F1116]/40"
                  }`}
                >
                  <UploadCloud className="mx-auto text-indigo-400/80 mb-2" size={28} />
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Tempel teks mentah email di bawah, atau drag & drop file <span className="font-semibold text-indigo-400 hover:underline">.txt/.eml</span> ke sini
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Salin & Tempel Seluruh Isi Email (Header + Body):
                  </label>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Contoh format input teks raw:
Return-Path: <spoof@bca-scam.ru>
From: "Klik BCA" <bcasupport@yahoo.com>
To: <target@indonesia.id>
Subject: Rekening Anda Terblokir

Silakan klik: http://klikbca-scam.ru`}
                    className="w-full px-3.5 py-2.5 bg-[#0F1116] border border-slate-800 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-inner text-slate-100"
                  />
                </div>
              </div>
            ) : (
              /* STRUCTURED INPUT FIELDS */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Display Name Pengirim
                    </label>
                    <input
                      type="text"
                      value={emailState.senderDisplay}
                      onChange={(e) => setEmailState({ ...emailState, senderDisplay: e.target.value })}
                      placeholder="E.g., Bank Indonesia"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Email Asli Pengirim
                    </label>
                    <input
                      type="text"
                      value={emailState.senderEmail}
                      onChange={(e) => setEmailState({ ...emailState, senderEmail: e.target.value })}
                      placeholder="E.g., security@bank-indonesia.com"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Return-Path Header
                    </label>
                    <input
                      type="text"
                      value={emailState.returnPath}
                      onChange={(e) => setEmailState({ ...emailState, returnPath: e.target.value })}
                      placeholder="E.g., bounce@host-server.ru"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Email Penerima (To)
                    </label>
                    <input
                      type="text"
                      value={emailState.recipientEmail}
                      onChange={(e) => setEmailState({ ...emailState, recipientEmail: e.target.value })}
                      placeholder="E.g., staff@indonesia.id"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    value={emailState.subject}
                    onChange={(e) => setEmailState({ ...emailState, subject: e.target.value })}
                    placeholder="E.g., [PENTING] Validasi Rekening klikBCA"
                    className="w-full px-3 py-2.5 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Lampiran / Attachments (Pisahkan Koma)
                    </label>
                    <input
                      type="text"
                      value={emailState.attachments}
                      onChange={(e) => setEmailState({ ...emailState, attachments: e.target.value })}
                      placeholder="E.g., invoice.pdf.exe, report.docx"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Daftar URL / Tautan (Pisahkan Koma)
                    </label>
                    <input
                      type="text"
                      value={emailState.links}
                      onChange={(e) => setEmailState({ ...emailState, links: e.target.value })}
                      placeholder="E.g., http://klikbca-portal-login.net"
                      className="w-full px-3 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Isi Pesan Email (Body Text)
                  </label>
                  <textarea
                    rows={6}
                    value={emailState.body}
                    onChange={(e) => setEmailState({ ...emailState, body: e.target.value })}
                    placeholder="Salin teks badan email di sini..."
                    className="w-full px-3.5 py-2 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Submit button layout */}
        <div className="border-t border-slate-800 pt-5 mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !emailState.body.trim()}
            className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isLoading || !emailState.body.trim()
                ? "bg-[#1A1D24] text-slate-500 cursor-not-allowed border border-slate-800"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40 hover:shadow-indigo-900/30 font-bold"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Mengevaluasi Email Via AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analisis Keamanan Email & Hasilkan Hasil</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right panel: Sanitized Live Preview */}
      <div className="lg:col-span-5 bg-[#0F1116] text-slate-200 rounded-xl p-6 flex flex-col justify-between border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mb-5">
            <Eye size={20} className="text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base tracking-wide">Representasi Teks Netral & Aman</h3>
              <p className="text-[11px] text-slate-400 font-medium">Aturan Pencegahan: Tautan Aktif dan File Otomatis Dimatikan.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Headers preview info */}
            <div className="grid grid-cols-1 gap-2.5 bg-[#15171C]/80 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px]">
              <div className="flex items-start gap-1">
                <span className="text-amber-400 font-semibold w-24 shrink-0">Return-Path:</span>
                <span className="text-slate-300 break-all">{sanitized.returnPath || "—"}</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-amber-400 font-semibold w-24 shrink-0">From:</span>
                <span className="text-slate-300 break-all">
                  {sanitized.senderDisplay ? `"${sanitized.senderDisplay}" ` : ""}
                  {sanitized.senderEmail ? `<${sanitized.senderEmail}>` : "—"}
                </span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-amber-400 font-semibold w-24 shrink-0">To:</span>
                <span className="text-slate-300 break-all">{sanitized.recipientEmail || "—"}</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-amber-400 font-semibold w-24 shrink-0">Subject:</span>
                <span className="text-white break-all font-semibold">{sanitized.subject || "—"}</span>
              </div>
            </div>

            {/* Sanitized Body Preview */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sanitasi Isi Pesan (Body):
              </span>
              <div className="bg-[#0A0B0E] border border-slate-850 rounded-xl p-4 font-mono text-slate-300 text-[11px] leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap select-text">
                {sanitized.body || "— Tidak ada isi pesan. Masukkan email di panel kiri untuk melihat sanitasi draf disini —"}
              </div>
            </div>

            {/* Neutralized Tautan and Lampiran Indicator blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-[#1A1D24]/50 rounded-lg border border-slate-850">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  🌐 Tautan Dimatikan
                </span>
                <p className="font-mono text-[10px] text-amber-300 break-all leading-normal">
                  {sanitized.links || "Tidak ada tautan terdeteksi."}
                </p>
              </div>

              <div className="p-3.5 bg-[#1A1D24]/50 rounded-lg border border-slate-850">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  📎 File Dinonaktifkan
                </span>
                <p className="font-mono text-[10px] text-rose-300 break-all leading-normal">
                  {sanitized.attachments || "Tidak ada lampiran terdeteksi."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-[#1A1D24]/30 rounded-xl border border-slate-850/60 flex gap-2.5 mt-5 leading-normal">
          <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400">
            Sesuai instruksi kepatuhan siber, draf representasi aman inilah yang **diolah dan dikirimkan ke model AI**. Ini mengeliminasi risiko eksekusi link berbahaya saat validasi berlangsung.
          </p>
        </div>
      </div>
    </div>
  );
}
