'use client';

import { useEffect, useState } from 'react';
import { dashboardService, type DashboardStats, type Activity, type SystemStatus, type ChartData } from '@/lib/services';
import { LayoutDashboard, Users, BookOpen, GraduationCap, FileText, TrendingUp, Activity, Database, Wifi, Cpu, UserPlus, BarChart3, CheckCircle, PlayCircle, Loader2 } from 'lucide-react';
import LastActivity from '@/components/admin/LastActivity';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
    const { text } = useThemeColors();
    const t = useTranslations();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [statsData, activitiesData, statusData, charts] = await Promise.allSettled([
                dashboardService.getStats(),
                dashboardService.getActivities(8),
                dashboardService.getSystemStatus(),
                dashboardService.getChartData(),
            ]);
            if (statsData.status === 'fulfilled') setStats(statsData.value);
            if (activitiesData.status === 'fulfilled') setActivities(activitiesData.value);
            if (statusData.status === 'fulfilled') setSystemStatus(statusData.value);
            if (charts.status === 'fulfilled') setChartData(charts.value);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ${t('admin.dashboard.time_ago')}`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ${t('admin.dashboard.time_ago')}`;
        const days = Math.floor(hours / 24);
        return `${days}d ${t('admin.dashboard.time_ago')}`;
    };

    const colSpanMap: Record<number, string> = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4', 5: 'col-span-5', 6: 'col-span-6' };
    const StatCard = ({ stat, colSpan = 1 }: { stat: { label: string; value: string | number; icon: React.ElementType; color: string; desc: string }; colSpan?: number }) => (
        <div className={`${colSpanMap[colSpan] || 'col-span-1'} bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider ${text.mutedClass}`}>{stat.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
            <div className={`text-xs ${text.mutedClass} mt-1`}>{stat.desc}</div>
        </div>
    );

    const activityIconMap: Record<string, string> = {
        bell: '🔔', award: '🏆', 'user-plus': '👤',
    };

    const activityBgMap: Record<string, string> = {
        success: 'bg-green-100', primary: 'bg-blue-100', info: 'bg-muted', warning: 'bg-yellow-100', danger: 'bg-red-100',
    };

    const statusIconMap: Record<string, React.ReactNode> = {
        'check-circle': <CheckCircle className="w-4 h-4" />,
    };

    return (
        <div className="grid grid-cols-6 gap-4">
            {/* Header - full width */}
            <div className="col-span-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-6 mb-2">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-white">{t('admin.dashboard.title')}</h1>
                        <p className="text-blue-100 text-sm">
                            {t('admin.dashboard.welcome') + ', '} <span className="font-semibold text-white">{user?.name || user?.username || 'User'}</span>
                        </p>
                    </div>
                    {isLoading && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="text-white text-sm">{t('admin.dashboard.loading')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats - bento grid with varied widths */}
            <StatCard colSpan={2} stat={{ label: t('admin.dashboard.total_users'), value: stats?.total_users ?? '-', icon: Users, color: 'text-blue-600 dark:text-blue-400', desc: `${stats?.new_users_this_month ?? 0} ${t('admin.dashboard.new_users_this_month')}` }} />
            <StatCard colSpan={1} stat={{ label: t('admin.dashboard.pegawai_aktif'), value: stats?.pegawai_aktif ?? '-', icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400', desc: t('admin.dashboard.non_admin') }} />
            <StatCard colSpan={1} stat={{ label: t('admin.dashboard.published_courses'), value: stats?.total_courses ?? '-', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', desc: `${stats?.total_enrollments ?? 0} ${t('admin.dashboard.total_enrollment')}` }} />
            <StatCard colSpan={1} stat={{ label: t('admin.dashboard.active_enrollments'), value: stats?.active_enrollments ?? '-', icon: PlayCircle, color: 'text-orange-600 dark:text-orange-400', desc: t('admin.dashboard.sedang_berlangsung') }} />
            <StatCard colSpan={1} stat={{ label: t('admin.dashboard.hcdp_programs'), value: stats?.total_hcdp ?? '-', icon: GraduationCap, color: 'text-purple-600 dark:text-purple-400', desc: `${stats?.active_hcdp ?? 0} ${t('admin.dashboard.aktif')}` }} />

            {/* Chart bento - hero chart (3 cols) + categories (2 cols) + system status (1 col) */}
            <div className="col-span-3 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-sm font-semibold text-card-foreground">{t('admin.dashboard.monthly_trend')}</h2>
                    </div>
                    {chartData?.monthly_trend && (
                        <div className="flex gap-3 text-xs text-muted-foreground">
                            {chartData.monthly_trend.datasets.map(ds => (
                                <div key={ds.label} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.color }} />
                                    {ds.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {chartData?.monthly_trend ? (
                    <div className="relative h-44">
                        <div className="absolute inset-0 flex items-end justify-between gap-1.5">
                            {(chartData.monthly_trend.labels || []).map((label, i) => {
                                const enrollVal = chartData.monthly_trend.datasets[0]?.data[i] ?? 0;
                                const certVal = chartData.monthly_trend.datasets[1]?.data[i] ?? 0;
                                const maxVal = Math.max(...chartData.monthly_trend.datasets.flatMap(d => d.data), 1);
                                const enrollH = (enrollVal / maxVal) * 100;
                                const certH = (certVal / maxVal) * 100;
                                return (
                                    <div key={label} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                                        <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '100%' }}>
                                            <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(enrollH, 2)}%` }} title={`Enrollments: ${enrollVal}`} />
                                            <div className="w-3 bg-emerald-500 rounded-t-sm" style={{ height: `${Math.max(certH, 2)}%` }} title={`Certificates: ${certVal}`} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">{t('admin.dashboard.memuat_data')}</div>
                )}
            </div>

            <div className="col-span-2 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-card-foreground">{t('admin.dashboard.course_categories')}</h2>
                </div>
                {chartData?.golongan_distribution && chartData.golongan_distribution.labels.length > 0 ? (
                    <div className="space-y-3">
                        {chartData.golongan_distribution.labels.map((label, i) => {
                            const total = chartData.golongan_distribution.values.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? (chartData.golongan_distribution.values[i] / total) * 100 : 0;
                            return (
                                <div key={label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-card-foreground">{label}</span>
                                        <span className="text-muted-foreground">{chartData.golongan_distribution.values[i]} ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{
                                            width: `${pct}%`,
                                            backgroundColor: chartData.golongan_distribution.colors[i] || '#3B82F6'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">{t('admin.dashboard.belum_ada_data_course')}</div>
                )}
            </div>

            <div className="col-span-1 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h2 className="text-sm font-semibold text-card-foreground">{t('admin.dashboard.system')}</h2>
                </div>
                {systemStatus ? (
                    <div className="space-y-3">
                        {[
                            { key: 'database', label: t('admin.dashboard.database'), icon: Database },
                            { key: 'cache', label: t('admin.dashboard.cache'), icon: Wifi },
                            { key: 'siasn', label: t('admin.dashboard.siasn_api'), icon: Wifi },
                        ].map(item => {
                            const status = systemStatus[item.key as keyof SystemStatus] as { status: string; message: string; class: string };
                            const statusDot: Record<string, string> = { online: 'bg-green-500', offline: 'bg-red-500', disconnected: 'bg-yellow-500' };
                            const statusBg: Record<string, string> = { online: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', offline: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', disconnected: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' };
                            return (
                                <div key={item.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs font-medium text-card-foreground">{item.label}</span>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${statusBg[status.status] || 'bg-muted text-muted-foreground'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status.status] || 'bg-muted-foreground'}`} />
                                        {status.status === 'online' ? t('admin.dashboard.online') : status.status === 'offline' ? t('admin.dashboard.offline') : t('admin.dashboard.disconnected')}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground">{t('admin.dashboard.overall')}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                systemStatus.overall === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                systemStatus.overall === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                                {t(`admin.dashboard.${systemStatus.overall}`) || systemStatus.overall.charAt(0).toUpperCase() + systemStatus.overall.slice(1)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground text-xs py-4">{t('admin.dashboard.memuat_status')}</div>
                )}
            </div>

            {/* Bottom stats */}
            <StatCard colSpan={2} stat={{ label: t('admin.dashboard.completed'), value: stats?.completed_enrollments ?? '-', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', desc: `${stats?.certificates_issued ?? 0} ${t('admin.dashboard.sertifikat_terbit')}` }} />
            <StatCard colSpan={2} stat={{ label: t('admin.dashboard.published_berita'), value: stats?.total_berita ?? '-', icon: FileText, color: 'text-rose-600 dark:text-rose-400', desc: t('admin.dashboard.berita_pengumuman') }} />
            <StatCard colSpan={2} stat={{ label: t('admin.dashboard.total_pegawai'), value: '-', icon: LayoutDashboard, color: text.secondaryClass, desc: t('admin.dashboard.data_pegawai_kosong') }} />

            {/* Activities row: System Activities (4 cols) + Last Activity (2 cols) */}
            <div className="col-span-4 bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-sm font-semibold text-card-foreground">{t('admin.dashboard.recent_activities')}</h2>
                    </div>
                    <button onClick={loadData} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                        {t('admin.dashboard.refresh')}
                    </button>
                </div>
                <div className="divide-y divide-border">
                    {activities.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">{t('admin.dashboard.belum_ada_aktivitas')}</div>
                    ) : (
                        activities.map((act) => (
                            <div key={act.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${activityBgMap[act.type] || 'bg-muted'}`}>
                                    {activityIconMap[act.icon] || '📋'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-card-foreground truncate">{act.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{formatTimeAgo(act.created_at)}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="col-span-2">
                <LastActivity limit={6} />
            </div>
        </div>
    );
}
