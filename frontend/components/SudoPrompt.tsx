'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/services';
import { sudoService } from '@/lib/services/sudo.service';

const ADMIN_ROLES = ['superadmin', 'admin'];

export default function SudoPrompt({ user }: { user: Record<string, any> | null }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !user) return null;

  const handleSudo = () => {
    setVisible(false);
    router.push('/sudo/login');
  };

  const handleTester = () => {
    setVisible(false);
    window.location.href = '/dashboard';
  };

  const roleLabel = 'Admin';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Login sebagai {roleLabel}
          </h2>
          <p className="text-gray-500">
            Anda login sebagai <span className="font-semibold text-blue-600">{user?.name || user?.username}</span>
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSudo}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-lg">Lanjut sebagai {roleLabel}</span>
            </div>
            <p className="text-sm text-blue-200 mt-1 font-normal">Akses penuh ke semua fitur manajemen</p>
          </button>

          <button
            onClick={handleTester}
            className="w-full bg-white text-gray-700 py-4 px-6 rounded-2xl font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-lg">Lanjut sebagai Tester</span>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-normal">Melihat dashboard dengan akses terbatas</p>
          </button>
        </div>
      </div>
    </div>
  );
}
