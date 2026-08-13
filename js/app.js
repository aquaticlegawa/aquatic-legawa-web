/* =========================================================
   Aquatic Legawa's Web — App logic (production, Supabase-backed)
========================================================= */

const state = { profile: null, page: null };

const ICONS = {
  home:   '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"/></svg>',
  users:  '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-5.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-.5-7.97"/></svg>',
  invoice:'<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m-6 4h6m-6 4h3M7 3h10a1 1 0 011 1v16l-3-2-2 2-2-2-2 2-3-2V4a1 1 0 011-1z"/></svg>',
  user:   '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0"/></svg>',
  camera: '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
  book:   '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.25C10.5 5 8.5 4.5 6 4.5v13c2.5 0 4.5.5 6 1.75m0-13c1.5-1.25 3.5-1.75 6-1.75v13c-2.5 0-4.5.5-6 1.75m0-13v13"/></svg>',
  check:  '<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

const ROLE_LABEL = { admin: 'Administrator', pelatih: 'Pelatih', atlet: 'Atlet' };

const NAV_CONFIG = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'home' },
    { key: 'persetujuan', label: 'Persetujuan Anggota', icon: 'check' },
    { key: 'anggota', label: 'Data Anggota', icon: 'users' },
    { key: 'invois', label: 'Sistem Invois', icon: 'invoice' },
  ],
  pelatih: [
    { key: 'beranda', label: 'Beranda', icon: 'home' },
    { key: 'profil', label: 'Profil Saya', icon: 'user' },
    { key: 'absensi', label: 'Absensi', icon: 'camera' },
    { key: 'edukasi', label: 'Konten Edukasi', icon: 'book' },
  ],
  atlet: [
    { key: 'beranda', label: 'Beranda', icon: 'home' },
    { key: 'profil', label: 'Profil Saya', icon: 'user' },
    { key: 'absensi', label: 'Absensi', icon: 'camera' },
    { key: 'edukasi', label: 'Konten Edukasi', icon: 'book' },
  ]
};

function laneRope() {
  // Motif bendera backstroke (segitiga kecil bergantian teal/garnet) —
  // diambil langsung dari perlengkapan kolam renang, bukan hiasan generik.
  let flags = '';
  for (let x = 6; x <= 594; x += 24) {
    const teal = (x / 24) % 2 === 0;
    flags += `<path d="M${x-4} 0 L${x+4} 0 L${x} 8 Z" class="${teal ? 'flag-teal' : 'flag-garnet'}"/>`;
  }
  return `<svg class="lane-rope" viewBox="0 0 600 10" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="600" y2="0" class="rope-line"/>${flags}</svg>`;
}

/* =========================================================
   SESSION BOOTSTRAP — cek apakah sudah login setiap kali halaman dibuka
========================================================= */
async function bootstrap() {
  const profile = await getCurrentProfile();
  if (profile) routeAfterAuth(profile);
  else showLogin();
}
bootstrap();

function routeAfterAuth(profile) {
  const normalizedStatus = (profile.status || '').toString().trim().toLowerCase();
  if (normalizedStatus === 'approved') enterApp(profile);
  else showPendingScreen(profile);
}

sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') showLogin();
});

/* =========================================================
   LOGIN
========================================================= */
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  errorBox.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memeriksa…';
  try {
    await authLogin(email, password);
    const profile = await getCurrentProfile();
    if (!profile) throw new Error('Akun ditemukan tapi profil belum tersedia. Hubungi admin.');
    routeAfterAuth(profile);
  } catch (err) {
    errorBox.textContent = err.message === 'Invalid login credentials'
      ? 'Email atau kata sandi salah.'
      : err.message;
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Masuk <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>';
  }
});

/* Satu fungsi terpusat untuk pindah antar layar (Login / Menunggu Persetujuan / App).
   Ini SELALU mematikan semua layar dulu sebelum menyalakan satu yang dituju — jadi
   tidak mungkin ada dua layar yang aktif bersamaan, sekecil apapun urutan kodenya. */
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showLogin() {
  showView('view-login');
}

function showPendingScreen(profile) {
  showView('view-pending');

  const iconWrap = document.getElementById('pending-icon-wrap');
  const title = document.getElementById('pending-title');
  const msg = document.getElementById('pending-message');
  const statusLabel = { pending: 'menunggu', approved: 'disetujui', rejected: 'ditolak' }[profile.status] || profile.status || '(kosong)';

  if (profile.status === 'rejected') {
    iconWrap.style.background = 'var(--garnet-100)';
    iconWrap.innerHTML = '<svg class="h-6 w-6" style="color:var(--garnet-700)" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
    title.textContent = 'Pendaftaran Belum Disetujui';
    msg.textContent = 'Admin klub belum bisa menyetujui akun ini. Silakan hubungi admin secara langsung untuk informasi lebih lanjut.';
  } else {
    iconWrap.style.background = 'var(--teal-50)';
    iconWrap.innerHTML = '<svg class="h-6 w-6" style="color:var(--teal-700)" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    title.textContent = 'Menunggu Persetujuan';
    msg.textContent = `Halo ${profile.full_name || profile.email}, pendaftaran Anda sebagai ${ROLE_LABEL[profile.role] || profile.role} sudah diterima. Admin klub akan meninjau dan mengaktifkan akun Anda.`;
  }
  // Info debug kecil — bantu memastikan nilai kolom `status` di database sudah benar.
  msg.innerHTML += `<br><span style="font-size:11px; opacity:.55">(status akun saat ini: ${esc(statusLabel)})</span>`;
}

document.getElementById('pending-logout-btn').addEventListener('click', async () => {
  await authLogout();
  showLogin();
});

