'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';

interface PermissionCheck {
    module: string;
    control: string;
    function: string;
}

interface MenuItem {
    name: string;
    href: string;
    icon: string;
    children?: MenuItem[];
    requiredModules?: string[];
    requiredPermissions?: PermissionCheck[];
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface AdminSidebarProps {
    isMobileOpen: boolean;
    onToggleMobile: () => void;
}

const menuSections: MenuSection[] = [
    {
        title: 'Utama',
        items: [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: '📊',
                requiredModules: ['dashboard'],
                requiredPermissions: [{ module: 'dashboard', control: 'dashboard_main', function: 'view' }],
            },
        ],
    },
    {
        title: 'Manajemen',
        items: [
            {
                name: 'User Management',
                href: '/users',
                icon: '👥',
                requiredModules: ['pengaturan'],
                children: [
                    { name: 'Users', href: '/users', icon: '👤' },
                    { name: 'Roles', href: '/roles', icon: '🔑' },
                ],
            },
        ],
    },
    {
        title: 'Manajemen Data',
        items: [
            {
                name: 'Kategori Learning',
                href: '/manajemen-data/kategori-learning',
                icon: '📁',
                requiredModules: ['knowledge'],
                requiredPermissions: [{ module: 'knowledge', control: 'knowledge_category', function: 'view' }],
            },
            {
                name: 'Tags',
                href: '/manajemen-data/tags',
                icon: '🏷️',
                requiredModules: ['knowledge'],
                requiredPermissions: [{ module: 'knowledge', control: 'knowledge_tag', function: 'view' }],
            },
        ],
    },
    {
        title: 'Konten & Informasi',
        items: [
            {
                name: 'Profile Instansi',
                href: '/profile',
                icon: '🏛️',
                requiredModules: ['profile'],
                children: [
                    { name: 'Sambutan & Visi Misi', href: '/profile/sambutan-visi-misi', icon: '📋' },
                    { name: 'Sejarah Corpu', href: '/profile/sejarah', icon: '📜' },
                    { name: 'Struktur Organisasi', href: '/profile/struktur', icon: '🏗️' },
                    { name: 'Personalia', href: '/profile/personalia', icon: '👥' },
                    { name: 'Brand', href: '/profile/brand', icon: '🏷️' },
                ],
            },
            {
                name: 'Knowledge Base',
                href: '/knowledge',
                icon: '📚',
                requiredModules: ['knowledge'],
                requiredPermissions: [{ module: 'knowledge', control: 'knowledge_article', function: 'view' }],
            },
            {
                name: 'Berita',
                href: '/dashboard/berita',
                icon: '📰',
                requiredModules: ['berita'],
                requiredPermissions: [{ module: 'berita', control: 'news_article', function: 'view' }],
            },
        ],
    },
    {
        title: 'Pembelajaran',
        items: [
            {
                name: 'Learning',
                href: '/learning',
                icon: '📚',
                requiredModules: ['learning'],
                requiredPermissions: [{ module: 'learning', control: 'courses', function: 'view' }],
                children: [
                    { name: 'Semua Kursus', href: '/learning/courses', icon: '📚' },
                    { name: 'Modul & Pelajaran', href: '/learning/modules', icon: '📖' },
                    { name: 'Enrollment', href: '/learning/enrollments', icon: '📝' },
                    { name: 'Progress', href: '/learning/progress', icon: '📊' },
                    { name: 'Quiz', href: '/learning/quizzes', icon: '❓' },
                    { name: 'Sertifikat User', href: '/learning/certificates/user', icon: '👤' },
                    { name: 'Template Sertifikat', href: '/learning/certificates/template', icon: '🏆' },
                ],
            },
            {
                name: 'HCDP',
                href: '/dashboard/hcdp',
                icon: '🎓',
                requiredModules: ['hcdp'],
                requiredPermissions: [{ module: 'hcdp', control: 'hcdp_program', function: 'view' }],
            },
        ],
    },
    {
        title: 'Kursus Saya',
        items: [
            {
                name: 'Kursus Saya',
                href: '/courses/my-courses',
                icon: '📖',
            },
            {
                name: 'Progress Saya',
                href: '/courses/my-progress',
                icon: '📊',
            },
            {
                name: 'Sertifikat Saya',
                href: '/courses/certificates',
                icon: '🏆',
            },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            {
                name: 'Settings',
                href: '/settings',
                icon: '⚙️',
                requiredModules: ['settings'],
                requiredPermissions: [{ module: 'settings', control: 'app_settings', function: 'view' }],
            },
        ],
    },
];

