'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Search, Pencil, Trash2, GraduationCap, Calendar,
    Users, TrendingUp, Clock, MapPin, UserCheck, BookOpen
} from 'lucide-react';
import { getHCDPPrograms, getHCDPStats, deleteHCDPProgram, type HCDPProgram } from '@/lib/api/hcdp';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: 'Ongoing', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

const levelBadge: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-purple-100 text-purple-700',
};

export default function AdminHCDPPage() {
    const router = useRouter();
    const [programs, setPrograms] = useState<HCDPProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({
        total_programs: 0,
        ongoing_programs: 0,
        total_participants: 0,
        completed_programs: 0,
        active_programs: 0,
        published_programs: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getHCDPPrograms({ page: 1, per_page: 100 });
            if (Array.isArray(res)) {
                setPrograms(res);
            } else if (res?.data) {
                setPrograms(res.data);
            }
            try {
                const s = await getHCDPStats();
                if (s?.data) setStats(s.data);
            } catch (_) { }
        } catch (error) {
            console.error(handleApiError(error));
            setPrograms([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await showConfirm(
            `Yakin ingin menghapus program "${title}"?`,
            'Hapus Program',
            'Hapus',
            'Batal'
        );
        if (!confirmed) return;
        try {
            await deleteHCDPProgram(id);
            showToast('Program berhasil dihapus', 'success');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus');
        }
    };

    const filtered = programs.filter(p => {
        if (!p) return false;
        const matchSearch = (p.title || '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchCategory && matchStatus;
    });

    const categories = ['all', 'Leadership', 'Technology', 'Communication', 'Management', 'Technical'];
    const statuses = ['all', 'upcoming', 'ongoing', 'completed', 'cancelled'];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-52 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Program HCDP</h1>
                                <p className="text-amber-100 text-sm">Human Capital Development Program</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/hcdp/create')}
                            className="inline-flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> Tambah Program
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Program', value: stats.total_programs, icon: BookOpen, color: 'bg-white/20 text-white' },
                            { label: 'Sedang Berjalan', value: stats.ongoing_programs, icon: TrendingUp, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Selesai', value: stats.completed_programs, icon: Users, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Aktif', value: stats.active_programs, icon: UserCheck, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
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

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari program..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>
                                {c === 'all' ? 'Semua Kategori' : c}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>
                                {s === 'all' ? 'Semua Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Program List */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(program => {
                        const st = statusConfig[program.status] || statusConfig.upcoming;
                        return (
                            <div
                                key={program.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all group"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge className={`${st.className} border-0 text-xs font-medium`}>
                                            {st.label}
                                        </Badge>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => router.push(`/dashboard/hcdp/${program.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(program.id, program.title); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3
                                        className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/hcdp/${program.id}`)}
                                    >
                                        {program.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                        {program.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <Badge className={`${levelBadge[program.level] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>
                                            {program.level}
                                        </Badge>
                                        {program.category && (
                                            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-0">
                                                {program.category}
                                            </Badge>
                                        )}
                                        {program.is_published && (
                                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">Published</Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 border-t border-gray-50 pt-3">
                                        {program.duration && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {program.duration}
                                            </span>
                                        )}
                                        {program.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {program.location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {program.created_at ? new Date(program.created_at).toLocaleDateString('id-ID') : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {programs.length === 0 ? 'Belum ada program' : 'Program tidak ditemukan'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {programs.length === 0
                            ? 'Mulai dengan membuat program HCDP pertama'
                            : 'Coba ubah kata kunci pencarian Anda'}
                    </p>
                    {programs.length === 0 && (
                        <button
                            onClick={() => router.push('/dashboard/hcdp/create')}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-200"
                        >
                            <Plus className="w-4 h-4" /> Buat Program Pertama
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
