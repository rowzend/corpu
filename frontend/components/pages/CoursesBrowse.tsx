'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, Clock, Search, BookOpen, GraduationCap, Play, CheckCircle, Filter } from 'lucide-react';
import { getCourses } from '@/lib/api/learning';
import { enrollCourse, getMyCourses } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';
import AuthGuard from '@/components/auth/AuthGuard';

const levelLabels: Record<string, string> = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Mahir',
};

const levelColors: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
};

export default function BrowseCoursesPage({ basePath = '/courses' }: { basePath?: string }) {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [myCourseSlugs, setMyCourseSlugs] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesData, myCourses] = await Promise.all([
                getCourses({ page_size: 50 }).catch(() => ({ results: [] })),
                getMyCourses().catch(() => []),
            ]);
            setCourses(coursesData?.results || []);
            setMyCourseSlugs(new Set((myCourses || []).map((c: any) => c.slug)));
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (slug: string) => {
        try {
            await enrollCourse(slug);
            showToast('Berhasil mendaftar kursus!', 'success');
            setMyCourseSlugs(prev => new Set(prev).add(slug));
        } catch (error) {
            showError(handleApiError(error), 'Gagal Mendaftar');
        }
    };

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) &&
        (level === 'all' || c.level === level)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Jelajahi Kursus</h1>
                        <p className="text-gray-600 mt-1">{filtered.length} kursus tersedia</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Cari kursus..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setLevel('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            level === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        Semua Level
                    </button>
                    {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                level === l
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {levelLabels[l]}
                        </button>
                    ))}
                </div>

                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((course) => {
                            const enrolled = myCourseSlugs.has(course.slug);
                            return (
                                <Card key={course.id} className="hover:shadow-lg transition-all overflow-hidden border border-gray-200 hover:border-blue-200">
                                    <div
                                        className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative cursor-pointer"
                                        onClick={() => router.push(`${basePath}/${course.slug}`)}
                                    >
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <GraduationCap className="w-12 h-12 text-white/50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                        <Badge className={`absolute top-3 left-3 border-0 shadow-lg ${levelColors[course.level] || 'bg-gray-100 text-gray-800'}`}>
                                            {levelLabels[course.level] || course.level}
                                        </Badge>
                                        {enrolled && (
                                            <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0 shadow-lg">
                                                <CheckCircle className="w-3 h-3 mr-1" />Terdaftar
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-5">
                                        <h3
                                            className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => router.push(`${basePath}/${course.slug}`)}
                                        >
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: course.short_description || course.description || '' }}>
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                <span>{course.lesson_count || 0} pelajaran</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{course.duration_minutes || 0} menit</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {course.rating_avg ? course.rating_avg.toFixed(1) : '0.0'}
                                                </span>
                                                <span className="text-xs text-gray-400">({course.rating_count || 0})</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Users className="w-4 h-4" />
                                                {course.enrolled_count || 0}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            {enrolled ? (
                                                <Button
                                                    className="w-full"
                                                    onClick={() => router.push(`${basePath}/${course.slug}/learn`)}
                                                >
                                                    <Play className="w-4 h-4 mr-2" />Lanjutkan Belajar
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => handleEnroll(course.slug)}
                                                >
                                                    <GraduationCap className="w-4 h-4 mr-2" />Daftar Sekarang
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kursus Tidak Ditemukan</h3>
                            <p className="text-gray-500 mb-6">Coba gunakan kata kunci pencarian yang berbeda</p>
                            <Button variant="outline" onClick={() => { setSearch(''); setLevel('all'); }}>
                                Reset Filter
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthGuard>
    );
}
