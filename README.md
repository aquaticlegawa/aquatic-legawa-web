## Catatan pembaruan (baca ini dulu kalau sebelumnya sudah pernah deploy versi lama)

Versi ini memperbaiki **bug absensi gagal tersimpan** ("new row violates row-level
security policy") dan menambah **pendaftaran + edit profil lengkap**. Kalau
project Supabase Anda sudah pernah dipakai sebelumnya (bukan instalasi baru
dari nol), jalankan migrasi ini **sekali saja**:

1. Buka **SQL Editor** di Supabase → **New query**.
2. Salin seluruh isi file `sql/migration_profil_dan_storage.sql`, tempel, **Run**.

Migrasi ini akan:
- Menambahkan izin upload foto ke bucket `attendance-photos` (ini yang
  menyebabkan error "Gagal mencatat absensi" sebelumnya — bucket-nya sudah
  "Public" untuk dibaca, tapi belum ada izin untuk ditulis/di-upload).
- Membuat bucket `avatars` baru (otomatis lewat SQL, tidak perlu klik manual
  di menu Storage) beserta izinnya, untuk foto profil Pelatih/Atlet.
- Memperbarui form pendaftaran supaya Tempat/Tanggal Lahir, Jenis Kelamin,
  No. HP, Cabang Olahraga, dan Alamat langsung tersimpan saat mendaftar
  (sebelumnya field-field ini kosong dan hanya bisa diisi admin lewat
  Table Editor).

**Kalau ini instalasi baru dari nol**, cukup jalankan `sql/setup.sql` seperti
biasa — semua perbaikan di atas sudah termasuk di dalamnya, tidak perlu
menjalankan file migrasi ini lagi.

Pelatih/Atlet yang **sudah terlanjur terdaftar sebelum migrasi ini** tidak
akan otomatis terisi datanya — mereka bisa melengkapi sendiri lewat menu
**Profil Saya** (sekarang bisa diedit sendiri, termasuk ganti foto profil).

---

## Catatan pembaruan desain (baca ini dulu kalau update sebelumnya pakai versi lama)

Versi ini mengganti dua hal penting dari versi sebelumnya, tanpa mengubah cara
kerja Supabase/login/data sama sekali:

1. **Tailwind tidak lagi dimuat dari CDN (`cdn.tailwindcss.com`) saat aplikasi
   dibuka** — sebelumnya browser pengguna harus mengunduh & meng-compile CSS
   setiap kali membuka halaman, dan kalau koneksinya lambat atau CDN tersebut
   diblokir (ad-blocker/browser tertentu), seluruh tampilan jadi berantakan
   tanpa gaya sama sekali. Sekarang CSS-nya sudah "jadi" sebagai file statis
   `css/tailwind.min.css` yang ikut di-upload, jadi selalu tampil benar dan
   lebih cepat dibuka.
2. **Desain visualnya dirombak** — palet warna & motif sekarang diambil
   langsung dari lambang klub (tetesan air, bendera backstroke, titik merah
   dari huruf "i" di wordmark), bukan lagi tampilan kartu/rounded-2xl generik.

**Kalau nanti Anda (atau Claude di sesi lain) menambah halaman/komponen baru
dan memakai class Tailwind yang belum pernah dipakai di proyek ini**, file
`css/tailwind.min.css` perlu di-generate ulang supaya class barunya ikut
masuk. Caranya (sekali jalan, butuh Node.js terinstal):
```
npm install -D tailwindcss@3
npx tailwindcss init
# isi tailwind.config.js: content: ["./index.html", "./js/**/*.js"]
npx tailwindcss -i ./input.css -o ./css/tailwind.min.css --minify
```
(`input.css` cukup berisi `@tailwind base; @tailwind components; @tailwind utilities;`)

---

# Aquatic Legawa's Web — Panduan Lengkap (Non-Developer)

Aplikasi ini sekarang **nyata**, bukan demo — semua data (anggota, absensi, invois,
tugas, agenda, konten edukasi) tersimpan sungguhan di database **Supabase**, dan
setiap orang login dengan akun sungguhan (bukan pilih peran sembarangan).

Baca dulu bagian **"Yang perlu Anda tahu sebelum mulai"** di bawah — penting supaya
ekspektasinya pas, terutama soal kata "aplikasi mobile".

---

## Yang perlu Anda tahu sebelum mulai

**1. ini adalah "PWA", bukan aplikasi dari Play Store / App Store.**
Aplikasi asli di Play Store/App Store butuh akun developer berbayar (Apple: sekitar
USD 99/tahun, Google: sekali bayar USD 25), software khusus (Xcode/Android Studio),
dan proses review yang bisa memakan waktu berminggu-minggu — itu proyek terpisah yang
jauh lebih besar dan butuh developer.

Yang saya buatkan adalah **Progressive Web App (PWA)**: website yang bisa "diinstal"
ke layar utama HP (Android maupun iPhone), punya ikon sendiri, terbuka tanpa address
bar seperti aplikasi biasa, dan tetap bisa dibuka meski koneksi lambat. ­Ini yang
realistis untuk dijalankan hari ini tanpa proses App Store. Untuk Pelatih & Atlet,
mereka cukup buka link lalu "Add to Home Screen" — hasilnya terasa seperti app.

**2. Admin bisa pakai versi web (browser biasa di laptop) maupun versi "mobile" (PWA
di HP) — keduanya otomatis tersedia karena satu aplikasi yang sama, responsif di
semua ukuran layar.** Tidak perlu build terpisah.

**3. Data sungguhan artinya perlu Anda isi.** Saat pertama kali deploy, tabel anggota,
invois, dsb masih kosong (kecuali beberapa agenda & guide book contoh yang sudah saya
siapkan di skrip database). Admin mengisi lewat aplikasi (form "Tambah Anggota",
"Buat Invois", tombol Import Excel) atau langsung lewat panel Supabase.

**4. "Import Data Excel" menambahkan baris ke daftar anggota — bukan otomatis membuat
akun login.** Membuat akun login perlu email asli + kata sandi (langkah 5 di bawah),
supaya tidak sembarang orang bisa login. ­Ini prinsip keamanan standar.

**5. Alternatif Google Sheets tidak saya pakai.** Google Sheets bisa jadi "database"
sederhana, tapi tidak mendukung login berbasis peran yang aman, tidak bisa menyimpan
foto absensi dengan baik, dan gampang rusak jika kolom diubah manual. Supabase gratis
untuk skala klub renang (500MB database + 1GB penyimpanan foto/video di paket gratis)
dan jauh lebih aman karena setiap tabel punya aturan akses (siapa boleh lihat/ubah
data apa).

---

## Ringkasan alur

```
Supabase (database + login + penyimpanan foto/video)
        ↓ dipanggil langsung dari browser
GitHub (menyimpan kode)
        ↓
Netlify (menghosting & mempublikasikan situsnya)
        ↓
Pelatih/Atlet: buka link → "Add to Home Screen" di HP
Admin: buka link yang sama di laptop (web) atau HP (PWA)
```

---

## Bagian 1 — Setup Supabase (database + login)

### 1.1 Buat akun & project
1. Buka **supabase.com** → **Start your project** → daftar pakai email atau akun GitHub.
2. Klik **New project**. Isi:
   - **Name**: `aquatic-legawa` (bebas)
   - **Database Password**: buat kata sandi kuat, **simpan di tempat aman** (dipakai jarang, tapi penting).
   - **Region**: pilih yang terdekat, mis. `Southeast Asia (Singapore)`.
3. Klik **Create new project**. Tunggu 1–2 menit sampai project siap.

### 1.2 Jalankan skrip database
1. Di sidebar kiri project, klik **SQL Editor**.
2. Klik **New query**.
3. Buka file `sql/setup.sql` dari folder proyek ini di komputer Anda, **salin semua isinya**, tempel ke kotak query di Supabase.
4. Klik **Run** (atau tombol ▶ / Ctrl+Enter). Harus muncul "Success. No rows returned".

Ini otomatis membuat semua tabel (anggota, absensi, invois, tugas, agenda, konten
edukasi), aturan keamanan, serta beberapa data agenda & guide book contoh.

### 1.3 Buat tempat penyimpanan foto absensi & video
1. Di sidebar, klik **Storage**.
2. Klik **New bucket** → nama: `attendance-photos` → aktifkan **Public bucket** → **Create bucket**.
3. Klik **New bucket** lagi → nama: `videos` → aktifkan **Public bucket** → **Create bucket**.
   (Bucket "Public" berarti file bisa ditonton lewat link langsung — cocok untuk video
   edukasi & foto absensi yang hanya perlu dilihat pengguna login di aplikasi.)

### 1.4 Ambil kunci koneksi
1. Di sidebar, klik ikon **Settings (gerigi)** → **API**.
2. Salin dua nilai ini:
   - **Project URL** (bentuknya `https://xxxxxxxx.supabase.co`)
   - **anon public** key (teks panjang di bagian "Project API keys")
3. Buka file `js/supabase-client.js` di proyek Anda dengan aplikasi Notepad/TextEdit
   (atau editor kode apapun), lalu ganti dua baris ini dengan nilai yang tadi disalin:
   ```js
   const SUPABASE_URL = "GANTI_DENGAN_SUPABASE_URL_ANDA";
   const SUPABASE_ANON_KEY = "GANTI_DENGAN_SUPABASE_ANON_KEY_ANDA";
   ```
   Simpan file.

### 1.5 Buat akun pertama (Anda sendiri, sebagai Admin)
1. Di sidebar Supabase, klik **Authentication** → tab **Users** → **Add user** → **Create new user**.
2. Isi email & kata sandi Anda sendiri → **Create user**.
3. Klik **Table Editor** di sidebar → pilih tabel **profiles**.
4. Anda akan melihat baris baru dengan email Anda (dibuat otomatis oleh sistem).
   Klik baris itu, ubah kolom **role** dari `atlet` menjadi `admin`, isi juga **full_name**
   kalau mau → **Save**.

**Penting:** setelah mengubah `role` jadi `admin`, ubah juga kolom **status** di
baris yang sama menjadi `approved` (lihat Bagian 1.6 di bawah — kolom ini yang
menentukan apakah sebuah akun sudah boleh masuk ke aplikasi).

Kalau Anda ingin menambah Pelatih/Atlet **langsung dari sisi admin** (bukan lewat
pendaftaran mandiri), caranya sama seperti di atas: buat user di **Authentication →
Users**, lalu di tabel **profiles** atur `role`-nya dan set `status` = `approved`
secara manual (karena Anda sendiri yang mendaftarkannya, jadi tidak perlu proses
persetujuan lagi).

---

## Bagian 1.6 — Pendaftaran mandiri Pelatih/Atlet (dengan persetujuan Admin)

Karena anggotanya sudah banyak, aplikasi ini punya cara yang lebih praktis: **Pelatih
dan Atlet mendaftar sendiri** lewat tab "Daftar" di halaman login, lalu **admin
tinggal menyetujui** dari menu "Persetujuan Anggota". Tidak perlu Anda input satu-satu.

### Cara kerjanya
- Setiap akun punya kolom **status**: `pending` (baru daftar, belum bisa masuk),
  `approved` (sudah disetujui, bisa masuk), atau `rejected` (ditolak).
- Saat seseorang mendaftar sendiri, sistem **otomatis menolak** kalau mereka
  mencoba memilih peran "Admin" — pilihan yang tersedia di form pendaftaran memang
  hanya Pelatih/Atlet, dan ini juga dijaga di sisi database supaya tidak bisa
  diakali.
- Setelah mendaftar, mereka akan melihat layar "Menunggu Persetujuan" alih-alih
  dashboard, sampai Anda menyetujuinya.

### Yang perlu dijalankan (sekali saja)
1. Buka **SQL Editor** di Supabase → **New query**.
2. Salin seluruh isi file `sql/migration_persetujuan.sql` dari proyek ini, tempel,
   lalu **Run**. (Kalau Anda baru mulai dari nol dan belum pernah menjalankan
   `sql/setup.sql` sama sekali, langsung pakai `sql/setup.sql` saja — sudah termasuk
   fitur ini, tidak perlu menjalankan file migrasi ini lagi.)
3. Buka **Authentication → Providers**, klik provider **Email**, lalu **matikan**
   opsi **"Confirm email"**, dan **Save**. Ini supaya Pelatih/Atlet bisa langsung
   masuk ke layar "Menunggu Persetujuan" setelah mendaftar, tanpa perlu klik link
   konfirmasi di email dulu — persetujuan admin sudah cukup jadi lapisan keamanannya.

### Cara admin menyetujui
1. Login ke aplikasi sebagai admin.
2. Buka menu **Persetujuan Anggota** di sidebar (dashboard juga menampilkan
   pengingat kalau ada pendaftaran yang menunggu).
3. Klik **Setujui** atau **Tolak** pada tiap pendaftaran. Begitu disetujui, orang
   tersebut langsung bisa masuk di percobaan login berikutnya.

**Catatan:** akun yang ditolak tetap tersimpan datanya (tidak dihapus) supaya
riwayatnya jelas — kalau perlu benar-benar dihapus, itu dilakukan lewat
**Authentication → Users** di Supabase (hapus user-nya di sana).

---

## Bagian 2 — Upload kode ke GitHub (tanpa command line)

1. Buka **github.com** → daftar akun kalau belum punya.
2. Klik tombol **+** di kanan atas → **New repository**.
   - **Repository name**: `aquatic-legawa-web`
   - Pilih **Public** atau **Private** (keduanya bisa dipakai Netlify).
   - **Jangan** centang "Add a README file".
   - Klik **Create repository**.
3. Di halaman repo kosong yang muncul, klik link **uploading an existing file**.
4. Seret **seluruh isi folder proyek** (semua file & folder: `index.html`, `css`,
   `js`, `assets`, `icons`, `sql`, `manifest.json`, `service-worker.js`, dst) ke
   area upload tersebut. Pastikan struktur foldernya ikut terbawa (drag folder
   langsung, jangan hanya file di dalamnya satu-satu).
5. Scroll ke bawah, klik **Commit changes**.

Kode Anda sekarang ada di GitHub.

---

## Bagian 3 — Deploy ke Netlify

1. Buka **app.netlify.com** → daftar/masuk (bisa pakai akun GitHub, lebih cepat).
2. Klik **Add new site** → **Import an existing project** → **Deploy with GitHub**.
3. Pilih repo `aquatic-legawa-web`.
4. Build settings biarkan kosong (Build command kosong, Publish directory `.`) —
   file `netlify.toml` di proyek sudah mengatur ini otomatis.
5. Klik **Deploy site**. Tunggu sekitar 30 detik–1 menit.
6. Netlify memberi alamat seperti `https://nama-acak-123.netlify.app` — ini alamat
   aplikasi Anda yang sudah live.
7. *(Opsional)* Di **Site settings → Domain management**, Anda bisa ganti ke nama
   yang lebih rapi (`aquatic-legawa.netlify.app`) atau menyambungkan domain sendiri
   kalau punya (mis. `app.aquaticlegawa.id`).

Mulai sekarang, setiap kali Anda mengubah file di GitHub (misalnya lewat "Upload
files" lagi), Netlify otomatis mem-publish ulang dalam hitungan detik.

---

## Bagian 4 — Install sebagai "aplikasi" di HP (untuk Pelatih & Atlet)

**Android (Chrome):**
1. Buka link Netlify Anda di Chrome.
2. Ketuk menu titik tiga (⋮) di kanan atas → **Add to Home screen** / **Install app**.
3. Ikon Aquatic Legawa muncul di layar utama, terbuka fullscreen tanpa address bar.

**iPhone (Safari — wajib Safari, bukan Chrome, karena batasan iOS):**
1. Buka link Netlify Anda di **Safari**.
2. Ketuk ikon **Share** (kotak dengan panah ke atas) di bagian bawah.
3. Pilih **Add to Home Screen** → **Add**.

Bagikan link Netlify Anda ke semua pelatih & atlet beserta instruksi singkat di atas.
Admin bisa melakukan hal yang sama di HP, atau cukup buka link-nya lewat browser
laptop untuk pengalaman versi web/desktop.

---

## Bagian 5 — Mengelola konten sehari-hari

Semua ini dilakukan **di dalam aplikasi** (tidak perlu buka Supabase lagi), kecuali
yang ditandai *(via Supabase)*:

| Yang ingin dilakukan | Caranya |
|---|---|
| Tambah anggota satu-satu | Menu Admin → Data Anggota → form "Tambah Anggota Manual" |
| Tambah anggota banyak sekaligus | Menu Admin → Dashboard/Data Anggota → tombol "Import Data Excel" (kolom: Nama, Email, Role, Cabang) |
| Setujui pendaftaran pelatih/atlet baru | Menu Admin → Persetujuan Anggota → tombol "Setujui"/"Tolak" — lihat Bagian 1.6 |
| Buat login untuk pelatih/atlet secara manual (tanpa lewat pendaftaran) | *(via Supabase)* Authentication → Add user, lalu atur role & status di tabel profiles — lihat Bagian 1.5 |
| Buat invois baru | Menu Admin → Sistem Invois → form "Buat Invois Baru" |
| Tambah agenda/jadwal | *(via Supabase)* Table Editor → tabel `events` → Insert row |
| Tambah Guide Book | *(via Supabase)* Table Editor → tabel `guide_books` → Insert row. Pisahkan tiap "halaman" dengan baris kosong ganda di kolom `content`. |
| Tambah Video Edukasi | *(via Supabase)* Storage → bucket `videos` → Upload file → klik file → Copy URL → Table Editor → tabel `videos` → Insert row, tempel URL di kolom `video_url` |
| Lihat/ubah data profil pelatih/atlet | Pelatih/Atlet mengubah sendiri lewat menu **Profil Saya** di aplikasi. Admin tetap bisa lihat/ubah lewat *(via Supabase)* Table Editor → tabel `profiles` bila perlu |

*(Kalau nanti mau, form "Tambah Agenda/Guide Book/Video" langsung dari aplikasi bisa
ditambahkan — beri tahu saya, ini pengembangan lanjutan yang cukup singkat.)*

---

## Keterbatasan yang jujur perlu diketahui

- **Video "tanpa unduh"**: tombol unduh disembunyikan di browser yang mendukungnya
  (Chrome/Edge), tapi secara teknis tidak ada cara 100% mencegah orang menyimpan video
  dari internet — ini standar industri (YouTube pun sama), bukan celah khusus di sini.
- **Kamera absensi** butuh izin akses kamera dari browser — normal, akan muncul
  popup izin saat pertama kali dipakai di tiap perangkat.
- **PWA vs App Store**: seperti dijelaskan di atas, ini bukan listing resmi di Play
  Store/App Store. Kalau ke depannya benar-benar perlu itu (misalnya supaya terlihat
  lebih resmi/mudah ditemukan), langkah lanjutannya adalah membungkus PWA ini dengan
  tool seperti **Capacitor** — proyek terpisah yang butuh developer, saya bisa bantu
  arahkan kalau saatnya tiba.

## Kalau ada error

- **"Gagal memuat data"** di aplikasi → biasanya `SUPABASE_URL`/`SUPABASE_ANON_KEY`
  di `js/supabase-client.js` belum diisi atau salah salin, atau `sql/setup.sql`
  belum dijalankan.
- **Login gagal terus** → cek email/password di **Authentication → Users** di Supabase,
  pastikan akunnya ada dan aktif.
- **Halaman kosong setelah login** → cek apakah baris di tabel `profiles` untuk akun
  itu sudah punya nilai `role` yang benar (`admin`/`pelatih`/`atlet`).
- **Akun admin/pelatih/atlet yang Anda buat manual malah "Menunggu Persetujuan"** →
  kolom `status` di tabel `profiles` masih `pending`. Ubah manual jadi `approved`
  di Table Editor (khusus akun yang Anda buat sendiri lewat Supabase, bukan dari
  pendaftaran mandiri).
- **Setelah daftar, langsung diminta cek email padahal seharusnya langsung masuk**
  → opsi "Confirm email" di **Authentication → Providers → Email** belum dimatikan,
  lihat Bagian 1.6.

Kalau masih ada yang mandek di salah satu langkah, kirim saja pesan error atau
screenshot-nya ke saya — saya bantu telusuri.