/* ---- Tab Masuk / Daftar ---- */
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
function setAuthTab(tab) {
  document.getElementById('panel-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('panel-signup').classList.toggle('hidden', tab !== 'signup');
  tabLogin.classList.toggle('auth-tab-active', tab === 'login');
  tabSignup.classList.toggle('auth-tab-active', tab === 'signup');
}
tabLogin.addEventListener('click', () => setAuthTab('login'));
tabSignup.addEventListener('click', () => setAuthTab('signup'));
setAuthTab('login');

/* ---- Form Daftar (Pelatih/Atlet) ---- */
let signupRole = null;
let signupAvatarFile = null;
document.querySelectorAll('[data-signup-role]').forEach(btn => {
  btn.addEventListener('click', () => {
    signupRole = btn.dataset.signupRole;
    document.querySelectorAll('[data-signup-role]').forEach(b => b.classList.remove('role-btn-active'));
    btn.classList.add('role-btn-active');
  });
});

document.getElementById('signup-avatar-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  signupAvatarFile = file;
  const preview = document.getElementById('signup-avatar-preview');
  const reader = new FileReader();
  reader.onload = () => { preview.innerHTML = `<img src="${reader.result}" class="h-full w-full object-cover" alt="Pratinjau foto profil">`; };
  reader.readAsDataURL(file);
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('signup-error');
  const submitBtn = document.getElementById('signup-submit');
  errorBox.classList.add('hidden');

  if (!signupRole) {
    errorBox.textContent = 'Pilih peran: Pelatih atau Atlet.';
    errorBox.classList.remove('hidden');
    return;
  }

  const fullName = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const ttl = document.getElementById('signup-ttl').value.trim();
  const gender = document.getElementById('signup-gender').value;
  const phone = document.getElementById('signup-phone').value.trim();
  const category = document.getElementById('signup-category').value;
  const address = document.getElementById('signup-address').value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Mendaftarkan…';
  try {
    const signUpData = await authSignUp({ fullName, email, password, role: signupRole, ttl, gender, phone, category, address });
    const profile = await getCurrentProfile();
    if (profile) {
      if (signupAvatarFile) {
        try { await uploadAvatar(profile.id, signupAvatarFile); } catch (avErr) { console.warn('Gagal unggah foto profil:', avErr.message); }
      }
      routeAfterAuth(profile);
    } else {
      showToast('Pendaftaran terkirim. Silakan cek email untuk konfirmasi, lalu masuk.');
      setAuthTab('login');
    }
  } catch (err) {
    errorBox.textContent = err.message.includes('already registered')
      ? 'Email ini sudah terdaftar. Coba menu Masuk.'
      : err.message;
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Daftar';
  }
});

function enterApp(profile) {
  state.profile = profile;
  showView('view-app');
  document.getElementById('topbar-name').textContent = profile.full_name || profile.email;
  document.getElementById('topbar-role').textContent = ROLE_LABEL[profile.role] || profile.role;
  updateTopbarAvatar(profile.avatar_url);
  buildNav(profile.role);
  navigateTo(NAV_CONFIG[profile.role][0].key);
}

function updateTopbarAvatar(url) {
  const img = document.getElementById('topbar-avatar');
  if (img) img.src = url || 'assets/logo-icon.png';
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await authLogout();
  state.profile = null; state.page = null;
  showLogin();
});

/* =========================================================
   NAV
========================================================= */
function buildNav(role) {
  const items = NAV_CONFIG[role];
  document.getElementById('nav-list').innerHTML = items.map(it => `
    <button data-page="${it.key}" class="nav-item font-nav">${ICONS[it.icon]}<span>${it.label}</span></button>`).join('');
  document.getElementById('bottom-nav').innerHTML = items.map(it => `
    <button data-page="${it.key}" class="bottom-item font-nav"><span class="dot"></span>${ICONS[it.icon]}<span>${it.label}</span></button>`).join('');
  document.querySelectorAll('#nav-list .nav-item').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));
  document.querySelectorAll('#bottom-nav .bottom-item').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));
}

function navigateTo(key) {
  state.page = key;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active-nav', b.dataset.page === key));
  document.querySelectorAll('.bottom-item').forEach(b => b.classList.toggle('active-nav', b.dataset.page === key));
  renderPage(key);
  window.scrollTo(0, 0);
  closeSidebar();
}

const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
document.getElementById('sidebar-toggle').addEventListener('click', () => { sidebar.classList.remove('-translate-x-full'); backdrop.classList.remove('hidden'); });
document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);
function closeSidebar() { sidebar.classList.add('-translate-x-full'); backdrop.classList.add('hidden'); }

/* =========================================================
   RENDER HALAMAN (async — ambil data nyata dari Supabase)
========================================================= */
async function renderPage(key) {
  const root = document.getElementById('page-content');
  root.innerHTML = skeletonBlock();
  const renderers = {
    dashboard: pageAdminDashboard, anggota: pageAdminAnggota, invois: pageAdminInvois,
    persetujuan: pageAdminPersetujuan,
    beranda: pageBeranda, profil: pageProfil, absensi: pageAbsensi, edukasi: pageEdukasi,
  };
  try {
    const html = await (renderers[key] || pageAdminDashboard)();
    if (state.page !== key) return;
    root.innerHTML = `<div class="page-enter">${html}</div>`;
    bindPageEvents(key);
  } catch (err) {
    root.innerHTML = errorBlock(err.message);
  }
}

