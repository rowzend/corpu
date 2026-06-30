'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, AlertCircle } from 'lucide-react';
import { showError } from '@/lib/sweetalert';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    onCancel?: () => void;
    placeholder?: string;
    submitLabel?: string;
    isReply?: boolean;
    autoFocus?: boolean;
}

export default function CommentForm({
    onSubmit,
    onCancel,
    placeholder = 'Tulis komentar Anda...',
    submitLabel = 'Kirim',
    isReply = false,
    autoFocus = false,
}: CommentFormProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!content.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            setErrorMsg('');
            await onSubmit(content.trim());
            setContent('');
        } catch (error: any) {
            const msg = error?.message || 'Gagal mengirim komentar. Silakan coba lagi.';
            setErrorMsg(msg);
            showError(msg, 'Gagal');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                rows={isReply ? 2 : 3}
                className="resize-none"
                autoFocus={autoFocus}
                disabled={isSubmitting}
            />
            {errorMsg && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                </div>
            )}
            <div className="flex items-center gap-2 justify-end">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <X className="w-4 h-4 mr-1" />
                        Batal
                    </Button>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim() || isSubmitting}
                >
                    <Send className="w-4 h-4 mr-1" />
                    {isSubmitting ? 'Mengirim...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
