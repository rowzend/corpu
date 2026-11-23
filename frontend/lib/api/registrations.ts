import { api } from '../api';

// Self-register approval (Opsi A — pola SIMPEL)
// Backend: apps/manajemen/views_api.py → RegistrationList/ActionAPIView

export interface RegistrationItem {
    id: number;
    name: string;
    username: string;
    email: string | null;
    registration_status: 'pending' | 'approved' | 'rejected';
    is_active: boolean;
    date_joined: string | null;
}

export interface RegistrationListResponse {
    status: string;
    data: RegistrationItem[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}

export interface RegistrationActionResponse {
    status: string;
    message: string;
    data: {
        id: number;
        registration_status: string;
        is_active?: boolean;
        /** hasil push enable ke Keycloak (ok/not_found/foreign/skipped/error:...) */
        keycloak?: string;
    };
}

export function getRegistrations(params?: {
    status?: string;
    page?: number;
    per_page?: number;
}): Promise<RegistrationListResponse> {
    return api.get('/management/registrations/', params);
}

export function actOnRegistration(
    id: number,
    action: 'approve' | 'reject',
): Promise<RegistrationActionResponse> {
    return api.post(`/management/registrations/${id}/action/`, { action });
}
