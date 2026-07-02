import { api } from '@/lib/api';

export interface PermissionFunction {
    id: number;
    nama_fungsi: string;
    label_fungsi: string;
    deskripsi_fungsi: string | null;
}

export interface PermissionControl {
    id: number;
    nama_kontrol: string;
    label_kontrol: string;
    deskripsi_kontrol: string | null;
}

export interface PermissionModule {
    id: number;
    nama_module: string;
    label_module: string;
    deskripsi_module: string | null;
    icon: string;
    order: number;
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

export interface MenuItem {
    id: number;
    name: string;
    permission_key: string | null;
    url_name: string | null;
    external_url: string | null;
    icon: string;
    type: string;
    parent: number | null;
    order: number;
    category: number;
    is_active: boolean;
    children: MenuItem[];
}

export interface MenuCategory {
    id: number;
    code: number;
    name: string;
    order: number;
    is_active: boolean;
}

export interface ApiDocumentation {
    id: number;
    method_type: string;
    url: string;
    parameters: any;
    description: string | null;
    is_active: boolean;
}

export const managementService = {
    async getFunctions(params?: { page?: number; page_size?: number; search?: string }) {
        const response = await api.get<{ success: boolean; data: PermissionFunction[]; pagination: any }>('/management/permissions/functions/', params);
        return response;
    },
    async createFunction(data: Partial<PermissionFunction>) {
        const response = await api.post<{ success: boolean; data: PermissionFunction; message: string }>('/management/permissions/functions/create/', data);
        return response;
    },
    async updateFunction(id: number, data: Partial<PermissionFunction>) {
        const response = await api.put<{ success: boolean; data: PermissionFunction; message: string }>(`/management/permissions/functions/${id}/update/`, data);
        return response;
    },
    async deleteFunction(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/permissions/functions/${id}/delete/`);
        return response;
    },

    async getControls(params?: { page?: number; page_size?: number; search?: string }) {
        const response = await api.get<{ success: boolean; data: PermissionControl[]; pagination: any }>('/management/permissions/controls/', params);
        return response;
    },
    async createControl(data: Partial<PermissionControl>) {
        const response = await api.post<{ success: boolean; data: PermissionControl; message: string }>('/management/permissions/controls/create/', data);
        return response;
    },
    async updateControl(id: number, data: Partial<PermissionControl>) {
        const response = await api.put<{ success: boolean; data: PermissionControl; message: string }>(`/management/permissions/controls/${id}/update/`, data);
        return response;
    },
    async deleteControl(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/permissions/controls/${id}/delete/`);
        return response;
    },

    async getModules() {
        const response = await api.get<{ success: boolean; data: PermissionModule[] }>('/management/permissions/modules/');
        return response.data;
    },
    async createModule(data: Partial<PermissionModule>) {
        const response = await api.post<{ success: boolean; data: PermissionModule; message: string }>('/management/permissions/modules/create/', data);
        return response;
    },
    async updateModule(id: number, data: Partial<PermissionModule>) {
        const response = await api.put<{ success: boolean; data: PermissionModule; message: string }>(`/management/permissions/modules/${id}/update/`, data);
        return response;
    },
    async deleteModule(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/permissions/modules/${id}/delete/`);
        return response;
    },

    async getRules(params?: { module_id?: number }) {
        const response = await api.get<{ success: boolean; data: PermissionRule[] }>('/management/permissions/rules/', params);
        return response.data;
    },
    async createRule(data: { module: number; control: number; function: number }) {
        const response = await api.post<{ success: boolean; data: PermissionRule; message: string }>('/management/permissions/rules/create/', data);
        return response;
    },
    async updateRule(id: number, data: { module: number; control: number; function: number }) {
        const response = await api.put<{ success: boolean; data: PermissionRule; message: string }>(`/management/permissions/rules/${id}/update/`, data);
        return response;
    },
    async deleteRule(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/permissions/rules/${id}/delete/`);
        return response;
    },

    async getMenuItems() {
        const response = await api.get<{ success: boolean; data: MenuItem[] }>('/management/menu/');
        return response.data;
    },
    async createMenuItem(data: Partial<MenuItem>) {
        const response = await api.post<{ success: boolean; data: MenuItem; message: string }>('/management/menu/create/', data);
        return response;
    },
    async updateMenuItem(id: number, data: Partial<MenuItem>) {
        const response = await api.put<{ success: boolean; data: MenuItem; message: string }>(`/management/menu/${id}/update/`, data);
        return response;
    },
    async deleteMenuItem(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/menu/${id}/delete/`);
        return response;
    },

    async getMenuCategories() {
        const response = await api.get<{ success: boolean; data: MenuCategory[] }>('/management/menu-categories/');
        return response.data;
    },
    async createMenuCategory(data: Partial<MenuCategory>) {
        const response = await api.post<{ success: boolean; data: MenuCategory; message: string }>('/management/menu-categories/create/', data);
        return response;
    },
    async updateMenuCategory(id: number, data: Partial<MenuCategory>) {
        const response = await api.put<{ success: boolean; data: MenuCategory; message: string }>(`/management/menu-categories/${id}/update/`, data);
        return response;
    },
    async deleteMenuCategory(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/menu-categories/${id}/delete/`);
        return response;
    },

    async getApiDocs(params?: { page?: number; page_size?: number; search?: string; method?: string }) {
        const response = await api.get<{ success: boolean; data: ApiDocumentation[]; pagination: any }>('/management/api-documentation/', params);
        return response;
    },
    async createApiDoc(data: Partial<ApiDocumentation>) {
        const response = await api.post<{ success: boolean; data: ApiDocumentation; message: string }>('/management/api-documentation/create/', data);
        return response;
    },
    async updateApiDoc(id: number, data: Partial<ApiDocumentation>) {
        const response = await api.put<{ success: boolean; data: ApiDocumentation; message: string }>(`/management/api-documentation/${id}/update/`, data);
        return response;
    },
    async deleteApiDoc(id: number) {
        const response = await api.delete<{ success: boolean; message: string }>(`/management/api-documentation/${id}/delete/`);
        return response;
    },
};
