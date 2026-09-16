'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LazySearchSelect } from '@/components/ui/lazy-search-select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
    Search, ClipboardList, User, Calendar, CheckCircle2, XCircle, UserCheck, FileClock, Target as TargetIcon, Building2, ListChecks
} from 'lucide-react';
import { getIdpApprovalList, getIdpDetail, approveIdp, rejectIdp, type IdpAsn } from '@/lib/api/idp';
import { simpegService } from '@/lib/services/simpeg.service';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    verified: { label: 'Diverifikasi', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

interface RencanaAksiItem {
    tujuan_pembelajaran_uraian?: string;
    pilar_pengembangan_nama?: string;
    jenis_kegiatan_pengembangan_nama?: string;
    nama_kegiatan_program_nama?: string;
    nama_spesifik_kegiatan?: string;
    deskripsi?: string;
    penyelenggara_diusulkan?: string;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    durasi_value?: number;
    durasi_satuan?: string;
    estimasi_biaya?: string;
}

interface TargetKompetensiItem {
    jenis_kompetensi_nama?: string;
    nama_kompetensi_nama?: string;
    prioritas_pengembangan_nama?: string;
    unit_kerja_nama?: string;
    kompetensi_teknis_uraian?: string;
    deskripsi: string;
    justifikasi_pengembangan?: string;
    level_saat_ini?: number;
    level_diharapkan?: number;
    gap?: number;
    rencana_aksi?: RencanaAksiItem[];
    _legacy?: boolean;
}

function parseTargetKompetensi(raw: string | null | undefined): TargetKompetensiItem[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((el): TargetKompetensiItem | null => {
                if (!el || typeof el !== 'object') return null;
                const obj = el as Record<string, unknown>;
                const deskripsi = typeof obj.deskripsi === 'string' ? obj.deskripsi.trim() : '';
                if (!deskripsi && !obj.jenis_kompetensi_nama && !obj.nama_kompetensi_nama) return null;
                return {
                    jenis_kompetensi_nama: typeof obj.jenis_kompetensi_nama === 'string' ? obj.jenis_kompetensi_nama : undefined,
                    nama_kompetensi_nama: typeof obj.nama_kompetensi_nama === 'string' ? obj.nama_kompetensi_nama : undefined,
                    prioritas_pengembangan_nama: typeof obj.prioritas_pengembangan_nama === 'string' ? obj.prioritas_pengembangan_nama : undefined,
                    unit_kerja_nama: typeof obj.unit_kerja_nama === 'string' ? obj.unit_kerja_nama : undefined,
                    kompetensi_teknis_uraian: typeof obj.kompetensi_teknis_uraian === 'string' ? obj.kompetensi_teknis_uraian : undefined,
                    deskripsi,
                    justifikasi_pengembangan: typeof obj.justifikasi_pengembangan === 'string' ? obj.justifikasi_pengembangan : undefined,
                    level_saat_ini: Number(obj.level_saat_ini) || undefined,
                    level_diharapkan: Number(obj.level_diharapkan) || undefined,
                    gap: typeof obj.gap === 'number' ? obj.gap : (Number(obj.level_diharapkan) || 0) - (Number(obj.level_saat_ini) || 0),
                    rencana_aksi: Array.isArray(obj.rencana_aksi)
                        ? (obj.rencana_aksi as unknown[])
                            .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
                            .map(r => ({
                                tujuan_pembelajaran_uraian: typeof r.tujuan_pembelajaran_uraian === 'string' ? r.tujuan_pembelajaran_uraian : undefined,
                                pilar_pengembangan_nama: typeof r.pilar_pengembangan_nama === 'string' ? r.pilar_pengembangan_nama : undefined,
                                jenis_kegiatan_pengembangan_nama: typeof r.jenis_kegiatan_pengembangan_nama === 'string' ? r.jenis_kegiatan_pengembangan_nama : undefined,
                                nama_kegiatan_program_nama: typeof r.nama_kegiatan_program_nama === 'string' ? r.nama_kegiatan_program_nama : undefined,
                                nama_spesifik_kegiatan: typeof r.nama_spesifik_kegiatan === 'string' ? r.nama_spesifik_kegiatan : undefined,
                                deskripsi: typeof r.deskripsi === 'string' ? r.deskripsi : undefined,
                                penyelenggara_diusulkan: typeof r.penyelenggara_diusulkan === 'string' ? r.penyelenggara_diusulkan : undefined,
                                tanggal_mulai: typeof r.tanggal_mulai === 'string' ? r.tanggal_mulai : undefined,
                                tanggal_selesai: typeof r.tanggal_selesai === 'string' ? r.tanggal_selesai : undefined,
                                durasi_value: Number(r.durasi_value) || undefined,
                                durasi_satuan: typeof r.durasi_satuan === 'string' ? r.durasi_satuan : undefined,
                                estimasi_biaya: typeof r.estimasi_biaya === 'string' ? r.estimasi_biaya : undefined,
                            }))
                        : [],
                    _legacy: !obj.jenis_kompetensi_nama && !obj.nama_kompetensi_nama,
                };
            })
            .filter((t): t is TargetKompetensiItem => t !== null);
    } catch {
        return [];
    }
}

