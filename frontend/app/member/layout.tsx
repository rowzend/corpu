'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { api } from '@/lib/api';
import { authService } from '@/lib/services';
import SessionChecker from '@/components/providers/SessionChecker';
import {
    LayoutDashboard, User, BookOpen, FileText, Settings, LogOut,
    Search, Menu, X, GraduationCap, BookMarked
} from 'lucide-react';

const sidebarItems = [
    { name: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
    { name: 'Akademi', href: '/member/courses', icon: BookOpen },
    { name: 'Pengetahuanku', href: '/member/kms', icon: BookMarked },
    { name: 'Berita', href: '/member/berita', icon: FileText },
    { name: 'Pelatihan', href: '/member/pelatihan', icon: GraduationCap },
    { name: 'Data Diri', href: '/member/data-diri', icon: User },
    { name: 'Setting', href: '/member/setting', icon: Settings },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
                ...item, _type: 'Pengetahuan', _href: '/member/kms/' + item.slug,
            }));

            const coursesData = coursesRes.status === 'fulfilled' ? coursesRes.value?.results || [] : [];
            coursesData.slice(0, 3).forEach((item: any) => results.push({
                ...item, _type: 'Kursus', _href: '/member/courses/' + item.slug,
            }));

            const newsData = beritaRes.status === 'fulfilled' ? beritaRes.value?.results || [] : [];
            newsData.slice(0, 3).forEach((item: any) => results.push({
                ...item, _type: 'Berita', _href: '/member/berita/' + (item.slug || item.id),
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
        <div className="min-h-screen bg-gray-50">
            <SessionChecker timeoutMinutes={30} showWarning={true} />

            {/* Top Navbar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 md:px-6">
                    <div className="flex items-center justify-between h-16 gap-4">
                        {/* Left: Logo + Mobile Toggle */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => setMobileSidebar(true)}
                                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <Link href="/member/dashboard" className="flex items-center gap-2.5">
                                {settings.logo ? (
                                    <img src={settings.logo} alt={appName} className="h-8 w-auto" />
                                ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <GraduationCap className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <span className="font-bold text-gray-900 hidden sm:block">{appName}</span>
                            </Link>
                        </div>

                        {/* Center: Search */}
                        <div ref={searchRef} className="flex-1 max-w-xl mx-auto hidden sm:block">
                            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Cari kursus, artikel..."
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm pl-2 w-full text-gray-700 placeholder-gray-400"
                                />
                            </div>
                                {showSearch && (
                                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                                        {searchResults.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-gray-400">
                                                Tidak ada hasil untuk "{searchQuery}"
                                            </div>
                                        ) : searchResults.map((item: any, i: number) => (
                                        <Link
                                            key={`${item._type}-${item.id || i}`}
                                            href={item._href}
                                            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                        >
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-100 text-gray-500">
                                                {item._type === 'Kursus' ? 'K' : item._type === 'Berita' ? 'B' : 'P'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                                <p className="text-xs text-gray-500">{item._type}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Avatar + Name */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="hidden sm:flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                        {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                                    {user?.name || user?.username}
                                </span>
                            </div>
                            <button
                                onClick={() => setMobileMenu(true)}
                                className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenu && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenu(false)} />
                    <div className="absolute top-0 left-0 right-0 bg-white shadow-xl rounded-b-2xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <span className="font-bold text-gray-900">Menu</span>
                            <button onClick={() => setMobileMenu(false)} className="p-1 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">
                                        {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user?.name || user?.username}</p>
                                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2">
                                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Cari kursus, artikel..."
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm pl-2 w-full text-gray-700 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Left Sidebar (Desktop) */}
                <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-200 min-h-[calc(100vh-4rem)] bg-white">
                    <nav className="p-4 space-y-1 sticky top-16">
                        {sidebarItems.map(item => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive(item.href)
                                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        ))}
                        <div className="border-t my-3" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </nav>
                </aside>

                {/* Mobile Sidebar Drawer */}
                {mobileSidebar && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
                        <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl">
                            <div className="flex items-center justify-between p-4 border-b">
                                <span className="font-bold text-gray-900">Menu</span>
                                <button onClick={() => setMobileSidebar(false)} className="p-1 rounded-lg hover:bg-gray-100">
                                    <X className="w-5 h-5" />
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
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`} />
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="border-t my-3" />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Right Content */}
                <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
