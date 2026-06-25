'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCourse, getCourseProgress } from '@/lib/api/learning';
import { markLessonComplete } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showError, showToast } from '@/lib/sweetalert';
import LessonViewer from '@/components/learning/LessonViewer';
import AuthGuard from '@/components/auth/AuthGuard';

export default function LessonPage({ basePath = '/courses' }: { basePath?: string }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [slug, lessonId]);

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
        const found = progressData.lessons.find(
          (l: any) => l.id === parseInt(lessonId) || l.slug === lessonId
        );
        if (found) {
          setLesson(found);
        }
      }
    } catch (error) {
      showError(handleApiError(error), 'Gagal Load Pelajaran');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;
    try {
      await markLessonComplete(lesson.slug);
      showToast('Pelajaran selesai!', 'success');
      fetchData();
    } catch (error) {
      showError(handleApiError(error), 'Gagal');
    }
  };

  const handleNext = () => {
    if (!progress?.lessons) return;
    const currentIndex = progress.lessons.findIndex(
      (l: any) => l.id === parseInt(lessonId) || l.slug === lessonId
    );
    if (currentIndex < progress.lessons.length - 1) {
      const nextLesson = progress.lessons[currentIndex + 1];
      router.push(`${basePath}/${slug}/lessons/${nextLesson.id}`);
    }
  };

  const handlePrevious = () => {
    if (!progress?.lessons) return;
    const currentIndex = progress.lessons.findIndex(
      (l: any) => l.id === parseInt(lessonId) || l.slug === lessonId
    );
    if (currentIndex > 0) {
      const prevLesson = progress.lessons[currentIndex - 1];
      router.push(`${basePath}/${slug}/lessons/${prevLesson.id}`);
    }
  };

  if (loading) {
    return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
    );
  }

  if (!lesson || !progress) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">Pelajaran tidak ditemukan.</p>
            <Button onClick={() => router.push(`${basePath}/${slug}/learn`)}>Kembali ke Belajar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lessonIndex = progress.lessons.findIndex(
    (l: any) => l.id === parseInt(lessonId) || l.slug === lessonId
  );
  const isCompleted = lesson.is_completed;

  return (
    <AuthGuard>
    <div>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <LessonViewer
          lesson={lesson}
          progress={{
            completed_lessons: progress.completed_lessons,
            total_lessons: progress.total_lessons,
            progress_percentage: progress.progress_percentage,
          }}
          isCompleted={isCompleted}
          onMarkComplete={handleMarkComplete}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={lessonIndex < progress.lessons.length - 1}
          hasPrevious={lessonIndex > 0}
        />
      </div>
    </div>
    </AuthGuard>
  );
}
