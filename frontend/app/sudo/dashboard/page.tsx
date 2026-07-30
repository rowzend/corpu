'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService, authService, type DashboardStats, type Activity, type SystemStatus, type ChartData } from '@/lib/services';
import { LayoutDashboard, Users, BookOpen, GraduationCap, FileText, Award, TrendingUp, Clock, Activity, Database, Wifi, Cpu, ChevronRight, UserPlus, BarChart3, CheckCircle, PlayCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
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
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const statCards = [
        { label: 'Total Users', value: stats?.total_users ?? '-', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', desc: `${stats?.new_users_this_month ?? 0} baru bulan ini` },
        { label: 'Pegawai Aktif', value: stats?.pegawai_aktif ?? '-', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Non-admin & non-superadmin' },
        { label: 'Total Pegawai', value: '-', icon: LayoutDashboard, color: 'text-gray-600', bg: 'bg-gray-100', desc: 'Data pegawai (kosong)' },
        { label: 'Published Courses', value: stats?.total_courses ?? '-', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: `${stats?.total_enrollments ?? 0} total enrollment` },
        { label: 'Active Enrollments', value: stats?.active_enrollments ?? '-', icon: PlayCircle, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Sedang berlangsung' },
        { label: 'Completed', value: stats?.completed_enrollments ?? '-', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', desc: `${stats?.certificates_issued ?? 0} sertifikat terbit` },
        { label: 'HCDP Programs', value: stats?.total_hcdp ?? '-', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', desc: `${stats?.active_hcdp ?? 0} aktif` },
        { label: 'Published Berita', value: stats?.total_berita ?? '-', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Berita & pengumuman' },
    ];

    const activityIconMap: Record<string, string> = {
        bell: '🔔', award: '🏆', 'user-plus': '👤',
    };

    const activityBgMap: Record<string, string> = {
        success: 'bg-green-100', primary: 'bg-blue-100', info: 'bg-gray-100', warning: 'bg-yellow-100', danger: 'bg-red-100',
    };

    const statusIconMap: Record<string, React.ReactNode> = {
        'check-circle': <CheckCircle className="w-4 h-4" />,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <p className="text-blue-100 text-sm">
                            Selamat datang, <span className="font-semibold text-white">{user?.name || user?.username || 'User'}</span>
                        </p>
                    </div>
                    {isLoading && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="text-white text-sm">Memuat...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl p-4 border border-transparent hover:border-gray-200 transition-all`}>
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{stat.desc}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Monthly Trend</h2>
                    </div>
                    {chartData?.monthly_trend ? (
                        <div className="space-y-4">
                            <div className="flex gap-4 text-xs text-gray-500">
                                {chartData.monthly_trend.datasets.map(ds => (
                                    <div key={ds.label} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
                                        {ds.label}
                                    </div>
                                ))}
                            </div>
                            <div className="relative h-40">
                                <div className="absolute inset-0 flex items-end justify-between gap-1">
                                    {(chartData.monthly_trend.labels || []).map((label, i) => {
                                        const enrollVal = chartData.monthly_trend.datasets[0]?.data[i] ?? 0;
                                        const certVal = chartData.monthly_trend.datasets[1]?.data[i] ?? 0;
                                        const maxVal = Math.max(
                                            ...chartData.monthly_trend.datasets.flatMap(d => d.data), 1
                                        );
                                        const enrollH = (enrollVal / maxVal) * 100;
                                        const certH = (certVal / maxVal) * 100;
                                        return (
                                            <div key={label} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                                                <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '100%' }}>
                                                    <div className="w-3 bg-blue-500 rounded-t-sm transition-all" style={{ height: `${Math.max(enrollH, 2)}%` }} title={`Enrollments: ${enrollVal}`} />
                                                    <div className="w-3 bg-emerald-500 rounded-t-sm transition-all" style={{ height: `${Math.max(certH, 2)}%` }} title={`Certificates: ${certVal}`} />
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Memuat data...</div>
                    )}
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Course Categories</h2>
                    </div>
                    {chartData?.golongan_distribution && chartData.golongan_distribution.labels.length > 0 ? (
                        <div className="space-y-3">
                            {chartData.golongan_distribution.labels.map((label, i) => {
                                const total = chartData.golongan_distribution.values.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? (chartData.golongan_distribution.values[i] / total) * 100 : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700">{label}</span>
                                            <span className="text-gray-500">{chartData.golongan_distribution.values[i]} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{
                                                width: `${pct}%`,
                                                backgroundColor: chartData.golongan_distribution.colors[i] || '#3B82F6'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Belum ada data course</div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Activities + System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h2 className="text-sm font-semibold text-gray-900">Recent Activities</h2>
                        </div>
                        <button onClick={loadData} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Refresh
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {activities.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Belum ada aktivitas</div>
                        ) : (
                            activities.map((act) => (
                                <div key={act.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${activityBgMap[act.type] || 'bg-gray-100'}`}>
                                        {activityIconMap[act.icon] || '📋'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{act.description}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{formatTimeAgo(act.created_at)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-gray-600" />
                        <h2 className="text-sm font-semibold text-gray-900">System Status</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {systemStatus ? (
                            <>
                                {[
                                    { key: 'database', label: 'Database', icon: Database },
                                    { key: 'cache', label: 'Cache', icon: Wifi },
                                    { key: 'siasn', label: 'SIASN API', icon: Wifi },
                                ].map(item => {
                                    const status = systemStatus[item.key as keyof SystemStatus] as { status: string; message: string; class: string };
                                    const statusColors: Record<string, string> = {
                                        online: 'text-green-600 bg-green-50',
                                        offline: 'text-red-600 bg-red-50',
                                        disconnected: 'text-yellow-600 bg-yellow-50',
                                    };
                                    const statusDots: Record<string, string> = {
                                        online: 'bg-green-500',
                                        offline: 'bg-red-500',
                                        disconnected: 'bg-yellow-500',
                                    };
                                    return (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <item.icon className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[status.status] || 'text-gray-600 bg-gray-50'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status.status] || 'bg-gray-400'}`} />
                                                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Overall</span>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                            systemStatus.overall === 'healthy' ? 'bg-green-50 text-green-700' :
                                            systemStatus.overall === 'degraded' ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>
                                            {systemStatus.overall.charAt(0).toUpperCase() + systemStatus.overall.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-4">Memuat status...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
