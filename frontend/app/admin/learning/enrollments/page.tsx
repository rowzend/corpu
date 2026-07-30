'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, UserPlus, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getEnrollments, updateEnrollment } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function EnrollmentsPage() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchEnrollments(); }, [statusFilter]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const params: any = { page_size: 100 };
            if (statusFilter) params.status = statusFilter;
            const data = await getEnrollments(params);
            setEnrollments(data?.results || []);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await updateEnrollment(id, { status: newStatus });
            showToast('Status berhasil diperbarui!', 'success');
            fetchEnrollments();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memperbarui Status');
        }
    };

    const filtered = enrollments.filter(e =>
        e.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        e.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.user_username?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        dropped: enrollments.filter(e => e.status === 'dropped').length,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-muted rounded-xl animate-pulse"></div>
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse"></div>)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Manajemen Enrollment</h1>
                                <p className="text-amber-100 text-sm">Kelola pendaftaran siswa ke kursus</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/admin/learning/enrollments/create')}
                            className="inline-flex items-center gap-2 bg-card text-amber-700 hover:bg-amber-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <UserPlus className="w-4 h-4" /> Enroll Manual
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total', value: stats.total, icon: Users, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Aktif', value: stats.active, icon: BookOpen, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Selesai', value: stats.completed, icon: CheckCircle, color: 'bg-teal-400/20 text-teal-200' },
                            { label: 'Berhenti', value: stats.dropped, icon: XCircle, color: 'bg-red-400/20 text-red-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-amber-200">{stat.label}</p>
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
                        <input type="text" placeholder="Cari siswa atau kursus..." value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-muted focus:bg-card transition-colors text-sm" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <Filter className="w-5 h-5 text-muted-foreground" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-muted text-sm">
                            <option value="">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="completed">Selesai</option>
                            <option value="dropped">Berhenti</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            {filtered.length > 0 ? (
                <div className="grid gap-3">
                    {filtered.map((enrollment) => (
                        <div key={enrollment.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-amber-100 transition-all">
                            <div className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-sm">{enrollment.user_name?.charAt(0) || '?'}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-card-foreground truncate">{enrollment.user_name || enrollment.user_username}</p>
                                            <p className="text-sm text-muted-foreground truncate">{enrollment.course_title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right min-w-[120px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-muted rounded-full h-2">
                                                    <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${enrollment.progress_percentage || 0}%` }} />
                                                </div>
                                                <span className="text-sm font-medium text-card-foreground">{enrollment.progress_percentage || 0}%</span>
                                            </div>
                                        </div>
                                        <Badge className={`border-0 ${
                                            enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                            enrollment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-muted text-card-foreground'
                                        }`}>
                                            {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Berhenti'}
                                        </Badge>
                                        <select value={enrollment.status}
                                            onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                                            className="px-2 py-1.5 text-xs border border-border rounded-lg bg-muted text-card-foreground focus:ring-2 focus:ring-amber-500">
                                            <option value="active">Aktif</option>
                                            <option value="completed">Selesai</option>
                                            <option value="dropped">Berhenti</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">Belum ada enrollment</h3>
                    <p className="text-muted-foreground mb-6">Daftarkan siswa ke kursus secara manual</p>
                    <button onClick={() => router.push('/admin/learning/enrollments/create')}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-amber-200">
                        <UserPlus className="w-4 h-4" /> Enroll Manual
                    </button>
                </div>
            )}
        </div>
    );
}
