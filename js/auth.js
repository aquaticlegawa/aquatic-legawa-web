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
   Field profil lengkap (ttl, gender, phone, category, address) juga dikirim
   sebagai metadata dan langsung disalin ke tabel profiles oleh trigger —
   lihat sql/migration_profil_dan_storage.sql. Akun baru selalu berstatus
   'pending' sampai disetujui admin. */
async function authSignUp({ fullName, email, password, role, ttl, gender, phone, category, address }) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, role, ttl, gender, phone, category, address } }
  });
  if (error) throw error;
  return data;
}

/* Upload foto profil ke bucket 'avatars' (folder = UID milik user sendiri,
   sesuai izin storage.objects) lalu simpan URL publiknya ke profiles.avatar_url. */
async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) throw upErr;
  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  const { error: updErr } = await sb.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
  if (updErr) throw updErr;
  return data.publicUrl;
}

async function getCurrentProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (error || !data) return null;
  return data;
}
