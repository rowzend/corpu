'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { getHeroImages, type HeroImageItem } from '@/lib/api/hero';
import { getFeaturedArticles, getPopularArticles, type Article } from '@/lib/api/knowledge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import { useTranslations } from 'next-intl';

function getPublicBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return '/apicorpu/public/1.0';
}

function getNewsBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/1.0`;
  }
  return '/apicorpu/1.0';
}

async function getLatestNews() {
  try {
    const res = await fetch(`${getNewsBaseURL()}/news/latest/?limit=3`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? json.results ?? (Array.isArray(json) ? json : []);
  } catch { return []; }
}

async function getFeaturedCourses() {
  try {
    const res = await fetch(`${getNewsBaseURL()}/learning/courses/featured/`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.results ?? [];
  } catch { return []; }
}

async function getPopularCourses() {
  try {
    const res = await fetch(`${getNewsBaseURL()}/learning/courses/popular/`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.results ?? [];
  } catch { return []; }
}

async function getLatestCourses() {
  try {
    const res = await fetch(`${getNewsBaseURL()}/learning/courses/?ordering=-created_at&page_size=6`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results ?? (Array.isArray(json) ? json : []);
  } catch { return []; }
}

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrollY;
}

function useIntersection(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isVisible;
}

function AnimatedCounter({ value, suffix = '', decimals = 0, isVisible }: { value: number; suffix?: string; decimals?: number; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isVisible && value > 0) {
      setCount(0);
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) { setCount(value); clearInterval(timer); }
        else setCount(current);
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isVisible, value]);

  return <>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}</>;
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function LandingNavbar({ scrollY }: { scrollY: number }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('nav');

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => {});
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isScrolled = scrollY > 60;
  const appName = settings.app_name || 'ASN Academy';
  const logo = settings.logo || '';

  const profileSubMenus = [
    { label: t('profile_sambutan'), href: '/profil/sambutan-visi-misi' },
    { label: t('profile_sejarah'), href: '/profil/sejarah' },
    { label: t('profile_struktur'), href: '/profil/struktur' },
    { label: t('profile_personalia'), href: '/profil/personalia' },
  ];

  function linkClass(base = '') {
    return `font-medium transition-all duration-300 hover:scale-105 ${base} text-foreground hover:text-primary`;
  }

  function mobileLinkClass() {
    return `font-medium text-foreground`;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/90 dark:bg-card/95 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 border-b border-border/60'
          : 'bg-white/70 dark:bg-background/50 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            {logo ? (
              <img src={logo} alt={appName} className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">{appName.charAt(0)}</span>
              </div>
            )}
            <span className={`font-bold text-xl transition-colors duration-500 text-foreground`}>
              {appName}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={linkClass()}>{t('beranda')}</Link>

            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className={`${linkClass()} flex items-center gap-1 cursor-pointer`}>
                {t('profile')}
                <svg className={`w-4 h-4 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileOpen && (
                <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border py-2 backdrop-blur-xl bg-card border-border`}>
                  {profileSubMenus.map((sub) => (
                    <Link key={sub.href} href={sub.href}
                      className={`block px-4 py-2.5 text-sm transition-colors text-foreground hover:bg-primary/10 hover:text-primary`}
                      onClick={() => setProfileOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/hcdp" className={linkClass()}>{t('hcdp')}</Link>
            <Link href="/berita" className={linkClass()}>{t('berita')}</Link>
            <Link href="/courses" className={linkClass()}>{t('kursus')}</Link>
            <Link href="/kms" className={linkClass()}>{t('kms')}</Link>

            <LanguageSwitcher />
            <ThemeToggleCompact />
            <Link
              href="/login"
              className={`px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105`}
            >
              {t('login')}
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 rounded-lg transition-colors text-foreground hover:bg-muted`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className={`lg:hidden py-6 border-t border-border`}>
            <div className="flex flex-col gap-4">
              <Link href="/" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('beranda')}</Link>
              <div className="flex flex-col gap-1">
                <span className={`text-xs uppercase tracking-wider font-semibold text-muted-foreground`}>{t('profile')}</span>
                <div className="pl-3 flex flex-col gap-2">
                  {profileSubMenus.map((sub) => (
                    <Link key={sub.href} href={sub.href}
                      className={`text-sm ${mobileLinkClass()}`}
                      onClick={() => setMobileOpen(false)}
                    >{sub.label}</Link>
                  ))}
                </div>
              </div>
              <Link href="/hcdp" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('hcdp')}</Link>
              <Link href="/berita" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('berita')}</Link>
              <Link href="/courses" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('kursus')}</Link>
              <Link href="/kms" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('kms')}</Link>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <LanguageSwitcher />
                <ThemeToggleCompact />
                <Link href="/login" className={`flex-1 text-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground`}>{t('login')}</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; dur: number; delay: number }>>([]);
  const [heroImages, setHeroImages] = useState<HeroImageItem[]>([]);
  const [statsData, setStatsData] = useState<Record<string, number>>({});
  const [heroSettings, setHeroSettings] = useState<Record<string, string>>({});
  const t = useTranslations('hero');
  const tl = useTranslations('landing');

  useEffect(() => {
    getHeroImages().then(setHeroImages);
    getPublicSettings().then(setHeroSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setParticles(
      [...Array(30)].map(() => ({
        x: Math.random() * 100, y: Math.random() * 100,
        size: 1 + Math.random() * 3,
        dur: 4 + Math.random() * 6,
        delay: Math.random() * 4,
      }))
    );
    const onMouse = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 30, y: (e.clientY / window.innerHeight - 0.5) * 30 });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          fetch(`${getPublicBaseURL()}/dashboard/stats/`).then(r => r.json()).catch(() => ({ success: false, data: {} })),
          fetch(`${getNewsBaseURL()}/learning/courses/`).then(r => r.json()).catch(() => ({ count: 0 })),
        ]);

        const stats = statsRes.success ? statsRes.data : {};
        const totalAsn = stats.total_pegawai ?? 0;
        const totalCourses = coursesRes.count ?? stats.total_courses ?? 0;
        const totalEnrollments = stats.total_enrollments ?? 0;
        const completedEnrollments = stats.completed_enrollments ?? 0;
        const graduationRate = totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0;

        setStatsData({ totalAsn, totalCourses, totalEnrollments, graduationRate });
      } catch {
        setStatsData({ totalAsn: 0, totalCourses: 0, totalEnrollments: 0, graduationRate: 0 });
      }
    }
    fetchStats();
  }, []);

  const heroStats = [
    { 
      icon: '👥', 
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
      value: statsData.totalAsn || 0, 
      suffix: '+', 
      label: 'ASN Terdaftar', 
      sublabel: 'Seluruh pegawai aktif' 
    },
    { 
      icon: '📚', 
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      value: statsData.totalCourses || 0, 
      suffix: '+', 
      label: 'Kursus Tersedia', 
      sublabel: 'Materi berkualitas' 
    },
    { 
      icon: '🎓', 
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      value: statsData.totalEnrollments || 0, 
      suffix: '+', 
      label: 'Total Peserta', 
      sublabel: 'Partisipasi belajar' 
    },
    { 
      icon: '📊', 
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
      value: statsData.graduationRate || 0, 
      suffix: '%', 
      label: 'Tingkat Kelulusan', 
      sublabel: 'Hasil belajar optimal' 
    },
  ];

  return (
    <section className="hero-section relative min-h-screen flex items-center overflow-visible bg-gradient-to-br from-muted to-muted pb-32">
      
      {/* Background: Siluet Rumah Gadang Minangkabau - KECIL & SUBTLE seperti Gambar 2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background image Rumah Gadang - Lebih kecil dan centered */}
        <div 
          className="absolute inset-0 bg-no-repeat opacity-[0.08] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'url(/hero_background.png?v=2)',
            backgroundPosition: 'center center',
            backgroundSize: '40%',
          }}
          onError={(e) => {
            console.error('Failed to load hero background image');
            // Remove background if image fails to load
            (e.target as HTMLElement).style.backgroundImage = 'none';
          }}
        />
        
        {/* Gradient overlay untuk blend yang lebih smooth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30 dark:to-background/30" />
        
        {/* Animated Stars Decoration */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
          {/* Star positions with different sizes and animation delays */}
          {[
            { x: 100, y: 80, size: 16, delay: 0 },
            { x: 250, y: 150, size: 12, delay: 0.5 },
            { x: 850, y: 100, size: 20, delay: 1 },
            { x: 150, y: 300, size: 10, delay: 1.5 },
            { x: 800, y: 250, size: 14, delay: 2 },
            { x: 500, y: 120, size: 18, delay: 0.8 },
            { x: 650, y: 350, size: 12, delay: 1.2 },
            { x: 300, y: 450, size: 16, delay: 0.3 },
            { x: 900, y: 450, size: 10, delay: 1.8 },
            { x: 700, y: 180, size: 14, delay: 0.6 },
          ].map((star, i) => (
            <g key={`star-${i}`} className="animate-twinkle" style={{ animationDelay: `${star.delay}s` }}>
              <polygon
                points={`${star.x},${star.y - star.size/2} ${star.x + star.size/6},${star.y - star.size/6} ${star.x + star.size/2},${star.y} ${star.x + star.size/6},${star.y + star.size/6} ${star.x},${star.y + star.size/2} ${star.x - star.size/6},${star.y + star.size/6} ${star.x - star.size/2},${star.y} ${star.x - star.size/6},${star.y - star.size/6}`}
                fill="currentColor"
                className="text-primary/20 dark:text-primary/30"
              />
            </g>
          ))}
          
          {/* Small sparkle stars */}
          {[
            { x: 180, y: 200, delay: 0.2 },
            { x: 400, y: 280, delay: 1.3 },
            { x: 750, y: 320, delay: 0.9 },
            { x: 550, y: 400, delay: 1.7 },
            { x: 200, y: 520, delay: 0.4 },
          ].map((sparkle, i) => (
            <g key={`sparkle-${i}`} className="animate-sparkle" style={{ animationDelay: `${sparkle.delay}s` }}>
              <circle
                cx={sparkle.x}
                cy={sparkle.y}
                r="3"
                fill="currentColor"
                className="text-secondary/30 dark:text-secondary/40"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Wave / ombak pattern ANIMATED - Soft Light Blue Theme (harmonious & professional) */}
      <div className="absolute bottom-0 inset-x-0 h-[450px] overflow-hidden pointer-events-none z-[1]">
        <svg className="w-full h-full" viewBox="0 0 1440 450" preserveAspectRatio="none">
          {/* Ombak layer 1 - Paling belakang, gentle light blue */}
          <path 
            d="M0,80 Q360,40 720,80 T1440,80 L1440,450 L0,450 Z" 
            fill="currentColor" 
            className="text-blue-100/30 dark:text-blue-900/30"
          >
            <animate 
              attributeName="d" 
              dur="12s" 
              repeatCount="indefinite"
              values="
                M0,80 Q360,40 720,80 T1440,80 L1440,450 L0,450 Z;
                M0,80 Q360,120 720,80 T1440,80 L1440,450 L0,450 Z;
                M0,80 Q360,40 720,80 T1440,80 L1440,450 L0,450 Z
              "
            />
          </path>
          
          {/* Ombak layer 2 - Tengah, medium light blue */}
          <path 
            d="M0,120 Q360,80 720,120 T1440,120 L1440,450 L0,450 Z" 
            fill="currentColor" 
            className="text-blue-200/25 dark:text-blue-800/35"
          >
            <animate 
              attributeName="d" 
              dur="9s" 
              repeatCount="indefinite"
              values="
                M0,120 Q360,80 720,120 T1440,120 L1440,450 L0,450 Z;
                M0,120 Q360,160 720,120 T1440,120 L1440,450 L0,450 Z;
                M0,120 Q360,80 720,120 T1440,120 L1440,450 L0,450 Z
              "
            />
          </path>
          
          {/* Ombak layer 3 - Paling depan, soft azure blue */}
          <path 
            d="M0,160 Q360,120 720,160 T1440,160 L1440,450 L0,450 Z" 
            fill="currentColor" 
            className="text-sky-200/30 dark:text-blue-700/40"
          >
            <animate 
              attributeName="d" 
              dur="7s" 
              repeatCount="indefinite"
              values="
                M0,160 Q360,120 720,160 T1440,160 L1440,450 L0,450 Z;
                M0,160 Q360,200 720,160 T1440,160 L1440,450 L0,450 Z;
                M0,160 Q360,120 720,160 T1440,160 L1440,450 L0,450 Z
              "
            />
          </path>

          {/* Garis ombak tipis untuk detail tambahan - light blue outline */}
          <path 
            d="M0,60 Q360,20 720,60 T1440,60" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            className="text-blue-300/35 dark:text-blue-600/35"
          >
            <animate 
              attributeName="d" 
              dur="10s" 
              repeatCount="indefinite"
              values="
                M0,60 Q360,20 720,60 T1440,60;
                M0,60 Q360,100 720,60 T1440,60;
                M0,60 Q360,20 720,60 T1440,60
              "
            />
          </path>
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
            
            {/* Left side - Content */}
            <div className="space-y-6 lg:pr-8 max-w-2xl">
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-foreground">
                {heroSettings.hero_title1 || t('title1')}
                <br />
                <span className="text-primary">{heroSettings.hero_title2 || t('title2')}</span>
                {(heroSettings.hero_title3) && (
                  <><br /><span>{heroSettings.hero_title3}</span></>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                {heroSettings.hero_subtitle || t('subtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap gap-4">
                <Link 
                  href="/login?tab=register" 
                  className="inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-3.5 rounded-lg font-bold text-base shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="text-lg">🎓</span>
                  Daftar Sekarang
                </Link>

                <Link 
                  href="/about" 
                  className="inline-flex items-center justify-center gap-2 border-2 border-primary/50 text-foreground px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-primary/10 backdrop-blur-sm transition-all duration-300"
                >
                  <span className="text-lg">▶</span>
                  {t('cta_video') || 'Video Profil'}
                </Link>
              </div>

              {/* Trust indicator */}
              <div className="pt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">
                  <strong className="text-accent">{(statsData.totalEnrollments || 0).toLocaleString('id-ID')}+</strong> ASN telah bergabung dan belajar bersama kami
                </span>
              </div>
            </div>

            {/* Right side - Dynamic Card Layout Based on Order with Professional Animations
                
                UKURAN DIPERBESAR untuk tampilan lebih profesional:
                - Main card: 450x340px (dari 380x285px)
                - Secondary cards: 320x230px (dari 270x190px) 
                - Small card: 170x170px (dari 140x140px)
                
                MAPPING ORDER → POSISI:
                - Order 1 → Main card (card besar center-left)
                - Order 2 → Top-right card (kanan atas)
                - Order 3 → Bottom-right card (kanan bawah)
                - Order 4 → Small bottom-left card (kecil kiri bawah)
                - Order 5 → Back left-top card (belakang kiri atas)
                - Order 6+ → Additional cards stacked on right (tambahan di kanan)
            */}
<div className="hidden lg:block relative h-[700px] xl:h-[750px] w-full select-none">
  {/* Kontainer Utama - DIPERBESAR */}
  <div className="absolute inset-0 flex items-center justify-center">
    {/* Grid Container dengan ukuran lebih besar */}
    <div className="relative w-[680px] h-[580px]">
      {/* Render cards dynamically based on order field */}
      {(() => {
        // Define card positions and styles mapped by ORDER VALUE (not array index)
        const cardPositionsByOrder: Record<number, { 
          className: string; 
          gradient: string; 
          animationDelay: string;
          hoverTransform: string;
        }> = {
          1: {
            // Order 1: MAIN CARD - Largest, center-left with parallax (UKURAN DIPERBESAR)
            className: "absolute z-20 top-[100px] left-0 w-[450px] h-[340px] rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden ring-4 ring-white/10 transition-all duration-700 ease-out animate-float-slow",
            gradient: "from-blue-600 via-blue-500 to-blue-900",
            animationDelay: "0s",
            hoverTransform: "hover:scale-[1.05] hover:-translate-y-3 hover:shadow-[0_35px_80px_rgba(0,0,0,0.45)] hover:ring-primary/30"
          },
          2: {
            // Order 2: Top-right card with upward float (UKURAN DIPERBESAR)
            className: "absolute z-10 top-0 right-0 w-[320px] h-[230px] rounded-[2.5rem] shadow-xl overflow-hidden border border-white/10 transition-all duration-700 ease-out animate-float-gentle",
            gradient: "from-blue-600 to-blue-900",
            animationDelay: "0.5s",
            hoverTransform: "hover:scale-[1.08] hover:-translate-y-4 hover:rotate-2 hover:shadow-2xl hover:border-blue-400/30"
          },
          3: {
            // Order 3: Bottom-right card with bounce (UKURAN DIPERBESAR)
            className: "absolute z-10 bottom-0 right-0 w-[320px] h-[230px] rounded-[2.5rem] shadow-xl overflow-hidden border border-white/10 transition-all duration-700 ease-out animate-float-gentle",
            gradient: "from-red-600 to-rose-900",
            animationDelay: "1s",
            hoverTransform: "hover:scale-[1.08] hover:-translate-y-4 hover:-rotate-2 hover:shadow-2xl hover:border-red-400/30"
          },
          4: {
            // Order 4: Small card bottom-left with spin effect (UKURAN DIPERBESAR)
            className: "absolute z-30 bottom-[-20px] left-[20px] w-[170px] h-[170px] rounded-[2rem] shadow-xl overflow-hidden border-2 border-white/20 transition-all duration-700 ease-out animate-float-slow",
            gradient: "from-emerald-500 to-emerald-800",
            animationDelay: "1.5s",
            hoverTransform: "hover:scale-[1.12] hover:-translate-y-3 hover:rotate-6 hover:shadow-2xl hover:border-emerald-300/40"
          },
          5: {
            // Order 5: Back left-top card subtle movement (UKURAN DIPERBESAR)
            className: "absolute z-10 top-[50px] left-[25px] w-[320px] h-[230px] rounded-[2.5rem] shadow-lg overflow-hidden transition-all duration-700 ease-out animate-float-gentle",
            gradient: "from-amber-400 via-yellow-500 to-amber-600",
            animationDelay: "0.3s",
            hoverTransform: "hover:scale-[1.06] hover:-translate-y-3 hover:shadow-2xl hover:border-amber-300/30"
          },
        };

        // Default position for Order 6+ (UKURAN DIPERBESAR)
        const defaultPosition = {
          className: "absolute z-5 top-[260px] right-[50px] w-[240px] h-[180px] rounded-[2rem] shadow-lg overflow-hidden border border-white/10 transition-all duration-700 ease-out animate-float-gentle opacity-80",
          gradient: "from-purple-600 to-indigo-900",
          animationDelay: "2s",
          hoverTransform: "hover:scale-[1.1] hover:-translate-y-3 hover:opacity-100 hover:shadow-2xl"
        };

        return heroImages.map((img) => {
          // Get position based on ORDER VALUE from database
          const position = cardPositionsByOrder[img.order] || defaultPosition;
          
          return (
            <div 
              key={img.id} 
              className={`${position.className} ${position.hoverTransform} group cursor-pointer`}
              style={{ animationDelay: position.animationDelay }}
            >
              {img.image_url ? (
                <img 
                  src={img.image_url} 
                  alt={img.title || img.name || `Order ${img.order}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${position.gradient} flex items-center justify-center transition-all duration-700 group-hover:opacity-90`}>
                  {img.order === 1 && (
                    <span className="text-white/40 text-lg font-medium group-hover:text-white/60 transition-colors">Pesisir Selatan</span>
                  )}
                </div>
              )}
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          );
        });
      })()}

    </div>
  </div>

  {/* Animated Glow background effects */}
  <div className="absolute top-[20%] right-[15%] w-[250px] h-[220px] bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
  <div className="absolute bottom-[10%] right-[15%] w-[250px] h-[220px] bg-red-600/10 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: "1s" }} />
</div>
          </div>
        </div>
      </div>

      {/* Floating Stats Card - LARGER & Inside Hero Section - DYNAMIC DATA */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-30">
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_70px_-10px_rgba(0,0,0,0.6)] p-8 lg:p-10 animate-slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { 
                icon: '👥', 
                iconBg: 'bg-green-500/10', 
                iconColor: 'text-green-600 dark:text-green-400', 
                value: statsData.totalAsn || 0, 
                suffix: '+', 
                label: 'ASN Terdaftar', 
                sublabel: 'Seluruh pegawai aktif' 
              },
              { 
                icon: '📚', 
                iconBg: 'bg-blue-500/10', 
                iconColor: 'text-blue-600 dark:text-blue-400', 
                value: statsData.totalCourses || 0, 
                suffix: '+', 
                label: 'Kursus Tersedia', 
                sublabel: 'Materi berkualitas' 
              },
              { 
                icon: '🎓', 
                iconBg: 'bg-yellow-500/10', 
                iconColor: 'text-yellow-600 dark:text-yellow-400', 
                value: statsData.totalEnrollments || 0, 
                suffix: '+', 
                label: 'Total Peserta', 
                sublabel: 'Partisipasi belajar' 
              },
              { 
                icon: '📊', 
                iconBg: 'bg-red-500/10', 
                iconColor: 'text-red-600 dark:text-red-400', 
                value: statsData.graduationRate || 0, 
                suffix: '%', 
                label: 'Tingkat Kelulusan', 
                sublabel: 'Hasil belajar optimal' 
              },
            ].map((s, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 group cursor-default"
                style={{ 
                  animationDelay: `${i * 150}ms`,
                  opacity: 0,
                  animation: 'slideUp 0.6s ease-out forwards'
                }}
              >
                {/* Icon dengan background warna dan animasi */}
                <div className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 ${s.iconBg} rounded-2xl flex items-center justify-center text-3xl lg:text-4xl ${s.iconColor} transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-lg group-hover:shadow-xl`}>
                  {s.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Number - Larger size with AnimatedCounter */}
                  <div className={`text-3xl lg:text-5xl font-bold ${s.iconColor} mb-1 tracking-tight transition-all duration-300 group-hover:scale-105`}>
                    <AnimatedCounter value={s.value} suffix={s.suffix} isVisible={true} />
                  </div>
                  {/* Label */}
                  <div className="text-sm lg:text-base font-semibold text-foreground mb-0.5">
                    {s.label}
                  </div>
                  {/* Sublabel */}
                  <div className="text-xs lg:text-sm text-muted-foreground">
                    {s.sublabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────


// ─── PROGRAMS ─────────────────────────────────────────────────────────────────

function ProgramsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const [articles, setArticles] = useState<Article[]>([]);
  const t = useTranslations('programs');

  useEffect(() => {
    getFeaturedArticles(6).then(res => {
      if (res.results?.length > 0) {
        setArticles(res.results);
      } else {
        getPopularArticles(6).then(res2 => setArticles(res2.results || [])).catch(() => {});
      }
    }).catch(() => {
      getPopularArticles(6).then(res2 => setArticles(res2.results || [])).catch(() => {});
    });
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'link': return '🔗';
      default: return '📝';
    }
  };

  return (
    <section ref={ref} className="py-16 relative bg-gradient-to-b from-muted/20 via-background to-muted/20">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-black/30 p-8 md:p-12">
          <div className="text-center mb-12 space-y-3">
            <span className="inline-block bg-primary/10 text-primary px-5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm border border-primary/20">{t('badge')}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
              {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('title_highlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <Link key={article.id} href={`/kms/${article.slug}`}>
              <div className={`group relative bg-white/40 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border border-white/20 dark:border-white/10 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {getIcon(article.content_type)}
                    </div>
                    {article.category && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/20">
                        <span dangerouslySetInnerHTML={{ __html: article.category.name }} />
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    <span dangerouslySetInnerHTML={{ __html: article.title }} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                    {(article.excerpt || article.content).replace(/<[^>]*>/g, '').slice(0, 150)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>👁️ {article.view_count}</span>
                    <span>❤️ {article.like_count}</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/kms" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02]">
            {t('view_all')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}

// ─── FEATURED COURSES ─────────────────────────────────────────────────────────

function CoursesSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const [courses, setCourses] = useState<any[]>([]);
  const t = useTranslations('courses');

  useEffect(() => {
    async function load() {
      let data = await getFeaturedCourses();
      if (data.length > 0) { setCourses(data); return; }
      data = await getPopularCourses();
      if (data.length > 0) { setCourses(data); return; }
      data = await getLatestCourses();
      setCourses(data);
    }
    load();
  }, []);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return level;
    }
  };

  const getDurationText = (minutes: number) => {
    if (minutes < 60) return `${minutes} mnt`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}j ${m}mnt` : `${h} jam`;
  };

  return (
    <section ref={ref} className="py-16 relative bg-gradient-to-b from-muted/20 via-background to-muted/20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-black/30 p-8 md:p-12">
          <div className="text-center mb-12 space-y-3">
            <span className="inline-block bg-primary/10 text-primary px-5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm border border-primary/20">{t('badge')}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
              {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('title_highlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: any, i: number) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <div className={`group bg-white/40 dark:bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/20 dark:border-white/10 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="h-48 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500">
                        📚
                      </div>
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {course.category && (
                      <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                        <span dangerouslySetInnerHTML={{ __html: course.category.name }} />
                      </span>
                    )}
                    <span className="bg-primary/80 backdrop-blur-md text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                      {getLevelBadge(course.level)}
                    </span>
                  </div>
                  {course.duration_minutes > 0 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                      🕐 {getDurationText(course.duration_minutes)}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.short_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>⭐ {course.rating_avg?.toFixed(1) || '0.0'}</span>
                      <span>👥 {course.enrolled_count || 0}</span>
                      <span>📖 {course.lesson_count || 0}</span>
                    </div>
                    <span className="text-primary font-semibold group-hover:translate-x-1 transition-transform">
                      {t('view_detail')} →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/courses" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02]">
            {t('view_all')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}

// ─── WHY CHOOSE US ────────────────────────────────────────────────────────────

function WhyChooseUsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const t = useTranslations('whyus');

  const items = [
    { icon: '🛡️', title: t('terakreditasi'), desc: t('terakreditasi_desc') },
    { icon: '🎓', title: t('pengajar'), desc: t('pengajar_desc') },
    { icon: '⏰', title: t('fleksibel'), desc: t('fleksibel_desc') },
    { icon: '📜', title: t('sertifikat_digital'), desc: t('sertifikat_digital_desc') },
    { icon: '💡', title: t('materi'), desc: t('materi_desc') },
    { icon: '🤝', title: t('dukungan'), desc: t('dukungan_desc') },
  ];

  return (
    <section ref={ref} className="py-16 relative overflow-hidden bg-gradient-to-b from-muted/20 via-background to-muted/20">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 space-y-3">
          <span className="inline-block bg-accent/10 text-accent px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Infinite Carousel */}
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-scroll-left hover:pause-animation">
              {/* First set of items */}
              {items.map((item, i) => (
                <div 
                  key={`first-${i}`}
                  className="flex-shrink-0 w-80 group relative p-8 rounded-3xl bg-card shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border overflow-hidden"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 text-3xl bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Decorative corner accent */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                </div>
              ))}
              
              {/* Duplicate set for infinite loop */}
              {items.map((item, i) => (
                <div 
                  key={`second-${i}`}
                  className="flex-shrink-0 w-80 group relative p-8 rounded-3xl bg-card shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 text-3xl bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        
        .pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const t = useTranslations('testimonials');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${getNewsBaseURL()}/learning/ratings/?ordering=-created_at`)
      .then(r => r.json())
      .then(json => {
        const list = json.results ?? json.data ?? (Array.isArray(json) ? json : []);
        const withReviews = list.filter((r: any) => r.comment && r.rating >= 4);
        setComments(withReviews.length > 0 ? withReviews.slice(0, 4) : []);
      })
      .catch(() => {});
  }, []);

  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || '?';
  
  // Array of vibrant gradient combinations for avatars
  const avatarGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-green-500 to-teal-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
  ];

  return (
    <section ref={ref} className="py-16 relative overflow-hidden bg-gradient-to-b from-muted/20 via-background to-muted/20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-5 py-2 rounded-full text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('badge')}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Clean 2-column grid layout */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {comments.length > 0 ? comments.map((item, i) => {
            const gradientClass = avatarGradients[i % avatarGradients.length];
            
            return (
              <div 
                key={item.id || i} 
                className={`group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-border/50 overflow-hidden flex flex-col h-full
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                `} 
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>
                
                {/* Animated border glow effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(var(--primary-rgb, 59 130 246) / 0.1) 50%, transparent 100%)',
                  }}
                ></div>

                {/* Large decorative quote mark */}
                <div className="absolute -top-2 -right-2 text-[80px] leading-none text-primary/5 font-serif select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-500">&ldquo;</div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Profile section */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-background/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      {getInitial(item.user_name || item.user?.name || item.user?.username || item.user_username || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-card-foreground text-sm mb-0.5 group-hover:text-primary transition-colors duration-300 truncate">
                        {item.user_name || item.user?.name || item.user?.username || item.user_username || 'Pengguna'}
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        <svg className="w-3 h-3 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Peserta
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment text with consistent height */}
                  <p className="text-muted-foreground/90 leading-relaxed mb-4 text-sm flex-grow group-hover:text-foreground/80 transition-colors duration-300">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                  
                  {/* Rating stars with glow effect */}
                  <div className="flex items-center gap-1 mt-auto">
                    {[...Array(5)].map((_, j) => (
                      <svg 
                        key={j} 
                        className={`w-4 h-4 transition-all duration-300 ${
                          j < (item.rating || 5) 
                            ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)] group-hover:scale-110' 
                            : 'text-muted-foreground/20'
                        }`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        style={{ transitionDelay: `${j * 50}ms` }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1.5 text-xs text-muted-foreground font-medium">
                      {item.rating || 5}.0
                    </span>
                  </div>
                </div>

                {/* Verified badge for 5-star reviews */}
                {item.rating === 5 && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-20">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-muted-foreground text-lg">{t('no_testimonials') || 'Belum ada testimonial'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call to action button */}
        {comments.length > 0 && (
          <div className="text-center mt-16">
            <Link 
              href="/courses/testimonials" 
              className="group inline-flex items-center gap-3 text-sm font-semibold text-foreground bg-card hover:bg-accent border-2 border-border hover:border-primary rounded-2xl px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>Lihat Semua Testimonial</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── INSTRUCTORS ──────────────────────────────────────────────────────────────

function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const url = new URL(path);
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}${url.pathname}`;
    }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}${path}`;
  } catch { return null; }
}

function InstructorsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const [instructors, setInstructors] = useState<any[]>([]);
  const t = useTranslations('instructors');

  useEffect(() => {
    async function fetchPersonalia() {
      try {
        const base = typeof window !== 'undefined' ? `${window.location.origin}/apicorpu/public/1.0` : '/apicorpu/public/1.0';
        const res = await fetch(`${base}/profile/personalia/`);
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data ?? json.results ?? (Array.isArray(json) ? json : []);
        if (!Array.isArray(data)) return;
        const active = data
          .filter((p: any) => p.is_active)
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((p: any) => ({ ...p, photo: getImageUrl(p.photo) }));
        setInstructors(active);
      } catch { /* ignore */ }
    }
    fetchPersonalia();
  }, []);

  const fallback = [
    { name: 'Dr. Ahmad Wijaya, M.Pd.', position: 'Spesialis Manajemen Kepemimpinan dan Kebijakan Publik', photo: null, unit_kerja: 'BKPSDM' },
    { name: 'Prof. Siti Nurhaliza, Ph.D.', position: 'Ahli Administrasi Publik dan Reformasi Birokrasi', photo: null, unit_kerja: 'BKPSDM' },
    { name: 'Drs. Budi Santoso, M.Si.', position: 'Praktisi Pelayanan Publik dan Inovasi Pemerintahan', photo: null, unit_kerja: 'BKPSDM' },
    { name: 'Dr. Ir. Dewi Lestari, M.T.', position: 'Spesialis Transformasi Digital dan E-Government', photo: null, unit_kerja: 'BKPSDM' },
  ];

  const list = instructors.length > 0 ? instructors : fallback;

  return (
    <section ref={ref} className="py-16 relative bg-gradient-to-b from-muted/20 via-background to-muted/20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 space-y-3">
          <span className="inline-block bg-primary/10 text-primary px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className={`grid gap-6 ${
          {
            1: 'md:grid-cols-1 max-w-sm',
            2: 'md:grid-cols-2 max-w-2xl',
            3: 'md:grid-cols-3 max-w-4xl',
          }[list.length] || 'md:grid-cols-2 lg:grid-cols-4 max-w-6xl'
        } mx-auto`}>
          {list.map((inst: any, i: number) => (
            <div key={i} className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="relative p-4 m-4 bg-gradient-to-br from-muted to-muted/50 dark:from-muted dark:to-muted/50 rounded-xl overflow-hidden border border-border">
                <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
                <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-accent/40 rounded-tr-xl" />
                <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-destructive/40 rounded-bl-xl" />
                <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-secondary/40 rounded-br-xl" />
                <div className="relative aspect-square rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-primary/10 to-secondary/10">
                  {inst.photo ? (
                    <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : null}
                  <div className={`${inst.photo ? 'hidden' : ''} text-5xl select-none`}>👤</div>
                </div>
              </div>
              <div className="px-5 pb-6 text-center">
                <h3 className="font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors duration-300">{inst.name}</h3>
                {inst.unit_kerja && (
                  <span className="inline-block bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-semibold mb-2">{inst.unit_kerja}</span>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{inst.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── NEWS ──────────────────────────────────────────────────────────────────────

function NewsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const [news, setNews] = useState<any[]>([]);
  const t = useTranslations('news');

  useEffect(() => {
    getLatestNews().then(data => setNews(data)).catch(() => {});
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Pengumuman': return 'from-yellow-500 to-orange-500';
      case 'Event': return 'from-green-500 to-emerald-500';
      case 'Kerjasama': return 'from-blue-500 to-indigo-500';
      case 'Program': return 'from-purple-500 to-pink-500';
      default: return 'from-indigo-500 to-purple-600';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pengumuman': return '📢';
      case 'Event': return '🎉';
      case 'Kerjasama': return '🤝';
      case 'Program': return '🎯';
      default: return '📰';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <section ref={ref} className="py-16 relative bg-gradient-to-b from-muted/20 via-background to-muted/20">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-black/30 p-8 md:p-12">
          <div className="text-center mb-12 space-y-3">
            <span className="inline-block bg-primary/10 text-primary px-5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm border border-primary/20">{t('badge')}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
              {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('title_highlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.length > 0 ? news.map((item: any, i: number) => (
              <Link key={item.id} href={`/berita/${item.slug}`}>
                <div className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: `${i * 150}ms` }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className={`h-48 bg-gradient-to-br ${getCategoryColor(item.category)} relative overflow-hidden`}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:scale-125 transition-transform duration-500">
                        📰
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30" dangerouslySetInnerHTML={{ __html: item.category }}>
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 text-white/70 text-xs">
                      {formatDate(item.published_at || item.created_at)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      <span dangerouslySetInnerHTML={{ __html: item.title }} />
                    </h3>
                    {item.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: item.excerpt }}>
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        {t('read_more')} →
                      </span>
                      {item.views > 0 && (
                        <span className="text-muted-foreground text-xs">👁️ {item.views}</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              </Link>
            )) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                {t('no_news') || 'Belum ada berita'}
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/berita" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02]">
              {t('view_all')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  const t = useTranslations('cta');
  const tnav = useTranslations('nav');

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-muted/40 dark:from-card/40 dark:via-background dark:to-card/40" />
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-blue-600/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="relative bg-card/80 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.35)] p-10 md:p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-5 py-2 text-sm text-primary mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t('badge')}
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t('title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                {t('title_highlight')}
              </span>
              {' '}{t('title_end')}
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02]">
                {t('cta_register')}
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-secondary/80 hover:scale-[1.02]">
                {t('cta_courses')}
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-12 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('trust_free')}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('trust_certificate')}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('trust_access')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const t = useTranslations('footer');
  const tnav = useTranslations('nav');
  useEffect(() => { getPublicSettings().then(setSettings).catch(() => {}); }, []);

  const appName = settings.app_name || 'Pesisir Selatan Corporate University';
  const appDesc = settings.app_description || 'Platform pembelajaran digital untuk pengembangan kompetensi Aparatur Sipil Negara';
  const contactEmail = settings.contact_email || 'info@corpu.go.id';
  const contactPhone = settings.contact_phone || '(0756) 1234-5678';
  const contactAddress = settings.contact_address || 'Painan, Sumatera Barat';

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                {appName.charAt(0)}
              </div>
              <span className="text-card-foreground font-bold text-lg">{appName}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{appDesc}</p>
          </div>

          <div>
            <h3 className="text-card-foreground font-semibold mb-4">{t('menu')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[{ label: tnav('beranda'), href: '/' }, { label: tnav('kursus'), href: '/courses' }, { label: tnav('berita'), href: '/berita' }, { label: tnav('kms'), href: '/kms' }].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-card-foreground font-semibold mb-4">{t('bantuan')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[{ label: t('faq'), href: '/faq' }, { label: t('panduan'), href: '/panduan' }, { label: t('kontak'), href: '/kontak' }, { label: t('syarat'), href: '/syarat-ketentuan' }].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-card-foreground font-semibold mb-4">{t('kontak')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📞</span>
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <span>{contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">&copy; {new Date().getFullYear()} {appName}. {t('copyright')}</p>
          <div className="flex gap-4">
            {[{ key: 'social_facebook', label: 'FB' }, { key: 'social_instagram', label: 'IG' }, { key: 'social_youtube', label: 'YT' }].map(social => {
              const url = settings[social.key];
              if (!url) return null;
              return (
                <a key={social.key} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 border border-border hover:border-primary/30">
                  {social.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── BACK TO TOP ──────────────────────────────────────────────────────────────

function BackToTopButton({ scrollY }: { scrollY: number }) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  if (scrollY < 300) return null;
  return (
    <button onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-110 transition-all duration-300 flex items-center justify-center">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────

export default function LandingModern() {
  const scrollY = useScrollPosition();

  return (
    <div className="min-h-screen">
      <LandingNavbar scrollY={scrollY} />
      <HeroSection />
      <CoursesSection />
      <ProgramsSection />
      <InstructorsSection />
      <TestimonialsSection />
      <NewsSection />
      <WhyChooseUsSection />
      <CTASection />
      <LandingFooter />
      <BackToTopButton scrollY={scrollY} />
    </div>
  );
}
