'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCertificates, downloadCertificate } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Award, User, Calendar, Hash, ScrollText } from 'lucide-react';

export default function UserCertificatesPage() {
    const router = useRouter();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchCerts(); }, []);

    const fetchCerts = async () => {
        try {
            setLoading(true);
            const data = await getCertificates();
            setCertificates(data.results || []);
        } catch (e) {
            showError(handleApiError(e), 'Gagal Load');
        } finally { setLoading(false); }
    };

    const handleDownload = async (id: number) => {
        try {
            const blob = await downloadCertificate(id);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (e) {
            showError(handleApiError(e), 'Gagal Download');
        }
    };

    const filtered = certificates.filter(c =>
        !search || c.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        c.certificate_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.user_username?.toLowerCase().includes(search.toLowerCase())
    );

    const grouped: Record<string, any[]> = {};
    filtered.forEach(c => {
        const key = c.user_name || c.user_username || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-muted rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-muted rounded-xl animate-pulse"></div>
                <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse"></div>)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Sertifikat Pengguna</h1>
                            <p className="text-violet-100 text-sm">Daftar sertifikat yang telah diterbitkan ke pengguna</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Total Sertifikat', value: certificates.length, icon: Award, color: 'bg-amber-400/20 text-amber-200' },
                            { label: 'Pengguna', value: new Set(certificates.map(c => c.user_name || c.user_username)).size, icon: User, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Siap Download', value: certificates.filter(c => c.is_active).length, icon: Download, color: 'bg-green-400/20 text-green-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-violet-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Cari nama, username, kursus, nomor sertifikat..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-muted focus:bg-card transition-colors text-sm" />
                </div>
            </div>

            {/* List */}
            {Object.keys(grouped).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([userName, certs]) => (
                        <div key={userName} className="bg-card rounded-xl shadow-sm border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white font-semibold text-xs">{userName.charAt(0)}</span>
                                    </div>
                                    <span className="font-semibold text-card-foreground">{userName}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">{certs.length} sertifikat</Badge>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {certs.map(cert => (
                                    <div key={cert.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted hover:border-violet-100 transition-all group">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                <Award className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-card-foreground text-sm">{cert.course_title}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{cert.certificate_number}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(cert.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    {cert.user_username && <span className="text-muted-foreground">@{cert.user_username}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload(cert.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-card-foreground hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex-shrink-0 ml-3">
                                            <Download className="w-3.5 h-3.5" /> PDF
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">Belum ada sertifikat</h3>
                    <p className="text-muted-foreground text-sm">Sertifikat akan muncul setelah pengguna menyelesaikan kursus</p>
                </div>
            )}
        </div>
    );
}
