/* =========================================================
   ISI DUA BARIS DI BAWAH INI dengan data project Supabase Anda.
   Cara mendapatkannya ada di README.md bagian "Setup Supabase", langkah 3.
========================================================= */
const SUPABASE_URL = "https://asrssigknltgvkbibkdh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcnNzaWdrbmx0Z3ZrYmlia2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTQ3NDksImV4cCI6MjEwMjA5MDc0OX0.qlEbP8tzLjTcwV518WB0KXpMO9y-rYfMPLVOMxMoST0";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   NOTIFIKASI WHATSAPP KE ADMIN (opsional) — hanya dikirim saat ada
   Pelatih/Atlet mengajukan Izin Tidak Masuk.

   Memakai CallMeBot (layanan gratis untuk kirim WhatsApp lewat link,
   tanpa perlu WhatsApp Business API/Meta Developer account).

   PENTING: per Agustus 2026, bot WhatsApp CallMeBot sedang PENUH — nomor
   kontaknya sengaja disembunyikan di situs resminya sampai ada slot baru.
   Cek dulu status & nomor terbaru di:
   https://www.callmebot.com/blog/free-api-whatsapp-messages/
   Kalau nomornya belum muncul di situ, fitur ini belum bisa diaktifkan —
   biarkan saja WA_ADMIN_PHONE/WA_APIKEY kosong, sisa aplikasi tetap
   berjalan normal (admin masih bisa lihat semua pengajuan izin lewat
   menu "Data Absensi"). Alternatif berbayar-murah kalau butuh sekarang
   juga: https://textmebot.com

   Cara aktifkan setelah dapat nomor & apikey:
   1. Simpan nomor bot (lihat link di atas) di kontak HP Anda.
   2. Kirim pesan "I allow callmebot to send me messages" ke nomor itu via WhatsApp.
   3. Anda akan dibalas API key (angka). Isi WA_ADMIN_PHONE & WA_APIKEY di bawah.
   Kalau dikosongkan (default), notifikasi WA otomatis dilewati (tidak error).
========================================================= */
const WA_ADMIN_PHONE = "";   // format internasional tanpa "+", mis. "6281234567890"
const WA_APIKEY = "";        // API key balasan dari CallMeBot
