'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Swal from 'sweetalert2';

const CHECK_INTERVAL = 30 * 1000;
const TOKEN_VERIFY_INTERVAL = 5 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;

interface SessionCheckerProps {
  timeoutMinutes?: number;
  showWarning?: boolean;
  onWarning?: () => void;
  onExpire?: () => void;
}

async function logoutApi(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    await fetch(`${baseUrl}/apicorpu/auth/1.0/logout/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    // Silently fail - we clear local data regardless
  }
}

function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivity');

  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
}

export default function SessionChecker({
  timeoutMinutes: propTimeout = 30,
  showWarning = true,
  onWarning,
  onExpire
}: SessionCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dynamicTimeout, setDynamicTimeout] = useState<number | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const verifyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  const expiredShownRef = useRef<boolean>(false);
  const supersededShownRef = useRef<boolean>(false);

  const sessionTimeout = (dynamicTimeout ?? propTimeout) * 60 * 1000;

  useEffect(() => {
    async function fetchTimeout() {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${baseUrl}/apicorpu/public/1.0/settings/`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.session_timeout != null) {
            const val = parseInt(json.data.session_timeout);
            if (!isNaN(val) && val > 0) setDynamicTimeout(val);
          }
        }
      } catch {
        // use prop default
      }
    }
    fetchTimeout();
  }, []);

  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    warningShownRef.current = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivity', now.toString());
    }
  }, []);

  const isLoginPage = pathname === '/login';

  const logout = useCallback(() => {
    if (onExpire) onExpire();
    logoutApi().finally(() => {
      clearAuthData();
      router.push('/login?session=expired');
    });
  }, [onExpire, router]);

  const showWarningMessage = useCallback(() => {
    if (!showWarning || warningShownRef.current) return;
    warningShownRef.current = true;

    if (onWarning) onWarning();

    const remainingMs = lastActivityRef.current + sessionTimeout - Date.now();
    const minutes = Math.max(1, Math.floor(remainingMs / 60000));

    Swal.fire({
      icon: 'warning',
      title: 'Sesi Akan Berakhir',
      html: `Sesi Anda akan berakhir dalam <b>${minutes}</b> menit karena tidak ada aktivitas.<br><br>Klik OK untuk melanjutkan sesi.`,
      confirmButtonText: 'OK, Lanjutkan Sesi',
      confirmButtonColor: '#3085d6',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
        localStorage.setItem('lastActivity', lastActivityRef.current.toString());
        fetch(window.location.href, { method: 'GET', credentials: 'same-origin' });
      }
    });
  }, [showWarning, onWarning, sessionTimeout]);

  const showExpiredMessage = useCallback(() => {
    if (expiredShownRef.current) return;
    expiredShownRef.current = true;

    Swal.fire({
      icon: 'info',
      title: 'Sesi Berakhir',
      text: 'Sesi Anda telah berakhir karena tidak ada aktivitas. Klik OK untuk logout.',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: true,
      showCancelButton: false,
      focusConfirm: true,
    }).then(() => {
      clearAuthData();
      router.push('/login?session=expired');
    });
  }, [router]);

  const checkSession = useCallback(() => {
    if (isLoginPage) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const now = Date.now();
    const storedLastActivity = typeof window !== 'undefined'
      ? localStorage.getItem('lastActivity')
      : null;
    const lastActivity = storedLastActivity
      ? parseInt(storedLastActivity)
      : lastActivityRef.current;
    const timeSinceLastActivity = now - lastActivity;
    const remainingTime = sessionTimeout - timeSinceLastActivity;

    if (remainingTime <= WARNING_TIME && remainingTime > 0 && showWarning) {
      showWarningMessage();
    }

    if (timeSinceLastActivity >= sessionTimeout) {
      showExpiredMessage();
    }
  }, [isLoginPage, sessionTimeout, showWarning, showWarningMessage, showExpiredMessage]);

  const checkSuperseded = useCallback(() => {
    if (isLoginPage || supersededShownRef.current || expiredShownRef.current) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    fetch(`${baseUrl}/session/status`, { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.session_superseded && !supersededShownRef.current) {
          supersededShownRef.current = true;
          Swal.fire({
            icon: 'warning',
            title: 'Akun Dipakai di Perangkat Lain',
            text: 'Akun Anda terdeteksi login di perangkat lain. Klik OK untuk logout dari perangkat ini.',
            confirmButtonText: 'OK',
            allowOutsideClick: false,
            allowEscapeKey: false,
            backdrop: true,
            showCancelButton: false,
            focusConfirm: true,
          }).then(() => {
            clearAuthData();
            router.push('/login');
          });
        }
      })
      .catch(() => {});
  }, [isLoginPage, router]);

  const verifyToken = useCallback(async () => {
    if (isLoginPage) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${baseUrl}/apicorpu/auth/1.0/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        clearAuthData();
        router.push('/login?session=expired');
      }
    } catch {
      // Network error - don't logout, might be temporary
    }
  }, [isLoginPage, router]);

  useEffect(() => {
    if (isLoginPage) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    updateActivity();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL);
    verifyIntervalRef.current = setInterval(verifyToken, TOKEN_VERIFY_INTERVAL);

    // Also check for session superseded on each interval
    const supersededInterval = setInterval(checkSuperseded, CHECK_INTERVAL);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastActivity' && e.newValue) {
        lastActivityRef.current = parseInt(e.newValue);
        warningShownRef.current = false;
      }
      if (e.key === 'token' && !e.newValue) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (verifyIntervalRef.current) clearInterval(verifyIntervalRef.current);
      clearInterval(supersededInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoginPage, sessionTimeout, updateActivity, checkSession, verifyToken, logout, checkSuperseded]);

  return null;
}
