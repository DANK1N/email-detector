import React, { useState, useEffect } from "react";
import { AnalysisResponse, QuarantineLog, RiskLevel } from "../types";
import { ShieldAlert, ShieldCheck, Play, Save, CheckCircle, RefreshCw, AlertTriangle, FileText, Clipboard, ClipboardCheck } from "lucide-react";

interface ManualQuarantineProps {
  analysis: AnalysisResponse;
  emailSubject: string;
  senderEmail: string;
  onLogAdded?: (log: QuarantineLog) => void;
}

export default function ManualQuarantine({ analysis, emailSubject, senderEmail, onLogAdded }: ManualQuarantineProps) {
  const [operatorName, setOperatorName] = useState("danangrafli54@gmail.com");
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    senderConfirmed: false,
    linksInspected: false,
    falsePositiveChecked: false,
    policyAligned: false,
  });
  
  const [selectedAction, setSelectedAction] = useState("BLACK_LIST_DOMAIN");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isCommitted, setIsCommitted] = useState(false);
  const [copiedRule, setCopiedRule] = useState<string | null>(null);

  useEffect(() => {
    // Reset commit state if analysis changes
    setIsCommitted(false);
  }, [analysis]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allChecked = Object.values(checkedItems).every(Boolean);

  const handleCommitQuarantine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) return;

    const actionText = 
      selectedAction === "BLACK_LIST_DOMAIN" ? `Domain Blocked (${analysis.quarantineRecommendation.ruleSenderDomain || "N/A"})` :
      selectedAction === "BLACK_LIST_IP" ? `IP Blocked (${analysis.quarantineRecommendation.ruleSenderIP || "N/A"})` :
      selectedAction === "QUARANTINE_MESSAGE" ? "Message Quarantined & Subject Monitored" : "Flagged as Server Spam";

    const newLog: QuarantineLog = {
      id: "QRT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toLocaleString("id-ID"),
      emailSubject: emailSubject,
      senderEmail: senderEmail,
      riskLevel: analysis.riskLevel,
      operatorName: operatorName,
      approvedChecks: Object.keys(checkedItems).filter(k => checkedItems[k]),
      actionTaken: actionText,
      notes: additionalNotes || "Manual verification completed."
    };

    // Save of Quarantine Log
    const existing = localStorage.getItem("quarantine_logs");
    const logs = existing ? JSON.parse(existing) : [];
    logs.unshift(newLog);
    localStorage.setItem("quarantine_logs", JSON.stringify(logs));

    setIsCommitted(true);
    if (onLogAdded) {
      onLogAdded(newLog);
    }
  };

  // Generate mail server configuration rule representation
  const generateServerRuleText = () => {
    const domain = analysis.quarantineRecommendation.ruleSenderDomain || "unknown-domain.com";
    const keyword = analysis.quarantineRecommendation.ruleSubjectKeyword || "SUSPICIOUS";
    const ip = analysis.quarantineRecommendation.ruleSenderIP || "0.0.0.0";

    if (selectedAction === "BLACK_LIST_DOMAIN") {
      return `# Rule Blacklist Domain Pengirim (Postfix Core)
sender_access:
  ${domain}   REJECT Spoofed Sender Domain Blacklisted via Analisis Manual ID
  *@${domain} REJECT Reject all addresses under blacklisted domain`;
    }
    if (selectedAction === "BLACK_LIST_IP") {
      return `# Rule Rule Blocking IP Mail (iptables / Exchange)
# IPTables block rule
iptables -A INPUT -s ${ip} -p tcp --dport 25 -j DROP
# Exchange Transport Rule Block IP
New-ExchangeRule -Name "Block-IP-${ip}" -SenderAddressMatches "${ip}" -Action Reject`;
    }
    return `# Rule Filter Spam / Karantina Berbasis Kata Kunci
# Procmail / Exim Rule
if $h_subject: contains "${keyword}"
then
  save /var/mail/quarantine/
  log "Email matched block keyword. Quarantined for further review."
endif`;
  };

  const handleCopyRule = () => {
    const text = generateServerRuleText();
    navigator.clipboard.writeText(text);
    setCopiedRule(selectedAction);
    setTimeout(() => setCopiedRule(null), 2000);
  };

  return (
    <div className="bg-[#15171C] rounded-xl border border-slate-800 p-6 shadow-xl" id="manual-quarantine-card">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-950/40 text-rose-450 rounded-lg">
            <ShieldAlert size={22} className="text-rose-400" id="shield-alert-icon" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Validasi Manual & Tindakan Karantina</h3>
            <p className="text-xs text-slate-400">Sesuai kebijakan siber, instruksi tingkat server membutuhkan keputusan manusia.</p>
          </div>
        </div>
        <span className="text-[10px] bg-amber-950/40 text-amber-400 font-bold tracking-widest px-2.5 py-1 rounded border border-amber-900/30 uppercase font-mono">
          VALIDATOR MANUAL
        </span>
      </div>

      <div className="p-4 bg-amber-950/15 border border-amber-900/30 rounded-lg text-amber-300 text-sm mb-6 flex gap-3">
        <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-400">Peringatan Keamanan Kebijakan SOC:</strong>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Keputusan untuk mengarantina email, memblokir alamat IP, atau memblacklist alamat domain di tingkat mail exchange server 
            <span className="font-semibold text-amber-400"> HARUS tetap divalidasi secara manual</span> oleh analis keamanan. Tindakan otomatis tanpa peninjauan dilarang untuk menghindari dampak false positive pada komunikasi penting perusahaan.
          </p>
        </div>
      </div>

      {!isCommitted ? (
        <form onSubmit={handleCommitQuarantine} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Operator Detail */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nama Analis / Operator Validasi *
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="E.g., analis@safety.gov.id"
                className="w-full px-3.5 py-2.5 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Action Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pilih Tindakan Mail Server draf *
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="BLACK_LIST_DOMAIN">Blacklist Server Domain ({analysis.quarantineRecommendation.ruleSenderDomain || "Tidak Ada"})</option>
                <option value="BLACK_LIST_IP">Block Server IP ({analysis.quarantineRecommendation.ruleSenderIP || "Tidak Terdeteksi"})</option>
                <option value="QUARANTINE_MESSAGE">Karantina Kotak Masuk & Filter Subjek</option>
                <option value="SPAM_TRAINING">Masukan ke Data Training Server Spam</option>
              </select>
            </div>
          </div>

          {/* Interactive Verification Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Checklist Penilaian Validasi Khusus (Harus Dicentang Semua)
            </label>
            <div className="space-y-3 bg-[#0F1116] p-4 rounded-xl border border-slate-850">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedItems.senderConfirmed}
                  onChange={() => toggleCheck("senderConfirmed")}
                  className="mt-1 h-4 w-4 bg-[#1A1D24] text-indigo-600 focus:ring-indigo-500/40 border-slate-700 rounded"
                />
                <div className="text-sm">
                  <span className="font-semibold text-white group-hover:text-slate-200">Konfirmasi Email Pengirim & Return-Path</span>
                  <p className="text-xs text-slate-400 mt-0.5">Saya telah memverifikasi secara langsung ketidakcocokan data header pengirim ({senderEmail}) dengan Return-Path.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedItems.linksInspected}
                  onChange={() => toggleCheck("linksInspected")}
                  className="mt-1 h-4 w-4 bg-[#1A1D24] text-indigo-600 focus:ring-indigo-500/40 border-slate-700 rounded"
                />
                <div className="text-sm font-sans">
                  <span className="font-semibold text-white group-hover:text-slate-200">Uji Ulang Tautan Tersemat & Lampiran</span>
                  <p className="text-xs text-slate-400 mt-0.5">Tautan ({analysis.quarantineRecommendation.ruleSubjectKeyword ? "Aktif diblokir" : "Aman"}) dan dokumen lampiran berbahaya telah dikonversi ke format non-aktif untuk memastikan keamanan AI.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedItems.falsePositiveChecked}
                  onChange={() => toggleCheck("falsePositiveChecked")}
                  className="mt-1 h-4 w-4 bg-[#1A1D24] text-indigo-600 focus:ring-indigo-500/40 border-slate-700 rounded"
                />
                <div className="text-sm">
                  <span className="font-semibold text-white group-hover:text-slate-200">Konfirmasi Eliminasi Dampak "False Positive"</span>
                  <p className="text-xs text-slate-400 mt-0.5">Saya mengonfirmasi bahwa pengirim ini bukan rekan bisnis resmi, melainkan entitas siber luar yang merugikan.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedItems.policyAligned}
                  onChange={() => toggleCheck("policyAligned")}
                  className="mt-1 h-4 w-4 bg-[#1A1D24] text-indigo-600 focus:ring-indigo-500/40 border-slate-700 rounded"
                />
                <div className="text-sm">
                  <span className="font-semibold text-white group-hover:text-slate-200">Persetujuan Terhadap Regulasi IT Perusahaan</span>
                  <p className="text-xs text-slate-400 mt-0.5">Pemblokiran ini sesuai dengan SOP Kepatuhan Informasi dan Keamanan Siber Nasional.</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Catatan Justifikasi Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Berikan alasan operasional jika ada..."
              className="w-full px-3.5 py-2.5 bg-[#0F1116] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!allChecked}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${
                allChecked
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                  : "bg-[#1A1D24] text-slate-500 border border-slate-850 cursor-not-allowed"
              }`}
            >
              <ShieldCheck size={18} />
              Setujui Tindakan & Terapkan Karantina Manual
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Confirmed Indicator */}
          <div className="p-5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center flex flex-col items-center justify-center gap-2 animate-fade-in text-slate-200">
            <CheckCircle size={42} className="text-emerald-400" />
            <h4 className="font-bold text-white text-base">Berhasil Divalidasi & Diarsipkan</h4>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Tindakan <span className="font-semibold text-indigo-400 underline capitalize">{selectedAction.replace(/_/g, " ")}</span> keamanan telah disetujui secara manual oleh analis <span className="font-semibold text-white">{operatorName}</span>. Catatan log audit telah dituliskan ke registri log server.
            </p>
          </div>

          {/* Copyable codeblock instructions to deploy rules manually */}
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg bg-[#0F1116]">
            <div className="bg-[#1A1D24] px-4 py-3 flex justify-between items-center border-b border-slate-800">
              <span className="font-semibold text-xs text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText size={14} className="text-indigo-400" />
                Draf Kode Aturan Konfigurasi Mail Server (Harus Disalin Manual)
              </span>
              <button
                type="button"
                onClick={handleCopyRule}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold focus:outline-none cursor-pointer"
              >
                {copiedRule === selectedAction ? (
                  <>
                    <ClipboardCheck size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Clipboard size={14} />
                    <span>Salin Kode Aturan</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-[#050608] text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-900/40">
              {generateServerRuleText()}
            </div>
            <div className="bg-[#1A1D24]/40 p-3 text-xs text-slate-300 border-t border-slate-800/80 leading-relaxed">
              💡 <span className="font-semibold text-indigo-400">Langkah Selanjutnya:</span> Salin script aturan di atas dan lampirkan ke antarmuka administrasi internal mail server (e.g. Server Postfix / Microsoft Exchange Server Management Tools) untuk menjalankan karantina secara nyata.
            </div>
          </div>

          <div className="flex justify-start">
            <button
              onClick={() => {
                setIsCommitted(false);
                setCheckedItems({
                  senderConfirmed: false,
                  linksInspected: false,
                  falsePositiveChecked: false,
                  policyAligned: false,
                });
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:underline font-semibold cursor-pointer"
            >
              <RefreshCw size={12} className="text-indigo-400" />
              Setujui Tindakan Baru Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
