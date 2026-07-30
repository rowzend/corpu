'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Database, Plus, Search, Eye, Filter,
    ChevronDown, FileText, CheckCircle2, Clock,
    XCircle, User, BadgeCheck, Calendar,
    Briefcase, Loader2, Pencil, Trash2, X, Save
} from 'lucide-react';
import { userProfileService, type UserProfile } from '@/lib/services/user-profile.service';

interface IdpItem {
    id: number;
    asn_nama: string;
    asn_nip: string;
    atasan_langsung: string;
    periode_mulai: string;
    periode_selesai: string;
    tanggal_pengajuan: string;
    dasar_penyusunan: string;
    status: string;
}

const atasanOptions = [
    { value: 'Drs. H. SYAMSUAR, M.M.', label: 'Drs. H. SYAMSUAR, M.M. — Sekretaris Daerah' },
    { value: 'Dr. ANDRI ISKANDAR, M.T.', label: 'Dr. ANDRI ISKANDAR, M.T. — Kepala BKD' },
    { value: 'Hj. MASYITA, S.STP., M.Si.', label: 'Hj. MASYITA, S.STP., M.Si. — Kepala Subbag Kepegawaian' },
    { value: 'Ir. FAUZAN, M.Si.', label: 'Ir. FAUZAN, M.Si. — Kepala Dinas Pendidikan' },
    { value: 'Dr. RINA DEVI, S.E., M.M.', label: 'Dr. RINA DEVI, S.E., M.M. — Kepala Bidang Pengembangan' },
];

const statusConfig: Record<string, { color: string; bg: string; icon: any; i18nKey: string }> = {
    'Draft': {
        color: 'text-gray-700 dark:text-gray-300',
        bg: 'bg-gray-100 dark:bg-gray-500/10',
        icon: FileText,
        i18nKey: 'member.idp.draft',
    },
    'Proses': {
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-100 dark:bg-blue-500/10',
        icon: Clock,
        i18nKey: 'member.idp.proses',
    },
    'Disetujui': {
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-100 dark:bg-emerald-500/10',
        icon: CheckCircle2,
        i18nKey: 'member.idp.disetujui',
    },
    'Ditolak': {
        color: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-100 dark:bg-red-500/10',
        icon: XCircle,
        i18nKey: 'member.idp.ditolak',
    },
};

const statusKeys: Record<string, string> = {
    'Draft': 'member.idp.draft',
    'Proses': 'member.idp.proses',
    'Disetujui': 'member.idp.disetujui',
    'Ditolak': 'member.idp.ditolak',
};

const filterStatusKeys = ['member.idp.semua', 'member.idp.draft', 'member.idp.proses', 'member.idp.disetujui', 'member.idp.ditolak'];

const initialDummyList: IdpItem[] = [
    {
        id: 1,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2025-01-01',
        periode_selesai: '2025-06-30',
        tanggal_pengajuan: '2025-01-10',
        dasar_penyusunan: 'Peraturan BKN No. 5 Tahun 2024 tentang Pengembangan Kompetensi ASN',
        status: 'Draft',
    },
    {
        id: 2,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Dr. ANDRI ISKANDAR, M.T.',
        periode_mulai: '2025-07-01',
        periode_selesai: '2025-12-31',
        tanggal_pengajuan: '2025-07-01',
        dasar_penyusunan: 'Hasil evaluasi capaian kompetensi Semester 1 Tahun 2025',
        status: 'Proses',
    },
    {
        id: 3,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Hj. MASYITA, S.STP., M.Si.',
        periode_mulai: '2024-01-01',
        periode_selesai: '2024-06-30',
        tanggal_pengajuan: '2024-01-15',
        dasar_penyusunan: 'Peraturan Pemerintah No. 17 Tahun 2020 tentang Manajemen ASN',
        status: 'Disetujui',
    },
    {
        id: 4,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2024-07-01',
        periode_selesai: '2024-12-31',
        tanggal_pengajuan: '2024-07-20',
        dasar_penyusunan: 'Rencana Strategis Pengembangan Kompetensi ASN 2024-2029',
        status: 'Disetujui',
    },
    {
        id: 5,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Ir. FAUZAN, M.Si.',
        periode_mulai: '2023-01-01',
        periode_selesai: '2023-06-30',
        tanggal_pengajuan: '2023-01-18',
        dasar_penyusunan: 'SKP Tahun 2023',
        status: 'Ditolak',
    },
    {
        id: 6,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Dr. RINA DEVI, S.E., M.M.',
        periode_mulai: '2023-07-01',
        periode_selesai: '2023-12-31',
        tanggal_pengajuan: '2023-07-12',
        dasar_penyusunan: 'Peraturan Menteri PANRB No. 7 Tahun 2022',
        status: 'Disetujui',
    },
    {
        id: 7,
        asn_nama: '',
        asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2022-01-01',
        periode_selesai: '2022-06-30',
        tanggal_pengajuan: '2022-02-01',
        dasar_penyusunan: 'Undang-Undang ASN No. 5 Tahun 2014',
        status: 'Disetujui',
    },
];

