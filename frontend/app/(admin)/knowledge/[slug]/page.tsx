'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { ArrowLeft, Save, Loader2, Trash2, Upload, Link, Video, FileText, BookOpen, Eye, Heart, MessageCircle, Share2, ChevronDown, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { getArticle, updateArticle, deleteArticle, getTags, type Article, type Tag } from '@/lib/api/knowledge';
import { api, handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

const sortCategoriesHierarchy = (cats: any[]): any[] => {
    const childrenMap = new Map<number | null, any[]>();
    const catIds = new Set<number>();
    for (const cat of cats) {
        catIds.add(cat.id);
        const key = cat.parent ?? null;
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key)!.push(cat);
    }
    for (const [, children] of childrenMap) {
        children.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.name.localeCompare(b.name));
    }
    const result: any[] = [];
    const visited = new Set<number>();
    const traverse = (parentId: number | null) => {
        const children = childrenMap.get(parentId);
        if (!children) return;
        for (const child of children) {
            if (visited.has(child.id)) continue;
            visited.add(child.id);
            result.push(child);
            traverse(child.id);
        }
    };
    traverse(null);
    for (const cat of cats) {
        if (!visited.has(cat.id)) {
            visited.add(cat.id);
            result.push(cat);
            traverse(cat.id);
        }
    }
    return result;
};

const buildCategoryPath = (cat: any, allCats: any[]): string => {
    if (!cat.parent) return cat.name;
    const parent = allCats.find((c: any) => c.id === cat.parent);
    if (!parent) return cat.name;
    return `${buildCategoryPath(parent, allCats)} > ${cat.name}`;
};

