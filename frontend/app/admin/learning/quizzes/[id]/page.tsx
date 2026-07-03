'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ListChecks, BarChart3, ClipboardCheck, HelpCircle, Clock, Repeat } from 'lucide-react';
import { getQuiz, getQuizStats } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';

export default function QuizDetailPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = parseInt(params.id as string);
    const [quiz, setQuiz] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [quizId]);

    const fetchData = async () => {
        try {
            const [quizData, statsData] = await Promise.all([
                getQuiz(quizId),
                getQuizStats(quizId).catch(() => null),
            ]);
            setQuiz(quizData);
            setStats(statsData);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-36 bg-muted rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-muted rounded-xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (!quiz) return null;

    const statCards = [
        { label: 'Total Soal', value: quiz.total_questions, icon: HelpCircle, color: 'text-pink-600', bg: 'bg-pink-50' },
        { label: 'Nilai Lulus', value: `${quiz.passing_score_percentage}%`, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Percobaan', value: quiz.max_attempts === -1 ? '∞' : quiz.max_attempts, icon: Repeat, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Acak Soal', value: quiz.is_randomized ? 'Ya' : 'Tidak', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-pink-700 to-rose-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/admin/learning/quizzes')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{quiz.title}</h1>
                            {quiz.description && <p className="text-pink-100 text-sm mt-0.5">{quiz.description}</p>}
                        </div>
                    </div>
                    <button onClick={() => router.push(`/admin/learning/quizzes/${quizId}/edit`)}
                        className="inline-flex items-center gap-2 bg-white text-pink-700 hover:bg-pink-50 px-4 py-2 rounded-xl font-semibold transition-all shadow-lg">
                        <Edit className="w-4 h-4" /> Edit
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`${card.bg} rounded-xl p-4 text-center`}>
                        <card.icon className={`w-6 h-6 ${card.color} mx-auto mb-1`} />
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs text-muted-foreground">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Stats & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats && (
                    <div className="bg-white rounded-xl shadow-sm border border-border">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-card-foreground">Statistik</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Total Percobaan', value: stats.total_attempts },
                                { label: 'Rata-rata Nilai', value: `${stats.average_score}%` },
                                { label: 'Lulus', value: `${stats.passed_count} (${stats.passed_percentage}%)` },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quiz Info */}
                <div className="bg-white rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Informasi Quiz</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { label: 'Tipe Soal', value: quiz.has_essay ? 'Pilihan Ganda + Esai' : 'Pilihan Ganda' },
                            { label: 'Batas Waktu', value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes} menit` : 'Tidak ada' },
                            { label: 'Acak Soal', value: quiz.is_randomized ? 'Ya' : 'Tidak' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                                <span className="text-sm font-medium text-card-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Aksi</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        <button onClick={() => router.push(`/admin/learning/quizzes/${quizId}/questions`)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-card-foreground bg-muted rounded-xl hover:bg-muted transition-colors">
                            <ListChecks className="w-5 h-5 text-pink-600" /> Kelola Soal
                        </button>
                        <button onClick={() => router.push(`/admin/learning/quizzes/${quizId}/edit`)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-card-foreground bg-muted rounded-xl hover:bg-muted transition-colors">
                            <Edit className="w-5 h-5 text-indigo-600" /> Edit Quiz
                        </button>
                        <button onClick={() => router.push(`/admin/learning/quizzes/${quizId}/essays`)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-card-foreground bg-muted rounded-xl hover:bg-muted transition-colors">
                            <ClipboardCheck className="w-5 h-5 text-emerald-600" /> Nilai Esai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
