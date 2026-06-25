'use client';

import { useState, useEffect } from 'react';
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
    Download
} from 'lucide-react';
import { getPublicArticle, likeArticle, shareArticle, type Article } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import CommentSection from '@/components/CommentSection';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { user, isAuthenticated } = useAuth();

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liking, setLiking] = useState(false);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchArticle();
        }
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await getPublicArticle(slug);
            const articleData: Article = response?.data || response as Article;

            if (!articleData) {
                throw new Error('Artikel tidak ditemukan');
            }

            setArticle(articleData);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!article || liking) return;

        // Check if user is authenticated
        if (!isAuthenticated) {
            alert('Silakan login terlebih dahulu untuk menyukai artikel ini.');
            return;
        }

        try {
            setLiking(true);
            await likeArticle(article.id, true);
            // Update local state
            setArticle(prev => prev ? {
                ...prev,
                like_count: prev.like_count + 1
            } : null);
        } catch (error) {
            console.error('Failed to like article:', handleApiError(error));
            alert('Gagal menyukai artikel: ' + handleApiError(error));
        } finally {
            setLiking(false);
        }
    };

    const handleShare = async () => {
        if (!article || sharing) return;

        try {
            setSharing(true);
            
            // Only track share on backend if authenticated
            if (isAuthenticated) {
                await shareArticle(article.id);
                // Update local state
                setArticle(prev => prev ? {
                    ...prev,
                    share_count: prev.share_count + 1
                } : null);
            }

            // Copy to clipboard or use native share
            if (navigator.share) {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt || article.content.substring(0, 200),
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link artikel telah disalin ke clipboard!');
            }
        } catch (error) {
            console.error('Failed to share article:', handleApiError(error));
            // Don't show error for share, as clipboard copy might still work
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
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <Download className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">Dokumen Terlampir</h3>
                                            <p className="text-sm text-gray-600">
                                                {article.file_type && `Format: ${article.file_type}`}
                                                {article.file_size && ` • Ukuran: ${Math.round(article.file_size / 1024)} KB`}
                                            </p>
                                        </div>
                                        <Button asChild>
                                            <a href={article.file_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
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
                    return (
                        <div className="mb-8">
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">Link Eksternal</h3>
                                            <p className="text-sm text-gray-600 break-all">
                                                {article.external_url}
                                            </p>
                                        </div>
                                        <Button asChild>
                                            <a href={article.external_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Buka Link
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                }
                break;
        }

        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-12 text-center">
                            <div className="text-6xl mb-4">😞</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
                            <p className="text-gray-600 mb-6">
                                {error || 'Artikel yang Anda cari tidak tersedia atau telah dihapus.'}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={() => router.back()}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/kms">
                                        Lihat Semua Artikel
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <div className="mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                {/* Article Header */}
                <Card className="mb-8">
                    <CardContent className="p-8">
                        {/* Meta Info */}
                        <div className="flex items-center gap-2 mb-4">
                            {article.category && (
                                <Badge className="bg-indigo-100 text-indigo-800">
                                    {article.category.name}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="flex items-center gap-1">
                                {getContentTypeIcon(article.content_type)}
                                {article.content_type}
                            </Badge>
                            {article.is_featured && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                    ⭐ Featured
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                {article.excerpt}
                            </p>
                        )}

                        {/* Author & Meta */}
                        <div className="flex items-center justify-between border-t pt-6">
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{article.author?.name || article.author?.username}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{Math.ceil(article.content.length / 1000)} min read</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        <span>{article.view_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                        <span>{article.like_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{article.comment_count || 0}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLike}
                                        disabled={liking || !isAuthenticated}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title={!isAuthenticated ? 'Login untuk menyukai artikel' : 'Suka artikel ini'}
                                    >
                                        <Heart className="w-4 h-4 mr-1" />
                                        Like
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleShare}
                                        disabled={sharing}
                                        title="Bagikan artikel ini"
                                    >
                                        <Share2 className="w-4 h-4 mr-1" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Media Content */}
                {renderMediaContent()}

                {/* Article Content */}
                <Card className="mb-8">
                    <CardContent className="p-8">
                        <div className="prose prose-lg max-w-none">
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {article.content}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                    <Card className="mb-8">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
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

                {/* Comment Section */}
                <Card className="mb-8">
                    <CardContent className="p-8">
                        <CommentSection
                            articleSlug={slug}
                            currentUserId={user?.id}
                            isAuthenticated={isAuthenticated}
                        />
                    </CardContent>
                </Card>

                {/* Back to KMS */}
                <div className="text-center">
                    <Button asChild size="lg">
                        <Link href="/kms">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Lihat Artikel Lainnya
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}