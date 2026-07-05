import { api } from '@/lib/api';

export interface PegawaiItem {
    id_pegawai: number;
    nip_baru: string | null;
    nip_lama: string | null;
    nama_pegawai: string;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    jenis_kelamin: number | null;
    jenis_kelamin_display: string;
    alamat_rumah: string | null;
    no_hp: string | null;
    id_jabatan: number | null;
    nama_jabatan: string | null;
    masa_kerja_jabatan: string | null;
    kode_eselon: number | null;
    id_opd: number | null;
    nm_opd: string | null;
    id_opd_urut: number | null;
    is_opd_induk: boolean;
    id_sub_opd: number | null;
    nm_sub_opd: string | null;
    id_golongan: number | null;
    nama_golongan: string | null;
    nama_pangkat: string | null;
    kategori_pegawai: number | null;
    nama_kategori_pegawai: string | null;
    tmt_cpns: string | null;
    masa_kerja_tahun: number | null;
    masa_kerja_bulan: number | null;
    akhir_kerja_p3k: string | null;
    pas_foto: string | null;
    synced_at: string;
    created_at: string;
}

interface PegawaiListResponse {
    success: boolean;
    data: PegawaiItem[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
    last_sync: {
        synced_at: string;
        total_records: number;
        synced_by: string;
    } | null;
}

interface SyncProgressResponse {
    success: boolean;
    sync_id?: string;
    status?: string;
    current_page?: number;
    total_pages?: number;
    processed_records?: number;
    total_records?: number;
    new_records?: number;
    updated_records?: number;
    progress_percentage?: number;
    error_message?: string | null;
    message?: string;
    error?: string;
    code?: string;
}

interface SyncLogItem {
    id: number;
    synced_by: number | null;
    synced_at: string;
    total_records: number;
    new_records: number;
    updated_records: number;
    status: string;
    error_message: string | null;
    duration_seconds: number | null;
}

class SimpegService {
    private baseEndpoint = 'simpeg';

    async getPegawaiList(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        id_opd?: string;
        kode_eselon?: string;
    }): Promise<PegawaiListResponse> {
        return api.get<PegawaiListResponse>(`${this.baseEndpoint}/pegawai/`, params);
    }

    async getPegawaiDetail(id: number): Promise<{ success: boolean; data: PegawaiItem }> {
        return api.get<{ success: boolean; data: PegawaiItem }>(`${this.baseEndpoint}/pegawai/${id}/`);
    }

    async syncPegawai(password?: string): Promise<SyncProgressResponse> {
        return api.post<SyncProgressResponse>(`${this.baseEndpoint}/pegawai/sync/`, password ? { password } : {});
    }

    async getSyncProgress(syncId: string): Promise<SyncProgressResponse> {
        return api.get<SyncProgressResponse>(`${this.baseEndpoint}/pegawai/sync/progress/${syncId}/`);
    }

    async getSyncLogs(): Promise<{ success: boolean; data: SyncLogItem[] }> {
        return api.get<{ success: boolean; data: SyncLogItem[] }>(`${this.baseEndpoint}/pegawai/sync/logs/`);
    }

    // ── Bupati ───────────────────────────────────────────────────────

    async getBupatiList(params?: {
        page?: number;
        per_page?: number;
    }): Promise<BupatiListResponse> {
        return api.get<BupatiListResponse>(`${this.baseEndpoint}/bupati/`, params);
    }

    async syncBupati(password?: string): Promise<SyncProgressResponse> {
        return api.post<SyncProgressResponse>(`${this.baseEndpoint}/bupati/sync/`, password ? { password } : {});
    }

    async getBupatiSyncProgress(syncId: string): Promise<SyncProgressResponse> {
        return api.get<SyncProgressResponse>(`${this.baseEndpoint}/bupati/sync/progress/${syncId}/`);
    }
}

export interface BupatiItem {
    id_bupati: number;
    nama: string;
    gelar_depan: string | null;
    gelar_belakang: string | null;
    nik: string | null;
    foto: string | null;
    jabatan: number | null;
    nama_jabatan: string | null;
    status: number | null;
    nama_status: string | null;
    jenis_penugasan: string | null;
    periode_awal: string | null;
    periode_akhir: string | null;
    synced_at: string;
    created_at: string;
}

interface BupatiListResponse {
    success: boolean;
    data: BupatiItem[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}

export const simpegService = new SimpegService();
