'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, BookOpen, RefreshCw, GraduationCap } from 'lucide-react';
import { referensiService, type ProgramStudi, type PerguruanTinggi } from '@/lib/services/referensi.service';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function ProgramStudiPage() {
    const t = useTranslations('admin.referensi');
    const { card, text } = useThemeColors();
    const [items, setItems] = useState<ProgramStudi[]>([]);
    const [universities, setUniversities] = useState<PerguruanTinggi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [filters, setFilters] = useState({ page: 1, page_size: 20, search: '', perguruan_tinggi_id: '' });
    const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ProgramStudi | null>(null);
    const [formData, setFormData] = useState<Partial<ProgramStudi>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { loadData(); }, [filters]);
    useEffect(() => { loadUniversities(); }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const params: any = { page: filters.page, page_size: filters.page_size };
            if (filters.search) params.search = filters.search;
            if (filters.perguruan_tinggi_id) params.perguruan_tinggi_id = filters.perguruan_tinggi_id;
            const res = await referensiService.getProgramStudiList(params);
            setItems(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        } catch (err) {
            showError(handleApiError(err));
        } finally { setIsLoading(false); }
    };

    const loadUniversities = async () => {
        try {
            const res = await referensiService.getPerguruanTinggiList({ page_size: 999 });
            setUniversities(res.data || []);
        } catch {}
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await referensiService.syncFromXlsx();
            if (res.success) {
                showSuccess(res.message);
                loadData();
                loadUniversities();
            } else showError(res.message);
        } catch (err) { showError(handleApiError(err)); }
        finally { setIsSyncing(false); }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ is_active: true });
        setShowForm(true);
    };

    const openEdit = (item: ProgramStudi) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowForm(true);
    };

    const handleDelete = async (item: ProgramStudi) => {
        const confirmed = await showDeleteConfirm(item.nama_prodi, 'Yakin ingin menghapus program studi ini?');
        if (!confirmed) return;
        try {
            showLoading('Menghapus...');
            await referensiService.deleteProgramStudi(item.id);
            closeLoading(); showSuccess('Berhasil dihapus'); loadData();
        } catch (err) { closeLoading(); showError(handleApiError(err)); }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            showLoading(editingItem ? 'Menyimpan...' : 'Membuat...');
            if (editingItem) await referensiService.updateProgramStudi(editingItem.id, formData);
            else await referensiService.createProgramStudi(formData);
            setShowForm(false); closeLoading();
            showSuccess(editingItem ? 'Berhasil diperbarui' : 'Berhasil dibuat');
            loadData();
        } catch (err) { closeLoading(); showError(handleApiError(err)); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Program Studi</h1>
                                <p className="text-emerald-100 text-sm">Kelola data program studi</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSync} disabled={isSyncing}
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all backdrop-blur-sm disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkron XLSX'}
                        </button>
                        <button onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-card text-emerald-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" />Tambah Prodi
                        </button>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-4 gap-4 mt-6">
                    {[
                        { label: 'Total', value: pagination.total, icon: BookOpen, color: 'bg-emerald-400/20 text-emerald-200' },
                        { label: 'Aktif', value: items.filter(i => i.is_active).length, icon: GraduationCap, color: 'bg-green-400/20 text-green-200' },
                        { label: 'S1', value: items.filter(i => i.jenjang === 'S1').length, icon: GraduationCap, color: 'bg-blue-400/20 text-blue-200' },
                        { label: 'S2/S3', value: items.filter(i => i.jenjang === 'S2' || i.jenjang === 'S3').length, icon: GraduationCap, color: 'bg-purple-400/20 text-purple-200' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-emerald-200">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm p-4`}>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${text.mutedClass}`} />
                        <input type="text" placeholder="Cari program studi..." value={filters.search || ''}
                            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
                            className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-emerald-500 ${card.bgClass} text-sm ${text.primaryClass}`} />
                    </div>
                    <select value={filters.perguruan_tinggi_id}
                        onChange={(e) => setFilters(p => ({ ...p, perguruan_tinggi_id: e.target.value, page: 1 }))}
                        className={`px-3 py-2.5 border ${card.borderClass} rounded-xl ${card.bgClass} text-sm ${text.primaryClass}`}>
                        <option value="">Semua PT</option>
                        {universities.map(u => (
                            <option key={u.id} value={u.id}>{u.nama_pt} ({u.kode_pt})</option>
                        ))}
                    </select>
                    <select value={filters.page_size}
                        onChange={(e) => setFilters(p => ({ ...p, page_size: parseInt(e.target.value), page: 1 }))}
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
                            <th className="text-left py-4 px-4 font-medium">Kode Prodi</th>
                            <th className="text-left py-4 px-4 font-medium">Nama Prodi</th>
                            <th className="text-center py-4 px-4 font-medium">Jenjang</th>
                            <th className="text-left py-4 px-4 font-medium">Perguruan Tinggi</th>
                            <th className="text-center py-4 px-4 font-medium">Akreditasi</th>
                            <th className="text-center py-4 px-4 font-medium">Aktif</th>
                            <th className="text-center py-4 px-4 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-12">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto" />
                            </td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Tidak ada data</td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${text.primaryClass}`}>
                                <td className="py-3 px-4 font-medium text-sm">{item.kode_prodi || '-'}</td>
                                <td className="py-3 px-4">
                                    <div className="font-medium text-sm">{item.nama_prodi}</div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {item.jenjang || '-'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm">{item.perguruan_tinggi_nama}</td>
                                <td className="py-3 px-4 text-center text-sm">{item.akreditasi || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => openEdit(item)}
                                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium">Edit</button>
                                        <button onClick={() => handleDelete(item)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button>
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
                        <h2 className="text-lg font-bold mb-6">{editingItem ? 'Edit Program Studi' : 'Tambah Program Studi'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Prodi <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.nama_prodi || ''}
                                    onChange={e => setFormData(p => ({ ...p, nama_prodi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Kode Prodi</label>
                                    <input type="text" value={formData.kode_prodi || ''}
                                        onChange={e => setFormData(p => ({ ...p, kode_prodi: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jenjang</label>
                                    <select value={formData.jenjang || ''}
                                        onChange={e => setFormData(p => ({ ...p, jenjang: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-xl text-sm">
                                        <option value="">- Pilih -</option>
                                        <option value="D3">D3</option>
                                        <option value="D4">D4</option>
                                        <option value="S1">S1</option>
                                        <option value="S2">S2</option>
                                        <option value="S3">S3</option>
                                        <option value="Profesi">Profesi</option>
                                        <option value="Spesialis">Spesialis</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Perguruan Tinggi <span className="text-red-500">*</span></label>
                                <select value={formData.perguruan_tinggi || ''}
                                    onChange={e => setFormData(p => ({ ...p, perguruan_tinggi: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm">
                                    <option value="">- Pilih PT -</option>
                                    {universities.map(u => (
                                        <option key={u.id} value={u.id}>{u.nama_pt} ({u.kode_pt})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Akreditasi</label>
                                <input type="text" value={formData.akreditasi || ''}
                                    onChange={e => setFormData(p => ({ ...p, akreditasi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.is_active ?? true}
                                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                <label className="text-sm font-medium">Aktif</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded-xl text-sm">Batal</button>
                            <button onClick={handleSubmit} disabled={isSubmitting}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
