'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEnrollments } from '@/lib/api/learning';
import { BookOpen, Search, Play, Award, XCircle, Clock, ChevronRight } from 'lucide-react';
import ProgressBar from '@/components/learning/ProgressBar';
import { authService } from '@/lib/services';

export default function PelatihanPage() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'dropped'>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.getCurrentUser()) { router.push('/login'); return; }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getEnrollments().catch(() => ({ results: [] }));
            setEnrollments(data?.results || []);
        } catch {} finally { setLoading(false); }
    };

    const filtered = enrollments.filter(e => {
        if (filter !== 'all' && e.status !== filter) return false;
        if (search && !e.course_title?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const tabs = [
        { key: 'all', label: 'Semua', count: enrollments.length },
        { key: 'active', label: 'Aktif', count: enrollments.filter(e => e.status === 'active').length },
        { key: 'completed', label: 'Selesai', count: enrollments.filter(e => e.status === 'completed').length },
        { key: 'dropped', label: 'Gagal', count: enrollments.filter(e => e.status === 'dropped').length },
    ] as const;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-card-foreground">Pelatihan</h1>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari pelatihan..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48 lg:w-64"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filter === tab.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Tidak ada pelatihan ditemukan</p>
                        <Button className="mt-4" onClick={() => router.push('/member/courses')}>Jelajahi Kursus</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((enrollment: any) => (
                        <Card
                            key={enrollment.id}
                            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/member/courses/${enrollment.course_slug}`)}
                        >
                            <CardContent className="p-4 md:p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={
                                                enrollment.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                enrollment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }>
                                                {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Gagal'}
                                            </Badge>
                                        </div>
                                        <h3 className="font-semibold text-card-foreground truncate">{enrollment.course_title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {enrollment.status === 'active' ? `Progress: ${enrollment.progress_percentage || 0}%` : ''}
                                            {enrollment.completed_at && ` • Selesai: ${new Date(enrollment.completed_at).toLocaleDateString('id-ID')}`}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 w-20 text-right">
                                        {enrollment.status === 'active' && (
                                            <>
                                                <div className="text-xs text-muted-foreground mb-1">{enrollment.progress_percentage || 0}%</div>
                                                <ProgressBar progress={enrollment.progress_percentage || 0} size="sm" />
                                            </>
                                        )}
                                        {enrollment.status === 'completed' && (
                                            <div className="text-green-600 dark:text-green-400">
                                                <Award className="w-6 h-6 mx-auto" />
                                            </div>
                                        )}
                                        {enrollment.status === 'dropped' && (
                                            <div className="text-red-400">
                                                <XCircle className="w-6 h-6 mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
