'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import { getEnrollments } from '@/lib/api/learning';
import { getRecentArticles } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProgressBar from '@/components/learning/ProgressBar';
import {
    BookOpen, Award, XCircle, TrendingUp, Clock,
    Play, ChevronRight, GraduationCap, FileText, User
} from 'lucide-react';

export default function MemberDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const u = authService.getCurrentUser();
        if (!u) { router.push('/login'); return; }
        setUser(u);

        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Selamat Pagi');
        else if (hour < 15) setGreeting('Selamat Siang');
        else if (hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

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

    const totalPelatihan = enrollments.length;
    const lulus = enrollments.filter(e => e.status === 'completed').length;
    const tidakLulus = enrollments.filter(e => e.status === 'dropped').length;
    const aktif = enrollments.filter(e => e.status === 'active');

    const stats = [
        { label: 'Pelatihan Diikuti', value: totalPelatihan, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Berlangsung', value: aktif.length, icon: Play, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Lulus', value: lulus, icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Tidak Lulus', value: tidakLulus, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                            {user?.photo ? (
                                <img src={user.photo} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            )}
                        </div>
                        <div className="text-white">
                            <p className="text-blue-100 text-sm">{greeting}</p>
                            <h1 className="text-xl md:text-2xl font-bold mt-0.5">{user?.name || user?.username || 'User'}</h1>
                            <p className="text-blue-100 text-sm mt-1">{user?.email || ''}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-4 md:p-5 text-center">
                            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Active Courses Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Play className="w-5 h-5 text-blue-600" />
                        Kursus Sedang Berjalan
                    </h2>
                    {aktif.length > 0 && (
                        <Link href="/member/pelatihan" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            Lihat Semua <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : aktif.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8 text-center">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">Belum Ada Kursus Aktif</h3>
                            <p className="text-sm text-gray-500 mb-4">Mulai perjalanan belajar Anda sekarang</p>
                            <Button onClick={() => router.push('/member/courses')}>
                                Jelajahi Kursus
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {aktif.slice(0, 3).map((enrollment: any) => (
                            <Card
                                key={enrollment.id}
                                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => router.push(`/member/courses/${enrollment.course_slug}`)}
                            >
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className="bg-blue-100 text-blue-700">Aktif</Badge>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 truncate">{enrollment.course_title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Progress: {enrollment.progress_percentage || 0}%
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 w-20">
                                            <ProgressBar progress={enrollment.progress_percentage || 0} size="sm" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Articles */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Artikel yang Dibaca
                    </h2>
                    <Link href="/member/kms" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        Lihat Semua <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : articles.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">Belum Ada Artikel</h3>
                            <p className="text-sm text-gray-500 mb-4">Jelajahi knowledge base untuk artikel terbaru</p>
                            <Button onClick={() => router.push('/member/kms')} variant="outline">
                                Buka Knowledge Base
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {articles.slice(0, 4).map((article: any) => (
                            <Link
                                key={article.id}
                                href={`/member/kms/${article.slug}`}
                                className="block p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                            >
                                <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{article.title}</h3>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(article.published_at || article.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                    {article.category && (
                                        <Badge className="text-[10px] px-1.5 py-0" variant="secondary">
                                            {article.category.name}
                                        </Badge>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
