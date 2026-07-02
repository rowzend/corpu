'use client';

import { useEffect, useState } from 'react';
import {
    Plus, Search, RefreshCw, Globe, MapPin, ChevronRight, Home,
    Building2
} from 'lucide-react';
import { referensiService } from '@/lib/services/referensi.service';
import type {
    Provinsi, Kabupaten, Kecamatan, Kelurahan
} from '@/lib/services/referensi.service';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

type Level = 'provinsi' | 'kabupaten' | 'kecamatan' | 'kelurahan';

interface BreadcrumbItem {
    label: string;
    level: Level;
    provinsi?: Provinsi;
    kabupaten?: Kabupaten;
    kecamatan?: Kecamatan;
}

type LevelStyle = {
    textAction: string;
    hoverTextAction: string;
    statIcon: string;
    focusRing: string;
    spinnerBorder: string;
    submitBg: string;
    tambahColor: string;
};

const levelStyles: Record<Level, LevelStyle> = {
    provinsi: {
        textAction: 'text-emerald-600',
        hoverTextAction: 'hover:text-emerald-800',
        statIcon: 'bg-emerald-400/20 text-emerald-200',
        focusRing: 'focus:ring-emerald-500',
        spinnerBorder: 'border-emerald-600',
        submitBg: '#059669',
        tambahColor: '#047857',
    },
    kabupaten: {
        textAction: 'text-sky-600',
        hoverTextAction: 'hover:text-sky-800',
        statIcon: 'bg-sky-400/20 text-sky-200',
        focusRing: 'focus:ring-sky-500',
        spinnerBorder: 'border-sky-600',
        submitBg: '#0284c7',
        tambahColor: '#0369a1',
    },
    kecamatan: {
        textAction: 'text-amber-600',
        hoverTextAction: 'hover:text-amber-800',
        statIcon: 'bg-amber-400/20 text-amber-200',
        focusRing: 'focus:ring-amber-500',
        spinnerBorder: 'border-amber-600',
        submitBg: '#d97706',
        tambahColor: '#b45309',
    },
    kelurahan: {
        textAction: 'text-rose-600',
        hoverTextAction: 'hover:text-rose-800',
        statIcon: 'bg-rose-400/20 text-rose-200',
        focusRing: 'focus:ring-rose-500',
        spinnerBorder: 'border-rose-600',
        submitBg: '#e11d48',
        tambahColor: '#be123c',
    },
};

const levelConfig: Record<Level, {
    title: string;
    subtitle: string;
    gradient: string;
    icon: any;
    labelSingular: string;
    labelPlural: string;
    tambahLabel: string;
    columns: { key: string; label: string; align?: string }[];
}> = {
    provinsi: {
        title: 'Provinsi',
        subtitle: 'Kelola data provinsi',
        gradient: 'from-emerald-600 via-emerald-700 to-teal-800',
        icon: Globe,
        labelSingular: 'Provinsi',
        labelPlural: 'Provinsi',
        tambahLabel: 'Tambah Provinsi',
        columns: [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama Provinsi' },
            { key: 'is_active', label: 'Aktif', align: 'center' },
            { key: 'aksi', label: 'Aksi', align: 'center' },
        ],
    },
    kabupaten: {
        title: 'Kabupaten / Kota',
        subtitle: 'Kelola data kabupaten dan kota',
        gradient: 'from-sky-600 via-sky-700 to-cyan-800',
        icon: Building2,
        labelSingular: 'Kabupaten/Kota',
        labelPlural: 'Kabupaten/Kota',
        tambahLabel: 'Tambah Kab/Kota',
        columns: [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama Kabupaten/Kota' },
            { key: 'parent', label: 'Provinsi' },
            { key: 'is_active', label: 'Aktif', align: 'center' },
            { key: 'aksi', label: 'Aksi', align: 'center' },
        ],
    },
    kecamatan: {
        title: 'Kecamatan',
        subtitle: 'Kelola data kecamatan',
        gradient: 'from-amber-600 via-amber-700 to-orange-800',
        icon: MapPin,
        labelSingular: 'Kecamatan',
        labelPlural: 'Kecamatan',
        tambahLabel: 'Tambah Kecamatan',
        columns: [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama Kecamatan' },
            { key: 'parent', label: 'Kabupaten/Kota' },
            { key: 'is_active', label: 'Aktif', align: 'center' },
            { key: 'aksi', label: 'Aksi', align: 'center' },
        ],
    },
    kelurahan: {
        title: 'Kelurahan / Desa',
        subtitle: 'Kelola data kelurahan dan desa',
        gradient: 'from-rose-600 via-rose-700 to-pink-800',
        icon: Home,
        labelSingular: 'Kelurahan/Desa',
        labelPlural: 'Kelurahan/Desa',
        tambahLabel: 'Tambah Kel/Desa',
        columns: [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama Kelurahan/Desa' },
            { key: 'parent', label: 'Kecamatan' },
            { key: 'is_active', label: 'Aktif', align: 'center' },
            { key: 'aksi', label: 'Aksi', align: 'center' },
        ],
    },
};

