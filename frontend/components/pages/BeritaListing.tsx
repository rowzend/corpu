'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Calendar, Eye, ArrowRight, Newspaper, Search, Loader2 } from 'lucide-react';
import { newsService } from '@/lib/services';
import { getCategoryColor } from '@/lib/colors';

export default function BeritaPage({ basePath = '/berita' }: { basePath?: string }) {
    const t = useTranslations('news');
    const tc = useTranslations('common');
    const [news, setNews] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const perPage = 9;

    useEffect(() => {
        fetchNews();
    }, [page]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNews(page, perPage);
            setNews(res?.data || []);
            setTotal(res?.total || 0);
        } catch {
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = search
        ? news.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()))
        : news;

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="min-h-screen bg-muted">
            <section className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                            <Newspaper className="w-4 h-4" />
                            <span>{t('badge')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('page_title')}</h1>
                        <p className="text-xl text-primary-foreground/80 mb-8">
                            {t('page_subtitle')}
                        </p>
                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
                <div className="container mx-auto px-4 py-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold text-card-foreground mb-2">{t('no_news')}</h3>
                        <p className="text-muted-foreground">{t('no_news_desc')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.map((item) => (
                                <Link
                                    key={item.id}
                                     href={`${basePath}/${item.slug || item.id}`}
                                    className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="h-48 bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-6xl relative overflow-hidden">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <Newspaper className="w-16 h-16 text-white/40" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(item.category).bg} ${getCategoryColor(item.category).text}`} dangerouslySetInnerHTML={{ __html: item.category }}>
                                        </span>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : item.created_at}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                {item.views || 0} {tc('views')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            <span dangerouslySetInnerHTML={{ __html: item.title }} />
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: item.excerpt || item.content?.substring(0, 200) }}>
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                                            {t('read_more')} <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-12">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${
                                            p === page
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
                </div>
            </section>
        </div>
    );
}
