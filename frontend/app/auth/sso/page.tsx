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

        // Tentukan tujuan: satu role admin → halaman adminnya; selain itu member.
        let tujuan = '/member/dashboard';
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
          }
          // Beberapa role admin + member: biarkan pemilihan role di dashboard.
        } catch {
          // Gagal baca permission bukan alasan menggagalkan login.
        }

        if (batal) return;
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
          {gagal ? (
            <span className="text-2xl text-red-600">!</span>
          ) : (
            <span className="block h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          )}
        </div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Login SSO PEMDA
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pesan || gagal}</p>
        {gagal && (
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/login"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5"
            >
              Kembali ke halaman masuk
            </a>
            <a
              href="/login?sso=gagal"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium py-2.5"
            >
              Masuk dengan username &amp; password
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
