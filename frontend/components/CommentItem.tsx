'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Reply, Trash2, Edit } from 'lucide-react';
import { Comment } from '@/lib/api/knowledge';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface CommentItemProps {
    comment: Comment;
    currentUserId?: number;
    currentUserIsStaff?: boolean;
    onReply: (parentId: number, content: string) => Promise<void>;
    onLike: (commentId: number, isLike: boolean) => Promise<void>;
    onDelete: (commentId: number) => Promise<void>;
    onUpdate: (commentId: number, content: string) => Promise<void>;
    depth?: number;
}

export default function CommentItem({
    comment,
    currentUserId,
    currentUserIsStaff,
    onReply,
    onLike,
    onDelete,
    onUpdate,
    depth = 0,
}: CommentItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(comment.like_count);
    const [localDislikeCount, setLocalDislikeCount] = useState(comment.dislike_count);
    const [userLikeStatus, setUserLikeStatus] = useState<'like' | 'dislike' | null>(
        comment.user_like_status || null
    );

    const isOwner = currentUserId === comment.user;
    const canDelete = isOwner || currentUserIsStaff;
    const maxDepth = 3; // Maximum nesting level

    const handleReply = async (content: string) => {
        await onReply(comment.id, content);
        setShowReplyForm(false);
    };

    const handleUpdate = async (content: string) => {
        await onUpdate(comment.id, content);
        setShowEditForm(false);
    };

    const handleLike = async (isLike: boolean) => {
        if (isLiking) return;

        try {
            setIsLiking(true);
            
            // Optimistic update
            if (userLikeStatus === (isLike ? 'like' : 'dislike')) {
                // Remove like/dislike
                setUserLikeStatus(null);
                if (isLike) {
                    setLocalLikeCount(prev => prev - 1);
                } else {
                    setLocalDislikeCount(prev => prev - 1);
                }
            } else {
                // Add or change like/dislike
                if (userLikeStatus) {
                    // Change from like to dislike or vice versa
                    if (isLike) {
                        setLocalLikeCount(prev => prev + 1);
                        setLocalDislikeCount(prev => prev - 1);
                    } else {
                        setLocalLikeCount(prev => prev - 1);
                        setLocalDislikeCount(prev => prev + 1);
                    }
                } else {
                    // New like/dislike
                    if (isLike) {
                        setLocalLikeCount(prev => prev + 1);
                    } else {
                        setLocalDislikeCount(prev => prev + 1);
                    }
                }
                setUserLikeStatus(isLike ? 'like' : 'dislike');
            }

            await onLike(comment.id, isLike);
        } catch (error) {
            // Revert on error
            setLocalLikeCount(comment.like_count);
            setLocalDislikeCount(comment.dislike_count);
            setUserLikeStatus(comment.user_like_status || null);
            console.error('Failed to like comment:', error);
        } finally {
            setIsLiking(false);
        }
    };

    const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
        addSuffix: true,
        locale: idLocale,
    });

    return (
        <div className={`${depth > 0 ? 'ml-12 mt-4' : 'mt-6'}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {comment.user_name.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {comment.user_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {timeAgo}
                                    {comment.is_edited && (
                                        <span className="ml-2 italic">(diedit)</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions Menu */}
                        </div>

                        {/* Comment Content or Edit Form */}
                        {showEditForm ? (
                            <CommentForm
                                onSubmit={handleUpdate}
                                onCancel={() => setShowEditForm(false)}
                                placeholder="Edit komentar Anda..."
                                submitLabel="Simpan"
                                isReply={false}
                                autoFocus
                            />
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {comment.content}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!showEditForm && (
                        <div className="flex items-center gap-4 mt-2 ml-2">
                            {/* Like Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(true)}
                                disabled={isLiking}
                                className={`h-8 ${
                                    userLikeStatus === 'like'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                {localLikeCount > 0 && localLikeCount}
                            </Button>

                            {/* Dislike Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(false)}
                                disabled={isLiking}
                                className={`h-8 ${
                                    userLikeStatus === 'dislike'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                {localDislikeCount > 0 && localDislikeCount}
                            </Button>

                            {/* Reply Button */}
                            {depth < maxDepth && currentUserId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowReplyForm(!showReplyForm)}
                                    className="h-8 text-gray-600 dark:text-gray-400"
                                >
                                    <Reply className="w-4 h-4 mr-1" />
                                    Balas
                                </Button>
                            )}

                            {/* Edit Button */}
                            {canDelete && !showEditForm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowEditForm(true)}
                                    className="h-8 text-gray-600 dark:text-gray-400"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                            )}

                            {/* Delete Button */}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(comment.id)}
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Hapus
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm && (
                        <CommentForm
                            onSubmit={handleReply}
                            onCancel={() => setShowReplyForm(false)}
                            placeholder="Tulis balasan Anda..."
                            submitLabel="Balas"
                            isReply
                            autoFocus
                        />
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4">
                            {comment.replies.map((reply) => (
<CommentItem
    key={reply.id}
    comment={reply}
    currentUserId={currentUserId}
    currentUserIsStaff={currentUserIsStaff}
    onReply={onReply}
    onLike={onLike}
    onDelete={onDelete}
    onUpdate={onUpdate}
    depth={depth + 1}
/>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
