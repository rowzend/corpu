'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Users, TrendingUp, Award, GraduationCap, ClipboardCheck, BarChart3 } from 'lucide-react';
import { getCourses, getEnrollments } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';

export default function LearningDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        total_courses: 0,
        published_courses: 0,
        total_enrollments: 0,
        total_students: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [courses, enrollments] = await Promise.all([
                getCourses({ page_size: 100 }).catch(() => ({ results: [] })),
                getEnrollments().catch(() => ({ results: [] })),
            ]);
            const courseList = courses?.results || [];
            const enrollmentList = enrollments?.results || [];
            setStats({
                total_courses: courseList.length,
                published_courses: courseList.filter((c: any) => c.status === 'published').length,
                total_enrollments: enrollmentList.length,
                total_students: new Set(enrollmentList.map((e: any) => e.user)).size,
            });
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Learning Module</h1>
                                <p className="text-indigo-100 text-sm">Kelola kursus dan pembelajaran siswa</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/learning/courses/create')}
                            className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> Buat Kursus
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Kursus', value: stats.total_courses, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Published', value: stats.published_courses, icon: TrendingUp, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Enrollment', value: stats.total_enrollments, icon: Users, color: 'bg-purple-400/20 text-purple-200' },
                            { label: 'Siswa Aktif', value: stats.total_students, icon: Award, color: 'bg-amber-400/20 text-amber-200' },
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

            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Manajemen Kursus', icon: BookOpen, href: '/learning/courses', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
                    { label: 'Enrollment', icon: Users, href: '/learning/enrollments', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
                    { label: 'Progress', icon: BarChart3, href: '/learning/progress', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
                    { label: 'Quiz', icon: ClipboardCheck, href: '/learning/quizzes', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100' },
                ].map((item, i) => (
                    <button
                        key={i}
                        onClick={() => router.push(item.href)}
                        className={`${item.bg} rounded-xl p-5 flex items-center gap-4 transition-all group`}
                    >
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-105 transition-transform`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className={`font-semibold ${item.color}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
