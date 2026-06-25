'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { Comment, getComments, addComment, likeComment, deleteComment, updateComment } from '@/lib/api/knowledge';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { showConfirm, showError } from '@/lib/sweetalert';

interface CommentSectionProps {
    articleSlug: string;
    currentUserId?: number;
    isAuthenticated: boolean;
    currentUserIsStaff?: boolean;
}

export default function CommentSection({
    articleSlug,
    currentUserId,
    isAuthenticated,
    currentUserIsStaff,
}: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Load comments
    useEffect(() => {
        loadComments();
    }, [articleSlug]);

    const loadComments = async (pageNum: number = 1) => {
        try {
            setLoading(pageNum === 1);
            setLoadingMore(pageNum > 1);
            setError(null);

            const response = await getComments(articleSlug, {
                parent: null, // Only top-level comments
                page: pageNum,
                per_page: 10,
            });

            if (pageNum === 1) {
                setComments(response.results);
            } else {
                setComments(prev => [...prev, ...response.results]);
            }

            setHasMore(!!response.next);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Failed to load comments:', err);
            setError(err.message || 'Gagal memuat komentar');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleAddComment = async (content: string) => {
        try {
            const comment = await addComment(articleSlug, { content });
            setComments(prev => [comment, ...prev]);
        } catch (err: any) {
            console.error('Failed to add comment:', err);
            throw err;
        }
    };

    const handleReply = async (parentId: number, content: string) => {
        try {
            const reply = await addComment(articleSlug, {
                content,
                parent: parentId,
            });

            // Add reply to parent comment
            setComments(prev =>
                prev.map(comment => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), reply],
                            reply_count: (comment.reply_count || 0) + 1,
                        };
                    }
                    // Check nested replies
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: addReplyToNested(comment.replies, parentId, reply),
                        };
                    }
                    return comment;
                })
            );
        } catch (err: any) {
            console.error('Failed to add reply:', err);
            throw err;
        }
    };

    // Helper function to add reply to nested comments
    const addReplyToNested = (replies: Comment[], parentId: number, newReply: Comment): Comment[] => {
        return replies.map(reply => {
            if (reply.id === parentId) {
                return {
                    ...reply,
                    replies: [...(reply.replies || []), newReply],
                    reply_count: (reply.reply_count || 0) + 1,
                };
            }
            if (reply.replies) {
                return {
                    ...reply,
                    replies: addReplyToNested(reply.replies, parentId, newReply),
                };
            }
            return reply;
        });
    };

    const handleLike = async (commentId: number, isLike: boolean) => {
        try {
            await likeComment(commentId, isLike);
            // Update handled optimistically in CommentItem
        } catch (err: any) {
            console.error('Failed to like comment:', err);
            throw err;
        }
    };

    const handleDelete = async (commentId: number) => {
        const confirmed = await showConfirm(
            'Apakah Anda yakin ingin menghapus komentar ini?',
            'Hapus Komentar',
            'Hapus',
            'Batal'
        );
        if (!confirmed) return;

        try {
            await deleteComment(commentId);
            // Remove comment from list
            setComments(prev => removeCommentById(prev, commentId));
        } catch (err: any) {
            showError('Gagal menghapus komentar', 'Error');
        }
    };

    // Helper function to remove comment by ID (including nested)
    const removeCommentById = (comments: Comment[], commentId: number): Comment[] => {
        return comments
            .filter(comment => comment.id !== commentId)
            .map(comment => ({
                ...comment,
                replies: comment.replies ? removeCommentById(comment.replies, commentId) : undefined,
            }));
    };

    const handleUpdate = async (commentId: number, content: string) => {
        try {
            const response = await updateComment(commentId, { content });
            // Update comment in list
            setComments(prev => updateCommentById(prev, commentId, response.data));
        } catch (err: any) {
            console.error('Failed to update comment:', err);
            throw err;
        }
    };

    // Helper function to update comment by ID (including nested)
    const updateCommentById = (comments: Comment[], commentId: number, updatedComment: Comment): Comment[] => {
        return comments.map(comment => {
            if (comment.id === commentId) {
                return { ...comment, ...updatedComment };
            }
            if (comment.replies) {
                return {
                    ...comment,
                    replies: updateCommentById(comment.replies, commentId, updatedComment),
                };
            }
            return comment;
        });
    };

    const handleLoadMore = () => {
        loadComments(page + 1);
    };

    if (loading) {
        return (
            <div className="mt-12">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Komentar ({comments.length})
                </h2>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Comment Form */}
            {isAuthenticated ? (
                <div className="mb-8">
                    <CommentForm onSubmit={handleAddComment} />
                </div>
            ) : (
                <Alert className="mb-8">
                    <AlertDescription>
                        Silakan login untuk menambahkan komentar.
                    </AlertDescription>
                </Alert>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada komentar. Jadilah yang pertama berkomentar!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map(comment => (
<CommentItem
    key={comment.id}
    comment={comment}
    currentUserId={currentUserId}
    currentUserIsStaff={currentUserIsStaff}
    onReply={handleReply}
    onLike={handleLike}
    onDelete={handleDelete}
    onUpdate={handleUpdate}
/>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="flex justify-center pt-6">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
