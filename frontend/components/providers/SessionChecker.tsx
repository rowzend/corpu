'use client';

import { useEffect, useRef } from 'react';
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

        // Call logout API and redirect
        await logoutApi();
        clearAuthData();
        router.push('/login?session=expired');
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
        router.push('/login?session=expired');
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
  }, [isLoginPage, router]);

  return null;
}
