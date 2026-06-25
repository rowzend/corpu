'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Award } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface EnrollmentCardProps {
    enrollment: {
        id: number;
        course: number;
        course_title: string;
        course_slug: string;
        course_thumbnail?: string;
        status: string;
        progress_percentage: number;
        has_certificate: boolean;
    };
}

export default function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
    const router = useRouter();

    return (
        <Card className="hover:shadow-lg transition">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {enrollment.course_thumbnail && (
                        <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={enrollment.course_thumbnail} alt={enrollment.course_title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{enrollment.course_title}</h3>
                                <Badge variant="outline" className={`mt-1 ${
                                    enrollment.status === 'active' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                    enrollment.status === 'completed' ? 'text-green-600 border-green-200 bg-green-50' :
                                    'text-gray-600 border-gray-200 bg-gray-50'
                                }`}>
                                    {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Berhenti'}
                                </Badge>
                            </div>
                            {enrollment.has_certificate && (
                                <Award className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="mt-3">
                            <ProgressBar value={enrollment.progress_percentage} size="sm" />
                        </div>
                        <div className="mt-3 flex gap-2">
                            {enrollment.status === 'active' && (
                                <Button size="sm" onClick={() => router.push(`/courses/${enrollment.course_slug}`)}>
                                    <Play className="w-3 h-3 mr-1" />Lanjutkan
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => router.push(`/courses/${enrollment.course_slug}`)}>
                                Detail
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
