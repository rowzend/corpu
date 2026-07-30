'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications';

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data.results);
            setUnreadCount(data.unread_count);
        } catch {}
    };

    const handleClick = async (n: Notification) => {
        if (!n.is_read) {
            await markNotificationRead(n.id).catch(() => {});
        }
        setOpen(false);
        if (n.link) router.push(n.link);
    };

    const handleReadAll = async () => {
        await markAllNotificationsRead().catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'baru saja';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}j`;
        const days = Math.floor(hours / 24);
        return `${days}h`;
    };

    return (
        <div ref={ref} className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                        <p className="text-sm font-semibold">Notifikasi</p>
                        {unreadCount > 0 && (
                            <button onClick={handleReadAll} className="text-xs text-blue-600 hover:underline">
                                Tandai Dibaca
                            </button>
                        )}
                    </div>
                    {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">Tidak ada notifikasi</p>
                    ) : (
                        notifications.map(n => (
                            <button
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`w-full text-left p-3 border-b border-gray-50 hover:bg-muted transition ${
                                    !n.is_read ? 'bg-blue-50' : ''
                                }`}
                            >
                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
