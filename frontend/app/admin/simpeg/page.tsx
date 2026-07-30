'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Eye, Database, Clock, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { simpegService, type PegawaiItem } from '@/lib/services';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';
import { handleApiError, ApiError } from '@/lib/api';
import Swal from 'sweetalert2';

export default function SimpegPegawaiPage() {
    const [pegawai, setPegawai] = useState<PegawaiItem[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<{ synced_at: string; total_records: number; synced_by: string } | null>(null);
    const perPage = 10;

    const fetchPegawai = useCallback(async () => {
        setLoading(true);
        try {
            const res = await simpegService.getPegawaiList({ page, per_page: perPage, search: search || undefined });
            setPegawai(res.data || []);
            setTotal(res.pagination?.total || 0);
            setTotalPages(res.pagination?.total_pages || 1);
            setLastSync(res.last_sync || null);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchPegawai();
    }, [fetchPegawai]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleSync = async () => {
        const confirmed = await showConfirm(
            'Proses ini akan mengambil semua data pegawai dari ESIMPEG API dan menyimpan/update ke database.',
            'Sinkronisasi Data Pegawai',
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
                    <p id="sync-detail-text" class="text-xs text-gray-500 mt-2">Halaman: 0 / 0 | Records: 0</p>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const res = await simpegService.syncPegawai(password);

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
                    const data = await simpegService.getSyncProgress(syncId);
                    if (!data.success) return;

                    const percentage = data.progress_percentage || 0;
                    const progressBar = document.getElementById('sync-progress-bar');
                    const progressText = document.getElementById('sync-progress-text');
                    const statusText = document.getElementById('sync-status-text');
                    const detailText = document.getElementById('sync-detail-text');

                    if (progressBar) progressBar.style.width = percentage + '%';
                    if (progressText) progressText.textContent = percentage + '%';
                    if (statusText) {
                        if (data.status === 'running') statusText.textContent = 'Mengambil data dari ESIMPEG API...';
                        else if (data.status === 'completed') statusText.textContent = 'Sinkronisasi selesai!';
                        else if (data.status === 'failed') statusText.textContent = 'Sinkronisasi gagal!';
                    }
                    if (detailText) {
                        detailText.textContent = `Halaman: ${data.current_page} / ${data.total_pages} | Records: ${data.processed_records} (${data.new_records} baru, ${data.updated_records} update)`;
                    }

                    if (data.status === 'completed') {
                        clearInterval(pollInterval);
                        setTimeout(() => {
                            Swal.fire({
                                title: 'Berhasil!',
                                html: `
                                    <p>Berhasil sync ${data.processed_records} pegawai</p>
                                    <p class="text-sm mt-2">${data.new_records} baru, ${data.updated_records} diupdate</p>
                                `,
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                fetchPegawai();
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

    const stats = {
        total,
        laki: pegawai.filter(p => p.jenis_kelamin === 1).length,
        perempuan: pegawai.filter(p => p.jenis_kelamin === 2).length,
    };

    const getEselonBadge = (kode: number | null) => {
        if (!kode) return <Badge variant="outline" className="text-gray-500">Non</Badge>;
        if ([11, 12].includes(kode)) return <Badge className="bg-red-100 text-red-800">I</Badge>;
        if ([21, 22].includes(kode)) return <Badge className="bg-red-100 text-red-800">II</Badge>;
        if ([31, 32].includes(kode)) return <Badge className="bg-yellow-100 text-yellow-800">III</Badge>;
        if ([41, 42].includes(kode)) return <Badge className="bg-green-100 text-green-800">IV</Badge>;
        if (kode === 51) return <Badge className="bg-blue-100 text-blue-800">V</Badge>;
        return <Badge variant="outline">{kode}</Badge>;
    };

    const getGenderBadge = (jk: number | null) => {
        if (jk === 1) return <Badge className="bg-blue-100 text-blue-800">L</Badge>;
        if (jk === 2) return <Badge className="bg-pink-100 text-pink-800">P</Badge>;
        return <span className="text-gray-400">-</span>;
    };

    const getStatusBadge = (kategori: number | null) => {
        if (kategori === 2) return <Badge className="bg-purple-100 text-purple-800">PNS</Badge>;
        if (kategori === 1) return <Badge className="bg-orange-100 text-orange-800">CPNS</Badge>;
        if (kategori === 3) return <Badge className="bg-teal-100 text-teal-800">P3K</Badge>;
        return <Badge variant="outline">-</Badge>;
    };

    if (loading && pegawai.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-6 h-6 text-blue-600" />
                        Data Pegawai ESIMPEG
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Data pegawai dari database (sync manual dari API ESIMPEG)</p>
                    {lastSync && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Terakhir sync: {new Date(lastSync.synced_at).toLocaleString('id-ID')} ({lastSync.total_records} records)
                        </p>
                    )}
                </div>
                <Button onClick={handleSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
                    {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sinkronisasi
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-xs text-gray-500">Total Pegawai</p><p className="text-lg font-bold">{total}</p></div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><UserCheck className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-xs text-gray-500">Laki-laki</p><p className="text-lg font-bold">{stats.laki}</p></div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg"><UserX className="w-5 h-5 text-pink-600" /></div>
                    <div><p className="text-xs text-gray-500">Perempuan</p><p className="text-lg font-bold">{stats.perempuan}</p></div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Cari nama atau NIP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIP</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Pegawai</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">OPD</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Golongan</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">JK</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Eselon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Memuat data...</td></tr>
                            ) : pegawai.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        {search ? (
                                            <div className="text-gray-500">
                                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p>Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
                                                <p className="text-sm">Coba kata kunci lain atau hapus filter</p>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p>Belum ada data pegawai</p>
                                                <p className="text-sm">Klik tombol Sinkronisasi untuk mengambil data dari ESIMPEG</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                pegawai.map((p, idx) => (
                                    <tr key={p.id_pegawai} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * perPage + idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nip_baru || p.nip_lama || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{p.nama_pegawai}</div>
                                            {p.tempat_lahir && p.tanggal_lahir && (
                                                <div className="text-xs text-gray-500">{p.tempat_lahir}, {p.tanggal_lahir}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{p.nama_jabatan || '-'}</div>
                                            {p.masa_kerja_jabatan && (
                                                <div className="text-xs text-gray-500">{p.masa_kerja_jabatan}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{p.nm_opd || '-'}</div>
                                            {p.nm_sub_opd && <div className="text-xs text-gray-500">{p.nm_sub_opd}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{p.nama_golongan || '-'}</div>
                                            {p.nama_pangkat && <div className="text-xs text-gray-500">{p.nama_pangkat}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-center">{getGenderBadge(p.jenis_kelamin)}</td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(p.kategori_pegawai)}</td>
                                        <td className="px-4 py-3 text-center">{getEselonBadge(p.kode_eselon)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} dari {total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Info:</p>
                        <p className="text-sm text-blue-700">
                            Data pegawai disimpan di database ASN CORPU. Klik tombol &ldquo;Sinkronisasi&rdquo; untuk mengambil data terbaru dari ESIMPEG API.
                            Data lama tetap tersimpan untuk keperluan riwayat.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
