'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, ChevronLeft, ChevronRight, FileText, Video,
  ExternalLink, File, HelpCircle, Menu, X, Lock, Award, Clock
} from 'lucide-react';
import { getCourse, getCourseProgress } from '@/lib/api/learning';
import { markLessonComplete, saveTimerProgress } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError, showToast, showWarning } from '@/lib/sweetalert';
import ProgressBar from '@/components/learning/ProgressBar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function CourseLearnPage({ basePath = '/courses' }: { basePath?: string }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  const lessons = progress?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const hasNext = currentLessonIndex < lessons.length - 1;
  const hasPrevious = currentLessonIndex > 0;

  // Timer effect: resume from saved time_spent_minutes, count up per lesson
  useEffect(() => {
    const saved = currentLesson?.time_spent_minutes || 0;
    setElapsedSeconds(saved * 60);
    setTimerRunning(true);
  }, [currentLessonIndex]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Auto-pause timer when user switches tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTimerRunning(false);
      } else {
        setTimerRunning(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-save timer progress every 30 seconds
  useEffect(() => {
    if (!currentLesson || currentLesson.is_completed) return;
    const interval = setInterval(async () => {
      const sec = elapsedRef.current;
      const minutes = Math.max(1, Math.round(sec / 60));
      try {
        await saveTimerProgress(currentLesson.slug, minutes);
      } catch {
        // silent fail — jangan ganggu user
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentLesson?.slug, currentLesson?.is_completed]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, progressData] = await Promise.all([
        getCourse(slug),
        getCourseProgress(slug).catch(() => null),
      ]);
      setCourse(courseData);

      if (progressData?.lessons) {
        setProgress(progressData);
        const firstIncomplete = progressData.lessons.findIndex((l: any) => !l.is_completed);
        if (firstIncomplete > 0) {
          setCurrentLessonIndex(firstIncomplete);
        }
      }
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Kursus');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || marking) return;

    if (currentLesson.duration_minutes > 0) {
      const minRequired = currentLesson.duration_minutes;
      const timeSpent = Math.max(1, Math.round(elapsedSeconds / 60));
      if (timeSpent < minRequired) {
        showWarning(
          `Kamu baru belajar ${timeSpent} menit. Selesaikan minimal ${minRequired} menit sebelum menandai selesai.`,
          'Waktu Belajar Kurang'
        );
        return;
      }
    }

    setMarking(true);
    setTimerRunning(false);
    try {
      const timeSpent = Math.max(1, Math.round(elapsedSeconds / 60));
      await markLessonComplete(currentLesson.slug, timeSpent);
      showToast('Pelajaran selesai!', 'success');
      await fetchData();
    } catch (error) {
      showError(handleApiError(error), 'Gagal');
      setTimerRunning(true);
    } finally {
      setMarking(false);
    }
  };

  const renderContent = useCallback(() => {
    if (!currentLesson) return null;

    switch (currentLesson.content_type) {
      case 'video':
        return (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video controls className="w-full h-full" src={currentLesson.video_url} />
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
            <File className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium">File Dokumen</p>
              {currentLesson.file_url && (
                <a href={currentLesson.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  Download/View File
                </a>
              )}
            </div>
          </div>
        );
      case 'link':
        return (
          <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
            <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium">Link Eksternal</p>
              {currentLesson.external_url && (
                <a href={currentLesson.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  {currentLesson.external_url}
                </a>
              )}
            </div>
          </div>
        );
      case 'article':
      default:
        return (
          <div className="prose max-w-none">
            {currentLesson.content ? (
              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
            ) : (
              <p className="text-muted-foreground italic">Belum ada konten untuk pelajaran ini.</p>
            )}
          </div>
        );
    }
  }, [currentLesson]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!course || !progress) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Anda belum mendaftar kursus ini.</p>
            <Button onClick={() => router.push(`${basePath}/${slug}`)}>Lihat Kursus</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      article: 'Artikel', video: 'Video', document: 'Dokumen', link: 'Link', quiz: 'Kuis'
    };
    return labels[type] || type;
  };

  return (
    <AuthGuard>
    <div className="flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm truncate">{course.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2">
            <ProgressBar value={progress.completed_lessons} max={progress.total_lessons} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">{progress.completed_lessons}/{progress.total_lessons} selesai</p>
            {progress.course_duration_minutes > 0 && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Sisa {progress.remaining_duration_minutes} menit</span>
                <span className="text-muted-foreground">·</span>
                <span>Total {progress.course_duration_minutes} menit</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-2">
            {(() => {
              const groups: { module_id: number; module_title: string; lessons: any[]; lessonStartIndex: number }[] = [];
              let currentGroup: typeof groups[0] | null = null;
              lessons.forEach((lesson: any, idx: number) => {
                if (!currentGroup || currentGroup.module_id !== lesson.module_id) {
                  currentGroup = { module_id: lesson.module_id, module_title: lesson.module_title, lessons: [], lessonStartIndex: idx };
                  groups.push(currentGroup);
                }
                currentGroup.lessons.push(lesson);
              });
              return groups.map((group) => (
                <div key={group.module_id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">{group.module_title}</p>
                  <div className="space-y-0.5 mt-1">
                    {group.lessons.map((lesson: any, localIndex: number) => {
                      const globalIndex = group.lessonStartIndex + localIndex;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (lesson.is_unlocked === false) return;
                            setCurrentLessonIndex(globalIndex);
                          }}
                          disabled={lesson.is_unlocked === false}
                          className={`w-full text-left p-2.5 rounded-lg transition flex items-start gap-3 ${
                            lesson.is_unlocked === false
                              ? 'opacity-50 cursor-not-allowed'
                              : globalIndex === currentLessonIndex
                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-muted'
                          }`}
                        >
                          <div className="mt-0.5">
                            {lesson.is_completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : lesson.is_unlocked === false ? (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-medium ${
                                globalIndex === currentLessonIndex ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-border text-muted-foreground'
                              }`}>
                                {globalIndex + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${
                              lesson.is_unlocked === false ? 'text-muted-foreground' :
                              globalIndex === currentLessonIndex ? 'font-medium text-blue-700 dark:text-blue-400' : 'text-foreground'
                            }`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{getContentTypeLabel(lesson.content_type)}</span>
                              <span className="text-[10px] text-muted-foreground">{lesson.duration_minutes}m</span>
                              {lesson.quiz_score !== null && lesson.quiz_score !== undefined && lesson.content_type === 'quiz' && (
                                <span className={`text-[10px] font-medium ${lesson.quiz_passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {lesson.quiz_score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-4">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => router.push(`${basePath}/${slug}`)}
            className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            &larr; Kembali
          </button>
          {currentLesson && currentLesson.content_type !== 'quiz' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Belajar</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                onClick={() => setTimerRunning(r => !r)}
                className="text-xs text-muted-foreground hover:text-muted-foreground px-1"
                title={timerRunning ? 'Jeda Timer' : 'Lanjutkan Timer'}
              >
                {timerRunning ? '⏸' : '▶'}
              </button>
            </div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${basePath}/${slug}`)}
            >
              Detail Kursus
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`${basePath}/my-courses`)}
            >
              Kursus Saya
            </Button>
          </div>
        </div>

        {/* Content area */}
        {currentLesson ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {progress.progress_percentage >= 100 && progress.certificate && (
                <Card className="border-green-300 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <Award className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-green-800 mb-1">Selamat! Kursus Selesai!</h2>
                    <p className="text-green-600 dark:text-green-400 mb-2">Anda telah menyelesaikan seluruh materi.</p>
                    <div className="inline-block bg-card rounded-lg border border-green-200 p-4 mb-4">
                      <p className="text-sm text-muted-foreground">Nomor Sertifikat</p>
                      <p className="font-mono font-bold text-foreground">{progress.certificate.certificate_number}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diterbitkan: {new Date(progress.certificate.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => router.push(`${basePath}/certificates`)}>Lihat Sertifikat Saya</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">{currentLesson.module_title}</span>
                  <span className="text-muted-foreground">/</span>
                  <Badge variant="outline" className="text-xs">
                    {getContentTypeLabel(currentLesson.content_type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{currentLesson.duration_minutes} menit</span>
                  {currentLesson.content_type !== 'quiz' && (
                    <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                      ⏱ {formatTime(elapsedSeconds)}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
              </div>

              <Card>
                <CardContent className="p-6 relative">
                  {currentLesson.is_unlocked === false ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground">Materi Terkunci</h3>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        Selesaikan semua materi sebelumnya untuk membuka materi ini.
                      </p>
                    </div>
                  ) : (
                    renderContent()
                  )}
                </CardContent>
              </Card>

              {/* Quiz button for quiz-type lessons */}
              {currentLesson.content_type === 'quiz' && (
                currentLesson.quiz_score !== null && currentLesson.quiz_score !== undefined ? (
                  <Card className="border-green-200">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-lg">Kuis Selesai</p>
                      <p className={`text-2xl font-bold mt-2 ${currentLesson.quiz_passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {currentLesson.quiz_score}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentLesson.quiz_passed ? 'Lulus' : 'Tidak Lulus'}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push(`${basePath}/${slug}/lessons/${currentLesson.id}/quiz`)}
                      >
                        Lihat Hasil Kuis
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    className="w-full"
                    disabled={currentLesson.is_unlocked === false}
                    onClick={() => router.push(`${basePath}/${slug}/lessons/${currentLesson.id}/quiz`)}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    {currentLesson.is_unlocked === false ? 'Selesaikan Materi Sebelumnya' : 'Mulai Kuis'}
                  </Button>
                )
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {hasPrevious && (
                    <Button variant="outline" onClick={() => setCurrentLessonIndex(i => i - 1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" />Sebelumnya
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentLesson.content_type !== 'quiz' && (
                    <Button
                      onClick={handleMarkComplete}
                      disabled={marking || currentLesson.is_completed || currentLesson.is_unlocked === false}
                      variant={currentLesson.is_completed ? 'outline' : 'default'}
                      className={currentLesson.is_completed ? 'text-green-600 dark:text-green-400 border-green-300' : ''}
                    >
                      <CheckCircle className={`w-4 h-4 mr-2 ${currentLesson.is_completed ? 'fill-green-500 text-white' : ''}`} />
                      {currentLesson.is_completed ? 'Selesai' : marking ? 'Memproses...' : 'Tandai Selesai'}
                    </Button>
                  )}
                  {hasNext && (
                    <Button onClick={() => setCurrentLessonIndex(i => i + 1)}>
                      Selanjutnya<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Kursus ini belum memiliki pelajaran.</p>
              <Button onClick={() => router.push(`${basePath}/${slug}`)}>Kembali</Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
