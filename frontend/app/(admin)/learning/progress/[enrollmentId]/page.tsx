'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Circle, User, BookOpen, Award } from 'lucide-react';
import { getEnrollment } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { ProgressBar } from '@/components/learning';

export default function StudentProgressDetailPage() {
    const router = useRouter();
    const params = useParams();
    const enrollmentId = parseInt(params.enrollmentId as string);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [enrollmentId]);

    const fetchData = async () => {
        try {
            const data = await getEnrollment(enrollmentId);
            setEnrollment(data);
        } catch (error) {
            console.error('Error:', handleApiError(error));
        } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-36 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (!enrollment) return null;

    const progress = enrollment.progress || { completed_lessons: 0, total_lessons: 0 };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button onClick={() => router.push('/learning/progress')}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">{enrollment.user_name}</h1>
                        <p className="text-teal-100 text-sm">{enrollment.course_title}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Informasi</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Siswa</span>
                            <span className="text-sm font-medium">{enrollment.user_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Kursus</span>
                            <span className="text-sm font-medium">{enrollment.course_title}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge className={`border-0 ${
                                enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                enrollment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Berhenti'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Progres</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <ProgressBar value={enrollment.progress_percentage} size="lg" />
                        <p className="text-center text-sm text-gray-500">
                            {progress.completed_lessons} dari {progress.total_lessons} pelajaran selesai
                        </p>
                    </div>
                </div>

                {/* Certificate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-teal-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Sertifikat</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">Status</span>
                            {enrollment.has_certificate ? (
                                <Badge className="bg-green-100 text-green-700 border-0">Diterbitkan</Badge>
                            ) : (
                                <Badge variant="outline" className="text-gray-500">Belum</Badge>
                            )}
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-50">
                            <span className="text-sm text-gray-500">Tanggal Daftar</span>
                            <span className="text-sm font-medium">{new Date(enrollment.enrolled_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {enrollment.completed_at && (
                            <div className="flex justify-between py-2 border-t border-gray-50">
                                <span className="text-sm text-gray-500">Selesai</span>
                                <span className="text-sm font-medium text-green-600">{new Date(enrollment.completed_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
