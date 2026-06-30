'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { authService, type AuthUser } from '@/lib/services';
import { api } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { useTheme } from '@/components/providers/ThemeProvider';
import NotificationBell from '@/components/NotificationBell';
import { LogOut, ChevronDown, User, Settings, LayoutDashboard, Menu, Shield, Sun, Moon, Monitor, Globe } from 'lucide-react';

const locales = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const themes = [
  { value: 'system' as const, label: 'System', icon: Monitor },
  { value: 'light' as const, label: 'Terang', icon: Sun },
  { value: 'dark' as const, label: 'Gelap', icon: Moon },
];

interface AdminHeaderProps {
    onToggleSidebar?: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations();
    const { theme, setTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [appName, setAppName] = useState('');

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        getPublicSettings().then(s => setAppName(s.app_name || '')).catch(() => {});

        const fetchUserRole = async () => {
            try {
                const response = await api.get<{ success: boolean; data: { user: { groups: string[] } } }>('/management/permissions/user/');
                if (response.success && response.data.user.groups.length > 0) {
                    setUserRole(response.data.user.groups[0]);
                }
            } catch (error) {
                console.error('Failed to fetch user role:', error);
            }
        };

        fetchUserRole();
    }, []);

    const switchLocale = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;
        window.dispatchEvent(new Event('localechange'));
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push('/');
        } catch (error) {
            router.push('/');
        }
    };

    const breadcrumb = pathname.split('/').filter(Boolean).map((segment, i, arr) => ({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: '/' + arr.slice(0, i + 1).join('/'),
    }));

    return (
        <header className="px-5 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
                {/* Left - Breadcrumb */}
                <div className="flex items-center gap-3">
                    <button onClick={onToggleSidebar}
                        className="lg:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <nav className="flex items-center gap-1.5 text-sm">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="text-muted-foreground hover:text-card-foreground transition-colors"
                        >
                            {t('admin.header.home')}
                        </button>
                        {breadcrumb.map((item, i) => (
                            <span key={item.href} className="flex items-center gap-1.5">
                                <span className="text-border">/</span>
                                <button
                                    onClick={() => router.push(item.href)}
                                    className={`transition-colors ${
                                        i === breadcrumb.length - 1
                                            ? 'text-card-foreground font-semibold'
                                            : 'text-muted-foreground hover:text-card-foreground'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            </span>
                        ))}
                    </nav>
                </div>

                {/* Right - User menu */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                        <Shield className="w-3.5 h-3.5" />
                        <span>{t('admin.header.admin_badge')}</span>
                    </div>
                    <NotificationBell />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-muted/80 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <span className="text-white text-sm font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-sm font-semibold text-card-foreground leading-tight">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                    {userRole || t('admin.header.administrator')}
                                </p>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-3 w-72 bg-card rounded-2xl shadow-xl shadow-black/5 border border-border z-50 overflow-hidden">
                                {/* Profile */}
                                <div className="px-5 py-4 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="text-white font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-card-foreground truncate">{user?.name}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                        <span className="ml-auto px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                                            {userRole || t('admin.header.admin_badge')}
                                        </span>
                                    </div>
                                </div>

                                {/* Menu */}
                                <div className="py-1.5">
                                    <button onClick={() => { setShowDropdown(false); router.push('/admin/profile'); }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                                        <User className="w-4 h-4" />
                                        {t('admin.header.profile')}
                                    </button>
                                    <button onClick={() => { setShowDropdown(false); router.push('/admin/settings'); }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                                        <Settings className="w-4 h-4" />
                                        {t('admin.header.settings')}
                                    </button>
                                </div>

                                {/* Language */}
                                <div className="border-t border-border px-5 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                        <Globe className="w-3 h-3" /> {t('admin.header.bahasa')}
                                    </p>
                                    <div className="flex gap-1">
                                        {locales.map(l => (
                                            <button key={l.code} onClick={() => { switchLocale(l.code); setShowDropdown(false); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    locale === l.code
                                                        ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                        : 'text-muted-foreground hover:bg-muted'
                                                }`}>
                                                <span>{l.flag}</span>
                                                <span>{l.label === 'العربية' ? 'العربية' : l.label === 'Indonesia' ? 'Indo' : 'Eng'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Theme */}
                                <div className="border-t border-border px-5 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                        <Sun className="w-3 h-3" /> {t('admin.header.tema')}
                                    </p>
                                    <div className="flex gap-1">
                                        {themes.map(t => (
                                            <button key={t.value} onClick={() => { setTheme(t.value); setShowDropdown(false); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    theme === t.value
                                                        ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                        : 'text-muted-foreground hover:bg-muted'
                                                }`}>
                                                <t.icon className="w-3.5 h-3.5" />
                                                <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-border pt-1.5 pb-1.5">
                                    <button onClick={() => { setShowDropdown(false); handleLogout(); }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        {t('admin.header.logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
