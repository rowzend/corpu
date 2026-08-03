'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock } from 'lucide-react';

interface CourseCardProps {
    course: {
        id: number;
        title: string;
        slug: string;
        short_description?: string;
        thumbnail?: string;
        level: string;
        duration_minutes: number;
        enrolled_count: number;
        rating_avg: number;
        is_featured?: boolean;
    };
    showEnroll?: boolean;
    onEnroll?: (slug: string) => void;
    isEnrolled?: boolean;
}

export default function CourseCard({ course, showEnroll, onEnroll, isEnrolled }: CourseCardProps) {
    const router = useRouter();

    return (
        <Card className="hover:shadow-lg transition cursor-pointer" onClick={() => router.push(`/courses/${course.slug}`)}>
            {course.thumbnail && (
                <div className="h-40 bg-gray-200 overflow-hidden rounded-t-lg">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
            )}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{course.title}</CardTitle>
                    {course.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 ml-2">Featured</Badge>
                    )}
                </div>
                <Badge className={`w-fit ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : course.level === 'intermediate' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {course.level === 'beginner' ? 'Pemula' : course.level === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                </Badge>
            </CardHeader>
            <CardContent>
                {course.short_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.short_description}</p>
                )}
                <div className="flex justify-between text-sm mb-4">
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration_minutes} menit</div>
                    <div className="flex items-center gap-1"><Users className="w-4 h-4" />{course.enrolled_count}</div>
                    <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-500" />{course.rating_avg.toFixed(1)}</div>
                </div>
                {showEnroll && onEnroll && (
                    <Button
                        className="w-full"
                        variant={isEnrolled ? 'outline' : 'default'}
                        onClick={(e) => { e.stopPropagation(); onEnroll(course.slug); }}
                    >
                        {isEnrolled ? 'Lanjutkan' : 'Daftar Kursus'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
