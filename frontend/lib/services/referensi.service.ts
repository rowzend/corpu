import { api } from '@/lib/api';

export interface PerguruanTinggi {
    id: number;
    id_pddikti: string | null;
    kode_pt: string;
    nama_pt: string;
    bentuk_pt: string | null;
    status_pt: string | null;
    alamat: string | null;
    kota: string | null;
    provinsi: string | null;
    telepon: string | null;
    website: string | null;
    email: string | null;
    akreditasi: string | null;
    is_active: boolean;
    program_studi_count: number;
    created_at: string;
    updated_at: string;
}

export interface Instansi {
    id: number;
    id_bkn: string | null;
    kode_instansi: string;
    nama_instansi: string;
    jenis_instansi: string | null;
    tingkat_instansi: string | null;
    alamat: string | null;
    telepon: string | null;
    website: string | null;
    email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProgramStudi {
    id: number;
    id_pddikti: string | null;
    kode_prodi: string | null;
    nama_prodi: string;
    jenjang: string | null;
    perguruan_tinggi: number;
    perguruan_tinggi_nama: string;
    perguruan_tinggi_kode: string;
    akreditasi: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Provinsi {
    id: number;
    kode: string;
    nama: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Kabupaten {
    id: number;
    kode: string;
    nama: string;
    provinsi: number;
    provinsi_nama: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Kecamatan {
    id: number;
    kode: string;
    nama: string;
    kabupaten: number;
    kabupaten_nama: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Kelurahan {
    id: number;
    kode: string;
    nama: string;
    kecamatan: number;
    kecamatan_nama: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ListResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}

export interface KategoriUser {
    id: number;
    kode: string;
    nama: string;
    deskripsi: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface SyncResponse {
    success: boolean;
    message: string;
    output?: string;
}

class ReferensiService {
    private baseEndpoint = 'referensi-api';

    async getPerguruanTinggiList(params?: {
        page?: number;
        page_size?: number;
        search?: string;
    }): Promise<ListResponse<PerguruanTinggi>> {
        return api.get<ListResponse<PerguruanTinggi>>(`${this.baseEndpoint}/perguruan-tinggi/`, params);
    }

    async getPerguruanTinggi(id: number): Promise<{ success: boolean; data: PerguruanTinggi }> {
        return api.get<{ success: boolean; data: PerguruanTinggi }>(`${this.baseEndpoint}/perguruan-tinggi/${id}/`);
    }

    async createPerguruanTinggi(data: Partial<PerguruanTinggi>): Promise<{ success: boolean; data: PerguruanTinggi }> {
        return api.post<{ success: boolean; data: PerguruanTinggi }>(`${this.baseEndpoint}/perguruan-tinggi/`, data);
    }

    async updatePerguruanTinggi(id: number, data: Partial<PerguruanTinggi>): Promise<{ success: boolean; data: PerguruanTinggi }> {
        return api.put<{ success: boolean; data: PerguruanTinggi }>(`${this.baseEndpoint}/perguruan-tinggi/${id}/update/`, data);
    }

    async deletePerguruanTinggi(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/perguruan-tinggi/${id}/delete/`);
    }

    async getProgramStudiList(params?: {
        page?: number;
        page_size?: number;
        search?: string;
        perguruan_tinggi_id?: string;
    }): Promise<ListResponse<ProgramStudi>> {
        return api.get<ListResponse<ProgramStudi>>(`${this.baseEndpoint}/program-studi/`, params);
    }

    async getProgramStudi(id: number): Promise<{ success: boolean; data: ProgramStudi }> {
        return api.get<{ success: boolean; data: ProgramStudi }>(`${this.baseEndpoint}/program-studi/${id}/`);
    }

    async createProgramStudi(data: Partial<ProgramStudi>): Promise<{ success: boolean; data: ProgramStudi }> {
        return api.post<{ success: boolean; data: ProgramStudi }>(`${this.baseEndpoint}/program-studi/`, data);
    }

    async updateProgramStudi(id: number, data: Partial<ProgramStudi>): Promise<{ success: boolean; data: ProgramStudi }> {
        return api.put<{ success: boolean; data: ProgramStudi }>(`${this.baseEndpoint}/program-studi/${id}/update/`, data);
    }

    async deleteProgramStudi(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/program-studi/${id}/delete/`);
    }

    async syncFromGithub(): Promise<SyncResponse> {
        return api.post<SyncResponse>(`${this.baseEndpoint}/sync/`, { source: 'github' });
    }

    async syncFromXlsx(): Promise<SyncResponse> {
        return api.post<SyncResponse>(`${this.baseEndpoint}/sync/`, { source: 'xlsx' });
    }

    async getInstansiList(params?: {
        page?: number;
        page_size?: number;
        search?: string;
    }): Promise<ListResponse<Instansi>> {
        return api.get<ListResponse<Instansi>>(`${this.baseEndpoint}/instansi/`, params);
    }

    async getInstansi(id: number): Promise<{ success: boolean; data: Instansi }> {
        return api.get<{ success: boolean; data: Instansi }>(`${this.baseEndpoint}/instansi/${id}/`);
    }

    async createInstansi(data: Partial<Instansi>): Promise<{ success: boolean; data: Instansi }> {
        return api.post<{ success: boolean; data: Instansi }>(`${this.baseEndpoint}/instansi/`, data);
    }

    async updateInstansi(id: number, data: Partial<Instansi>): Promise<{ success: boolean; data: Instansi }> {
        return api.put<{ success: boolean; data: Instansi }>(`${this.baseEndpoint}/instansi/${id}/update/`, data);
    }

    async deleteInstansi(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/instansi/${id}/delete/`);
    }

    async importInstansiXlsx(file: File): Promise<{ success: boolean; message: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ success: boolean; message: string }>(`${this.baseEndpoint}/instansi/import/`, formData);
    }

    // ========================
    // Wilayah API
    // ========================

    async getProvinsiList(params?: {
        page?: number; page_size?: number; search?: string; all?: string;
    }): Promise<ListResponse<Provinsi>> {
        return api.get<ListResponse<Provinsi>>(`${this.baseEndpoint}/provinsi/`, params);
    }

    async getProvinsi(id: number): Promise<{ success: boolean; data: Provinsi }> {
        return api.get<{ success: boolean; data: Provinsi }>(`${this.baseEndpoint}/provinsi/${id}/`);
    }

    async createProvinsi(data: Partial<Provinsi>): Promise<{ success: boolean; data: Provinsi }> {
        return api.post<{ success: boolean; data: Provinsi }>(`${this.baseEndpoint}/provinsi/`, data);
    }

    async updateProvinsi(id: number, data: Partial<Provinsi>): Promise<{ success: boolean; data: Provinsi }> {
        return api.put<{ success: boolean; data: Provinsi }>(`${this.baseEndpoint}/provinsi/${id}/update/`, data);
    }

    async deleteProvinsi(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/provinsi/${id}/delete/`);
    }

    async getKabupatenList(params?: {
        page?: number; page_size?: number; search?: string; provinsi_id?: string; all?: string;
    }): Promise<ListResponse<Kabupaten>> {
        return api.get<ListResponse<Kabupaten>>(`${this.baseEndpoint}/kabupaten/`, params);
    }

    async getKabupaten(id: number): Promise<{ success: boolean; data: Kabupaten }> {
        return api.get<{ success: boolean; data: Kabupaten }>(`${this.baseEndpoint}/kabupaten/${id}/`);
    }

    async createKabupaten(data: Partial<Kabupaten>): Promise<{ success: boolean; data: Kabupaten }> {
        return api.post<{ success: boolean; data: Kabupaten }>(`${this.baseEndpoint}/kabupaten/`, data);
    }

    async updateKabupaten(id: number, data: Partial<Kabupaten>): Promise<{ success: boolean; data: Kabupaten }> {
        return api.put<{ success: boolean; data: Kabupaten }>(`${this.baseEndpoint}/kabupaten/${id}/update/`, data);
    }

    async deleteKabupaten(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/kabupaten/${id}/delete/`);
    }

    async getKecamatanList(params?: {
        page?: number; page_size?: number; search?: string; kabupaten_id?: string; all?: string;
    }): Promise<ListResponse<Kecamatan>> {
        return api.get<ListResponse<Kecamatan>>(`${this.baseEndpoint}/kecamatan/`, params);
    }

    async getKecamatan(id: number): Promise<{ success: boolean; data: Kecamatan }> {
        return api.get<{ success: boolean; data: Kecamatan }>(`${this.baseEndpoint}/kecamatan/${id}/`);
    }

    async createKecamatan(data: Partial<Kecamatan>): Promise<{ success: boolean; data: Kecamatan }> {
        return api.post<{ success: boolean; data: Kecamatan }>(`${this.baseEndpoint}/kecamatan/`, data);
    }

    async updateKecamatan(id: number, data: Partial<Kecamatan>): Promise<{ success: boolean; data: Kecamatan }> {
        return api.put<{ success: boolean; data: Kecamatan }>(`${this.baseEndpoint}/kecamatan/${id}/update/`, data);
    }

    async deleteKecamatan(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/kecamatan/${id}/delete/`);
    }

    async getKelurahanList(params?: {
        page?: number; page_size?: number; search?: string; kecamatan_id?: string; all?: string;
    }): Promise<ListResponse<Kelurahan>> {
        return api.get<ListResponse<Kelurahan>>(`${this.baseEndpoint}/kelurahan/`, params);
    }

    async getKelurahan(id: number): Promise<{ success: boolean; data: Kelurahan }> {
        return api.get<{ success: boolean; data: Kelurahan }>(`${this.baseEndpoint}/kelurahan/${id}/`);
    }

    async createKelurahan(data: Partial<Kelurahan>): Promise<{ success: boolean; data: Kelurahan }> {
        return api.post<{ success: boolean; data: Kelurahan }>(`${this.baseEndpoint}/kelurahan/`, data);
    }

    async updateKelurahan(id: number, data: Partial<Kelurahan>): Promise<{ success: boolean; data: Kelurahan }> {
        return api.put<{ success: boolean; data: Kelurahan }>(`${this.baseEndpoint}/kelurahan/${id}/update/`, data);
    }

    async deleteKelurahan(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/kelurahan/${id}/delete/`);
    }

    async syncWilayah(): Promise<SyncResponse> {
        return api.post<SyncResponse>(`${this.baseEndpoint}/sync/`, { source: 'wilayah' });
    }

    // ========================
    // Kategori User API
    // ========================

    async getKategoriUserList(params?: {
        page?: number; page_size?: number; search?: string; all?: string;
    }): Promise<ListResponse<KategoriUser>> {
        return api.get<ListResponse<KategoriUser>>(`${this.baseEndpoint}/kategori-user/`, params);
    }

    async getKategoriUser(id: number): Promise<{ success: boolean; data: KategoriUser }> {
        return api.get<{ success: boolean; data: KategoriUser }>(`${this.baseEndpoint}/kategori-user/${id}/`);
    }

    async createKategoriUser(data: Partial<KategoriUser>): Promise<{ success: boolean; data: KategoriUser }> {
        return api.post<{ success: boolean; data: KategoriUser }>(`${this.baseEndpoint}/kategori-user/`, data);
    }

    async updateKategoriUser(id: number, data: Partial<KategoriUser>): Promise<{ success: boolean; data: KategoriUser }> {
        return api.put<{ success: boolean; data: KategoriUser }>(`${this.baseEndpoint}/kategori-user/${id}/update/`, data);
    }

    async deleteKategoriUser(id: number): Promise<{ success: boolean; message: string }> {
        return api.delete<{ success: boolean; message: string }>(`${this.baseEndpoint}/kategori-user/${id}/delete/`);
    }
}

export const referensiService = new ReferensiService();
