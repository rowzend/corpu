'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Reply, ChevronDown, ChevronUp } from 'lucide-react';

interface Comment {
    id: number;
    user: number;
    user_name: string;
    comment: string;
    parent_comment?: number;
    reply_count: number;
    replies?: Comment[];
    created_at: string;
}

interface CourseCommentsProps {
    comments: Comment[];
    courseId: number;
    onSubmitComment: (comment: string) => Promise<void>;
    onReply: (commentId: number, reply: string) => Promise<void>;
    onLikeComment: (commentId: number) => Promise<void>;
}

export default function CourseComments({ comments, onSubmitComment, onReply, onLikeComment }: CourseCommentsProps) {
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await onSubmitComment(newComment);
            setNewComment('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId: number) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await onReply(commentId, replyText);
            setReplyTo(null);
            setReplyText('');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleReplies = (commentId: number) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Tulis Komentar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tulis komentar..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
                        {submitting ? 'Mengirim...' : 'Kirim Komentar'}
                    </Button>
                </CardContent>
            </Card>

            {comments.length > 0 && (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <Card key={comment.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">{comment.user_name?.charAt(0)}</span>
                                    </div>
                                    <span className="font-medium">{comment.user_name}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{comment.comment}</p>
                                <div className="flex items-center gap-3 text-sm">
                                    <button
                                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                                        onClick={() => onLikeComment(comment.id)}
                                    >
                                        <ThumbsUp className="w-4 h-4" /> Suka
                                    </button>
                                    <button
                                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                    >
                                        <Reply className="w-4 h-4" /> Balas
                                    </button>
                                    {comment.reply_count > 0 && (
                                        <button
                                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                                            onClick={() => toggleReplies(comment.id)}
                                        >
                                            {expandedReplies.has(comment.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            {comment.reply_count} balasan
                                        </button>
                                    )}
                                </div>

                                {replyTo === comment.id && (
                                    <div className="mt-3 ml-8 space-y-2">
                                        <textarea
                                            className="w-full p-2 border rounded-lg text-sm"
                                            rows={2}
                                            placeholder="Tulis balasan..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleReply(comment.id)} disabled={submitting || !replyText.trim()}>
                                                Kirim Balasan
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => { setReplyTo(null); setReplyText(''); }}>
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-3 ml-8 space-y-3">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">{reply.user_name?.charAt(0)}</span>
                                                    </div>
                                                    <span className="font-medium text-sm">{reply.user_name}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{reply.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
