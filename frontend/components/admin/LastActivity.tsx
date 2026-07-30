'use client';

import { useState, useEffect } from 'react';
import { dashboardService, type UserActivity } from '@/lib/services';
import {
  LogIn, LogOut, PlusCircle, Edit, Trash2, Lock, Activity,
  Clock, Monitor, Smartphone, Globe, User
} from 'lucide-react';

interface LastActivityProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const activityConfig: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  login:           { icon: LogIn,       bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400', label: 'Login' },
  login_failed:    { icon: LogIn,       bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-600 dark:text-red-400',     label: 'Login Gagal' },
  logout:          { icon: LogOut,      bg: 'bg-yellow-100 dark:bg-yellow-900/30', color: 'text-yellow-600 dark:text-yellow-400', label: 'Logout' },
  create:          { icon: PlusCircle,  bg: 'bg-blue-100 dark:bg-blue-900/30',   color: 'text-blue-600 dark:text-blue-400',   label: 'Tambah' },
  update:          { icon: Edit,        bg: 'bg-cyan-100 dark:bg-cyan-900/30',   color: 'text-cyan-600 dark:text-cyan-400',   label: 'Ubah' },
  delete:          { icon: Trash2,      bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-600 dark:text-red-400',     label: 'Hapus' },
  password_change: { icon: Lock,        bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400', label: 'Ganti Password' },
};

function getActivityConfig(action: string) {
  return activityConfig[action] || {
    icon: Activity,
    bg: 'bg-gray-100 dark:bg-gray-800',
    color: 'text-gray-600 dark:text-gray-400',
    label: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan yang lalu`;
}

function getViaIcon(via: string) {
  switch (via) {
    case 'web': return Monitor;
    case 'api_v4':
    case 'api_v5': return Globe;
    default: return Smartphone;
  }
}

function getViaLabel(via: string) {
  switch (via) {
    case 'web': return 'Web';
    case 'api_v4': return 'API v4';
    case 'api_v5': return 'API v5';
    default: return via;
  }
}

export default function LastActivity({ limit = 8, showHeader = true, className = '' }: LastActivityProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [limit]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getUserActivities(limit);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-card rounded-xl shadow-sm border border-border p-5 ${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        )}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border ${className}`}>
      {showHeader && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-card-foreground">Aktivitas Terakhir</h2>
          </div>
          <button
            onClick={loadActivities}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"
            title="Refresh"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="p-8 text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((act) => {
            const config = getActivityConfig(act.action);
            const Icon = config.icon;
            const ViaIcon = getViaIcon(act.via);
            return (
              <div key={act.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-card-foreground truncate">{act.title}</p>
                    {act.description && act.description !== act.title && (
                      <span className="text-xs text-muted-foreground truncate">- {act.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <User className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[11px] font-medium text-card-foreground/80">{act.user_name}</span>
                    <span className="text-[10px] text-muted-foreground/40">@</span>
                    <span className="text-[10px] text-muted-foreground/60">{act.username}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{formatTimeAgo(act.created_at)}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <ViaIcon className="w-3 h-3 text-muted-foreground/60" title={getViaLabel(act.via)} />
                    <span className="text-[10px] text-muted-foreground/60">{getViaLabel(act.via)}</span>
                    {act.ip_address && (
                      <>
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <span className="text-[10px] text-muted-foreground/60">{act.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
