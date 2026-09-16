'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, CheckCircle2, XCircle, FileClock } from 'lucide-react';
import { getIdpDetail, approveIdp, rejectIdp, type IdpAsn } from '@/lib/api/idp';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm, showInput } from '@/lib/sweetalert';

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-700' },
    verified: { label: 'Diverifikasi', className: 'bg-indigo-100 text-indigo-700' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
};

export default function IdpApprovalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [idp, setIdp] = useState<IdpAsn | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getIdpDetail(id);
            if (res?.data) setIdp(res.data);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    const handleApprove = async () => {
        const confirmed = await showConfirm(
            `Setujui IDP untuk "${idp?.asn_nama}"?`,
            'Setujui IDP',
            'Ya, Setujui',
            'Batal'
        );
        if (!confirmed) return;
        setProcessing(true);
        try {
            await approveIdp(id, '');
            showToast('IDP berhasil disetujui', 'success');
            router.push('/admin/dashboard/idp');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyetujui');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        const reason = await showInput('Tolak IDP', 'Alasan penolakan', 'Tuliskan alasan penolakan...', '', 'textarea');
        if (reason === null) return;
        setProcessing(true);
        try {
            await rejectIdp(id, reason);
            showToast('IDP berhasil ditolak', 'warning');
            router.push('/admin/dashboard/idp');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menolak');
        } finally {
            setProcessing(false);
        }
    };

    const st = idp ? (statusConfig[idp.status] || statusConfig.draft) : statusConfig.draft;
    const canApprove = idp?.status === 'verified';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard/idp')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approval IDP ASN</h1>
                    <p className="text-sm text-gray-500">Persetujuan Individual Development Plan oleh kepala unit kerja</p>
                </div>
            </div>

            {loading ? (
                <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ) : !idp ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                    IDP tidak ditemukan.
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">{idp.asn_nama}</p>
                                    <p className="text-xs text-muted-foreground">{idp.asn_nip} · {idp.asn_jabatan}</p>
                                </div>
                            </div>
                            <Badge className={`${st.className} border-0`}>{st.label}</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" /> Periode: {idp.periode_display}
                            </div>
                            <div className="text-muted-foreground">Atasan: {idp.atasan_langsung_nama || '-'}</div>
                        </div>

                        {idp.catatan && (
                            <div className="text-sm">
                                <span className="font-medium text-card-foreground">Catatan: </span>
                                <span className="text-muted-foreground">{idp.catatan}</span>
                            </div>
                        )}

                        {idp.verified_by && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileClock className="w-3.5 h-3.5" />
                                Diverifikasi oleh {idp.verified_by}
                                {idp.verified_at ? ` · ${new Date(idp.verified_at).toLocaleString('id-ID')}` : ''}
                            </div>
                        )}
                        {idp.approved_by && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileClock className="w-3.5 h-3.5" />
                                Disetujui oleh {idp.approved_by}
                                {idp.approved_at ? ` · ${new Date(idp.approved_at).toLocaleString('id-ID')}` : ''}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-muted/40 border-t border-border flex flex-wrap gap-2">
                        {canApprove ? (
                            <>
                                <Button onClick={handleApprove} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                                </Button>
                                <Button onClick={handleReject} disabled={processing} variant="destructive">
                                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                IDP ini berstatus <span className="font-medium">{st.label}</span>, sehingga tidak dapat disetujui (hanya status &ldquo;Diverifikasi&rdquo; yang bisa disetujui).
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