export default function LokasiDaerahPage() {
    const { card, text } = useThemeColors();
    const [level, setLevel] = useState<Level>('provinsi');
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
        { label: 'Lokasi Daerah', level: 'provinsi' },
    ]);
    const [selectedProvinsi, setSelectedProvinsi] = useState<Provinsi | null>(null);
    const [selectedKabupaten, setSelectedKabupaten] = useState<Kabupaten | null>(null);
    const [selectedKecamatan, setSelectedKecamatan] = useState<Kecamatan | null>(null);

    const config = levelConfig[level];
    const styles = levelStyles[level];

    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [filters, setFilters] = useState({ page: 1, page_size: 20, search: '' });
    const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parentsForForm, setParentsForForm] = useState<any[]>([]);

    useEffect(() => { loadData(); }, [level, selectedProvinsi, selectedKabupaten, selectedKecamatan, filters]);

    const buildApiParams = () => {
        const params: any = { page: filters.page, page_size: filters.page_size, search: filters.search };
        if (level === 'kabupaten' && selectedProvinsi) params.provinsi_id = selectedProvinsi.id;
        if (level === 'kecamatan' && selectedKabupaten) params.kabupaten_id = selectedKabupaten.id;
        if (level === 'kelurahan' && selectedKecamatan) params.kecamatan_id = selectedKecamatan.id;
        return params;
    };

    const loadData = async () => {
        try {
            setIsLoading(true);
            let res;
            switch (level) {
                case 'provinsi':
                    res = await referensiService.getProvinsiList(buildApiParams());
                    break;
                case 'kabupaten':
                    res = await referensiService.getKabupatenList(buildApiParams());
                    break;
                case 'kecamatan':
                    res = await referensiService.getKecamatanList(buildApiParams());
                    break;
                case 'kelurahan':
                    res = await referensiService.getKelurahanList(buildApiParams());
                    break;
            }
            setItems(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        } catch {
            showError(`Gagal memuat data ${config.labelPlural.toLowerCase()}`);
        } finally { setIsLoading(false); }
    };

    const loadParentForForm = async () => {
        try {
            let res;
            if (level === 'kabupaten') {
                res = await referensiService.getProvinsiList({ all: 'true' });
            } else if (level === 'kecamatan') {
                const params: any = { all: 'true' };
                if (selectedProvinsi) params.provinsi_id = selectedProvinsi.id;
                res = await referensiService.getKabupatenList(params);
            } else if (level === 'kelurahan') {
                const params: any = { all: 'true' };
                if (selectedKabupaten) params.kabupaten_id = selectedKabupaten.id;
                res = await referensiService.getKecamatanList(params);
            }
            setParentsForForm(res?.data || []);
        } catch { }
    };

    const drillDown = (item: any) => {
        const nextLevel: Record<Level, Level> = {
            provinsi: 'kabupaten',
            kabupaten: 'kecamatan',
            kecamatan: 'kelurahan',
            kelurahan: 'kelurahan',
        };
        const next = nextLevel[level];
        if (next === level) return;

        if (level === 'provinsi') {
            setSelectedProvinsi(item);
            setBreadcrumb(prev => [...prev, { label: item.nama, level: 'provinsi', provinsi: item }]);
        } else if (level === 'kabupaten') {
            setSelectedKabupaten(item);
            setBreadcrumb(prev => [...prev, { label: item.nama, level: 'kabupaten', kabupaten: item }]);
        } else if (level === 'kecamatan') {
            setSelectedKecamatan(item);
            setBreadcrumb(prev => [...prev, { label: item.nama, level: 'kecamatan', kecamatan: item }]);
        }

        setLevel(next);
        setFilters(prev => ({ ...prev, page: 1, search: '' }));
    };

    const navigateBreadcrumb = (idx: number) => {
        const crumb = breadcrumb[idx];
        const newBreadcrumb = breadcrumb.slice(0, idx + 1);
        setBreadcrumb(newBreadcrumb);

        if (crumb.level === 'provinsi') {
            setSelectedProvinsi(crumb.provinsi || null);
            setSelectedKabupaten(null);
            setSelectedKecamatan(null);
        } else if (crumb.level === 'kabupaten') {
            setSelectedProvinsi(breadcrumb[1]?.provinsi || null);
            setSelectedKabupaten(crumb.kabupaten || null);
            setSelectedKecamatan(null);
        } else if (crumb.level === 'kecamatan') {
            setSelectedProvinsi(breadcrumb[1]?.provinsi || null);
            setSelectedKabupaten(breadcrumb[2]?.kabupaten || null);
            setSelectedKecamatan(crumb.kecamatan || null);
        }

        setLevel(crumb.level);
        setFilters(prev => ({ ...prev, page: 1, search: '' }));
    };

    const handleSearch = (val: string) => setFilters(prev => ({ ...prev, search: val, page: 1 }));

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await referensiService.syncWilayah();
            if (res.success) {
                showSuccess(res.message);
                loadData();
            } else {
                showError(res.message);
            }
        } catch {
            showError('Sinkronisasi gagal');
        } finally { setIsSyncing(false); }
    };

    const openCreate = () => {
        loadParentForForm();
        setEditingItem(null);
        const defaults: any = { is_active: true };
        if (level === 'kabupaten' && selectedProvinsi) defaults.provinsi = selectedProvinsi.id;
        if (level === 'kecamatan' && selectedKabupaten) defaults.kabupaten = selectedKabupaten.id;
        if (level === 'kelurahan' && selectedKecamatan) defaults.kecamatan = selectedKecamatan.id;
        setFormData(defaults);
        setShowForm(true);
    };

    const openEdit = (item: any) => {
        loadParentForForm();
        setEditingItem(item);
        setFormData({ ...item });
        setShowForm(true);
    };

    const handleDelete = async (item: any) => {
        const label = level === 'provinsi' ? 'provinsi' :
            level === 'kabupaten' ? 'kabupaten/kota' :
                level === 'kecamatan' ? 'kecamatan' : 'kelurahan/desa';
        const confirmed = await showDeleteConfirm(item.nama, `Yakin ingin menghapus ${label} ini?`);
        if (!confirmed) return;
        try {
            showLoading('Menghapus...');
            const deleteMap: Record<Level, (id: number) => Promise<any>> = {
                provinsi: (id) => referensiService.deleteProvinsi(id),
                kabupaten: (id) => referensiService.deleteKabupaten(id),
                kecamatan: (id) => referensiService.deleteKecamatan(id),
                kelurahan: (id) => referensiService.deleteKelurahan(id),
            };
            await deleteMap[level](item.id);
            closeLoading();
            showSuccess('Berhasil dihapus');
            loadData();
        } catch {
            closeLoading();
            showError('Gagal menghapus');
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            showLoading(editingItem ? 'Menyimpan...' : 'Membuat...');
            const createMap: Record<Level, (data: any) => Promise<any>> = {
                provinsi: (d) => referensiService.createProvinsi(d),
                kabupaten: (d) => referensiService.createKabupaten(d),
                kecamatan: (d) => referensiService.createKecamatan(d),
                kelurahan: (d) => referensiService.createKelurahan(d),
            };
            const updateMap: Record<Level, (id: number, data: any) => Promise<any>> = {
                provinsi: (id, d) => referensiService.updateProvinsi(id, d),
                kabupaten: (id, d) => referensiService.updateKabupaten(id, d),
                kecamatan: (id, d) => referensiService.updateKecamatan(id, d),
                kelurahan: (id, d) => referensiService.updateKelurahan(id, d),
            };
            if (editingItem) {
                await updateMap[level](editingItem.id, formData);
            } else {
                await createMap[level](formData);
            }
            setShowForm(false);
            closeLoading();
            showSuccess(editingItem ? 'Berhasil diperbarui' : 'Berhasil dibuat');
            loadData();
        } catch {
            closeLoading();
            showError('Gagal menyimpan');
        } finally { setIsSubmitting(false); }
    };

    const renderCell = (item: any, key: string) => {
        switch (key) {
            case 'kode':
                return <span className="font-medium text-sm">{item.kode}</span>;
            case 'nama':
                return <div className="font-medium text-sm">{item.nama}</div>;
            case 'parent':
                return <span className="text-sm">{item[`${level === 'kabupaten' ? 'provinsi' : level === 'kecamatan' ? 'kabupaten' : 'kecamatan'}_nama`] || '-'}</span>;
            case 'is_active':
                return (
                    <span className={`inline-flex w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                );
            case 'aksi':
                return (
                    <div className="flex items-center justify-center gap-2">
                        {level !== 'kelurahan' && (
                            <button onClick={() => drillDown(item)}
                                className={`${styles.textAction} ${styles.hoverTextAction} text-xs font-medium`}>Detail</button>
                        )}
                        <button onClick={() => openEdit(item)}
                            className={`${styles.textAction} ${styles.hoverTextAction} text-xs font-medium`}>Edit</button>
                        <button onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button>
                    </div>
                );
            default:
                return null;
        }
    };

    const Icon = config.icon;

    const renderForm = () => {
        return (
            <div className="grid grid-cols-2 gap-4">
                {level === 'kabupaten' && (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Provinsi <span className="text-red-500">*</span></label>
                        <select value={formData.provinsi || ''} onChange={e => setFormData((p: any) => ({ ...p, provinsi: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-xl text-sm">
                            <option value="">- Pilih Provinsi -</option>
                            {parentsForForm.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    </div>
                )}
                {level === 'kecamatan' && (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Kabupaten/Kota <span className="text-red-500">*</span></label>
                        <select value={formData.kabupaten || ''} onChange={e => setFormData((p: any) => ({ ...p, kabupaten: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-xl text-sm">
                            <option value="">- Pilih Kab/Kota -</option>
                            {parentsForForm.map((k: any) => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                )}
                {level === 'kelurahan' && (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Kecamatan <span className="text-red-500">*</span></label>
                        <select value={formData.kecamatan || ''} onChange={e => setFormData((p: any) => ({ ...p, kecamatan: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-xl text-sm">
                            <option value="">- Pilih Kecamatan -</option>
                            {parentsForForm.map((k: any) => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium mb-1">Kode <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.kode || ''} onChange={e => setFormData((p: any) => ({ ...p, kode: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" checked={formData.is_active ?? true}
                        onChange={e => setFormData((p: any) => ({ ...p, is_active: e.target.checked }))} />
                    <label className="text-sm font-medium">Aktif</label>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Nama {config.labelSingular} <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.nama || ''} onChange={e => setFormData((p: any) => ({ ...p, nama: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-8`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-sm text-white/70 mb-4">
                        {breadcrumb.map((crumb, idx) => (
                            <span key={idx} className="flex items-center gap-1.5">
                                {idx > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                                {idx < breadcrumb.length - 1 ? (
                                    <button onClick={() => navigateBreadcrumb(idx)}
                                        className="hover:text-white transition-colors underline-offset-2 hover:underline">
                                        {crumb.label}
                                    </button>
                                ) : (
                                    <span className="text-white font-medium">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Lokasi Daerah</h1>
                                <p className="text-white/70 text-sm">{config.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSync} disabled={isSyncing}
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all backdrop-blur-sm disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Menyinkronkan...' : 'Sinkron GitHub'}
                            </button>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 bg-card px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                                style={{ color: styles.tambahColor }}>
                                <Plus className="w-4 h-4" />{config.tambahLabel}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Total', value: pagination.total, icon: Icon, color: styles.statIcon },
                            { label: 'Aktif', value: items.filter((i: any) => i.is_active).length, icon: Globe, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Halaman', value: pagination.total_pages, icon: MapPin, color: 'bg-blue-400/20 text-blue-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-white/60">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm p-4`}>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${text.mutedClass}`} />
                        <input type="text" placeholder={`Cari ${config.labelPlural.toLowerCase()}...`} value={filters.search || ''}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 ${styles.focusRing} ${card.bgClass} text-sm ${text.primaryClass}`} />
                    </div>
                    <select value={filters.page_size} onChange={(e) => setFilters(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                        className={`px-3 py-2.5 border ${card.borderClass} rounded-xl ${card.bgClass} text-sm ${text.primaryClass}`}>
                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </select>
                    <span className={`text-sm ${text.mutedClass}`}>
                        {isLoading ? 'Memuat...' : `${items.length} dari ${pagination.total}`}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm overflow-hidden`}>
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${card.borderClass} ${text.mutedClass} text-xs uppercase tracking-wider`}>
                            {config.columns.map(col => (
                                <th key={col.key} className={`py-4 px-4 font-medium ${col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={config.columns.length} className="text-center py-12">
                                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 mx-auto ${styles.spinnerBorder}`} />
                            </td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={config.columns.length} className="text-center py-12 text-muted-foreground">Tidak ada data</td></tr>
                        ) : items.map((item: any) => (
                            <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${text.primaryClass}`}>
                                {config.columns.map(col => (
                                    <td key={col.key} className={`py-3 px-4 ${col.align === 'center' ? 'text-center' : ''}`}>
                                        {renderCell(item, col.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm px-6 py-4`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-sm ${text.mutedClass}`}>Halaman {pagination.page} dari {pagination.total_pages}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Sebelumnya</button>
                            <button onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.total_pages}
                                className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50">Selanjutnya</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className={`relative ${card.bgClass} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`}>
                        <h2 className="text-lg font-bold mb-6">
                            {level === 'provinsi' ? (editingItem ? 'Edit Provinsi' : 'Tambah Provinsi') :
                                level === 'kabupaten' ? (editingItem ? 'Edit Kabupaten/Kota' : 'Tambah Kabupaten/Kota') :
                                    level === 'kecamatan' ? (editingItem ? 'Edit Kecamatan' : 'Tambah Kecamatan') :
                                        editingItem ? 'Edit Kelurahan/Desa' : 'Tambah Kelurahan/Desa'}
                        </h2>
                        {renderForm()}
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded-xl text-sm">Batal</button>
                            <button onClick={handleSubmit} disabled={isSubmitting}
                                className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                                style={{ backgroundColor: styles.submitBg }}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
