'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FolderTree,
    Plus,
    Search,
    Edit,
    Trash2,
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    Layers,
    GitFork
} from 'lucide-react';
import { getCategories, deleteCategory, type Category } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

export default function CategoriesPage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge_categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories();
            let data: Category[] = [];
            if (response?.results) data = response.results;
            else if ((response as any)?.data) data = (response as any).data;
            else if (Array.isArray(response)) data = response;
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch categories:', handleApiError(error));
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showDeleteConfirm(name, t('delete_confirm_item'));
        if (!confirmed) return;
        try {
            await deleteCategory(id);
            showToast(t('delete_success', { name }), 'success');
            fetchCategories();
        } catch (error) {
            showError(handleApiError(error), t('delete_error'));
        }
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedCategories(newExpanded);
    };

    const buildTree = (items: Category[]): Category[] => {
        const map = new Map<number, Category>();
        const roots: Category[] = [];
        items.forEach(item => map.set(item.id, { ...item, children: [] }));
        items.forEach(item => {
            const node = map.get(item.id)!;
            if (item.parent) {
                const parent = map.get(item.parent);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });
        return roots;
    };

    const filteredCategories = categories.filter(cat => {
        if (!cat) return false;
        return (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const categoryTree = buildTree(filteredCategories);

    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div key={category.id}>
                <div
                    className={`flex items-center justify-between p-3.5 rounded-lg transition-all group ${
                        level === 0
                            ? 'bg-muted/50 hover:bg-muted/80'
                            : 'hover:bg-muted'
                    }`}
                    style={{ paddingLeft: `${level * 24 + 14}px` }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="text-muted-foreground hover:text-card-foreground flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            <div className="w-5" />
                        )}

                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            isExpanded ? 'bg-emerald-100' : 'bg-muted'
                        }`}>
                            {isExpanded ? (
                                <FolderOpen className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <Folder className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-medium truncate ${
                                    level === 0 ? 'text-card-foreground' : 'text-card-foreground'
                                }`}>
                                    {category.name}
                                </span>
                                <Badge variant="secondary" className="text-xs bg-white/80 border-0">
                                    {t('article_count', { count: category.article_count || 0 })}
                                </Badge>
                                {!category.is_active && (
                                    <Badge className="bg-muted text-card-foreground text-xs border-0">
                                        {t('inactive_badge')}
                                    </Badge>
                                )}
                            </div>
                            {category.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{category.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/admin/knowledge/categories/${category.id}`)}
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(category.id, category.name)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="ml-3 border-l-2 border-emerald-100 pl-1">
                        {category.children!.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-muted rounded-2xl"></div>
                    <div className="h-12 bg-muted rounded-xl"></div>
                    <div className="h-80 bg-muted rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <FolderTree className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                <p className="text-violet-100 text-sm">{t('page_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/admin/knowledge/categories/create')}
                            className="inline-flex items-center gap-2 bg-card text-violet-700 hover:bg-violet-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> {t('add')}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: t('stats_total'), value: categories.length, icon: FolderTree, color: 'bg-violet-400/20 text-violet-200' },
                            { label: t('stats_parent'), value: categories.filter(c => !c.parent).length, icon: Layers, color: 'bg-green-400/20 text-green-200' },
                            { label: t('stats_child'), value: categories.filter(c => c.parent).length, icon: GitFork, color: 'bg-blue-400/20 text-blue-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-violet-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-muted focus:bg-card transition-colors text-sm"
                    />
                </div>
            </div>

            {/* Category Tree */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-card-foreground">{t('section_list')}</h2>
                </div>
                <div className="p-4">
                    {categoryTree.length > 0 ? (
                        <div className="space-y-0.5">
                            {categoryTree.map(category => renderCategory(category))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                                <FolderTree className="w-8 h-8 text-violet-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                                {searchTerm ? t('not_found') : t('empty_title')}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchTerm
                                    ? t('try_adjust_search')
                                    : t('start_create')}
                            </p>
                            <button
                                onClick={() => router.push('/admin/knowledge/categories/create')}
                                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-violet-200"
                            >
                                <Plus className="w-4 h-4" /> {t('add')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
