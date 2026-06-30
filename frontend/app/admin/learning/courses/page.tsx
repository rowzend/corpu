'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, BookOpen, Clock, Star, Users as UsersIcon } from 'lucide-react';
import { getCourses, deleteCourse } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

export default function CoursesPage() {
    const router = useRouter();
    const t = useTranslations('admin.courses');
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const statusFilters = ['all', 'published', 'draft', 'archived'];
    const filtered = courses.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleDelete = async (slug: string, title: string) => {
        const confirmed = await showDeleteConfirm(title, t('delete_confirm_item'));
        if (!confirmed) return;
        try {
            await deleteCourse(slug);
            showToast(t('delete_success', { title }), 'success');
            fetchCourses();
        } catch (error) {
            showError(handleApiError(error), t('delete_error'));
        }
    };

    const stats = {
        total: courses.length,
        published: courses.filter(c => c.status === 'published').length,
        draft: courses.filter(c => c.status === 'draft').length,
        archived: courses.filter(c => c.status === 'archived').length,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-muted rounded-xl animate-pulse"></div>
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>)}</div>
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
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                <p className="text-indigo-100 text-sm">{t('page_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/admin/learning/courses/create')}
                            className="inline-flex items-center gap-2 bg-card text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> {t('add_course')}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: t('stats_total'), value: stats.total, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: t('stats_published'), value: stats.published, icon: Eye, color: 'bg-green-400/20 text-green-200' },
                            { label: t('stats_draft'), value: stats.draft, icon: Edit, color: 'bg-amber-400/20 text-amber-200' },
                            { label: t('stats_archived'), value: stats.archived, icon: Clock, color: 'bg-gray-400/20 text-gray-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
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

            {/* Search & Filter */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-muted focus:bg-card transition-colors text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {statusFilters.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                    statusFilter === status
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-muted text-card-foreground hover:bg-muted'
                                }`}
                            >
                                {status === 'all' ? t('filter_all') : status.charAt(0).toUpperCase() + status.slice(1)}
                                <span className="ml-1 text-xs opacity-75">
                                    ({status === 'all' ? courses.length : courses.filter(c => c.status === status).length})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Course List */}
            {filtered.length > 0 ? (
                <div className="grid gap-4">
                    {filtered.map((course) => (
                        <div key={course.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-indigo-100 transition-all group">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-card-foreground truncate">{course.title}</h3>
                                            <Badge className={`flex-shrink-0 border-0 ${
                                                course.status === 'published' ? 'bg-green-100 text-green-700' :
                                                course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-foreground'
                                            }`}>
                                                {course.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{course.short_description || course.description?.substring(0, 120)}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.level}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_minutes} menit</span>
                                            <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />{course.enrolled_count || 0} {t('enrolled')}</span>
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{course.rating_avg?.toFixed(1) || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => router.push(`/learning/courses/${course.slug}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                            <Edit className="w-3.5 h-3.5" /> {t('edit')}
                                        </button>
                                        <button onClick={() => router.push(`/courses/${course.slug}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                            <Eye className="w-3.5 h-3.5" /> {t('view')}
                                        </button>
                                        <button onClick={() => handleDelete(course.slug, course.title)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        {search || statusFilter !== 'all' ? t('no_courses_found') : t('no_courses')}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {search || statusFilter !== 'all'
                            ? t('try_adjust_filter')
                            : t('start_create_first')}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <button onClick={() => router.push('/admin/learning/courses/create')}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4" /> {t('create_first')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
