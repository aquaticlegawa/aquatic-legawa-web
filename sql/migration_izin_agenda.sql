-- =========================================================
-- Migrasi: Izin Tidak Masuk, Agenda (Pelatih bisa kelola), Poster Event
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Aman dijalankan di database yang sudah berisi data.
-- =========================================================

-- ---------------------------------------------------------
-- 1) ABSENSI: kolom alasan untuk "Izin Tidak Masuk"
-- ---------------------------------------------------------
alter table attendance add column if not exists note text;

-- ---------------------------------------------------------
-- 2) EVENTS (Agenda): kolom deskripsi, cabang, lokasi lengkap, poster,
--    dan pencatatan siapa yang membuat.
-- ---------------------------------------------------------
alter table events add column if not exists description text;
alter table events add column if not exists category text;
alter table events add column if not exists poster_url text;
alter table events add column if not exists created_by uuid references profiles(id) on delete set null;

-- Fungsi bantu: cek apakah pengguna yang login adalah Pelatih (sama pola dengan is_admin()).
create or replace function public.is_pelatih()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'pelatih'
  );
$$ language sql security definer stable;

-- Pelatih sekarang boleh menambah/mengubah/menghapus Agenda juga (sebelumnya hanya admin).
-- Atlet tetap hanya bisa melihat (policy "user login lihat event" yang sudah ada).
drop policy if exists "pelatih kelola event" on events;
create policy "pelatih kelola event" on events for all
  using (public.is_pelatih()) with check (public.is_pelatih());

-- ---------------------------------------------------------
-- 3) STORAGE: bucket 'event-posters' untuk poster pertandingan/acara,
--    hanya admin & pelatih yang boleh upload.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do nothing;

drop policy if exists "admin pelatih upload poster event" on storage.objects;
create policy "admin pelatih upload poster event"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-posters' and (public.is_admin() or public.is_pelatih()));

drop policy if exists "admin pelatih ganti poster event" on storage.objects;
create policy "admin pelatih ganti poster event"
  on storage.objects for update to authenticated
  using (bucket_id = 'event-posters' and (public.is_admin() or public.is_pelatih()));

drop policy if exists "publik lihat poster event" on storage.objects;
create policy "publik lihat poster event"
  on storage.objects for select to public
  using (bucket_id = 'event-posters');

-- =========================================================
-- SELESAI. Setelah menjalankan ini:
-- - Pelatih/Atlet bisa mengajukan Izin dengan alasan di halaman Absensi.
-- - Admin & Pelatih bisa menambah/mengedit Agenda (dengan poster gambar).
-- - Atlet hanya bisa melihat & membuka detail Agenda.
-- =========================================================
