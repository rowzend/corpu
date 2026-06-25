'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface QuizCardProps {
    quiz: {
        id: number;
        title: string;
        description?: string;
        passing_score_percentage: number;
        max_attempts: number;
        total_questions: number;
        attempts_count?: number;
        last_score?: number;
        passed?: boolean;
    };
    onStart?: (quizId: number) => void;
    onViewResult?: (quizId: number) => void;
}

export default function QuizCard({ quiz, onStart, onViewResult }: QuizCardProps) {
    return (
        <Card className="hover:shadow-lg transition">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        {quiz.description && (
                            <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                        )}
                    </div>
                    {quiz.passed !== undefined && (
                        quiz.passed ? (
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        )
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />{quiz.total_questions} Soal
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />Lulus {quiz.passing_score_percentage}%
                    </Badge>
                    <Badge variant="outline">
                        Percobaan: {quiz.attempts_count || 0}/{quiz.max_attempts === -1 ? '∞' : quiz.max_attempts}
                    </Badge>
                </div>
                {quiz.last_score !== undefined && (
                    <p className="text-sm mb-3">
                        Nilai terakhir: <span className={`font-semibold ${quiz.passed ? 'text-green-600' : 'text-red-600'}`}>{quiz.last_score}%</span>
                    </p>
                )}
                <div className="flex gap-2">
                    {onStart && (
                        <Button size="sm" onClick={() => onStart(quiz.id)}>
                            {quiz.last_score !== undefined ? 'Coba Lagi' : 'Mulai Kuis'}
                        </Button>
                    )}
                    {onViewResult && quiz.last_score !== undefined && (
                        <Button size="sm" variant="outline" onClick={() => onViewResult(quiz.id)}>
                            Lihat Hasil
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
