'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Users, UserCheck, Clock, Loader2, Search } from 'lucide-react';
import { simpegService, type BupatiItem } from '@/lib/services';
import { showError, showConfirm } from '@/lib/sweetalert';
import { handleApiError, ApiError } from '@/lib/api';
import Swal from 'sweetalert2';

export default function BupatiPage() {
    const [bupati, setBupati] = useState<BupatiItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const perPage = 10;

    const fetchBupati = useCallback(async () => {
        setLoading(true);
        try {
            const res = await simpegService.getBupatiList({ page, per_page: perPage });
            setBupati(res.data || []);
            setTotal(res.pagination?.total || 0);
            setTotalPages(res.pagination?.total_pages || 1);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchBupati();
    }, [fetchBupati]);

    const handleSync = async () => {
        const confirmed = await showConfirm(
            'Proses ini akan mengambil data Bupati/Wakil Bupati dari ESIMPEG API.',
            'Sinkronisasi Data Bupati',
            'Ya, Sinkronkan!',
            'Batal'
        );
        if (!confirmed) return;
        await startSync();
    };

    const startSync = async (password?: string) => {
        setSyncing(true);
        Swal.fire({
            title: 'Sedang Menyinkronkan...',
            html: `
                <div class="mb-4">
                    <div class="w-full bg-gray-200 rounded-full h-6 mb-2">
                        <div id="sync-progress-bar" class="bg-blue-600 h-6 rounded-full transition-all duration-300" style="width: 0%">
                            <span id="sync-progress-text" class="text-white text-xs font-semibold flex items-center justify-center h-full">0%</span>
                        </div>
                    </div>
                    <p id="sync-status-text" class="text-sm text-gray-600">Memulai sinkronisasi...</p>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const res = await simpegService.syncBupati(password);

            if (res.success && res.sync_id) {
                await pollSyncProgress(res.sync_id);
            } else if (res.code === 'PASSWORD_REQUIRED') {
                Swal.close();
                showPasswordPopup();
            } else if (res.code === 'LOGIN_FAILED') {
                Swal.close();
                showError('Login ke ESIMPEG gagal. Password salah atau akun tidak ditemukan.');
            } else {
                Swal.close();
                showError(res.error || 'Gagal memulai sinkronisasi');
            }
        } catch (error) {
            Swal.close();
            if (error instanceof ApiError) {
                if (error.code === 'PASSWORD_REQUIRED') {
                    showPasswordPopup();
                    return;
                }
                if (error.code === 'LOGIN_FAILED') {
                    showError('Login ke ESIMPEG gagal. Password salah atau akun tidak ditemukan.');
                    return;
                }
            }
            showError(handleApiError(error), 'Gagal Sync');
        } finally {
            setSyncing(false);
        }
    };

    const showPasswordPopup = () => {
        Swal.fire({
            title: 'Masukkan Password ESIMPEG',
            html: `
                <p class="mb-4 text-sm text-gray-600">
                    Token ESIMPEG tidak ditemukan. Silakan masukkan password ESIMPEG Anda.
                </p>
                <input type="password" id="esimpeg-password" class="swal2-input" placeholder="Password ESIMPEG" />
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Login & Sinkronkan',
            cancelButtonText: 'Batal',
            focusConfirm: false,
            preConfirm: () => {
                const pw = (document.getElementById('esimpeg-password') as HTMLInputElement)?.value;
                if (!pw) { Swal.showValidationMessage('Password tidak boleh kosong'); return false; }
                return pw;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                startSync(result.value as string);
            }
        });
    };

    const pollSyncProgress = (syncId: string): Promise<void> => {
        return new Promise((resolve) => {
            const pollInterval = setInterval(async () => {
                try {
                    const data = await simpegService.getBupatiSyncProgress(syncId);
                    if (!data.success) return;

                    const percentage = data.progress_percentage || 0;
                    const progressBar = document.getElementById('sync-progress-bar');
                    const progressText = document.getElementById('sync-progress-text');
                    const statusText = document.getElementById('sync-status-text');

                    if (progressBar) progressBar.style.width = percentage + '%';
                    if (progressText) progressText.textContent = percentage + '%';
                    if (statusText) {
                        if (data.status === 'running') statusText.textContent = 'Mengambil data dari ESIMPEG API...';
                        else if (data.status === 'completed') statusText.textContent = 'Sinkronisasi selesai!';
                        else if (data.status === 'failed') statusText.textContent = 'Sinkronisasi gagal!';
                    }

                    if (data.status === 'completed') {
                        clearInterval(pollInterval);
                        setTimeout(() => {
                            Swal.fire({
                                title: 'Berhasil!',
                                html: `<p>Berhasil sync ${data.processed_records} data bupati</p>`,
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                fetchBupati();
                                resolve();
                            });
                        }, 500);
                    } else if (data.status === 'failed') {
                        clearInterval(pollInterval);
                        Swal.close();
                        showError(data.error_message || 'Sinkronisasi gagal');
                        resolve();
                    }
                } catch {
                    // continue polling
                }
            }, 1000);
        });
    };

    const getJabatanBadge = (jabatan: number | null) => {
        if (jabatan === 1) return <Badge className="bg-purple-100 text-purple-800">Bupati</Badge>;
        if (jabatan === 2) return <Badge className="bg-indigo-100 text-indigo-800">Wakil Bupati</Badge>;
        return <Badge variant="outline">-</Badge>;
    };

    const getStatusBadge = (status: number | null) => {
        if (status === 1) return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
        return <Badge variant="outline" className="text-gray-500">Non Aktif</Badge>;
    };

    if (loading && bupati.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-600" />
                        Data Bupati / Wakil Bupati
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Data bupati dari database (sync manual dari API ESIMPEG)</p>
                </div>
                <Button onClick={handleSync} disabled={syncing} className="bg-purple-600 hover:bg-purple-700">
                    {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sinkronisasi
                </Button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-xs text-gray-500">Total Bupati / Wakil</p><p className="text-lg font-bold">{total}</p></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIK</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Memuat data...</td></tr>
                            ) : bupati.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <div className="text-gray-500">
                                            <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p>Belum ada data bupati</p>
                                            <p className="text-sm">Klik tombol Sinkronisasi untuk mengambil data dari ESIMPEG</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                bupati.map((p, idx) => (
                                    <tr key={p.id_bupati} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * perPage + idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{p.nama}</div>
                                            {p.nik && <div className="text-xs text-gray-500">NIK: {p.nik}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.nik || '-'}</td>
                                        <td className="px-4 py-3 text-center">{getJabatanBadge(p.jabatan)}</td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(p.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {p.periode_awal || '-'} {p.periode_akhir ? `s/d ${p.periode_akhir}` : ''}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} dari {total}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                Sebelumnya
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}