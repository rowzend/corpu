'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MenuItem {
    name: string;
    href: string;
    icon: string;
    children?: MenuItem[];
    requiredModules?: string[];
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
                href: '/admin/dashboard',
                icon: '📊',
                requiredModules: ['dashboard'],
            },
        ],
    },
    {
        title: 'Manajemen',
        items: [
            {
                name: 'User Management',
                href: '/admin/users',
                icon: '👥',
                requiredModules: ['pengaturan'],
                children: [
                    { name: 'Users', href: '/admin/users', icon: '👤' },
                    { name: 'Roles', href: '/admin/roles', icon: '🔑' },
                ],
            },
        ],
    },
    {
        title: 'Manajemen Data',
        items: [
            {
                name: 'Kategori Learning',
                href: '/admin/manajemen-data/kategori-learning',
                icon: '📁',
                requiredModules: ['knowledge'],
            },
            {
                name: 'Tags',
                href: '/admin/manajemen-data/tags',
                icon: '🏷️',
                requiredModules: ['knowledge'],
            },
        ],
    },
    {
        title: 'Konten & Informasi',
        items: [
            {
                name: 'Profile Instansi',
                href: '/admin/profile',
                icon: '🏛️',
                requiredModules: ['profile'],
                children: [
                    { name: 'Sambutan & Visi Misi', href: '/admin/profile/sambutan-visi-misi', icon: '📋' },
                    { name: 'Sejarah Corpu', href: '/admin/profile/sejarah', icon: '📜' },
                    { name: 'Struktur Organisasi', href: '/admin/profile/struktur', icon: '🏗️' },
                    { name: 'Personalia', href: '/admin/profile/personalia', icon: '👥' },
                    { name: 'Brand', href: '/admin/profile/brand', icon: '🏷️' },
                ],
            },
            {
                name: 'Knowledge Base',
                href: '/admin/knowledge',
                icon: '📚',
                requiredModules: ['knowledge'],
            },
            {
                name: 'Berita',
                href: '/admin/dashboard/berita',
                icon: '📰',
            },
        ],
    },
    {
        title: 'Pembelajaran',
        items: [
            {
                name: 'Learning',
                href: '/admin/learning',
                icon: '📚',
                requiredModules: ['learning'],
                children: [
                    { name: 'Semua Kursus', href: '/admin/learning/courses', icon: '📚' },
                    { name: 'Modul & Pelajaran', href: '/admin/learning/modules', icon: '📖' },
                    { name: 'Enrollment', href: '/admin/learning/enrollments', icon: '📝' },
                    { name: 'Progress', href: '/admin/learning/progress', icon: '📊' },
                    { name: 'Quiz', href: '/admin/learning/quizzes', icon: '❓' },
                    { name: 'Sertifikat User', href: '/admin/learning/certificates/user', icon: '👤' },
                    { name: 'Template Sertifikat', href: '/admin/learning/certificates/template', icon: '🏆' },
                ],
            },
            {
                name: 'HCDP',
                href: '/admin/dashboard/hcdp',
                icon: '🎓',
                requiredModules: ['hcdp'],
            },
        ],
    },
    {
        title: 'Kursus Saya',
        items: [
            {
                name: 'Kursus Saya',
                href: '/admin/courses/my-courses',
                icon: '📖',
            },
            {
                name: 'Progress Saya',
                href: '/admin/courses/my-progress',
                icon: '📊',
            },
            {
                name: 'Sertifikat Saya',
                href: '/admin/courses/certificates',
                icon: '🏆',
            },
        ],
    },
    {
        title: 'Pengetahuan',
        items: [
            {
                name: 'Semua Artikel',
                href: '/admin/kms',
                icon: '📚',
            },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            {
                name: 'Settings',
                href: '/admin/settings',
                icon: '⚙️',
                requiredModules: ['settings'],
            },
        ],
    },
];

