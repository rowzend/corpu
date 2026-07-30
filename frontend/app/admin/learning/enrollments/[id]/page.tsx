'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User, BookOpen, Award, Calendar, CheckCircle } from 'lucide-react';
import { getEnrollment } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';

export default function EnrollmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const enrollmentId = parseInt(params.id as string);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchEnrollment(); }, [enrollmentId]);

    const fetchEnrollment = async () => {
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
                <div className="h-36 bg-muted rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (!enrollment) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button onClick={() => router.push('/admin/learning/enrollments')}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Detail Enrollment</h1>
                        <p className="text-amber-100 text-sm">{enrollment.course_title}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Info */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-600" />
                        <h2 className="text-lg font-semibold text-card-foreground">Informasi Siswa</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { label: 'Nama', value: enrollment.user_name },
                            { label: 'Username', value: enrollment.user_username },
                            { label: 'ID User', value: `#${enrollment.user}` },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                                <span className="text-sm font-medium text-card-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <h2 className="text-lg font-semibold text-card-foreground">Progres</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={`border-0 ${
                                enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                enrollment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-muted text-card-foreground'
                            }`}>
                                {enrollment.status === 'active' ? 'Aktif' : enrollment.status === 'completed' ? 'Selesai' : 'Berhenti'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Progres</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 bg-muted rounded-full h-2">
                                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${enrollment.progress_percentage || 0}%` }} />
                                </div>
                                <span className="text-sm font-medium">{enrollment.progress_percentage || 0}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Sertifikat</span>
                            <span className={`text-sm font-medium ${enrollment.has_certificate ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {enrollment.has_certificate ? 'Diterbitkan' : 'Belum'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Tanggal Daftar</span>
                            <span className="text-sm font-medium">{new Date(enrollment.enrolled_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {enrollment.completed_at && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Selesai</span>
                                <span className="text-sm font-medium text-green-600">{new Date(enrollment.completed_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
