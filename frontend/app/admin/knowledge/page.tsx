'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import {
    BookOpen,
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    FileText,
    Users,
    Calendar,
    FolderTree,
    BookMarked,
    EyeOff,
    Clock,
    Star
} from 'lucide-react';
import { getArticles, getKnowledgeStats, deleteArticle, getCategories, type Article, type Category } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
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

const STATUS_RAW = ['all', 'draft', 'pending', 'approved', 'rejected', 'published', 'archived'];

export default function KnowledgePage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
    const [stats, setStats] = useState({
        total_articles: 0,
        published_articles: 0,
        draft_articles: 0,
        pending_articles: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        total_categories: 0,
        total_tags: 0,
        featured_articles: 0,
        recent_articles: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [articlesResponse, statsResponse, categoriesResponse] = await Promise.all([
                getArticles({ page: 1, per_page: 100 }),
                getKnowledgeStats().catch(() => null),
                getCategories({ is_active: true }).catch(() => null)
            ]);

            const articlesData: Article[] = articlesResponse?.results || [];
            const articlesList = Array.isArray(articlesData) ? articlesData : [];
            setArticles(articlesList);

            if (statsResponse && statsResponse.total_articles !== undefined) {
                setStats(statsResponse);
            } else if (statsResponse && (statsResponse as any).data) {
                setStats((statsResponse as any).data);
            } else {
                setStats({
                    total_articles: articlesList.length,
                    published_articles: articlesList.filter(a => a.status === 'published').length,
                    draft_articles: articlesList.filter(a => a.status === 'draft').length,
                    pending_articles: articlesList.filter(a => a.status === 'pending').length,
                    total_views: articlesList.reduce((sum, a) => sum + (a.view_count || 0), 0),
                    total_likes: articlesList.reduce((sum, a) => sum + (a.like_count || 0), 0),
                    total_comments: articlesList.reduce((sum, a) => sum + (a.comment_count || 0), 0),
                    total_categories: new Set(articlesList.map(a => a.category?.id).filter(Boolean)).size,
                    total_tags: new Set(articlesList.flatMap(a => a.tags?.map(t => t.id) || [])).size,
                    featured_articles: articlesList.filter(a => a.is_featured).length,
                    recent_articles: articlesList.filter(a => {
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return new Date(a.created_at) >= sevenDaysAgo;
                    }).length,
                });
            }

            if (categoriesResponse?.results) {
                setCategoryOptions(categoriesResponse.results);
            } else if (Array.isArray(categoriesResponse)) {
                setCategoryOptions(categoriesResponse);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', handleApiError(error));
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryOptions = useCallback(async () => {
        const active = categoryOptions.filter((c: any) => c.is_active);
        const sorted = sortCategoriesHierarchy(active);
        return [
            { value: 'all', label: t('all_categories') },
            ...sorted.map(cat => {
                const fullPath = cat.full_path || buildCategoryPath(cat, categoryOptions);
                const parts = fullPath.split(' > ');
                const depth = parts.length - 1;
                const indent = '\u00A0'.repeat(4 * depth);
                const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${cat.name}` : cat.name;
                return { value: cat.name, label };
            }),
        ];
    }, [categoryOptions]);

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await showDeleteConfirm(title, t('delete_confirm_item'));
        if (!confirmed) return;
        try {
            await deleteArticle(id);
            showToast(t('delete_success', { title }), 'success');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), t('delete_error'));
        }
    };

    const statuses = ['all', 'draft', 'pending', 'published', 'archived'];

    const filteredArticles = articles.filter(article => {
        if (!article) return false;
        const matchesSearch = (article.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (article.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (article.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            (article.category && article.category.name === selectedCategory);
        const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-100 text-green-700 border-0"><Eye className="w-3 h-3 mr-1" />{t('status_published')}</Badge>;
            case 'draft':
                return <Badge className="bg-yellow-100 text-yellow-700 dark:text-yellow-300 border-0"><EyeOff className="w-3 h-3 mr-1" />{t('status_draft')}</Badge>;
            case 'pending':
                return <Badge className="bg-blue-100 text-blue-700 dark:text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />{t('status_pending')}</Badge>;
            case 'archived':
                return <Badge className="bg-muted text-card-foreground border-0">{t('status_archived')}</Badge>;
            default:
                return <Badge className="bg-muted text-card-foreground border-0">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-muted rounded-2xl"></div>
                    <div className="h-16 bg-muted rounded-xl"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-56 bg-muted rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                <p className="text-emerald-100 text-sm">{t('page_desc')}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push('/admin/knowledge/create')}
                                className="inline-flex items-center gap-2 bg-card text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-4 h-4" /> {t('add_article')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: t('stats_total_articles'), value: stats.total_articles, icon: BookOpen, color: 'bg-emerald-400/20 text-emerald-200' },
                            { label: t('stats_published'), value: stats.published_articles, icon: FileText, color: 'bg-green-400/20 text-green-200' },
                            { label: t('stats_total_views'), value: stats.total_views, icon: Eye, color: 'bg-blue-400/20 text-blue-200' },
                            { label: t('stats_categories'), value: stats.total_categories, icon: FolderTree, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-emerald-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <RemoteSearchSelect
                            fetchFn={fetchCategoryOptions}
                            value={selectedCategory}
                            onChange={value => setSelectedCategory(value || 'all')}
                            placeholder={t('filter_category')}
                            searchPlaceholder={t('search_category')}
                            emptyText={t('empty_category')}
                            className="w-72"
                        />
                        <RemoteSearchSelect
                            fetchFn={async () => STATUS_RAW.map(v => ({
                                value: v,
                                label: v === 'all' ? t('all_status') : t(`status_${v}`)
                            }))}
                            value={selectedStatus}
                            onChange={value => setSelectedStatus(value || 'all')}
                            placeholder={t('filter_status')}
                            searchPlaceholder={t('search_status')}
                            emptyText={t('empty_status')}
                            className="w-72"
                        />
                    </div>
                </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-emerald-100 transition-all group"
                        >
                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {article.is_featured && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                            )}
                                            <h3 className="font-semibold text-card-foreground truncate">{article.title}</h3>
                                        </div>
                                    </div>
                                    {getStatusBadge(article.status)}
                                </div>

                                {/* Excerpt */}
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {article.excerpt || article.content}
                                </p>

                                {/* Category & Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {article.category && (
                                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">
                                            <span dangerouslySetInnerHTML={{ __html: article.category.name }} />
                                        </Badge>
                                    )}
                                    {article.tags && article.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                                            style={{
                                                backgroundColor: `${tag.color}15`,
                                                color: tag.color
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                    {article.tags && article.tags.length > 3 && (
                                        <span className="text-xs text-muted-foreground">+{article.tags.length - 3}</span>
                                    )}
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {article.author?.name || article.author?.username || '-'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {article.view_count}
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(article.updated_at).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex border-t border-border">
                                <button
                                    onClick={() => router.push(`/knowledge/${article.slug || article.id}`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors rounded-bl-xl"
                                >
                                    <Edit className="w-3.5 h-3.5" /> {t('edit')}
                                </button>
                                <div className="w-px bg-muted" />
                                <button
                                    onClick={() => handleDelete(article.id, article.title)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50/50 transition-colors rounded-br-xl"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                            ? t('no_articles_found')
                            : t('no_articles')}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                            ? t('try_adjust_filter')
                            : t('start_create_first')}
                    </p>
                    <button
                        onClick={() => router.push('/admin/knowledge/create')}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4" /> {t('add_article')}
                    </button>
                </div>
            )}
        </div>
    );
}
