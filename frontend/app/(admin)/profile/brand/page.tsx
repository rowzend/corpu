'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Tag, X, Upload, CheckCircle, XCircle } from 'lucide-react';
import { getAdminBrands, createBrand, updateBrand, deleteBrand, getBrandById, type BrandItem } from '@/lib/api/profilePublic';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';

function imageUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

const emptyForm = { name: '', description: '', is_primary: false, is_active: true, order: 0 };

export default function BrandPage() {
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => { fetchBrands(); }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            setBrands(await getAdminBrands());
        } catch (error) {
            console.error('Error fetching brands:', error);
            showError('Gagal memuat data brand', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({ ...emptyForm });
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingBrand(null);
    };

    const handleCreate = () => { resetForm(); setIsDialogOpen(true); };

    const handleEdit = async (brand: BrandItem) => {
        try {
            const brandData = await getBrandById(brand.id);
            setEditingBrand(brandData);
            setFormData({
                name: brandData.name,
                description: brandData.description || '',
                is_primary: brandData.is_primary,
                is_active: brandData.is_active,
                order: brandData.order,
            });
            setPreviewUrl(brandData.image_url ? imageUrl(brandData.image_url) : null);
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Error fetching brand:', error);
            showError('Gagal memuat data brand', 'Error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showError('Nama brand harus diisi', 'Error');
            return;
        }
        if (!editingBrand && !selectedFile) {
            showError('Gambar brand harus diupload', 'Error');
            return;
        }
        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('description', formData.description);
            fd.append('is_primary', formData.is_primary.toString());
            fd.append('is_active', formData.is_active.toString());
            fd.append('order', formData.order.toString());
            if (selectedFile) fd.append('image', selectedFile);

            if (editingBrand) {
                await updateBrand(editingBrand.id, fd);
                showSuccess('Brand berhasil diperbarui', 'Berhasil');
            } else {
                await createBrand(fd);
                showSuccess('Brand berhasil ditambahkan', 'Berhasil');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchBrands();
        } catch (error) {
            console.error('Error saving brand:', error);
            showError('Gagal menyimpan brand', 'Error');
        }
    };

    const handleDelete = async (brand: BrandItem) => {
        const confirmed = await showConfirm(`Apakah Anda yakin ingin menghapus brand "${brand.name}"?`, 'Hapus Brand?', 'Ya, Hapus', 'Batal');
        if (confirmed) {
            try {
                await deleteBrand(brand.id);
                showSuccess('Brand berhasil dihapus', 'Berhasil');
                fetchBrands();
            } catch (error) {
                console.error('Error deleting brand:', error);
                showError('Gagal menghapus brand', 'Error');
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-40 bg-gray-200 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-200 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Tag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Brand Management</h1>
                            <p className="text-rose-100 text-sm">Kelola brand dan logo institusi</p>
                        </div>
                    </div>
                    <button onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-white text-rose-700 hover:bg-rose-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg">
                        <Plus className="w-4 h-4" /> Tambah Brand
                    </button>
                </div>
            </div>

            {/* Brand Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {brands.map((brand) => (
                    <div key={brand.id}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Image */}
                        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative">
                            {brand.image_url ? (
                                <img src={imageUrl(brand.image_url) || ''} alt={brand.name}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                                <ImageIcon className="w-16 h-16 text-gray-300" />
                            )}
                            {brand.is_primary && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                                    <Star className="w-3 h-3 fill-current" /> Primary
                                </span>
                            )}
                            {/* Hover actions */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(brand)}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white text-gray-600 hover:text-blue-600 transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(brand)}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white text-gray-600 hover:text-red-600 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 truncate">{brand.name}</h3>
                            {brand.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{brand.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                <span className="text-xs text-gray-400">Urutan: {brand.order}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                    brand.is_active
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {brand.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {brand.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {brands.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Brand</h3>
                        <p className="text-gray-500 mb-6">Mulai dengan menambahkan brand atau logo institusi Anda</p>
                        <button onClick={handleCreate}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-200">
                            <Plus className="w-4 h-4" /> Tambah Brand Pertama
                        </button>
                    </div>
                )}
            </div>

            {/* Dialog Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="relative bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {editingBrand ? 'Edit Brand' : 'Tambah Brand Baru'}
                                    </h2>
                                    <p className="text-rose-100 text-sm mt-0.5">
                                        {editingBrand ? 'Perbarui informasi brand' : 'Tambahkan brand atau logo institusi baru'}
                                    </p>
                                </div>
                                <button onClick={() => { setIsDialogOpen(false); resetForm(); }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Brand <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                                    placeholder="Masukkan nama brand" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 focus:bg-white transition-colors text-sm resize-none"
                                    placeholder="Deskripsi atau keterangan brand (opsional)" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gambar Brand {!editingBrand && <span className="text-red-500">*</span>}</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors bg-gray-50 hover:bg-rose-50">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-500">Pilih file gambar</span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                {previewUrl && (
                                    <div className="mt-3 relative inline-block">
                                        <img src={previewUrl} alt="Preview" className="h-28 w-auto object-contain border border-gray-200 rounded-xl" />
                                        <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Urutan</label>
                                <input type="number" value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 focus:bg-white transition-colors text-sm" min="0" />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_primary}
                                        onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                                        className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" />
                                    <span className="text-sm font-medium text-gray-700">Brand Utama</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" />
                                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => { setIsDialogOpen(false); resetForm(); }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button type="submit"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl transition-all shadow-lg shadow-rose-200">
                                    {editingBrand ? 'Perbarui' : 'Tambah'} Brand
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
