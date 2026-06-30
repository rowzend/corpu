'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface Rating {
    id: number;
    user: number;
    user_name: string;
    rating: number;
    comment?: string;
    created_at: string;
}

interface CourseRatingsProps {
    ratings: Rating[];
    courseId: number;
    onSubmitRating: (rating: number, comment: string) => Promise<void>;
}

export default function CourseRatings({ ratings, onSubmitRating }: CourseRatingsProps) {
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (userRating === 0) return;
        setSubmitting(true);
        try {
            await onSubmitRating(userRating, userComment);
            setUserRating(0);
            setUserComment('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Beri Rating</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`transition ${star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setUserRating(star)}
                            >
                                <Star className="w-8 h-8 fill-current" />
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tulis komentar (opsional)..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                    />
                    <Button onClick={handleSubmit} disabled={submitting || userRating === 0}>
                        {submitting ? 'Mengirim...' : 'Kirim Rating'}
                    </Button>
                </CardContent>
            </Card>

            {ratings.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Rating & Ulasan</h3>
                    {ratings.map((r) => (
                        <Card key={r.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{r.user_name}</span>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`w-4 h-4 ${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                </div>
                                {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
