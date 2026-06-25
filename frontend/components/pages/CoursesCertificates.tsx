'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    Award, Download, Search, BookOpen, Calendar,
    Hash, Medal
} from 'lucide-react';
import { getCertificates, downloadCertificate } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function CoursesCertificates({ basePath = '/courses' }: { basePath?: string }) {
    const router = useRouter();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCertificates();
            setCertificates(data?.results || []);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Sertifikat');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (cert: any) => {
        if (cert.pdf_url) {
            window.open(cert.pdf_url, '_blank');
            return;
        }
        try {
            const blob = await downloadCertificate(cert.id);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            showError('Gagal mengunduh sertifikat', 'Error');
        }
    };

    const filtered = certificates.filter(c =>
        c.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        c.certificate_number?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: certificates.length,
        active: certificates.filter(c => c.is_active).length,
        uniqueCourses: new Set(certificates.map(c => c.course_title)).size,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Sertifikat Saya</h1>
                            <p className="text-amber-100 text-sm">Sertifikat yang telah Anda raih dari kursus yang telah diselesaikan</p>
                        </div>
                    </div>

                    {/* Stats */}
                    {certificates.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                            {[
                                { label: 'Total Sertifikat', value: stats.total, icon: Award, color: 'bg-amber-400/20 text-amber-200' },
                                { label: 'Siap Download', value: stats.active, icon: Download, color: 'bg-green-400/20 text-green-200' },
                                { label: 'Kursus', value: stats.uniqueCourses, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${stat.color}`}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-xs text-amber-200">{stat.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Search */}
            {certificates.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari sertifikat berdasarkan kursus atau nomor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Certificate Grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {certificates.length === 0 ? 'Belum ada sertifikat' : 'Sertifikat tidak ditemukan'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {certificates.length === 0
                            ? 'Selesaikan kursus untuk mendapatkan sertifikat.'
                            : 'Tidak ada sertifikat yang cocok dengan pencarian.'}
                    </p>
                    {certificates.length === 0 && (
                        <button
                            onClick={() => router.push(`${basePath}/browse`)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-amber-200"
                        >
                            <BookOpen className="w-4 h-4" /> Jelajahi Kursus
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((cert) => (
                        <div
                            key={cert.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all overflow-hidden"
                        >
                            {/* Top Accent */}
                            <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />

                            <div className="p-6">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center">
                                    <Medal className="w-7 h-7 text-amber-600" />
                                </div>

                                <h3 className="font-semibold text-gray-900 text-center mb-3 line-clamp-2">
                                    {cert.course_title}
                                </h3>

                                <div className="space-y-2 text-xs text-gray-500 mb-4">
                                    <div className="flex items-center gap-2 justify-center">
                                        <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{cert.certificate_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span>
                                            {new Date(cert.issued_at).toLocaleDateString('id-ID', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    {cert.user_username && (
                                        <div className="flex items-center gap-2 justify-center">
                                            <span className="text-gray-400">@</span>
                                            <span>{cert.user_username}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`${basePath}/${cert.course_slug}`)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-gray-200"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" /> Kursus
                                    </button>
                                    <button
                                        onClick={() => handleDownload(cert)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-xl font-medium transition-all shadow-md shadow-amber-200"
                                    >
                                        <Download className="w-3.5 h-3.5" /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
