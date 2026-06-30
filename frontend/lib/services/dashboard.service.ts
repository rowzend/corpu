import { api } from '../api';

export interface DashboardStats {
    total_pegawai: number;
    pegawai_aktif: number;
    total_users: number;
    total_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    active_enrollments: number;
    certificates_issued: number;
    total_hcdp: number;
    active_hcdp: number;
    total_berita: number;
    new_users_this_month: number;
}

export interface Activity {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: 'success' | 'primary' | 'info' | 'warning' | 'danger';
    created_at: string;
}

export interface SystemStatus {
    database: { status: string; message: string; icon: string; class: string };
    cache: { status: string; message: string; icon: string; class: string };
    siasn: { status: string; message: string; icon: string; class: string };
    overall: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ChartData {
    golongan_distribution: { labels: string[]; values: number[]; colors: string[] };
    monthly_trend: {
        labels: string[];
        datasets: Array<{ label: string; data: number[]; color: string }>;
    };
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const res = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats/');
        return res.data;
    },

    async getActivities(limit = 10): Promise<Activity[]> {
        const res = await api.get<{ success: boolean; data: Activity[] }>('/dashboard/activities/', { limit });
        return res.data || [];
    },

    async getSystemStatus(): Promise<SystemStatus> {
        const res = await api.get<{ success: boolean; data: SystemStatus }>('/dashboard/system-status/');
        return res.data;
    },

    async getChartData(): Promise<ChartData> {
        const res = await api.get<{ success: boolean; data: ChartData }>('/dashboard/charts/');
        return res.data;
    },
};
