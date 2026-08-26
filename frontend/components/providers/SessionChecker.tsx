'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Session idle timeout - 30 minutes (configurable from server settings)
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

interface SessionCheckerProps {
  timeoutMinutes?: number;
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
    console.log('⚠️ Logout API failed, clearing local data anyway');
  }
}

function clearAuthData() {
  console.log('🗑️ Clearing all authentication data...');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivity');
  localStorage.removeItem('active_group_id');
  localStorage.removeItem('role_type');

  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
}

export default function SessionChecker({
  timeoutMinutes = 30,
}: SessionCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<number>(DEFAULT_SESSION_TIMEOUT);

  const [showExpired, setShowExpired] = useState(false);

  const isLoginPage = pathname === '/login';

  // Fetch session timeout from server settings
  useEffect(() => {
    async function fetchTimeout() {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${baseUrl}/apicorpu/public/1.0/settings/`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.session_timeout != null) {
            const val = parseInt(json.data.session_timeout);
            if (!isNaN(val) && val > 0) {
              sessionTimeoutRef.current = val * 60 * 1000;
              console.log(`⚙️ Server session timeout configured: ${val} minutes`);
            }
          }
        }
      } catch {
        // Use default timeout
        sessionTimeoutRef.current = timeoutMinutes * 60 * 1000;
        console.log(`⚙️ Using default session timeout: ${timeoutMinutes} minutes`);
      }
    }
    fetchTimeout();
  }, [timeoutMinutes]);

  // Main session management effect
  useEffect(() => {
    // Only run for authenticated users not on login page
    if (isLoginPage) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    console.log('🔐 Session checker initialized');

    // Update last activity on user interactions
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastActivity', Date.now().toString());
      }
      console.log('👆 User activity detected, updated timestamp');
    };

    // Track user activity with passive listeners for better performance
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic session check
    const checkSession = async () => {
      const now = Date.now();
      const storedLastActivity = typeof window !== 'undefined'
        ? localStorage.getItem('lastActivity')
        : null;
      const lastActivity = storedLastActivity
        ? parseInt(storedLastActivity)
        : lastActivityRef.current;
      
      const timeSinceLastActivity = now - lastActivity;

      console.log('🔍 Client session check:', {
        timeSinceLastActivity: `${Math.floor(timeSinceLastActivity / 1000 / 60)} minutes`,
        idleTimeout: `${sessionTimeoutRef.current / 1000 / 60} minutes`
      });

      // If idle timeout exceeded, logout
      if (timeSinceLastActivity > sessionTimeoutRef.current) {
        console.log('⏱️ Session idle timeout exceeded, logging out...');
        
        // Clear interval before logout
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }

        // Call logout API and show expired modal (user chooses when to leave)
        await logoutApi();
        clearAuthData();
        setShowExpired(true);
      }
    };

    // Start periodic check
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL);

    // Initial check
    checkSession();

    // Listen for storage changes (multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastActivity' && e.newValue) {
        lastActivityRef.current = parseInt(e.newValue);
        console.log('🔄 Activity synced from another tab');
      }
      if (e.key === 'token' && !e.newValue) {
        console.log('🚪 Token removed in another tab, logging out...');
        clearAuthData();
        setShowExpired(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      console.log('🛑 Session checker cleaned up');
    };
  }, [isLoginPage]);

  // Reset modal when navigating away (e.g. after refresh -> login)
  useEffect(() => {
    if (!isLoginPage) return;
    setShowExpired(false);
  }, [isLoginPage]);

  const handleExpiredConfirm = () => {
    router.push('/login?session=expired');
  };

  if (!showExpired) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-scale-in">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          Sesi Berakhir
        </h2>
        <p className="text-muted-foreground mb-6">
          Sesi Anda telah berakhir karena terlalu lama tidak beraktivitas.
          Silakan masuk kembali untuk melanjutkan.
        </p>
        <button
          onClick={handleExpiredConfirm}
          className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200"
        >
          Masuk Kembali
        </button>
      </div>
    </div>
  );
}
