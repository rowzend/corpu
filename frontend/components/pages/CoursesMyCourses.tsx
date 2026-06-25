'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, Search, Play, CheckCircle, Clock,
    TrendingUp, ArrowRight
} from 'lucide-react';
import { getEnrollments } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError } from '@/lib/sweetalert';
import ProgressBar from '@/components/learning/ProgressBar';

const statusConfig: Record<string, { label: string; style: string }> = {
    active: { label: 'Aktif', style: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Selesai', style: 'bg-green-100 text-green-700' },
    dropped: { label: 'Berhenti', style: 'bg-gray-100 text-gray-600' },
};

export default function CoursesMyCourses({ basePath = '/courses' }: { basePath?: string }) {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getEnrollments().catch(() => ({ results: [] }));
            setEnrollments(data?.results || []);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally {
            setLoading(false);
        }
    };

    const filtered = enrollments.filter(e =>
        e.course_title?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        avgProgress: enrollments.length > 0
            ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percentage || 0), 0) / enrollments.length)
            : 0,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Kursus Saya</h1>
                                <p className="text-indigo-100 text-sm">Semua kursus yang Anda daftarkan</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`${basePath}/browse`)}
                            className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <BookOpen className="w-4 h-4" /> Jelajahi Kursus
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Kursus', value: stats.total, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Sedang Berjalan', value: stats.active, icon: TrendingUp, color: 'bg-yellow-400/20 text-yellow-200' },
                            { label: 'Selesai', value: stats.completed, icon: CheckCircle, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Rata-rata Progress', value: `${stats.avgProgress}%`, icon: Clock, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-indigo-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari kursus..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Course List */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {enrollments.length === 0 ? 'Belum ada kursus' : 'Kursus tidak ditemukan'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {enrollments.length === 0
                            ? 'Anda belum mendaftar kursus apapun.'
                            : 'Coba gunakan kata kunci pencarian yang berbeda.'}
                    </p>
                    {enrollments.length === 0 && (
                        <button
                            onClick={() => router.push(`${basePath}/browse`)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200"
                        >
                            <BookOpen className="w-4 h-4" /> Jelajahi Kursus
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((enrollment) => {
                        const cfg = statusConfig[enrollment.status] || statusConfig.dropped;
                        return (
                            <div
                                key={enrollment.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500"
                            >
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {enrollment.course_thumbnail && (
                                            <div className="w-full sm:w-40 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={enrollment.course_thumbnail}
                                                    alt={enrollment.course_title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                            {enrollment.course_title}
                                                        </h3>
                                                        <Badge className={`text-xs font-medium ${cfg.style} border-0`}>
                                                            {cfg.label}
                                                        </Badge>
                                                    </div>
                                                    {enrollment.course_description && (
                                                        <p className="text-sm text-gray-500 line-clamp-1 mb-3"
                                                                            dangerouslySetInnerHTML={{ __html: enrollment.course_description }}>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="max-w-md mb-2">
                                                <div className="flex justify-between text-sm text-gray-500 mb-1">
                                                    <span>Progress</span>
                                                    <span className="font-medium text-indigo-600">{enrollment.progress_percentage}%</span>
                                                </div>
                                                <ProgressBar value={enrollment.progress_percentage} size="sm" />
                                            </div>
                                            {enrollment.course_duration_minutes > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-gray-600">{enrollment.completed_duration_minutes}m</span>
                                                    <span>selesai</span>
                                                    <span className="text-gray-300">·</span>
                                                    <span>Sisa {enrollment.remaining_duration_minutes}m</span>
                                                    <span className="text-gray-300">·</span>
                                                    <span>Total {enrollment.course_duration_minutes}m</span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                {enrollment.status === 'active' && (
                                                    <button
                                                        onClick={() => router.push(`${basePath}/${enrollment.course_slug}/learn`)}
                                                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-200"
                                                    >
                                                        <Play className="w-3.5 h-3.5" /> Lanjutkan Belajar
                                                    </button>
                                                )}
                                                {enrollment.status === 'completed' && (
                                                    <button
                                                        onClick={() => router.push(`${basePath}/${enrollment.course_slug}`)}
                                                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-emerald-200"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Lihat Detail
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`${basePath}/${enrollment.course_slug}`)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                >
                                                    Detail <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
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
