/* =========================================================
   ISI DUA BARIS DI BAWAH INI dengan data project Supabase Anda.
   Cara mendapatkannya ada di README.md bagian "Setup Supabase", langkah 3.
========================================================= */
const SUPABASE_URL = "https://asrssigknltgvkbibkdh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcnNzaWdrbmx0Z3ZrYmlia2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTQ3NDksImV4cCI6MjEwMjA5MDc0OX0.qlEbP8tzLjTcwV518WB0KXpMO9y-rYfMPLVOMxMoST0";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
