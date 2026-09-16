'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LazySearchSelect } from '@/components/ui/lazy-search-select';
import { SearchSelect } from '@/components/ui/search-select';
import { DatePicker } from '@/components/ui/date-picker';
import {
    ArrowLeft, Save, Loader2, FileText, User as UserIcon, Calendar as CalendarIcon,
    Plus, Trash2, Target as TargetIcon, Pencil, Send, History, Clock
} from 'lucide-react';

const revisionStatusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Diajukan',
    verified: 'Diverifikasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    '': '-',
};
const statusLabel = (s: string) => revisionStatusLabels[s] || s || '-';
import { getIdpDetail, updateIdp, submitIdp, getIdpRiwayat, getJenisKompetensiList, getNamaKompetensiList, getPrioritasPengembanganList, getPilarPengembanganList, getJenisKegiatanPengembanganList, getNamaKegiatanProgramList, type IdpAsn, type IdpRevisionLog, type JenisKompetensi, type NamaKompetensi, type PrioritasPengembangan, type PilarPengembangan, type JenisKegiatanPengembangan, type NamaKegiatanProgram } from '@/lib/api/idp';
import { simpegService, type UnitKerjaDesainOption } from '@/lib/services/simpeg.service';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';
import { usePermission } from '@/lib/hooks/usePermission';

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    verified: { label: 'Diverifikasi', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

interface RencanaAksiItem {
    // khusus target Teknis dgn kompetensi teknis dari desain pembelajaran unit
    tujuan_pembelajaran_id?: number;
    tujuan_pembelajaran_uraian?: string;
    pilar_pengembangan_id?: number;
    pilar_pengembangan_nama?: string;
    jenis_kegiatan_pengembangan_id?: number;
    jenis_kegiatan_pengembangan_nama?: string;
    nama_kegiatan_program_id?: number;
    nama_kegiatan_program_nama?: string;
    nama_spesifik_kegiatan?: string;
    penyelenggara_diusulkan?: string;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    durasi_value?: number;
    durasi_satuan?: string;
    estimasi_biaya?: string;
    sumber_daya_lain?: string;
    indikator_keberhasilan?: string;
    catatan_tambahan?: string;
    deskripsi?: string; // legacy (isi teks bebas lama)
}

interface TargetKompetensiItem {
    jenis_kompetensi_id?: number;
    jenis_kompetensi_nama?: string;
    nama_kompetensi_id?: number;
    nama_kompetensi_nama?: string;
    prioritas_pengembangan_id?: number;
    prioritas_pengembangan_nama?: string;
    justifikasi_pengembangan?: string;
    deskripsi: string;
    level_saat_ini?: number;
    level_diharapkan?: number;
    gap?: number;
    rencana_aksi?: RencanaAksiItem[];
    // khusus jenis Teknis: sumber dari desain pembelajaran unit kerja
    unit_kerja_id?: number;
    unit_kerja_nama?: string;
    kompetensi_teknis_id?: number;
    kompetensi_teknis_uraian?: string;
    _legacy?: boolean;
}

function parseTargetKompetensi(raw: string | null | undefined): TargetKompetensiItem[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((el): TargetKompetensiItem | null => {
                    if (el === null || el === undefined) return null;
                    if (typeof el === 'object') {
                        const obj = el as Record<string, unknown>;
                        const deskripsi = typeof obj.deskripsi === 'string' ? obj.deskripsi.trim() : '';
                        if (!deskripsi) return null;
                        return {
                            jenis_kompetensi_id: Number(obj.jenis_kompetensi_id) || undefined,
                            jenis_kompetensi_nama: typeof obj.jenis_kompetensi_nama === 'string' ? obj.jenis_kompetensi_nama : undefined,
                            nama_kompetensi_id: Number(obj.nama_kompetensi_id) || undefined,
                            nama_kompetensi_nama: typeof obj.nama_kompetensi_nama === 'string' ? obj.nama_kompetensi_nama : undefined,
                            prioritas_pengembangan_id: Number(obj.prioritas_pengembangan_id) || undefined,
                            prioritas_pengembangan_nama: typeof obj.prioritas_pengembangan_nama === 'string' ? obj.prioritas_pengembangan_nama : undefined,
                            justifikasi_pengembangan: typeof obj.justifikasi_pengembangan === 'string' ? obj.justifikasi_pengembangan : undefined,
                            unit_kerja_id: Number(obj.unit_kerja_id) || undefined,
                            unit_kerja_nama: typeof obj.unit_kerja_nama === 'string' ? obj.unit_kerja_nama : undefined,
                            kompetensi_teknis_id: Number(obj.kompetensi_teknis_id) || undefined,
                            kompetensi_teknis_uraian: typeof obj.kompetensi_teknis_uraian === 'string' ? obj.kompetensi_teknis_uraian : undefined,
                            rencana_aksi: Array.isArray(obj.rencana_aksi)
                                ? (obj.rencana_aksi as unknown[])
                                    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
                                    .map(r => ({
                                        tujuan_pembelajaran_id: Number(r.tujuan_pembelajaran_id) || undefined,
                                        tujuan_pembelajaran_uraian: typeof r.tujuan_pembelajaran_uraian === 'string' ? r.tujuan_pembelajaran_uraian.trim() : undefined,
                                        pilar_pengembangan_id: Number(r.pilar_pengembangan_id) || undefined,
                                        pilar_pengembangan_nama: typeof r.pilar_pengembangan_nama === 'string' ? r.pilar_pengembangan_nama : undefined,
                                        jenis_kegiatan_pengembangan_id: Number(r.jenis_kegiatan_pengembangan_id) || undefined,
                                         jenis_kegiatan_pengembangan_nama: typeof r.jenis_kegiatan_pengembangan_nama === 'string' ? r.jenis_kegiatan_pengembangan_nama : undefined,
                                        nama_kegiatan_program_id: Number(r.nama_kegiatan_program_id) || undefined,
                                        nama_kegiatan_program_nama: typeof r.nama_kegiatan_program_nama === 'string' ? r.nama_kegiatan_program_nama : undefined,
                                        nama_spesifik_kegiatan: typeof r.nama_spesifik_kegiatan === 'string' ? r.nama_spesifik_kegiatan.trim() : undefined,
                                        penyelenggara_diusulkan: typeof r.penyelenggara_diusulkan === 'string' ? r.penyelenggara_diusulkan.trim() : undefined,
                                        tanggal_mulai: typeof r.tanggal_mulai === 'string' ? r.tanggal_mulai : undefined,
                                        tanggal_selesai: typeof r.tanggal_selesai === 'string' ? r.tanggal_selesai : undefined,
                                        durasi_value: Number(r.durasi_value) || undefined,
                                        durasi_satuan: typeof r.durasi_satuan === 'string' ? r.durasi_satuan : undefined,
                                        estimasi_biaya: typeof r.estimasi_biaya === 'string' ? r.estimasi_biaya.trim() : undefined,
                                        sumber_daya_lain: typeof r.sumber_daya_lain === 'string' ? r.sumber_daya_lain.trim() : undefined,
                                        indikator_keberhasilan: typeof r.indikator_keberhasilan === 'string' ? r.indikator_keberhasilan.trim() : undefined,
                                        catatan_tambahan: typeof r.catatan_tambahan === 'string' ? r.catatan_tambahan.trim() : undefined,
                                        deskripsi: typeof r.deskripsi === 'string' ? r.deskripsi.trim() : undefined,
                                    }))
                                    .filter(r => (r.nama_spesifik_kegiatan || '').length > 0 || (r.deskripsi || '').length > 0)
                                : undefined,
                            deskripsi,
                            level_saat_ini: Number(obj.level_saat_ini) || undefined,
                            level_diharapkan: Number(obj.level_diharapkan) || undefined,
                            gap: obj.gap === undefined || obj.gap === null ? undefined : Number(obj.gap),
                        };
                    }
                    const text = String(el).trim();
                    return text ? { deskripsi: text, _legacy: true } : null;
                })
                .filter(Boolean) as TargetKompetensiItem[];
        }
        // Jika array berisi objek string (bukan dari state baru), fallback:
        return (parsed as unknown[])
            .map((el) => String(el).trim())
            .filter((s) => s !== '')
            .map((s) => ({ deskripsi: s, _legacy: true }));
    } catch {
        // fallback ke plain text
    }
    return raw.trim() ? [{ deskripsi: raw, _legacy: true }] : [];
}

