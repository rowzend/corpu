'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import ActivityPanel from '@/components/admin/ActivityPanel';
import SessionChecker from '@/components/providers/SessionChecker';
import { authService } from '@/lib/services';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);

  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const checkAccess = async () => {
      if (pathname === '/admin/login') {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const isValid = await authService.verifyToken();
        setIsAuthenticated(isValid);
        if (!isValid) {
          router.push('/login?error=auth_failed');
        }
      } catch {
        router.push('/login?error=auth_failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-muted-foreground">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-transparent p-4 gap-4">
      <SessionChecker timeoutMinutes={30} />

      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(v => !v)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setMobileSidebarOpen(v => !v)}
          onToggleActivityPanel={() => setActivityPanelOpen(v => !v)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <ActivityPanel
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
      />
    </div>
  );
}
