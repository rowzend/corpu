'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

interface GroupInfo {
  id: number;
  name: string;
  redirect_url?: string;
}

export default function RoleSelectorModal({
  groups,
}: {
  groups: GroupInfo[];
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectRole = (group: GroupInfo) => {
    authService.setActiveRole(group.id, group.redirect_url || '/admin/dashboard');
    router.push(group.redirect_url || '/admin/dashboard');
  };

  const handleAllAccess = () => {
    authService.clearActiveGroupId();
    authService.setActiveRole(null, '/admin/dashboard'); // keep role_type=admin
    router.push('/admin/dashboard');
  };

  if (!visible) return null;

  const defaultIcon = (name: string) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">
            Pilih Role Akses
          </h2>
          <p className="text-muted-foreground">
            Anda memiliki beberapa role. Pilih role yang ingin diakses:
          </p>
        </div>

        <div className="space-y-3">
          {groups.map((group, index) => (
            <button
              key={group.id || group.name || index}
              onClick={() => handleSelectRole(group)}
              className={`w-full bg-gradient-to-r ${defaultIcon(group.name)} text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-lg">{group.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={handleAllAccess}
            className="w-full bg-card text-foreground py-3 px-6 rounded-2xl font-medium border-2 border-border hover:bg-muted transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Akses Semua Role</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
