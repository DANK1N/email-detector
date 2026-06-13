export enum RiskLevel {
  AMAN = "AMAN",
  SPAM = "SPAM",
  PHISHING = "PHISHING"
}

export interface EmailData {
  senderDisplay: string;      // E.g., "KlikBCA Support"
  senderEmail: string;        // E.g., "bcasupport@gmail.com"
  recipientEmail: string;     // E.g., "user@company.com"
  returnPath: string;         // E.g., "bounce-handler@hackersite.ru"
  subject: string;            // E.g., "[PENTING] Pembaruan Data Rekening"
  body: string;               // Raw email body
  attachments: string;        // Comma separated list of attachment filenames
  links: string;              // Comma separated list of links in the email
}

export interface SuspiciousIndicator {
  category: "SENDER_MISMATCH" | "URGENCY" | "SUSPICIOUS_LINK" | "SUSPICIOUS_ATTACHMENT" | "GENERIC_GREETING" | "OTHER";
  title: string;              // Short description: e.g., "Return-Path Berbeda Dari Pengirim"
  description: string;        // Deeper analysis text
  evidence: string;           // Excerpt of evidence
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface AnalysisResponse {
  riskLevel: RiskLevel;
  riskScore: number;          // 0 to 100
  language: string;           // Expected to be "Indonesian"
  summary: string;            // Short Indonesian analysis summary
  modelUsed?: string;         // The active Gemini model used for analysis
  indicators: SuspiciousIndicator[];
  draftReply: {
    subject: string;          // E.g., "Tanggapan Laporan Email: ..."
    body: string;             // Draft reply body in Indonesian
  };
  quarantineRecommendation: {
    ruleSenderDomain: string; // Recommended block rule sender domain
    ruleSenderIP: string;     // E.g., if extracted, or placeholder
    ruleSubjectKeyword: string; // Keyword from subject to filter
    actionInstructions: string; // Steps on what to configure
  };
}

export interface QuarantineLog {
  id: string;
  timestamp: string;
  emailSubject: string;
  senderEmail: string;
  riskLevel: RiskLevel;
  operatorName: string;
  approvedChecks: string[];   // Checks passed during manual validation
  actionTaken: string;        // E.g., "Domain Blocked", "IP Blocked"
  notes: string;
}
