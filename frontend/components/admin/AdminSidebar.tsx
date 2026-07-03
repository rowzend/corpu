'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { authService } from '@/lib/services';

interface MenuItemData {
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
    children: MenuItemData[];
}

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

interface MenuCategoryMap {
    [code: number]: string;
}

const CATEGORY_MAP: MenuCategoryMap = {
    1: 'Utama',
    2: 'Manajemen',
    3: 'Manajemen Data',
    4: 'Integrasi',
    5: 'Konten & Informasi',
    6: 'Pembelajaran',
    7: 'Kursus Saya',
    8: 'Referensi',
    9: 'Pengaturan',
    10: 'Pengetahuan',
    11: 'Manajemen Aplikasi',
};

const CATEGORY_ORDER = [1, 2, 3, 5, 10, 6, 7, 9];

const sectionTitleMap: Record<string, string> = {
    'Utama': 'admin.sidebar.utama',
    'Manajemen': 'admin.sidebar.manajemen',
    'Manajemen Data': 'admin.sidebar.manajemen_data',
    'Integrasi': 'admin.sidebar.integrasi',
    'Konten & Informasi': 'admin.sidebar.konten',
    'Pembelajaran': 'admin.sidebar.pembelajaran',
    'Kursus Saya': 'admin.sidebar.kursus_saya',
    'Referensi': 'admin.sidebar.referensi',
    'Pengetahuan': 'admin.sidebar.pengetahuan',
    'Pengaturan': 'admin.sidebar.pengaturan',
    'Manajemen Aplikasi': 'admin.sidebar.manajemen_aplikasi',
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
    'Instansi': 'admin.sidebar.instansi',
    'KMS': 'admin.sidebar.kms',
    'Settings': 'admin.sidebar.settings',
    'ESIMPEG': 'admin.sidebar.esimpeg',
    'Pegawai': 'admin.sidebar.pegawai',
    'Bupati': 'admin.sidebar.bupati',
    'Perguruan Tinggi': 'admin.sidebar.perguruan_tinggi',
    'Program Studi': 'admin.sidebar.program_studi',
    'Lokasi Daerah': 'admin.sidebar.lokasi_daerah',
    'Kategori User': 'admin.sidebar.kategori_user',
    'Manajemen Akses Granular': 'admin.sidebar.akses_granular',
    'Manajemen Menu': 'admin.sidebar.manajemen_menu',
    'Manajemen Fungsi': 'admin.sidebar.manajemen_fungsi',
    'Manajemen Kontrol': 'admin.sidebar.manajemen_kontrol',
    'Manajemen Module': 'admin.sidebar.manajemen_module',
    'Manajemen Rules': 'admin.sidebar.manajemen_rules',
    'Dokumentasi API': 'admin.sidebar.dokumentasi_api',
    'Menu Categories': 'admin.sidebar.menu_categories',
    'Integration': 'admin.sidebar.integrasi',
    'Data References': 'admin.sidebar.data_referensi',
    'Manajemen Aplikasi': 'admin.sidebar.manajemen_aplikasi_parent',
    'Role Profile': 'admin.sidebar.role_profile',
};

function extractModuleFromPermissionKey(key: string | null): string | null {
    if (!key) return null;
    return key.split('.')[0] || null;
}

function hasVisibleChildren(item: MenuItemData, userModules: string[]): boolean {
    if (!item.children || item.children.length === 0) return false;
    return item.children.some(child => {
        const childModule = extractModuleFromPermissionKey(child.permission_key);
        const hasPerm = !childModule || userModules.includes(childModule);
        const hasChildUrl = child.external_url || (child.children && child.children.length > 0);
        return hasPerm && hasChildUrl;
    });
}

function isFrontendItem(item: MenuItemData): boolean {
    if (item.type === 'module' && item.external_url) return true;
    if (item.type === 'menuItem' && item.children && item.children.length > 0) return true;
    return false;
}

function buildHref(externalUrl: string | null, _pathname: string): string {
    if (!externalUrl) return '#';
    return externalUrl;
}

function apiItemToMenuItem(
    item: MenuItemData,
    pathname: string,
    userModules: string[]
): MenuItem | null {
    const itemModule = extractModuleFromPermissionKey(item.permission_key);

    if (item.type === 'module') {
        if (!item.external_url) return null;
        if (itemModule && !userModules.includes(itemModule)) return null;

        return {
            name: item.name,
            href: buildHref(item.external_url, pathname),
            icon: item.icon || '📄',
        };
    }

    if (item.type === 'menuItem') {
        if (itemModule && !userModules.includes(itemModule)) return null;

        const visibleChildren = (item.children || [])
            .map(child => apiItemToMenuItem(child, pathname, userModules))
            .filter((c): c is MenuItem => c !== null);

        if (visibleChildren.length === 0) {
            if (!itemModule) return null;
            if (!item.external_url) return null;

            return {
                name: item.name,
                href: buildHref(item.external_url, pathname),
                icon: item.icon || '📁',
            };
        }

        return {
            name: item.name,
            href: '#',
            icon: item.icon || '📁',
            children: visibleChildren,
        };
    }

    return null;
}

