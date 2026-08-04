'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    Calendar,
    User,
    Clock,
    BookOpen,
    ExternalLink,
    Play,
    Download,
    LogIn
} from 'lucide-react';
import { getPublicArticle, likeArticle, shareArticle, type Article } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import CommentSection from '@/components/CommentSection';
import { authService } from '@/lib/services';
import { getCategoryColor } from '@/lib/colors';
import { showConfirm, showError } from '@/lib/sweetalert';

export default function KMSDetailPage({ basePath = '/kms' }: { basePath?: string }) {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('kms_page');
    const tc = useTranslations('common');
    const ta = useTranslations('auth');
    const slug = params.slug as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liking, setLiking] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
        setUser(authService.getCurrentUser());
        if (slug) fetchArticle();
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await getPublicArticle(slug);
            const articleData: Article = response?.data || response as Article;
            if (!articleData) throw new Error(t('article_not_found'));
            setArticle(articleData);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const requireAuth = () => {
        if (!authService.isAuthenticated()) {
            showConfirm(
                ta('login_required_desc'),
                ta('login_required'),
                ta('login_submit'),
                tc('cancel')
            ).then((confirmed) => {
                if (confirmed) router.push('/login');
            });
            return false;
        }
        return true;
    };

    const handleLike = async () => {
        if (!article || liking) return;
        if (!requireAuth()) return;

        try {
            setLiking(true);
            await likeArticle(article.id, true);
            setArticle(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null);
        } catch (error) {
            showError(handleApiError(error), t('like_error'));
        } finally {
            setLiking(false);
        }
    };

    const handleShare = async () => {
        if (!article || sharing) return;

        try {
            setSharing(true);
            if (isAuthenticated) {
                await shareArticle(article.id);
                setArticle(prev => prev ? { ...prev, share_count: prev.share_count + 1 } : null);
            }
            if (navigator.share) {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt || article.content.substring(0, 200),
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert(t('link_copied'));
            }
        } catch (error) {
            console.error('Failed to share article:', handleApiError(error));
        } finally {
            setSharing(false);
        }
    };

    const getContentTypeIcon = (contentType: string) => {
        switch (contentType) {
            case 'video': return <Play className="w-5 h-5" />;
            case 'document': return <Download className="w-5 h-5" />;
            case 'link': return <ExternalLink className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    const isGoogleDriveUrl = (url: string) =>
        url.includes('drive.google.com') || url.includes('docs.google.com');

    const getGoogleDriveEmbedUrl = (url: string) => {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
        return null;
    };

    const renderMediaContent = () => {
        if (!article) return null;
        switch (article.content_type) {
            case 'video':
                if (article.youtube_embed_id) {
                    return (
                        <div className="mb-8">
                            <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${article.youtube_embed_id}`}
                                    title={article.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    );
                }
                break;
            case 'document':
                if (article.file_url) {
                    return (
                        <div className="mb-8">
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                                            <Download className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-card-foreground">{t('attached_document')}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {article.file_type && `Format: ${article.file_type}`}
                                                {article.file_size && ` • Ukuran: ${Math.round(article.file_size / 1024)} KB`}
                                            </p>
                                        </div>
                                        <Button asChild>
                                            <a href={article.file_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4 mr-2" /> {tc('download')}
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                }
                break;
            case 'link':
                if (article.external_url) {
                    const driveEmbedUrl = isGoogleDriveUrl(article.external_url) ? getGoogleDriveEmbedUrl(article.external_url) : null;
                    return (
                        <div className="mb-8">
                            {driveEmbedUrl ? (
                                <Card className="border-primary/20 bg-primary/5">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                                                <ExternalLink className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1">
<h3 className="font-semibold text-card-foreground">{t('google_drive')}</h3>
                                                 <p className="text-sm text-muted-foreground break-all">{article.external_url}</p>
                                             </div>
                                             <Button asChild>
                                                 <a href={article.external_url} target="_blank" rel="noopener noreferrer">
                                                     <ExternalLink className="w-4 h-4 mr-2" /> {t('open_link')}
                                                 </a>
                                             </Button>
                                         </div>
                                         <div className="aspect-video rounded-lg overflow-hidden border border-border bg-card">
                                             <iframe
                                                 src={driveEmbedUrl}
                                                 className="w-full h-full"
                                                 title={article.title}
                                                 allowFullScreen
                                             />
                                         </div>
                                         <p className="text-xs text-muted-foreground">
                                             {t('google_drive_help')}
                                         </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-primary/20 bg-primary/5">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                                                <ExternalLink className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1">
<h3 className="font-semibold text-card-foreground">{t('external_link')}</h3>
                                                 <p className="text-sm text-muted-foreground break-all">{article.external_url}</p>
                                             </div>
                                             <Button asChild>
                                                 <a href={article.external_url} target="_blank" rel="noopener noreferrer">
                                                     <ExternalLink className="w-4 h-4 mr-2" /> {t('open_link')}
                                                 </a>
                                             </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    );
                }
                break;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="h-12 bg-muted rounded"></div>
                        <div className="h-64 bg-muted rounded"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                            <div className="h-4 bg-muted rounded w-4/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-muted py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-12 text-center">
                            <div className="text-6xl mb-4">😞</div>
                            <h2 className="text-2xl font-bold text-card-foreground mb-2">{t('article_not_found_title')}</h2>
                            <p className="text-muted-foreground mb-6">{error || t('article_not_found_desc')}</p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={() => router.back()}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> {tc('back')}
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={basePath}>{t('view_all_articles')}</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted py-16">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> {tc('back')}
                    </Button>
                </div>

                <Card className="mb-8">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-2 mb-4">
                            {article.category && (() => {
                                const c = article.category!;
                                const catColor = getCategoryColor(c.name);
                                return <Badge className={`${catColor.bg} ${catColor.text}`}><span dangerouslySetInnerHTML={{ __html: c.name }} /></Badge>;
                            })()}
                            <Badge variant="secondary" className="flex items-center gap-1">
                                {getContentTypeIcon(article.content_type)} {article.content_type}
                            </Badge>
                            {article.is_featured && (
                                <Badge className="bg-accent/10 text-accent">⭐ {t('featured')}</Badge>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold text-card-foreground mb-4 leading-tight">{article.title}</h1>

                        {article.excerpt && (
                            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{article.excerpt}</p>
                        )}

                        <div className="flex items-center justify-between border-t pt-6">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{article.author?.name || article.author?.username}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{t('min_read', { count: Math.ceil(article.content.length / 1000) })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" /> <span>{article.view_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4" /> <span>{article.like_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" /> <span>{article.comment_count || 0}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLike}
                                        disabled={liking}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <Heart className="w-4 h-4 mr-1" /> {tc('like')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleShare}
                                        disabled={sharing}
                                    >
                                        <Share2 className="w-4 h-4 mr-1" /> {t('share')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {renderMediaContent()}

                <Card className="mb-8">
                    <CardContent className="p-8">
                        <div className="prose prose-lg max-w-none prose-headings:text-card-foreground prose-a:text-primary prose-img:rounded-xl">
                            <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: article.content }} />
                        </div>
                    </CardContent>
                </Card>

                {article.tags && article.tags.length > 0 && (
                    <Card className="mb-8">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-card-foreground mb-4">{t('tags')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {article.tags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="cursor-pointer hover:opacity-80"
                                        style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                            borderColor: `${tag.color}40`
                                        }}
                                    >
                                        #{tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="mb-8">
                    <CardContent className="p-8">
<CommentSection
    articleSlug={slug}
    currentUserId={user?.id}
    isAuthenticated={isAuthenticated}
    currentUserIsStaff={user?.is_staff}
/>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button asChild size="lg">
                        <Link href={basePath}>
                            <BookOpen className="w-4 h-4 mr-2" /> {t('view_other_articles')}
                        </Link>
                    </Button>
                </div>
                </div>
            </div>
        </div>
    );
}
