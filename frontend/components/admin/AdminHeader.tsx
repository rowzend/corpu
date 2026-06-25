'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, type AuthUser } from '@/lib/services';
import { api } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/profilePublic';
import NotificationBell from '@/components/NotificationBell';
import { LogOut, ChevronDown, User, Settings, LayoutDashboard, Menu, Shield } from 'lucide-react';

interface AdminHeaderProps {
    onToggleSidebar?: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
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
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-30">
            <div className="flex items-center justify-between">
                {/* Left - Breadcrumb */}
                <div className="flex items-center gap-3">
                    <button onClick={onToggleSidebar}
                        className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                    <LayoutDashboard className="w-5 h-5 text-blue-600 hidden sm:block" />
                    <nav className="flex items-center gap-1.5 text-sm">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Home
                        </button>
                        {breadcrumb.map((item, i) => (
                            <span key={item.href} className="flex items-center gap-1.5">
                                <span className="text-gray-300">/</span>
                                <button
                                    onClick={() => router.push(item.href)}
                                    className={`transition-colors ${
                                        i === breadcrumb.length - 1
                                            ? 'text-gray-900 font-semibold'
                                            : 'text-gray-500 hover:text-gray-700'
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
                    {pathname.startsWith('/sudo') && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Super Admin</span>
                            <button
                                onClick={() => {
                                    import('@/lib/services/sudo.service').then(({ sudoService }) => {
                                        sudoService.deactivate();
                                        window.location.href = '/dashboard';
                                    });
                                }}
                                className="ml-1 px-1.5 py-0.5 bg-purple-200 hover:bg-purple-300 rounded-md transition-colors text-[10px]"
                            >
                                Exit
                            </button>
                        </div>
                    )}
                    <NotificationBell />

                    <div className="h-6 w-px bg-gray-200" />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <span className="text-white text-sm font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-sm font-semibold text-gray-700 leading-tight">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                                    {userRole || 'Administrator'}
                                </p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 py-2 z-50 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="text-white font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                            <p className="text-xs text-gray-400">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            router.push('/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <User className="w-4 h-4 text-gray-400" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            router.push('/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-gray-400" />
                                        Settings
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 pt-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
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
