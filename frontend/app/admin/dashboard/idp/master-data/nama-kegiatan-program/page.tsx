'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, ListChecks } from 'lucide-react';
import { getNamaKegiatanProgramList, createNamaKegiatanProgram, updateNamaKegiatanProgram, deleteNamaKegiatanProgram, getPilarPengembanganList, getJenisKegiatanPengembanganList, type NamaKegiatanProgram, type NamaKegiatanProgramPayload, type PilarPengembangan, type JenisKegiatanPengembangan } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { usePermission } from '@/lib/hooks/usePermission';

export default function NamaKegiatanProgramPage() {
    const { card, text } = useThemeColors();
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('idp', 'create', 'idp_asn');
    const canEdit = hasPermission('idp', 'edit', 'idp_asn');
    const canDelete = hasPermission('idp', 'delete', 'idp_asn');
    const [items, setItems] = useState<NamaKegiatanProgram[]>([]);
    const [pilarList, setPilarList] = useState<PilarPengembangan[]>([]);
    const [bentukList, setBentukList] = useState<JenisKegiatanPengembangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({ page: 1, per_page: 20, search: '', is_active: '', pilar_pengembangan_id: '', bentuk_pengembangan_id: '' });
    const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<NamaKegiatanProgram | null>(null);
    const [formData, setFormData] = useState<Partial<NamaKegiatanProgramPayload> & { pilar_pengembangan_id?: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadPilar = async () => {
        try {
            const res = await getPilarPengembanganList({ per_page: 100 });
            setPilarList(res.data || []);
        } catch (err) {
            showError(handleApiError(err));
        }
    };

    const loadBentuk = async (pilarId?: string | number) => {
        try {
            const params: Record<string, string | number> = { per_page: 100 };
            if (pilarId) params.pilar_pengembangan_id = pilarId;
            const res = await getJenisKegiatanPengembanganList(params);
            setBentukList(res.data || []);
        } catch (err) {
            showError(handleApiError(err));
        }
    };

    const loadData = async () => {
        try {
            setIsLoading(true);
            const params: Record<string, string | number> = { ...filters } as never;
            if (!filters.bentuk_pengembangan_id && filters.pilar_pengembangan_id) {
                const res = await getNamaKegiatanProgramList({ ...filters, pilar_pengembangan_id: filters.pilar_pengembangan_id });
                setItems(res.data || []);
                if (res.pagination) setPagination(res.pagination);
                return;
            }
            const res = await getNamaKegiatanProgramList(params);
            setItems(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        } catch (err) {
            showError(handleApiError(err));
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPilar();
    }, []);

useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBentuk(filters.pilar_pengembangan_id || undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        loadData();
    }, [filters]);

    const handleSearch = (val: string) => setFilters(prev => ({ ...prev, search: val, page: 1 }));

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ is_active: true });
        setShowForm(true);
    };

    const openEdit = (item: NamaKegiatanProgram) => {
        setEditingItem(item);
        setFormData({ ...item, bentuk_pengembangan_id: item.bentuk_pengembangan_id });
        loadBentuk(undefined).then(() => setFormData({ ...item, bentuk_pengembangan_id: item.bentuk_pengembangan_id }));
        setShowForm(true);
    };

    const handleDelete = async (item: NamaKegiatanProgram) => {
        const confirmed = await showDeleteConfirm(item.nama, 'Yakin ingin menghapus nama kegiatan/program ini?');
        if (!confirmed) return;
        try {
            showLoading('Menghapus...');
            await deleteNamaKegiatanProgram(item.id);
            closeLoading();
            showSuccess('Berhasil dihapus');
            loadData();
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            showLoading(editingItem ? 'Menyimpan...' : 'Membuat...');
            if (editingItem) {
                await updateNamaKegiatanProgram(editingItem.id, formData as Partial<NamaKegiatanProgramPayload>);
            } else {
                await createNamaKegiatanProgram(formData as NamaKegiatanProgramPayload);
            }
            setShowForm(false);
            closeLoading();
            showSuccess(editingItem ? 'Berhasil diperbarui' : 'Berhasil dibuat');
            loadData();
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        } finally { setIsSubmitting(false); }
    };

    const pilarBadge = (p: string, persen?: number) => {
        if (p.toLowerCase().includes('formal') || (persen && persen === 10)) return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300';
        if (p.toLowerCase().includes('sosial') || (persen && persen === 20)) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300';
        return 'bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300';
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <ListChecks className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Nama Kegiatan / Program</h1>
                                <p className="text-teal-100 text-sm">Kelola nama kegiatan/program pengembangan kompetensi berdasarkan bentuk pengembangan</p>
                            </div>
                        </div>
                    </div>
                    {canCreate && (
                        <button onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-card text-teal-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" />Tambah Nama Kegiatan / Program
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Total', value: pagination.total, icon: ListChecks, color: 'bg-teal-400/20 text-teal-200' },
                        { label: 'Aktif', value: items.filter(i => i.is_active).length, icon: ListChecks, color: 'bg-green-400/20 text-green-200' },
                        { label: 'Bentuk Terdaftar', value: bentukList.filter(b => b.is_active).length, icon: ListChecks, color: 'bg-cyan-400/20 text-cyan-200' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-teal-200">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm p-4`}>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${text.mutedClass}`} />
                        <input type="text" placeholder="Cari nama kegiatan/program..." value={filters.search || ''}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-teal-500 ${card.bgClass} text-sm ${text.primaryClass}`} />
                    </div>
                    <select value={filters.pilar_pengembangan_id} onChange={(e) => setFilters(prev => ({ ...prev, pilar_pengembangan_id: e.target.value, bentuk_pengembangan_id: '', page: 1 }))}
                        className={`px-3 py-2.5 border ${card.borderClass} rounded-xl ${card.bgClass} text-sm ${text.primaryClass}`}>
                        <option value="">Semua Metode</option>
                        {pilarList.map(p => (
                            <option key={p.id} value={p.id}>{p.nama} ({p.persentase}%)</option>
                        ))}
                    </select>
                    <select value={filters.bentuk_pengembangan_id} onChange={(e) => setFilters(prev => ({ ...prev, bentuk_pengembangan_id: e.target.value, page: 1 }))}
                        disabled={!filters.pilar_pengembangan_id}
                        className={`px-3 py-2.5 border ${card.borderClass} rounded-xl ${card.bgClass} text-sm ${text.primaryClass} disabled:opacity-50`}>
                        <option value="">Semua Bentuk</option>
                        {bentukList.map(b => (
                            <option key={b.id} value={b.id}>{b.nama}</option>
                        ))}
                    </select>
                    <select value={filters.per_page} onChange={(e) => setFilters(prev => ({ ...prev, per_page: parseInt(e.target.value), page: 1 }))}
                        className={`px-3 py-2.5 border ${card.borderClass} rounded-xl ${card.bgClass} text-sm ${text.primaryClass}`}>
                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </select>
                    <span className={`text-sm ${text.mutedClass}`}>
                        {isLoading ? 'Memuat...' : `${items.length} dari ${pagination.total}`}
                    </span>
                </div>
            </div>

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm overflow-hidden`}>
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${card.borderClass} ${text.mutedClass} text-xs uppercase tracking-wider`}>
                            <th className="text-left py-4 px-4 font-medium">Metode</th>
                            <th className="text-left py-4 px-4 font-medium">Bentuk Pengembangan</th>
                            <th className="text-left py-4 px-4 font-medium">Nama Kegiatan / Program</th>
                            <th className="text-left py-4 px-4 font-medium">Deskripsi</th>
                            <th className="text-center py-4 px-4 font-medium">Aktif</th>
                            <th className="text-center py-4 px-4 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-12">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto" />
                            </td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Tidak ada data</td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${text.primaryClass}`}>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pilarBadge(item.bentuk_pengembangan_nama)}`}>
                                        {item.bentuk_pengembangan_nama}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{item.bentuk_pengembangan_nama}</td>
                                <td className="py-3 px-4 font-medium">{item.nama}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground max-w-md">{item.deskripsi || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {canEdit && (
                                            <button onClick={() => openEdit(item)}
                                                className="text-teal-600 hover:text-teal-800 text-xs font-medium">Edit</button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDelete(item)}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className={`relative ${card.bgClass} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`}>
                        <h2 className={`text-lg font-bold mb-6 ${text.primaryClass}`}>{editingItem ? 'Edit Nama Kegiatan / Program' : 'Tambah Nama Kegiatan / Program'}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Metode Pengembangan Kompetensi <span className="text-red-500">*</span></label>
                                <select value={formData.pilar_pengembangan_id ?? ''} onChange={e => {
                                    const pid = parseInt(e.target.value) || undefined;
                                    setFormData(p => ({ ...p, pilar_pengembangan_id: pid, bentuk_pengembangan_id: undefined }));
                                    loadBentuk(pid);
                                }}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} focus:ring-2 focus:ring-teal-500`}>
                                    <option value="">-- Pilih Metode --</option>
                                    {pilarList.map(p => (
                                        <option key={p.id} value={p.id}>{p.nama} ({p.persentase}%)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Bentuk Pengembangan Kompetensi <span className="text-red-500">*</span></label>
                                <select value={formData.bentuk_pengembangan_id ?? ''} onChange={e => setFormData(p => ({ ...p, bentuk_pengembangan_id: parseInt(e.target.value) || undefined }))}
                                    disabled={!formData.pilar_pengembangan_id}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} disabled:opacity-50 focus:ring-2 focus:ring-teal-500`}>
                                    <option value="">-- Pilih Bentuk --</option>
                                    {bentukList.map(b => (
                                        <option key={b.id} value={b.id}>{b.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Nama Kegiatan / Program <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.nama || ''} onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} placeholder:text-muted-foreground focus:ring-2 focus:ring-teal-500`} placeholder="Contoh: Pelatihan Dasar Pemrograman Python" />
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Deskripsi</label>
                                <textarea value={formData.deskripsi || ''} onChange={e => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} placeholder:text-muted-foreground focus:ring-2 focus:ring-teal-500`} rows={3} />
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Aktif</label>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_active ?? true}
                                        onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)}
                                className={`px-4 py-2 border ${card.borderClass} ${card.bgClass} rounded-xl text-sm ${text.primaryClass} hover:bg-muted transition-colors`}>Batal</button>
                            <button onClick={handleSubmit} disabled={isSubmitting}
                                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}