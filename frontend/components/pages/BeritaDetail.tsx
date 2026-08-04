'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Calendar, Eye, Clock, User, Share2, Newspaper, Loader2, Check, Copy } from 'lucide-react';

import { newsService } from '@/lib/services';

function readingTime(text: string): number {
    const words = text?.trim().split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch { return dateStr; }
}

export default function BeritaDetailPage({ basePath = '/berita' }: { basePath?: string }) {
    const t = useTranslations('news');
    const tc = useTranslations('common');
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const contentRef = useRef<HTMLDivElement>(null);

    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [copied, setCopied] = useState(false);

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

    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = news?.title || '';

    const handleShare = (platform: string) => {
        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
        };
        if (platform === 'copy') {
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
            return;
        }
        if (platform === 'native' && navigator.share) {
            navigator.share({ title: shareTitle, url: shareUrl });
            return;
        }
        window.open(urls[platform], '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!news) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="text-center">
                    <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{t('news_not_found_title')}</h3>
                    <p className="text-muted-foreground mb-6">{t('news_not_found_desc')}</p>
                    <Link href={basePath} className="text-primary hover:text-primary/80 font-medium">
                        ← {t('back_to_news')}
                    </Link>
                </div>
            </div>
        );
    }

    const readTime = readingTime(news.content);

    return (
        <article className="min-h-screen bg-background">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress * 100}%` }}
                />
            </div>

            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[420px] overflow-hidden">
                {news.thumbnail ? (
                    <img
                        src={news.thumbnail}
                        alt={news.title}
                        className="w-full h-full object-cover scale-105 transition-transform duration-[2s] group-hover:scale-100"
                        style={{ transform: `scale(${1.05 - scrollProgress * 0.05})` }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
                        <div className="text-center">
                            <Newspaper className="w-24 h-24 text-white/10 mx-auto mb-4" />
                            <span className="text-white/30 text-lg font-medium">{news.category}</span>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background/80" />

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-background/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-xl hover:bg-background/20 hover:border-white/40 transition-all shadow-lg"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{tc('back')}</span>
                </button>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
                    <div className="container mx-auto max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/25" dangerouslySetInnerHTML={{ __html: news.category }} />
                            <span className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                {readTime} min read
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                            <span dangerouslySetInnerHTML={{ __html: news.title }} />
                        </h1>
                        {news.excerpt && (
                            <p className="text-base md:text-lg text-white/70 max-w-2xl leading-relaxed line-clamp-2">
                                {news.excerpt}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative z-10 -mt-10">
                <div className="container mx-auto px-4 pb-16">
                    <div className="max-w-4xl mx-auto">
                        {/* Meta Bar */}
                        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                        {(news.author || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-card-foreground">{news.author || 'Admin'}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(news.published_at || news.created_at)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4" />
                                    {news.views || 0} {tc('views')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {readTime} min read
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                                #{news.category?.replace(/\s+/g, '_').toLowerCase()}
                            </span>
                        </div>

                        {/* Article Content */}
                        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 md:p-12" ref={contentRef}>
                            <div className="prose prose-lg max-w-none prose-headings:text-card-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-muted prose-pre:border prose-pre:border-border text-card-foreground leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:mt-1" dangerouslySetInnerHTML={{ __html: news.content }} />
                        </div>

                        {/* Share & Navigation */}
                        <div className="mt-8 bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <p className="text-sm font-semibold text-card-foreground mb-3">{tc('share')}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-all"
                                            title="WhatsApp"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        </button>
                                        <button
                                            onClick={() => handleShare('facebook')}
                                            className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 flex items-center justify-center transition-all"
                                            title="Facebook"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        </button>
                                        <button
                                            onClick={() => handleShare('twitter')}
                                            className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 text-foreground hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center transition-all"
                                            title="X (Twitter)"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        </button>
                                        <button
                                            onClick={() => handleShare('copy')}
                                            className="w-10 h-10 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all"
                                            title="Copy link"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Link
                                    href={basePath}
                                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t('back_to_news')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
