'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader, Plus, Trash2 } from 'lucide-react';
import { createQuiz, getLessons, getCourses, getModules } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function CreateQuizPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [selectedCourseSlug, setSelectedCourseSlug] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState(searchParams.get('module_id') || '');
    const [formData, setFormData] = useState({
        lesson: searchParams.get('lesson_id') || '',
        title: '',
        description: '',
        passing_score_percentage: 70,
        max_attempts: 1,
        time_limit_minutes: 0,
        retry_cooldown_minutes: 0,
        is_randomized: false,
        questions: [] as any[],
    });

    useEffect(() => {
        const courseSlug = searchParams.get('course_slug');
        const moduleId = searchParams.get('module_id');
        const lessonId = searchParams.get('lesson_id');

        (async () => {
            try {
                const data = await getCourses({ page_size: 100 });
                const allCourses = data?.results || [];
                setCourses(allCourses);

                if (courseSlug) {
                    const match = allCourses.find((c: any) => c.slug === courseSlug);
                    if (!match) { setPageLoading(false); return; }
                    setSelectedCourseSlug(courseSlug);

                    const modData = await getModules(courseSlug);
                    const allModules = modData?.results || [];
                    setModules(allModules);

                    if (moduleId) {
                        const mMatch = allModules.find((m: any) => String(m.id) === String(moduleId));
                        if (!mMatch) { setPageLoading(false); return; }
                        setSelectedModuleId(moduleId);

                        const lesData = await getLessons(parseInt(moduleId));
                        const allLessons = Array.isArray(lesData) ? lesData : [];
                        setLessons(allLessons);

                        if (lessonId) {
                            setFormData(prev => ({ ...prev, lesson: lessonId }));
                        }
                    }
                }
            } catch (_) {}
            setPageLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!selectedCourseSlug) { setModules([]); return; }
        fetchModules(selectedCourseSlug);
    }, [selectedCourseSlug]);

    useEffect(() => {
        if (!selectedModuleId) { setLessons([]); return; }
        fetchLessons(parseInt(selectedModuleId));
    }, [selectedModuleId]);

    const fetchModules = async (slug: string) => {
        try {
            const data = await getModules(slug);
            setModules(data?.results || []);
        } catch { setModules([]); }
    };

    const fetchLessons = async (moduleId: number) => {
        try {
            const data = await getLessons(moduleId);
            setLessons(Array.isArray(data) ? data : []);
        } catch { setLessons([]); }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                question_text: '',
                question_type: 'multiple_choice',
                points: 1,
                order_index: prev.questions.length,
                choices: [
                    { choice_text: '', is_correct: false, order_index: 0 },
                    { choice_text: '', is_correct: false, order_index: 1 },
                ]
            }]
        }));
    };

    const removeQuestion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const questions = [...prev.questions];
            questions[index] = { ...questions[index], [field]: value };
            return { ...prev, questions };
        });
    };

    const addChoice = (qIndex: number) => {
        setFormData(prev => {
            const questions = [...prev.questions];
            questions[qIndex].choices = [
                ...questions[qIndex].choices,
                { choice_text: '', is_correct: false, order_index: questions[qIndex].choices.length }
            ];
            return { ...prev, questions };
        });
    };

    const updateChoice = (qIndex: number, cIndex: number, field: string, value: any) => {
        setFormData(prev => {
            const questions = [...prev.questions];
            questions[qIndex].choices[cIndex] = { ...questions[qIndex].choices[cIndex], [field]: value };
            return { ...prev, questions };
        });
    };

    const removeChoice = (qIndex: number, cIndex: number) => {
        setFormData(prev => {
            const questions = [...prev.questions];
            questions[qIndex].choices = questions[qIndex].choices.filter((_: any, i: number) => i !== cIndex);
            return { ...prev, questions };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { showError('Judul quiz harus diisi', 'Validasi'); return; }
        if (!formData.lesson) { showError('Pilih pelajaran', 'Validasi'); return; }

        try {
            setLoading(true);
            const result = await createQuiz({
                lesson: parseInt(formData.lesson),
                title: formData.title,
                description: formData.description,
                passing_score_percentage: formData.passing_score_percentage,
                max_attempts: formData.max_attempts,
                time_limit_minutes: formData.time_limit_minutes,
                retry_cooldown_minutes: formData.retry_cooldown_minutes,
                is_randomized: formData.is_randomized,
            });
            showToast('Quiz berhasil dibuat!', 'success');
            router.push('/learning/quizzes');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat Quiz');
        } finally { setLoading(false); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Buat Quiz Baru</h1>
                    <p className="text-gray-600 mt-1">Buat quiz dan tambahkan pertanyaan</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Informasi Quiz</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {pageLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <Label>Kursus</Label>
                                    <select value={selectedCourseSlug}
                                        onChange={(e) => { setSelectedCourseSlug(e.target.value); setSelectedModuleId(''); setFormData(prev => ({ ...prev, lesson: '' })); }}
                                        className="w-full mt-2 p-2 border rounded-lg">
                                        <option value="">Pilih Kursus...</option>
                                        {courses.map((c: any) => (
                                            <option key={c.id} value={c.slug}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Modul</Label>
                                    <select value={selectedModuleId}
                                        onChange={(e) => { setSelectedModuleId(e.target.value); setFormData(prev => ({ ...prev, lesson: '' })); }}
                                        className="w-full mt-2 p-2 border rounded-lg">
                                        <option value="">Pilih Modul...</option>
                                        {modules.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Pelajaran (hanya tipe Quiz)</Label>
                                    <select name="lesson" value={formData.lesson}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lesson: e.target.value }))}
                                        className="w-full mt-2 p-2 border rounded-lg" required>
                                        <option value="">Pilih Pelajaran...</option>
                                        {lessons.filter((l: any) => l.content_type === 'quiz').map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <Label>Judul Quiz</Label>
                            <Input name="title" placeholder="Contoh: Quiz Pertemuan 1"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="mt-2" required />
                        </div>
                        <div>
                            <Label>Deskripsi (Opsional)</Label>
                            <textarea name="description" placeholder="Deskripsi quiz..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full mt-2 p-2 border rounded-lg" rows={2} />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <Label>Nilai Lulus (%)</Label>
                                <Input name="passing_score" type="number" min="0" max="100"
                                    value={formData.passing_score_percentage}
                                    onChange={(e) => setFormData(prev => ({ ...prev, passing_score_percentage: parseInt(e.target.value) }))}
                                    className="mt-2" />
                            </div>
                            <div>
                                <Label>Maks Percobaan</Label>
                                <Input name="max_attempts" type="number" min="1"
                                    value={formData.max_attempts}
                                    onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                                    className="mt-2" />
                                <p className="text-xs text-gray-400 mt-1">Total percobaan <strong>termasuk yang pertama</strong>. Contoh: isi 2 berarti 1 ujian + 1 remedial.</p>
                            </div>
                            <div>
                                <Label>Batas Waktu (menit)</Label>
                                <Input name="time_limit" type="number" min="0"
                                    value={formData.time_limit_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) }))}
                                    className="mt-2" placeholder="0 = tanpa batas" />
                            </div>
                            <div>
                                <Label>Cooldown Retry (Menit)</Label>
                                <Input name="retry_cooldown_minutes" type="number" min="0"
                                    value={formData.retry_cooldown_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, retry_cooldown_minutes: parseInt(e.target.value) }))}
                                    className="mt-2" placeholder="0 = tidak ada, 1440 = 24 jam" />
                                <p className="text-xs text-gray-400 mt-1">Waktu tunggu sebelum retry setelah gagal. 0 = instant.</p>
                            </div>
                            <div>
                                <Label>Acak Pertanyaan</Label>
                                <div className="mt-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.is_randomized}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_randomized: e.target.checked }))}
                                            className="rounded" />
                                        Ya, acak pertanyaan
                                    </label>
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <span>⚠</span> Pilihan jawaban juga akan diacak saat ujian.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Pertanyaan</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                            <Plus className="w-4 h-4 mr-1" />Tambah Pertanyaan
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formData.questions.length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                                Belum ada pertanyaan. Klik "Tambah Pertanyaan" untuk mulai.
                            </p>
                        )}
                        {formData.questions.map((q, qIndex) => (
                            <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <span className="font-medium">Pertanyaan {qIndex + 1}</span>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-600"
                                        onClick={() => removeQuestion(qIndex)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div>
                                    <textarea
                                        placeholder="Teks pertanyaan..."
                                        value={q.question_text}
                                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                        className="w-full p-2 border rounded-lg" rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tipe</Label>
                                        <select value={q.question_type}
                                            onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                                            className="w-full mt-1 p-2 border rounded-lg">
                                            <option value="multiple_choice">Pilihan Ganda</option>
                                            <option value="true_false">Benar/Salah</option>
                                            <option value="essay">Esai</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Poin</Label>
                                        <Input type="number" min="1" value={q.points}
                                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                            className="mt-1" />
                                    </div>
                                </div>

                                {q.question_type === 'multiple_choice' && (
                                    <div className="space-y-2">
                                        <Label>Pilihan Jawaban</Label>
                                        {q.choices.map((c: any, cIndex: number) => (
                                            <div key={cIndex} className="flex items-center gap-2">
                                                <input type="radio" name={`correct-${qIndex}`}
                                                    checked={c.is_correct}
                                                    onChange={() => {
                                                        q.choices.forEach((_: any, i: number) => {
                                                            updateChoice(qIndex, i, 'is_correct', i === cIndex);
                                                        });
                                                    }}
                                                    className="mt-1" />
                                                <Input
                                                    placeholder={`Pilihan ${cIndex + 1}`}
                                                    value={c.choice_text}
                                                    onChange={(e) => updateChoice(qIndex, cIndex, 'choice_text', e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button type="button" variant="ghost" size="sm" className="text-red-600"
                                                    onClick={() => removeChoice(qIndex, cIndex)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => addChoice(qIndex)}>
                                            <Plus className="w-4 h-4 mr-1" />Tambah Pilihan
                                        </Button>
                                    </div>
                                )}

                                {q.question_type === 'true_false' && (
                                    <p className="text-sm text-gray-500">Jawaban benar/salah akan diatur otomatis</p>
                                )}

                                {q.question_type === 'essay' && (
                                    <p className="text-sm text-gray-500">Jawaban esai akan dinilai manual</p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Batalkan</Button>
                    <Button type="submit" disabled={loading} className="min-w-32">
                        {loading ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Membuat...</> : <><Save className="w-4 h-4 mr-2" />Buat Quiz</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
