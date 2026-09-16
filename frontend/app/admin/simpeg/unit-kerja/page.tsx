'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Database, Clock, Network, Building2, Loader2 } from 'lucide-react';
import { simpegService, type UnitKerjaItem, type UnitKerjaDesainRiwayat } from '@/lib/services';
import { showError, showConfirm } from '@/lib/sweetalert';
import { handleApiError, ApiError } from '@/lib/api';
import Swal from 'sweetalert2';

export default function UnitKerjaPage() {
    const [units, setUnits] = useState<UnitKerjaItem[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<{ synced_at: string; total_records: number; synced_by: string } | null>(null);
    const [stats, setStats] = useState({ total_aktif: 0, total_nonaktif: 0, total_opd_induk: 0, total_opd_induk_aktif: 0 });
    const perPage = 10;

    const [riwayat, setRiwayat] = useState<UnitKerjaDesainRiwayat[]>([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);
    const [riwayatOpen, setRiwayatOpen] = useState(false);

    const fetchUnits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await simpegService.getUnitKerjaList({
                page,
                per_page: perPage,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setUnits(res.data || []);
            setTotal(res.pagination?.total || 0);
            setTotalPages(res.pagination?.total_pages || 1);
            setLastSync(res.last_sync || null);
            if (res.stats) {
                setStats({
                    total_aktif: res.stats.total_aktif ?? 0,
                    total_nonaktif: res.stats.total_nonaktif ?? 0,
                    total_opd_induk: res.stats.total_opd_induk ?? 0,
                    total_opd_induk_aktif: res.stats.total_opd_induk_aktif ?? 0,
                });
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const fetchRiwayat = useCallback(async () => {
        setRiwayatLoading(true);
        try {
            const res = await simpegService.getUnitKerjaDesainRiwayat();
            setRiwayat(res.data || []);
        } catch {
            setRiwayat([]);
        } finally {
            setRiwayatLoading(false);
        }
    }, []);

    const toggleRiwayat = () => {
        const next = !riwayatOpen;
        setRiwayatOpen(next);
        if (next && riwayat.length === 0) fetchRiwayat();
    };

    const handleSync = async () => {
        const confirmed = await showConfirm(
            'Proses ini akan mengambil semua unit kerja beserta hierarki (parent) dari ESIMPEG API dan menyimpan/update ke database.',
            'Sinkronisasi Data Unit Kerja',
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
            const res = await simpegService.syncUnitKerja(password);

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
                    const data = await simpegService.getUnitKerjaSyncProgress(syncId);
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
                                    <p>Berhasil sync ${data.processed_records} unit kerja</p>
                                    <p class="text-sm mt-2">${data.new_records} baru, ${data.updated_records} diupdate</p>
                                `,
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                fetchUnits();
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

    const getStatusBadge = (status: number) => {
        if (status === 1) return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
        return <Badge variant="outline" className="text-gray-500">Non Aktif</Badge>;
    };

    if (loading && units.length === 0) {
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
                        <Network className="w-6 h-6 text-blue-600" />
                        Data Unit Kerja ESIMPEG
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Unit kerja &amp; hierarki organisasi dari database (sync manual dari API ESIMPEG)</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-xs text-gray-500">Total Unit Kerja</p><p className="text-lg font-bold">{total}</p></div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><Building2 className="w-5 h-5 text-green-600" /></div>
                    <div><p className="text-xs text-gray-500">Aktif</p><p className="text-lg font-bold">{stats.total_aktif}</p></div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><Building2 className="w-5 h-5 text-gray-500" /></div>
                    <div><p className="text-xs text-gray-500">Non Aktif</p><p className="text-lg font-bold">{stats.total_nonaktif}</p></div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><Network className="w-5 h-5 text-purple-600" /></div>
                    <div>
                        <p className="text-xs text-gray-500">OPD Induk</p>
                        <p className="text-lg font-bold">{stats.total_opd_induk_aktif}</p>
                        {stats.total_opd_induk > stats.total_opd_induk_aktif && (
                            <p className="text-[10px] text-gray-400">{stats.total_opd_induk} termasuk data lama</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Cari nama unit kerja..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                    <option value="">Semua Status</option>
                    <option value="1">Aktif</option>
                    <option value="0">Non Aktif</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Unit Kerja</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis Organisasi</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">OPD Induk</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Memuat data...</td></tr>
                            ) : units.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        {search ? (
                                            <div className="text-gray-500">
                                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p>Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
                                                <p className="text-sm">Coba kata kunci lain atau hapus filter</p>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p>Belum ada data unit kerja</p>
                                                <p className="text-sm">Klik tombol Sinkronisasi untuk mengambil data dari ESIMPEG</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                units.map((u, idx) => (
                                    <tr key={u.id_opd} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * perPage + idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={u.nm_opd}>{u.nm_opd}</div>
                                            <div className="text-xs text-gray-400">ID: {u.id_opd}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-700 max-w-[14rem] truncate" title={u.parent_name || ''}>
                                                {u.parent_name || '-'}
                                            </div>
                                            {u.parent_id && <div className="text-xs text-gray-400">ID: {u.parent_id}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{u.nama_jenis_organisasi || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="outline">{u.level ?? 0}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {u.is_opd_induk ? (
                                                <Badge className="bg-purple-100 text-purple-800">Ya</Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(u.status)}</td>
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
                    <Network className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Info:</p>
                        <p className="text-sm text-blue-700">
                            Data unit kerja disimpan di database ASN CORPU beserta relasi parent (induk organisasi).
                            Klik tombol &ldquo;Sinkronisasi&rdquo; untuk mengambil data terbaru dari ESIMPEG API.
                            Relasi parent di-relink otomatis setelah semua data tersimpan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Riwayat Desain Pembelajaran (unit kerja yang sudah dihapus) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                    type="button"
                    onClick={toggleRiwayat}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Riwayat Desain Pembelajaran
                        <Badge variant="outline" className="text-gray-500">{riwayat.length}</Badge>
                    </span>
                    <span className="text-xs text-gray-400">{riwayatOpen ? 'Tutup' : 'Lihat'}</span>
                </button>
                {riwayatOpen && (
                    <div className="px-4 py-4 divide-y divide-gray-100">
                        {riwayatLoading ? (
                            <p className="text-sm text-gray-500 py-4 text-center">Memuat riwayat...</p>
                        ) : riwayat.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">
                                Belum ada riwayat. Desain pembelajaran akan otomatis diarsipkan ke sini bila unit kerja pemiliknya dihapus.
                            </p>
                        ) : (
                            riwayat.map((r) => (
                                <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {r.unit_kerja.nm_opd || '(unit dihapus)'}
                                                {r.unit_kerja.id_opd ? ` (ID: ${r.unit_kerja.id_opd})` : ''}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Diarsipkan: {r.archived_at ? new Date(r.archived_at).toLocaleString('id-ID') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {r.keterangan && (
                                        <p className="text-xs text-gray-500 mt-1 italic">{r.keterangan}</p>
                                    )}
                                    {r.kompetensi_teknis.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                            {r.kompetensi_teknis.map((k) => (
                                                <li key={k.id} className="text-sm text-gray-700">
                                                    <span className="font-medium">• {k.uraian}</span>
                                                    {k.tujuan.length > 0 && (
                                                        <ul className="ml-5 mt-1 list-disc text-gray-500">
                                                            {k.tujuan.map((t) => (
                                                                <li key={t.id}>{t.uraian}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-1">Tidak ada kompetensi teknis.</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
