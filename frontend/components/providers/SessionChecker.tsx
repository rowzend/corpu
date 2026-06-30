'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TOKEN_VERIFY_INTERVAL = 5 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000;
const WARNING_TIME = 2 * 60 * 1000;

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
  timeoutMinutes = 30,
  showWarning = true,
  onWarning,
  onExpire
}: SessionCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const verifyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);

  const sessionTimeout = timeoutMinutes * 60 * 1000;

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

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Sesi Akan Berakhir', {
        body: 'Sesi Anda akan berakhir dalam 2 menit. Lakukan aktivitas untuk memperpanjang sesi.',
        icon: '/favicon.ico'
      });
    }
  }, [showWarning, onWarning]);

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

    if (showWarning && timeSinceLastActivity > (sessionTimeout - WARNING_TIME)) {
      showWarningMessage();
    }

    if (timeSinceLastActivity > sessionTimeout) {
      logout();
    }
  }, [isLoginPage, sessionTimeout, showWarning, showWarningMessage, logout]);

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

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (verifyIntervalRef.current) clearInterval(verifyIntervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoginPage, sessionTimeout, updateActivity, checkSession, verifyToken, logout]);

  return null;
}
