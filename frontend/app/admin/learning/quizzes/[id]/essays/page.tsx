'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft, CheckCircle, XCircle, ClipboardList, Loader, Save, Search
} from 'lucide-react';
import { getQuiz, getEssayAnswers, gradeEssay } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function EssayGradingPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = parseInt(params.id as string);

    const [quiz, setQuiz] = useState<any>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [gradeDialog, setGradeDialog] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
    const [gradeForm, setGradeForm] = useState({ is_correct: false, points_earned: 0, grader_notes: '' });
    const [saving, setSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded'>('ungraded');

    useEffect(() => { fetchData(); }, [quizId]);

    const fetchData = async () => {
        try {
            const [quizData, answersData] = await Promise.all([
                getQuiz(quizId),
                getEssayAnswers(quizId),
            ]);
            setQuiz(quizData);
            setAnswers(answersData);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally { setLoading(false); }
    };

    const openGradeDialog = (answer: any) => {
        setSelectedAnswer(answer);
        setGradeForm({
            is_correct: answer.is_correct,
            points_earned: answer.points_earned || 0,
            grader_notes: answer.grader_notes || '',
        });
        setGradeDialog(true);
    };

    const handleGrade = async () => {
        if (!selectedAnswer) return;
        try {
            setSaving(true);
            await gradeEssay(quizId, {
                answer_id: selectedAnswer.id,
                is_correct: gradeForm.is_correct,
                points_earned: gradeForm.points_earned,
                grader_notes: gradeForm.grader_notes,
            });
            showToast('Nilai berhasil disimpan!', 'success');
            setGradeDialog(false);
            fetchData();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyimpan Nilai');
        } finally { setSaving(false); }
    };

    const filteredAnswers = answers.filter(a => {
        const matchesUser = a.attempt_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.attempt_user_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.essay_answer?.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'graded') return matchesUser && a.is_graded;
        if (filter === 'ungraded') return matchesUser && !a.is_graded;
        return matchesUser;
    });

    const ungradedCount = answers.filter(a => !a.is_graded).length;

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!quiz) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/admin/learning/quizzes')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">Penilaian Esai</h1>
                    <p className="text-card-foreground mt-1">{quiz.title}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                    {ungradedCount} Perlu Dinilai
                </Badge>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari jawaban atau pengguna..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'ungraded', 'graded'] as const).map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'Semua' : f === 'ungraded' ? 'Perlu Dinilai' : 'Sudah Dinilai'}
                        </Button>
                    ))}
                </div>
            </div>

            {filteredAnswers.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-card-foreground">
                            {filter === 'ungraded' ? 'Semua jawaban esai sudah dinilai!' : 'Tidak ada jawaban esai.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAnswers.map((answer) => (
                        <Card key={answer.id} className={answer.is_graded ? 'border-green-200' : 'border-amber-200'}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{answer.attempt_user_name || answer.attempt_user_username}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {answer.is_graded ? 'Sudah Dinilai' : 'Perlu Dinilai'}
                                            </Badge>
                                            {answer.is_graded && (
                                                <Badge className={answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    {answer.is_correct ? 'Benar' : 'Salah'}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-card-foreground">{answer.question_text}</p>
                                    </div>
                                    <Button
                                        variant={answer.is_graded ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() => openGradeDialog(answer)}
                                    >
                                        {answer.is_graded ? 'Edit Nilai' : 'Nilai'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-3 rounded-lg mb-3">
                                    <p className="text-sm text-card-foreground whitespace-pre-wrap">{answer.essay_answer}</p>
                                </div>
                                {answer.is_graded && (
                                    <div className="flex items-center gap-4 text-sm text-card-foreground">
                                        <span>Poin: <strong>{answer.points_earned}</strong></span>
                                        {answer.grader_notes && <span>Catatan: {answer.grader_notes}</span>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nilai Jawaban Esai</DialogTitle>
                    </DialogHeader>
                    {selectedAnswer && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Pertanyaan:</p>
                                <p className="font-medium">{selectedAnswer.question_text}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Jawaban:</p>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{selectedAnswer.essay_answer}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={gradeForm.is_correct ? 'default' : 'outline'}
                                    onClick={() => setGradeForm(prev => ({ ...prev, is_correct: true }))}
                                    className={gradeForm.is_correct ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />Benar
                                </Button>
                                <Button
                                    variant={!gradeForm.is_correct ? 'default' : 'outline'}
                                    onClick={() => setGradeForm(prev => ({ ...prev, is_correct: false }))}
                                    className={!gradeForm.is_correct ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />Salah
                                </Button>
                            </div>
                            <div>
                                <Label htmlFor="points">Poin</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min={0}
                                    value={gradeForm.points_earned}
                                    onChange={(e) => setGradeForm(prev => ({ ...prev, points_earned: parseInt(e.target.value) || 0 }))}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Catatan Penilai (opsional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Tambahkan catatan untuk pengguna..."
                                    value={gradeForm.grader_notes}
                                    onChange={(e) => setGradeForm(prev => ({ ...prev, grader_notes: e.target.value }))}
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setGradeDialog(false)}>Batal</Button>
                                <Button onClick={handleGrade} disabled={saving}>
                                    {saving ? (
                                        <><Loader className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                                    ) : (
                                        <><Save className="w-4 h-4 mr-2" />Simpan Nilai</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
