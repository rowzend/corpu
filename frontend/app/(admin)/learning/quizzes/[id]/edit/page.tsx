'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { getQuiz, updateQuiz, getCourses, getModules, getLessons } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function EditQuizPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [selectedCourseSlug, setSelectedCourseSlug] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [lessonId, setLessonId] = useState<number>(0);
    const [formData, setFormData] = useState({
        title: '', description: '', passing_score_percentage: 70,
        max_attempts: 1, is_randomized: false, time_limit_minutes: 0,
        retry_cooldown_minutes: 0,
    });

    useEffect(() => { fetchQuiz(); }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const quiz = await getQuiz(parseInt(quizId));

            const data = await getCourses({ page_size: 100 });
            const allCourses = data?.results || [];
            setCourses(allCourses);

            setLessonId(quiz.lesson);
            setFormData({
                title: quiz.title,
                description: quiz.description || '',
                passing_score_percentage: quiz.passing_score_percentage,
                max_attempts: quiz.max_attempts,
                is_randomized: quiz.is_randomized,
                time_limit_minutes: quiz.time_limit_minutes || 0,
                retry_cooldown_minutes: quiz.retry_cooldown_minutes || 0,
            });

            if (quiz.course_slug) {
                setSelectedCourseSlug(quiz.course_slug);
                const modData = await getModules(quiz.course_slug);
                const allModules = modData?.results || [];
                setModules(allModules);

                if (quiz.module_id) {
                    setSelectedModuleId(String(quiz.module_id));
                    const lesData = await getLessons(quiz.module_id);
                    const allLessons = Array.isArray(lesData) ? lesData : [];
                    setLessons(allLessons);
                }
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Quiz');
            router.push('/learning/quizzes');
        } finally {
            setLoading(false);
            setPageLoading(false);
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { showError('Judul quiz harus diisi', 'Validasi'); return; }
        if (!lessonId) { showError('Pilih pelajaran', 'Validasi'); return; }
        try {
            setSaving(true);
            await updateQuiz(parseInt(quizId), {
                ...formData,
                lesson: lessonId,
            });
            showToast('Quiz berhasil diperbarui!', 'success');
            router.push('/learning/quizzes');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memperbarui Quiz');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Edit Quiz</h1>
                    <p className="text-gray-600 mt-1">{formData.title}</p>
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
                                        onChange={(e) => { setSelectedCourseSlug(e.target.value); setSelectedModuleId(''); setLessonId(0); }}
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
                                        onChange={(e) => { setSelectedModuleId(e.target.value); setLessonId(0); }}
                                        className="w-full mt-2 p-2 border rounded-lg">
                                        <option value="">Pilih Modul...</option>
                                        {modules.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Pelajaran (hanya tipe Quiz)</Label>
                                    <select value={lessonId}
                                        onChange={(e) => setLessonId(parseInt(e.target.value))}
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
                            <Input value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="mt-2" required />
                        </div>
                        <div>
                            <Label>Deskripsi</Label>
                            <textarea value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full mt-2 p-2 border rounded-lg" rows={2} />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <Label>Nilai Lulus (%)</Label>
                                <Input type="number" min="0" max="100" value={formData.passing_score_percentage}
                                    onChange={(e) => setFormData(prev => ({ ...prev, passing_score_percentage: parseInt(e.target.value) }))}
                                    className="mt-2" />
                            </div>
                            <div>
                                <Label>Maks Percobaan</Label>
                                <Input type="number" min="1" value={formData.max_attempts}
                                    onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                                    className="mt-2" />
                                <p className="text-xs text-gray-400 mt-1">Total percobaan <strong>termasuk yang pertama</strong>. Contoh: isi 2 berarti 1 ujian + 1 remedial.</p>
                            </div>
                            <div>
                                <Label>Batas Waktu (Menit)</Label>
                                <Input type="number" min="0" value={formData.time_limit_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) }))}
                                    className="mt-2" placeholder="0 = tanpa batas" />
                            </div>
                            <div>
                                <Label>Cooldown Retry (Menit)</Label>
                                <Input type="number" min="0" value={formData.retry_cooldown_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, retry_cooldown_minutes: parseInt(e.target.value) }))}
                                    className="mt-2" placeholder="0 = tidak ada, 1440 = 24 jam" />
                                <p className="text-xs text-gray-400 mt-1">Waktu tunggu sebelum retry setelah gagal. 0 = instant.</p>
                            </div>
                        </div>
                        <div>
                            <Label>Acak Pertanyaan</Label>
                            <div className="mt-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_randomized}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_randomized: e.target.checked }))} />
                                    Ya
                                </label>
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <span>⚠</span> Pilihan jawaban juga akan diacak saat ujian.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Batalkan</Button>
                    <Button type="submit" disabled={saving} className="min-w-32">
                        {saving ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