function fmtDateTime(s?: string | null): string {
    if (!s) return '-';
    const d = new Date(s);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('id-ID');
}

export default function AdminIdpApprovalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [idps, setIdps] = useState<IdpAsn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('verified');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal state
    const [selected, setSelected] = useState<IdpAsn | null>(null);
    const [targets, setTargets] = useState<TargetKompetensiItem[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [catatan, setCatatan] = useState('');
    const [alokasi, setAlokasi] = useState('');
    const [processing, setProcessing] = useState(false);

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
        const timer = setTimeout(() => fetchData(1, '', 'verified'), 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (pageNum = 1) => {
        setPage(pageNum);
        fetchData(pageNum, search, statusFilter);
    };

    const fetchAsnOptions = useCallback(async (query: string) => {
        const res = await simpegService.getPegawaiList({ search: query, per_page: 20 });
        return res.data.map((p) => ({
            value: p.id,
            label: `${p.nama_pegawai} (${p.nip_baru || p.nip_lama || '-'}) - ${p.nama_jabatan || ''}`,
        }));
    }, []);

    const handlePegawaiQuickSelect = async (asnId: string | number | null) => {
        if (!asnId) return;
        try {
            const res = await getIdpApprovalList({ page: 1, per_page: 100 });
            const found = (res?.data || []).find((x) => String(x.asn_id) === String(asnId));
            if (found) {
                openModal(found);
            } else {
                showToast('Pegawai tersebut belum memiliki IDP yang diverifikasi', 'info');
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat IDP');
        }
    };

    const openModal = async (idp: IdpAsn) => {
        setSelected(idp);
        setCatatan(idp.catatan_persetujuan || '');
        setAlokasi(idp.alokasi_dukungan_program || '');
        setDetailLoading(true);
        setTargets([]);
        try {
            const res = await getIdpDetail(idp.id);
            if (res?.data) {
                setSelected(res.data);
                setTargets(parseTargetKompetensi(res.data.target_kompetensi));
                setCatatan(res.data.catatan_persetujuan || '');
                setAlokasi(res.data.alokasi_dukungan_program || '');
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Detail');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeModal = () => setSelected(null);

    // Buka otomatis modal jika diakses dengan ?id= (mis. dari tombol Approval di list utama)
    useEffect(() => {
        const idParam = searchParams.get('id');
        if (idParam) {
            openModal({ id: Number(idParam) } as IdpAsn);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doAction = async (action: 'approve' | 'reject') => {
        if (!selected) return;
        const confirmMsg = action === 'approve'
            ? 'Setujui IDP ini? Status akan menjadi Disetujui dan tanggal approval otomatis tercatat.'
            : 'Tolak IDP ini? Status akan menjadi Ditolak dan tanggal approval otomatis tercatat.';
        const confirmed = await showConfirm(
            confirmMsg,
            action === 'approve' ? 'Setujui IDP' : 'Tolak IDP',
            action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak',
            'Batal'
        );
        if (!confirmed) return;
        setProcessing(true);
        try {
            if (action === 'approve') {
                await approveIdp(selected.id, catatan.trim(), alokasi.trim());
                showToast('IDP berhasil disetujui', 'success');
            } else {
                await rejectIdp(selected.id, catatan.trim(), alokasi.trim());
                showToast('IDP berhasil dikembalikan untuk revisi', 'warning');
            }
            closeModal();
            fetchData(page, search, statusFilter);
        } catch (error) {
            showError(handleApiError(error), action === 'approve' ? 'Gagal Menyetujui' : 'Gagal Menolak');
        } finally {
            setProcessing(false);
        }
    };

    const canApprove = selected?.status === 'verified';
    const stModal = selected ? (statusConfig[selected.status] || statusConfig.submitted) : statusConfig.submitted;

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
                            <p className="text-teal-100 text-sm">Persetujuan Individual Development Plan oleh kepala unit kerja</p>
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

            {/* Quick Pick Pegawai */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <User className="w-4 h-4 text-teal-600" />
                        Pilih Pegawai (Cepat)
                    </div>
                    <div className="flex-1 max-w-md">
                        <LazySearchSelect
                            fetchFn={fetchAsnOptions}
                            value={null}
                            onChange={handlePegawaiQuickSelect}
                            placeholder="Cari nama / NIP pegawai..."
                            searchPlaceholder="Ketik minimal 3 karakter..."
                            emptyText="Pegawai tidak ditemukan"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Pilih pegawai untuk langsung membuka IDP yang akan di-approval.</p>
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
                        <option value="verified">Diverifikasi</option>
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
                                                    ? 'Belum ada IDP yang diverifikasi untuk persetujuan'
                                                    : 'Coba ubah kata kunci pencarian atau filter Anda'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    idps.map((idp, idx) => {
                                        const st = statusConfig[idp.status] || statusConfig.submitted;
                                        return (
                                            <tr
                                                key={idp.id}
                                                onClick={() => openModal(idp)}
                                                className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                                            >
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
                                                    {idp.status === 'verified' ? (
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openModal(idp); }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                            >
                                                                <FileClock className="w-3.5 h-3.5" /> Approval
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right space-y-0.5">
                                                            {idp.status === 'submitted' && (
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">Menunggu verifikasi</p>
                                                            )}
                                                            {idp.status === 'approved' && (
                                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                                    Disetujui: {idp.approved_by || '-'}
                                                                    {idp.approved_at ? ` · ${new Date(idp.approved_at).toLocaleDateString('id-ID')}` : ''}
                                                                </p>
                                                            )}
                                                            {(idp.status === 'draft' || idp.status === 'rejected') && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Revisi: {idp.approved_by || idp.verified_by || '-'}
                                                                </p>
                                                            )}
                                                            {idp.verified_by && (
                                                                <p className="text-xs text-muted-foreground">Diverifikasi: {idp.verified_by}</p>
                                                            )}
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

            {/* Approval Modal */}
            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) closeModal(); }}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90dvh] grid grid-rows-[auto_minmax(0,1fr)_auto]">
                    {selected && (
                        <>
                            <DialogHeader className="px-6 pt-5 pb-4 text-left shrink-0 border-b border-border">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <DialogTitle>{selected.asn_nama}</DialogTitle>
                                            <DialogDescription>{selected.asn_nip} · {selected.asn_jabatan}</DialogDescription>
                                        </div>
                                    </div>
                                    <Badge className={`${stModal.className} border-0 text-xs font-medium`}>{stModal.label}</Badge>
                                </div>
                            </DialogHeader>

                            <div className="px-6 py-5 space-y-5 overflow-y-auto overscroll-contain min-h-0">
                                {detailLoading ? (
                                    <div className="h-40 bg-muted rounded-xl animate-pulse" />
                                ) : (
                                    <>
                                        {/* Info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Atasan Langsung</p>
                                                    <p className="text-card-foreground font-medium">{selected.atasan_langsung_nama || '-'}</p>
                                                    <p className="text-xs text-muted-foreground">{selected.atasan_langsung?.nama_jabatan || ''} {selected.atasan_langsung?.nm_opd ? `· ${selected.atasan_langsung.nm_opd}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Periode IDP</p>
                                                    <p className="text-card-foreground font-medium">{selected.periode_display}</p>
                                                    {selected.tanggal_pengajuan && (
                                                        <p className="text-xs text-muted-foreground">Tanggal Pengajuan: {selected.tanggal_pengajuan}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 sm:col-span-2">
                                                <FileClock className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Dasar Penyusunan IDP</p>
                                                    <p className="text-card-foreground whitespace-pre-wrap">{selected.dasar_penyusunan_idp || '-'}</p>
                                                </div>
                                            </div>
                                            {selected.catatan && (
                                                <div className="flex items-start gap-2 sm:col-span-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Catatan Pengajuan</p>
                                                        <p className="text-card-foreground whitespace-pre-wrap">{selected.catatan}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Tanggal Validasi Atasan (auto) */}
                                            <div className="flex items-start gap-2 sm:col-span-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3">
                                                <FileClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Tanggal Validasi Atasan</p>
                                                    <p className="text-sm text-card-foreground">{fmtDateTime(selected.verified_at)} {selected.verified_by ? `· ${selected.verified_by}` : ''}</p>
                                                </div>
                                            </div>
                                            {/* Tanggal Approval Kepala (auto, muncul setelah diproses) */}
                                            {selected.approved_at && (
                                                <div className="flex items-start gap-2 sm:col-span-2 bg-green-50 dark:bg-green-500/10 rounded-xl p-3">
                                                    <FileClock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-medium text-green-700 dark:text-green-300">Tanggal Approval Kepala Unit Kerja</p>
                                                        <p className="text-sm text-card-foreground">{fmtDateTime(selected.approved_at)} {selected.approved_by ? `· ${selected.approved_by}` : ''}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Target Kompetensi */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                                                    <TargetIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-card-foreground">Target Kompetensi</h2>
                                                    <p className="text-xs text-muted-foreground">Daftar kompetensi yang dikembangkan beserta rencana aksinya</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {targets.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">Belum ada target kompetensi.</p>
                                                ) : (
                                                    targets.map((item, index) => (
                                                        <div key={index} className="p-4 rounded-xl border border-border bg-muted/30">
                                                            <p className="text-sm font-medium text-foreground mb-2">Target Kompetensi {index + 1}</p>
                                                            {item._legacy ? (
                                                                <p className="text-sm text-foreground whitespace-pre-wrap">{item.deskripsi || '-'}</p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.jenis_kompetensi_nama && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300">
                                                                                {item.jenis_kompetensi_nama}
                                                                            </span>
                                                                        )}
                                                                        {item.nama_kompetensi_nama && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                                                {item.nama_kompetensi_nama}
                                                                            </span>
                                                                        )}
                                                                        {item.prioritas_pengembangan_nama && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                                                                                Prioritas: {item.prioritas_pengembangan_nama}
                                                                            </span>
                                                                        )}
                                                                        {item.unit_kerja_nama && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                                                                                Unit: {item.unit_kerja_nama}
                                                                            </span>
                                                                        )}
                                                                        {item.kompetensi_teknis_uraian && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300">
                                                                                Kompetensi Teknis: {item.kompetensi_teknis_uraian}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.deskripsi || '-'}</p>
                                                                    {item.justifikasi_pengembangan && (
                                                                        <div>
                                                                            <p className="text-xs font-medium text-muted-foreground mb-1">Justifikasi Pengembangan</p>
                                                                            <p className="text-sm text-foreground whitespace-pre-wrap">{item.justifikasi_pengembangan}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Level Saat Ini</p>
                                                                            <p className="text-sm font-semibold text-foreground">{item.level_saat_ini ?? '-'} / 5</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Level Diharapkan</p>
                                                                            <p className="text-sm font-semibold text-foreground">{item.level_diharapkan ?? '-'} / 5</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">GAP</p>
                                                                            <p className={`text-sm font-semibold ${item.gap !== undefined && item.gap > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                                                                {item.gap ?? '-'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pt-2 border-t border-border/60">
                                                                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                                            <ListChecks className="w-3.5 h-3.5" /> Rencana Aksi
                                                                        </p>
                                                                        {item.rencana_aksi && item.rencana_aksi.length > 0 ? (
                                                                            <ol className="space-y-2 list-decimal list-inside">
                                                                                {item.rencana_aksi.map((ra, ri) => (
                                                                                    <li key={ri} className="text-sm text-foreground">
                                                                                        <span className="whitespace-pre-wrap">{ra.nama_spesifik_kegiatan || ra.deskripsi}</span>
                                                                                        {ra.nama_kegiatan_program_nama && (
                                                                                            <span className="block text-xs font-medium text-primary mt-0.5">{ra.nama_kegiatan_program_nama}</span>
                                                                                        )}
                                                                                        {ra.tujuan_pembelajaran_uraian && (
                                                                                            <span className="block text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Tujuan: {ra.tujuan_pembelajaran_uraian}</span>
                                                                                        )}
                                                                                        {(ra.pilar_pengembangan_nama || ra.jenis_kegiatan_pengembangan_nama) && (
                                                                                            <span className="block text-xs text-muted-foreground mt-0.5">
                                                                                                {[ra.pilar_pengembangan_nama, ra.jenis_kegiatan_pengembangan_nama].filter(Boolean).join(' · ')}
                                                                                            </span>
                                                                                        )}
                                                                                        {(ra.penyelenggara_diusulkan || ra.durasi_value || ra.estimasi_biaya || ra.tanggal_mulai || ra.tanggal_selesai) && (
                                                                                            <span className="block text-xs text-muted-foreground mt-0.5">
                                                                                                {[
                                                                                                    ra.penyelenggara_diusulkan,
                                                                                                    ra.durasi_value ? `${ra.durasi_value} ${ra.durasi_satuan || ''}` : '',
                                                                                                    ra.estimasi_biaya,
                                                                                                    ra.tanggal_mulai ? `Mulai: ${ra.tanggal_mulai}` : '',
                                                                                                    ra.tanggal_selesai ? `Selesai: ${ra.tanggal_selesai}` : ''
                                                                                                ].filter(Boolean).join(' · ')}
                                                                                            </span>
                                                                                        )}
                                                                                    </li>
                                                                                ))}
                                                                            </ol>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground">Belum ada rencana aksi.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Catatan Persetujuan */}
                                        <div>
                                            <label className="text-sm font-medium text-foreground">Catatan atau masukan terkait IDP ini</label>
                                            <Textarea
                                                value={catatan}
                                                onChange={e => setCatatan(e.target.value)}
                                                placeholder="Tuliskan catatan, saran, atau masukan terkait IDP ini..."
                                                rows={3}
                                                className="border-border focus:border-teal-500 focus:ring-teal-500 mt-2"
                                            />
                                        </div>

                                        {/* Alokasi Dukungan Program */}
                                        <div>
                                            <label className="text-sm font-medium text-foreground">Alokasi Dukungan Program</label>
                                            <p className="text-xs text-muted-foreground mb-2">Alokasi dukungan program untuk pengembangan kompetensi ini</p>
                                            <Textarea
                                                value={alokasi}
                                                onChange={e => setAlokasi(e.target.value)}
                                                placeholder="Tuliskan alokasi dukungan program (anggaran, waktu, fasilitas, dll)..."
                                                rows={3}
                                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <DialogFooter className="px-6 py-4 border-t border-border sm:justify-end flex-col-reverse sm:flex-row gap-2">
                                {canApprove ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => doAction('reject')}
                                            disabled={processing || detailLoading}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white min-w-36"
                                        >
                                            {processing ? <XCircle className="w-4 h-4 animate-pulse" /> : <XCircle className="w-4 h-4" />}
                                            Tolak
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => doAction('approve')}
                                            disabled={processing || detailLoading}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white min-w-36"
                                        >
                                            {processing ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Setujui
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-right">
                                        IDP ini berstatus <span className="font-medium text-card-foreground ml-1">{stModal.label}</span>, sehingga tidak dapat diproses (hanya status &ldquo;Diverifikasi&rdquo; yang bisa diapprove/reject).
                                    </p>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
