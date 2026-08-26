import { api } from '../api';

export interface HCDPProgram {
    id: number;
    title: string;
    description: string;
    category: string;
    instructor: string;
    start_date: string | null;
    end_date: string | null;
    duration: string;
    location: string;
    max_participants: number;
    registered_participants: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    level: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    is_active: boolean;
    is_published: boolean;
    gambar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface HCDPProgramListResponse {
    status: string;
    data: HCDPProgram[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface HCDPProgramDetailResponse {
    status: string;
    data: HCDPProgram;
}

export interface HCDPStatsResponse {
    status: string;
    data: {
        total_programs: number;
        active_programs: number;
        published_programs: number;
        ongoing_programs: number;
        completed_programs: number;
        total_participants: number;
    };
}

/**
 * Get list of HCDP programs with pagination and filters
 */
export async function getHCDPPrograms(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    status?: string;
}): Promise<HCDPProgramListResponse> {
    return api.get('/hcdp/programs/', params);
}

/**
 * Get single HCDP program detail
 */
export async function getHCDPProgram(id: number): Promise<HCDPProgramDetailResponse> {
    return api.get(`/hcdp/programs/${id}/`);
}

/**
 * Create new HCDP program
 */
export async function createHCDPProgram(data: {
    title: string;
    description: string;
    category?: string;
    instructor?: string;
    start_date?: string | null;
    end_date?: string | null;
    duration?: string;
    location?: string;
    max_participants?: number;
    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    level?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    is_active?: boolean;
    is_published?: boolean;
    gambar?: File | null;
}): Promise<HCDPProgramDetailResponse> {
    const hasFile = data.gambar instanceof File;
    if (hasFile) {
        const fd = new FormData();
        const { gambar, ...rest } = data;
        Object.entries(rest).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                fd.append(k, Array.isArray(v) ? v.join(',') : String(v));
            }
        });
        fd.append('gambar', data.gambar as File);
        return api.post('/hcdp/programs/', fd);
    }
    return api.post('/hcdp/programs/', data);
}

/**
 * Update existing HCDP program
 */
export async function updateHCDPProgram(id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    instructor: string;
    start_date: string | null;
    end_date: string | null;
    duration: string;
    location: string;
    max_participants: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    level: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    is_active: boolean;
    is_published: boolean;
    gambar?: File | null;
    remove_gambar?: boolean;
}>): Promise<HCDPProgramDetailResponse> {
    const hasFile = data.gambar instanceof File;
    const hasClear = !!data.remove_gambar;
    if (hasFile || hasClear) {
        const fd = new FormData();
        const { gambar, remove_gambar, ...rest } = data;
        Object.entries(rest).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                fd.append(k, Array.isArray(v) ? v.join(',') : String(v));
            }
        });
        if (hasFile) {
            fd.append('gambar', data.gambar as File);
        } else if (hasClear) {
            fd.append('gambar', '');
        }
        return api.put(`/hcdp/programs/${id}/`, fd);
    }
    return api.put(`/hcdp/programs/${id}/`, data);
}

/**
 * Delete HCDP program
 */
export async function deleteHCDPProgram(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/hcdp/programs/${id}/`);
}

/**
 * Get HCDP statistics
 */
export async function getHCDPStats(): Promise<HCDPStatsResponse> {
    return api.get('/hcdp/stats/');
}