export default function AdminSidebar({ isMobileOpen, onToggleMobile }: AdminSidebarProps) {
    const pathname = usePathname();
    const t = useTranslations();
    const sidebarRef = useRef<HTMLDivElement>(null);

    const safeT = (key: string) => {
        try { return t(key); } catch { return key; }
    };

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [userModules, setUserModules] = useState<string[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [menuSections, setMenuSections] = useState<MenuSection[]>([]);

    const isExpanded = !isCollapsed || isHovering || isPinned;

    useEffect(() => {
        const activeGroupId = authService.getActiveGroupId();
        const permUrl = activeGroupId
            ? `/management/permissions/user/?group_id=${activeGroupId}`
            : '/management/permissions/user/';

        Promise.all([
            api.get<{ success: boolean; data: { modules: string[] } }>(permUrl).catch(() => null),
            api.get<{ success: boolean; data: MenuItemData[] }>('/management/menu/').catch(() => null),
            getPublicSettings(),
        ]).then(([permResponse, menuResponse, settingsData]) => {
            const modules = permResponse?.data?.modules || [];
            setUserModules(modules);
            setSettings(settingsData);

            if (menuResponse?.data) {
                const sectionsMap: { [code: number]: MenuItem[] } = {};
                const seenCategories = new Set<number>();

                for (const apiItem of menuResponse.data) {
                    if (!isFrontendItem(apiItem)) continue;
                    if (!hasVisibleChildren(apiItem, modules) && apiItem.type === 'menuItem') continue;

                    const itemModule = extractModuleFromPermissionKey(apiItem.permission_key);
                    if (apiItem.type === 'module' && apiItem.external_url) {
                        if (itemModule && !modules.includes(itemModule)) continue;
                    }

                    const menuItem = apiItemToMenuItem(apiItem, pathname, modules);
                    if (!menuItem) continue;

                    const catCode = apiItem.category || 0;
                    if (!sectionsMap[catCode]) sectionsMap[catCode] = [];
                    sectionsMap[catCode].push(menuItem);
                    seenCategories.add(catCode);
                }

                const orderedSections: MenuSection[] = [];
                for (const catCode of CATEGORY_ORDER) {
                    if (!seenCategories.has(catCode)) continue;
                    const items = sectionsMap[catCode] || [];
                    if (items.length === 0) continue;
                    orderedSections.push({
                        title: CATEGORY_MAP[catCode] || `Category ${catCode}`,
                        items,
                    });
                }

                setMenuSections(orderedSections);
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, [pathname]);

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
        if (!href || href === '#') return false;
        const pathParts = pathname.split('/').filter(Boolean);
        const hrefParts = href.split('/').filter(Boolean);
        if (hrefParts.length !== pathParts.length) return false;
        return hrefParts.every((part, i) => part === pathParts[i]);
    };

    const isSubmenuOpen = (itemName: string) => {
        return expandedItems.includes(itemName);
    };

    const renderSubItems = (items: MenuItem[], parentKey: string, depth: number = 0) => {
        return items.map(sub => {
            const subKey = `${parentKey}.${sub.name}`;
            if (sub.children) {
                return (
                    <div key={subKey}>
                        <div
                            className={`group flex items-center justify-between rounded-xl cursor-pointer transition-all duration-200 py-1.5 px-3 ${
                                isActive(sub.href)
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-card-foreground'
                            }`}
                            onClick={() => toggleExpanded(subKey)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-sm flex-shrink-0">{sub.icon}</span>
                                <span className="text-sm truncate font-medium">{safeT(itemNameMap[sub.name] || sub.name)}</span>
                            </div>
                            <span className={`transform transition-all duration-200 flex-shrink-0 w-3 h-3 flex items-center justify-center text-xs ${
                                isSubmenuOpen(subKey) ? 'rotate-90' : ''
                            }`}>▶</span>
                        </div>
                        {isSubmenuOpen(subKey) && (
                            <div className={`${depth < 2 ? 'ml-3 mt-0.5 space-y-0.5 pl-3 border-l border-border' : ''}`}>
                                {renderSubItems(sub.children, subKey, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            }
            return (
                <Link key={subKey} href={sub.href}
                    onClick={() => { if (window.innerWidth < 1024) onToggleMobile(); }}
                    className={`group flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all duration-200 ${
                        isActive(sub.href)
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'text-muted-foreground hover:bg-muted/70 hover:text-card-foreground'
                    }`}
                >
                    <span className="text-sm flex-shrink-0">{sub.icon}</span>
                    <span className="text-sm truncate font-medium">{safeT(itemNameMap[sub.name] || sub.name)}</span>
                </Link>
            );
        });
    };

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
                    href="/admin/dashboard"
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
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap tracking-wider uppercase">{safeT('admin.header.administrator')}</p>
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
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                ) : (
                    menuSections.map(section => (
                        <div key={section.title} className="mb-3">
                            <div className={`overflow-hidden transition-all duration-300 ${
                                isExpanded ? 'opacity-100 max-h-5 mb-1' : 'opacity-0 max-h-0'
                            }`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 truncate">
                                    {safeT(sectionTitleMap[section.title] || section.title)}
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
                                            {item.children ? (
                                                <div className={`flex items-center ${isExpanded ? 'gap-3 flex-1' : 'justify-center'}`}
                                                    title={!isExpanded ? safeT(itemNameMap[item.name] || item.name) : undefined}
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
                                                        {safeT(itemNameMap[item.name] || item.name)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center ${isExpanded ? 'gap-3 flex-1' : 'justify-center'}`}
                                                    title={!isExpanded ? safeT(itemNameMap[item.name] || item.name) : undefined}
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
                                                        {safeT(itemNameMap[item.name] || item.name)}
                                                    </span>
                                                </Link>
                                            )}

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
                                                {renderSubItems(item.children, item.name, 1)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
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
