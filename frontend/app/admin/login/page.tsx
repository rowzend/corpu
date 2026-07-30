'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
      try {
        const permRes = await api.get<{ success: boolean; data: { modules: string[] } }>('/management/permissions/user/');
        const modules = permRes?.data?.modules || [];
        const hasAdmin = modules.length > 0;
        if (hasAdmin) {
          window.location.href = '/admin/dashboard';
        } else {
          router.push('/member/dashboard');
        }
      } catch {
        router.push('/member/dashboard');
      }
    };
    checkAdmin();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        <p className="text-white">Memeriksa akses admin...</p>
      </div>
    </div>
  );
}
