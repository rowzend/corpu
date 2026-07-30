'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Tag, X, Upload, CheckCircle, XCircle } from 'lucide-react';
import { getAdminBrands, createBrand, updateBrand, deleteBrand, getBrandById, type BrandItem } from '@/lib/api/profilePublic';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { useTranslations } from 'next-intl';

function imageUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

const emptyForm = { name: '', description: '', is_primary: false, is_active: true, order: 0 };

export default function BrandPage() {
    const t = useTranslations('admin.brand');
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
            showError(t('load_error'), 'Error');
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
            showError(t('load_error'), 'Error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showError(t('name_required'), 'Error');
            return;
        }
        if (!editingBrand && !selectedFile) {
            showError(t('image_required'), 'Error');
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
                showSuccess(t('save_success'), 'Berhasil');
            } else {
                await createBrand(fd);
                showSuccess(t('create_success'), 'Berhasil');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchBrands();
        } catch (error) {
            console.error('Error saving brand:', error);
            showError(t('save_error'), 'Error');
        }
    };

    const handleDelete = async (brand: BrandItem) => {
        const confirmed = await showConfirm(t('delete_confirm', { name: brand.name }), t('delete_title'), t('delete_confirm_btn'), t('delete_cancel'));
        if (confirmed) {
            try {
                await deleteBrand(brand.id);
                showSuccess(t('delete_success'), 'Berhasil');
                fetchBrands();
            } catch (error) {
                console.error('Error deleting brand:', error);
                showError(t('delete_error'), 'Error');
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-40 bg-muted rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1,2,3].map(i => <div key={i} className="h-52 bg-muted rounded-2xl" />)}
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
                            <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                            <p className="text-rose-100 text-sm">{t('page_desc')}</p>
                        </div>
                    </div>
                    <button onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-card text-rose-700 hover:bg-rose-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg">
                        <Plus className="w-4 h-4" /> {t('add')}
                    </button>
                </div>
            </div>

            {/* Brand Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {brands.map((brand) => (
                    <div key={brand.id}
                        className="group bg-card rounded-2xl shadow-sm border border-border hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Image */}
                        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative">
                            {brand.image_url ? (
                                <img src={imageUrl(brand.image_url) || ''} alt={brand.name}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                                <ImageIcon className="w-16 h-16 text-muted-foreground" />
                            )}
                            {brand.is_primary && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                                    <Star className="w-3 h-3 fill-current" /> {t('primary')}
                                </span>
                            )}
                            {/* Hover actions */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(brand)}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-card text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(brand)}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-card text-muted-foreground hover:text-red-600 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <h3 className="font-semibold text-card-foreground truncate">{brand.name}</h3>
                            {brand.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brand.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">{t('order_prefix')}{brand.order}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                    brand.is_active
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-red-50 text-red-700 dark:text-red-300 border border-red-100'
                                }`}>
                                    {brand.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {brand.is_active ? t('active') : t('inactive')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {brands.length === 0 && (
                    <div className="col-span-full bg-card rounded-2xl border border-border shadow-sm p-16 text-center">
                        <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-card-foreground mb-1">{t('empty_title')}</h3>
                        <p className="text-muted-foreground mb-6">{t('empty_desc')}</p>
                        <button onClick={handleCreate}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-200">
                            <Plus className="w-4 h-4" /> {t('empty_button')}
                        </button>
                    </div>
                )}
            </div>

            {/* Dialog Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="relative bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {editingBrand ? t('dialog_title_edit') : t('dialog_title_add')}
                                    </h2>
                                    <p className="text-rose-100 text-sm mt-0.5">
                                        {editingBrand ? t('dialog_desc_edit') : t('dialog_desc_add')}
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
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_name')} <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-muted focus:bg-card transition-colors text-sm"
                                    placeholder={t('name_placeholder')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_description')}</label>
                                <textarea value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3} className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-muted focus:bg-card transition-colors text-sm resize-none"
                                    placeholder={t('desc_placeholder')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_image')} {!editingBrand && <span className="text-red-500">*</span>}</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-rose-300 transition-colors bg-muted hover:bg-rose-50">
                                        <Upload className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{t('upload_label')}</span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                {previewUrl && (
                                    <div className="mt-3 relative inline-block">
                                        <img src={previewUrl} alt={t('preview_alt')} className="h-28 w-auto object-contain border border-border rounded-xl" />
                                        <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_order')}</label>
                                <input type="number" value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-muted focus:bg-card transition-colors text-sm" min="0" />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_primary}
                                        onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                                        className="w-4 h-4 text-rose-600 border-border rounded focus:ring-rose-500" />
                                    <span className="text-sm font-medium text-foreground">{t('label_primary')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-rose-600 border-border rounded focus:ring-rose-500" />
                                    <span className="text-sm font-medium text-foreground">{t('label_active')}</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => { setIsDialogOpen(false); resetForm(); }}
                                    className="px-5 py-2.5 text-sm font-medium text-card-foreground bg-muted hover:bg-muted rounded-xl transition-colors">
                                    {t('cancel')}
                                </button>
                                <button type="submit"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl transition-all shadow-lg shadow-rose-200">
                                    {editingBrand ? t('submit_edit') : t('submit_add')} Brand
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
