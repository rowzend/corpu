'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { ArrowLeft, Save, Loader2, Trash2, Upload, Link, Video, FileText, BookOpen, Eye, Heart, MessageCircle, Share2, ChevronDown, X, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { getArticle, updateArticle, deleteArticle, getTags, deleteArticleDocument, type Article, type Tag, type ArticleDocument } from '@/lib/api/knowledge';
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
    const t = useTranslations('admin.knowledge_form');
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
        content_type: 'article' as 'article' | 'video' | 'document' | 'link',
        status: 'draft' as const,
        is_featured: false,
        youtube_url: '',
        external_url: '',
        file_url: '',
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [existingDocuments, setExistingDocuments] = useState<ArticleDocument[]>([]);
    const [newDocuments, setNewDocuments] = useState<File[]>([]);
    const [removingDocId, setRemovingDocId] = useState<number | null>(null);

    useEffect(() => {
        if (slug) {
            fetchData();
        } else {
            setError(t('invalid_slug'));
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

            if (!articleData) throw new Error(t('not_found'));

            setArticle(articleData);
            setExistingDocuments(articleData.documents || []);
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
            if (articleData.thumbnail) {
                setThumbnailPreview(articleData.thumbnail as string);
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
                { value: '', label: t('category_placeholder') },
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
            return [{ value: '', label: t('category_placeholder') }];
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

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
            setThumbnailRemoved(false);
        }
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setThumbnailRemoved(true);
    };

    const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setFileUpload(file);
    };

    const removeFileUpload = () => setFileUpload(null);

    const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length) setNewDocuments(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeNewDocument = (index: number) => {
        setNewDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteDocument = async (doc: ArticleDocument) => {
        if (!article || removingDocId) return;
        const confirmed = await showDeleteConfirm(doc.file_name, t('delete_confirm_item'));
        if (!confirmed) return;
        setRemovingDocId(doc.id);
        try {
            await deleteArticleDocument(article.slug, doc.id);
            setExistingDocuments(prev => prev.filter(d => d.id !== doc.id));
            showToast(t('update_success'), 'success');
        } catch (err) {
            showError(handleApiError(err), t('update_error'));
        } finally {
            setRemovingDocId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            if (!article) throw new Error(t('not_found'));
            
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
                thumbnail: thumbnailRemoved ? null : (thumbnailFile || undefined),
                ...(thumbnailRemoved ? { thumbnail_remove: true } : {}),
                documents: newDocuments.length ? newDocuments : undefined,
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
                if (fileUpload) {
                    payload.file_upload = fileUpload;
                }
            } else if (formData.content_type === 'link') {
                payload.external_url = formData.external_url || '';
            }
            
            await updateArticle(article.id, payload);
            showToast(t('update_success'), 'success');
            router.push('/admin/knowledge');
        } catch (err) {
            const errorMsg = handleApiError(err);
            setError(errorMsg);
            showError(errorMsg, t('update_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!article) return;
        const confirmed = await showDeleteConfirm(article.title, t('delete_confirm_item'));
        if (!confirmed) return;
        setDeleting(true);
        try {
            await deleteArticle(article.id);
            showToast(t('delete_success', { title: article.title }), 'success');
            router.push('/admin/knowledge');
        } catch (err) {
            showError(handleApiError(err), t('delete_error'));
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
                    <div className="h-32 bg-muted rounded-2xl"></div>
                    <div className="h-96 bg-muted rounded-xl"></div>
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
                        <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
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
                            <h1 className="text-xl font-bold text-white">{t('page_title_edit')}</h1>
                            <p className="text-emerald-100 text-sm">{t('page_desc_edit')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={saving || deleting}
                        className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all"
                    >
                        {deleting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {t('deleting')}</>
                        ) : (
                            <><Trash2 className="w-4 h-4" /> {t('delete')}</>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {article?.course_title && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                    <BookOpen className="w-3.5 h-3.5" /> {t('lms_sync_badge')}
                                </span>
                                <h2 className="font-semibold text-emerald-900">{t('lms_sync_title')}</h2>
                            </div>
                            <p className="text-sm text-emerald-800 mb-1">{t('lms_sync_desc')}</p>
                            <p className="text-xs text-emerald-700/80 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {t('lms_sync_manage_hint')}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Button asChild variant="outline" className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                                <Link href={`/admin/learning/courses/${article.course_slug || ''}`}>
                                    <BookOpen className="w-4 h-4 mr-2" /> {t('lms_sync_manage')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_content')}</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium text-card-foreground">
                                        {t('label_title')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder={t('title_placeholder')}
                                        required
                                        className="border-border focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-sm font-medium text-card-foreground flex items-center gap-2">
                                        {t('label_slug')}
                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{t('slug_readonly_badge')}</span>
                                    </Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="slug"
                                            value={`/knowledge/${article?.slug || ''}`}
                                            readOnly
                                            className="pl-10 bg-muted border-border text-card-foreground cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        {t('slug_help_edit')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="excerpt" className="text-sm font-medium text-card-foreground">{t('label_excerpt')}</Label>
                                    <Textarea
                                        id="excerpt"
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleChange}
                                        placeholder={t('excerpt_placeholder')}
                                        rows={3}
                                        readOnly={!!article?.course_title}
                                        className={`border-border focus:ring-emerald-500 ${article?.course_title ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-80' : 'focus:border-emerald-500'}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {article?.course_title ? t('lms_sync_content_hint') : t('excerpt_help')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content" className="text-sm font-medium text-card-foreground flex items-center gap-2">
                                        {t('label_content')} <span className="text-red-500">*</span>
                                        {article?.course_title && (
                                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> {t('lms_sync_content_locked')}
                                            </span>
                                        )}
                                    </Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder={t('content_placeholder')}
                                        rows={15}
                                        required
                                        readOnly={!!article?.course_title}
                                        className={`font-mono border-border focus:ring-emerald-500 ${article?.course_title ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-80' : 'focus:border-emerald-500'}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {article?.course_title ? t('lms_sync_content_hint') : t('content_help')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Media Content */}
                        {formData.content_type !== 'article' && (
                            <div className="bg-card rounded-xl shadow-sm border border-border">
                                <div className="px-6 py-4 border-b border-border">
                                    <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                        {getContentTypeIcon(formData.content_type)} {t('section_media')}
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {formData.content_type === 'video' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="youtube_url" className="text-sm font-medium text-card-foreground">{t('label_youtube')}</Label>
                                            <Input id="youtube_url" name="youtube_url" value={formData.youtube_url} onChange={handleChange} placeholder={t('youtube_placeholder')} className="border-border focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                    {formData.content_type === 'document' && (
                                        <>
                                        <div className="space-y-2">
                                            <Label htmlFor="file_url" className="text-sm font-medium text-card-foreground">{t('label_file_url')}</Label>
                                            <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleChange} placeholder={t('file_url_placeholder')} className="border-border focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                        </>
                                    )}
                                    {formData.content_type === 'link' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="external_url" className="text-sm font-medium text-card-foreground">{t('label_external_url')}</Label>
                                            <Input id="external_url" name="external_url" value={formData.external_url} onChange={handleChange} placeholder={t('external_url_placeholder')} className="border-border focus:border-emerald-500 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Article Stats */}
                        {article && (
                            <div className="bg-card rounded-xl shadow-sm border border-border">
                                <div className="px-6 py-4 border-b border-border">
                                    <h2 className="text-lg font-semibold text-card-foreground">{t('section_stats')}</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: t('stat_views'), value: article.view_count, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: t('stat_likes'), value: article.like_count, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
                                            { label: t('stat_comments'), value: article.comment_count || 0, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                                            { label: t('stat_shares'), value: article.share_count, icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                                                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_publish')}</h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="content_type" className="text-sm font-medium text-card-foreground">{t('label_type')}</Label>
                                    <select
                                        id="content_type"
                                        name="content_type"
                                        value={formData.content_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted text-sm"
                                    >
                                        <option value="article">{'📝'} {t('type_article')}</option>
                                        <option value="video">{'🎥'} {t('type_video')}</option>
                                        <option value="document">{'📄'} {t('type_document')}</option>
                                        <option value="link">{'🔗'} {t('type_link')}</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-medium text-card-foreground">{t('label_status')}</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted text-sm"
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
                                        className="w-4 h-4 text-emerald-600 border-border rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-card-foreground">{t('label_featured')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_thumbnail')}</h2>
                            </div>
                            <div className="p-6">
                                {thumbnailPreview ? (
                                    <div className="relative inline-block w-full">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="h-36 w-full rounded-xl object-cover border border-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeThumbnail}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            title={t('remove_file')}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                        <span className="text-sm text-muted-foreground">{t('upload_thumbnail')}</span>
                                        <span className="text-xs text-muted-foreground">{t('upload_image_hint')}</span>
                                        <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Dokumen Lampiran */}
                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_documents')}</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {existingDocuments.length > 0 && (
                                    <div className="space-y-2">
                                        {existingDocuments.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between border border-border rounded-xl bg-muted px-3 py-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-card-foreground truncate">{doc.file_name}</p>
                                                        <p className="text-xs text-muted-foreground">{doc.file_size_display}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(doc)}
                                                    disabled={removingDocId === doc.id}
                                                    className="text-red-500 hover:text-red-600 p-1 disabled:opacity-50"
                                                    title={t('remove_document')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {newDocuments.length > 0 && (
                                    <div className="space-y-2">
                                        {newDocuments.map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between border border-border rounded-xl bg-muted px-3 py-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-card-foreground truncate">{doc.name}</p>
                                                        <p className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewDocument(index)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                    title={t('remove_document')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                    <span className="text-sm text-muted-foreground">{t('upload_documents')}</span>
                                    <span className="text-xs text-muted-foreground">{t('documents_hint')}</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                                        onChange={handleDocumentsChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_category')}</h2>
                            </div>
                            <div className="p-6">
                                <RemoteSearchSelect
                                    fetchFn={fetchCategories}
                                    value={formData.category ?? ''}
                                    onChange={value => setFormData(p => ({ ...p, category: value ? Number(value) : null }))}
                                    placeholder={t('category_placeholder')}
                                    searchPlaceholder={t('category_search')}
                                    emptyText={t('category_empty')}
                                />
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-card-foreground">{t('section_tags')}</h2>
                            </div>
                            <div className="p-6">
                                {tags.length > 0 ? (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-xl bg-muted text-sm text-card-foreground hover:border-border transition-colors"
                                        >
                                            <span>
                                                {selectedTags.length > 0 ? t('tags_selected', { count: selectedTags.length }) : t('tags_placeholder')}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
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
                                                <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {tags.map(tag => (
                                                        <label key={tag.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors">
                                                            <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => handleTagToggle(tag.id)} className="w-4 h-4 text-emerald-600 border-border rounded focus:ring-emerald-500" />
                                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                                            <span className="text-sm text-card-foreground">{tag.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-3">{t('tags_empty')}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || deleting}
                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
                            ) : (
                                <><Save className="w-4 h-4" /> {t('submit_edit')}</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
