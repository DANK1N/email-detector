import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the GoogleGenAI instance using the system-installed API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json({ limit: "5mb" }));

  // API Route: Email Security analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const emailSpecs = req.body;

      if (!emailSpecs || !emailSpecs.body) {
        return res.status(400).json({ error: "Isi pesan email (body) tidak boleh kosong." });
      }

      // Format payload clearly for the prompt
      const analysisPrompt = `
Lakukan analisis keamanan mendalam terhadap email mencurigakan berikut yang sudah dinetralisir (tautan aktif diubah ke hxxp:// atau hxxps://).

--- DATA EMAIL ---
Display Name Pengirim: ${emailSpecs.senderDisplay || "Tidak Diketahui"}
Email Pengirim: ${emailSpecs.senderEmail || "Tidak Diketahui"}
Recipient/Penerima: ${emailSpecs.recipientEmail || "Tidak Diketahui"}
Return-Path: ${emailSpecs.returnPath || "Tidak Diketahui"}
Subjek Email: ${emailSpecs.subject || "Tanpa Subjek"}
Daftar Tautan (Neutralized): ${emailSpecs.links || "Tidak Ada"}
Daftar Lampiran (Neutralized): ${emailSpecs.attachments || "Tidak Ada"}

--- ISI PESAN (BODY) ---
${emailSpecs.body}
------------------------

Instruksi Analisis:
1. Tentukan tingkat risiko: 'AMAN', 'SPAM', atau 'PHISHING'.
2. Berikan skor risiko (0 - 100%).
3. Analisis indikator kecurigaan seperti:
   - Ketidakcocokan domain pengirim (Display Name vs Email Pengirim vs Return-Path).
   - Manipulasi emosi (urgensi buatan, hadiah palsu, ancaman pemblokiran bank).
   - Penggunaan link mencurigakan / look-alike (misal: faceb00k.com, login-klikbca-aman).
   - Lampiran berbahaya (contoh: double extension seperti xls.exe, kata sandi tersembunyi, atau file eksekusi).
   - Sapaan yang terlalu umum/tidak spesifik.
4. Hasilkan Draf Balasan dalam Bahasa Indonesia yang sopan, ramah, dan formal untuk dikirim ke pelapor yang menyetorkan email ini.
   - Apresiasi karena telah melaporkan.
   - Beritahu kesimpulan risiko dengan jelas (AMAN / SPAM / PHISHING).
   - Berikan tips tindakan selanjutnya (misal: "Anda aman untuk mengabaikannya", atau "Mohon hapus email tersebut, jangan mengklik apapun").
5. Hasilkan Rekomendasi Karantina Server (domain pengirim, keyword subjek, IP, dan panduan teknis langkah pencegahan).

PENTING: Seluruh draf balasan dan ringkasan kecurigaan harus dalam Bahasa Indonesia yang baku dan mudah dipahami.
`;

      let response: any = null;
      let modelUsed = "";
      let lastError: any = null;
      const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest"];

      for (const modelName of modelsToTry) {
        try {
          console.log(`Mencoba menganalisis email dengan model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: analysisPrompt,
            config: {
              systemInstruction: "Anda adalah analis keamanan siber senior di Security Operations Center (SOC) yang memiliki spesialisasi dalam mendeteksi ancaman phishing, scam, siber fraud, dan spam email. Analisis informasi secara kritis dan berikan output dalam format JSON terstruktur penuh.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  riskLevel: {
                    type: Type.STRING,
                    description: "Tingkat risiko email: harus dari salah satu: 'AMAN', 'SPAM', 'PHISHING'"
                  },
                  riskScore: {
                    type: Type.INTEGER,
                    description: "Skor risiko dari skala 0 (aman) sampai 100 (sangat berbahaya)"
                  },
                  language: {
                    type: Type.STRING,
                    description: "Bahasa analisis, selalu gunakan 'Indonesian'"
                  },
                  summary: {
                    type: Type.STRING,
                    description: "Ringkasan analisis ringkas dalam Bahasa Indonesia mengenai kenapa email ini diklasifikasikan dengan tingkat risiko tersebut"
                  },
                  indicators: {
                    type: Type.ARRAY,
                    description: "Daftar indikator kecurigaan yang ditemukan pada email",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: {
                          type: Type.STRING,
                          description: "Kategori indikator: harus salah satu dari 'SENDER_MISMATCH', 'URGENCY', 'SUSPICIOUS_LINK', 'SUSPICIOUS_ATTACHMENT', 'GENERIC_GREETING', 'OTHER'"
                        },
                        title: {
                          type: Type.STRING,
                          description: "Judul singkat indikator kecurigaan, misalnya: 'Domain Pengirim Tidak Cocok'"
                        },
                        description: {
                          type: Type.STRING,
                          description: "Penjelasan detail mengapa hal ini mencurigakan pada konteks email ini"
                        },
                        evidence: {
                          type: Type.STRING,
                          description: "Potongan teks dari email yang menjadi bukti indikator ini"
                        },
                        severity: {
                          type: Type.STRING,
                          description: "Tingkat keparahan indikator: 'HIGH', 'MEDIUM', atau 'LOW'"
                        }
                      },
                      required: ["category", "title", "description", "evidence", "severity"]
                    }
                  },
                  draftReply: {
                    type: Type.OBJECT,
                    description: "Draf balasan email dalam Bahasa Indonesia yang formal dan sopan untuk dikirim kembali ke pelapor",
                    properties: {
                      subject: {
                        type: Type.STRING,
                        description: "Subjek draf balasan, misalnya: 'Tanggapan Laporan Email: ...'"
                      },
                      body: {
                        type: Type.STRING,
                        description: "Isi draf email balasan lengkap, memberi tahu mereka hasil analisis, mengapresiasi laporan mereka, dan memberikan anjuran keamanan"
                      }
                    },
                    required: ["subject", "body"]
                  },
                  quarantineRecommendation: {
                    type: Type.OBJECT,
                    description: "Rekomendasi karantina tingkat server jika email ini berbahaya atau spam",
                    properties: {
                      ruleSenderDomain: {
                        type: Type.STRING,
                        description: "Domain pengirim asal yang perlu diblokir atau dimasukkan dalam blacklist, kosongkan jika email AMAN"
                      },
                      ruleSenderIP: {
                        type: Type.STRING,
                        description: "Alamat IP pengirim jika ada, kosongkan jika tidak dapat diprediksi"
                      },
                      ruleSubjectKeyword: {
                        type: Type.STRING,
                        description: "Kata kunci subjek unik untuk memfilter pesan serupa di relay server"
                      },
                      actionInstructions: {
                        type: Type.STRING,
                        description: "Panduan teknis pencegahan bagi administrator mail server"
                      }
                    },
                    required: ["ruleSenderDomain", "ruleSenderIP", "ruleSubjectKeyword", "actionInstructions"]
                  }
                },
                required: [
                  "riskLevel",
                  "riskScore",
                  "language",
                  "summary",
                  "indicators",
                  "draftReply",
                  "quarantineRecommendation"
                ]
              }
            }
          });

          if (response && response.text) {
            modelUsed = modelName;
            console.log(`Analisis berhasil diselesaikan dengan model: ${modelName}`);
            break; // Berhasil! Keluar dari loop pencarian model
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} gagal: ${err.message || err}. Mencoba model cadangan jika tersedia...`);
          lastError = err;
          // Delay minor jika transien sebelum mencoba model berikutnya
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("Seluruh model Gemini gagal menganalisis email (Layanan Tidak Tersedia).");
      }

      const responseText = response.text;
      const parsedJSON = JSON.parse(responseText.trim());
      
      // Inject modelName used in processing
      parsedJSON.modelUsed = modelUsed;

      return res.json(parsedJSON);

    } catch (error: any) {
      console.error("Analysis API failed:", error);
      return res.status(500).json({
        error: "Gagal menganalisis email dengan AI.",
        details: error.message || error
      });
    }
  });

  // Vite development vs production asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
