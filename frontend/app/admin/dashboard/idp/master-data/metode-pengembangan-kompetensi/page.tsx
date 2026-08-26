'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Layers } from 'lucide-react';
import { getPilarPengembanganList, createPilarPengembangan, updatePilarPengembangan, deletePilarPengembangan, type PilarPengembangan, type PilarPengembanganPayload } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { usePermission } from '@/lib/hooks/usePermission';

export default function PilarPengembanganPage() {
    const { card, text } = useThemeColors();
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('idp', 'create', 'idp_asn');
    const canEdit = hasPermission('idp', 'edit', 'idp_asn');
    const canDelete = hasPermission('idp', 'delete', 'idp_asn');
    const [items, setItems] = useState<PilarPengembangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({ page: 1, per_page: 20, search: '', is_active: '' });
    const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<PilarPengembangan | null>(null);
    const [formData, setFormData] = useState<Partial<PilarPengembangan>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await getPilarPengembanganList(filters);
            setItems(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        } catch (err) {
            showError(handleApiError(err));
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
        loadData();
    }, [filters]);

    const handleSearch = (val: string) => setFilters(prev => ({ ...prev, search: val, page: 1 }));

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ is_active: true, persentase: 0 });
        setShowForm(true);
    };

    const openEdit = (item: PilarPengembangan) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowForm(true);
    };

    const handleDelete = async (item: PilarPengembangan) => {
        const confirmed = await showDeleteConfirm(item.nama, 'Yakin ingin menghapus metode pengembangan kompetensi ini?');
        if (!confirmed) return;
        try {
            showLoading('Menghapus...');
            await deletePilarPengembangan(item.id);
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
                await updatePilarPengembangan(editingItem.id, formData as Partial<PilarPengembanganPayload>);
            } else {
                await createPilarPengembangan(formData as PilarPengembanganPayload);
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

    const totalPersentase = items.reduce((sum, i) => sum + (i.persentase || 0), 0);

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Metode Pengembangan Kompetensi</h1>
                                <p className="text-teal-100 text-sm">Kelola metode pengembangan kompetensi model 70-20-10</p>
                            </div>
                        </div>
                    </div>
                    {canCreate && (
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-card text-teal-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                        <Plus className="w-4 h-4" />Tambah Metode Pengembangan
                    </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Total', value: pagination.total, icon: Layers, color: 'bg-teal-400/20 text-teal-200' },
                        { label: 'Aktif', value: items.filter(i => i.is_active).length, icon: Layers, color: 'bg-green-400/20 text-green-200' },
                        { label: 'Total % (halaman ini)', value: `${totalPersentase}%`, icon: Layers, color: 'bg-cyan-400/20 text-cyan-200' },
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
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${text.mutedClass}`} />
                        <input type="text" placeholder="Cari metode pengembangan..." value={filters.search || ''}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-teal-500 ${card.bgClass} text-sm ${text.primaryClass}`} />
                    </div>
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
                            <th className="text-left py-4 px-4 font-medium">Nama Metode</th>
                            <th className="text-center py-4 px-4 font-medium">Persentase</th>
                            <th className="text-left py-4 px-4 font-medium">Deskripsi</th>
                            <th className="text-center py-4 px-4 font-medium">Aktif</th>
                            <th className="text-center py-4 px-4 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-12">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto" />
                            </td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Tidak ada data</td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${text.primaryClass}`}>
                                <td className="py-3 px-4 font-medium">{item.nama}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.persentase >= 50 ? 'bg-teal-100 text-teal-800' : 'bg-cyan-100 text-cyan-800'}`}>{item.persentase}%</span>
                                </td>
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
                        <h2 className={`text-lg font-bold mb-6 ${text.primaryClass}`}>{editingItem ? 'Edit Metode Pengembangan Kompetensi' : 'Tambah Metode Pengembangan Kompetensi'}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Nama Metode <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.nama || ''} onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} placeholder:text-muted-foreground focus:ring-2 focus:ring-teal-500`} placeholder="Contoh: Pembelajaran Formal" />
                            </div>
                            <div className="col-span-1">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Persentase (%) <span className="text-red-500">*</span></label>
                                <input type="number" min={0} max={100} value={formData.persentase ?? 0} onChange={e => setFormData(p => ({ ...p, persentase: parseInt(e.target.value) || 0 }))}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} placeholder:text-muted-foreground focus:ring-2 focus:ring-teal-500`} placeholder="Contoh: 10" />
                            </div>
                            <div className="col-span-1">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Aktif</label>
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" checked={formData.is_active ?? true}
                                        onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-sm font-medium mb-1 ${text.primaryClass}`}>Deskripsi</label>
                                <textarea value={formData.deskripsi || ''} onChange={e => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
                                    className={`w-full px-3 py-2 border ${card.bgClass} ${card.borderClass} rounded-xl text-sm ${text.primaryClass} placeholder:text-muted-foreground focus:ring-2 focus:ring-teal-500`} rows={3} placeholder="Contoh: Pembelajaran Formal (Klasikal/Usulan ke BKPSDM)" />
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