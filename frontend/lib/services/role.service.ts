/**
 * Role Management Service
 * Handles role-related API calls
 */

import { api } from '../api';

export interface Role {
    id: number;
    name: string;
    user_count: number;
    permission_count: number;
    redirect_url?: string;
}

export interface RoleDetail extends Role {
    permissions: RolePermission[];
}

export interface RolePermission {
    id: number;
    role: number;
    rule: number;
    role_name: string;
    rule_detail: {
        id: number;
        module: number;
        control: number;
        function: number;
        module_name: string;
        control_name: string;
        function_name: string;
        permission_string: string;
        is_active: boolean;
    };
}

export interface CreateRoleData {
    name: string;
    redirect_url_input?: string;
}

export interface UpdateRoleData {
    name?: string;
    redirect_url_input?: string;
}

export const roleService = {
    /**
     * Get list of all roles
     */
    async getRoles(): Promise<Role[]> {
        const response = await api.get<{ success: boolean; data: Role[]; total: number }>('/management/roles/');
        return response.data || [];
    },

    /**
     * Get role by ID with permissions
     */
    async getRoleById(id: number): Promise<RoleDetail> {
        const response = await api.get<{ success: boolean; data: RoleDetail }>(`/management/roles/${id}/`);
        return response.data;
    },

    /**
     * Create new role
     */
    async createRole(data: CreateRoleData): Promise<Role> {
        const response = await api.post<{ success: boolean; data: Role; message: string }>('/management/roles/create/', data);
        return response.data;
    },

    /**
     * Update role
     */
    async updateRole(id: number, data: UpdateRoleData): Promise<Role> {
        const response = await api.put<{ success: boolean; data: Role; message: string }>(`/management/roles/${id}/update/`, data);
        return response.data;
    },

    /**
     * Delete role
     */
    async deleteRole(id: number): Promise<void> {
        return api.delete<void>(`/management/roles/${id}/delete/`);
    },

    /**
     * Update role permissions
     */
    async updateRolePermissions(id: number, permissionIds: number[]): Promise<void> {
        return api.post<void>(`/management/roles/${id}/permissions/`, {
            permission_ids: permissionIds
        });
    },
};