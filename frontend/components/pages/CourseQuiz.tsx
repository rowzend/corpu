'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, Award, ArrowLeft, RotateCcw } from 'lucide-react';
import { takeQuiz, submitQuizAttempt, getMyQuizAttempts, getQuizResult, getQuizzes } from '@/lib/api/learning';
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

        const attemptsData = await getMyQuizAttempts(quizzes[0].id).catch(() => []);
        setAttempts(attemptsData || []);
      }
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Kuis');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setIsTaking(true);
    setSubmitted(false);
    setLatestResult(null);
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
    } catch (error) {
      showError(handleApiError(error), 'Gagal Kirim Jawaban');
      throw error;
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
                        {answer.selected_choice && (
                          <p className="text-sm text-gray-600 mt-1">Jawaban Anda: {answer.selected_choice}</p>
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

        {attempts.length === 0 && (
          <div className="text-center">
            <Button size="lg" onClick={handleStartQuiz} className="px-8">
              Mulai Kuis
            </Button>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