export default function AdminSidebar({ isMobileOpen, onToggleMobile }: AdminSidebarProps) {
    const pathname = usePathname();
    const t = useTranslations();
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [userModules, setUserModules] = useState<string[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const isExpanded = !isCollapsed || isHovering || isPinned;

    useEffect(() => {
        Promise.all([
            api.get<{ success: boolean; data: { modules: string[] } }>('/management/permissions/user/').catch(() => null),
            getPublicSettings(),
        ]).then(([permResponse, settingsData]) => {
            if (permResponse?.success) {
                setUserModules(permResponse.data.modules || []);
            }
            setSettings(settingsData);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const appName = settings.app_name || 'ASN CORPU';

    const sectionTitleMap: Record<string, string> = {
        'Utama': 'admin.sidebar.utama',
        'Manajemen': 'admin.sidebar.manajemen',
        'Manajemen Data': 'admin.sidebar.manajemen_data',
        'Konten & Informasi': 'admin.sidebar.konten',
        'Pembelajaran': 'admin.sidebar.pembelajaran',
        'Kursus Saya': 'admin.sidebar.kursus_saya',
        'Pengetahuan': 'admin.sidebar.pengetahuan',
        'Pengaturan': 'admin.sidebar.pengaturan',
    };

    const itemNameMap: Record<string, string> = {
        'Dashboard': 'admin.sidebar.dashboard',
        'User Management': 'admin.sidebar.user_management',
        'Users': 'admin.sidebar.users',
        'Roles': 'admin.sidebar.roles',
        'Kategori Learning': 'admin.sidebar.kategori_learning',
        'Tags': 'admin.sidebar.tags',
        'Profile Instansi': 'admin.sidebar.profile_instansi',
        'Sambutan & Visi Misi': 'admin.sidebar.sambutan_visi_misi',
        'Sejarah Corpu': 'admin.sidebar.sejarah_corpu',
        'Struktur Organisasi': 'admin.sidebar.struktur_organisasi',
        'Personalia': 'admin.sidebar.personalia',
        'Brand': 'admin.sidebar.brand',
        'Knowledge Base': 'admin.sidebar.knowledge_base',
        'Berita': 'admin.sidebar.berita',
        'Learning': 'admin.sidebar.learning',
        'Semua Kursus': 'admin.sidebar.semua_kursus',
        'Modul & Pelajaran': 'admin.sidebar.modul_pelajaran',
        'Enrollment': 'admin.sidebar.enrollment',
        'Progress': 'admin.sidebar.progress',
        'Quiz': 'admin.sidebar.quiz',
        'Sertifikat User': 'admin.sidebar.sertifikat_user',
        'Template Sertifikat': 'admin.sidebar.template_sertifikat',
        'HCDP': 'admin.sidebar.hcdp',
        'Kursus Saya': 'admin.sidebar.kursus_saya',
        'Progress Saya': 'admin.sidebar.progress_saya',
        'Sertifikat Saya': 'admin.sidebar.sertifikat_saya',
        'Semua Artikel': 'admin.sidebar.semua_artikel',
        'Settings': 'admin.sidebar.settings',
    };

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
            className={`flex flex-col h-full bg-card border border-border rounded-2xl transition-all duration-300 ease-in-out overflow-hidden shadow-sm ${
                isExpanded ? 'w-64' : 'w-16'
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Logo */}
            <div className={`flex items-center border-b border-border flex-shrink-0 ${isExpanded ? 'px-5 h-16' : 'justify-center h-16'}`}>
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
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-56 opacity-100 ml-1' : 'w-0 opacity-0'}`}>
                        <div className="overflow-hidden">
                            <h1 className="text-base font-bold whitespace-nowrap text-card-foreground hover:animate-scroll-text">{appName}</h1>
                        </div>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap tracking-wider uppercase">{t('admin.header.administrator')}</p>
                    </div>
                </Link>
                <button onClick={onToggleMobile}
                    className="lg:hidden ml-auto text-muted-foreground hover:text-card-foreground p-1.5 rounded-lg hover:bg-muted"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                .sidebar-scroll::-webkit-scrollbar { width: 3px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
                @keyframes scroll-text {
                    0%, 15% { transform: translateX(0); }
                    50%, 65% { transform: translateX(calc(14rem - 100%)); }
                    85%, 100% { transform: translateX(0); }
                }
                .animate-scroll-text:hover {
                    animation: scroll-text 6s ease-in-out infinite;
                }
            `}</style>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll ${isExpanded ? 'p-3' : 'p-2'} space-y-1`}>
                {visibleSections.map(section => (
                    <div key={section.title} className="mb-3">
                        <div className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? 'opacity-100 max-h-5 mb-1' : 'opacity-0 max-h-0'
                        }`}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 truncate">
                                {t(sectionTitleMap[section.title] || section.title)}
                            </p>
                        </div>

                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <div key={item.name} className="relative">
                                    <div
                                        className={`group flex items-center rounded-xl cursor-pointer transition-all duration-200 ${
                                            isExpanded ? 'justify-between' : 'justify-center'
                                        } ${
                                            isActive(item.href)
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20'
                                                : 'text-card-foreground hover:bg-muted/70 border border-transparent'
                                        } ${isExpanded ? 'pl-3 pr-2 py-2' : 'p-2'}`}
                                        onClick={() => {
                                            if (item.children && isExpanded) {
                                                toggleExpanded(item.name);
                                            }
                                        }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={`flex items-center ${isExpanded ? 'gap-3 flex-1' : 'justify-center'}`}
                                            title={!isExpanded ? t(itemNameMap[item.name] || item.name) : undefined}
                                        >
                                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-200 text-sm ${
                                                isActive(item.href)
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-muted-foreground'
                                            }`}>
                                                {item.icon}
                                            </span>
                                            <span className={`font-medium text-sm overflow-hidden transition-all duration-300 ${
                                                isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                                            }`}>
                                                {t(itemNameMap[item.name] || item.name)}
                                            </span>
                                        </Link>

                                        {item.children && isExpanded && (
                                            <span
                                                className={`transform transition-all duration-200 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-xs ${
                                                    isSubmenuOpen(item.name) ? 'rotate-90 text-blue-500' : 'text-muted-foreground'
                                                }`}
                                            >
                                                ▶
                                            </span>
                                        )}
                                    </div>

                                    {item.children && isExpanded && isSubmenuOpen(item.name) && (
                                        <div className="ml-3 mt-1 space-y-0.5 pl-3 border-l border-border">
                                            {item.children.map(child => (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    onClick={() => { if (window.innerWidth < 1024) onToggleMobile(); }}
                                                    className={`group flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all duration-200 ${
                                                        isActive(child.href)
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-card-foreground'
                                                    }`}
                                                >
                                                    <span className="text-sm flex-shrink-0">{child.icon}</span>
                                                    <span className="text-sm truncate font-medium">{t(itemNameMap[child.name] || child.name)}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Controls */}
            <div className={`border-t border-border flex-shrink-0 ${isExpanded ? 'px-3 py-3' : 'px-0 py-3'}`}>
                <div className={`flex ${isExpanded ? 'items-center justify-between' : 'flex-col items-center gap-2'}`}>
                    <button onClick={handleTogglePin}
                        className={`text-muted-foreground hover:text-blue-500 transition-all duration-200 rounded-lg ${
                            isExpanded ? 'p-2 hover:bg-muted' : 'p-2 hover:bg-muted'
                        } ${isPinned ? 'text-blue-500' : ''}`}
                        title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}>
                        <Pin className={`w-4 h-4 transition-all ${isPinned ? 'fill-blue-500' : ''}`} />
                    </button>
                    <button onClick={() => { setIsCollapsed(prev => !prev); setIsPinned(false); if (!isCollapsed) setExpandedItems([]); }}
                        className={`text-muted-foreground hover:text-card-foreground transition-all duration-200 rounded-lg flex items-center gap-2 ${
                            isExpanded ? 'p-2 hover:bg-muted' : 'p-2 hover:bg-muted'
                        }`}>
                        {isExpanded ? <><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Sembunyikan</span></> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggleMobile} />
            )}

            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {sidebarContent}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block flex-shrink-0">
                {sidebarContent}
            </div>
        </>
    );
}
