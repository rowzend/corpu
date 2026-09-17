'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { getPublicSettings, getBrands, type BrandItem } from '@/lib/api/profilePublic';
import { api } from '@/lib/api';
import { showInfo } from '@/lib/sweetalert';
import SudoPrompt from '@/components/SudoPrompt';
import RoleSelectorModal from '@/components/RoleSelectorModal';

type TabType = 'login' | 'register' | 'status';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [brands, setBrands] = useState<BrandItem[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>('login');
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle tab query parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'register' || tab === 'status') {
            setActiveTab(tab as TabType);
        }
    }, [searchParams]);

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [registerData, setRegisterData] = useState({
        name: '', email: '', password: '', confirmPassword: ''
    });
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirm, setShowRegConfirm] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(false);

    const [isVisible, setIsVisible] = useState(false);
    const [showSudoPrompt, setShowSudoPrompt] = useState(false);
    const [sudoUser, setSudoUser] = useState<any>(null);
    const [userGroups, setUserGroups] = useState<Array<{ id: number; name: string; redirect_url?: string }>>([]);
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number; delay: number; size: number }>>([]);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const [isButtonRunning, setIsButtonRunning] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        getPublicSettings().then(setSettings).catch(() => {});
        getBrands().then(data => {
            const activeBrands = data
                .filter(b => b.is_active)
                .sort((a, b) => a.order - b.order)
                .slice(0, 6);
            setBrands(activeBrands);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (searchParams.has('redirect') || searchParams.has('error') || searchParams.has('session')) return;
        const token = authService.getToken();
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) return;
        } catch { return; }
        const user = authService.getCurrentUser();
        if (!user) return;
        const existingGroupId = authService.getActiveGroupId();
        if (existingGroupId !== null) { window.location.href = '/admin/dashboard'; return; }
        (async () => {
            try {
                const permRes = await api.get<{ success: boolean; data: { modules: string[]; user: { groups: Array<{ id: number; name: string; redirect_url?: string }> } } }>('/management/permissions/user/');
                const rawGroups = permRes?.data?.user?.groups || [];
                const normalizedGroups = rawGroups.map((g: any) => typeof g === 'string' ? { id: 0, name: g, redirect_url: '/admin/dashboard' } : g);
                const adminGroups = normalizedGroups.filter(g => (g.redirect_url || '/admin/dashboard').startsWith('/admin/'));
                const memberGroups = normalizedGroups.filter(g => (g.redirect_url || '/admin/dashboard').startsWith('/member/'));
                if (adminGroups.length === 0) { authService.setActiveRole(null, '/member/dashboard'); window.location.href = '/member/dashboard'; }
                else if (adminGroups.length === 1 && memberGroups.length === 0) { authService.setActiveRole(adminGroups[0].id ?? null, adminGroups[0].redirect_url || '/admin/dashboard'); window.location.href = adminGroups[0].redirect_url || '/admin/dashboard'; }
                else if (adminGroups.length >= 1 && memberGroups.length > 0) { setSudoUser(user); setUserGroups(normalizedGroups); setShowSudoPrompt(true); }
                else { setSudoUser(user); setUserGroups(adminGroups); setShowRoleSelector(true); }
            } catch { window.location.href = '/member/dashboard'; }
        })();
    }, []);

    useEffect(() => {
        setIsVisible(true);
        setParticles([...Array(20)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: 4 + Math.random() * 6,
            delay: Math.random() * 3,
            size: 2 + Math.random() * 4,
        })));
    }, []);

    const handleTabSwitch = (tab: TabType) => {
        if (tab === activeTab || isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setActiveTab(tab);
            setError('');
            setRegisterError('');
            setTimeout(() => setIsAnimating(false), 50);
        }, 300);
    };

    const handleButtonHover = () => {
        if (!loginData.password.trim() && loginData.username.trim()) {
            setIsButtonRunning(true);
            setAttemptCount(prev => prev + 1);
            if (attemptCount >= 1) { setShowHint(true); setTimeout(() => setShowHint(false), 3000); }
            setButtonPosition({ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 100 });
            setTimeout(() => { setIsButtonRunning(false); setButtonPosition({ x: 0, y: 0 }); }, 600);
        }
    };

    const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!loginData.password.trim()) { setError('Password tidak boleh kosong!'); setIsButtonRunning(true); setTimeout(() => setIsButtonRunning(false), 600); return; }
        setError(''); setIsLoading(true);
        try {
            await authService.login(loginData);
            const user = authService.getCurrentUser();
            try {
                const permRes = await api.get<{ success: boolean; data: { modules: string[]; user: { groups: Array<{ id: number; name: string; redirect_url?: string }> } } }>('/management/permissions/user/');
                const groups = (permRes?.data?.user?.groups || []).map((g: any) => typeof g === 'string' ? { id: 0, name: g, redirect_url: '/admin/dashboard' } : g);
                const adminGroups = groups.filter((g: any) => (g.redirect_url || '/admin/dashboard').startsWith('/admin/'));
                const memberGroups = groups.filter((g: any) => (g.redirect_url || '/admin/dashboard').startsWith('/member/'));
                if (adminGroups.length === 0) { authService.setActiveRole(null, '/member/dashboard'); window.location.href = '/member/dashboard'; }
                else if (adminGroups.length === 1 && memberGroups.length === 0) { authService.setActiveRole(adminGroups[0].id ?? null, adminGroups[0].redirect_url || '/admin/dashboard'); window.location.href = adminGroups[0].redirect_url || '/admin/dashboard'; }
                else if (adminGroups.length >= 1 && memberGroups.length > 0) { setSudoUser(user); setUserGroups(groups); setShowSudoPrompt(true); }
                else { setSudoUser(user); setUserGroups(adminGroups); setShowRoleSelector(true); }
            } catch { window.location.href = '/member/dashboard'; }
        } catch (err) { setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login'); }
        finally { setIsLoading(false); }
    };

    const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        showInfo('Fitur pendaftaran akan segera hadir!', 'Coming Soon');
    };

    const isLoginValid = loginData.username.trim() && loginData.password.trim();
    const isRegisterValid = registerData.name.trim() && registerData.email.trim() && registerData.password && registerData.confirmPassword && registerData.password === registerData.confirmPassword;

    const brandImageUrl = (path: string | null): string | null => {
        if (!path) return null;
        try {
            if (path.startsWith('http://') || path.startsWith('https://')) {
                const url = new URL(path);
                return `${window.location.origin}${url.pathname}`;
            }
            return `${window.location.origin}${path}`;
        } catch { return null; }
    };

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Left Panel - Branding (2/3) */}
            <div className="hidden lg:flex lg:w-2/3 relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 items-center justify-center overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl"></div>
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}></div>
                    {/* Floating dots */}
                    {particles.slice(0, 8).map((p, i) => (
                        <div key={i} className="absolute rounded-full bg-white/20" style={{
                            width: `${p.size}px`, height: `${p.size}px`,
                            left: `${p.left}%`, top: `${p.top}%`,
                            animation: `float ${p.duration}s ease-in-out infinite`,
                            animationDelay: `${p.delay}s`,
                        }}></div>
                    ))}
                </div>

                <div className="relative z-10 text-center px-16 max-w-xl">
                    {/* Logo */}
                    <div className="mb-8 inline-flex">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl"></div>
                            {settings.logo ? (
                                <img src={settings.logo} alt="Logo" className="h-24 w-auto relative z-10 drop-shadow-2xl" />
                            ) : (
                                <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* App Name */}
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                        {settings.app_name || 'ASN CORPU'}
                    </h1>
                    {settings.app_description && (
                        <p className="text-xl text-white/90 mb-10 font-medium leading-relaxed">
                            {settings.app_description}
                        </p>
                    )}

                    {/* Brand Logos */}
                    {brands.length > 0 && (
                        <div className="mt-10">
                            <p className="text-white/70 text-sm uppercase tracking-wider mb-5 font-semibold">Dengan Prinsip</p>
                            <div className="flex items-center justify-center gap-5 flex-wrap">
                                {brands.map((brand) => {
                                    const imgUrl = brandImageUrl(brand.image_url);
                                    return (
                                        <div key={brand.id} className="group flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:scale-105">
                                            {imgUrl ? (
                                                <img
                                                    src={imgUrl}
                                                    alt={brand.name}
                                                    className="h-12 max-w-[120px] object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (next) next.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <span className={`text-white/90 text-sm font-bold ${imgUrl ? 'hidden' : 'flex'}`}>
                                                {brand.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Form (1/3) */}
            <div className="w-full lg:w-1/3 flex items-center justify-center px-4 py-12 relative">
                {/* Background effects for right panel */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: 'hsl(var(--secondary) / 0.1)', animationDelay: '1s' }}></div>
                    {particles.slice(8).map((p, i) => (
                        <div key={i} className="absolute rounded-full opacity-20" style={{
                            width: `${p.size}px`, height: `${p.size}px`,
                            backgroundColor: 'hsl(var(--primary) / 0.4)',
                            left: `${p.left}%`, top: `${p.top}%`,
                            animation: `float ${p.duration}s ease-in-out infinite`,
                            animationDelay: `${p.delay}s`,
                        }}></div>
                    ))}
                </div>

                <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {/* Mobile Logo */}
                    <div className="text-center mb-6 lg:hidden">
                        <Link href="/" className="inline-flex items-center justify-center mb-3 group">
                            {settings.logo ? (
                                <img src={settings.logo} alt="Logo" className="h-14 w-auto group-hover:scale-105 transition-transform" />
                            ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl">
                                    <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            )}
                        </Link>
                        <p className="text-muted-foreground text-sm">{settings.app_name || 'ASN Academy'}</p>
                    </div>

                    {/* Hint */}
                    {showHint && (
                        <div className="mb-4 bg-accent/20 text-accent px-4 py-3 rounded-xl shadow-lg animate-bounce-in flex items-center text-sm">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Psst... Isi password dulu ya!
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="bg-card rounded-2xl shadow-lg border border-border/50 mb-4">
                        <div className="relative flex bg-muted/20 rounded-t-2xl">
                            <div className="absolute bottom-0 h-[3px] bg-primary rounded-full transition-all duration-300 ease-out" style={{
                                width: '33.333%',
                                left: activeTab === 'login' ? '0%' : activeTab === 'register' ? '33.333%' : '66.666%',
                            }} />
                            {[
                                { id: 'login' as TabType, label: 'Masuk', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /> },
                                { id: 'register' as TabType, label: 'Daftar', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> },
                                { id: 'status' as TabType, label: 'Status', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                            ].map((tab) => (
                                <button key={tab.id} type="button" onClick={() => handleTabSwitch(tab.id)}
                                    className={`flex-1 px-2 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'} ${tab.id === 'login' ? 'rounded-tl-2xl' : tab.id === 'status' ? 'rounded-tr-2xl' : ''}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LOGIN CARD */}
                    {activeTab === 'login' && (
                        <div className={`bg-card rounded-2xl shadow-2xl border border-border/50 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            <div className="px-5 py-3 pb-4">
                                <div className="mb-3 text-center">
                                    <h2 className="text-base font-bold text-foreground">Selamat Datang</h2>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Masuk untuk melanjutkan ke sistem</p>
                                </div>
                                <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                                        {error && (
                                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2.5 rounded-lg animate-shake text-xs">
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    {error}
                                                </div>
                                            </div>
                                        )}
                                        <div className="group">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                Email atau Username
                                            </label>
                                            <input type="text" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                placeholder="Masukkan email atau username" required disabled={isLoading} />
                                        </div>
                                        <div className="group">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                Password
                                            </label>
                                            <div className="relative">
                                                <input type={showPassword ? 'text' : 'password'} value={loginData.password}
                                                    onChange={(e) => { setLoginData({ ...loginData, password: e.target.value }); setError(''); }}
                                                    className="w-full px-3.5 py-2.5 pr-10 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                    placeholder="Masukkan password" required disabled={isLoading} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors" tabIndex={-1}>
                                                    {showPassword ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center group cursor-pointer select-none">
                                                <input type="checkbox" className="w-3.5 h-3.5 text-primary bg-background border-input rounded focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all" />
                                                <span className="ml-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">Ingat saya</span>
                                            </label>
                                        </div>
                                        <button ref={buttonRef} type="submit" disabled={isLoading} onMouseEnter={handleButtonHover} onTouchStart={handleButtonHover}
                                            className={`group relative w-full font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-lg overflow-hidden text-sm mt-1 ${isLoginValid ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-xl hover:shadow-primary/20 cursor-pointer active:scale-[0.98]' : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'} ${isButtonRunning ? 'animate-run-away' : ''}`}
                                            style={{ transform: isButtonRunning ? `translate(${buttonPosition.x}px, ${buttonPosition.y}px)` : 'none' }}>
                                            <span className="relative z-10 flex items-center justify-center">
                                                {isLoading ? (
                                                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Memproses...</>
                                                ) : isButtonRunning ? (
                                                    <><span className="mr-2">🏃💨</span>Tunggu dulu!</>
                                                ) : !isLoginValid ? (
                                                    <><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Isi Form Dulu</>
                                                ) : (
                                                    <>Masuk<svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                                                )}
                                            </span>
                                            {isLoginValid && !isLoading && !isButtonRunning && <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/90 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* REGISTER CARD */}
                        {activeTab === 'register' && (
                            <div className={`bg-card rounded-2xl shadow-2xl border border-border/50 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                <div className="px-5 py-3 pb-4">
                                    <div className="mb-3 text-center">
                                        <h2 className="text-base font-bold text-foreground">Buat Akun Baru</h2>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Daftar untuk mengakses sistem</p>
                                    </div>
                                    {registerSuccess ? (
                                        <div className="text-center py-4">
                                            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <h3 className="text-base font-semibold text-foreground mb-1">Pendaftaran Berhasil!</h3>
                                            <p className="text-xs text-muted-foreground mb-4">Akun Anda sedang diverifikasi. Cek email untuk status pendaftaran.</p>
                                            <button onClick={() => { setRegisterSuccess(false); setRegisterData({ name: '', email: '', password: '', confirmPassword: '' }); handleTabSwitch('login'); }}
                                                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:bg-primary/90 transition-colors">
                                                Kembali ke Masuk
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                                            {registerError && (
                                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2.5 rounded-lg animate-shake text-xs">
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                        {registerError}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="group">
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    Nama Lengkap
                                                </label>
                                                <input type="text" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                    placeholder="Nama lengkap Anda" required />
                                            </div>
                                            <div className="group">
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    Email
                                                </label>
                                                <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                    placeholder="Email aktif Anda" required />
                                            </div>
                                            <div className="group">
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input type={showRegPassword ? 'text' : 'password'} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                        className="w-full px-3.5 py-2.5 pr-10 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                        placeholder="Minimal 8 karakter" required />
                                                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors" tabIndex={-1}>
                                                        {showRegPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                    Konfirmasi Password
                                                </label>
                                                <div className="relative">
                                                    <input type={showRegConfirm ? 'text' : 'password'} value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                                        className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground ${registerData.confirmPassword && registerData.password !== registerData.confirmPassword ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary'}`}
                                                        placeholder="Ulangi password" required />
                                                    <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors" tabIndex={-1}>
                                                        {showRegConfirm ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                                    </button>
                                                </div>
                                                {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && <p className="text-xs text-destructive mt-1">Password tidak cocok</p>}
                                            </div>
                                            <button type="submit" className={`group relative w-full font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-lg overflow-hidden text-sm mt-1 ${isRegisterValid ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-xl hover:shadow-primary/20 cursor-pointer active:scale-[0.98]' : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'}`}>
                                                <span className="relative z-10 flex items-center justify-center">Daftar Sekarang<svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
                                                {isRegisterValid && <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/90 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>}
                                            </button>
                                            <p className="text-[10px] text-muted-foreground text-center mt-1">Dengan mendaftar, Anda menyetujui syarat & ketentuan yang berlaku.</p>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STATUS CARD */}
                        {activeTab === 'status' && (
                            <div className={`bg-card rounded-2xl shadow-2xl border border-border/50 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                <div className="px-5 py-3 pb-4">
                                    <div className="text-center py-2">
                                        <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">Cek Status</h3>
                                        <p className="text-[11px] text-muted-foreground mb-4">Masukkan email untuk melihat status pendaftaran</p>
                                        <div className="group mb-3">
                                            <input type="email" className="w-full px-3.5 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground"
                                                placeholder="Masukkan email Anda" />
                                        </div>
                                        <button type="button" onClick={() => showInfo('Fitur cek status pendaftaran akan segera hadir!', 'Coming Soon')} className="w-full font-semibold py-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer text-sm mb-2">
                                            <span className="flex items-center justify-center">
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                Cek Status
                                            </span>
                                        </button>
                                        <p className="text-[10px] text-muted-foreground">Fitur ini akan segera tersedia.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Footer */}
                    <div className="mt-4 text-center pb-1">
                        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>

            {showSudoPrompt && sudoUser && (
                <SudoPrompt user={sudoUser} groups={userGroups} onChooseRole={(groups) => { setShowSudoPrompt(false); setUserGroups(groups); setShowRoleSelector(true); }} />
            )}
            {showRoleSelector && userGroups.length > 0 && <RoleSelectorModal groups={userGroups} />}

            <style jsx>{`
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
                @keyframes bounce-in { 0% { transform: scale(0.8) translateY(-20px); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                .animate-shake { animation: shake 0.5s; }
                .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
                .animate-run-away { transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            `}</style>
        </div>
    );
}
