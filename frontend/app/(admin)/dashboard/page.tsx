'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BookOpen, GraduationCap, FileText, Award, ChevronRight,
    Play, Clock, TrendingUp, BookMarked, Library
} from 'lucide-react';
import { getEnrollments } from '@/lib/api/learning';
import { getRecentArticles } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { authService } from '@/lib/services';
import ProgressBar from '@/components/learning/ProgressBar';

export default function UserDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUser(authService.getCurrentUser());
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [enrollData, articleData] = await Promise.allSettled([
                getEnrollments().catch(() => ({ results: [] })),
                getRecentArticles(5).catch(() => ({ results: [] })),
            ]);
            if (enrollData.status === 'fulfilled') setEnrollments(enrollData.value?.results || []);
            if (articleData.status === 'fulfilled') setArticles(articleData.value?.results || []);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const avgProgress = enrollments.length > 0
        ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percentage || 0), 0) / enrollments.length)
        : 0;

    const stats = [
        { label: 'Kursus Diikuti', value: enrollments.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Sedang Berjalan', value: activeEnrollments.length, icon: Play, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Selesai', value: completedEnrollments.length, icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Rata-rata Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 md:p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Selamat Datang, {user?.name || user?.username || 'User'}
                            </h1>
                            <p className="text-blue-100 text-sm mt-1">
                                Lanjutkan perjalanan belajar Anda
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-4 md:p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Courses */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Kursus Saya
                        </h2>
                        <Link href="/courses/my-courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            Lihat Semua <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                            ))}
                        </div>
                    ) : enrollments.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-1">Belum Ada Kursus</h3>
                                <p className="text-sm text-gray-500 mb-4">Anda belum mendaftar kursus apapun</p>
                                <Button onClick={() => router.push('/courses')}>
                                    Jelajahi Kursus
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {enrollments.slice(0, 5).map((enrollment: any) => (
                                <Card
                                    key={enrollment.id}
                                    className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => router.push(`/courses/${enrollment.course_slug}/learn`)}
                                >
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                                                        {enrollment.status === 'active' ? 'Aktif' : 'Selesai'}
                                                    </Badge>
                                                    {enrollment.progress_percentage >= 100 && (
                                                        <Badge className="bg-yellow-100 text-yellow-700">Sertifikat</Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {enrollment.course_title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Terakhir diakses: {enrollment.last_accessed_at
                                                        ? new Date(enrollment.last_accessed_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'Belum'}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 w-20 text-right">
                                                <div className="text-xs text-gray-500 mb-1">{enrollment.progress_percentage || 0}%</div>
                                                <ProgressBar progress={enrollment.progress_percentage || 0} size="sm" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions & Recent Articles */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookMarked className="w-4 h-4 text-blue-600" />
                                Akses Cepat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/courses')}
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Jelajahi Kursus
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/courses/my-courses')}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Lanjutkan Belajar
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/kms')}
                            >
                                <Library className="w-4 h-4 mr-2" />
                                Knowledge Base
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/courses/certificates')}
                            >
                                <Award className="w-4 h-4 mr-2" />
                                Sertifikat Saya
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Articles */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    Artikel Terbaru
                                </CardTitle>
                                <Link href="/kms" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    Lihat Semua
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
                                </div>
                            ) : articles.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Belum ada artikel</p>
                            ) : (
                                articles.slice(0, 4).map((article: any) => (
                                    <Link
                                        key={article.id}
                                        href={`/kms/${article.slug}`}
                                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(article.published_at || article.created_at).toLocaleDateString('id-ID')}</span>
                                            {article.category && <Badge className="text-[10px] px-1.5 py-0" variant="secondary">{article.category.name}</Badge>}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
