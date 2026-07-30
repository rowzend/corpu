'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { api } from '@/lib/api';
import SudoPrompt from '@/components/SudoPrompt';
import RoleSelectorModal from '@/components/RoleSelectorModal';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
  const [showSudoPrompt, setShowSudoPrompt] = useState(false);
  const [sudoUser, setSudoUser] = useState<any>(null);
  const [userGroups, setUserGroups] = useState<Array<{ id: number; name: string; redirect_url?: string }>>([]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const [isButtonRunning, setIsButtonRunning] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        getPublicSettings().then(setSettings).catch(() => {});
    }, []);

    // Auto-check existing session on mount (e.g. after refresh)
    useEffect(() => {
        // Jangan auto-redirect jika user diarahkan ke sini karena:
        // - redirect param (dari middleware, token expired/invalid)
        // - error param (dari admin layout, verifyToken gagal)
        // - session param (dari SessionChecker, session expired)
        if (searchParams.has('redirect') || searchParams.has('error') || searchParams.has('session')) {
            return;
        }

        const token = authService.getToken();
        if (!token) return;

        // Cek expiry token untuk mencegah loop dengan middleware
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                return;
            }
        } catch {
            return;
        }

        const user = authService.getCurrentUser();
        if (!user) return;

        // If user already has an active_group_id, redirect to admin
        const existingGroupId = authService.getActiveGroupId();
        if (existingGroupId !== null) {
            window.location.href = '/admin/dashboard';
            return;
        }

        (async () => {
            try {
                const permRes = await api.get<{ success: boolean; data: { modules: string[]; user: { groups: Array<{ id: number; name: string; redirect_url?: string }> } } }>('/management/permissions/user/');
                const modules = permRes?.data?.modules || [];
                const rawGroups = permRes?.data?.user?.groups || [];
                const normalizedGroups: Array<{ id: number; name: string; redirect_url?: string }> = rawGroups.map((g: any) =>
                    typeof g === 'string' ? { id: 0, name: g, redirect_url: '/admin/dashboard' } : g
                );
                const isStaff = user?.is_staff === true || user?.is_superuser === true;

                // Pisahkan group berdasarkan redirect_url
                const adminGroups = normalizedGroups.filter(g => (g.redirect_url || '/admin/dashboard').startsWith('/admin/'));
                const memberGroups = normalizedGroups.filter(g => (g.redirect_url || '/admin/dashboard').startsWith('/member/'));

                if (adminGroups.length === 0) {
                    // Semua group adalah member → set role_type, redirect
                    authService.setActiveRole(null, '/member/dashboard');
                    window.location.href = '/member/dashboard';
                } else if (adminGroups.length === 1 && memberGroups.length === 0) {
                    // Hanya 1 group admin, tidak ada member → auto-set dan redirect
                    authService.setActiveRole(
                        adminGroups[0].id !== undefined ? adminGroups[0].id : null,
                        adminGroups[0].redirect_url || '/admin/dashboard'
                    );
                    window.location.href = adminGroups[0].redirect_url || '/admin/dashboard';
                } else if (adminGroups.length >= 1 && memberGroups.length > 0) {
                    // Punya admin DAN member groups → tampilkan SudoPrompt
                    setSudoUser(user);
                    setUserGroups(normalizedGroups);
                    setShowSudoPrompt(true);
                } else {
                    // Multiple admin groups, tanpa member → role selector dengan admin groups
                    setSudoUser(user);
                    setUserGroups(adminGroups);
                    setShowRoleSelector(true);
                }
            } catch {
                window.location.href = '/member/dashboard';
            }
        })();
    }, []);

    useEffect(() => {
        setIsVisible(true);
        // Generate particles
        setParticles(
            [...Array(15)].map(() => ({
                left: Math.random() * 100,
                top: Math.random() * 100,
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 2,
            }))
        );
    }, []);

    const handleButtonHover = () => {
        // Check if password is empty
        if (!formData.password.trim() && formData.username.trim()) {
            setIsButtonRunning(true);
            setAttemptCount(prev => prev + 1);
            
            // Show hint after 2 attempts
            if (attemptCount >= 1) {
                setShowHint(true);
                setTimeout(() => setShowHint(false), 3000);
            }

            // Random position within bounds
            const maxX = 200;
            const maxY = 100;
            const randomX = (Math.random() - 0.5) * maxX;
            const randomY = (Math.random() - 0.5) * maxY;
            
            setButtonPosition({ x: randomX, y: randomY });

            // Reset position after animation
            setTimeout(() => {
                setIsButtonRunning(false);
                setButtonPosition({ x: 0, y: 0 });
            }, 600);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Prevent submission if password is empty
        if (!formData.password.trim()) {
            setError('Password tidak boleh kosong!');
            setIsButtonRunning(true);
            setTimeout(() => setIsButtonRunning(false), 600);
            return;
        }

        console.log('Login button clicked!');
        console.log('Form data:', formData);

        setError('');
        setIsLoading(true);

        try {
            await authService.login(formData);
            const user = authService.getCurrentUser();
            let groups: Array<{ id: number; name: string; redirect_url?: string }> = [];
            try {
                const permRes = await api.get<{ success: boolean; data: { modules: string[]; user: { groups: Array<{ id: number; name: string; redirect_url?: string }> } } }>('/management/permissions/user/');
                const modules = permRes?.data?.modules || [];
                groups = permRes?.data?.user?.groups || [];
                console.log('[Login Debug] user:', user);
                console.log('[Login Debug] modules:', modules);
                console.log('[Login Debug] groups:', groups);
                const normalizedGroups: Array<{ id: number; name: string; redirect_url?: string }> = (groups || []).map((g: any) =>
                    typeof g === 'string' ? { id: 0, name: g, redirect_url: '/admin/dashboard' } : g
                );
                groups = normalizedGroups;

                const adminGroups = groups.filter((g: any) => (g.redirect_url || '/admin/dashboard').startsWith('/admin/'));
                const memberGroups = groups.filter((g: any) => (g.redirect_url || '/admin/dashboard').startsWith('/member/'));
                console.log('[Login Debug] modules:', modules, 'adminGroups:', adminGroups.length, 'memberGroups:', memberGroups.length, 'totalGroups:', groups.length);

                if (adminGroups.length === 0) {
                    authService.setActiveRole(null, '/member/dashboard');
                    window.location.href = '/member/dashboard';
                    return;
                } else if (adminGroups.length === 1 && memberGroups.length === 0) {
                    authService.setActiveRole(
                        adminGroups[0].id !== undefined ? adminGroups[0].id : null,
                        adminGroups[0].redirect_url || '/admin/dashboard'
                    );
                    window.location.href = adminGroups[0].redirect_url || '/admin/dashboard';
                    return;
                } else if (adminGroups.length >= 1 && memberGroups.length > 0) {
                    // Punya admin DAN member → tampilkan SudoPrompt
                    setSudoUser(user);
                    setUserGroups(groups);
                    setShowSudoPrompt(true);
                } else {
                    // Multiple admin groups saja → tampilkan RoleSelector langsung
                    setSudoUser(user);
                    setUserGroups(adminGroups);
                    setShowRoleSelector(true);
                }
            } catch (e) {
                console.error('[Login Debug] Error fetching permissions:', e);
                window.location.href = '/member/dashboard';
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.username.trim() && formData.password.trim();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Theme-aware Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Radial gradient glow - mengikuti theme */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent 70%)',
                    }}
                ></div>
                
                {/* Animated floating orbs - mengikuti theme colors */}
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: 'hsl(var(--primary) / 0.12)', animationDelay: '1s' }}></div>
                <div className="absolute top-40 left-40 w-80 h-80 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: 'hsl(var(--secondary) / 0.12)', animationDelay: '2s' }}></div>

                {/* Floating Particles - mengikuti theme */}
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full opacity-30"
                        style={{
                            backgroundColor: 'hsl(var(--primary) / 0.4)',
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            animation: `float ${particle.duration}s ease-in-out infinite`,
                            animationDelay: `${particle.delay}s`,
                        }}
                    ></div>
                ))}
            </div>

            <div className={`max-w-md w-full relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center space-x-3 mb-6 group">
                        {settings.logo ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all duration-300"></div>
                                <img src={settings.logo} alt={settings.app_name || 'Logo'} className="h-16 w-auto relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all duration-300"></div>
                                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </Link>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">{settings.app_name || 'ASN Academy'}</p>
                    </div>
                </div>

                {/* Hint Message */}
                {showHint && (
                    <div className="mb-4 bg-accent/20 text-accent px-4 py-3 rounded-xl shadow-lg animate-bounce-in flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Psst... Isi password dulu ya! 😊</span>
                    </div>
                )}

                {/* Login Form Card */}
                <div className="bg-card/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-border">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-border bg-muted/30">
                        <button
                            type="button"
                            className="flex-1 px-6 py-4 text-sm font-semibold text-primary bg-card border-b-2 border-primary flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Masuk
                        </button>
                        <button
                            type="button"
                            disabled
                            className="flex-1 px-6 py-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Daftar
                        </button>
                        <button
                            type="button"
                            disabled
                            className="flex-1 px-6 py-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Status
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Page Title */}
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-2">Masuk ke Sistem Informasi</h2>
                            <p className="text-sm text-muted-foreground">Masukkan email atau username dan password Anda</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message with Animation */}
                        {error && (
                            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive px-4 py-3 rounded-lg animate-shake">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Username Field with Icon */}
                        <div className="group">
                            <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Email atau Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-card dark:bg-card hover:bg-muted/50 focus:bg-card placeholder:text-muted-foreground text-foreground outline-none"
                                    placeholder="Masukkan username Anda"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field with Toggle */}
                        <div className="group">
                            <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        setError('');
                                    }}
                                    className="w-full pl-12 pr-12 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-card dark:bg-card hover:bg-muted/50 focus:bg-card placeholder:text-muted-foreground text-foreground outline-none"
                                    placeholder="Masukkan password Anda"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors duration-200"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center group cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                                />
                                <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">Ingat saya</span>
                            </label>
                            <Link href="#" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-not-allowed pointer-events-none opacity-50">
                                Lupa password?
                            </Link>
                        </div>

                        {/* Submit Button with Running Animation */}
                        <div className="relative pt-2">
                            <button
                                ref={buttonRef}
                                type="submit"
                                disabled={isLoading}
                                onMouseEnter={handleButtonHover}
                                onTouchStart={handleButtonHover}
                                className={`group relative w-full font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg overflow-hidden ${
                                    isFormValid 
                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transform hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]' 
                                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                                } ${isButtonRunning ? 'animate-run-away' : ''}`}
                                style={{
                                    transform: isButtonRunning ? `translate(${buttonPosition.x}px, ${buttonPosition.y}px)` : 'none',
                                }}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Memproses...
                                        </>
                                    ) : isButtonRunning ? (
                                        <>
                                            <span className="mr-2">🏃💨</span>
                                            Tunggu dulu!
                                        </>
                                    ) : !isFormValid ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Isi Form Dulu
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            Masuk
                                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                                {isFormValid && !isLoading && !isButtonRunning && (
                                    <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/90 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Actions - Call Center & Back to Home */}
                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-6">
                        <button 
                            type="button"
                            disabled
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Center
                        </button>
                        <div className="w-px h-4 bg-border"></div>
                        <button 
                            type="button"
                            disabled
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Kembali ke Beranda
                        </button>
                    </div>
                    </div>
                </div>

                {/* Back to Home - Removed duplicate, now inside card */}
            </div>

            {showSudoPrompt && sudoUser && (
                <SudoPrompt
                    user={sudoUser}
                    groups={userGroups}
                    onChooseRole={(groups) => {
                        setShowSudoPrompt(false);
                        setUserGroups(groups);
                        setShowRoleSelector(true);
                    }}
                />
            )}
            {showRoleSelector && userGroups.length > 0 && (
                <RoleSelectorModal groups={userGroups} />
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0.8) translateY(-20px); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes run-away {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(var(--x), var(--y)); }
                }
                .animate-shake {
                    animation: shake 0.5s;
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s ease-out;
                }
                .animate-run-away {
                    transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        </div>
    );
}
