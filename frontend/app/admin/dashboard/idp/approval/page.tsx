'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Search, ClipboardList, User, Calendar, CheckCircle2, XCircle, UserCheck, FileClock
} from 'lucide-react';
import { getIdpApprovalList, approveIdp, rejectIdp, type IdpAsn } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm, showInput } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

export default function AdminIdpApprovalPage() {
    const [idps, setIdps] = useState<IdpAsn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchData = async (pageNum = page, query = search, status = statusFilter) => {
        setLoading(true);
        try {
            const res = await getIdpApprovalList({ page: pageNum, per_page: 10, search: query, status });
            if (res?.data) {
                setIdps(res.data);
                setTotal(res.pagination?.total || 0);
                setTotalPages(res.pagination?.total_pages || 1);
            }
        } catch (error) {
            console.error(handleApiError(error));
            setIdps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(1, '', 'submitted'), 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (pageNum = 1) => {
        setPage(pageNum);
        fetchData(pageNum, search, statusFilter);
    };

    const handleApprove = async (idp: IdpAsn) => {
        const confirmed = await showConfirm(
            `Setujui IDP untuk "${idp.asn_nama}" (${idp.periode_display})?`,
            'Setujui IDP',
            'Ya, Setujui',
            'Batal'
        );
        if (!confirmed) return;
        try {
            await approveIdp(idp.id, '');
            showToast('IDP berhasil disetujui', 'success');
            fetchData(page, search, statusFilter);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyetujui');
        }
    };

    const handleReject = async (idp: IdpAsn) => {
        const reason = await showInput(
            'Tolak IDP',
            'Alasan penolakan',
            'Tuliskan alasan penolakan...',
            '',
            'textarea'
        );
        if (reason === null) return;
        try {
            await rejectIdp(idp.id, reason);
            showToast('IDP berhasil ditolak', 'warning');
            fetchData(page, search, statusFilter);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menolak');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Approval IDP ASN</h1>
                            <p className="text-teal-100 text-sm">Persetujuan Individual Development Plan oleh atasan langsung</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Menunggu', value: total, icon: FileClock, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Disetujui', value: 0, icon: UserCheck, color: 'bg-green-400/20 text-green-200' },
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

            {/* Search & Filter */}
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
                        <option value="submitted">Diajukan</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
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
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Catatan</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {idps.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                                                Tidak ada IDP untuk diproses
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {total === 0
                                                    ? 'Belum ada IDP yang diajukan untuk persetujuan'
                                                    : 'Coba ubah kata kunci pencarian atau filter Anda'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    idps.map((idp, idx) => {
                                        const st = statusConfig[idp.status] || statusConfig.submitted;
                                        return (
                                            <tr key={idp.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                                                <td className="px-4 py-4 text-muted-foreground">{(page - 1) * 10 + idx + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
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
                                                <td className="px-4 py-4">
                                                    <Badge className={`${st.className} border-0 text-xs font-medium`}>
                                                        {st.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 max-w-[180px]">
                                                    <p className="text-muted-foreground truncate">{idp.catatan || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {idp.status === 'submitted' ? (
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => handleApprove(idp)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(idp)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" /> Tolak
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end">
                                                            <span className="text-xs text-muted-foreground">
                                                                {idp.approved_by || '-'}
                                                                {idp.approved_at ? ` · ${new Date(idp.approved_at).toLocaleDateString('id-ID')}` : ''}
                                                            </span>
                                                        </div>
                                                    )}
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
