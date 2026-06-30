import { api } from '../api';

export interface UserProfile {
    user: number;
    bio: string | null;
    no_hp_pribadi: string | null;
    alamat_domisili: string | null;
    nik: string | null;
    agama: string | null;
    pendidikan_terakhir: string | null;
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
