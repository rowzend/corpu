'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, CheckCircle, TrendingUp, Award, Play,
    Target, Calendar, BarChart3, Clock
} from 'lucide-react';
import { getEnrollments } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError } from '@/lib/sweetalert';
import ProgressBar from '@/components/learning/ProgressBar';

export default function CoursesMyProgress({ basePath = '/courses' }: { basePath?: string }) {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
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

    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'active').length;
    const avgProgress = totalEnrollments > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalEnrollments)
        : 0;
    const topCourse = enrollments.length > 0
        ? enrollments.reduce((best, e) => (e.progress_percentage || 0) > (best.progress_percentage || 0) ? e : best, enrollments[0])
        : null;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Progress Saya</h1>
                            <p className="text-emerald-100 text-sm">Pantau perkembangan belajar Anda</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Enrollment', value: totalEnrollments, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Sedang Berjalan', value: activeCourses, icon: TrendingUp, color: 'bg-yellow-400/20 text-yellow-200' },
                            { label: 'Selesai', value: completedCourses, icon: CheckCircle, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Rata-rata Progress', value: `${avgProgress}%`, icon: Target, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-emerald-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Progress Highlight */}
            {topCourse && topCourse.progress_percentage > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-amber-500" />
                            <h2 className="font-semibold text-gray-900">Progress Terbaik</h2>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{topCourse.course_title}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Mulai {new Date(topCourse.enrolled_at).toLocaleDateString('id-ID')}
                                    </span>
                                    <Badge className={
                                        topCourse.status === 'completed' ? 'bg-green-100 text-green-700 border-0' :
                                        'bg-blue-100 text-blue-700 border-0'
                                    }>
                                        {topCourse.status === 'completed' ? 'Selesai' : 'Aktif'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-3xl font-bold text-emerald-600">{topCourse.progress_percentage}%</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <ProgressBar value={topCourse.progress_percentage} size="md" />
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Progress */}
            <h2 className="text-lg font-semibold text-gray-900">Detail Progress per Kursus</h2>

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada data</h3>
                    <p className="text-gray-500 mb-6">Anda belum terdaftar di kursus manapun</p>
                    <button
                        onClick={() => router.push(`${basePath}/browse`)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-200"
                    >
                        <BookOpen className="w-4 h-4" /> Jelajahi Kursus
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrollments.map((enrollment) => (
                        <div
                            key={enrollment.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{enrollment.course_title}</h3>
                                        <Badge className={`mt-1 text-xs font-medium border-0 ${
                                            enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                            enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Berhenti'}
                                        </Badge>
                                    </div>
                                    {enrollment.has_certificate && (
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Award className="w-5 h-5 text-amber-600" />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span className="font-semibold text-emerald-600">{enrollment.progress_percentage}%</span>
                                    </div>
                                    <ProgressBar value={enrollment.progress_percentage} size="md" />
                                </div>

                                <div className="flex justify-between text-xs text-gray-400 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Mulai: {new Date(enrollment.enrolled_at).toLocaleDateString('id-ID')}
                                    </span>
                                    {enrollment.completed_at && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Selesai: {new Date(enrollment.completed_at).toLocaleDateString('id-ID')}
                                        </span>
                                    )}
                                </div>
                                {enrollment.course_duration_minutes > 0 && (
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-emerald-500" />
                                            <span className="text-gray-600 font-medium">{enrollment.completed_duration_minutes}m</span>
                                            <span>selesai</span>
                                        </span>
                                        <span className="text-gray-300">·</span>
                                        <span>Sisa {enrollment.remaining_duration_minutes}m</span>
                                        <span className="text-gray-300">·</span>
                                        <span>Total {enrollment.course_duration_minutes}m</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => router.push(`${basePath}/${enrollment.course_slug}/learn`)}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-emerald-200"
                                >
                                    <Play className="w-3.5 h-3.5" /> Lanjutkan Belajar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
