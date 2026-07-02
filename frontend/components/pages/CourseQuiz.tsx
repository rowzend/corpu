'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, Award, ArrowLeft, RotateCcw } from 'lucide-react';
import { takeQuiz, submitQuizAttempt, getMyQuizAttempts, getQuizResult, getQuizzes, getQuiz, resumeQuizDraft, resumeQuiz } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError } from '@/lib/sweetalert';
import QuizTaker from '@/components/learning/QuizTaker';
import ProgressBar from '@/components/learning/ProgressBar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function QuizPage({ basePath = '/courses' }: { basePath?: string }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [initialAnswers, setInitialAnswers] = useState<Record<number, any> | undefined>(undefined);
  const [initialTimeSpent, setInitialTimeSpent] = useState<number | undefined>(undefined);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState('');

  const getCooldownInfo = (qz: any, atts: any[]) => {
    if (!qz?.retry_cooldown_minutes) return '';
    const failed = atts.filter(a => !a.passed).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    const last = failed[0];
    if (!last?.completed_at) return '';
    const cooldownEnd = new Date(new Date(last.completed_at).getTime() + qz.retry_cooldown_minutes * 60000);
    const now = Date.now();
    if (cooldownEnd.getTime() <= now) return '';
    const diffMs = cooldownEnd.getTime() - now;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return hours > 0 ? `Cooldown aktif. Tunggu ${hours} jam ${minutes} menit lagi.` : `Cooldown aktif. Tunggu ${minutes} menit lagi.`;
  };

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const quizzesData = await getQuizzes({ lesson_id: parseInt(lessonId) });
      const quizzes = quizzesData?.results || [];
      if (quizzes.length > 0) {
        const quizMeta = await getQuiz(quizzes[0].id);
        setQuiz({
          id: quizMeta.id,
          title: quizMeta.title,
          description: quizMeta.description,
          passing_score_percentage: quizMeta.passing_score_percentage,
          time_limit_minutes: quizMeta.time_limit_minutes,
          retry_cooldown_minutes: quizMeta.retry_cooldown_minutes,
          total_questions: quizMeta.total_questions,
          questions: [],
        });

        const attemptsData = await getMyQuizAttempts(quizzes[0].id).catch(() => []);
        setAttempts(attemptsData || []);

        setCooldownMsg(getCooldownInfo(quizMeta, attemptsData || []));

        try {
          const draftRes = await resumeQuizDraft(quizzes[0].id);
          setHasDraft(draftRes?.has_draft || false);
        } catch { setHasDraft(false); }
      }
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Kuis');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    setLoadingDraft(true);

    try {
      const quizData = await takeQuiz(quiz.id);
      setQuiz(prev => prev ? { ...prev, questions: quizData.questions || [] } : prev);

      // Mulai Ulang = fresh start, hapus draft localStorage
      const STORAGE_KEY_PREFIX = 'quiz_draft_';
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_time`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_marked`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_violations`);
      } catch {}

      setInitialAnswers(undefined);
      setInitialTimeSpent(undefined);

      setSubmitted(false);
      setLatestResult(null);
      setIsTaking(true);
    } catch (error: any) {
      const errMsg = handleApiError(error);
      if (errMsg?.includes('Cooldown')) {
        showError(errMsg, 'Cooldown Aktif');
      } else {
        showError(errMsg, 'Tidak dapat memulai kuis');
      }
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleResumeQuiz = async () => {
    if (!quiz) return;
    setLoadingDraft(true);
    try {
      const quizData = await resumeQuiz(quiz.id);
      setQuiz(prev => prev ? { ...prev, questions: quizData.questions || [] } : prev);

      const answersMap: Record<number, any> = {};
      (quizData.draft_answers || []).forEach((a: any) => {
        if (a.question_id) answersMap[a.question_id] = a;
      });
      setInitialAnswers(answersMap);
      setInitialTimeSpent(quizData.time_spent || 0);
      setSubmitted(false);
      setLatestResult(null);
      setIsTaking(true);
    } catch (error: any) {
      showError(handleApiError(error), 'Gagal melanjutkan kuis');
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSubmit = async (answers: any[], timeSpent?: number) => {
    if (!quiz) return;
    try {
      const result = await submitQuizAttempt(quiz.id, answers, timeSpent);
      setLatestResult(result);
      setSubmitted(true);
      setIsTaking(false);
      // Refresh attempts
      const attemptsData = await getMyQuizAttempts(quiz.id).catch(() => []);
      setAttempts(attemptsData || []);
      setCooldownMsg(attemptsData ? getCooldownInfo(quiz, attemptsData) : '');
    } catch (error) {
      showError(handleApiError(error), 'Gagal Kirim Jawaban');
      throw error;
    }
  };

  const handleViewResultClick = async (attemptId: number) => {
    if (!quiz) return;
    setIsLoadingResult(true);
    try {
      const result = await getQuizResult(quiz.id, attemptId);
      setLatestResult(result);
      setSubmitted(true);
      setCooldownMsg(getCooldownInfo(quiz, attempts));
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Hasil');
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">Tidak ada kuis untuk pelajaran ini.</p>
            <Button onClick={() => router.push(`${basePath}/${slug}/learn`)}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTaking) {
    return (
      <AuthGuard>
      <div className="py-6">
        <div className="max-w-4xl mx-auto mb-4">
          <button
            onClick={() => setIsTaking(false)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <QuizTaker
          quiz={quiz}
          onSubmit={handleSubmit}
          onCancel={() => setIsTaking(false)}
          initialAnswers={initialAnswers}
          initialTimeSpent={initialTimeSpent}
        />
      </div>
      </AuthGuard>
    );
  }

  if (submitted && latestResult) {
    return (
      <AuthGuard>
      <div className="py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className={`border-t-4 ${latestResult.passed ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <CardContent className="p-8 text-center">
              {latestResult.passed ? (
                <Award className="w-20 h-20 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold mb-2">
                {latestResult.passed ? 'Selamat! Anda Lulus!' : 'Belum Lulus'}
              </h2>
              <p className="text-gray-600 mb-6">{quiz.title}</p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{latestResult.score}%</p>
                  <p className="text-xs text-gray-600">Nilai</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{latestResult.correct_answers}/{latestResult.total_questions}</p>
                  <p className="text-xs text-gray-600">Benar</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{quiz.passing_score_percentage}%</p>
                  <p className="text-xs text-gray-600">Minimal Lulus</p>
                </div>
              </div>

              <ProgressBar value={latestResult.score} color={latestResult.passed ? 'green' : 'red'} size="lg" />

              <div className="flex gap-3 justify-center mt-6">
                {!latestResult.passed && !cooldownMsg && (
                  <Button variant="outline" onClick={handleStartQuiz} disabled={loadingDraft}>
                    {loadingDraft ? 'Memuat...' : <><RotateCcw className="w-4 h-4 mr-1" />Mulai Ulang</>}
                  </Button>
                )}
                {!latestResult.passed && cooldownMsg && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">{cooldownMsg}</p>
                )}
                <Button onClick={() => router.push(`${basePath}/${slug}/learn`)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />Kembali Belajar
                </Button>
              </div>
            </CardContent>
          </Card>

          {latestResult.answers && latestResult.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Jawaban</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestResult.answers.map((answer: any, idx: number) => {
                  const isEssay = answer.question_type === 'essay';
                  const needsGrading = isEssay && !answer.is_graded;
                  return (
                  <div key={answer.id} className={`p-4 rounded-lg border ${
                    needsGrading ? 'border-amber-200 bg-amber-50' : answer.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {needsGrading ? (
                        <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      ) : answer.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{idx + 1}. {answer.question_text}</p>
                        {answer.selected_choice_text && (
                          <p className="text-sm text-gray-600 mt-1">Jawaban Anda: {answer.selected_choice_text}</p>
                        )}
                        {answer.essay_answer && (
                          <p className="text-sm text-gray-600 mt-1">Jawaban Esai: {answer.essay_answer}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {needsGrading ? 'Perlu Dinilai' : `Poin: ${answer.points_earned}`}
                        </p>
                        {needsGrading && answer.grader_notes && (
                          <p className="text-xs text-gray-500 mt-1">Catatan: {answer.grader_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
      </AuthGuard>
    );
  }

  // Quiz overview with attempt history
  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best: any, a: any) => (a.score > best.score ? a : best), attempts[0])
    : null;

  return (
    <AuthGuard>
    <div className="py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.push(`${basePath}/${slug}/learn`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Belajar
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                {quiz.description && (
                  <p className="text-gray-600 mt-2">{quiz.description}</p>
                )}
              </div>
              <Badge className="text-sm px-3 py-1">
                Lulus: {quiz.passing_score_percentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <HelpCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">{quiz.total_questions}</p>
                <p className="text-xs text-gray-600">Total Soal</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-purple-700">{attempts.filter(a => a.status === 'completed').length}</p>
                <p className="text-xs text-gray-600">Percobaan</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-700">
                  {bestAttempt ? `${bestAttempt.score}%` : '-'}
                </p>
                <p className="text-xs text-gray-600">Nilai Terbaik</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {attempts.filter(a => a.status === 'completed').length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Riwayat Percobaan</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attempts.filter(a => a.status === 'completed').sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()).map((att, i) => (
                  <div key={att.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${att.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`} onClick={() => handleViewResultClick(att.id)}>
                    <div className="flex items-center gap-3">
                      {att.passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      <div>
                        <p className="text-sm font-medium">Percobaan #{i + 1}</p>
                        <p className="text-xs text-gray-500">{new Date(att.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${att.passed ? 'text-green-600' : 'text-red-600'}`}>{att.score}%</p>
                      <p className="text-xs text-gray-500">{att.passed ? 'Lulus' : 'Tidak Lulus'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center space-y-2">
          {isLoadingResult ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          ) : attempts.length === 0 && !hasDraft ? (
            <Button size="lg" onClick={handleStartQuiz} className="px-8">
              Mulai Kuis
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {cooldownMsg ? (
                <div className="max-w-md">
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">{cooldownMsg}</p>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  {hasDraft && (
                    <Button size="lg" onClick={handleResumeQuiz} className="px-8" disabled={loadingDraft}>
                      {loadingDraft ? 'Memuat...' : 'Lanjutkan'}
                    </Button>
                  )}
                  <Button size="lg" variant={hasDraft ? 'outline' : 'default'} onClick={handleStartQuiz} className="px-8">
                    Mulai Ulang
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
