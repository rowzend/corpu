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
    ArrowLeft, Plus, Trash2, Save, Edit, Loader, X
} from 'lucide-react';
import { getQuiz, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showDeleteConfirm } from '@/lib/sweetalert';

const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Pilihan Ganda',
    true_false: 'Benar/Salah',
    essay: 'Esai',
};

export default function QuizQuestionsPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = parseInt(params.id as string);

    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        essay_word_limit: 500,
        order_index: 1,
    });
    const [choices, setChoices] = useState<{ choice_text: string; is_correct: boolean; order_index: number }[]>([]);

    useEffect(() => { fetchQuiz(); }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const data = await getQuiz(quizId);
            setQuiz(data);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Quiz');
        } finally { setLoading(false); }
    };

    const openAddDialog = () => {
        setEditingQuestion(null);
        const nextIndex = (quiz?.questions?.length || 0) + 1;
        setFormData({ question_text: '', question_type: 'multiple_choice', points: 1, essay_word_limit: 500, order_index: nextIndex });
        setChoices([
            { choice_text: '', is_correct: false, order_index: 1 },
            { choice_text: '', is_correct: false, order_index: 2 },
        ]);
        setDialogOpen(true);
    };

    const openEditDialog = (q: any) => {
        setEditingQuestion(q);
        setFormData({
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points,
            essay_word_limit: q.essay_word_limit || 500,
            order_index: q.order_index,
        });
        setChoices(q.choices?.length > 0
            ? q.choices.map((c: any) => ({ choice_text: c.choice_text, is_correct: c.is_correct, order_index: c.order_index }))
            : []
        );
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.question_text.trim()) {
            showError('Teks pertanyaan harus diisi', 'Validasi');
            return;
        }
        if (formData.question_type !== 'essay') {
            const validChoices = choices.filter(c => c.choice_text.trim());
            if (validChoices.length < 2) {
                showError('Minimal 2 pilihan jawaban harus diisi', 'Validasi');
                return;
            }
            if (!validChoices.some(c => c.is_correct)) {
                showError('Pilih salah satu jawaban sebagai benar', 'Validasi');
                return;
            }
        }

        try {
            setSaving(true);
            const payload: any = {
                quiz: quizId,
                question_text: formData.question_text,
                question_type: formData.question_type,
                points: formData.points,
                essay_word_limit: formData.question_type === 'essay' ? formData.essay_word_limit : undefined,
                order_index: formData.order_index,
            };
            if (formData.question_type !== 'essay') {
                payload.choices = choices
                    .filter(c => c.choice_text.trim())
                    .map((c, i) => ({ choice_text: c.choice_text, is_correct: c.is_correct, order_index: i + 1 }));
            }

            if (editingQuestion) {
                await updateQuizQuestion(editingQuestion.id, payload);
                showToast('Pertanyaan berhasil diperbarui!', 'success');
            } else {
                await createQuizQuestion(payload);
                showToast('Pertanyaan berhasil ditambahkan!', 'success');
            }
            setDialogOpen(false);
            fetchQuiz();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyimpan Pertanyaan');
        } finally { setSaving(false); }
    };

    const handleDelete = async (q: any) => {
        const confirmed = await showDeleteConfirm(q.question_text.substring(0, 50), 'pertanyaan');
        if (!confirmed) return;
        try {
            await deleteQuizQuestion(q.id);
            showToast('Pertanyaan berhasil dihapus!', 'success');
            fetchQuiz();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus Pertanyaan');
        }
    };

    const addChoice = () => {
        setChoices(prev => [...prev, { choice_text: '', is_correct: false, order_index: prev.length + 1 }]);
    };

    const removeChoice = (index: number) => {
        setChoices(prev => prev.filter((_, i) => i !== index));
    };

    const updateChoice = (index: number, field: string, value: any) => {
        setChoices(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!quiz) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/learning/quizzes')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
                    <p className="text-gray-600 mt-1">Kelola pertanyaan quiz</p>
                </div>
                <Badge variant="outline" className="text-sm">{quiz.total_questions} Soal</Badge>
                <Button onClick={openAddDialog}>
                    <Plus className="w-4 h-4 mr-2" />Tambah Soal
                </Button>
            </div>

            <div className="space-y-4">
                {quiz.questions?.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-gray-600">Belum ada pertanyaan. Klik "Tambah Soal" untuk mulai.</p>
                        </CardContent>
                    </Card>
                )}
                {quiz.questions?.map((q: any, i: number) => (
                    <Card key={q.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm mt-1">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium">{q.question_text}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {TYPE_LABELS[q.question_type] || q.question_type}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">{q.points} poin</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(q)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        {q.choices?.length > 0 && (
                            <CardContent>
                                <div className="space-y-2">
                                    {q.choices.map((c: any, cIndex: number) => (
                                        <div key={c.id} className={`flex items-center gap-2 p-2 rounded ${c.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                            <span className="text-sm font-mono">{String.fromCharCode(65 + cIndex)}.</span>
                                            <span className={`text-sm flex-1 ${c.is_correct ? 'text-green-700 font-medium' : ''}`}>{c.choice_text}</span>
                                            {c.is_correct && <Badge className="bg-green-100 text-green-800 text-xs">Benar</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="q_text">Teks Pertanyaan</Label>
                            <Textarea
                                id="q_text"
                                placeholder="Masukkan teks pertanyaan"
                                value={formData.question_text}
                                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                                className="mt-2"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="q_type">Tipe Soal</Label>
                                <select
                                    id="q_type"
                                    value={formData.question_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, question_type: e.target.value }))}
                                    className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="multiple_choice">Pilihan Ganda</option>
                                    <option value="true_false">Benar/Salah</option>
                                    <option value="essay">Esai</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="q_points">Poin</Label>
                                <Input
                                    id="q_points"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={formData.points}
                                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="q_order">Urutan</Label>
                                <Input
                                    id="q_order"
                                    type="number"
                                    min={1}
                                    value={formData.order_index}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {formData.question_type === 'essay' && (
                            <div>
                                <Label htmlFor="q_word_limit">Batas Kata (opsional)</Label>
                                <Input
                                    id="q_word_limit"
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={formData.essay_word_limit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, essay_word_limit: parseInt(e.target.value) || 0 }))}
                                    className="mt-2"
                                    placeholder="0 = tanpa batas"
                                />
                            </div>
                        )}

                        {formData.question_type !== 'essay' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Pilihan Jawaban</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                                        <Plus className="w-3 h-3 mr-1" />Tambah
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {choices.map((choice, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-sm font-mono w-6">{String.fromCharCode(65 + index)}.</span>
                                            <Input
                                                placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                                                value={choice.choice_text}
                                                onChange={(e) => updateChoice(index, 'choice_text', e.target.value)}
                                                className="flex-1"
                                            />
                                            <label className="flex items-center gap-1 text-sm cursor-pointer whitespace-nowrap">
                                                <input
                                                    type="radio"
                                                    name="correct_choice"
                                                    checked={choice.is_correct}
                                                    onChange={() => setChoices(prev => prev.map((c, i) => ({ ...c, is_correct: i === index })))}
                                                />
                                                Benar
                                            </label>
                                            {choices.length > 2 && (
                                                <Button variant="ghost" size="icon" onClick={() => removeChoice(index)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.question_type === 'true_false' && (
                            <p className="text-sm text-gray-500">Tandai pilihan "Benar" sebagai jawaban yang tepat.</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button onClick={handleSubmit} disabled={saving}>
                                {saving ? (
                                    <><Loader className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" />{editingQuestion ? 'Simpan' : 'Tambah'}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