export default function AdminSidebar({ isMobileOpen, onToggleMobile }: AdminSidebarProps) {
    const pathname = usePathname();
    const sidebarRef = useRef<HTMLDivElement>(null);

    interface PermissionItem {
        module: string;
        function: string;
        control: string;
        permission_string: string;
    }

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [userModules, setUserModules] = useState<string[]>([]);
    const [userPermissions, setUserPermissions] = useState<PermissionItem[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isPinned, setIsPinned] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const isExpanded = !isCollapsed || isHovering || isPinned;

    useEffect(() => {
        Promise.all([
            api.get<{ success: boolean; data: { modules: string[]; permissions: PermissionItem[] } }>('/management/permissions/user/').catch(() => null),
            getPublicSettings(),
        ]).then(([permResponse, settingsData]) => {
            if (permResponse?.success) {
                setUserModules(permResponse.data.modules || []);
                setUserPermissions(permResponse.data.permissions || []);
            }
            setSettings(settingsData);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const appName = settings.app_name || 'ASN CORPU';

    const toggleExpanded = (itemName: string) => {
        if (!isExpanded) return;
        setExpandedItems(prev =>
            prev.includes(itemName)
                ? prev.filter(name => name !== itemName)
                : [...prev, itemName]
        );
    };

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    const isSubmenuOpen = (itemName: string) => {
        return expandedItems.includes(itemName);
    };

    const hasPermission = (item: MenuItem) => {
        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            return item.requiredPermissions.some(perm =>
                userPermissions.some(up =>
                    up.module === perm.module &&
                    up.control === perm.control &&
                    up.function === perm.function
                )
            );
        }
        if (!item.requiredModules || item.requiredModules.length === 0) {
            return true;
        }
        return item.requiredModules.some(module =>
            userModules.includes(module)
        );
    };

    const visibleSections = menuSections
        .map(section => ({
            ...section,
            items: section.items.filter(hasPermission),
        }))
        .filter(section => section.items.length > 0);

    const handleTogglePin = () => {
        setIsPinned(prev => !prev);
        if (isPinned) {
            setIsCollapsed(true);
        }
    };

    const sidebarContent = (
        <div
            ref={sidebarRef}
            className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out overflow-hidden ${
                isExpanded ? 'w-64' : 'w-16'
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className={`flex items-center border-b border-gray-700/50 flex-shrink-0 ${isExpanded ? 'px-5 h-16' : 'justify-center h-16'}`}>
                <Link
                    href="/dashboard"
                    className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}
                >
                    {settings.logo ? (
                        <img src={settings.logo} alt={appName} className="h-9 w-auto flex-shrink-0 rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <span className="text-white font-bold text-sm">{appName.charAt(0)}</span>
                        </div>
                    )}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-1' : 'w-0 opacity-0'}`}>
                        <h1 className="text-base font-bold whitespace-nowrap text-white">{appName}</h1>
                        <p className="text-[10px] text-blue-300/70 whitespace-nowrap tracking-wider uppercase">Admin Panel</p>
                    </div>
                </Link>
                <button onClick={onToggleMobile}
                    className="lg:hidden ml-auto text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                .sidebar-scroll::-webkit-scrollbar { width: 3px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>

            <nav className={`flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll ${isExpanded ? 'p-3' : 'p-2'} space-y-1`}>
                {visibleSections.map(section => (
                    <div key={section.title} className="mb-2">
                        <div className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? 'opacity-100 max-h-5 mb-1' : 'opacity-0 max-h-0'
                        }`}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 truncate">
                                {section.title}
                            </p>
                        </div>

                        {section.items.map(item => (
                            <div key={item.name} className="relative">
                                <div
                                    className={`group flex items-center rounded-xl cursor-pointer transition-all duration-200 ${
                                        isExpanded ? 'justify-between' : 'justify-center'
                                    } ${
                                        isActive(item.href)
                                            ? 'bg-gradient-to-r from-blue-600/20 to-blue-600/5 text-white border-l-2 border-blue-500'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                                    } ${isExpanded ? 'pl-3 pr-2 py-2.5' : 'p-2.5'}`}
                                    onClick={() => {
                                        if (item.children && isExpanded) {
                                            toggleExpanded(item.name);
                                        }
                                    }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`flex items-center ${isExpanded ? 'gap-3 flex-1' : 'justify-center'}`}
                                        title={!isExpanded ? item.name : undefined}
                                    >
                                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-200 ${
                                            isActive(item.href)
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-transparent group-hover:bg-white/5 text-gray-400 group-hover:text-gray-200'
                                        }`}>
                                            <span className="text-base">{item.icon}</span>
                                        </span>
                                        <span className={`font-medium text-sm overflow-hidden transition-all duration-300 ${
                                            isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                                        }`}>
                                            {item.name}
                                        </span>
                                    </Link>

                                    {item.children && isExpanded && (
                                        <span
                                            className={`transform transition-all duration-200 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded ${
                                                isSubmenuOpen(item.name) ? 'rotate-90 text-blue-400' : 'text-gray-500'
                                            }`}
                                        >
                                            ▶
                                        </span>
                                    )}
                                </div>

                                {item.children && isExpanded && isSubmenuOpen(item.name) && (
                                    <div className="ml-4 mt-0.5 space-y-0.5 pl-4 border-l border-gray-700/50">
                                        {item.children.map(child => (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                onClick={() => { if (window.innerWidth < 1024) onToggleMobile(); }}
                                                className={`group flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                                                    isActive(child.href)
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                }`}
                                            >
                                                <span className="text-sm flex-shrink-0">{child.icon}</span>
                                                <span className="text-sm truncate font-medium">{child.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </nav>

            <div className={`border-t border-gray-700/50 flex-shrink-0 ${isExpanded ? 'px-3 py-3' : 'px-0 py-3'}`}>
                <div className={`flex ${isExpanded ? 'items-center justify-between' : 'flex-col items-center gap-2'}`}>
                    <button onClick={handleTogglePin}
                        className={`text-gray-500 hover:text-blue-400 transition-all duration-200 rounded-lg ${
                            isExpanded ? 'p-2 hover:bg-blue-500/10' : 'p-2 hover:bg-white/5'
                        } ${isPinned ? 'text-blue-400' : ''}`}
                        title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}>
                        <Pin className={`w-4 h-4 transition-all ${isPinned ? 'fill-blue-400' : ''}`} />
                    </button>
                    <button onClick={() => { setIsCollapsed(prev => !prev); setIsPinned(false); if (!isCollapsed) setExpandedItems([]); }}
                        className={`text-gray-500 hover:text-white transition-all duration-200 rounded-lg flex items-center gap-2 ${
                            isExpanded ? 'p-2 hover:bg-white/5' : 'p-2 hover:bg-white/5'
                        }`}>
                        {isExpanded ? <><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Sembunyikan</span></> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggleMobile} />
            )}

            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {sidebarContent}
            </div>

            <div className="hidden lg:block flex-shrink-0">
                {sidebarContent}
            </div>
        </>
    );
}
