'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, User, Calendar, CheckCircle2, XCircle, FileClock, Target as TargetIcon, Building2, ListChecks } from 'lucide-react';
import { getIdpDetail, verifyIdp, rejectVerifikasiIdp, type IdpAsn } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
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

export default function IdpVerifikasiDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [idp, setIdp] = useState<IdpAsn | null>(null);
    const [targets, setTargets] = useState<TargetKompetensiItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [catatan, setCatatan] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await getIdpDetail(id);
            if (res?.data) {
                setIdp(res.data);
                setTargets(parseTargetKompetensi(res.data.target_kompetensi));
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    const canVerify = idp?.status === 'submitted';

    const doAction = async (action: 'verify' | 'reject') => {
        if (!idp) return;
        const confirmMsg = action === 'verify'
            ? 'Teruskan IDP ini ke Kepala Unit Kerja (status menjadi Diverifikasi)?'
            : 'Kembalikan IDP ini untuk direvisi? Status akan menjadi Ditolak.';
        const confirmed = await showConfirm(
            confirmMsg,
            action === 'verify' ? 'Teruskan ke Kepala Unit Kerja' : 'Kembalikan (Revisi)',
            action === 'verify' ? 'Ya, Teruskan' : 'Ya, Kembalikan',
            'Batal'
        );
        if (!confirmed) return;

        const notes = catatan.trim() ? catatan.trim() : (idp.catatan || '');
        setProcessing(true);
        try {
            if (action === 'verify') {
                await verifyIdp(id, notes);
                showToast('IDP berhasil diteruskan ke Kepala Unit Kerja', 'success');
            } else {
                await rejectVerifikasiIdp(id, notes);
                showToast('IDP berhasil dikembalikan untuk revisi', 'warning');
            }
            router.push('/admin/dashboard/idp/verifikasi');
        } catch (error) {
            showError(handleApiError(error), action === 'verify' ? 'Gagal Meneruskan' : 'Gagal Mengembalikan');
        } finally {
            setProcessing(false);
        }
    };

    const st = idp ? (statusConfig[idp.status] || statusConfig.draft) : statusConfig.draft;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/admin/dashboard/idp/verifikasi')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-card-foreground">Verifikasi IDP ASN</h1>
                    <p className="text-sm text-muted-foreground">Verifikasi Individual Development Plan oleh atasan langsung</p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 bg-muted rounded-2xl animate-pulse" />
            ) : !idp ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                    IDP tidak ditemukan.
                </div>
            ) : (
                <>
                    {/* ASN Header */}
                    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">{idp.asn_nama}</p>
                                    <p className="text-xs text-muted-foreground">{idp.asn_nip} · {idp.asn_jabatan}</p>
                                    <p className="text-xs text-muted-foreground">{idp.asn_opd}</p>
                                </div>
                            </div>
                            <Badge className={`${st.className} border-0 text-xs font-medium`}>{st.label}</Badge>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Atasan Langsung</p>
                                <p className="text-card-foreground font-medium">{idp.atasan_langsung_nama || '-'}</p>
                                <p className="text-xs text-muted-foreground">{idp.atasan_langsung?.nama_jabatan || ''} {idp.atasan_langsung?.nm_opd ? `· ${idp.atasan_langsung.nm_opd}` : ''}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Periode IDP</p>
                                <p className="text-card-foreground font-medium">{idp.periode_display}</p>
                                {idp.tanggal_pengajuan && (
                                    <p className="text-xs text-muted-foreground">Tanggal Pengajuan: {idp.tanggal_pengajuan}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 sm:col-span-2">
                            <FileClock className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Dasar Penyusunan IDP</p>
                                <p className="text-card-foreground whitespace-pre-wrap">{idp.dasar_penyusunan_idp || '-'}</p>
                            </div>
                        </div>
                        {idp.catatan && (
                            <div className="flex items-start gap-2 sm:col-span-2">
                                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Catatan Pengajuan</p>
                                    <p className="text-card-foreground whitespace-pre-wrap">{idp.catatan}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Kompetensi */}
                    <div className="bg-card rounded-xl shadow-sm border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <TargetIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">Target Kompetensi</h2>
                                <p className="text-xs text-muted-foreground">Daftar kompetensi yang dikembangkan beserta rencana aksinya</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
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

                    {/* Catatan Verifikasi */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <label className="text-sm font-medium text-foreground">Catatan Verifikasi</label>
                        <p className="text-xs text-muted-foreground mb-2">Isi catatan verifikasi (opsional). Akan disimpan sebagai catatan IDP.</p>
                        <Textarea
                            value={catatan}
                            onChange={e => setCatatan(e.target.value)}
                            placeholder="Tuliskan catatan verifikasi, saran, atau alasan pengembalian..."
                            rows={4}
                            className="border-border focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                        {canVerify ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => doAction('reject')}
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white min-w-44"
                                >
                                    {processing ? <XCircle className="w-4 h-4 animate-pulse" /> : <XCircle className="w-4 h-4" />}
                                    Kembalikan (Revisi)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => doAction('verify')}
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white min-w-56"
                                >
                                    {processing ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Teruskan ke Kepala Unit Kerja
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileClock className="w-4 h-4" />
                                IDP ini berstatus <span className="font-medium text-card-foreground ml-1">{st.label}</span>, sehingga tidak dapat diverifikasi (hanya status &ldquo;Diajukan&rdquo; yang bisa diverifikasi).
                                {idp.verified_by && (
                                    <span className="ml-1">· Diverifikasi oleh {idp.verified_by}{idp.verified_at ? ` (${new Date(idp.verified_at).toLocaleString('id-ID')})` : ''}</span>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
