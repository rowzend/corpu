'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { api } from '@/lib/api';
import SudoPrompt from '@/components/SudoPrompt';
import RoleSelectorModal from '@/components/RoleSelectorModal';

export default function LoginPage() {
    const router = useRouter();
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
        const token = authService.getToken();
        if (!token) return;

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
                } else if (adminGroups.length === 1) {
                    // Hanya 1 group admin → auto-set dan redirect
                    authService.setActiveRole(
                        adminGroups[0].id !== undefined ? adminGroups[0].id : null,
                        adminGroups[0].redirect_url || '/admin/dashboard'
                    );
                    window.location.href = adminGroups[0].redirect_url || '/admin/dashboard';
                } else {
                    // Multiple admin groups → show role selector dengan semua group
                    setSudoUser(user);
                    setUserGroups(normalizedGroups);
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
                console.log('[Login Debug] modules:', modules, 'adminGroups:', adminGroups.length, 'totalGroups:', groups.length);

                if (adminGroups.length === 0) {
                    authService.setActiveRole(null, '/member/dashboard');
                    window.location.href = '/member/dashboard';
                    return;
                } else if (adminGroups.length === 1) {
                    authService.setActiveRole(
                        adminGroups[0].id !== undefined ? adminGroups[0].id : null,
                        adminGroups[0].redirect_url || '/admin/dashboard'
                    );
                    window.location.href = adminGroups[0].redirect_url || '/admin/dashboard';
                    return;
                } else {
                    setSudoUser(user);
                    setUserGroups(groups);
                    setShowSudoPrompt(true);
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
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 dark:bg-purple-900/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 dark:bg-blue-900/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 dark:bg-indigo-900/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>

                {/* Floating Particles */}
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full opacity-20"
                        style={{
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
                            <img src={settings.logo} alt={settings.app_name || 'Logo'} className="h-16 w-auto" />
                        ) : (
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <span className="text-blue-600 font-bold text-3xl">A</span>
                            </div>
                        )}
                        <span className="text-3xl font-bold text-white drop-shadow-lg">{settings.app_name || 'ASN Academy'}</span>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Selamat Datang Kembali</h1>
                        <p className="text-blue-100 text-lg">Masuk untuk melanjutkan pembelajaran Anda</p>
                    </div>
                </div>

                {/* Hint Message */}
                {showHint && (
                    <div className="mb-4 bg-yellow-400 dark:bg-yellow-500/20 text-yellow-900 dark:text-yellow-200 px-4 py-3 rounded-xl shadow-lg animate-bounce-in flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Psst... Isi password dulu ya! 😊</span>
                    </div>
                )}

                {/* Login Form Card */}
                <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:bg-gray-800/95 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message with Animation */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg animate-shake">
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
                            <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-muted focus:bg-card placeholder:text-muted-foreground"
                                    placeholder="Masukkan username Anda"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field with Toggle */}
                        <div className="group">
                            <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className="w-full pl-12 pr-12 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-muted focus:bg-card placeholder:text-muted-foreground"
                                    placeholder="Masukkan password Anda"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
                        <div className="flex items-center justify-between">
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">Ingat saya</span>
                            </label>
                            <span className="text-sm text-muted-foreground cursor-not-allowed">
                                Lupa password?
                            </span>
                        </div>

                        {/* Submit Button with Running Animation */}
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                type="submit"
                                disabled={isLoading}
                                onMouseEnter={handleButtonHover}
                                onTouchStart={handleButtonHover}
                                className={`group relative w-full font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg overflow-hidden ${
                                    isFormValid 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer' 
                                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                                } ${isButtonRunning ? 'animate-run-away' : ''}`}
                                style={{
                                    transform: isButtonRunning ? `translate(${buttonPosition.x}px, ${buttonPosition.y}px)` : 'none',
                                }}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                                            Masuk
                                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                                {isFormValid && !isLoading && (
                                    <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card text-muted-foreground">atau</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Belum punya akun?{' '}
                            <span className="text-muted-foreground cursor-not-allowed font-semibold">
                                Daftar sekarang
                            </span>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="inline-flex items-center text-sm text-white hover:text-blue-100 transition-colors group">
                        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                </div>
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