function skeletonBlock() {
  return `<div class="space-y-4">
    <div class="h-4 w-40 rounded skeleton-shimmer"></div>
    <div class="h-24 rounded-[14px] skeleton-shimmer"></div>
    <div class="h-40 rounded-[14px] skeleton-shimmer"></div>
  </div>`;
}
function errorBlock(msg) {
  return `<div class="card p-5" style="border-color:rgba(147,27,46,.3)">
    <p class="font-display font-bold" style="color:var(--garnet-700)">Gagal memuat data</p>
    <p class="text-sm text-ink/60 mt-1">${msg}</p>
    <p class="text-xs text-ink/40 mt-3">Periksa apakah SUPABASE_URL/ANON_KEY di js/supabase-client.js sudah benar, dan skrip sql/setup.sql sudah dijalankan.</p>
  </div>`;
}

function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="mb-7">
      <p class="eyebrow mb-1.5">${eyebrow}</p>
      <h1 class="font-display font-extrabold text-2xl sm:text-[1.85rem] text-ink">${title}</h1>
      ${subtitle ? `<p class="text-sm text-ink/50 mt-1.5 max-w-xl">${subtitle}</p>` : ''}
      <div class="mt-4 max-w-[220px]">${laneRope()}</div>
    </div>`;
}

/* ---------------- ADMIN: Dashboard ---------------- */
async function pageAdminDashboard() {
  const [{ count: totalPelatih }, { count: totalAtlet }, { count: hadirHariIni }, { count: invoisPending }, { count: menungguPersetujuan }] = await Promise.all([
    sb.from('members').select('*', { count: 'exact', head: true }).eq('role', 'Pelatih'),
    sb.from('members').select('*', { count: 'exact', head: true }).eq('role', 'Atlet'),
    sb.from('attendance').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().slice(0,10)),
    sb.from('invoices').select('*', { count: 'exact', head: true }).neq('status', 'Lunas'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const stats = [
    { label: 'Absensi Hari Ini', value: hadirHariIni ?? 0, sub: 'Total pelatih + atlet yang sudah absen' },
    { label: 'Invois Belum Lunas', value: invoisPending ?? 0, sub: 'Pending atau terlambat' },
    { label: 'Total Pelatih', value: totalPelatih ?? 0, sub: 'Terdaftar di Data Anggota' },
    { label: 'Total Atlet', value: totalAtlet ?? 0, sub: 'Terdaftar di Data Anggota' },
  ];
  const cols = stats.map(s => `
    <div class="scoreboard-col">
      <p class="scoreboard-label font-nav">${s.label}</p>
      <p class="scoreboard-value">${s.value}</p>
      <p class="scoreboard-sub">${s.sub}</p>
    </div>`).join('');

  const { data: members } = await sb.from('members').select('*').order('created_at', { ascending: false }).limit(5);
  const { data: invoices } = await sb.from('invoices').select('*').order('created_at', { ascending: false }).limit(4);

  const pendingBanner = (menungguPersetujuan ?? 0) > 0 ? `
    <div class="mb-8 rounded-[14px] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4" style="background:var(--garnet-600)">
      <div>
        <p class="font-display font-bold">${menungguPersetujuan} pendaftaran menunggu persetujuan</p>
        <p class="text-sm text-white/75 mt-0.5">Pelatih/Atlet baru tidak bisa masuk sampai Anda menyetujui akunnya.</p>
      </div>
      <button data-page="persetujuan" class="nav-link-btn shrink-0 rounded-[8px] bg-white font-display font-bold text-sm px-4 py-2.5 hover:opacity-90 transition" style="color:var(--garnet-700)">Tinjau Sekarang</button>
    </div>` : '';

  return `
    ${pageHeader('Admin · Ringkasan', 'Dashboard', 'Pantau kehadiran pelatih &amp; atlet, serta kelola data keanggotaan klub.')}
    <div class="scoreboard mb-8">${cols}</div>
    ${pendingBanner}

    <div class="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="font-display font-bold text-ink text-sm">Import Data Keanggotaan</p>
        <p class="text-xs text-ink/50 mt-1">Unggah berkas Excel/CSV (kolom: Nama, Email, Role, Cabang) untuk menambah data secara massal.</p>
      </div>
      <button id="open-import-modal" class="btn-primary shrink-0">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></svg>
        Import Data Excel
      </button>
    </div>

    <div class="flex items-center justify-between mb-3">
      <h2 class="font-display font-bold text-ink">Daftar Anggota Terbaru</h2>
      <button data-page="anggota" class="nav-link-btn text-xs font-semibold text-[var(--teal-700)] hover:text-[var(--teal-900)]">Lihat semua →</button>
    </div>
    ${categoriesTable(members || [])}

    <div class="flex items-center justify-between mt-8 mb-3">
      <h2 class="font-display font-bold text-ink">Sistem Invois</h2>
      <button data-page="invois" class="nav-link-btn text-xs font-semibold text-[var(--teal-700)] hover:text-[var(--teal-900)]">Lihat semua →</button>
    </div>
    ${invoiceTable(invoices || [])}
  `;
}

function categoriesTable(rows) {
  if (!rows.length) return emptyState('Belum ada data anggota. Tambahkan lewat Import Excel di atas.');
  return `
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead><tr><th>Nama</th><th class="hidden sm:table-cell">Email</th><th>Role</th><th>Cabang</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td class="font-medium">${esc(r.nama)}</td>
              <td class="text-ink/55 hidden sm:table-cell">${esc(r.email || '—')}</td>
              <td><span class="tag ${r.role === 'Pelatih' ? 'tag-teal' : 'tag-garnet'}">${esc(r.role || '—')}</span></td>
              <td class="text-ink/70">${esc(r.cabang || '—')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function invoiceTable(rows) {
  if (!rows.length) return emptyState('Belum ada invois. Tambahkan lewat form di bawah.');
  const statusTag = { 'Lunas':'tag-teal', 'Pending':'tag-amber', 'Terlambat':'tag-garnet' };
  return `
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead><tr><th>Nama</th><th class="hidden sm:table-cell">Keterangan</th><th>Jumlah</th><th>Status</th><th>Tanggal</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td class="font-medium">${esc(r.member_name)}</td>
              <td class="text-ink/55 hidden sm:table-cell">${esc(r.description || '—')}</td>
              <td class="text-ink/70">${formatRupiah(r.amount)}</td>
              <td><span class="tag ${statusTag[r.status] || 'tag-amber'}">${esc(r.status)}</span></td>
              <td class="text-ink/45 text-xs">${formatDate(r.created_at)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function emptyState(msg) {
  return `<div class="card p-8 text-center text-sm text-ink/45">${msg}</div>`;
}

/* ---------------- ADMIN: Data Anggota (full + tambah manual) ---------------- */
async function pageAdminAnggota() {
  const { data: members, error } = await sb.from('members').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return `
    ${pageHeader('Admin · Keanggotaan', 'Data Anggota — Semua Kategori', 'Daftar lengkap pelatih dan atlet lintas cabang olahraga.')}

    <div class="card p-5 mb-6">
      <p class="font-display font-bold text-sm text-ink mb-3">Tambah Anggota Manual</p>
      <form id="add-member-form" class="grid sm:grid-cols-4 gap-3">
        <input required name="nama" placeholder="Nama" class="field sm:col-span-1">
        <input name="email" placeholder="Email" type="email" class="field sm:col-span-1">
        <select name="role" class="field sm:col-span-1">
          <option value="Pelatih">Pelatih</option>
          <option value="Atlet">Atlet</option>
        </select>
        <input name="cabang" placeholder="Cabang (mis. Renang)" class="field sm:col-span-1">
        <button type="submit" class="btn-primary sm:col-span-4">Tambah Anggota</button>
      </form>
    </div>

    <div class="flex items-center justify-between mb-3">
      <h2 class="font-display font-bold text-ink">Daftar Anggota (${(members||[]).length})</h2>
      <button id="open-import-modal-2" class="text-xs font-semibold text-[var(--teal-700)] hover:text-[var(--teal-900)]">Import Excel →</button>
    </div>
    ${categoriesTable(members || [])}
  `;
}

/* ---------------- ADMIN: Persetujuan Anggota ---------------- */
async function pageAdminPersetujuan() {
  const [{ data: pending, error }, { data: recent }] = await Promise.all([
    sb.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    sb.from('profiles').select('*').in('status', ['approved','rejected']).neq('role','admin').order('created_at', { ascending: false }).limit(8),
  ]);
  if (error) throw error;

  const pendingCards = (pending||[]).length ? pending.map(p => `
    <div class="card p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p class="font-display font-bold text-sm text-ink">${esc(p.full_name || p.email)}</p>
        <p class="text-xs text-ink/50 mt-0.5">${esc(p.email)} · <span class="tag ${p.role==='Pelatih'||p.role==='pelatih' ? 'tag-teal':'tag-garnet'}">${esc(ROLE_LABEL[p.role] || p.role)}</span> · Daftar ${formatDate(p.created_at)}</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <button data-reject="${p.id}" class="btn-ghost !px-4 !py-2">Tolak</button>
        <button data-approve="${p.id}" class="btn-primary !px-4 !py-2">Setujui</button>
      </div>
    </div>`).join('') : emptyState('Tidak ada pendaftaran yang menunggu saat ini.');

  const recentRows = (recent||[]).length ? `
  <div class="card overflow-hidden mt-3">
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead><tr><th>Nama</th><th class="hidden sm:table-cell">Email</th><th>Peran</th><th>Status</th></tr></thead>
        <tbody>
          ${recent.map(p => `
            <tr>
              <td class="font-medium">${esc(p.full_name || p.email)}</td>
              <td class="text-ink/55 hidden sm:table-cell">${esc(p.email)}</td>
              <td class="text-ink/70">${esc(ROLE_LABEL[p.role] || p.role)}</td>
              <td><span class="tag ${p.status === 'approved' ? 'tag-teal' : 'tag-garnet'}">${p.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : '';

  return `
    ${pageHeader('Admin · Keanggotaan', 'Persetujuan Anggota', 'Setujui atau tolak pendaftaran mandiri dari Pelatih &amp; Atlet.')}
    <div class="space-y-3 mb-8">${pendingCards}</div>
    ${recentRows ? `<h2 class="font-display font-bold text-ink mb-3">Riwayat Terbaru</h2>${recentRows}` : ''}
  `;
}

/* ---------------- ADMIN: Invois (full + tambah) ---------------- */
async function pageAdminInvois() {
  const { data: invoices, error } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return `
    ${pageHeader('Admin · Keuangan', 'Sistem Invois', 'Riwayat tagihan iuran dan biaya tambahan seluruh anggota.')}

    <div class="card p-5 mb-6">
      <p class="font-display font-bold text-sm text-ink mb-3">Buat Invois Baru</p>
      <form id="add-invoice-form" class="grid sm:grid-cols-4 gap-3">
        <input required name="member_name" placeholder="Nama anggota" class="field sm:col-span-1">
        <input name="description" placeholder="Keterangan" class="field sm:col-span-1">
        <input required name="amount" placeholder="Jumlah (angka saja)" type="number" min="0" class="field sm:col-span-1">
        <select name="status" class="field sm:col-span-1">
          <option value="Pending">Pending</option>
          <option value="Lunas">Lunas</option>
          <option value="Terlambat">Terlambat</option>
        </select>
        <button type="submit" class="btn-primary sm:col-span-4">Buat Invois</button>
      </form>
    </div>

    ${invoiceTable(invoices || [])}
  `;
}

/* ---------------- PELATIH / ATLET: Beranda ---------------- */
async function pageBeranda() {
  const uid = state.profile.id;
  const [{ data: todos }, { data: events }] = await Promise.all([
    sb.from('todos').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    sb.from('events').select('*').gte('event_at', new Date().toISOString()).order('event_at', { ascending: true }).limit(5),
  ]);

  return `
    ${pageHeader(ROLE_LABEL[state.profile.role], `Halo, ${(state.profile.full_name || state.profile.email).split(' ')[0]}`, 'Berikut ringkasan aktivitas dan jadwal Anda hari ini.')}

    <div class="grid lg:grid-cols-2 gap-5">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display font-bold text-ink">Daftar Tugas</h2>
          <span class="tag tag-teal">${(todos||[]).filter(t=>!t.done).length} tersisa</span>
        </div>
        <ul class="space-y-2.5 mb-4" id="todo-list">
          ${(todos||[]).length ? todos.map(t => `
            <li class="flex items-center gap-3 text-sm">
              <button data-todo="${t.id}" data-done="${t.done}" class="todo-check h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition ${t.done ? 'bg-[var(--teal-700)] border-[var(--teal-700)]' : 'border-ink/20'}">
                ${t.done ? '<svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
              </button>
              <span class="${t.done ? 'line-through text-ink/35' : 'text-ink/80'}">${esc(t.text)}</span>
            </li>`).join('') : `<li class="text-sm text-ink/40">Belum ada tugas. Tambahkan di bawah.</li>`}
        </ul>
        <form id="add-todo-form" class="flex gap-2">
          <input name="text" required placeholder="Tugas baru…" class="field flex-1">
          <button type="submit" class="btn-primary px-4">Tambah</button>
        </form>
      </div>

      <div class="card p-5">
        <h2 class="font-display font-bold text-ink mb-4">Agenda Terdekat</h2>
        ${(events||[]).length ? `<ul class="space-y-3">${events.map(ev => `
            <li class="flex items-start gap-3">
              <div class="h-9 w-9 rounded-[10px] bg-[var(--teal-50)] text-[var(--teal-800)] flex items-center justify-center shrink-0">
                <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-ink">${esc(ev.title)}</p>
                <p class="text-xs text-ink/45 mt-0.5">${formatDateTime(ev.event_at)} · ${esc(ev.place || '—')}</p>
              </div>
            </li>`).join('')}</ul>` : emptyState('Belum ada agenda mendatang.')}
      </div>
    </div>

    <div class="mt-6 rounded-[14px] bg-[var(--teal-900)] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="font-display font-bold">Belum absen hari ini?</p>
        <p class="text-sm text-white/65 mt-0.5">Catat kehadiran latihan Anda hanya dengan beberapa detik.</p>
      </div>
      <button data-page="absensi" class="nav-link-btn shrink-0 rounded-[8px] bg-white text-[var(--teal-900)] font-display font-bold text-sm px-4 py-2.5 hover:bg-[var(--teal-50)] transition">Absen Sekarang</button>
    </div>
  `;
}

/* ---------------- PELATIH / ATLET: Profil (bisa diedit sendiri) ---------------- */
async function pageProfil() {
  const p = state.profile;
  const avatarImg = p.avatar_url
    ? `<img src="${esc(p.avatar_url)}" class="h-16 w-16 rounded-full ring-4 ring-[var(--teal-50)] object-cover" alt="Foto profil">`
    : `<div class="h-16 w-16 rounded-full ring-4 ring-[var(--teal-50)] flex items-center justify-center" style="background:var(--teal-50)"><svg class="h-7 w-7" style="color:var(--teal-700)" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0"/></svg></div>`;
  return `
    ${pageHeader(ROLE_LABEL[p.role], 'Profil Saya', 'Ubah data Anda sendiri kapan saja — perubahan tersimpan langsung.')}
    <div class="card p-5 sm:p-7 max-w-2xl">
      <div class="flex items-center gap-4 mb-7">
        <div id="profil-avatar-wrap" class="relative">
          ${avatarImg}
          <label class="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer" style="background:var(--teal-800); border:2px solid var(--card)">
            <input type="file" id="profil-avatar-input" accept="image/*" class="hidden">
            <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </label>
        </div>
        <div>
          <p class="font-display font-bold text-lg text-ink">${esc(p.full_name || p.email)}</p>
          <p class="text-sm text-ink/50">${esc(p.category || ROLE_LABEL[p.role])}</p>
        </div>
      </div>
      <form id="profil-edit-form" class="grid sm:grid-cols-2 gap-x-5 gap-y-5">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Nama Lengkap</label>
          <input name="full_name" type="text" value="${esc(p.full_name)}" class="field">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Email</label>
          <input type="text" value="${esc(p.email)}" disabled class="field">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Tempat, Tanggal Lahir</label>
          <input name="ttl" type="text" value="${esc(p.ttl)}" placeholder="mis. Jakarta, 12 Mei 2010" class="field">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Jenis Kelamin</label>
          <select name="gender" class="field">
            <option value="" ${!p.gender ? 'selected' : ''}>Pilih…</option>
            <option value="Laki-laki" ${p.gender==='Laki-laki'?'selected':''}>Laki-laki</option>
            <option value="Perempuan" ${p.gender==='Perempuan'?'selected':''}>Perempuan</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">No. HP</label>
          <input name="phone" type="tel" value="${esc(p.phone)}" placeholder="08xxxxxxxxxx" class="field">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Cabang Olahraga</label>
          <select name="category" class="field">
            <option value="" ${!p.category?'selected':''}>Pilih…</option>
            <option value="Renang" ${p.category==='Renang'?'selected':''}>Renang</option>
            <option value="Polo Air" ${p.category==='Polo Air'?'selected':''}>Polo Air</option>
            <option value="Loncat Indah" ${p.category==='Loncat Indah'?'selected':''}>Loncat Indah</option>
            <option value="Renang Indah" ${p.category==='Renang Indah'?'selected':''}>Renang Indah</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5 font-nav">Alamat</label>
          <textarea name="address" rows="2" class="field">${esc(p.address || '')}</textarea>
        </div>
        <div class="sm:col-span-2 flex items-center gap-3">
          <button type="submit" id="profil-save-btn" class="btn-primary">Simpan Perubahan</button>
          <span id="profil-save-status" class="text-xs text-ink/45"></span>
        </div>
      </form>
    </div>
  `;
}

/* ---------------- PELATIH / ATLET: Absensi ---------------- */
async function pageAbsensi() {
  const { data: history } = await sb.from('attendance').select('*').eq('user_id', state.profile.id).order('created_at', { ascending: false }).limit(5);
  return `
    ${pageHeader(ROLE_LABEL[state.profile.role], 'Absensi Kehadiran', 'Rekam kehadiran latihan menggunakan kamera perangkat Anda.')}
    <div class="card p-6 sm:p-10 text-center max-w-lg mx-auto">
      <div class="h-14 w-14 rounded-[12px] bg-[var(--teal-50)] text-[var(--teal-800)] flex items-center justify-center mx-auto mb-4">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </div>
      <h2 class="font-display font-bold text-ink text-lg">Rekam Kehadiran Hari Ini</h2>
      <p class="text-sm text-ink/50 mt-1.5 mb-6">Browser akan meminta izin akses kamera saat pertama kali digunakan.</p>
      <button id="open-absen-modal" class="btn-primary px-6">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Absen Kehadiran
      </button>
      <div class="mt-8 pt-6 border-t border-ink/10 text-left">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-3 font-nav">Riwayat Terbaru</p>
        ${(history||[]).length ? `<ul class="space-y-2 text-sm">${history.map(h => `
          <li class="flex justify-between text-ink/70"><span>${formatDateTime(h.created_at)}</span><span class="text-[var(--teal-700)] font-semibold">${esc(h.status)}</span></li>`).join('')}</ul>`
          : `<p class="text-sm text-ink/40">Belum ada riwayat absensi.</p>`}
      </div>
    </div>
  `;
}

/* ---------------- PELATIH / ATLET: Konten Edukasi ---------------- */
async function pageEdukasi() {
  const [{ data: books }, { data: videos }] = await Promise.all([
    sb.from('guide_books').select('*').order('created_at', { ascending: false }),
    sb.from('videos').select('*').order('created_at', { ascending: false }),
  ]);
  window.__EDU_BOOKS__ = books || [];
  window.__EDU_VIDEOS__ = videos || [];

  return `
    ${pageHeader(ROLE_LABEL[state.profile.role], 'Konten Edukasi', 'Materi bacaan dan video pelatihan resmi Aquatic Legawa.')}

    <div class="mb-8">
      <h2 class="font-display font-bold text-ink mb-3">Guide Book</h2>
      ${(books||[]).length ? `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${books.map((g,i) => `
          <button data-guidebook="${i}" class="guidebook-card card text-left p-5 hover:border-[var(--teal-700)]/40 transition">
            <div class="h-11 w-11 rounded-[10px] bg-[var(--teal-50)] text-[var(--teal-800)] flex items-center justify-center mb-4">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.25C10.5 5 8.5 4.5 6 4.5v13c2.5 0 4.5.5 6 1.75m0-13c1.5-1.25 3.5-1.75 6-1.75v13c-2.5 0-4.5.5-6 1.75v13z"/></svg>
            </div>
            <p class="font-display font-bold text-sm text-ink leading-snug">${esc(g.title)}</p>
            <p class="text-xs text-ink/45 mt-1.5">Mode baca</p>
          </button>`).join('')}</div>` : emptyState('Belum ada Guide Book. Admin bisa menambah lewat Table Editor Supabase (tabel guide_books).')}
    </div>

    <div>
      <h2 class="font-display font-bold text-ink mb-3">Video Edukasi</h2>
      ${(videos||[]).length ? `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${videos.map((v,i) => `
          <button data-video="${i}" class="video-card card overflow-hidden text-left hover:border-[var(--teal-700)]/40 transition">
            <div class="relative aspect-video bg-[var(--teal-900)] cam-texture flex items-center justify-center">
              <div class="relative h-11 w-11 rounded-full bg-white/15 flex items-center justify-center">
                <svg class="h-5 w-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="absolute bottom-2 right-2 text-[10px] font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded">${esc(v.duration || '')}</span>
            </div>
            <div class="p-4"><p class="font-display font-bold text-sm text-ink leading-snug">${esc(v.title)}</p><p class="text-xs text-ink/45 mt-1">Streaming · tanpa unduh</p></div>
          </button>`).join('')}</div>` : emptyState('Belum ada video. Admin bisa menambah lewat Table Editor Supabase (tabel videos, isi video_url dari Storage bucket "videos").')}
    </div>
  `;
}

/* =========================================================
   HELPERS
========================================================= */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatRupiah(n) {
  if (n === null || n === undefined) return '—';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

/* =========================================================
   EVENT BINDING PER HALAMAN
========================================================= */
function bindPageEvents(key) {
  document.querySelectorAll('.nav-link-btn').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));

  const importBtn = document.getElementById('open-import-modal') || document.getElementById('open-import-modal-2');
  if (importBtn) importBtn.addEventListener('click', () => openModal('modal-import'));

  const absenBtn = document.getElementById('open-absen-modal');
  if (absenBtn) absenBtn.addEventListener('click', openCameraModal);

  document.querySelectorAll('.guidebook-card').forEach(b => b.addEventListener('click', () => openGuideBook(+b.dataset.guidebook)));
  document.querySelectorAll('.video-card').forEach(b => b.addEventListener('click', () => openVideo(+b.dataset.video)));

  document.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    const { error } = await sb.from('profiles').update({ status: 'approved' }).eq('id', b.dataset.approve);
    if (error) { showToast('Gagal menyetujui: ' + error.message); b.disabled = false; return; }
    showToast('Anggota disetujui.');
    renderPage('persetujuan');
  }));
  document.querySelectorAll('[data-reject]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Tolak pendaftaran ini?')) return;
    b.disabled = true;
    const { error } = await sb.from('profiles').update({ status: 'rejected' }).eq('id', b.dataset.reject);
    if (error) { showToast('Gagal menolak: ' + error.message); b.disabled = false; return; }
    showToast('Pendaftaran ditolak.');
    renderPage('persetujuan');
  }));

  const addMemberForm = document.getElementById('add-member-form');
  if (addMemberForm) addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(addMemberForm);
    const { error } = await sb.from('members').insert({
      nama: fd.get('nama'), email: fd.get('email') || null, role: fd.get('role'), cabang: fd.get('cabang') || null,
    });
    if (error) { showToast('Gagal menambah anggota: ' + error.message); return; }
    showToast('Anggota ditambahkan.');
    renderPage('anggota');
  });

  const addInvoiceForm = document.getElementById('add-invoice-form');
  if (addInvoiceForm) addInvoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(addInvoiceForm);
    const { error } = await sb.from('invoices').insert({
      member_name: fd.get('member_name'), description: fd.get('description') || null,
      amount: Number(fd.get('amount')), status: fd.get('status'),
    });
    if (error) { showToast('Gagal membuat invois: ' + error.message); return; }
    showToast('Invois dibuat.');
    renderPage('invois');
  });

  const addTodoForm = document.getElementById('add-todo-form');
  if (addTodoForm) addTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(addTodoForm);
    const text = fd.get('text').trim();
    if (!text) return;
    const { error } = await sb.from('todos').insert({ user_id: state.profile.id, text });
    if (error) { showToast('Gagal menambah tugas: ' + error.message); return; }
    addTodoForm.reset();
    renderPage('beranda');
  });

  document.querySelectorAll('.todo-check').forEach(b => b.addEventListener('click', async () => {
    const id = b.dataset.todo;
    const done = b.dataset.done === 'true';
    const { error } = await sb.from('todos').update({ done: !done }).eq('id', id);
    if (error) { showToast('Gagal memperbarui tugas.'); return; }
    renderPage('beranda');
  }));

  /* ---- Profil Saya: simpan perubahan data ---- */
  const profilForm = document.getElementById('profil-edit-form');
  if (profilForm) profilForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(profilForm);
    const saveBtn = document.getElementById('profil-save-btn');
    const statusEl = document.getElementById('profil-save-status');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan…';
    const updates = {
      full_name: fd.get('full_name').trim() || null,
      ttl: fd.get('ttl').trim() || null,
      gender: fd.get('gender') || null,
      phone: fd.get('phone').trim() || null,
      category: fd.get('category') || null,
      address: fd.get('address').trim() || null,
    };
    const { error } = await sb.from('profiles').update(updates).eq('id', state.profile.id);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Simpan Perubahan';
    if (error) { showToast('Gagal menyimpan: ' + error.message); return; }
    Object.assign(state.profile, updates);
    document.getElementById('topbar-name').textContent = state.profile.full_name || state.profile.email;
    statusEl.textContent = 'Tersimpan ✓';
    showToast('Profil berhasil diperbarui.');
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2500);
  });

  /* ---- Profil Saya: ganti foto profil ---- */
  const avatarInput = document.getElementById('profil-avatar-input');
  if (avatarInput) avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Mengunggah foto…');
      const url = await uploadAvatar(state.profile.id, file);
      state.profile.avatar_url = url;
      renderPage('profil');
      updateTopbarAvatar(url);
      showToast('Foto profil diperbarui.');
    } catch (err) {
      showToast('Gagal mengunggah foto: ' + err.message);
    }
  });
}

