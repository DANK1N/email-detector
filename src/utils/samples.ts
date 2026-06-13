import { EmailData } from "../types";

export interface SampleEmail {
  id: string;
  label: string;
  title: string;
  expectedRisk: "PHISHING" | "SPAM" | "AMAN";
  data: EmailData;
}

export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: "phishing-bank",
    label: "Phishing BCA (Urgensi Tinggi)",
    title: "Akun Terblokir - Verifikasi KlikBCA Anda Sekarang!",
    expectedRisk: "PHISHING",
    data: {
      senderDisplay: "Keamanan KlikBCA",
      senderEmail: "security-alert@klikbca-security-portal.co",
      recipientEmail: "danangrafli54@gmail.com",
      returnPath: "bounce@host-server-hackers.ru",
      subject: "[PENTING] Akun KlikBCA Anda Akan Ditangguhkan - Lakukan Verifikasi Data",
      body: `Nasabah Yang Terhormat,

Kami mendeteksi aktivitas login yang tidak biasa dan mencurigakan pada akun KlikBCA Anda dari lokasi yang tidak dikenali. Demi menjaga keamanan saldo Anda, akun Anda telah dinonaktifkan untuk sementara waktu.

Silakan lakukan verifikasi ulang kepemilikan rekening Anda dalam waktu maksimal 24 jam dengan mengklik tautan aman di bawah ini:
http://klikbca-verifikasi-portal.com/login.php?ref=security

Jika Anda tidak melakukan verifikasi dalam 24 jam, rekening Anda akan dibekukan secara permanen dan Anda harus mengunjungi kantor cabang terdekat dengan membayar denda pemulihan sebesar Rp 250.000.

Kami juga melampirkan file dokumen PDF instruksi keselamatan yang perlu Anda unduh dan jalankan segera:
Attachment: instruksi_keselamatan.pdf.exe

Hormat kami,
Layanan Keamanan KlikBCA`,
      attachments: "instruksi_keselamatan.pdf.exe, formulir_verifikasi.zip",
      links: "http://klikbca-verifikasi-portal.com/login.php?ref=security, http://images.provider.com/header.png"
    }
  },
  {
    id: "spam-marketing",
    label: "Spam Promosi (Sapaan Umum)",
    title: "KESEMPATAN TERAKHIR! Diskon Gila 90% Semua Gadget!",
    expectedRisk: "SPAM",
    data: {
      senderDisplay: "Gadget Murah Meriah",
      senderEmail: "no-reply@gadget-promo-market.net",
      recipientEmail: "danangrafli54@gmail.com",
      returnPath: "no-reply@gadget-promo-market.net",
      subject: "DISKON DASHYAT GADGET TERBARU 90% MENANTI ANDA!!! BUKA SEKARANG!",
      body: `Halo Pelanggan Terkasih,

Apakah Anda ingin gadget baru tapi dompet tipis? HARI INI SAJA! Kami mengadakan cuci gudang besar-besaran untuk seluruh produk smartphone, tablet, laptop, dan smart watch dengan diskon hingga 90% tanpa syarat!

Jangan lewatkan kesempatan emas ini demi merubah gaya hidup Anda menjadi lebih premium. Klik tombol di bawah ini:
http://pasar-murah-diskon-gadget.com/buy-now

Ayo buruan sebelum kehabisan! Stok sangat-sangat terbatas!

Salam hangat,
Team Gadget Heboh`,
      attachments: "brosur_harga_diskon.pdf",
      links: "http://pasar-murah-diskon-gadget.com/buy-now"
    }
  },
  {
    id: "safe-meeting",
    label: "Email Aman (Undangan Rapat)",
    title: "Undangan Rapat Evaluasi Proyek Kuartal II",
    expectedRisk: "AMAN",
    data: {
      senderDisplay: "Andi Wijaya (PMO)",
      senderEmail: "andi.wijaya@corporate-domain.com",
      recipientEmail: "danangrafli54@gmail.com",
      returnPath: "andi.wijaya@corporate-domain.com",
      subject: "Undangan: Rapat Evaluasi Progress Proyek Pengembangan Aplikasi Kuartal II",
      body: `Halo Rekan-rekan,

Melanjutkan rencana kerja kita, saya ingin mengundang rekan-rekan sekalian untuk menghadiri rapat koordinasi dan evaluasi terkait progress pengembangan aplikasi di akhir Kuartal II ini.

Rapat akan diselenggarakan pada:
Hari/Tanggal: Senin, 15 Juni 2026
Waktu: 10.00 - 12.00 WIB
Media: Google Meet (Tautan akan dikirimkan menyusul di kalender)

Adapun agenda utama rapat kita adalah:
1. Review progress milestone utama
2. Hambatan teknis pada deployment server
3. Rencana alokasi resource untuk kuartal berikutnya

Dokumen materi presentasi dapat diakses pada tautan drive berikut:
https://drive.google.com/file/d/corporate-123/view

Terima kasih atas perhatian dan kerja sama rekan-rekan.

Salam,
Andi Wijaya
Project Management Office`,
      attachments: "dokumen_milestone_q2.pdf",
      links: "https://drive.google.com/file/d/corporate-123/view"
    }
  }
];
