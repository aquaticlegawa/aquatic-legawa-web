-- =========================================================
-- Aquatic Legawa's Web — Setup Database Supabase
-- Jalankan seluruh file ini di: Supabase Dashboard → SQL Editor → New query → Run
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- PROFILES: satu baris per akun login, menyimpan peran & data pribadi
-- ---------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('admin','pelatih','atlet')) not null default 'atlet',
  status text check (status in ('pending','approved','rejected')) not null default 'pending',
  ttl text,
  gender text,
  address text,
  phone text,
  category text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Saat ada akun baru daftar (dari Authentication tab / form pendaftaran mandiri),
-- otomatis buat baris profil. Status SELALU 'pending' — perlu di-approve admin
-- di halaman "Persetujuan Anggota". Peran dari form pendaftaran mandiri hanya
-- boleh 'pelatih'/'atlet' (tidak bisa mengaku 'admin').
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'atlet');
  if requested_role not in ('pelatih','atlet') then
    requested_role := 'atlet';
  end if;
  insert into public.profiles (id, email, full_name, role, status, ttl, gender, phone, category, address)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    requested_role,
    'pending',
    new.raw_user_meta_data->>'ttl',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'category',
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fungsi bantu: cek apakah pengguna yang sedang login adalah admin.
-- Dipakai di semua kebijakan (policy) di bawah agar tidak terjadi rekursi.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------
-- MEMBERS: daftar "Data Anggota / All Categories" (hasil import Excel / input manual admin)
-- Terpisah dari akun login — admin bisa mendata orang dulu, akun login dibuat menyusul.
-- ---------------------------------------------------------
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  email text,
  role text,
  cabang text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- ATTENDANCE: absensi dengan foto
-- ---------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  photo_url text,
  status text default 'Hadir',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- INVOICES
-- ---------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  member_name text not null,
  description text,
  amount numeric,
  status text check (status in ('Lunas','Pending','Terlambat')) default 'Pending',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- TODOS: daftar tugas milik masing-masing pelatih/atlet
-- ---------------------------------------------------------
create table if not exists todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- EVENTS: agenda / jadwal berikutnya
-- ---------------------------------------------------------
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  event_at timestamptz not null,
  place text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- GUIDE BOOKS: konten edukasi bacaan
-- ---------------------------------------------------------
create table if not exists guide_books (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,           -- pisahkan tiap "halaman" dengan baris kosong ganda
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- VIDEOS: konten edukasi video (tautan file di Storage bucket 'videos')
-- ---------------------------------------------------------
create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  video_url text not null,
  duration text,
  created_at timestamptz default now()
);

-- =========================================================
-- ROW LEVEL SECURITY — wajib aktif agar data tidak bocor antar pengguna
-- =========================================================
alter table profiles enable row level security;
alter table members enable row level security;
alter table attendance enable row level security;
alter table invoices enable row level security;
alter table todos enable row level security;
alter table events enable row level security;
alter table guide_books enable row level security;
alter table videos enable row level security;

-- PROFILES
create policy "lihat profil sendiri" on profiles for select using (auth.uid() = id);
create policy "admin lihat semua profil" on profiles for select using (public.is_admin());
create policy "admin ubah semua profil" on profiles for update using (public.is_admin());
create policy "user ubah profil sendiri" on profiles for update using (auth.uid() = id);

-- MEMBERS
create policy "user login lihat anggota" on members for select using (auth.role() = 'authenticated');
create policy "admin kelola anggota" on members for all using (public.is_admin());

-- ATTENDANCE
create policy "user lihat absensi sendiri" on attendance for select using (auth.uid() = user_id);
create policy "admin lihat semua absensi" on attendance for select using (public.is_admin());
create policy "user catat absensi sendiri" on attendance for insert with check (auth.uid() = user_id);

-- INVOICES
create policy "user login lihat invois" on invoices for select using (auth.role() = 'authenticated');
create policy "admin kelola invois" on invoices for all using (public.is_admin());

-- TODOS
create policy "user kelola todo sendiri" on todos for all using (auth.uid() = user_id);

-- EVENTS
create policy "user login lihat event" on events for select using (auth.role() = 'authenticated');
create policy "admin kelola event" on events for all using (public.is_admin());

-- GUIDE BOOKS
create policy "user login lihat guide book" on guide_books for select using (auth.role() = 'authenticated');
create policy "admin kelola guide book" on guide_books for all using (public.is_admin());

-- VIDEOS
create policy "user login lihat video" on videos for select using (auth.role() = 'authenticated');
create policy "admin kelola video" on videos for all using (public.is_admin());

-- =========================================================
-- STORAGE: bucket avatars dibuat otomatis di sini (setara klik
-- "New bucket" di Storage). Bucket attendance-photos & videos TETAP
-- perlu dibuat manual lewat menu Storage (lihat README Bagian 1.3)
-- karena kita hanya tahu namanya lewat konvensi, bukan lewat kode ini.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Setiap user hanya boleh upload/ubah foto ke folder bernama UID miliknya
-- sendiri di dalam bucket attendance-photos / avatars (dicocokkan dengan
-- cara js/app.js & js/auth.js menamai file: "{user_id}/....jpg").
create policy "user upload foto absensi sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attendance-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "publik lihat foto absensi" on storage.objects
  for select to public using (bucket_id = 'attendance-photos');

create policy "user upload avatar sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user ganti avatar sendiri" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "publik lihat avatar" on storage.objects
  for select to public using (bucket_id = 'avatars');

-- =========================================================
-- DATA AWAL (opsional) — supaya aplikasi tidak kosong melompong saat pertama kali dibuka.
-- Hapus / ubah sesuka Anda lewat Table Editor kapan saja.
-- =========================================================
insert into events (title, event_at, place) values
  ('Latihan Rutin Sore', now() + interval '6 hours', 'Kolam Utama Legawa'),
  ('Uji Tanding Internal', now() + interval '3 days', 'Kolam Kompetisi A'),
  ('Evaluasi Teknik Bulanan', now() + interval '12 days', 'Ruang Pelatih');

insert into guide_books (title, content) values
  ('Fundamental Teknik Start & Balik', 'Persiapan sebelum masuk kolam: pemanasan, peregangan, dan pengecekan peralatan.

Teknik dasar posisi start di atas balok start: kaki menekuk, badan condong ke depan, fokus pandangan ke titik masuk air.

Fase masuk air dan transisi menuju posisi streamline yang efisien.'),
  ('Panduan Nutrisi Atlet Renang', 'Kebutuhan kalori atlet renang lebih tinggi dari olahraga darat karena efek pendinginan air.

Konsumsi karbohidrat kompleks 2-3 jam sebelum latihan berat, dan protein dalam 30 menit setelah latihan untuk pemulihan otot.');

-- =========================================================
-- SELESAI. Langkah selanjutnya ada di README.md bagian "Setup Supabase".
-- =========================================================
