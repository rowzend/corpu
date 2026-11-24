'use client';

/**
 * Halaman pendaratan SSO (dok 22 / dok 25 fase F1).
 *
 * Alur: backend Django selesai login OIDC → redirect ke
 * `/auth/sso?code=XXXX` → halaman ini menukar kode (sekali pakai, 120 detik)
 * menjadi pasangan JWT lewat `/apicorpu/auth/1.0/sso-exchange/` → token
 * disimpan persis seperti login password (localStorage + cookie `token`) →
 * diarahkan ke dashboard sesuai role.
 *
 * Kenapa perlu: aplikasi ini membaca sesi dari JWT, bukan session Django.
 * Tanpa langkah tukar ini, user yang sudah lolos SSO tetap dilempar ke /login
 * oleh middleware Next.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/lib/services/auth.service';
import { getPublicSettings } from '@/lib/api/profilePublic';
import SudoPrompt from '@/components/SudoPrompt';
import RoleSelectorModal from '@/components/RoleSelectorModal';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/apicorpu/1.0';
// Endpoint tukar kode ada di grup auth: /apicorpu/auth/1.0/sso-exchange/
// (bukan di bawah /apicorpu/1.0 yang dipakai API umum).
const EXCHANGE_URL = `${API_BASE.replace(/\/1\.0\/?$/, '')}/auth/1.0/sso-exchange/`;

type ExchangeResponse = {
  status: string;
  message?: string;
  code?: string;
  data?: {
    access_token: string;
    refresh_token?: string;
    user?: Record<string, unknown>;
  };
};

type GroupInfo = { id: number; name: string; redirect_url?: string };

export default function SsoLandingPage() {
  const router = useRouter();
  const [pesan, setPesan] = useState('Menghubungkan sesi SSO…');
  const [gagal, setGagal] = useState<string | null>(null);
  // Pemilihan mode akses — perilaku SAMA dengan login password (login/page.tsx).
  const [sudoUser, setSudoUser] = useState<Record<string, unknown> | null>(null);
  const [userGroups, setUserGroups] = useState<GroupInfo[]>([]);
  const [showSudoPrompt, setShowSudoPrompt] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  // Branding (logo + nama aplikasi) supaya halaman ini tidak tampil kosong.
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let aktif = true;
    getPublicSettings()
      .then((s) => { if (aktif) setSettings(s); })
      .catch(() => { /* branding opsional — jangan gagalkan login */ });
    return () => { aktif = false; };
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setGagal('Kode SSO tidak ditemukan. Silakan masuk ulang.');
      setPesan('');
      return;
    }

    let batal = false;

    (async () => {
      try {
        const res = await fetch(`${EXCHANGE_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const json = (await res.json()) as ExchangeResponse;
        const data = json?.data;
        if (!res.ok || !data?.access_token) {
          throw new Error(json?.message || 'Gagal menukar kode SSO.');
        }
        if (batal) return;

        // Simpan sesi dengan format yang sama seperti login password.
        const user = (data.user ?? {}) as Record<string, unknown>;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token ?? '');
        localStorage.setItem('lastActivity', Date.now().toString());
        localStorage.setItem('user', JSON.stringify(user));
        document.cookie = `token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        if (data.refresh_token) {
          document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }

        // Kode handoff sudah ditukar: hilangkan ?code=… dari address bar supaya
        // URL tidak menyisakan kode sekali-pakai di riwayat/Referer.
        try {
          window.history.replaceState(null, '', '/auth/sso');
        } catch { /* abaikan */ }

        // Kembali ke halaman publik yang tadi dibuka (mis. /courses dari tombol
        // "Lihat tanpa login" di portal), kalau ada. Rute /member & /admin tetap
        // memakai alur role di bawah karena butuh cookie role_type.
        let kembali = '';
        try {
          kembali = sessionStorage.getItem('sso_next') || '';
          sessionStorage.removeItem('sso_next');
        } catch {
          kembali = '';
        }
        if (kembali.startsWith('/') && !kembali.startsWith('//')
            && !kembali.startsWith('/member') && !kembali.startsWith('/admin')) {
          setPesan('Berhasil. Mengalihkan…');
          window.location.href = kembali;
          return;
        }

        // Tentukan tujuan — aturannya SAMA dengan login password di
        // login/page.tsx supaya pengalaman SSO tidak berbeda:
        //   tanpa role admin              → member dashboard
        //   satu role admin, tanpa member → halaman admin itu
        //   ada admin DAN member          → "Choose Access Mode" (SudoPrompt)
        //   beberapa admin tanpa member   → RoleSelectorModal
        // Dulu jalur ini jatuh ke member dashboard tanpa bertanya, sehingga user
        // ber-role admin + member (mis. NIP 199411192019031001) tidak pernah
        // melihat pilihan mode akses seperti pada login lokal.
        let tujuan = '/member/dashboard';
        let tampilkanPilihan = false;
        try {
          const perm = await api.get<{
            success: boolean;
            data: { user: { groups: Array<GroupInfo | string> } };
          }>('/management/permissions/user/');
          const groups = (perm?.data?.user?.groups || []).map((g) =>
            typeof g === 'string'
              ? { id: 0, name: g, redirect_url: '/admin/dashboard' }
              : g,
          );
          const adminGroups = groups.filter((g) =>
            (g.redirect_url || '/admin/dashboard').startsWith('/admin/'),
          );
          const memberGroups = groups.filter((g) =>
            (g.redirect_url || '/admin/dashboard').startsWith('/member/'),
          );
          if (adminGroups.length === 0) {
            authService.setActiveRole(null, '/member/dashboard');
          } else if (adminGroups.length === 1 && memberGroups.length === 0) {
            const url = adminGroups[0].redirect_url || '/admin/dashboard';
            authService.setActiveRole(adminGroups[0].id ?? null, url);
            tujuan = url;
          } else if (memberGroups.length > 0) {
            // Admin + member: tanya dulu, jangan langsung ke salah satu dashboard.
            if (batal) return;
            tampilkanPilihan = true;
            setPesan('');
            setSudoUser(user);
            setUserGroups(groups);
            setShowSudoPrompt(true);
          } else {
            // Beberapa role admin tanpa member: pilih role spesifik dulu.
            if (batal) return;
            tampilkanPilihan = true;
            setPesan('');
            setSudoUser(user);
            setUserGroups(adminGroups);
            setShowRoleSelector(true);
          }
        } catch {
          // Gagal baca permission bukan alasan menggagalkan login.
        }

        if (batal || tampilkanPilihan) return;
        setPesan('Berhasil. Mengalihkan…');
        window.location.href = tujuan;
      } catch (err) {
        if (batal) return;
        setGagal(err instanceof Error ? err.message : 'Gagal memproses SSO.');
        setPesan('');
      }
    })();

    return () => {
      batal = true;
    };
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col items-center px-4 py-8">
      {/* Dekorasi latar — sama dengan panel branding halaman /login. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Branding di atas — tetap terlihat walau modal pilihan mode akses muncul. */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        {/* Logo + nama aplikasi dari pengaturan publik (best-effort). */}
        <div className="mb-5 inline-flex">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl" />
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="h-16 w-auto relative z-10 drop-shadow-2xl" />
            ) : (
              <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
          {settings.app_name || 'ASN CORPU'}
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Masuk dengan akun Pemerintahan Digital Pesisir Selatan (Pemdi)
        </p>
      </div>

      <div className="relative z-10 flex flex-1 w-full max-w-md items-center justify-center py-6">
        {!showSudoPrompt && !showRoleSelector && (
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
              {gagal ? (
                <span className="text-2xl text-red-100">!</span>
              ) : (
                <span className="block h-7 w-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
            </div>
            <p className="text-sm font-medium text-white">
              {gagal ? 'Gagal memproses SSO' : 'Menyelesaikan masuk lewat SSO…'}
            </p>
            <p className="mt-1 text-xs text-white/75">{pesan || gagal}</p>

            {gagal ? (
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="/login"
                  className="w-full rounded-xl bg-white text-primary hover:bg-white/90 text-sm font-semibold py-2.5 transition-colors"
                >
                  Coba masuk lagi
                </a>
                <a
                  href="/login?sso=gagal"
                  className="w-full rounded-xl border border-white/30 text-white hover:bg-white/10 text-sm font-medium py-2.5 transition-colors"
                >
                  Masuk dengan username &amp; password
                </a>
              </div>
            ) : (
              <p className="mt-5 text-[11px] text-white/60">
                Jangan tutup halaman ini — Anda akan diarahkan otomatis.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer tipis supaya halaman tetap terlihat utuh saat modal tampil. */}
      <p className="relative z-10 pb-2 text-[11px] text-white/55 text-center">
        © Pemerintah Kabupaten Pesisir Selatan · Layanan SSO Pemdi
      </p>

      {/* Pilihan mode akses — komponen yang sama dengan login password. */}
      {showSudoPrompt && sudoUser && (
        <SudoPrompt
          user={sudoUser}
          groups={userGroups}
          onChooseRole={(groups) => {
            setShowSudoPrompt(false);
            setUserGroups(groups);
            setShowRoleSelector(true);
          }}
        />
      )}
      {showRoleSelector && userGroups.length > 0 && (
        <RoleSelectorModal groups={userGroups} />
      )}
    </div>
  );
}
