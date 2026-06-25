'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, Award, ArrowLeft, RotateCcw, RefreshCw } from 'lucide-react';
import { takeQuiz, submitQuizAttempt, getMyQuizAttempts, getQuizResult, getQuizzes, bypassQuizCooldown } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError, showToast } from '@/lib/sweetalert';
import QuizTaker from '@/components/learning/QuizTaker';
import ProgressBar from '@/components/learning/ProgressBar';
import AuthGuard from '@/components/auth/AuthGuard';
import { usePermission } from '@/lib/hooks/usePermission';

function CooldownTimer({ seconds: initial }: { seconds: number }) {
  const [secs, setSecs] = useState(initial);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (secs <= 0) return null;
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  parts.push(`${s} detik`);
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-amber-700 font-medium">Cooldown Aktif</p>
      <p className="text-sm text-amber-600 mt-0.5 font-mono">Tunggu {parts.join(' ')} lagi</p>
    </div>
  );
}

function convertDraftToRecord(draftAnswers: any[]): Record<number, any> {
  const record: Record<number, any> = {};
  for (const ans of draftAnswers) {
    if (ans.question_id) {
      record[ans.question_id] = ans;
    }
  }
  return record;
}

export default function QuizPage({ basePath = '/courses' }: { basePath?: string }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const { hasPermission } = usePermission();
  const canBypassCooldown = hasPermission('learning', 'timer_bypass', 'lessons');

  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draftAnswers, setDraftAnswers] = useState<any[]>([]);
  const [draftTimeSpent, setDraftTimeSpent] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const quizzesData = await getQuizzes({ lesson_id: parseInt(lessonId) });
      const quizzes = quizzesData?.results || [];
      if (quizzes.length > 0) {
        const quizData = await takeQuiz(quizzes[0].id);
        setQuiz(quizData);

        if (quizData.draft_answers && quizData.draft_answers.length > 0) {
          setDraftAnswers(quizData.draft_answers);
          setDraftTimeSpent(quizData.draft_time_spent || 0);
          setHasDraft(true);
        }

        const attemptsData = await getMyQuizAttempts(quizzes[0].id).catch(() => []);
        setAttempts(filterAttempts(attemptsData, quizzes[0].id));
      }
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Kuis');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (quiz && quiz.max_attempts !== -1 && attempts.length >= quiz.max_attempts) {
      showError('Batas percobaan telah habis', 'Tidak bisa memulai');
      return;
    }
    setIsTaking(true);
    setSubmitted(false);
    setLatestResult(null);
    setHasDraft(false);
  };

  const filterAttempts = (data: any[], quizId: number) =>
    (data || []).filter((a: any) => a.quiz === quizId);

  const handleSubmit = async (answers: any[], timeSpent?: number) => {
    if (!quiz) return;
    try {
      const result = await submitQuizAttempt(quiz.id, answers, timeSpent);
      setLatestResult(result);
      setSubmitted(true);
      setIsTaking(false);
      const attemptsData = await getMyQuizAttempts(quiz.id).catch(() => []);
      setAttempts(filterAttempts(attemptsData, quiz.id));
    } catch (error) {
      const message = handleApiError(error);
      setIsTaking(false);
      setSubmitted(false);
      setLatestResult(null);
      showError(message, 'Gagal Kirim Jawaban');
      try {
        const newAttempts = await getMyQuizAttempts(quiz.id).catch(() => []);
        setAttempts(filterAttempts(newAttempts, quiz.id));
      } catch {}
    }
  };

  const handleViewResult = async (attemptId: number) => {
    if (!quiz) return;
    try {
      const result = await getQuizResult(quiz.id, attemptId);
      setLatestResult(result);
      setSubmitted(true);
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Hasil');
    }
  };

  // Auto-show latest result if already attempted
  useEffect(() => {
    if (!quiz || attempts.length === 0 || submitted || isTaking) return;
    const loadLatest = async () => {
      const latest = attempts.reduce((best: any, a: any) =>
        new Date(a.completed_at || a.started_at) > new Date(best.completed_at || best.started_at) ? a : best
      , attempts[0]);
      if (latest?.id) {
        try {
          const result = await getQuizResult(quiz.id, latest.id);
          setLatestResult(result);
          setSubmitted(true);
        } catch (_) {}
      }
    };
    loadLatest();
  }, [quiz, attempts, submitted, isTaking]);

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
          initialAnswers={convertDraftToRecord(draftAnswers)}
          initialTimeSpent={draftTimeSpent}
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
                <p className="text-xl font-bold text-purple-700">{attempts.length}</p>
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

        {attempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Percobaan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[...attempts]
                  .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                  .map((a: any, i: number) => (
                    <div key={a.id} className="flex items-center justify-between px-6 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono">#{attempts.length - i}</span>
                        <span className={a.passed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {a.score !== undefined ? `${a.score}%` : '-'}
                        </span>
                        {a.passed
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {a.completed_at
                            ? new Date(a.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Belum selesai'}
                        </span>
                        {a.completed_at && (
                          <button
                            onClick={() => handleViewResult(a.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Lihat Hasil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {attempts.length === 0 ? (
          <div className="text-center">
            {hasDraft ? (
              <>
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                  <p className="text-amber-700 text-sm flex items-center gap-2 justify-center">
                    <RefreshCw className="w-4 h-4" />
                    Anda memiliki kuis yang belum selesai
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button size="lg" onClick={handleStartQuiz} className="px-8">
                    <RefreshCw className="w-4 h-4 mr-2" />Lanjutkan Kuis
                  </Button>
                </div>
              </>
            ) : (
              <Button size="lg" onClick={handleStartQuiz} className="px-8">
                Mulai Kuis
              </Button>
            )}
          </div>
        ) : attempts.some(a => a.passed) ? (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Kuis Sudah Lulus</p>
          </div>
        ) : quiz?.max_attempts === -1 || attempts.length < (quiz?.max_attempts || 1) ? (
          <div className="text-center space-y-3">
            {(() => {
              if (quiz?.retry_cooldown_minutes > 0) {
                const lastFailed = [...attempts]
                  .filter(a => !a.passed && a.completed_at)
                  .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
                if (lastFailed.length > 0) {
                  const cooldownEnd = new Date(lastFailed[0].completed_at).getTime() + quiz.retry_cooldown_minutes * 60000;
                  const remainingSecs = Math.ceil((cooldownEnd - Date.now()) / 1000);
                  if (remainingSecs > 0) {
                    return (
                      <>
                        <CooldownTimer seconds={remainingSecs} />
                        {canBypassCooldown && (
                          <button
                            onClick={async () => {
                              try {
                                await bypassQuizCooldown(quiz.id);
                                showToast('Cooldown berhasil dilewati!', 'success');
                                window.location.reload();
                              } catch (e) {
                                showError(handleApiError(e), 'Gagal');
                              }
                            }}
                            className="text-xs text-amber-600 hover:text-amber-800 underline"
                          >
                            Bypass Cooldown (Developer)
                          </button>
                        )}
                      </>
                    );
                  }
                }
              }
              const remaining = (quiz?.max_attempts || 1) - attempts.length;
              return (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Sisa percobaan: {remaining}x</p>
                  <Button size="lg" onClick={handleStartQuiz} className="px-8">
                    Mulai Ulang
                  </Button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Batas Percobaan Habis</p>
            <p className="text-sm text-red-600 mt-1">Anda telah mencapai batas maksimal percobaan untuk quiz ini ({quiz?.max_attempts}x).</p>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
