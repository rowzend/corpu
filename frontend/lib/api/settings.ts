/**
 * Settings API
 * Handles system settings and configuration
 */

import { api } from '../api';

export interface AppSetting {
    id: number;
    key: string;
    value: string;
    typed_value: any;
    type: 'string' | 'integer' | 'boolean' | 'json' | 'text';
    category: string;
    description: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface SettingsResponse {
    success: boolean;
    data: AppSetting[];
    count: number;
}

/**
 * Get all settings
 */
export async function getSettings(): Promise<SettingsResponse> {
    return api.get('management/settings/');
}

/**
 * Get single setting by key
 */
export async function getSetting(key: string): Promise<{ success: boolean; data: AppSetting }> {
    return api.get(`management/settings/${key}/`);
}

/**
 * Update setting by key
 */
export async function updateSetting(key: string, value: any): Promise<{ success: boolean; data: AppSetting }> {
    return api.put(`management/settings/${key}/`, { value });
}

/**
 * Batch update multiple settings
 * Silently skips settings that don't exist in backend
 */
export async function batchUpdateSettings(settings: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const results = [];
    const errors = [];

    for (const [key, value] of Object.entries(settings)) {
        try {
            await updateSetting(key, value);
            results.push(key);
        } catch (error: any) {
            // If setting not found, skip it silently
            console.warn(`Setting '${key}' not found in backend, skipping...`);
            errors.push({ key, error: error.message });
        }
    }

    if (results.length === 0 && errors.length > 0) {
        throw new Error('No settings were updated. Please create settings in backend first.');
    }

    return {
        success: results.length > 0,
        message: `${results.length} settings updated successfully`
    };
}

/**
 * Upload file (logo, favicon, etc)
 */
export async function uploadFile(file: File, type: 'logo' | 'favicon'): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // TODO: Implement actual file upload endpoint
    // For now, return base64 as URL
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve({
                success: true,
                url: reader.result as string
            });
        };
        reader.readAsDataURL(file);
    });
}