/* =========================================================
   MODAL HELPERS
========================================================= */
function openModal(id) { const m = document.getElementById(id); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeModal(id) { const m = document.getElementById(id); m.classList.add('hidden'); m.classList.remove('flex'); }
document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.closeModal)));
document.querySelectorAll('[id^="modal-"]').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));

/* =========================================================
   ABSENSI — kamera & unggah foto sungguhan ke Supabase Storage
========================================================= */
let mediaStream = null;
async function openCameraModal() {
  openModal('modal-absen');
  document.getElementById('absen-result').classList.add('hidden');
  const video = document.getElementById('camera-video');
  const captureBtn = document.getElementById('capture-btn');
  captureBtn.disabled = false;
  captureBtn.innerHTML = camIconSvg() + ' Ambil &amp; Catat';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = mediaStream;
    document.getElementById('camera-placeholder').classList.add('hidden');
  } catch (err) {
    document.getElementById('camera-placeholder').classList.remove('hidden');
    document.getElementById('camera-placeholder-text').textContent = 'Tidak bisa mengakses kamera. Izinkan akses kamera di pengaturan browser Anda.';
  }
}
function stopCamera() {
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
}
function camIconSvg() {
  return '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
}

document.getElementById('capture-btn').addEventListener('click', async () => {
  const video = document.getElementById('camera-video');
  const btn = document.getElementById('capture-btn');
  if (!mediaStream || !video.videoWidth) { showToast('Kamera belum siap.'); return; }
  btn.disabled = true;
  btn.textContent = 'Memproses…';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    const fileName = `${state.profile.id}/${Date.now()}.jpg`;
    const { error: upErr } = await sb.storage.from('attendance-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (upErr) throw upErr;
    const { data: urlData } = sb.storage.from('attendance-photos').getPublicUrl(fileName);
    const { error: insErr } = await sb.from('attendance').insert({ user_id: state.profile.id, photo_url: urlData.publicUrl, status: 'Hadir' });
    if (insErr) throw insErr;

    document.getElementById('absen-timestamp').textContent = formatDateTime(new Date().toISOString());
    document.getElementById('absen-result').classList.remove('hidden');
    btn.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Tercatat';
    stopCamera();
    showToast('Absensi berhasil dicatat.');
  } catch (err) {
    showToast('Gagal mencatat absensi: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = camIconSvg() + ' Ambil &amp; Catat';
  }
});
document.getElementById('modal-absen').addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]')) stopCamera(); });

