'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Upload, Building2, Globe, MapPin } from 'lucide-react';
import { referensiService, type Instansi } from '@/lib/services/referensi.service';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function InstansiPage() {
    const t = useTranslations('admin.referensi');
    const { card, text } = useThemeColors();
    const [items, setItems] = useState<Instansi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState({ page: 1, page_size: 20, search: '' });
    const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Instansi | null>(null);
    const [formData, setFormData] = useState<Partial<Instansi>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { loadData(); }, [filters]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await referensiService.getInstansiList(filters);
            setItems(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        } catch {
            showError('Gagal memuat data instansi');
        } finally { setIsLoading(false); }
    };

    const handleSearch = (val: string) => setFilters(prev => ({ ...prev, search: val, page: 1 }));

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            showLoading('Mengimport data...');
            const res = await referensiService.importInstansiXlsx(file);
            closeLoading();
            if (res.success) {
                showSuccess(res.message);
                loadData();
            } else {
                showError(res.message);
            }
        } catch {
            closeLoading();
            showError('Import gagal');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ is_active: true });
        setShowForm(true);
    };

    const openEdit = (item: Instansi) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowForm(true);
    };

    const handleDelete = async (item: Instansi) => {
        const confirmed = await showDeleteConfirm(item.nama_instansi, 'Yakin ingin menghapus instansi ini?');
        if (!confirmed) return;
        try {
            showLoading('Menghapus...');
            await referensiService.deleteInstansi(item.id);
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
            if (editingItem) {
                await referensiService.updateInstansi(editingItem.id, formData);
            } else {
                await referensiService.createInstansi(formData);
            }
            setShowForm(false);
            closeLoading();
            showSuccess(editingItem ? 'Berhasil diperbarui' : 'Berhasil dibuat');
            loadData();
        } catch {
            closeLoading();
            showError('Gagal menyimpan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Instansi</h1>
                                <p className="text-violet-100 text-sm">Kelola data instansi / institusi</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleFileImport}
                            className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition-all backdrop-blur-sm disabled:opacity-50">
                            <Upload className={`w-4 h-4 ${isImporting ? 'animate-pulse' : ''}`} />
                            {isImporting ? 'Mengimport...' : 'Import XLSX'}
                        </button>
                        <button onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-card text-violet-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" />Tambah Instansi
                        </button>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-4 gap-4 mt-6">
                    {[
                        { label: 'Total', value: pagination.total, icon: Building2, color: 'bg-violet-400/20 text-violet-200' },
                        { label: 'Aktif', value: items.filter(i => i.is_active).length, icon: Globe, color: 'bg-green-400/20 text-green-200' },
                        { label: 'Kementerian/Lembaga', value: items.filter(i => i.jenis_instansi?.toLowerCase().includes('kementerian') || i.jenis_instansi?.toLowerCase().includes('lembaga')).length, icon: MapPin, color: 'bg-blue-400/20 text-blue-200' },
                        { label: 'Pemda/Lainnya', value: items.filter(i => i.jenis_instansi && !i.jenis_instansi.toLowerCase().includes('kementerian') && !i.jenis_instansi.toLowerCase().includes('lembaga')).length, icon: Building2, color: 'bg-yellow-400/20 text-yellow-200' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-violet-200">{stat.label}</p>
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
                        <input type="text" placeholder="Cari instansi..." value={filters.search || ''}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border ${card.borderClass} rounded-xl focus:ring-2 focus:ring-violet-500 ${card.bgClass} text-sm ${text.primaryClass}`} />
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

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl shadow-sm overflow-hidden`}>
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${card.borderClass} ${text.mutedClass} text-xs uppercase tracking-wider`}>
                            <th className="text-left py-4 px-4 font-medium">Kode</th>
                            <th className="text-left py-4 px-4 font-medium">Nama Instansi</th>
                            <th className="text-left py-4 px-4 font-medium">Jenis</th>
                            <th className="text-left py-4 px-4 font-medium">Alamat</th>
                            <th className="text-center py-4 px-4 font-medium">Kontak</th>
                            <th className="text-center py-4 px-4 font-medium">Aktif</th>
                            <th className="text-center py-4 px-4 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-12">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600 mx-auto" />
                            </td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Tidak ada data</td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${text.primaryClass}`}>
                                <td className="py-3 px-4 font-medium text-sm">{item.kode_instansi}</td>
                                <td className="py-3 px-4">
                                    <div className="font-medium text-sm">{item.nama_instansi}</div>
                                    {item.website && <div className="text-xs text-muted-foreground">{item.website}</div>}
                                </td>
                                <td className="py-3 px-4 text-sm">{item.jenis_instansi || '-'}</td>
                                <td className="py-3 px-4 text-sm max-w-xs truncate">{item.alamat || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="text-xs">
                                        {item.telepon && <div>{item.telepon}</div>}
                                        {item.email && <div className="text-muted-foreground">{item.email}</div>}
                                        {!item.telepon && !item.email && <span className="text-muted-foreground">-</span>}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => openEdit(item)}
                                            className="text-violet-600 hover:text-violet-800 text-xs font-medium">Edit</button>
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
                    <div className={`relative ${card.bgClass} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}>
                        <h2 className="text-lg font-bold mb-6">{editingItem ? 'Edit Instansi' : 'Tambah Instansi'}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium mb-1">Kode Instansi <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.kode_instansi || ''} onChange={e => setFormData(p => ({ ...p, kode_instansi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium mb-1">Jenis Instansi</label>
                                <select value={formData.jenis_instansi || ''} onChange={e => setFormData(p => ({ ...p, jenis_instansi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm">
                                    <option value="">- Pilih -</option>
                                    <option value="Kementerian Koordinator">Kementerian Koordinator</option>
                                    <option value="Kementerian">Kementerian</option>
                                    <option value="Lembaga Non Kementerian">Lembaga Non Kementerian</option>
                                    <option value="Lembaga Non Struktural">Lembaga Non Struktural</option>
                                    <option value="Provinsi">Provinsi</option>
                                    <option value="Kabupaten">Kabupaten</option>
                                    <option value="Kota">Kota</option>
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium mb-1">Tingkat Instansi</label>
                                <select value={formData.tingkat_instansi || ''} onChange={e => setFormData(p => ({ ...p, tingkat_instansi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm">
                                    <option value="">- Pilih -</option>
                                    <option value="Pusat">Pusat</option>
                                    <option value="Daerah">Daerah</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Nama Instansi <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.nama_instansi || ''} onChange={e => setFormData(p => ({ ...p, nama_instansi: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Alamat</label>
                                <textarea value={formData.alamat || ''} onChange={e => setFormData(p => ({ ...p, alamat: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Telepon</label>
                                <input type="text" value={formData.telepon || ''} onChange={e => setFormData(p => ({ ...p, telepon: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Website</label>
                                <input type="url" value={formData.website || ''} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
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
                                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
