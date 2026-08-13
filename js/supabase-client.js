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
   tanpa perlu WhatsApp Business API/Meta Developer account). Cara aktifkan:
   1. Simpan nomor +34 ******4 di kontak HP Anda dengan nama apa saja.
   2. Kirim pesan "I allow callmebot to send me messages" ke nomor itu via WhatsApp.
   3. Anda akan dibalas API key (angka). Isi WA_ADMIN_PHONE & WA_APIKEY di bawah.
   Kalau dikosongkan (default), notifikasi WA otomatis dilewati (tidak error).
========================================================= */
const WA_ADMIN_PHONE = "";   // format internasional tanpa "+", mis. "6281234567890"
const WA_APIKEY = "";        // API key balasan dari CallMeBot