const emptyForm: Omit<IdpItem, 'id'> = {
    asn_nama: '',
    asn_nip: '',
    atasan_langsung: '',
    periode_mulai: '',
    periode_selesai: '',
    tanggal_pengajuan: new Date().toISOString().split('T')[0],
    dasar_penyusunan: '',
    status: 'Draft',
};

export default function DataIdpPage() {
    const t = useTranslations();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [showFilter, setShowFilter] = useState(false);
    const [idpList, setIdpList] = useState<IdpItem[]>(initialDummyList);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<Omit<IdpItem, 'id'>>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [nextId, setNextId] = useState(initialDummyList.length + 1);

    useEffect(() => {
        userProfileService.getProfile()
            .then(setProfile)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredList = idpList.filter(item => {
        const atasanMatch = !searchQuery ||
            item.atasan_langsung.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.periode_mulai.includes(searchQuery);
        const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;
        return atasanMatch && matchStatus;
    });

    const openCreate = () => {
        setForm({
            ...emptyForm,
            asn_nama: profile?.user_name || '',
            asn_nip: profile?.nip || '',
            tanggal_pengajuan: new Date().toISOString().split('T')[0],
        });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (item: IdpItem) => {
        setForm({
            asn_nama: item.asn_nama,
            asn_nip: item.asn_nip,
            atasan_langsung: item.atasan_langsung,
            periode_mulai: item.periode_mulai,
            periode_selesai: item.periode_selesai,
            tanggal_pengajuan: item.tanggal_pengajuan,
            dasar_penyusunan: item.dasar_penyusunan,
            status: item.status,
        });
        setEditingId(item.id);
        setModalOpen(true);
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            if (editingId) {
                setIdpList(prev => prev.map(item =>
                    item.id === editingId ? { ...form, id: editingId } : item
                ));
            } else {
                setIdpList(prev => [...prev, { ...form, id: nextId }]);
                setNextId(prev => prev + 1);
            }
            setSaving(false);
            setModalOpen(false);
        }, 300);
    };

    const handleDelete = (id: number) => {
        setIdpList(prev => prev.filter(item => item.id !== id));
        setDeleteConfirm(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-8">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('member.idp.title')}</h1>
                        <p className="text-violet-100 text-sm">{t('member.idp.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Info Pegawai */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                        <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('member.idp.nama_pegawai')}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                                {profile?.user_name || '-'}
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('member.idp.nip')}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{profile?.nip || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('member.idp.jabatan')}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                {profile?.jabatan || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t('member.idp.cari')}
                            className="w-full pl-9 pr-4 py-2.5 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border rounded-lg bg-card hover:bg-accent transition-colors text-sm font-medium"
                        >
                            <Filter className="w-4 h-4" />
                            {t(statusKeys[filterStatus] || 'member.idp.semua')}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
                        </button>
                        {showFilter && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                                {filterStatusKeys.map(key => {
                                    const label = t(key);
                                    const val = key.split('.').pop() || '';
                                    const statusVal = val === 'semua' ? 'Semua' : val.charAt(0).toUpperCase() + val.slice(1);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => { setFilterStatus(statusVal); setShowFilter(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent ${filterStatus === statusVal
                                                ? 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium'
                                                : 'text-foreground'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 rounded-xl transition-all shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                        <Plus className="w-4 h-4" />
                        {t('member.idp.buat_baru')}
                    </button>
                </div>
            </div>

            {/* Tabel IDP */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4 w-12">No</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Atasan Langsung</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Periode IDP</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Tgl. Pengajuan</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Dasar Penyusunan</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Status</th>
                                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4 w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">{t('member.idp.kosong')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item, index) => {
                                    const statusCfg = statusConfig[item.status] || statusConfig['Draft'];
                                    const StatusIcon = statusCfg.icon;
                                    const periodeLabel = `${item.periode_mulai} s.d ${item.periode_selesai}`;

                                    return (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4 text-sm text-muted-foreground">{index + 1}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-foreground">{item.atasan_langsung}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                    {periodeLabel}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-foreground">{item.tanggal_pengajuan}</td>
                                            <td className="px-5 py-4 text-sm text-foreground max-w-xs truncate">{item.dasar_penyusunan}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {t(statusCfg.i18nKey)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={`/member/data-idp/${item.id}`}
                                                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                                        title="Lihat Detail IDP"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/10 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                                                        title="Edit IDP"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(item.id)}
                                                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-all"
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
            </div>

            {/* Modal Create / Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border rounded-t-2xl">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingId ? 'Edit IDP' : 'Buat IDP Baru'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Nama ASN & NIP (read-only) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Nama ASN</label>
                                    <input type="text" value={profile?.user_name || ''} readOnly
                                        className="w-full px-4 py-3 border-2 border-border rounded-lg bg-muted/50 text-sm text-muted-foreground cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">NIP</label>
                                    <input type="text" value={profile?.nip || ''} readOnly
                                        className="w-full px-4 py-3 border-2 border-border rounded-lg bg-muted/50 text-sm text-muted-foreground cursor-not-allowed" />
                                </div>
                            </div>

                            {/* Atasan Langsung */}
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Atasan Langsung</label>
                                <select
                                    value={form.atasan_langsung}
                                    onChange={e => setForm(f => ({ ...f, atasan_langsung: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm"
                                >
                                    <option value="">Pilih Atasan Langsung</option>
                                    {atasanOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Periode */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Periode IDP Mulai</label>
                                    <input type="date" value={form.periode_mulai}
                                        onChange={e => setForm(f => ({ ...f, periode_mulai: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Periode IDP Selesai</label>
                                    <input type="date" value={form.periode_selesai}
                                        onChange={e => setForm(f => ({ ...f, periode_selesai: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm" />
                                </div>
                            </div>

                            {/* Tanggal Pengajuan */}
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Tanggal Pengajuan IDP</label>
                                <input type="date" value={form.tanggal_pengajuan}
                                    onChange={e => setForm(f => ({ ...f, tanggal_pengajuan: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm" />
                            </div>

                            {/* Dasar Penyusunan */}
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Dasar Penyusunan IDP</label>
                                <textarea value={form.dasar_penyusunan}
                                    onChange={e => setForm(f => ({ ...f, dasar_penyusunan: e.target.value }))}
                                    rows={3} className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm resize-none"
                                    placeholder="Contoh: Peraturan BKN No. 5 Tahun 2024, SKP, dll." />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-card flex items-center justify-end gap-3 px-6 py-4 border-t border-border rounded-b-2xl">
                            <button onClick={() => setModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium border-2 border-border rounded-xl hover:bg-accent transition-colors">
                                Batal
                            </button>
                            <button onClick={handleSave} disabled={saving || !form.atasan_langsung || !form.periode_mulai || !form.periode_selesai}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 rounded-xl transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Simpan Perubahan' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Hapus IDP</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Apakah Anda yakin ingin menghapus data IDP ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="px-5 py-2.5 text-sm font-medium border-2 border-border rounded-xl hover:bg-accent transition-colors">
                                Batal
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 rounded-xl transition-all shadow-lg shadow-red-200">
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
