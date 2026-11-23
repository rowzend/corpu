'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { UserPlus, CheckCircle2, XCircle, ShieldCheck, Clock3, ArrowLeft } from 'lucide-react';
import {
    getRegistrations, actOnRegistration,
    type RegistrationItem,
} from '@/lib/api/registrations';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

const PER_PAGE = 10;

export default function AdminRegistrationsPage() {
    const [items, setItems] = useState<RegistrationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pendingCount, setPendingCount] = useState(0);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchData = async (pageNum = page, status = statusFilter) => {
        setLoading(true);
        try {
            const res = await getRegistrations({ status, page: pageNum, per_page: PER_PAGE });
            setItems(res?.data || []);
            setTotal(res?.pagination?.total || 0);
            setTotalPages(res?.pagination?.total_pages || 1);
        } catch (error) {
            console.error(handleApiError(error));
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await getRegistrations({ status: 'pending', page: 1, per_page: 1 });
            setPendingCount(res?.pagination?.total || 0);
        } catch { /* abaikan */ }
    };

    useEffect(() => {
        fetchData(1, 'pending');
        fetchPendingCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (pageNum: number, status = statusFilter) => {
        setPage(pageNum);
        fetchData(pageNum, status);
    };

    const doAction = async (row: RegistrationItem, action: 'approve' | 'reject') => {
        const confirmed = await showConfirm(
            action === 'approve'
                ? `Setujui pendaftaran "${row.name}"? User akan aktif, bisa login, dan user Keycloak di-enable.`
                : `Tolak pendaftaran "${row.name}"? User tidak akan bisa login.`,
            action === 'approve' ? 'Setujui Pendaftaran' : 'Tolak Pendaftaran',
            action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak',
            'Batal'
        );
        if (!confirmed) return;

        setProcessingId(row.id);
        try {
            const res = await actOnRegistration(row.id, action);
            showToast(res?.message || 'Pendaftaran diproses', 'success');

            // Catatan sync Keycloak — jangan bikin admin bingung
            const kc = res?.data?.keycloak;
            if (kc && kc !== 'ok' && kc !== 'skipped') {
                if (kc === 'not_found') {
                    showToast('User tidak ditemukan di Keycloak (push saat register gagal). Login lokal tetap bisa; SSO menyusul setelah provision ulang.', 'warning');
                } else if (kc === 'foreign') {
                    showToast('User dengan nama sama di Keycloak milik aplikasi lain — enable dilewati agar tidak merusak akun mereka. Login lokal tetap bisa.', 'warning');
                } else if (kc.startsWith('error')) {
                    showToast('Keycloak tidak terjangkau — user aktif di aplikasi, sync SSO menyusul.', 'warning');
                }
            }

            fetchData(page, statusFilter);
            fetchPendingCount();
        } catch (error) {
            showError(handleApiError(error), action === 'approve' ? 'Gagal Menyetujui' : 'Gagal Menolak');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 p-8">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Persetujuan Pendaftaran</h1>
                            <p className="text-blue-100 text-sm">Self-register menunggu persetujuan administrator — menyetujui = akun aktif + user Keycloak di-enable</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Menunggu Persetujuan', value: pendingCount, icon: Clock3, color: 'bg-amber-400/20 text-amber-200' },
                            { label: 'Dalam Tampilan', value: total, icon: ShieldCheck, color: 'bg-blue-400/20 text-blue-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-blue-100">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter status */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Users
                    </Link>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <label className="text-sm font-medium text-foreground">Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); applyFilters(1, e.target.value); }}
                            className="px-4 py-2.5 border border-border rounded-xl bg-muted text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="pending">Menunggu Persetujuan</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>
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
                                    <th className="px-4 py-3 font-semibold">Nama</th>
                                    <th className="px-4 py-3 font-semibold">Email / Username</th>
                                    <th className="px-4 py-3 font-semibold">Tanggal Daftar</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-16 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                                                Tidak ada pendaftaran untuk diproses
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {statusFilter === 'pending'
                                                    ? 'Belum ada pendaftaran baru yang menunggu persetujuan'
                                                    : 'Coba ubah filter status'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row, idx) => {
                                        const st = statusConfig[row.registration_status] || statusConfig.pending;
                                        const isProcessing = processingId === row.id;
                                        return (
                                            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                                                <td className="px-4 py-4 text-muted-foreground">{(page - 1) * PER_PAGE + idx + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white text-xs font-bold">
                                                                {(row.name || row.username).charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="font-medium text-card-foreground">{row.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-card-foreground">{row.email || '-'}</p>
                                                    <p className="text-xs text-muted-foreground">@{row.username}</p>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground">
                                                    {row.date_joined ? new Date(row.date_joined).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge className={`${st.className} border-0 text-xs font-medium`}>{st.label}</Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {row.registration_status !== 'approved' ? (
                                                            <button
                                                                onClick={() => doAction(row, 'approve')}
                                                                disabled={isProcessing}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                {isProcessing ? 'Memproses...' : 'Setujui'}
                                                            </button>
                                                        ) : null}
                                                        {row.registration_status === 'pending' ? (
                                                            <button
                                                                onClick={() => doAction(row, 'reject')}
                                                                disabled={isProcessing}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" /> Tolak
                                                            </button>
                                                        ) : null}
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
                            <p className="text-xs text-muted-foreground">Total {total} pendaftaran</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyFilters(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg">{page}</span>
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