export default function EditArticlePage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [article, setArticle] = useState<Article | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: null as number | null,
        content_type: 'article' as const,
        status: 'draft' as const,
        is_featured: false,
        youtube_url: '',
        external_url: '',
        file_url: '',
    });

    useEffect(() => {
        if (slug) {
            fetchData();
        } else {
            setError('Slug artikel tidak valid');
            setLoading(false);
        }
    }, [slug]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [articleResponse, tagsResponse] = await Promise.all([
                getArticle(slug),
                getTags()
            ]);

            const articleData: Article = articleResponse?.data || articleResponse as Article;
            const tagsData = tagsResponse?.results || tagsResponse || [];

            if (!articleData) throw new Error('Artikel tidak ditemukan');

            setArticle(articleData);
            setTags(Array.isArray(tagsData) ? tagsData : []);
            setFormData({
                title: articleData.title || '',
                content: articleData.content || '',
                excerpt: articleData.excerpt || '',
                category: articleData.category?.id || null,
                content_type: (articleData.content_type as any) || 'article',
                status: (articleData.status as any) || 'draft',
                is_featured: articleData.is_featured || false,
                youtube_url: articleData.youtube_url || '',
                external_url: articleData.external_url || '',
                file_url: articleData.file_url || '',
            });
            if (articleData.tags && Array.isArray(articleData.tags)) {
                setSelectedTags(articleData.tags.map(tag => tag.id));
            }
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = useCallback(async (): Promise<{ value: string | number; label: string }[]> => {
        try {
            const allCats: any[] = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res: any = await api.get('knowledge/categories/', { page, page_size: 100 }, true);
                if (res?.results) allCats.push(...res.results);
                hasMore = !!res?.next;
                page++;
            }

            const active = allCats.filter((c: any) => c.is_active);
            const sorted = sortCategoriesHierarchy(active);

            return [
                { value: '', label: '-- Pilih Kategori --' },
                ...sorted.map(cat => {
                    const fullPath = cat.full_path || buildCategoryPath(cat, allCats);
                    const parts = fullPath.split(' > ');
                    const depth = parts.length - 1;
                    const indent = '\u00A0'.repeat(4 * depth);
                    const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${cat.name}` : cat.name;
                    return { value: cat.id, label };
                }),
            ];
        } catch {
            return [{ value: '', label: '-- Pilih Kategori --' }];
        }
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            if (!article) throw new Error('Artikel tidak ditemukan');
            
            // Build payload - only include fields that should be sent
            const payload: any = {
                title: formData.title,
                content: formData.content,
                excerpt: formData.excerpt,
                category: formData.category,
                tags: selectedTags,
                content_type: formData.content_type,
                status: formData.status,
                is_featured: formData.is_featured,
            };
            
            // Add media fields based on content type
            // Skip invalid URL format (like /media/... paths)
            if (formData.content_type === 'video') {
                payload.youtube_url = formData.youtube_url || '';
            } else if (formData.content_type === 'document') {
                // Only send if empty OR valid URL format
                const fileUrl = formData.file_url || '';
                if (!fileUrl || fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                    payload.file_url = fileUrl;
                }
                // Skip if invalid (like /media/... path) - keeps existing value in DB
            } else if (formData.content_type === 'link') {
                payload.external_url = formData.external_url || '';
            }
            
            await updateArticle(article.id, payload);
            showToast('Artikel berhasil diupdate!', 'success');
            router.push('/knowledge');
        } catch (err) {
            const errorMsg = handleApiError(err);
            setError(errorMsg);
            showError(errorMsg, 'Gagal Update Artikel');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!article) return;
        const confirmed = await showDeleteConfirm(article.title, 'artikel');
        if (!confirmed) return;
        setDeleting(true);
        try {
            await deleteArticle(article.id);
            showToast(`Artikel "${article.title}" berhasil dihapus!`, 'success');
            router.push('/knowledge');
        } catch (err) {
            showError(handleApiError(err), 'Gagal Menghapus Artikel');
            setDeleting(false);
        }
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'document': return <FileText className="w-4 h-4" />;
            case 'link': return <Link className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

    if (loading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-2xl"></div>
                    <div className="h-96 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error && !article) {
        return (
            <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6">
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
                            <h1 className="text-xl font-bold text-white">Edit Artikel</h1>
                            <p className="text-emerald-100 text-sm">Perbarui artikel knowledge base</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Konten Artikel</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                                        Judul Artikel <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Masukkan judul artikel..."
                                        required
                                        className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        URL Slug
                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Tidak bisa diubah</span>
                                    </Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="slug"
                                            value={`/knowledge/${article?.slug || ''}`}
                                            readOnly
                                            className="pl-10 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        Slug dibuat otomatis saat pertama kali publish. Tidak berubah meski judul diedit (untuk SEO & link sharing).
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="excerpt" className="text-sm font-medium text-gray-700">Ringkasan</Label>
                                    <Textarea
                                        id="excerpt"
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleChange}
                                        placeholder="Ringkasan singkat artikel (opsional)..."
                                        rows={3}
                                        className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-gray-400">
                                        Jika kosong, akan diambil dari 200 karakter pertama konten
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                                        Konten <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Tulis konten artikel di sini..."
                                        rows={15}
                                        required
                                        className="font-mono border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-gray-400">Mendukung Markdown formatting</p>
                                </div>
                            </div>
                        </div>

                        {/* Media Content */}
                        {formData.content_type !== 'article' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        {getContentTypeIcon(formData.content_type)} Media Content
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {formData.content_type === 'video' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="youtube_url" className="text-sm font-medium text-gray-700">YouTube URL</Label>
                                            <Input id="youtube_url" name="youtube_url" value={formData.youtube_url} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                    {formData.content_type === 'document' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="file_url" className="text-sm font-medium text-gray-700">File URL</Label>
                                            <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleChange} placeholder="https://drive.google.com/file/d/..." className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                    {formData.content_type === 'link' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="external_url" className="text-sm font-medium text-gray-700">External URL</Label>
                                            <Input id="external_url" name="external_url" value={formData.external_url} onChange={handleChange} placeholder="https://example.com" className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Article Stats */}
                        {article && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900">Statistik Artikel</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Views', value: article.view_count, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Likes', value: article.like_count, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
                                            { label: 'Comments', value: article.comment_count || 0, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                                            { label: 'Shares', value: article.share_count, icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                                                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                                <div className="text-xs text-gray-500">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Publikasi</h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="content_type" className="text-sm font-medium text-gray-700">Tipe Konten</Label>
                                    <select
                                        id="content_type"
                                        name="content_type"
                                        value={formData.content_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 text-sm"
                                    >
                                        <option value="article">📝 Artikel</option>
                                        <option value="video">🎥 Video</option>
                                        <option value="document">📄 Dokumen</option>
                                        <option value="link">🔗 Link</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 text-sm"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        name="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Artikel Unggulan</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Kategori</h2>
                            </div>
                            <div className="p-6">
                                <RemoteSearchSelect
                                    fetchFn={fetchCategories}
                                    value={formData.category ?? ''}
                                    onChange={value => setFormData(p => ({ ...p, category: value ? Number(value) : null }))}
                                    placeholder="Pilih kategori artikel..."
                                    searchPlaceholder="Ketik untuk mencari kategori..."
                                    emptyText="Kategori tidak ditemukan"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
                            </div>
                            <div className="p-6">
                                {tags.length > 0 ? (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 hover:border-gray-300 transition-colors"
                                        >
                                            <span>
                                                {selectedTags.length > 0 ? `${selectedTags.length} tag dipilih` : 'Pilih tag...'}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {selectedTagObjects.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {selectedTagObjects.map(tag => (
                                                    <span
                                                        key={tag.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                                                        style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                                                    >
                                                        {tag.name}
                                                        <button type="button" onClick={() => handleTagToggle(tag.id)} className="ml-0.5 hover:opacity-70">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showTagDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowTagDropdown(false)} />
                                                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {tags.map(tag => (
                                                        <label key={tag.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => handleTagToggle(tag.id)} className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                                            <span className="text-sm text-gray-700">{tag.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-3">Belum ada tags tersedia</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || deleting}
                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Simpan Perubahan</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
