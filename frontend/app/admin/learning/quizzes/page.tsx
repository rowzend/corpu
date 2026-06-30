'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, HelpCircle, ClipboardCheck, FileQuestion } from 'lucide-react';
import { getQuizzes, deleteQuiz } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';

export default function QuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchQuizzes(); }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getQuizzes({ page_size: 100 });
            setQuizzes(data?.results || []);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await showDeleteConfirm(title, 'quiz');
        if (!confirmed) return;
        try {
            await deleteQuiz(id);
            showToast(`"${title}" berhasil dihapus!`, 'success');
            fetchQuizzes();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus');
        }
    };

    const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-muted rounded-xl animate-pulse"></div>
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse"></div>)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-pink-700 to-rose-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <ClipboardCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Manajemen Quiz</h1>
                                <p className="text-pink-100 text-sm">Kelola quiz dan pertanyaan</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/admin/learning/quizzes/create')}
                            className="inline-flex items-center gap-2 bg-card text-pink-700 hover:bg-pink-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" /> Quiz Baru
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Total Quiz', value: quizzes.length, icon: ClipboardCheck, color: 'bg-pink-400/20 text-pink-200' },
                            { label: 'Total Soal', value: quizzes.reduce((s, q) => s + (q.total_questions || 0), 0), icon: HelpCircle, color: 'bg-purple-400/20 text-purple-200' },
                            { label: 'Dengan Esai', value: quizzes.filter(q => q.has_essay).length, icon: FileQuestion, color: 'bg-amber-400/20 text-amber-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-pink-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Cari quiz..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-muted focus:bg-card transition-colors text-sm" />
                </div>
            </div>

            {/* Quiz List */}
            {filtered.length > 0 ? (
                <div className="grid gap-4">
                    {filtered.map((quiz) => (
                        <div key={quiz.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-pink-100 transition-all">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-card-foreground mb-1">{quiz.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Pelajaran: {quiz.lesson_title || `ID: ${quiz.lesson}`}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                                <HelpCircle className="w-3 h-3" /> {quiz.total_questions} Soal
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">Lulus: {quiz.passing_score_percentage}%</Badge>
                                            <Badge variant="secondary" className="text-xs">Percobaan: {quiz.max_attempts === -1 ? '∞' : quiz.max_attempts}</Badge>
                                            {quiz.time_limit_minutes && (
                                                <Badge variant="secondary" className="text-xs">Batas Waktu: {quiz.time_limit_minutes} menit</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => router.push(`/learning/quizzes/${quiz.id}/questions`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                                            <Eye className="w-3.5 h-3.5" /> Soal
                                        </button>
                                        <button onClick={() => router.push(`/learning/quizzes/${quiz.id}/edit`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                            <Edit className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(quiz.id, quiz.title)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center">
                        <ClipboardCheck className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">{search ? 'Quiz tidak ditemukan' : 'Belum ada quiz'}</h3>
                    <p className="text-muted-foreground mb-6">{search ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan membuat quiz pertama Anda'}</p>
                    {!search && (
                        <button onClick={() => router.push('/admin/learning/quizzes/create')}
                            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-pink-200">
                            <Plus className="w-4 h-4" /> Buat Quiz Pertama
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