function computeGap(levelDiharapkan?: number, levelSaatIni?: number): number | undefined {
    if (levelDiharapkan === undefined || levelSaatIni === undefined) return undefined;
    return levelDiharapkan - levelSaatIni;
}

interface NewTargetDraft {
    jenis_kompetensi_id?: number;
    nama_kompetensi_id?: number;
    prioritas_pengembangan_id?: number;
    justifikasi_pengembangan: string;
    deskripsi: string;
    level_saat_ini?: number;
    level_diharapkan?: number;
    // khusus jenis Teknis
    unit_kerja_id?: number;
    kompetensi_teknis_id?: number;
}

const EMPTY_DRAFT: NewTargetDraft = {
    jenis_kompetensi_id: undefined,
    nama_kompetensi_id: undefined,
    prioritas_pengembangan_id: undefined,
    justifikasi_pengembangan: '',
    deskripsi: '',
    level_saat_ini: undefined,
    level_diharapkan: undefined,
    unit_kerja_id: undefined,
    kompetensi_teknis_id: undefined,
};

export default function EditIdpPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params.id);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [idp, setIdp] = useState<IdpAsn | null>(null);
    const [formData, setFormData] = useState({
        asn_id: null as number | null,
        atasan_langsung_id: null as number | null,
        periode_dari: null as string | null,
        periode_sampai: null as string | null,
        dasar_penyusunan_idp: '',
        tanggal_pengajuan: null as string | null,
    });
    const [targetKompetensi, setTargetKompetensi] = useState<TargetKompetensiItem[]>([]);
    const [riwayat, setRiwayat] = useState<IdpRevisionLog[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<NewTargetDraft>({ ...EMPTY_DRAFT });
    const [jenisList, setJenisList] = useState<JenisKompetensi[]>([]);
    const [namaList, setNamaList] = useState<NamaKompetensi[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [priorList, setPriorList] = useState<PrioritasPengembangan[]>([]);
    const [rencanaModalOpen, setRencanaModalOpen] = useState(false);
    const [rencanaIndex, setRencanaIndex] = useState<number | null>(null);
    const [rencanaDraft, setRencanaDraft] = useState<{ tujuan_pembelajaran_id?: number; pilar_pengembangan_id?: number; jenis_kegiatan_pengembangan_id?: number; nama_kegiatan_program_id?: number; nama_spesifik_kegiatan: string; penyelenggara_diusulkan: string; tanggal_mulai: string; tanggal_selesai: string; durasi_value: string; durasi_satuan: string; estimasi_biaya: string; sumber_daya_lain: string; indikator_keberhasilan: string; catatan_tambahan: string }>({ nama_spesifik_kegiatan: '', penyelenggara_diusulkan: '', tanggal_mulai: '', tanggal_selesai: '', durasi_value: '', durasi_satuan: '', estimasi_biaya: '', sumber_daya_lain: '', indikator_keberhasilan: '', catatan_tambahan: '' });
    const [rencanaPilarList, setRencanaPilarList] = useState<PilarPengembangan[]>([]);
    const [rencanaJenisList, setRencanaJenisList] = useState<JenisKegiatanPengembangan[]>([]);
    const [rencanaNamaKegiatanList, setRencanaNamaKegiatanList] = useState<NamaKegiatanProgram[]>([]);
    const [loadingRencanaOptions, setLoadingRencanaOptions] = useState(false);
    const [loadingNamaKegiatan, setLoadingNamaKegiatan] = useState(false);
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('idp', 'create', 'idp_asn');
    const canEdit = hasPermission('idp', 'edit', 'idp_asn');
    const canDelete = hasPermission('idp', 'delete', 'idp_asn');

    // ── Opsi unit kerja + kompetensi teknis (dari desain pembelajaran) ──
    const [desainOptions, setDesainOptions] = useState<UnitKerjaDesainOption[]>([]);
    const [loadingDesainOptions, setLoadingDesainOptions] = useState(false);
    const desainLoadedRef = useRef(false);

    useEffect(() => {
        if (!modalOpen || desainLoadedRef.current) return;
        desainLoadedRef.current = true;
        setLoadingDesainOptions(true);
        simpegService.getUnitKerjaDesainOptions()
            .then(res => setDesainOptions(res.data || []))
            .catch(() => { desainLoadedRef.current = false; })
            .finally(() => setLoadingDesainOptions(false));
    }, [modalOpen]);

    const selectedJenisNama = jenisList.find(j => j.id === draft.jenis_kompetensi_id)?.nama || '';
    const isJenisTeknis = /teknis/i.test(selectedJenisNama) && !/non-?teknis/i.test(selectedJenisNama);
    const selectedDesainUnit = useMemo(
        () => desainOptions.find(o => o.id_opd === draft.unit_kerja_id),
        [desainOptions, draft.unit_kerja_id]
    );

    // tujuan pembelajaran tersedia utk rencana aksi: dari kompetensi teknis
    // yang dipilih pada target (sumber: desain pembelajaran unit kerja)
    const rencanaTujuanOptions = useMemo(() => {
        if (rencanaIndex === null) return [] as { value: number; label: string }[];
        const t = targetKompetensi[rencanaIndex];
        if (!t?.unit_kerja_id || !t?.kompetensi_teknis_id) return [];
        const unit = desainOptions.find(u => u.id_opd === t.unit_kerja_id);
        const komp = unit?.kompetensi.find(k => k.id === t.kompetensi_teknis_id);
        return (komp?.tujuan || []).map(tj => ({ value: tj.id, label: tj.uraian }));
    }, [rencanaIndex, targetKompetensi, desainOptions]);

    // opsi unit kerja hierarkis utk SearchSelect, gaya kategori-learning:
    // indentasi per level + prefix └────
    const flatUnitOptions = useMemo(() => {
        return desainOptions.map(opt => {
            const ancestors = (opt.path_names || [])
                .filter(n => n && !/^PEMERINTAH KABUPATEN/i.test(n) && !/^TAHUN\s/i.test(n));
            const depth = Math.max(0, ancestors.length - 1);
            const indent = '\u00A0'.repeat(4 * depth);
            const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${opt.nm_opd}` : opt.nm_opd;
            return { value: opt.id_opd, label };
        });
    }, [desainOptions]);

    const handleAddTarget = () => {
        const deskripsi = draft.deskripsi.trim();
        if (!deskripsi || !draft.jenis_kompetensi_id || !draft.nama_kompetensi_id) return;
        if (isJenisTeknis && (!draft.unit_kerja_id || !draft.kompetensi_teknis_id)) return;
        const selKomp = selectedDesainUnit?.kompetensi.find(k => k.id === draft.kompetensi_teknis_id);
        const item: TargetKompetensiItem = {
            jenis_kompetensi_id: draft.jenis_kompetensi_id,
            jenis_kompetensi_nama: jenisList.find(j => j.id === draft.jenis_kompetensi_id)?.nama || '',
            nama_kompetensi_id: draft.nama_kompetensi_id,
            nama_kompetensi_nama: namaList.find(n => n.id === draft.nama_kompetensi_id)?.nama || '',
            prioritas_pengembangan_id: draft.prioritas_pengembangan_id,
            prioritas_pengembangan_nama: priorList.find(p => p.id === draft.prioritas_pengembangan_id)?.tingkat_prioritas || '',
            justifikasi_pengembangan: draft.justifikasi_pengembangan,
            deskripsi,
            level_saat_ini: draft.level_saat_ini,
            level_diharapkan: draft.level_diharapkan,
            gap: computeGap(draft.level_diharapkan, draft.level_saat_ini),
            unit_kerja_id: isJenisTeknis ? draft.unit_kerja_id : undefined,
            unit_kerja_nama: isJenisTeknis ? selectedDesainUnit?.nm_opd : undefined,
            kompetensi_teknis_id: isJenisTeknis ? draft.kompetensi_teknis_id : undefined,
            kompetensi_teknis_uraian: isJenisTeknis ? selKomp?.uraian : undefined,
        };
        if (editingIndex !== null) {
            setTargetKompetensi(prev => prev.map((t, i) => (i === editingIndex ? item : t)));
        } else {
            setTargetKompetensi(prev => [...prev, item]);
        }
        setEditingIndex(null);
        setDraft({ ...EMPTY_DRAFT });
        setModalOpen(false);
    };

    const openEditTarget = (index: number) => {
        const t = targetKompetensi[index];
        if (!t || t._legacy) return;
        setEditingIndex(index);
        setDraft({
            jenis_kompetensi_id: t.jenis_kompetensi_id,
            nama_kompetensi_id: t.nama_kompetensi_id,
            prioritas_pengembangan_id: t.prioritas_pengembangan_id,
            justifikasi_pengembangan: t.justifikasi_pengembangan || '',
            deskripsi: t.deskripsi || '',
            level_saat_ini: t.level_saat_ini,
            level_diharapkan: t.level_diharapkan,
            unit_kerja_id: t.unit_kerja_id,
            kompetensi_teknis_id: t.kompetensi_teknis_id,
        });
        setModalOpen(true);
    };

    const openRencanaModal = (index: number) => {
        setRencanaIndex(index);
        setRencanaDraft({ tujuan_pembelajaran_id: undefined, nama_spesifik_kegiatan: '', penyelenggara_diusulkan: '', tanggal_mulai: '', tanggal_selesai: '', durasi_value: '', durasi_satuan: '', estimasi_biaya: '', sumber_daya_lain: '', indikator_keberhasilan: '', catatan_tambahan: '' });
        setRencanaJenisList([]);
        setRencanaNamaKegiatanList([]);
        setRencanaModalOpen(true);
    };

    const addRencanaAksi = () => {
        if (rencanaIndex === null) return;
        const pilar = rencanaPilarList.find(p => p.id === rencanaDraft.pilar_pengembangan_id);
        const jenis = rencanaJenisList.find(j => j.id === rencanaDraft.jenis_kegiatan_pengembangan_id);
        const kegiatan = rencanaNamaKegiatanList.find(k => k.id === rencanaDraft.nama_kegiatan_program_id);
        const nama = (rencanaDraft.nama_spesifik_kegiatan || '').trim();
        if (!pilar || !jenis || !nama) return;
        const durasiNum = parseInt(rencanaDraft.durasi_value, 10);
        const item: RencanaAksiItem = {
            tujuan_pembelajaran_id: rencanaDraft.tujuan_pembelajaran_id,
            tujuan_pembelajaran_uraian: rencanaTujuanOptions.find(o => o.value === rencanaDraft.tujuan_pembelajaran_id)?.label || undefined,
            pilar_pengembangan_id: pilar.id,
            pilar_pengembangan_nama: pilar.nama,
            jenis_kegiatan_pengembangan_id: jenis.id,
            jenis_kegiatan_pengembangan_nama: jenis.nama,
            nama_kegiatan_program_id: kegiatan?.id,
            nama_kegiatan_program_nama: kegiatan?.nama,
            nama_spesifik_kegiatan: nama,
            penyelenggara_diusulkan: (rencanaDraft.penyelenggara_diusulkan || '').trim() || undefined,
            tanggal_mulai: rencanaDraft.tanggal_mulai || undefined,
            tanggal_selesai: rencanaDraft.tanggal_selesai || undefined,
            durasi_value: Number.isNaN(durasiNum) ? undefined : durasiNum,
            durasi_satuan: (rencanaDraft.durasi_satuan || '').trim() || undefined,
            estimasi_biaya: (rencanaDraft.estimasi_biaya || '').trim() || undefined,
            sumber_daya_lain: (rencanaDraft.sumber_daya_lain || '').trim() || undefined,
            indikator_keberhasilan: (rencanaDraft.indikator_keberhasilan || '').trim() || undefined,
            catatan_tambahan: (rencanaDraft.catatan_tambahan || '').trim() || undefined,
        };
        setTargetKompetensi(prev => prev.map((t, i) => {
            if (i !== rencanaIndex) return t;
            const rencanaAksi = [...(t.rencana_aksi || []), item];
            return { ...t, rencana_aksi: rencanaAksi };
        }));
        setRencanaDraft(prev => ({ tujuan_pembelajaran_id: prev.tujuan_pembelajaran_id, pilar_pengembangan_id: prev.pilar_pengembangan_id, jenis_kegiatan_pengembangan_id: prev.jenis_kegiatan_pengembangan_id, nama_kegiatan_program_id: undefined, nama_spesifik_kegiatan: '', penyelenggara_diusulkan: '', tanggal_mulai: '', tanggal_selesai: '', durasi_value: '', durasi_satuan: '', estimasi_biaya: '', sumber_daya_lain: '', indikator_keberhasilan: '', catatan_tambahan: '' }));
    };

    const removeRencanaAksi = (rencanaIdx: number) => {
        if (rencanaIndex === null) return;
        setTargetKompetensi(prev => prev.map((t, i) => {
            if (i !== rencanaIndex) return t;
            const rencanaAksi = (t.rencana_aksi || []).filter((_, ri) => ri !== rencanaIdx);
            return { ...t, rencana_aksi: rencanaAksi };
        }));
    };

    const loadIdp = useCallback(async () => {
        const res = await getIdpDetail(id);
        const d = res.data;
        setIdp(d);
        setFormData({
            asn_id: d.asn_id,
            atasan_langsung_id: d.atasan_langsung_id,
            periode_dari: d.periode_dari || null,
            periode_sampai: d.periode_sampai || null,
            dasar_penyusunan_idp: d.dasar_penyusunan_idp || '',
            tanggal_pengajuan: d.tanggal_pengajuan || null,
        });
        setTargetKompetensi(parseTargetKompetensi(d.target_kompetensi));
        try {
            const rh = await getIdpRiwayat(id);
            if (rh?.data) setRiwayat(rh.data);
        } catch { /* abaikan jika gagal memuat riwayat */ }
        return d;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await getIdpDetail(id);
                const d = res.data;
                setIdp(d);
                setFormData({
                    asn_id: d.asn_id,
                    atasan_langsung_id: d.atasan_langsung_id,
                    periode_dari: d.periode_dari || null,
                    periode_sampai: d.periode_sampai || null,
                    dasar_penyusunan_idp: d.dasar_penyusunan_idp || '',
                    tanggal_pengajuan: d.tanggal_pengajuan || null,
                });
                setTargetKompetensi(parseTargetKompetensi(d.target_kompetensi));
            } catch (error) {
                showError(handleApiError(error), 'Gagal Memuat IDP');
                router.push('/admin/dashboard/idp');
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                const res = await getJenisKompetensiList({ per_page: 100, is_active: 'true' });
                setJenisList((res.data || []).filter(j => j.is_active));
            } catch {
                setJenisList([]);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getPrioritasPengembanganList({ per_page: 100, is_active: 'true' });
                setPriorList((res.data || []).filter(p => p.is_active));
            } catch {
                setPriorList([]);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getPilarPengembanganList({ per_page: 100, is_active: 'true' });
                setRencanaPilarList((res.data || []).filter(p => p.is_active));
            } catch {
                setRencanaPilarList([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!rencanaDraft.pilar_pengembangan_id) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoadingRencanaOptions(true);
        (async () => {
            try {
                const res = await getJenisKegiatanPengembanganList({ per_page: 100, is_active: 'true', pilar_pengembangan_id: rencanaDraft.pilar_pengembangan_id });
                setRencanaJenisList((res.data || []).filter(j => j.is_active));
            } catch {
                setRencanaJenisList([]);
            } finally {
                setLoadingRencanaOptions(false);
            }
        })();
    }, [rencanaDraft.pilar_pengembangan_id]);

    useEffect(() => {
        if (!rencanaDraft.jenis_kegiatan_pengembangan_id) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRencanaNamaKegiatanList([]);
        setLoadingNamaKegiatan(true);
        (async () => {
            try {
                const res = await getNamaKegiatanProgramList({ per_page: 100, is_active: 'true', bentuk_pengembangan_id: rencanaDraft.jenis_kegiatan_pengembangan_id });
                setRencanaNamaKegiatanList((res.data || []).filter(k => k.is_active));
            } catch {
                setRencanaNamaKegiatanList([]);
            } finally {
                setLoadingNamaKegiatan(false);
            }
        })();
    }, [rencanaDraft.jenis_kegiatan_pengembangan_id]);

    useEffect(() => {
        if (!draft.jenis_kompetensi_id) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoadingOptions(true);
        (async () => {
            try {
                const res = await getNamaKompetensiList({ per_page: 100, is_active: 'true', jenis_kompetensi_id: draft.jenis_kompetensi_id });
                setNamaList((res.data || []).filter(n => n.is_active));
            } catch {
                setNamaList([]);
            } finally {
                setLoadingOptions(false);
            }
        })();
    }, [draft.jenis_kompetensi_id]);

    const fetchAsnOptions = useCallback(async (query: string) => {
        const res = await simpegService.getPegawaiList({ search: query, per_page: 20 });
        return res.data.map(p => ({
            value: p.id,
            label: `${p.nama_pegawai} (${p.nip_baru || p.nip_lama || '-'}) - ${p.nama_jabatan || ''} - ${p.nm_opd || ''}`,
        }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.asn_id) {
            showError('Silakan pilih ASN terlebih dahulu', 'Validasi');
            return;
        }
        setSaving(true);
        try {
            await updateIdp(id, {
                asn_id: formData.asn_id,
                atasan_langsung_id: formData.atasan_langsung_id,
                periode_dari: formData.periode_dari,
                periode_sampai: formData.periode_sampai,
                dasar_penyusunan_idp: formData.dasar_penyusunan_idp,
                tanggal_pengajuan: formData.tanggal_pengajuan,
                target_kompetensi: JSON.stringify(targetKompetensi),
            });
            await loadIdp();
            showToast('IDP berhasil diperbarui!', 'success');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyimpan IDP');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitToAtasan = async () => {
        const confirmed = await showConfirm(
            'Kirim IDP ini ke atasan untuk diverifikasi? Status akan berubah dari Draft menjadi menunggu verifikasi.',
            'Kirim ke Atasan',
            'Ya, Kirim',
            'Batal'
        );
        if (!confirmed) return;
        if (!formData.asn_id) {
            showError('Silakan pilih ASN terlebih dahulu', 'Validasi');
            return;
        }
        setSaving(true);
        try {
            // Simpan dulu perubahan terbaru, lalu kirim ke atasan
            await updateIdp(id, {
                asn_id: formData.asn_id,
                atasan_langsung_id: formData.atasan_langsung_id,
                periode_dari: formData.periode_dari,
                periode_sampai: formData.periode_sampai,
                dasar_penyusunan_idp: formData.dasar_penyusunan_idp,
                tanggal_pengajuan: formData.tanggal_pengajuan,
                target_kompetensi: JSON.stringify(targetKompetensi),
            });
            await submitIdp(id, idp?.catatan || '');
            showToast('IDP berhasil dikirim ke atasan', 'success');
            router.push('/admin/dashboard/idp');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Mengirim IDP');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-muted rounded-2xl animate-pulse" />
                <div className="h-64 bg-muted rounded-xl animate-pulse" />
                <div className="h-40 bg-muted rounded-xl animate-pulse" />
            </div>
        );
    }

    const st = statusConfig[idp?.status || 'draft'] || statusConfig.draft;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        disabled={saving}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">Edit IDP ASN</h1>
                        <p className="text-teal-100 text-sm">
                            {idp ? `${idp.asn_nama} (${idp.asn_nip || '-'})` : 'Perbarui Individual Development Plan'}
                        </p>
                    </div>
                    <Badge className={`${st.className} border-0 text-xs font-medium`}>
                        {st.label}
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pegawai */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">Pegawai</h2>
                            <p className="text-xs text-muted-foreground">Pilih ASN dan atasan langsung yang terkait</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Pilih ASN <span className="text-red-500">*</span>
                            </Label>
                            <LazySearchSelect
                                fetchFn={fetchAsnOptions}
                                value={formData.asn_id}
                                onChange={(v) => setFormData(prev => ({ ...prev, asn_id: v !== null ? Number(v) : null }))}
                                placeholder={idp ? `${idp.asn_nama} (${idp.asn_nip || '-'})` : 'Cari ASN...'}
                                defaultLabel={idp ? `${idp.asn_nama} (${idp.asn_nip || '-'})` : undefined}
                                searchPlaceholder="Ketik minimal 3 karakter untuk mencari ASN..."
                                minChars={3}
                            />
                            {idp && (
                                <p className="text-xs text-muted-foreground">
                                    Saat ini: {idp.asn_nama} · {idp.asn_jabatan || '-'} · {idp.asn_opd || '-'}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Pilih Atasan Langsung
                            </Label>
                            <LazySearchSelect
                                fetchFn={fetchAsnOptions}
                                value={formData.atasan_langsung_id}
                                onChange={(v) => setFormData(prev => ({ ...prev, atasan_langsung_id: v !== null ? Number(v) : null }))}
                                placeholder="Cari atasan langsung..."
                                defaultLabel={idp?.atasan_langsung_nama
                                    ? `${idp.atasan_langsung_nama} (${idp.atasan_langsung?.nip || '-'})`
                                    : undefined}
                                searchPlaceholder="Ketik minimal 3 karakter untuk mencari atasan..."
                                minChars={3}
                            />
                            {idp?.atasan_langsung_nama && (
                                <p className="text-xs text-muted-foreground">
                                    Atasan saat ini: {idp.atasan_langsung_nama} · {idp.atasan_langsung?.nama_jabatan || '-'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Periode IDP */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">Periode IDP</h2>
                            <p className="text-xs text-muted-foreground">Tentukan periode berlakunya IDP</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="periode_dari" className="text-sm font-medium text-foreground">
                                    Periode IDP - Dari <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.periode_dari}
                                    onChange={(v) => setFormData(prev => ({ ...prev, periode_dari: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="periode_sampai" className="text-sm font-medium text-foreground">
                                    Periode IDP - Sampai <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.periode_sampai}
                                    onChange={(v) => setFormData(prev => ({ ...prev, periode_sampai: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_pengajuan" className="text-sm font-medium text-foreground">
                                    Tanggal Pengajuan IDP
                                </Label>
                                <DatePicker
                                    value={formData.tanggal_pengajuan}
                                    onChange={(v) => setFormData(prev => ({ ...prev, tanggal_pengajuan: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Konten IDP */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">Konten IDP</h2>
                            <p className="text-xs text-muted-foreground">Isi dasar penyusunan IDP</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-2">
                            <Label htmlFor="dasar_penyusunan_idp" className="text-sm font-medium text-foreground">
                                Dasar Penyusunan IDP
                            </Label>
                            <p className="text-xs text-muted-foreground">Jabatan dasar atau alasan penyusunan IDP ini</p>
                            <Textarea
                                id="dasar_penyusunan_idp" name="dasar_penyusunan_idp"
                                value={formData.dasar_penyusunan_idp} onChange={handleChange}
                                placeholder="Tuliskan dasar atau acuan dalam penyusunan IDP ini..."
                                rows={5}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Target Kompetensi */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                            <TargetIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-card-foreground">Target Kompetensi</h2>
                            <p className="text-xs text-muted-foreground">Tambahkan target kompetensi yang ingin dikembangkan</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingIndex(null);
                                setDraft({ ...EMPTY_DRAFT });
                                setModalOpen(true);
                            }}
                            disabled={!canCreate}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                    <div className="p-6">
                        {targetKompetensi.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{'Belum ada target kompetensi. Klik tombol "Tambah" untuk menambahkan.'}</p>
                        ) : (
                            <div className="space-y-4">
                                {targetKompetensi.map((item, index) => (
                                    <div key={index} className="p-4 rounded-xl border border-border bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium text-foreground">
                                                Target Kompetensi {index + 1}
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                {canEdit && !item._legacy && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditTarget(index)}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTargetKompetensi(prev => prev.filter((_, i) => i !== index))}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Justifikasi Pengembangan Kompetensi</p>
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
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Rencana Aksi</p>
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openRencanaModal(index)}
                                                                className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Tambah Rencana Aksi
                                                            </button>
                                                        )}
                                                    </div>
                                                    {item.rencana_aksi && item.rencana_aksi.length > 0 ? (
                                                        <ol className="space-y-2 list-decimal list-inside">
                                                            {item.rencana_aksi.map((ra, ri) => (
                                                                <li key={ri} className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm text-foreground whitespace-pre-wrap">{ra.nama_spesifik_kegiatan || ra.deskripsi}</p>
                                                                        {ra.nama_kegiatan_program_id && ra.nama_kegiatan_program_nama && (
                                                                            <p className="text-xs font-medium text-primary mt-0.5">{ra.nama_kegiatan_program_nama}</p>
                                                                        )}
                                                                        {ra.tujuan_pembelajaran_uraian && (
                                                                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Tujuan: {ra.tujuan_pembelajaran_uraian}</p>
                                                                        )}
                                                                        {(ra.jenis_kegiatan_pengembangan_nama || ra.pilar_pengembangan_nama) && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                {[ra.pilar_pengembangan_nama, ra.jenis_kegiatan_pengembangan_nama].filter(Boolean).join(' · ')}
                                                                            </p>
                                                                        )}
                                                                        {(ra.penyelenggara_diusulkan || ra.tanggal_mulai || ra.tanggal_selesai) && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                {[ra.penyelenggara_diusulkan, ra.durasi_value ? `${ra.durasi_value} ${ra.durasi_satuan || ''}` : '', ra.estimasi_biaya, ra.tanggal_mulai ? `Mulai: ${ra.tanggal_mulai}` : '', ra.tanggal_selesai ? `Selesai: ${ra.tanggal_selesai}` : ''].filter(Boolean).join(' · ')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {canEdit && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeRencanaAksi(ri)}
                                                                            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
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
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Riwayat Revisi */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-500/10 flex items-center justify-center">
                            <History className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">Riwayat Revisi</h2>
                            <p className="text-xs text-muted-foreground">Log setiap perubahan status & catatan pada IDP ini</p>
                        </div>
                    </div>
                    <div className="p-6">
                        {riwayat.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada riwayat revisi.</p>
                        ) : (
                            <ol className="relative border-l border-border ml-2 space-y-5">
                                {riwayat.map((r) => (
                                    <li key={r.id} className="ml-4">
                                        <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-card" />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-card-foreground">
                                                {statusLabel(r.from_status)} &rarr; {statusLabel(r.to_status)}
                                            </span>
                                            {r.actor && (
                                                <span className="text-xs text-muted-foreground">oleh {r.actor}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            {r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '-'}
                                        </p>
                                        {r.catatan && (
                                            <p className="text-sm text-foreground mt-1 bg-muted/40 rounded-lg px-3 py-2 whitespace-pre-wrap">
                                                {r.catatan}
                                            </p>
                                        )}
                                        {r.alokasi_dukungan_program && (
                                            <p className="text-sm text-foreground mt-1 bg-muted/40 rounded-lg px-3 py-2 whitespace-pre-wrap">
                                                <span className="font-medium text-muted-foreground">Alokasi Dukungan: </span>
                                                {r.alokasi_dukungan_program}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t border-border">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                    >
                        Batal
                    </button>
                    {idp?.status === 'draft' && (
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Simpan Perubahan</>
                            )}
                        </button>
                    )}
                    {idp?.status === 'draft' && (
                        <button
                            type="button"
                            onClick={handleSubmitToAtasan}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors min-w-44"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Kirim ke Atasan
                        </button>
                    )}
                </div>
            </form>

            {/* Modal Tambah Target Kompetensi */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
                    <DialogHeader className="px-6 pt-5 pb-0 text-left shrink-0">
                        <DialogTitle>{editingIndex !== null ? 'Edit Target Kompetensi' : 'Tambah Target Kompetensi'}</DialogTitle>
                        <DialogDescription>Masukkan kompetensi yang ingin dikembangkan beserta levelnya</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4 overflow-y-auto overscroll-contain min-h-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="jenis_kompetensi_baru" className="text-sm font-medium text-foreground">
                                    Jenis Kompetensi <span className="text-red-500">*</span>
                                </Label>
                                <SearchSelect
                                    options={jenisList.map(j => ({ value: j.id, label: j.nama }))}
                                    value={draft.jenis_kompetensi_id ?? null}
                                    onChange={(val) => {
                                        const v = val ? Number(val) : undefined;
                                        setNamaList([]);
                                        setDraft(prev => ({ ...prev, jenis_kompetensi_id: v, nama_kompetensi_id: undefined, unit_kerja_id: undefined, kompetensi_teknis_id: undefined }));
                                    }}
                                    placeholder="Pilih Jenis Kompetensi..."
                                    emptyText="Tidak ada jenis kompetensi"
                                />
                                <p className="text-xs text-muted-foreground">Pilih jenis kompetensi (Teknis, Manajerial, Sosial Kultural, dll)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama_kompetensi_baru" className="text-sm font-medium text-foreground">
                                    Nama Kompetensi <span className="text-red-500">*</span>
                                </Label>
                                <SearchSelect
                                    options={namaList.map(n => ({ value: n.id, label: n.nama }))}
                                    value={draft.nama_kompetensi_id ?? null}
                                    onChange={(val) => setDraft(prev => ({ ...prev, nama_kompetensi_id: val ? Number(val) : undefined }))}
                                    placeholder={!draft.jenis_kompetensi_id ? 'Pilih jenis dulu' : loadingOptions ? 'Memuat...' : 'Pilih Nama Kompetensi...'}
                                    emptyText="Tidak ada nama kompetensi"
                                    disabled={!draft.jenis_kompetensi_id || loadingOptions}
                                />
                                <p className="text-xs text-muted-foreground">Pilih nama kompetensi terkait jenis di atas</p>
                            </div>
                        </div>
                        {isJenisTeknis && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">
                                        Unit Kerja (Desain Pembelajaran) <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchSelect
                                        options={flatUnitOptions}
                                        value={draft.unit_kerja_id ?? null}
                                        onChange={(val) => setDraft(prev => ({ ...prev, unit_kerja_id: val ? Number(val) : undefined, kompetensi_teknis_id: undefined }))}
                                        placeholder={loadingDesainOptions ? 'Memuat...' : 'Cari & pilih unit kerja...'}
                                        emptyText="Belum ada unit dengan desain pembelajaran"
                                        disabled={loadingDesainOptions}
                                    />
                                    <p className="text-xs text-muted-foreground">Hanya unit yang sudah punya kompetensi teknis di desain pembelajarannya</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">
                                        Kompetensi Teknis <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchSelect
                                        options={(selectedDesainUnit?.kompetensi || []).map(k => ({ value: k.id, label: k.uraian }))}
                                        value={draft.kompetensi_teknis_id ?? null}
                                        onChange={(val) => setDraft(prev => ({ ...prev, kompetensi_teknis_id: val ? Number(val) : undefined }))}
                                        placeholder={!draft.unit_kerja_id ? 'Pilih unit kerja dulu' : 'Cari & pilih kompetensi teknis...'}
                                        emptyText="Unit ini belum punya kompetensi teknis"
                                        disabled={!draft.unit_kerja_id}
                                    />
                                    <p className="text-xs text-muted-foreground">Daftar dari desain pembelajaran unit kerja terpilih</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="deskripsi_singkat_baru" className="text-sm font-medium text-foreground">
                                Deskripsi Singkat Kompetensi <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="deskripsi_singkat_baru"
                                value={draft.deskripsi}
                                onChange={(e) => setDraft(prev => ({ ...prev, deskripsi: e.target.value }))}
                                placeholder="Tuliskan deskripsi singkat kompetensi yang ingin dikembangkan..."
                                rows={3}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                            <p className="text-xs text-muted-foreground">Penjelasan singkat mengenai kompetensi tersebut</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="level_saat_ini_baru" className="text-sm font-medium text-foreground">
                                    Level Kompetensi Saat Ini (1-5) <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    id="level_saat_ini_baru"
                                    type="number" min={1} max={5}
                                    value={draft.level_saat_ini ?? ''}
                                    onChange={(e) => setDraft(prev => ({ ...prev, level_saat_ini: e.target.value ? Math.min(5, Math.max(1, Number(e.target.value))) : undefined }))}
                                    placeholder="1-5"
                                    className="w-full px-3 py-2.5 border border-border bg-card rounded-xl text-sm text-foreground focus:border-teal-500 focus:ring-teal-500"
                                />
                                <p className="text-xs text-muted-foreground">Penilaian level penguasaan kompetensi ASN saat ini</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level_diharapkan_baru" className="text-sm font-medium text-foreground">
                                    Level Kompetensi Diharapkan (1-5) <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    id="level_diharapkan_baru"
                                    type="number" min={1} max={5}
                                    value={draft.level_diharapkan ?? ''}
                                    onChange={(e) => setDraft(prev => ({ ...prev, level_diharapkan: e.target.value ? Math.min(5, Math.max(1, Number(e.target.value))) : undefined }))}
                                    placeholder="1-5"
                                    className="w-full px-3 py-2.5 border border-border bg-card rounded-xl text-sm text-foreground focus:border-teal-500 focus:ring-teal-500"
                                />
                                <p className="text-xs text-muted-foreground">Target level penguasaan kompetensi setelah periode IDP</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">Kesenjangan Kompetensi (GAP)</Label>
                                <div className="w-full px-3 py-2.5 border border-border bg-muted/30 rounded-xl text-sm font-semibold text-foreground">
                                    {computeGap(draft.level_diharapkan, draft.level_saat_ini) ?? '-'}
                                </div>
                                <p className="text-xs text-muted-foreground">Selisih antara level yang diharapkan dengan level saat ini (dihitung otomatis)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prioritas_pengembangan_baru" className="text-sm font-medium text-foreground">
                                    Prioritas Pengembangan <span className="text-red-500">*</span>
                                </Label>
                                <SearchSelect
                                    options={priorList.map(p => ({ value: p.id, label: p.tingkat_prioritas }))}
                                    value={draft.prioritas_pengembangan_id ?? null}
                                    onChange={(val) => setDraft(prev => ({ ...prev, prioritas_pengembangan_id: val ? Number(val) : undefined }))}
                                    placeholder="-- Pilih Prioritas --"
                                    emptyText="Tidak ada prioritas pengembangan"
                                />
                                <p className="text-xs text-muted-foreground">Tingkat prioritas pengembangan kompetensi ini</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="justifikasi_pengembangan_baru" className="text-sm font-medium text-foreground">
                                    Justifikasi Pengembangan Kompetensi
                                </Label>
                                <Textarea
                                    id="justifikasi_pengembangan_baru"
                                    value={draft.justifikasi_pengembangan}
                                    onChange={(e) => setDraft(prev => ({ ...prev, justifikasi_pengembangan: e.target.value }))}
                                    placeholder="Tuliskan justifikasi pengembangan kompetensi ini..."
                                    rows={3}
                                    className="border-border focus:border-teal-500 focus:ring-teal-500"
                                />
                                <p className="text-xs text-muted-foreground">Alasan mengapa kompetensi ini penting untuk dikembangkan dan kaitannya dengan pekerjaan / kinerja</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-6 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleAddTarget}
                            disabled={!draft.deskripsi.trim() || !draft.jenis_kompetensi_id || !draft.nama_kompetensi_id || !draft.prioritas_pengembangan_id || draft.level_saat_ini === undefined || draft.level_diharapkan === undefined || (isJenisTeknis && (!draft.unit_kerja_id || !draft.kompetensi_teknis_id))}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> {editingIndex !== null ? 'Simpan' : 'Tambah'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Tambah Rencana Aksi */}
            <Dialog open={rencanaModalOpen} onOpenChange={setRencanaModalOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
                    <DialogHeader className="px-6 pt-5 pb-0 text-left shrink-0">
                        <DialogTitle>Tambah Rencana Aksi</DialogTitle>
                        <DialogDescription>
                            {rencanaIndex !== null && targetKompetensi[rencanaIndex]
                                ? `Rencana aksi untuk Target Kompetensi ${rencanaIndex + 1}: ${targetKompetensi[rencanaIndex].nama_kompetensi_nama || targetKompetensi[rencanaIndex].deskripsi}`
                                : 'Pilih metode dan bentuk pengembangan kompetensi yang akan dilakukan untuk mencapai target kompetensi ini'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4 overflow-y-auto overscroll-contain min-h-0">
                        {rencanaTujuanOptions.length > 0 && (
                            <div className="space-y-2 rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50/60 dark:bg-teal-950/30 p-3">
                                <Label htmlFor="rencana_tujuan_baru" className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                    Tujuan Pembelajaran (Opsional)
                                </Label>
                                <SearchSelect
                                    options={rencanaTujuanOptions}
                                    value={rencanaDraft.tujuan_pembelajaran_id ?? null}
                                    onChange={(val) => setRencanaDraft(prev => ({ ...prev, tujuan_pembelajaran_id: val ? Number(val) : undefined }))}
                                    placeholder={rencanaTujuanOptions.length === 1 ? rencanaTujuanOptions[0].label : 'Pilih Tujuan Pembelajaran...'}
                                    emptyText="Tidak ada tujuan pembelajaran"
                                />
                                <p className="text-xs text-muted-foreground">Tujuan pembelajaran dari kompetensi teknis &quot;{targetKompetensi[rencanaIndex!]?.kompetensi_teknis_uraian}&quot; pada Desain Pembelajaran unit kerja.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rencana_pilar_baru" className="text-sm font-medium text-foreground">
                                    Metode Pengembangan Kompetensi <span className="text-red-500">*</span>
                                </Label>
                                <SearchSelect
                                    options={rencanaPilarList.map(p => ({ value: p.id, label: `${p.nama} (${p.persentase}%)` }))}
                                    value={rencanaDraft.pilar_pengembangan_id ?? null}
                                    onChange={(val) => {
                                        const v = val ? Number(val) : undefined;
                                        setRencanaJenisList([]);
                                        setRencanaDraft(prev => ({ ...prev, pilar_pengembangan_id: v, jenis_kegiatan_pengembangan_id: undefined }));
                                    }}
                                    placeholder="Pilih Metode Pengembangan..."
                                    emptyText="Tidak ada metode pengembangan"
                                />
                                <p className="text-xs text-muted-foreground">Pilih bentuk pengembangan kompetensi yang akan dilakukan</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rencana_jenis_baru" className="text-sm font-medium text-foreground">
                                    Bentuk Pengembangan Kompetensi <span className="text-red-500">*</span>
                                </Label>
                                <SearchSelect
                                    options={rencanaJenisList.map(j => ({ value: j.id, label: j.nama }))}
                                    value={rencanaDraft.jenis_kegiatan_pengembangan_id ?? null}
                                    onChange={(val) => setRencanaDraft(prev => ({ ...prev, jenis_kegiatan_pengembangan_id: val ? Number(val) : undefined }))}
                                    placeholder={!rencanaDraft.pilar_pengembangan_id ? 'Pilih metode dulu' : loadingRencanaOptions ? 'Memuat...' : 'Pilih Bentuk Pengembangan...'}
                                    emptyText="Tidak ada bentuk pengembangan"
                                    disabled={!rencanaDraft.pilar_pengembangan_id || loadingRencanaOptions}
                                />
                                <p className="text-xs text-muted-foreground">Metode Pengembangan yang akan digunakan</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_kegiatan_baru" className="text-sm font-medium text-foreground">
                                Nama Kegiatan / Program (Opsional)
                            </Label>
                            <SearchSelect
                                options={rencanaNamaKegiatanList.map(k => ({ value: k.id, label: k.nama }))}
                                value={rencanaDraft.nama_kegiatan_program_id ?? null}
                                onChange={(val) => setRencanaDraft(prev => ({ ...prev, nama_kegiatan_program_id: val ? Number(val) : undefined }))}
                                disabled={!rencanaDraft.jenis_kegiatan_pengembangan_id}
                                placeholder={!rencanaDraft.jenis_kegiatan_pengembangan_id ? 'Pilih bentuk terlebih dahulu' : loadingNamaKegiatan ? 'Memuat...' : rencanaNamaKegiatanList.length === 0 ? 'Tidak ada data, isi manual di bawah' : 'Pilih Nama Kegiatan / Program...'}
                                emptyText={rencanaNamaKegiatanList.length === 0 ? 'Tidak ada data untuk bentuk ini' : 'Tidak ada data'}
                            />
                            <p className="text-xs text-muted-foreground">Opsional — pilih dari master data bila tersedia; kosongkan dan isi manual pada Nama Spesifik Kegiatan / Program di bawah.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_nama_baru" className="text-sm font-medium text-foreground">
                                Nama Spesifik Kegiatan / Program <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="rencana_nama_baru"
                                value={rencanaDraft.nama_spesifik_kegiatan}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, nama_spesifik_kegiatan: e.target.value }))}
                                placeholder="Contoh: Pelatihan Dasar Pemrograman Python..."
                                rows={2}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                            <p className="text-xs text-muted-foreground">Nama detail dari kegiatan/program yang akan diikuti/dilakukan (Contoh: &quot;Pelatihan Dasar Pemrograman Python&quot;, &quot;Coaching Manajemen Waktu oleh Bapak Budi&quot;, Membaca Buku &apos;Atomic Habits&apos;)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_penyelenggara_baru" className="text-sm font-medium text-foreground">
                                Penyelenggara Diusulkan
                            </Label>
                            <input
                                type="text"
                                id="rencana_penyelenggara_baru"
                                value={rencanaDraft.penyelenggara_diusulkan}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, penyelenggara_diusulkan: e.target.value }))}
                                placeholder="Contoh: BKPSDM Pusat/Daerah, Internal SKPD/PD..."
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                            />
                            <p className="text-xs text-muted-foreground">Pihak yang diharapkan menyelenggarakan atau sumber materi (Contoh: &quot;BKPSDM Pusat/Daerah&quot;, &quot;Internal SKPD/PD&quot;, &quot;Lembaga Pelatihan ABC&quot;, &quot;Atasan Langsung&quot;, Mandiri)</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rencana_tanggal_mulai_baru" className="text-sm font-medium text-foreground">
                                    Target Waktu Pelaksanaan Mulai
                                </Label>
                                <DatePicker
                                    value={rencanaDraft.tanggal_mulai}
                                    onChange={(v) => setRencanaDraft(prev => ({ ...prev, tanggal_mulai: v || '' }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Tanggal mulai pelaksanaan kegiatan</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rencana_tanggal_selesai_baru" className="text-sm font-medium text-foreground">
                                    Target Waktu Pelaksanaan Selesai
                                </Label>
                                <DatePicker
                                    value={rencanaDraft.tanggal_selesai}
                                    onChange={(v) => setRencanaDraft(prev => ({ ...prev, tanggal_selesai: v || '' }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Tanggal selesai pelaksanaan kegiatan</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="rencana_durasi_value_baru" className="text-sm font-medium text-foreground">
                                        Estimasi Durasi
                                    </Label>
                                    <input
                                        type="number"
                                        id="rencana_durasi_value_baru"
                                        min={1}
                                        value={rencanaDraft.durasi_value}
                                        onChange={(e) => setRencanaDraft(prev => ({ ...prev, durasi_value: e.target.value }))}
                                        placeholder="Contoh: 40"
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rencana_durasi_satuan_baru" className="text-sm font-medium text-foreground">
                                        Satuan Waktu
                                    </Label>
                                    <select
                                        id="rencana_durasi_satuan_baru"
                                        value={rencanaDraft.durasi_satuan}
                                        onChange={(e) => setRencanaDraft(prev => ({ ...prev, durasi_satuan: e.target.value }))}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                                    >
                                        <option value="">-- Pilih Satuan --</option>
                                        <option value="JP">JP (Jam Pelajaran)</option>
                                        <option value="Jam">Jam</option>
                                        <option value="Hari">Hari</option>
                                        <option value="Kali (Kegiatan)">Kali (Kegiatan)</option>
                                        <option value="Bulan">Bulan</option>
                                        <option value="Semester">Semester</option>
                                        <option value="Tahun">Tahun</option>
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Estimasi durasi kegiatan, mengikuti satuan konversi pengembangan kompetensi (Contoh &quot;40 JP&quot;, &quot;3 Kali (Kegiatan)&quot;, &quot;1 Semester&quot;, &quot;3 Bulan&quot;)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_biaya_baru" className="text-sm font-medium text-foreground">
                                Estimasi Kebutuhan Biaya (Opsional)
                            </Label>
                            <input
                                type="text"
                                id="rencana_biaya_baru"
                                value={rencanaDraft.estimasi_biaya}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, estimasi_biaya: e.target.value }))}
                                placeholder="Contoh: Rp 5.000.000"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                            />
                            <p className="text-xs text-muted-foreground">Perkiraan biaya jika ada dan diketahui (dalam Rupiah)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_sumber_daya_baru" className="text-sm font-medium text-foreground">
                                Sumber Daya Lain Yang Dibutuhkan
                            </Label>
                            <Textarea
                                id="rencana_sumber_daya_baru"
                                value={rencanaDraft.sumber_daya_lain}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, sumber_daya_lain: e.target.value }))}
                                placeholder="Contoh: izin atasan, akses sistem, buku referensi..."
                                rows={2}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                            <p className="text-xs text-muted-foreground">Dukungan lain yang diperlukan (misal: izin atasan, akses sistem, buku referensi)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_indikator_baru" className="text-sm font-medium text-foreground">
                                Indikator Keberhasilan Output Kegiatan
                            </Label>
                            <Textarea
                                id="rencana_indikator_baru"
                                value={rencanaDraft.indikator_keberhasilan}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, indikator_keberhasilan: e.target.value }))}
                                placeholder="Contoh: Sertifikat Kelulusan, Laporan Tugas Selesai..."
                                rows={2}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                            <p className="text-xs text-muted-foreground">Bagaimana keberhasilan kegiatan ini akan diukur (Contoh: &quot;Sertifikat Kelulusan&quot;, &quot;Laporan Tugas Selesai&quot;, &quot;Mampu mengoperasikan Aplikasi X&quot;, &quot;Peningkatan skor Y pada post-test&quot;)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rencana_catatan_baru" className="text-sm font-medium text-foreground">
                                Catatan Tambahan ASN
                            </Label>
                            <Textarea
                                id="rencana_catatan_baru"
                                value={rencanaDraft.catatan_tambahan}
                                onChange={(e) => setRencanaDraft(prev => ({ ...prev, catatan_tambahan: e.target.value }))}
                                rows={2}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                            <p className="text-xs text-muted-foreground">Informasi atau catatan tambahan dari ASN terkait rencana aksi ini</p>
                        </div>
                        {rencanaIndex !== null && targetKompetensi[rencanaIndex]?.rencana_aksi && targetKompetensi[rencanaIndex]!.rencana_aksi!.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Daftar Rencana Aksi ({targetKompetensi[rencanaIndex]!.rencana_aksi!.length})</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    {targetKompetensi[rencanaIndex]!.rencana_aksi!.map((ra, ri) => (
                                        <li key={ri} className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm text-foreground whitespace-pre-wrap">{ra.nama_spesifik_kegiatan || ra.deskripsi}</p>
                                                {ra.nama_kegiatan_program_id && ra.nama_kegiatan_program_nama && (
                                                    <p className="text-xs font-medium text-primary mt-0.5">{ra.nama_kegiatan_program_nama}</p>
                                                )}
                                                {(ra.jenis_kegiatan_pengembangan_nama || ra.pilar_pengembangan_nama) && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {[ra.pilar_pengembangan_nama, ra.jenis_kegiatan_pengembangan_nama].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                {(ra.penyelenggara_diusulkan || ra.tanggal_mulai || ra.tanggal_selesai) && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {[ra.penyelenggara_diusulkan, ra.durasi_value ? `${ra.durasi_value} ${ra.durasi_satuan || ''}` : '', ra.estimasi_biaya, ra.tanggal_mulai ? `Mulai: ${ra.tanggal_mulai}` : '', ra.tanggal_selesai ? `Selesai: ${ra.tanggal_selesai}` : ''].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeRencanaAksi(ri)}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="px-6 pb-6 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setRencanaModalOpen(false)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={addRencanaAksi}
                            disabled={!rencanaDraft.pilar_pengembangan_id || !rencanaDraft.jenis_kegiatan_pengembangan_id || !rencanaDraft.nama_spesifik_kegiatan.trim()}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" /> Simpan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
