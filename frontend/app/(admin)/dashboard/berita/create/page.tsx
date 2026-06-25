'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Newspaper, Upload, X } from 'lucide-react';
import { newsService, authService } from '@/lib/services';
import { showToast, showError } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

export default function CreateBeritaPage() {
    const router = useRouter();
    const currentUser = authService.getCurrentUser();
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: currentUser?.name || currentUser?.username || '',
        status: 'draft' as 'draft' | 'published',
    });
    const [saving, setSaving] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'title') {
            setForm(prev => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
        }
    };

    const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) {
            showError('Judul dan konten harus diisi', 'Validasi');
            return;
        }
        setSaving(true);
        try {
            let payload: any = { ...form };
            if (thumbnailFile) {
                const fd = new FormData();
                Object.entries(form).forEach(([k, v]) => fd.append(k, v));
                fd.append('thumbnail', thumbnailFile);
                payload = fd;
            }
            const res = await newsService.createNews(payload);
            if (res?.success) {
                showToast('Berita berhasil dibuat!', 'success');
                router.push('/dashboard/berita');
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat Berita');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        disabled={saving}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Tulis Berita Baru</h1>
                        <p className="text-blue-100 text-sm">Buat konten berita untuk publik</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Berita</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                                    Judul <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Masukkan judul berita"
                                    required
                                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={form.slug}
                                    onChange={handleChange}
                                    placeholder="auto-generated"
                                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori</Label>
                                <select
                                    id="category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                                >
                                    <option value="">Pilih kategori</option>
                                    <option value="Program">Program</option>
                                    <option value="Kerjasama">Kerjasama</option>
                                    <option value="Event">Event</option>
                                    <option value="Pengumuman">Pengumuman</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="excerpt" className="text-sm font-medium text-gray-700">Ringkasan</Label>
                                <Textarea
                                    id="excerpt"
                                    name="excerpt"
                                    value={form.excerpt}
                                    onChange={handleChange}
                                    placeholder="Ringkasan singkat berita..."
                                    rows={3}
                                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                                    Konten <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    value={form.content}
                                    onChange={handleChange}
                                    placeholder="Tulis konten berita di sini..."
                                    rows={12}
                                    required
                                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Thumbnail</h2>
                    </div>
                    <div className="p-6">
                        {thumbnailPreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="h-40 rounded-xl object-cover border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={removeThumbnail}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-sm text-gray-500">Upload thumbnail</span>
                                <span className="text-xs text-gray-400">PNG, JPG, WebP</span>
                                <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Publish Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Publikasi</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Simpan Berita</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
