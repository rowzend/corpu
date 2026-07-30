/**
 * User Management Service
 * Handles user-related API calls
 */

import { api } from '../api';

export interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    image: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
    updated_at: string;
    id_pegawai: number | null;
    user_id_opd: number | null;
    roles: Array<{ id: number; name: string }>;
}

export interface CreateUserData {
    username: string;
    name: string;
    email: string;
    password: string;
    password_confirm: string;
    image?: string;
    is_active?: boolean;
    id_pegawai?: number;
    user_id_opd?: number;
    role_ids?: number[];
    role_id?: number;
}

export interface UpdateUserData {
    username?: string;
    name?: string;
    email?: string;
    image?: string;
    is_active?: boolean;
    id_pegawai?: number;
    user_id_opd?: number;
    password?: string;
    role_ids?: number[];
    role_id?: number;
}

export interface UserListParams {
    page?: number;
    page_size?: number;
    search?: string;
    role_id?: number;
    is_active?: boolean;
}

export interface UserListResponse {
    success: boolean;
    data: User[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
}

export const userService = {
    /**
     * Get list of users with pagination and filters
     */
    async getUsers(params?: UserListParams): Promise<UserListResponse> {
        const response = await api.get<UserListResponse>('/management/users/', params);
        return response;
    },

    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<User> {
        const response = await api.get<{ success: boolean; data: User }>(`/management/users/${id}/`);
        return response.data;
    },

    /**
     * Create new user
     */
    async createUser(data: CreateUserData): Promise<User> {
        const response = await api.post<{ success: boolean; data: User; message: string }>('/management/users/create/', data);
        return response.data;
    },

    /**
     * Update user
     */
    async updateUser(id: number, data: UpdateUserData): Promise<User> {
        const response = await api.put<{ success: boolean; data: User; message: string }>(`/management/users/${id}/update/`, data);
        return response.data;
    },

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<void> {
        return api.delete<void>(`/management/users/${id}/delete/`);
    },
};