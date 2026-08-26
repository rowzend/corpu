'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Search, Pencil, Trash2, ClipboardList, User, Calendar,
    UserCheck, FileCheck2, FileClock, Users
} from 'lucide-react';
import { getIdpList, getIdpStats, deleteIdp, type IdpAsn } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

export default function AdminIdpPage() {
    const router = useRouter();

    const [idps, setIdps] = useState<IdpAsn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({
        total_idp: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        total_asn: 0,
    });

    const fetchData = async (pageNum = page, query = search, status = statusFilter) => {
        setLoading(true);
        try {
            const res = await getIdpList({ page: pageNum, per_page: 10, search: query, status });
            if (res?.data) {
                setIdps(res.data);
                setTotal(res.pagination?.total || 0);
                setTotalPages(res.pagination?.total_pages || 1);
            }
            try {
                const s = await getIdpStats();
                if (s?.data) setStats(s.data);
            } catch { }
        } catch (error) {
            console.error(handleApiError(error));
            setIdps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(1, '', 'all'), 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (pageNum = 1) => {
        setPage(pageNum);
        fetchData(pageNum, search, statusFilter);
    };

    const handleDelete = async (id: number, nama: string) => {
        const confirmed = await showConfirm(
            `Yakin ingin menghapus IDP untuk "${nama}"?`,
            'Hapus IDP',
            'Hapus',
            'Batal'
        );
        if (!confirmed) return;
        try {
            await deleteIdp(id);
            showToast('IDP berhasil dihapus', 'success');
            fetchData(page, search, statusFilter);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus');
        }
    };

    const statuses = ['all', 'draft', 'submitted', 'approved', 'rejected'];

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">IDP ASN</h1>
                                <p className="text-teal-100 text-sm">Individual Development Plan Aparatur Sipil Negara</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/admin/dashboard/idp/create')}
                            className="inline-flex items-center gap-2 bg-card text-teal-700 hover:bg-teal-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> Buat IDP
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                        {[
                            { label: 'Total IDP', value: stats.total_idp, icon: ClipboardList, color: 'bg-white/20 text-white' },
                            { label: 'Draft', value: stats.draft, icon: FileClock, color: 'bg-gray-400/20 text-gray-200' },
                            { label: 'Diajukan', value: stats.submitted, icon: FileCheck2, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Disetujui', value: stats.approved, icon: UserCheck, color: 'bg-green-400/20 text-green-200' },
                            { label: 'ASN', value: stats.total_asn, icon: Users, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-teal-100">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari ASN, NIP, jabatan, atasan..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); }}
                            onKeyDown={e => { if (e.key === 'Enter') applyFilters(1); }}
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-muted focus:bg-card transition-colors text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); applyFilters(1); }}
                        className="px-4 py-2.5 border border-border rounded-xl bg-muted text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>
                                {s === 'all' ? 'Semua Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold">No</th>
                                    <th className="px-4 py-3 font-semibold">ASN</th>
                                    <th className="px-4 py-3 font-semibold">Atasan Langsung</th>
                                    <th className="px-4 py-3 font-semibold">Periode IDP</th>
                                    <th className="px-4 py-3 font-semibold">Dasar Penyusunan IDP</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {idps.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
                                                <ClipboardList className="w-8 h-8 text-teal-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                                                {total === 0 ? 'Belum ada IDP' : 'IDP tidak ditemukan'}
                                            </h3>
                                            <p className="text-muted-foreground mb-6">
                                                {total === 0
                                                    ? 'Mulai dengan membuat IDP ASN pertama'
                                                    : 'Coba ubah kata kunci pencarian Anda'}
                                            </p>
                                            {total === 0 && (
                                                <button
                                                    onClick={() => router.push('/admin/dashboard/idp/create')}
                                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-teal-200"
                                                >
                                                    <Plus className="w-4 h-4" /> Buat IDP Pertama
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    idps.map((idp, idx) => {
                                        const st = statusConfig[idp.status] || statusConfig.draft;
                                        return (
                                            <tr key={idp.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                                                <td className="px-4 py-4 text-muted-foreground">{(page - 1) * 10 + idx + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-card-foreground truncate">{idp.asn_nama}</p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {idp.asn_nip} · {idp.asn_jabatan}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {idp.atasan_langsung_nama ? (
                                                        <div className="min-w-0">
                                                            <p className="text-card-foreground truncate">{idp.atasan_langsung_nama}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{idp.atasan_langsung?.nama_jabatan || ''}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{idp.periode_display}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 max-w-[220px]">
                                                    <p className="text-muted-foreground truncate">{idp.dasar_penyusunan_idp || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge className={`${st.className} border-0 text-xs font-medium`}>
                                                        {st.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/dashboard/idp/${idp.id}`)}
                                                            className="p-2 text-muted-foreground hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                            title="Edit IDP"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(idp.id, idp.asn_nama); }}
                                                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus IDP"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Total {total} IDP
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyFilters(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg">
                                    {page}
                                </span>
                                <button
                                    onClick={() => applyFilters(page + 1)}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
