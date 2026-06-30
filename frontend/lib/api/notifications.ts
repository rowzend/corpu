import { api } from '@/lib/api';

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<{ results: Notification[]; unread_count: number }> {
  return api.get('/notifications/');
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
