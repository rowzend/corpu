'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, Clock, Search, BookOpen, GraduationCap, Play, CheckCircle, Filter } from 'lucide-react';
import { getCourses } from '@/lib/api/learning';
import { getLevelColor } from '@/lib/colors';
import { enrollCourse, getMyCourses } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';
import AuthGuard from '@/components/auth/AuthGuard';

export default function BrowseCoursesPage({ basePath = '/courses' }: { basePath?: string }) {
    const router = useRouter();
    const t = useTranslations('courses_page');
    const tc = useTranslations('common');

    const levelLabels: Record<string, string> = {
        beginner: t('beginner'),
        intermediate: t('intermediate'),
        advanced: t('advanced'),
    };
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
            showToast(t('enroll_success'), 'success');
            setMyCourseSlugs(prev => new Set(prev).add(slug));
        } catch (error) {
            showError(handleApiError(error), t('enroll_error'));
        }
    };

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) &&
        (level === 'all' || c.level === level)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-card-foreground">{t('browse')}</h1>
                        <p className="text-muted-foreground mt-1">{t('courses_available', { count: filtered.length })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t('search_placeholder')}
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
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                        }`}
                    >
                        {t('all')}
                    </button>
                    {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                level === l
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-card text-muted-foreground hover:bg-muted border border-border'
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
                                <Card key={course.id} className="hover:shadow-lg transition-all overflow-hidden border border-border hover:border-primary/30 dark:hover:border-primary/50">
                                    <div
                                        className="h-40 bg-gradient-to-br from-primary to-primary/70 relative cursor-pointer"
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
                                        <Badge className={`absolute top-3 left-3 border-0 shadow-lg ${getLevelColor(course.level).bg} ${getLevelColor(course.level).text}`}>
                                            {levelLabels[course.level] || course.level}
                                        </Badge>
                                        {enrolled && (
                                            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0 shadow-lg">
                                                <CheckCircle className="w-3 h-3 mr-1" />{t('enrolled_badge')}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-5">
                                        <h3
                                            className="font-semibold text-card-foreground mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => router.push(`${basePath}/${course.slug}`)}
                                        >
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: course.short_description || course.description || '' }}>
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                                <span>{course.lesson_count || 0} {t('lessons')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{course.duration_minutes || 0} {t('minutes')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm font-medium text-foreground">
                                                    {course.rating_avg ? course.rating_avg.toFixed(1) : '0.0'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">({course.rating_count || 0})</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                                                    <Play className="w-4 h-4 mr-2" />{t('continue_learning')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full bg-primary hover:bg-primary/90"
                                                    onClick={() => handleEnroll(course.slug)}
                                                >
                                                    <GraduationCap className="w-4 h-4 mr-2" />{t('enroll_now')}
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
                            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">{t('no_results')}</h3>
                            <p className="text-muted-foreground mb-6">{t('no_results_desc')}</p>
                            <Button variant="outline" onClick={() => { setSearch(''); setLevel('all'); }}>
                                {t('reset_filter')}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthGuard>
    );
}
