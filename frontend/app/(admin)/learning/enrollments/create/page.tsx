'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader, UserPlus, Users } from 'lucide-react';
import { getCourses, enrollCourse } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function CreateEnrollmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [formData, setFormData] = useState({ course: '', username: '' });

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const data = await getCourses({ page_size: 100 });
            setCourses(data?.results || []);
        } catch { setCourses([]); }
        finally { setLoadingCourses(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.course) { showError('Pilih kursus', 'Validasi'); return; }
        if (!formData.username.trim()) { showError('Masukkan username siswa', 'Validasi'); return; }
        setLoading(true);
        try {
            await enrollCourse(formData.course);
            showToast('Siswa berhasil didaftarkan!', 'success');
            router.push('/learning/enrollments');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Mendaftarkan');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button onClick={() => router.back()} disabled={loading}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Enroll Siswa Manual</h1>
                        <p className="text-amber-100 text-sm">Daftarkan siswa ke kursus secara manual</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Form Enrollment</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="course" className="text-sm font-medium text-gray-700">Pilih Kursus <span className="text-red-500">*</span></Label>
                            <select id="course" value={formData.course}
                                onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                                disabled={loadingCourses}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 text-sm">
                                <option value="">Pilih Kursus...</option>
                                {courses.map((c: any) => (
                                    <option key={c.id} value={c.slug}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username Siswa <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                <input id="username"
                                    placeholder="Masukkan username siswa"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white transition-colors text-sm" required />
                            </div>
                            <p className="text-xs text-gray-400">Masukkan username yang terdaftar di sistem</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={() => router.back()}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={loading}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36">
                        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Mendaftarkan...</> : <><UserPlus className="w-4 h-4" /> Daftarkan</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
