/* =========================================================
   AUTENTIKASI
   Peran (admin/pelatih/atlet) TIDAK dipilih di form login — diambil otomatis
   dari kolom `role` pada tabel `profiles` di database, supaya orang tidak bisa
   asal klik "Admin" untuk masuk sebagai admin.
========================================================= */

async function authLogin(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function authLogout() {
  await sb.auth.signOut();
}

/* Pendaftaran mandiri untuk Pelatih/Atlet.
   `role` dikirim sebagai metadata, tapi server (trigger di database) hanya
   akan menerimanya kalau nilainya 'pelatih' atau 'atlet' — lihat sql/migration_persetujuan.sql.
   Akun baru selalu berstatus 'pending' sampai disetujui admin. */
async function authSignUp({ fullName, email, password, role }) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, role } }
  });
  if (error) throw error;
  return data;
}

async function getCurrentProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (error || !data) return null;
  return data;
}
