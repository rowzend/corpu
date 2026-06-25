'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Trash2, Palette, Tag } from 'lucide-react';
import { getTag, updateTag, deleteTag } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

const PRESET_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280',
];

export default function EditTagPage() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
    });

    useEffect(() => {
        if (id && !isNaN(id)) {
            fetchTag();
        } else {
            setError('ID tag tidak valid');
            setLoading(false);
        }
    }, [id]);

    const fetchTag = async () => {
        try {
            setLoading(true);
            const response = await getTag(id.toString());
            const tag = response?.data || response;
            if (!tag) throw new Error('Tag tidak ditemukan');
            setFormData({
                name: tag.name || '',
                description: tag.description || '',
                color: tag.color || '#3B82F6',
                is_active: tag.is_active !== undefined ? tag.is_active : true,
            });
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleColorSelect = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await updateTag(id, formData);
            showToast('Tag berhasil diperbarui!', 'success');
            router.push('/knowledge/tags');
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showDeleteConfirm(formData.name, 'tag');
        if (!confirmed) return;
        setDeleting(true);
        try {
            await deleteTag(id);
            showToast(`Tag "${formData.name}" berhasil dihapus!`, 'success');
            router.push('/knowledge/tags');
        } catch (err) {
            setError(handleApiError(err));
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-2xl"></div>
                    <div className="h-80 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error && !formData.name) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 text-lg font-medium mb-4">{error}</p>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            disabled={saving || deleting}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Edit Tag</h1>
                            <p className="text-orange-100 text-sm">Perbarui informasi tag</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={saving || deleting}
                        className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all"
                    >
                        {deleting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Menghapus...</>
                        ) : (
                            <><Trash2 className="w-4 h-4" /> Hapus</>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Tag</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Nama Tag <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Contoh: tutorial, panduan, tips"
                                required
                                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Jelaskan tag ini..."
                                rows={3}
                                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700">Warna Tag</Label>

                            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'T'}
                                </div>
                                <div>
                                    <span
                                        className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                                        style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
                                    >
                                        {formData.name || 'Preview Tag'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-gray-500 mb-2 block">Pilih Warna Preset</Label>
                                <div className="grid grid-cols-10 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => handleColorSelect(color)}
                                            className={`w-8 h-8 rounded-xl transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="color" className="text-xs text-gray-500 mb-2 block">Atau Pilih Warna Custom</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        id="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        className="w-12 h-10 border border-gray-300 rounded-xl cursor-pointer"
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={handleChange}
                                        name="color"
                                        placeholder="#3B82F6"
                                        className="flex-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Tag Aktif</span>
                        </label>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={saving || deleting}
                                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Simpan Perubahan</>
                                )}
                            </button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving || deleting}>
                                Batal
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
