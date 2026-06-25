'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Users, BookOpen, Award, BarChart3, GraduationCap } from 'lucide-react';
import { getEnrollments, getCourses } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { ProgressBar } from '@/components/learning';

export default function ProgressPage() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [enrollData, courseData] = await Promise.all([
                getEnrollments({ page_size: 100 }).catch(() => ({ results: [] })),
                getCourses({ page_size: 100 }).catch(() => ({ results: [] })),
            ]);
            setEnrollments(enrollData?.results || []);
            setCourses(courseData?.results || []);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const totalStudents = new Set(enrollments.map((e: any) => e.user)).size;

    const filtered = activeEnrollments.filter(e =>
        e.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        e.user_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Progress Siswa</h1>
                            <p className="text-teal-100 text-sm">Pantau perkembangan belajar siswa</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Kursus', value: courses.length, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Siswa Aktif', value: totalStudents, icon: Users, color: 'bg-purple-400/20 text-purple-200' },
                            { label: 'Enrollment Aktif', value: activeEnrollments.length, icon: TrendingUp, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Selesai', value: completedEnrollments.length, icon: Award, color: 'bg-amber-400/20 text-amber-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-teal-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Cari siswa atau kursus..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                </div>
            </div>

            {/* List */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((enrollment) => (
                        <div key={enrollment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-100 transition-all">
                            <div className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-sm">{enrollment.user_name?.charAt(0) || '?'}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{enrollment.user_name || enrollment.user_username}</p>
                                            <p className="text-sm text-gray-500 truncate">{enrollment.course_title}</p>
                                        </div>
                                    </div>
                                    <div className="w-48">
                                        <ProgressBar value={enrollment.progress_percentage} size="md" />
                                    </div>
                                    <button onClick={() => router.push(`/learning/enrollments/${enrollment.id}`)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                        Detail
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada data progres</h3>
                    <p className="text-gray-500">Data akan muncul setelah siswa terdaftar di kursus</p>
                </div>
            )}
        </div>
    );
}
