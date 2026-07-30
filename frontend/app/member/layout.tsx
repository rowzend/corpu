'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { api } from '@/lib/api';
import { authService } from '@/lib/services';
import SessionChecker from '@/components/providers/SessionChecker';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import {
    LayoutDashboard, User, BookOpen, FileText, Settings, LogOut,
    Search, Menu, X, GraduationCap, BookMarked, ChevronDown, Database
} from 'lucide-react';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [userDropdown, setUserDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const sidebarItems = [
        { name: t('member.nav.dashboard'), href: '/member/dashboard', icon: LayoutDashboard },
        { name: t('member.nav.akademi'), href: '/member/courses', icon: BookOpen },
        { name: t('member.nav.kms'), href: '/member/kms', icon: BookMarked },
        { name: t('member.nav.berita'), href: '/member/berita', icon: FileText },
        { name: t('member.nav.pelatihan'), href: '/member/pelatihan', icon: GraduationCap },
        { name: t('member.nav.data_idp'), href: '/member/data-idp', icon: Database },
        { name: t('member.nav.setting'), href: '/member/setting', icon: Settings },
    ];

    useEffect(() => {
        const u = authService.getCurrentUser();
        if (!u || !authService.getToken()) {
router.push('/');
            return;
        }
        setUser(u);
        getPublicSettings().then(setSettings).catch(() => {});
    }, []);

    useEffect(() => {
        setMobileSidebar(false);
        setMobileMenu(false);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearch(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const [kmsRes, coursesRes, beritaRes] = await Promise.allSettled([
                api.get('/knowledge/articles/', { search: q, per_page: 3 }),
                api.get('/learning/courses/', { search: q, per_page: 3 }),
                api.get('/news/', { search: q, per_page: 3 }),
            ]);
            const results: any[] = [];

            const kmsData = kmsRes.status === 'fulfilled' ? kmsRes.value?.results || [] : [];
            kmsData.slice(0, 3).forEach((item: any) => results.push({
                ...item, _type: 'knowledge', _href: '/member/kms/' + item.slug,
            }));

            const coursesData = coursesRes.status === 'fulfilled' ? coursesRes.value?.results || [] : [];
            coursesData.slice(0, 3).forEach((item: any) => results.push({
                ...item, _type: 'course', _href: '/member/courses/' + item.slug,
            }));

            const newsData = beritaRes.status === 'fulfilled' ? beritaRes.value?.results || [] : [];
            newsData.slice(0, 3).forEach((item: any) => results.push({
                ...item, _type: 'news', _href: '/member/berita/' + (item.slug || item.id),
            }));

            setSearchResults(results);
            setShowSearch(true);
        } catch {
            setSearchResults([]);
        }
    };

const handleLogout = async () => {
        await authService.logout();
        window.location.href = '/';
    };

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const appName = settings.app_name || 'ASN CORPU';

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:bg-gradient-to-br dark:from-[#0a1f44] dark:via-[#0d2757] dark:to-[#0a1f44]">
            {/* Animated background blobs - Midnight Blue Theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/30 dark:bg-blue-600/10 rounded-full blur-3xl animate-float animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/20 dark:bg-blue-400/5 rounded-full blur-3xl animate-float animation-delay-4000" />
            </div>

            <SessionChecker timeoutMinutes={30} />

            {/* Top Navbar - Midnight Blue Theme */}
            <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0d2757]/70 backdrop-blur-xl border-b border-white/20 dark:border-blue-900/30 shadow-lg shadow-black/[0.02] dark:shadow-black/[0.08]">
                <div className="px-4 md:px-6">
                    <div className="flex items-center justify-between h-16 gap-4">
                        {/* Left: Logo + Mobile Toggle */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => setMobileSidebar(true)}
                                className="lg:hidden p-2 rounded-xl bg-white/50 dark:bg-white/5 text-muted-foreground hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm transition-all"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <Link href="/member/dashboard" className="flex items-center gap-2.5">
                                {settings.logo ? (
                                    <img src={settings.logo} alt={appName} className="h-8 w-auto" />
                                ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                        <GraduationCap className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <span className="font-bold text-foreground hidden sm:block">{appName}</span>
                            </Link>
                        </div>

                        {/* Center: Search */}
                        <div ref={searchRef} className="flex-1 max-w-xl mx-auto hidden sm:block">
                            <div className="flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-ring/50 focus-within:bg-white/80 dark:focus-within:bg-white/10 border border-white/20 dark:border-white/5 transition-all">
                                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('member.search.placeholder')}
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm pl-2 w-full text-foreground placeholder-muted-foreground"
                                />
                            </div>
                                {showSearch && (
                                    <div className="absolute top-full mt-2 left-0 right-0 bg-white/80 dark:bg-[#0f2847]/80 backdrop-blur-xl rounded-xl shadow-xl shadow-black/5 border border-white/30 dark:border-blue-900/30 overflow-hidden z-50">
                                        {searchResults.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                {t('member.search.no_results', { query: searchQuery })}
                                            </div>
                                        ) : searchResults.map((item: any, i: number) => (
                                        <Link
                                            key={`${item._type}-${item.id || i}`}
                                            href={item._href}
                                            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors border-b border-white/20 dark:border-gray-800/30 last:border-0"
                                        >
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-primary/10 text-primary backdrop-blur-sm">
                                                {item._type === 'course' ? 'K' : item._type === 'news' ? 'B' : 'P'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{t('member.search.type_' + item._type)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Lang + User */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden sm:block">
                                <LanguageSwitcher />
                            </div>

                            <div ref={userMenuRef} className="relative hidden sm:block">
                                <button
                                    onClick={() => setUserDropdown(!userDropdown)}
                                    className="flex items-center gap-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                                        <span className="text-white text-xs font-bold">
                                            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-foreground truncate max-w-[100px] hidden lg:block">
                                        {user?.name || user?.username}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {userDropdown && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white/80 dark:bg-[#0f2847]/80 backdrop-blur-xl rounded-xl shadow-xl shadow-black/5 border border-white/30 dark:border-blue-900/30 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-white/20 dark:border-blue-900/30">
                                            <p className="text-sm font-semibold text-foreground truncate">{user?.name || user?.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                                        </div>
                                        <Link
                                            href="/member/data-diri"
                                            onClick={() => setUserDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            {t('member.nav.data_diri')}
                                        </Link>
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground">
                                            <span className="flex items-center gap-3">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                Tema
                                            </span>
                                            <ThemeToggleCompact />
                                        </div>
                                        <div className="border-t border-white/20 dark:border-blue-900/30" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t('member.nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMobileMenu(true)}
                                className="sm:hidden p-2 rounded-xl bg-white/50 dark:bg-white/5 text-muted-foreground hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm transition-all"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay - Midnight Blue Theme */}
            {mobileMenu && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
                    <div className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-[#0f2847]/80 backdrop-blur-xl shadow-xl rounded-b-2xl border-b border-white/20 dark:border-blue-900/30">
                        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-blue-900/30">
                            <span className="font-bold text-foreground">{t('member.nav.menu')}</span>
                            <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl mb-3 border border-white/20 dark:border-white/5">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                                    <span className="text-white text-sm font-bold">
                                        {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{user?.name || user?.username}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 dark:border-white/5">
                                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder={t('member.search.placeholder')}
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm pl-2 w-full text-foreground placeholder-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-center">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                {/* Left Sidebar (Desktop) - Midnight Blue Theme */}
                <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-white/20 dark:border-blue-900/30 overflow-y-auto bg-white/50 dark:bg-[#0d2757]/50 backdrop-blur-xl">
                    <nav className="p-4 space-y-1">
                        {sidebarItems.map(item => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive(item.href)
                                        ? 'bg-primary/10 text-primary border-l-2 border-primary backdrop-blur-sm shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground backdrop-blur-sm'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Mobile Sidebar Drawer - Midnight Blue Theme */}
                {mobileSidebar && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
                        <div className="absolute top-0 left-0 bottom-0 w-72 bg-white/80 dark:bg-[#0f2847]/80 backdrop-blur-xl shadow-2xl shadow-black/10 border-r border-white/20 dark:border-blue-900/30">
                            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-blue-900/30">
                                <span className="font-bold text-foreground">{t('member.nav.menu')}</span>
                                <button onClick={() => setMobileSidebar(false)} className="p-1.5 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <nav className="p-4 space-y-1">
                                {sidebarItems.map(item => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileSidebar(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                            isActive(item.href)
                                                ? 'bg-primary/10 text-primary backdrop-blur-sm shadow-sm'
                                                : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`} />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Right Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
