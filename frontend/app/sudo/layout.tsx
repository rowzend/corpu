'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import SessionChecker from '@/components/providers/SessionChecker';
import { authService } from '@/lib/services';
import { sudoService } from '@/lib/services/sudo.service';

export default function SudoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const checkAccess = async () => {
      if (pathname === '/sudo/login') {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      if (!sudoService.isActive()) {
        router.push('/sudo/login');
        return;
      }

      try {
        const isValid = await authService.verifyToken();
        setIsAuthenticated(isValid);
        if (!isValid) {
          sudoService.deactivate();
          router.push('/login?error=auth_failed');
        }
      } catch {
        sudoService.deactivate();
        router.push('/login?error=auth_failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <SessionChecker timeoutMinutes={30} />

      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(v => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader onToggleSidebar={() => setMobileSidebarOpen(v => !v)} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