/* =========================================================
   IMPORT EXCEL — parsing sungguhan via SheetJS, insert ke tabel members
========================================================= */
const fileInput = document.getElementById('file-input');
const importStartBtn = document.getElementById('import-start-btn');
let pendingRows = [];

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  document.getElementById('dropzone-filename').textContent = file.name;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  pendingRows = rows.map(r => ({
    nama: r.Nama || r.nama || r.NAMA || '',
    email: r.Email || r.email || r.EMAIL || '',
    role: r.Role || r.role || r.ROLE || '',
    cabang: r.Cabang || r.cabang || r.CABANG || '',
  })).filter(r => r.nama);
  document.getElementById('dropzone-filename').textContent = `${file.name} — ${pendingRows.length} baris terbaca`;
  importStartBtn.disabled = pendingRows.length === 0;
});

importStartBtn.addEventListener('click', async () => {
  if (!pendingRows.length) return;
  document.getElementById('import-progress-wrap').classList.remove('hidden');
  importStartBtn.disabled = true;
  document.getElementById('import-status-text').textContent = 'Mengunggah ke database…';
  document.getElementById('import-bar').style.width = '40%';
  document.getElementById('import-percent').textContent = '40%';
  const { error } = await sb.from('members').insert(pendingRows);
  document.getElementById('import-bar').style.width = '100%';
  document.getElementById('import-percent').textContent = '100%';
  if (error) {
    document.getElementById('import-status-text').textContent = 'Gagal: ' + error.message;
    return;
  }
  document.getElementById('import-status-text').textContent = 'Selesai';
  document.getElementById('import-success').classList.remove('hidden');
  document.getElementById('import-success-text').textContent = `${pendingRows.length} baris berhasil diimpor`;
  showToast('Data anggota berhasil diimpor.');
  if (state.page === 'anggota' || state.page === 'dashboard') renderPage(state.page);
});

