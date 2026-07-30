'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Layers, Plus, GraduationCap, Clock } from 'lucide-react';
import { getCourses } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';

export default function ModulesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await getCourses({ page_size: 100 });
            setCourses(data?.results || []);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-muted rounded-xl animate-pulse"></div>
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse"></div>)}</div>
            </div>
        );
    }

    const stats = {
        totalModules: courses.reduce((sum, c) => sum + (c.modules?.length || 0), 0),
        totalLessons: courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0),
        totalCourses: courses.length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Modul & Pelajaran</h1>
                                <p className="text-emerald-100 text-sm">Kelola modul dan pelajaran dari semua kursus</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/admin/learning/courses/create')}
                            className="inline-flex items-center gap-2 bg-card text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" /> Kursus Baru
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Total Kursus', value: stats.totalCourses, icon: GraduationCap, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Total Modul', value: stats.totalModules, icon: Layers, color: 'bg-teal-400/20 text-teal-200' },
                            { label: 'Total Pelajaran', value: stats.totalLessons, icon: BookOpen, color: 'bg-green-400/20 text-green-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
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

            {/* Search */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Cari kursus..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" />
                </div>
            </div>

            {/* Course List */}
            {filtered.length > 0 ? (
                <div className="grid gap-4">
                    {filtered.map((course) => {
                        const totalModules = course.modules?.length || 0;
                        const totalLessons = course.lesson_count || 0;
                        return (
                            <div key={course.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-emerald-100 transition-all group">
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-card-foreground">{course.title}</h3>
                                                <Badge className={`flex-shrink-0 border-0 ${
                                                    course.status === 'published' ? 'bg-green-100 text-green-700' :
                                                    course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-card-foreground'
                                                }`}>{course.status}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{course.short_description || course.description}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-emerald-500" /><span className="font-medium">{totalModules}</span><span className="text-muted-foreground">Modul</span></span>
                                                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" /><span className="font-medium">{totalLessons}</span><span className="text-muted-foreground">Pelajaran</span></span>
                                                <span className="text-muted-foreground text-xs"><Clock className="w-3 h-3 inline mr-1" />{course.level} · {course.duration_minutes} menit</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => router.push(`/admin/learning/courses/${course.slug}`)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium transition-colors">
                                                <Layers className="w-3.5 h-3.5" /> Kelola
                                            </button>
                                            <button onClick={() => router.push(`/admin/courses/${course.slug}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-card-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                Lihat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        {search ? 'Kursus tidak ditemukan' : 'Belum ada kursus'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {search ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan membuat kursus pertama Anda'}
                    </p>
                    {!search && (
                        <button onClick={() => router.push('/admin/learning/courses/create')}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-200">
                            <Plus className="w-4 h-4" /> Buat Kursus Pertama
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
