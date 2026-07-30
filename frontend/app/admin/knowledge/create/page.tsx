'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { ArrowLeft, Save, Loader2, Upload, Link, Video, FileText, BookOpen, ChevronDown, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { createArticle, getCategories, getTags, type Category, type Tag } from '@/lib/api/knowledge';
import { api, handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

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

export default function CreateArticlePage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge_form');
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: null as number | null,
        content_type: 'article' as 'article' | 'video' | 'document' | 'link',
        status: 'draft' as 'draft' | 'pending' | 'published',
        is_featured: false,
        youtube_url: '',
        external_url: '',
        file_url: '',
    });

    useEffect(() => {
        fetchTagsData();
    }, []);

    const fetchTagsData = async () => {
        try {
            const response = await getTags();
            setTags(response?.results || []);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
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

    // Fetch tags untuk dropdown (reusable)
    const fetchTags = async (): Promise<{ value: string | number; label: string }[]> => {
        try {
            const allTags: any[] = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res: any = await api.get('knowledge/tags/', { page, page_size: 100 }, true);
                if (res?.results) allTags.push(...res.results);
                hasMore = !!res?.next;
                page++;
            }
            
            const sorted = allTags
                .filter(t => t.is_active)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            return sorted.map(tag => ({ 
                value: tag.id, 
                label: tag.name 
            }));
        } catch {
            return [];
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

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

    const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, tags: selectedTags };
            await createArticle(payload as any);
            showToast(t('create_success'), 'success');
            router.push('/admin/knowledge');
        } catch (err) {
            showError(handleApiError(err), t('create_error'));
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            disabled={loading}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{t('page_title_create')}</h1>
                            <p className="text-emerald-100 text-sm">{t('page_desc_create')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t('knowledge_base_badge')}
                    </div>
                </div>
            </div>

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
                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{t('slug_auto_badge')}</span>
                                    </Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="slug"
                                            value={t('slug_placeholder_create')}
                                            readOnly
                                            className="pl-10 bg-muted border-border text-card-foreground cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        {t('slug_help_create')}
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
                                        className="border-border focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('excerpt_help')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content" className="text-sm font-medium text-card-foreground">
                                        {t('label_content')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder={t('content_placeholder')}
                                        rows={15}
                                        required
                                        className="font-mono border-border focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('content_help')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Media Content */}
                        {formData.content_type !== 'article' && (
                            <div className="bg-card rounded-xl shadow-sm border border-border">
                                <div className="px-6 py-4 border-b border-border">
                                    <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                        {getContentTypeIcon(formData.content_type)}
                                        {t('section_media')}
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {formData.content_type === 'video' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="youtube_url" className="text-sm font-medium text-card-foreground">{t('label_youtube')}</Label>
                                            <Input
                                                id="youtube_url"
                                                name="youtube_url"
                                                value={formData.youtube_url}
                                                onChange={handleChange}
                                                placeholder={t('youtube_placeholder')}
                                                className="border-border focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                    )}
                                    {formData.content_type === 'document' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="file_url" className="text-sm font-medium text-card-foreground">{t('label_file_url')}</Label>
                                            <Input
                                                id="file_url"
                                                name="file_url"
                                                value={formData.file_url}
                                                onChange={handleChange}
                                                placeholder={t('file_url_placeholder')}
                                                className="border-border focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                    )}
                                    {formData.content_type === 'link' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="external_url" className="text-sm font-medium text-card-foreground">{t('label_external_url')}</Label>
                                            <Input
                                                id="external_url"
                                                name="external_url"
                                                value={formData.external_url}
                                                onChange={handleChange}
                                                placeholder={t('external_url_placeholder')}
                                                className="border-border focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish Settings */}
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
                                        <option value="pending">Pending Approval</option>
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

                        {/* Category */}
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

                        {/* Tags */}
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
                                                {selectedTags.length > 0
                                                    ? t('tags_selected', { count: selectedTags.length })
                                                    : t('tags_placeholder')}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {selectedTagObjects.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {selectedTagObjects.map(tag => (
                                                    <span
                                                        key={tag.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                                                        style={{
                                                            backgroundColor: `${tag.color}15`,
                                                            color: tag.color
                                                        }}
                                                    >
                                                        {tag.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTagToggle(tag.id)}
                                                            className="ml-0.5 hover:opacity-70"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showTagDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowTagDropdown(false)} />
                                                <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {tags.map(tag => (
                                                        <label
                                                            key={tag.id}
                                                            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTags.includes(tag.id)}
                                                                onChange={() => handleTagToggle(tag.id)}
                                                                className="w-4 h-4 text-emerald-600 border-border rounded focus:ring-emerald-500"
                                                            />
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: tag.color }}
                                                            />
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('saving')}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {t('submit_create')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
