'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronLeft, ChevronRight, FileText, Video, ExternalLink, File } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface LessonViewerProps {
    lesson: {
        id: number;
        title: string;
        content?: string;
        content_type: string;
        video_url?: string;
        video_embed_id?: string;
        file_url?: string;
        external_url?: string;
        duration_minutes: number;
    };
    progress: { completed_lessons: number; total_lessons: number; progress_percentage: number };
    isCompleted?: boolean;
    onMarkComplete?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

export default function LessonViewer({ lesson, progress, isCompleted, onMarkComplete, onNext, onPrevious, hasNext, hasPrevious }: LessonViewerProps) {
    const [marking, setMarking] = useState(false);

    const handleMarkComplete = async () => {
        if (!onMarkComplete) return;
        setMarking(true);
        try { await onMarkComplete(); } finally { setMarking(false); }
    };

    const renderContent = () => {
        switch (lesson.content_type) {
            case 'video':
                return (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        {lesson.video_embed_id ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${lesson.video_embed_id}`}
                                className="w-full h-full"
                                allowFullScreen
                                title={lesson.title}
                            />
                        ) : lesson.video_url ? (
                            <video controls className="w-full h-full" src={lesson.video_url} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <Video className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                );
            case 'document':
                return lesson.external_url ? (
                    <div className="space-y-3">
                        <div className="w-full aspect-video rounded-lg overflow-hidden border bg-gray-100 dark:bg-gray-800">
                            <iframe
                                src={lesson.external_url}
                                className="w-full h-full"
                                title={lesson.title}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <File className="w-4 h-4 text-blue-600" />
                            <a href={lesson.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Buka di tab baru &rarr;
                            </a>
                        </div>
                    </div>
                ) : lesson.file_url ? (
                    <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
                        <File className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="font-medium">File Dokumen</p>
                            <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                Download/View File
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
                        <File className="w-8 h-8 text-blue-600" />
                        <p className="text-gray-500 italic">Tidak ada file</p>
                    </div>
                );
            case 'link':
                return lesson.external_url ? (
                    <div className="space-y-3">
                        <div className="w-full aspect-video rounded-lg overflow-hidden border">
                            <iframe
                                src={lesson.external_url}
                                className="w-full h-full"
                                title={lesson.title}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                            <a href={lesson.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Buka di tab baru &rarr;
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
                        <ExternalLink className="w-8 h-8 text-blue-600" />
                        <p className="text-gray-500 italic">Tidak ada URL</p>
                    </div>
                );
            case 'article':
            default:
                return (
                    <div className="prose max-w-none">
                        {lesson.content ? (
                            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                        ) : (
                            <p className="text-gray-500 italic">Belum ada konten untuk pelajaran ini.</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                            {lesson.content_type === 'article' ? 'Artikel' :
                             lesson.content_type === 'video' ? 'Video' :
                             lesson.content_type === 'document' ? 'Dokumen' : 'Link'}
                        </Badge>
                        <span className="text-sm text-gray-600">{lesson.duration_minutes} menit</span>
                    </div>
                </div>
                {onMarkComplete && (
                    <Button
                        onClick={handleMarkComplete}
                        disabled={marking || isCompleted}
                        variant={isCompleted ? 'outline' : 'default'}
                        className={isCompleted ? 'text-green-600 border-green-300' : ''}
                    >
                        <CheckCircle className={`w-4 h-4 mr-2 ${isCompleted ? 'fill-green-500 text-white' : ''}`} />
                        {isCompleted ? 'Selesai' : 'Tandai Selesai'}
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-6">
                    {renderContent()}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-xs">
                    <ProgressBar value={progress.completed_lessons} max={progress.total_lessons} size="sm" />
                    <p className="text-xs text-gray-600 mt-1">
                        {progress.completed_lessons} dari {progress.total_lessons} pelajaran selesai
                    </p>
                </div>
                <div className="flex gap-2">
                    {onPrevious && (
                        <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious}>
                            <ChevronLeft className="w-4 h-4 mr-1" />Sebelumnya
                        </Button>
                    )}
                    {onNext && (
                        <Button onClick={onNext} disabled={!hasNext}>
                            Selanjutnya<ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
