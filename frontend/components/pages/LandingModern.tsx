'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { getHeroImages, type HeroImageItem } from '@/lib/api/hero';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import { useTranslations } from 'next-intl';

function getPublicBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return '/apicorpu/public/1.0';
}

async function getLatestNews() {
  try {
    const res = await fetch(`${getPublicBaseURL()}/news/`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results ?? json.data ?? (Array.isArray(json) ? json : []);
  } catch { return []; }
}

async function getCourses() {
  try {
    const res = await fetch(`${getPublicBaseURL()}/learning/courses/`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results ?? json.data ?? (Array.isArray(json) ? json : []);
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
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isVisible && !done) {
      setDone(true);
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
  }, [isVisible, value, done]);

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
    return `font-medium transition-all duration-300 hover:scale-105 ${base} text-foreground hover:text-blue-600`;
  }

  function mobileLinkClass() {
    return `font-medium text-foreground`;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md border-b border-border'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/landing" className="flex items-center gap-3 group">
            {logo ? (
              <img src={logo} alt={appName} className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">{appName.charAt(0)}</span>
              </div>
            )}
            <span className={`font-bold text-xl transition-colors duration-500 text-blue-700`}>
              {appName}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link href="/landing" className={linkClass()}>{t('beranda')}</Link>

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
                      className={`block px-4 py-2.5 text-sm transition-colors text-foreground hover:bg-blue-50 hover:text-blue-600`}
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
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40`}
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
              <Link href="/landing" className={mobileLinkClass()} onClick={() => setMobileOpen(false)}>{t('beranda')}</Link>
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
                <Link href="/login" className={`flex-1 text-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white`}>{t('login')}</Link>
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
  const t = useTranslations('hero');
  const tl = useTranslations('landing');

  useEffect(() => {
    getHeroImages().then(setHeroImages);
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

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background menggunakan ThemeProvider - tidak perlu hardcode lagi */}
      
      {/* Decorative plus signs / stars */}
      {[
        { top: '15%', left: '8%', size: 16, rotate: 0, delay: 0 },
        { top: '25%', right: '12%', size: 20, rotate: 45, delay: 1 },
        { top: '65%', left: '15%', size: 14, rotate: 0, delay: 2 },
        { top: '75%', right: '18%', size: 18, rotate: 45, delay: 1.5 },
        { top: '45%', left: '5%', size: 12, rotate: 0, delay: 3 },
        { top: '35%', right: '8%', size: 16, rotate: 45, delay: 2.5 },
      ].map((star, i) => (
        <div 
          key={i} 
          className="absolute text-blue-600 dark:text-blue-300 opacity-30 dark:opacity-20 animate-float"
          style={{
            top: star.top,
            left: star.left,
            right: star.right,
            fontSize: `${star.size}px`,
            transform: `rotate(${star.rotate}deg)`,
            animationDelay: `${star.delay}s`,
            animationDuration: '6s',
          }}
        >
          ✦
        </div>
      ))}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-6 lg:pr-8">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-full px-4 py-1.5 text-sm text-green-700 dark:text-green-300 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {t('badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-card-foreground">
              {t('title1')}
              <br />
              <span className="text-blue-700 dark:text-blue-400">{t('title2')}</span>
            </h1>

            <p className="text-base sm:text-lg text-red-600 font-medium leading-relaxed">
              {t('subtitle')}
            </p>

            <p className="text-muted-foreground leading-relaxed max-w-xl">
              {tl('trust_courses')} {tl('trust_asn')}
            </p>

            <div className="pt-4">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg font-semibold text-base shadow-lg shadow-red-600/25 hover:shadow-red-600/40 transition-all duration-300 hover:scale-[1.02] uppercase tracking-wide"
              >
                {t('cta_start')}
              </Link>
            </div>
          </div>

          {/* Right side - Floating Cards Collage like TGU style */}
          <div className="hidden lg:block relative h-[600px]">
            <div className="relative w-full h-full">
              {/* Decorative background blocks (always visible) */}
              <div className="absolute top-0 right-0 w-[280px] h-[200px] bg-blue-700/40 rounded-[40px] shadow-2xl animate-float" style={{ zIndex: 1, animationDelay: '0s' }} />
              <div className="absolute top-[22%] left-[5%] w-[320px] h-[240px] bg-gradient-to-br from-red-500/40 to-orange-500/40 rounded-[35px] shadow-2xl border-4 border-white/20 animate-float" style={{ zIndex: 1, transform: 'rotate(-2deg)', animationDelay: '1s' }} />
              <div className="absolute bottom-[5%] right-[8%] w-[300px] h-[260px] bg-gray-300/40 dark:bg-gray-600/20 rounded-[35px] shadow-2xl animate-float" style={{ zIndex: 1, transform: 'rotate(1deg)', animationDelay: '2s' }} />
              <div className="absolute bottom-[10%] left-0 w-[160px] h-[180px] bg-gradient-to-br from-green-400/40 to-emerald-500/40 rounded-[30px] shadow-xl animate-float" style={{ zIndex: 1, transform: 'rotate(-3deg)', animationDelay: '2.5s' }} />
              <div className="absolute top-[8%] left-[15%] w-[140px] h-[100px] bg-blue-100/40 dark:bg-blue-900/40 rounded-[25px] shadow-lg animate-float" style={{ zIndex: 1, transform: 'rotate(8deg)', animationDelay: '1.5s' }} />

              {/* Floating image cards (foreground) */}
              {heroImages.length > 0 && (
                <>
                  {/* Large card - Top Right (Blue rounded) */}
                  <div 
                    className="absolute animate-float"
                    style={{
                      top: '0%',
                      right: '0%',
                      width: '280px',
                      height: '200px',
                      zIndex: 3,
                      animationDelay: '0s',
                      animationDuration: '6s',
                    }}
                  >
                    <div className="w-full h-full bg-blue-700 rounded-[40px] overflow-hidden shadow-2xl">
                      {heroImages[0] && (
                        <img 
                          src={heroImages[0].image_url} 
                          alt=""
                          className="w-full h-full object-cover opacity-80 mix-blend-overlay"
                        />
                      )}
                    </div>
                  </div>

                  {/* Medium card - Middle Left (Red/Orange with image) */}
                  <div 
                    className="absolute animate-float"
                    style={{
                      top: '22%',
                      left: '5%',
                      width: '320px',
                      height: '240px',
                      zIndex: 5,
                      transform: 'rotate(-2deg)',
                      animationDelay: '1s',
                      animationDuration: '7s',
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-[35px] overflow-hidden shadow-2xl border-4 border-white">
                      {heroImages[1] && (
                        <img 
                          src={heroImages[1].image_url} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Large card - Bottom Right (Grayscale photo) */}
                  <div 
                    className="absolute animate-float"
                    style={{
                      bottom: '5%',
                      right: '8%',
                      width: '300px',
                      height: '260px',
                      zIndex: 4,
                      transform: 'rotate(1deg)',
                      animationDelay: '2s',
                      animationDuration: '8s',
                    }}
                  >
                    <div className="w-full h-full bg-muted rounded-[35px] overflow-hidden shadow-2xl">
                      {heroImages[2] && (
                        <img 
                          src={heroImages[2].image_url} 
                          alt=""
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                      )}
                    </div>
                  </div>

                  {/* Small green accent card - Bottom Left */}
                  {heroImages[3] && (
                    <div 
                      className="absolute animate-float"
                      style={{
                        bottom: '10%',
                        left: '0%',
                        width: '160px',
                        height: '180px',
                        zIndex: 2,
                        transform: 'rotate(-3deg)',
                        animationDelay: '2.5s',
                        animationDuration: '7.5s',
                      }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-[30px] overflow-hidden shadow-xl">
                        <img 
                          src={heroImages[3].image_url} 
                          alt=""
                          className="w-full h-full object-cover opacity-70 mix-blend-overlay"
                        />
                      </div>
                    </div>
                  )}

                  {/* Decorative empty card - Top Left (Light) */}
                  <div 
                    className="absolute animate-float"
                    style={{
                      top: '8%',
                      left: '15%',
                      width: '140px',
                      height: '100px',
                      zIndex: 2,
                      transform: 'rotate(8deg)',
                      animationDelay: '1.5s',
                      animationDuration: '9s',
                    }}
                  >
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/40 rounded-[25px] shadow-lg" />
                  </div>
                </>
              )}

              {/* Decorative line illustration (mosque/landmark outline) */}
              <div className="absolute bottom-0 left-[10%] w-[200px] h-[80px] opacity-10">
                <svg viewBox="0 0 200 80" className="w-full h-full text-muted-foreground">
                  <path d="M20,70 L20,40 L35,25 L50,40 L50,70 M80,70 L80,35 Q95,15 110,35 L110,70 M140,70 L140,30 L155,15 L170,30 L170,70" 
                    stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24">
        <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 Q300,80 600,50 T1200,50 L1200,100 L0,100 Z" fill="white" opacity="0.1"/>
        </svg>
      </div>
    </section>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const t = useTranslations('stats');

  const stats = [
    { icon: '👥', value: 10000, suffix: '+', label: t('asn') },
    { icon: '📚', value: 150, suffix: '+', label: t('courses') },
    { icon: '🎓', value: 5000, suffix: '+', label: t('certificates') },
    { icon: '⭐', value: 4.8, suffix: '/5', label: t('rating'), decimals: 1 },
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className={`text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-700 hover:bg-white/20 hover:scale-105 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-4xl font-bold text-white mb-1">
                <AnimatedCounter value={s.value} suffix={s.suffix} decimals={s.decimals} isVisible={isVisible} />
              </div>
              <div className="text-blue-100 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────

function ProgramsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const t = useTranslations('programs');

  const programs = [
    { icon: '🎯', title: t('mandiri'), desc: t('mandiri_desc'), color: 'from-blue-400 to-blue-600', bgGlow: 'bg-blue-500/10' },
    { icon: '💻', title: t('terprogram'), desc: t('terprogram_desc'), color: 'from-green-400 to-emerald-500', bgGlow: 'bg-green-500/10' },
    { icon: '📚', title: t('sharing'), desc: t('sharing_desc'), color: 'from-yellow-400 to-orange-500', bgGlow: 'bg-yellow-500/10' },
    { icon: '🎥', title: t('webinar'), desc: t('webinar_desc'), color: 'from-red-400 to-red-500', bgGlow: 'bg-red-500/10' },
    { icon: '📖', title: t('mooc'), desc: t('mooc_desc'), color: 'from-purple-400 to-purple-600', bgGlow: 'bg-purple-500/10' },
    { icon: '🏆', title: t('sertifikasi'), desc: t('sertifikasi_desc'), color: 'from-pink-400 to-pink-500', bgGlow: 'bg-pink-500/10' },
  ];

  return (
    <section ref={ref} className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-blue-100 text-blue-600 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((p, i) => (
            <div key={i} className={`group relative bg-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={`absolute inset-0 ${p.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-br ${p.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-blue-600 transition-colors duration-300">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
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
  const tnav = useTranslations('nav');

  useEffect(() => {
    getCourses().then(data => setCourses(data.slice(0, 6))).catch(() => {});
  }, []);

  const fallback = [
    { title: 'Manajemen Kepemimpinan ASN', category: 'Kepemimpinan', students: 1234, image: '🎯' },
    { title: 'Transformasi Digital Pemerintahan', category: 'Digital', students: 987, image: '💻' },
    { title: 'Pelayanan Publik Prima', category: 'Pelayanan', students: 756, image: '⭐' },
    { title: 'Administrasi Perkantoran Modern', category: 'Administrasi', students: 654, image: '📋' },
    { title: 'Pengelolaan Keuangan Negara', category: 'Keuangan', students: 543, image: '💰' },
    { title: 'Analisis Kebijakan Publik', category: 'Kebijakan', students: 432, image: '📊' },
  ];

  const display = courses.length > 0 ? courses : fallback;

  return (
    <section ref={ref} className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {display.map((course: any, i: number) => (
            <div key={i} className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="h-48 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500">
                  {course.image || '📚'}
                </div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                    {course.category || course.learning_category_name || 'Umum'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-card-foreground mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {course.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>{(course.total_enrollments || course.students || 0).toLocaleString()} {t('participants')}</span>
                  </div>
                  <Link href={`/courses`} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    {t('view_detail')} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/courses" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02]">
            {t('view_all')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
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
    <section ref={ref} className="py-24 bg-transparent relative overflow-hidden">
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className={`flex gap-4 p-6 rounded-2xl bg-card shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-blue-500/20">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-card-foreground mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null);
  const isVisible = useIntersection(ref);
  const t = useTranslations('testimonials');

  const testimonials = [
    { name: 'Dr. Andi Pratama, M.Si', role: 'Kepala Dinas Pendidikan', text: 'Corpu telah membantu ribuan ASN di lingkungan kami untuk meningkatkan kompetensi secara mandiri. Platform yang sangat bermanfaat!', rating: 5, initial: 'A' },
    { name: 'Ir. Siti Rahmawati, M.T', role: 'Analis Kebijakan Ahli Madya', text: 'Materi pembelajaran yang disajikan sangat relevan dengan kebutuhan kami. Sertifikat yang diakui resmi menjadi nilai tambah.', rating: 5, initial: 'S' },
    { name: 'Drs. Budi Hartono, M.M', role: 'Kepala Bagian Organisasi', text: 'Fleksibilitas waktu belajar sangat membantu kami yang memiliki kesibukan tinggi. Sangat direkomendasikan!', rating: 5, initial: 'B' },
    { name: 'Dra. Dewi Lestari, M.Pd', role: 'Widyaiswara Ahli Utama', text: 'Sebagai pengajar, saya melihat antusiasme peserta yang sangat tinggi. Platform ini memudahkan proses belajar mengajar.', rating: 5, initial: 'D' },
  ];

  return (
    <section ref={ref} className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-purple-100 text-purple-600 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className={`group bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  {t.initial}
                </div>
                <div>
                  <div className="font-bold text-card-foreground">{t.name}</div>
                  <div className="text-muted-foreground text-sm">{t.role}</div>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    <section ref={ref} className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-green-100 text-green-600 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
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
              <div className="relative p-4 m-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 rounded-xl overflow-hidden border border-border">
                <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-blue-400 rounded-tl-xl" />
                <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-green-400 rounded-tr-xl" />
                <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-red-400 rounded-bl-xl" />
                <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-purple-400 rounded-br-xl" />
                <div className="relative aspect-square rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50">
                  {inst.photo ? (
                    <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : null}
                  <div className={`${inst.photo ? 'hidden' : ''} text-5xl select-none`}>👤</div>
                </div>
              </div>
              <div className="px-5 pb-6 text-center">
                <h3 className="font-bold text-card-foreground mb-1 group-hover:text-blue-600 transition-colors duration-300">{inst.name}</h3>
                {inst.unit_kerja && (
                  <span className="inline-block bg-blue-100 text-blue-600 px-3 py-0.5 rounded-full text-xs font-semibold mb-2">{inst.unit_kerja}</span>
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
    getLatestNews().then(data => setNews(data.slice(0, 3))).catch(() => {});
  }, []);

  const fallbackNews = [
    { title: 'Peluncuran Program Sertifikasi ASN Tahun 2025', category: 'Pengumuman', date: '15 Jun 2025', image: '📢' },
    { title: 'Webinar Transformasi Digital untuk Pelayanan Publik', category: 'Webinar', date: '12 Jun 2025', image: '💻' },
    { title: 'Pendaftaran MOOC Pengembangan Kompetensi Dibuka', category: 'Pendaftaran', date: '10 Jun 2025', image: '📚' },
  ];

  const display = news.length > 0 ? news : fallbackNews;

  return (
    <section ref={ref} className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block bg-orange-100 text-orange-600 px-5 py-1.5 rounded-full text-sm font-semibold">{t('badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {display.map((item: any, i: number) => (
            <div key={i} className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="h-48 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 relative flex items-center justify-center overflow-hidden">
                <div className="text-6xl opacity-20 group-hover:scale-125 transition-transform duration-500">{item.image || '📰'}</div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                    {item.category || t('badge')}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 text-white/70 text-xs">{item.date || item.created_at || ''}</div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-card-foreground mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {item.title}
                </h3>
                <Link href={item.slug ? `/berita/${item.slug}` : '/berita'} className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('read_more')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/berita" className="inline-flex items-center gap-2 bg-gray-900 dark:bg-card text-white px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:bg-gray-800 dark:hover:bg-muted hover:shadow-xl hover:scale-[1.02]">
            {t('view_all')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
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
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-sm text-white/90 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {t('badge')}
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
              {t('title_highlight')}
            </span>
            {' '}{t('title_end')}
          </h2>

          <p className="text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02]">
              {t('cta_register')}
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]">
              {t('cta_courses')}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12 text-blue-200 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('trust_free')}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('trust_certificate')}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('trust_access')}
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
    <footer className="bg-slate-900 text-muted-foreground border-t border-white/5">
      <div className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                {appName.charAt(0)}
              </div>
              <span className="text-white font-bold text-lg">{appName}</span>
            </div>
            <p className="text-sm leading-relaxed">{appDesc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('menu')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[{ label: tnav('beranda'), href: '/landing' }, { label: tnav('kursus'), href: '/courses' }, { label: tnav('berita'), href: '/berita' }, { label: tnav('kms'), href: '/kms' }].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-blue-400 transition-colors duration-200">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('bantuan')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[{ label: t('faq'), href: '/faq' }, { label: t('panduan'), href: '/panduan' }, { label: t('kontak'), href: '/kontak' }, { label: t('syarat'), href: '/syarat-ketentuan' }].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-blue-400 transition-colors duration-200">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('kontak')}</h3>
            <ul className="space-y-3 text-sm">
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

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} {appName}. {t('copyright')}</p>
          <div className="flex gap-4">
            {[{ key: 'social_facebook', label: 'FB' }, { key: 'social_instagram', label: 'IG' }, { key: 'social_youtube', label: 'YT' }].map(social => {
              const url = settings[social.key];
              if (!url) return null;
              return (
                <a key={social.key} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-blue-500/20 rounded-xl flex items-center justify-center text-sm font-medium hover:text-blue-400 transition-all duration-300 border border-white/5 hover:border-blue-500/30">
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
      className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center">
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
      <StatsSection />
      <ProgramsSection />
      <CoursesSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <InstructorsSection />
      <NewsSection />
      <CTASection />
      <LandingFooter />
      <BackToTopButton scrollY={scrollY} />
    </div>
  );
}
