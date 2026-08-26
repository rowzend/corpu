'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Trash2, Newspaper, Upload, X, Eye, Calendar } from 'lucide-react';
import { newsService } from '@/lib/services';
import { showToast, showError, showDeleteConfirm } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

export default function EditBeritaPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: '',
        status: 'draft' as 'draft' | 'published',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
    const [removeThumbnailFlag, setRemoveThumbnailFlag] = useState(false);
    const [newsItem, setNewsItem] = useState<any>(null);

    useEffect(() => {
        fetchNews();
    }, [id]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNewsBySlug(id);
            if (res?.data) {
                const n = res.data;
                setNewsItem(n);
                setForm({
                    title: n.title || '',
                    slug: n.slug || '',
                    excerpt: n.excerpt || '',
                    content: n.content || '',
                    category: n.category || '',
                    author: n.author || '',
                    status: n.status || 'draft',
                });
                if (n.thumbnail) {
                    setExistingThumbnail(n.thumbnail);
                }
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Berita');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
            setRemoveThumbnailFlag(false);
        }
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setExistingThumbnail(null);
        setRemoveThumbnailFlag(true);
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
            } else if (removeThumbnailFlag) {
                payload = { ...form, thumbnail: '' };
            }
            const res = await newsService.updateNews(Number(id), payload);
            if (res?.success) {
                showToast('Berita berhasil diperbarui!', 'success');
                router.push('/admin/dashboard/berita');
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memperbarui Berita');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!newsItem) return;
        const confirmed = await showDeleteConfirm(newsItem.title, 'berita');
        if (!confirmed) return;
        setDeleting(true);
        try {
            await newsService.deleteNews(Number(id));
            showToast(`Berita "${newsItem.title}" berhasil dihapus!`, 'success');
            router.push('/admin/dashboard/berita');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus Berita');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-32 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-96 bg-muted rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6">
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
                            <h1 className="text-xl font-bold text-white">Edit Berita</h1>
                            <p className="text-blue-100 text-sm">Perbarui konten berita</p>
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

            {/* Stats */}
            {newsItem && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Dilihat', value: newsItem.views || 0, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Status', value: newsItem.status === 'published' ? 'Published' : 'Draft', icon: newsItem.status === 'published' ? undefined : undefined, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Dibuat', value: new Date(newsItem.created_at).toLocaleDateString('id-ID'), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                            {stat.icon && <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />}
                            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Informasi Berita</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-card-foreground">
                                    Judul <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Masukkan judul berita"
                                    required
                                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-sm font-medium text-card-foreground">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={form.slug}
                                    onChange={handleChange}
                                    placeholder="auto-generated"
                                    className="border-border focus:border-blue-500 focus:ring-blue-500 text-muted-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-card-foreground">Kategori</Label>
                                <select
                                    id="category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted text-sm"
                                >
                                    <option value="">Pilih kategori</option>
                                    <option value="Program">Program</option>
                                    <option value="Kerjasama">Kerjasama</option>
                                    <option value="Event">Event</option>
                                    <option value="Pengumuman">Pengumuman</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="excerpt" className="text-sm font-medium text-card-foreground">Ringkasan</Label>
                                <Textarea
                                    id="excerpt"
                                    name="excerpt"
                                    value={form.excerpt}
                                    onChange={handleChange}
                                    placeholder="Ringkasan singkat berita..."
                                    rows={3}
                                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="content" className="text-sm font-medium text-card-foreground">
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
                                    className="border-border focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Thumbnail</h2>
                    </div>
                    <div className="p-6">
                        {thumbnailPreview || existingThumbnail ? (
                            <div className="relative inline-block">
                                <img
                                    src={thumbnailPreview || existingThumbnail || ''}
                                    alt="Thumbnail preview"
                                    className="h-40 rounded-xl object-cover border border-border"
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
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                                <span className="text-xs text-muted-foreground">PNG, JPG, WebP</span>
                                <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Publish Settings */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Pengaturan Publikasi</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium text-card-foreground">Status</Label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving || deleting}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Simpan Perubahan</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
