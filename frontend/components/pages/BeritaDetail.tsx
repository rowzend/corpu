'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, Share2, Newspaper, Loader2 } from 'lucide-react';
import { newsService } from '@/lib/services';

export default function BeritaDetailPage({ basePath = '/berita' }: { basePath?: string }) {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, [slug]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNewsBySlug(slug);
            setNews(res?.data || null);
        } catch {
            setNews(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!news) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="text-center">
                    <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">Berita Tidak Ditemukan</h3>
                    <p className="text-muted-foreground mb-6">Berita yang Anda cari tidak tersedia.</p>
                    <Link href={basePath} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium">
                        ← Kembali ke Berita
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-muted">
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mb-4">
                            {news.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4 leading-tight">
                            {news.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {news.published_at
                                    ? new Date(news.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                {news.views || 0} dilihat
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-muted-foreground">Oleh: {news.author || 'Admin'}</span>
                        </div>
                    </div>

                    {news.thumbnail && (
                        <div className="rounded-2xl overflow-hidden mb-10">
                            <img src={news.thumbnail} alt={news.title} className="w-full h-auto object-cover max-h-[500px]" />
                        </div>
                    )}

                    <div className="bg-card rounded-2xl shadow-sm p-8 md:p-12">
                        <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                            {news.content}
                        </div>

                        <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Kembali
                            </button>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: news.title, url: window.location.href });
                                    }
                                }}
                                className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <Share2 className="w-4 h-4" /> Bagikan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
