import { api } from '../api';

export interface ProfileSection {
    id: number;
    key: string;
    title: string;
    content: string;
    image: string | null;
    is_active: boolean;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface Position {
    id: number;
    name: string;
    description: string | null;
    parent: number | null;
    parent_name: string | null;
    order: number;
    is_active: boolean;
    children: Position[];
    created_at: string;
    updated_at: string;
}

export interface Personalia {
    id: number;
    name: string;
    nip: string | null;
    position: string;
    position_fk: number | null;
    position_name: string | null;
    position_id: number | null;
    description: string | null;
    photo: string | null;
    email: string | null;
    phone: string | null;
    unit_kerja: string | null;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

function toFormData(data: Record<string, any>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
            if (value instanceof File) {
                fd.append(key, value);
            } else if (typeof value === 'boolean') {
                fd.append(key, value ? 'true' : 'false');
            } else {
                fd.append(key, String(value));
            }
        }
    }
    return fd;
}

export const profileService = {
    // Sections
    async getSections(): Promise<ProfileSection[]> {
        const response = await api.get<ApiResponse<ProfileSection[]>>('/profile/sections/');
        return response.data;
    },

    async getSectionByKey(key: string): Promise<ProfileSection> {
        const all = await this.getSections();
        const section = all.find(s => s.key === key);
        if (!section) throw new Error(`Section ${key} not found`);
        return section;
    },

    async getSection(id: number): Promise<ProfileSection> {
        const response = await api.get<ApiResponse<ProfileSection>>(`/profile/sections/${id}/`);
        return response.data;
    },

    async updateSection(id: number, data: Partial<ProfileSection>): Promise<ProfileSection> {
        const response = await api.patch<ApiResponse<ProfileSection>>(`/profile/sections/${id}/`, data);
        return response.data;
    },

    async updateSectionWithImage(id: number, data: Partial<ProfileSection>, imageFile?: File | null): Promise<ProfileSection> {
        const payload = toFormData(data as Record<string, any>);
        if (imageFile) {
            payload.append('image', imageFile);
        }
        const response = await api.patch<ApiResponse<ProfileSection>>(`/profile/sections/${id}/`, payload);
        return response.data;
    },

    // Positions
    async getPositions(): Promise<Position[]> {
        const response = await api.get<ApiResponse<Position[]>>('/profile/positions/');
        return response.data;
    },

    async getPosition(id: number): Promise<Position> {
        const response = await api.get<ApiResponse<Position>>(`/profile/positions/${id}/`);
        return response.data;
    },

    async createPosition(data: Partial<Position>): Promise<Position> {
        const response = await api.post<ApiResponse<Position>>('/profile/positions/', data);
        return response.data;
    },

    async updatePosition(id: number, data: Partial<Position>): Promise<Position> {
        const response = await api.put<ApiResponse<Position>>(`/profile/positions/${id}/`, data);
        return response.data;
    },

    async deletePosition(id: number): Promise<void> {
        await api.delete(`/profile/positions/${id}/`);
    },

    // Personalia
    async getPersonalia(): Promise<Personalia[]> {
        const response = await api.get<ApiResponse<Personalia[]>>('/profile/personalia/');
        return response.data;
    },

    async getPersonaliaById(id: number): Promise<Personalia> {
        const response = await api.get<ApiResponse<Personalia>>(`/profile/personalia/${id}/`);
        return response.data;
    },

    async createPersonalia(data: Partial<Personalia>, photoFile?: File | null): Promise<Personalia> {
        const payload = toFormData(data as Record<string, any>);
        if (photoFile) {
            payload.append('photo', photoFile);
        }
        const response = await api.post<ApiResponse<Personalia>>('/profile/personalia/', payload);
        return response.data;
    },

    async updatePersonalia(id: number, data: Partial<Personalia>, photoFile?: File | null): Promise<Personalia> {
        const payload = toFormData(data as Record<string, any>);
        if (photoFile) {
            payload.append('photo', photoFile);
        }
        const response = await api.patch<ApiResponse<Personalia>>(`/profile/personalia/${id}/`, payload);
        return response.data;
    },

    async deletePersonalia(id: number): Promise<void> {
        await api.delete(`/profile/personalia/${id}/`);
    },
};