document.getElementById('modal-import').addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]')) {
    fileInput.value = '';
    pendingRows = [];
    document.getElementById('dropzone-filename').textContent = 'Format .xlsx, .xls, atau .csv — kolom: Nama, Email, Role, Cabang';
    document.getElementById('import-progress-wrap').classList.add('hidden');
    document.getElementById('import-success').classList.add('hidden');
    document.getElementById('import-bar').style.width = '0%';
    importStartBtn.disabled = true;
  }
});

/* =========================================================
   GUIDE BOOK VIEWER — konten nyata dari tabel guide_books
========================================================= */
let currentGuidePages = [], currentGuidePage = 0;
function openGuideBook(idx) {
  const book = window.__EDU_BOOKS__[idx];
  currentGuidePages = (book.content || 'Belum ada konten.').split(/\n\s*\n/).filter(Boolean);
  currentGuidePage = 0;
  document.getElementById('guidebook-title').textContent = book.title;
  renderGuidePage();
  openModal('modal-guidebook');
}
function renderGuidePage() {
  document.getElementById('guidebook-page-title').textContent = `Bagian ${currentGuidePage+1}`;
  document.getElementById('guidebook-page-body').textContent = currentGuidePages[currentGuidePage];
  document.getElementById('guidebook-page-num').textContent = `Halaman ${currentGuidePage+1} dari ${currentGuidePages.length}`;
  document.getElementById('guidebook-prev').disabled = currentGuidePage === 0;
  document.getElementById('guidebook-next').textContent = currentGuidePage === currentGuidePages.length - 1 ? 'Selesai ✓' : 'Berikutnya →';
}
document.getElementById('guidebook-prev').addEventListener('click', () => { if (currentGuidePage>0){ currentGuidePage--; renderGuidePage(); }});
document.getElementById('guidebook-next').addEventListener('click', () => {
  if (currentGuidePage < currentGuidePages.length - 1) { currentGuidePage++; renderGuidePage(); }
  else closeModal('modal-guidebook');
});

/* =========================================================
   VIDEO PLAYER — pemutaran sungguhan (HTML5 video, tanpa tombol unduh)
========================================================= */
function openVideo(idx) {
  const v = window.__EDU_VIDEOS__[idx];
  document.getElementById('video-title').textContent = v.title;
  const player = document.getElementById('video-player');
  player.src = v.video_url;
  player.currentTime = 0;
  openModal('modal-video');
}
document.getElementById('modal-video').addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]')) {
    const player = document.getElementById('video-player');
    player.pause();
    player.src = '';
  }
});

/* =========================================================
   TOAST
========================================================= */
function showToast(message) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast text-white text-sm font-medium rounded-[10px] shadow-lg px-4 py-3 flex items-center gap-2.5 max-w-xs';
  el.style.background = 'var(--teal-900)';
  el.innerHTML = `<svg class="h-4 w-4 text-[var(--teal-100)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>${esc(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* =========================================================
   PWA — daftarkan service worker (untuk instalasi & cache offline dasar)
========================================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
