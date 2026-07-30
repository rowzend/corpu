/**
 * Permission Management Service
 * Handles permission-related API calls
 */

import { api } from '../api';

export interface PermissionModule {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
}

export interface PermissionRule {
    id: number;
    module: number;
    control: number;
    function: number;
    module_name: string;
    control_name: string;
    function_name: string;
    permission_string: string;
    is_active: boolean;
}

export const permissionService = {
    /**
     * Get list of all permission modules
     */
    async getModules(): Promise<PermissionModule[]> {
        const response = await api.get<{ success: boolean; data: PermissionModule[] }>('/management/permissions/modules/');
        return response.data || [];
    },

    /**
     * Get list of all permission rules
     */
    async getRules(moduleId?: number): Promise<PermissionRule[]> {
        const params = moduleId ? { module_id: moduleId } : undefined;
        const response = await api.get<{ success: boolean; data: PermissionRule[] }>('/management/permissions/rules/', params);
        return response.data || [];
    },
};
