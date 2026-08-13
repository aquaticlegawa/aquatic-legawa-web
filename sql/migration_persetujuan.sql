-- =========================================================
-- Migrasi: Pendaftaran mandiri Pelatih/Atlet + Persetujuan Admin
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Aman dijalankan di database yang sudah berisi data (tidak menghapus apapun).
-- =========================================================

-- 1) Tambah kolom status persetujuan pada profiles
alter table profiles
  add column if not exists status text
  check (status in ('pending','approved','rejected'))
  not null default 'pending';

-- 2) Akun yang perannya sudah 'admin' (Anda) langsung disetujui otomatis
update profiles set status = 'approved' where role = 'admin';

-- 3) Perbarui & perketat trigger pembuatan profil otomatis:
--    - Status awal SELALU 'pending' (perlu di-approve admin)
--    - Peran dari form pendaftaran HANYA boleh 'pelatih' atau 'atlet' —
--      mencegah orang mendaftar sendiri lalu mengaku sebagai 'admin'.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'atlet');
  if requested_role not in ('pelatih','atlet') then
    requested_role := 'atlet';
  end if;

  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    requested_role,
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger-nya sendiri tidak berubah (sudah ada dari setup.sql), cukup fungsinya
-- yang diperbarui lewat CREATE OR REPLACE di atas.

-- =========================================================
-- SELESAI. Langkah selanjutnya: aktifkan opsi "Confirm email" OFF
-- di Authentication → Providers → Email (lihat README bagian Pendaftaran Mandiri).
-- =========================================================
