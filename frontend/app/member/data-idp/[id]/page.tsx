'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Database, ArrowLeft, User, BadgeCheck, Briefcase,
    Calendar, FileText, CheckCircle2, Clock, XCircle,
    Loader2
} from 'lucide-react';
import { userProfileService, type UserProfile } from '@/lib/services/user-profile.service';

interface IdpItem {
    id: number;
    asn_nama: string;
    asn_nip: string;
    atasan_langsung: string;
    periode_mulai: string;
    periode_selesai: string;
    tanggal_pengajuan: string;
    dasar_penyusunan: string;
    status: string;
}

const idpData: IdpItem[] = [
    {
        id: 1, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2025-01-01', periode_selesai: '2025-06-30',
        tanggal_pengajuan: '2025-01-10',
        dasar_penyusunan: 'Peraturan BKN No. 5 Tahun 2024 tentang Pengembangan Kompetensi ASN',
        status: 'Draft',
    },
    {
        id: 2, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Dr. ANDRI ISKANDAR, M.T.',
        periode_mulai: '2025-07-01', periode_selesai: '2025-12-31',
        tanggal_pengajuan: '2025-07-01',
        dasar_penyusunan: 'Hasil evaluasi capaian kompetensi Semester 1 Tahun 2025',
        status: 'Proses',
    },
    {
        id: 3, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Hj. MASYITA, S.STP., M.Si.',
        periode_mulai: '2024-01-01', periode_selesai: '2024-06-30',
        tanggal_pengajuan: '2024-01-15',
        dasar_penyusunan: 'Peraturan Pemerintah No. 17 Tahun 2020 tentang Manajemen ASN',
        status: 'Disetujui',
    },
    {
        id: 4, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2024-07-01', periode_selesai: '2024-12-31',
        tanggal_pengajuan: '2024-07-20',
        dasar_penyusunan: 'Rencana Strategis Pengembangan Kompetensi ASN 2024-2029',
        status: 'Disetujui',
    },
    {
        id: 5, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Ir. FAUZAN, M.Si.',
        periode_mulai: '2023-01-01', periode_selesai: '2023-06-30',
        tanggal_pengajuan: '2023-01-18',
        dasar_penyusunan: 'SKP Tahun 2023',
        status: 'Ditolak',
    },
    {
        id: 6, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Dr. RINA DEVI, S.E., M.M.',
        periode_mulai: '2023-07-01', periode_selesai: '2023-12-31',
        tanggal_pengajuan: '2023-07-12',
        dasar_penyusunan: 'Peraturan Menteri PANRB No. 7 Tahun 2022',
        status: 'Disetujui',
    },
    {
        id: 7, asn_nama: '', asn_nip: '',
        atasan_langsung: 'Drs. H. SYAMSUAR, M.M.',
        periode_mulai: '2022-01-01', periode_selesai: '2022-06-30',
        tanggal_pengajuan: '2022-02-01',
        dasar_penyusunan: 'Undang-Undang ASN No. 5 Tahun 2014',
        status: 'Disetujui',
    },
];

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    'Draft': { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-500/10', icon: FileText },
    'Proses': { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-500/10', icon: Clock },
    'Disetujui': { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-500/10', icon: CheckCircle2 },
    'Ditolak': { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-500/10', icon: XCircle },
};

export default function IdpDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const item = idpData.find(i => i.id === Number(params.id));

    useEffect(() => {
        userProfileService.getProfile()
            .then(setProfile)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-xl font-bold text-foreground">Data IDP Tidak Ditemukan</h2>
                <button onClick={() => router.push('/member/data-idp')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke daftar IDP
                </button>
            </div>
        );
    }

    const statusCfg = statusConfig[item.status] || statusConfig['Draft'];
    const StatusIcon = statusCfg.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-8">
                <div className="relative z-10">
                    <button onClick={() => router.push('/member/data-idp')}
                        className="inline-flex items-center gap-1.5 text-sm text-violet-200 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar IDP
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Detail IDP</h1>
                            <p className="text-violet-100 text-sm">
                                Periode: {item.periode_mulai} s.d {item.periode_selesai}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Pegawai */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                        <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama ASN</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                                {profile?.user_name || '-'}
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NIP</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{profile?.nip || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jabatan</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                {profile?.jabatan || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail IDP */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Database className="w-5 h-5" /> Informasi IDP
                        </h2>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {item.status}
                        </span>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atasan Langsung</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{item.atasan_langsung}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Pengajuan</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{item.tanggal_pengajuan}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Periode Mulai</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{item.periode_mulai}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Periode Selesai</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{item.periode_selesai}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dasar Penyusunan IDP</p>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">{item.dasar_penyusunan}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
