-- =========================================================
-- Migrasi: Perbaikan izin foto absensi + Profil lengkap saat daftar
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Aman dijalankan di database yang sudah berisi data (tidak menghapus apapun).
-- =========================================================

-- ---------------------------------------------------------
-- 1) PERBAIKAN BUG: "new row violates row-level security policy"
--    saat absen. Penyebabnya: bucket 'attendance-photos' sudah dibuat
--    Public (bisa DIBACA tanpa login), tapi belum ada izin untuk DITULIS
--    (upload foto) oleh user yang login — dua hal yang berbeda di Supabase.
--    Ini menambahkan izin: setiap user hanya boleh upload ke folder
--    bernama UID miliknya sendiri di dalam bucket tsb (sesuai cara
--    js/app.js menamai filenya: "{user_id}/....jpg").
-- ---------------------------------------------------------
drop policy if exists "user upload foto absensi sendiri" on storage.objects;
create policy "user upload foto absensi sendiri"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "publik lihat foto absensi" on storage.objects;
create policy "publik lihat foto absensi"
  on storage.objects for select
  to public
  using (bucket_id = 'attendance-photos');

-- ---------------------------------------------------------
-- 2) BUCKET BARU: 'avatars' — untuk foto profil Pelatih/Atlet.
--    Dibuat langsung lewat SQL (setara klik "New bucket" di menu Storage),
--    jadi Anda tidak perlu bikin manual lagi.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "user upload avatar sendiri" on storage.objects;
create policy "user upload avatar sendiri"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user ganti avatar sendiri" on storage.objects;
create policy "user ganti avatar sendiri"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "publik lihat avatar" on storage.objects;
create policy "publik lihat avatar"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------
-- 3) PENDAFTARAN LENGKAP: form "Daftar" sekarang mengisi semua data
--    profil sekaligus (bukan cuma nama+email+password), supaya Pelatih/
--    Atlet tidak perlu edit ulang setelah disetujui. Trigger pembuatan
--    profil otomatis diperbarui supaya menyimpan field-field baru ini
--    dari metadata pendaftaran.
-- ---------------------------------------------------------
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

-- Trigger-nya sendiri tidak berubah (sudah ada dari setup.sql), cukup fungsinya
-- yang diperbarui lewat CREATE OR REPLACE di atas.

-- =========================================================
-- SELESAI. Setelah menjalankan ini:
-- - Absen foto seharusnya sudah bisa tersimpan.
-- - Form Daftar yang baru akan otomatis mengisi profil lengkap.
-- - Pelatih/Atlet yang SUDAH terlanjur terdaftar sebelumnya masih perlu
--   dilengkapi datanya lewat halaman "Profil Saya" (sekarang bisa diedit
--   sendiri) atau lewat Table Editor Supabase seperti biasa.
-- =========================================================
