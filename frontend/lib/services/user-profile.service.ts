import { api } from '../api';

export interface UserProfile {
    user: number;
    user_name: string;
    user_email: string | null;
    user_username: string;
    user_image: string;

    kategori_user: number | null;
    kategori_user_nama: string | null;
    kategori_user_kode: string | null;

    nik: string | null;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    jenis_kelamin: string | null;
    agama: string | null;
    no_hp_pribadi: string | null;
    bio: string | null;

    provinsi: number | null;
    provinsi_nama: string | null;
    kabupaten: number | null;
    kabupaten_nama: string | null;
    kecamatan: number | null;
    kecamatan_nama: string | null;
    kelurahan: number | null;
    kelurahan_nama: string | null;
    alamat_domisili: string | null;

    perguruan_tinggi: number | null;
    perguruan_tinggi_nama: string | null;
    program_studi: number | null;
    program_studi_nama: string | null;
    pendidikan_terakhir: string | null;

    instansi: number | null;
    instansi_nama: string | null;

    media_sosial: Record<string, string> | null;
    preferensi: Record<string, any> | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export const userProfileService = {
    async getProfile(): Promise<UserProfile> {
        const response = await api.get<{ success: boolean; data: UserProfile }>('/user/profile/');
        return response.data;
    },

    async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
        const response = await api.put<{ success: boolean; data: UserProfile; message: string }>('/user/profile/', data);
        return response.data;
    },

    async getPublicProfile(userId: number): Promise<UserProfile> {
        const response = await api.get<{ success: boolean; data: UserProfile }>(`/user/profile/${userId}/`);
        return response.data;
    },
};
