/**
 * Neutralizes active links and potential email addresses to prevent direct execution or clicks.
 * Translates http/https schemes, replaces dots with safe formatting, and flags scary extensions.
 */

export function sanitizeUrl(url: string): string {
  if (!url) return "";
  let clean = url;
  
  // Replace active protocols
  clean = clean.replace(/https:\/\//gi, "hxxps://");
  clean = clean.replace(/http:\/\//gi, "hxxp://");
  clean = clean.replace(/ftp:\/\//gi, "fxxp://");
  
  // Replace remaining dots with [dot] inside domains or slashes to prevent raw hyperlink interpretation
  // e.g. "google.com" -> "google[dot]com"
  clean = clean.replace(/([a-zA-Z0-9-]{2,})\.([a-zA-Z0-9-]{2,})/g, "$1[dot]$2");
  
  return clean;
}

export function sanitizeEmailAddress(email: string): string {
  if (!email) return "";
  // "username@domain.com" -> "username[at]domain[dot]com"
  return email.replace(/@/g, "[at]").replace(/\./g, "[dot]");
}

export function sanitizeAttachment(filename: string): string {
  if (!filename) return "";
  let clean = filename;
  
  // Neutralize double extensions or scary executables
  // e.g. "report.pdf.exe" -> "report.pdf[NEUTRALIZED_exe]"
  const scaryExtensions = /\.(exe|scr|bat|vbs|js|cmd|msi|jar|ps1|com|pif|reg)$/i;
  const doubleExtension = /(\.\w+)(\.(exe|scr|bat|vbs|js|cmd|msi|jar|ps1|com|pif|reg|zip|rar))$/i;
  
  if (doubleExtension.test(clean)) {
    clean = clean.replace(doubleExtension, (match, p1, p2) => {
      return `${p1}[DANGEROUS_DOUBLE_EXTENSION_PREVENTED_${p2.replace(/^\./, "")}]`;
    });
  } else if (scaryExtensions.test(clean)) {
    clean = clean.replace(scaryExtensions, (match, ext) => {
      return `[NEUTRALIZED_${ext}]`;
    });
  }
  
  return clean;
}

/**
 * Sanitizes all string fields of an email data object for safe AI submission and preview.
 */
export function sanitizeEmailData(data: {
  senderDisplay: string;
  senderEmail: string;
  recipientEmail: string;
  returnPath: string;
  subject: string;
  body: string;
  attachments: string;
  links: string;
}) {
  return {
    senderDisplay: data.senderDisplay,
    senderEmail: sanitizeEmailAddress(data.senderEmail),
    recipientEmail: sanitizeEmailAddress(data.recipientEmail),
    returnPath: sanitizeEmailAddress(data.returnPath),
    subject: data.subject.replace(/https?:\/\/[^\s]+/gi, (m) => sanitizeUrl(m)),
    body: data.body
      .replace(/https?:\/\/[^\s]+/gi, (m) => sanitizeUrl(m))
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (m) => sanitizeEmailAddress(m)),
    attachments: data.attachments
      .split(",")
      .map((item) => sanitizeAttachment(item.trim()))
      .filter(Boolean)
      .join(", "),
    links: data.links
      .split(",")
      .map((item) => sanitizeUrl(item.trim()))
      .filter(Boolean)
      .join(", "),
  };
}

/**
 * Heuristically parses a raw copy-pasted email (headers + body) into the structured EmailData fields.
 */
export function parseRawEmail(rawText: string): {
  senderDisplay: string;
  senderEmail: string;
  recipientEmail: string;
  returnPath: string;
  subject: string;
  body: string;
  attachments: string;
  links: string;
} {
  const result = {
    senderDisplay: "",
    senderEmail: "",
    recipientEmail: "",
    returnPath: "",
    subject: "",
    body: "",
    attachments: "",
    links: "",
  };

  if (!rawText) return result;

  const lines = rawText.split("\n");
  let bodyStartIndex = 0;
  let isParsingHeaders = true;

  // Extract links list helper
  const foundLinks: string[] = [];
  const foundAttachments: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (isParsingHeaders) {
      if (line === "") {
        // Empty line separates headers from body
        isParsingHeaders = false;
        bodyStartIndex = i + 1;
        continue;
      }

      // Check header prefix match
      const fromMatch = lines[i].match(/^From:\s*(.*)/i);
      if (fromMatch) {
        const val = fromMatch[1].trim();
        // Check if display name and email can be split: e.g. "Klik BCA <support@klikbca-fraud.com>"
        const emailMatch = val.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          result.senderEmail = emailMatch[1];
          result.senderDisplay = val.replace(`<${result.senderEmail}>`, "").replace(result.senderEmail, "").replace(/["']/g, "").trim() || result.senderEmail;
        } else {
          result.senderEmail = val;
          result.senderDisplay = val;
        }
      }

      const toMatch = lines[i].match(/^To:\s*(.*)/i);
      if (toMatch) {
        const val = toMatch[1].trim();
        const emailMatch = val.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        result.recipientEmail = emailMatch ? emailMatch[1] : val;
      }

      const rpMatch = lines[i].match(/^Return-Path:\s*(.*)/i);
      if (rpMatch) {
        const val = rpMatch[1].trim().replace(/[<>]/g, "");
        result.returnPath = val;
      }

      const subMatch = lines[i].match(/^Subject:\s*(.*)/i);
      if (subMatch) {
        result.subject = subMatch[1].trim();
      }
    }
  }

  // If no empty line was parsed but we have text, treat the whole thing as body unless we can segment
  if (isParsingHeaders) {
    // If we didn't find standard headers, it might just be the full body
    result.body = rawText;
  } else {
    result.body = lines.slice(bodyStartIndex).join("\n");
  }

  // Fallback parsers for return-path from text lines if headers weren't structured cleanly
  if (!result.senderEmail) {
    const fromLine = lines.find(l => l.trim().startsWith("From:"));
    if (fromLine) {
       const emailMatch = fromLine.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
       if (emailMatch) result.senderEmail = emailMatch[1];
    }
  }

  // Extract explicit lines with links from body
  const urlRegex = /https?:\/\/[^\s"']+/gi;
  let match;
  while ((match = urlRegex.exec(result.body)) !== null) {
    const url = match[0];
    if (!foundLinks.includes(url)) {
      foundLinks.push(url);
    }
  }

  // Simple heuristic for attachment names in body: e.g. "Attachment: file.zip" or look for file suffixes
  const attachmentKeywords = /(?:attachment|lampiran|file|unduh|download|nama file):\s*([a-zA-Z0-9._-]+\.[a-zA-Z0-9]{2,4})/i;
  lines.forEach(l => {
    const attMatch = l.match(attachmentKeywords);
    if (attMatch && attMatch[1]) {
      const filename = attMatch[1].trim();
      if (!foundAttachments.includes(filename)) {
        foundAttachments.push(filename);
      }
    }
  });

  result.links = foundLinks.join(", ");
  result.attachments = foundAttachments.join(", ");

  return result;
}
