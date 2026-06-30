'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tag as TagIcon,
    Plus,
    Search,
    Edit,
    Trash2,
    Palette,
    Tags,
    Hash
} from 'lucide-react';
import { getTags, deleteTag, type Tag } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

export default function TagsPage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge_tags');
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const response = await getTags();
            const data: Tag[] = response?.results || [];
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch tags:', handleApiError(error));
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showDeleteConfirm(name, t('delete_confirm_item'));
        if (!confirmed) return;
        try {
            await deleteTag(id);
            showToast(t('delete_success', { name }), 'success');
            fetchTags();
        } catch (error) {
            showError(handleApiError(error), t('delete_error'));
        }
    };

    const filteredTags = tags.filter(tag => {
        if (!tag) return false;
        return (tag.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tag.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-muted rounded-2xl"></div>
                    <div className="h-12 bg-muted rounded-xl"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-36 bg-muted rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <TagIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                                <p className="text-orange-100 text-sm">{t('page_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/admin/knowledge/tags/create')}
                            className="inline-flex items-center gap-2 bg-card text-orange-700 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> {t('add')}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: t('stats_total'), value: tags.length, icon: TagIcon, color: 'bg-orange-400/20 text-orange-200' },
                            { label: t('stats_active'), value: tags.filter(t => t.is_active).length, icon: Palette, color: 'bg-green-400/20 text-green-200' },
                            { label: t('stats_articles'), value: tags.reduce((sum, tag) => sum + (tag.article_count || 0), 0), icon: Hash, color: 'bg-blue-400/20 text-blue-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-orange-200">{stat.label}</p>
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
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-muted focus:bg-card transition-colors text-sm"
                    />
                </div>
            </div>

            {/* Tags Grid */}
            {filteredTags.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTags.map((tag) => (
                        <div
                            key={tag.id}
                            className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-orange-100 transition-all group"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            {tag.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-card-foreground">{tag.name}</h3>
                                            <p className="text-xs text-muted-foreground">#{tag.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => router.push(`/knowledge/tags/${tag.id}`)}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={() => handleDelete(tag.id, tag.name)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {tag.description && (
                                    <p className="text-sm text-card-foreground mb-4 line-clamp-2">
                                        {tag.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
                                        style={{
                                            backgroundColor: `${tag.color}15`,
                                            color: tag.color
                                        }}
                                    >
                                        <Tags className="w-3 h-3" />
                                        {t('article_count', { count: tag.article_count || 0 })}
                                    </span>
                                    {!tag.is_active && (
                                        <Badge className="bg-muted text-card-foreground text-xs border-0">
                                            {t('inactive_badge')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                        <TagIcon className="w-8 h-8 text-orange-500" />
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
                        onClick={() => router.push('/admin/knowledge/tags/create')}
                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-200"
                    >
                        <Plus className="w-4 h-4" /> {t('add')}
                    </button>
                </div>
            )}
        </div>
    );
}
