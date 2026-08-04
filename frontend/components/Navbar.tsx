'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { authService } from '@/lib/services';
import { LogOut, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import { useTranslations } from 'next-intl';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => {});
    setIsLoggedIn(authService.isAuthenticated());
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user) setUserName(user.name || user.username);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = useTranslations('nav');
  const appName = settings.app_name || 'ASN Academy';
  const logo = settings.logo || '';
  const isScrolled = scrollY > 60;

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  const menuItems: { label: string; href?: string; subMenus?: { label: string; href: string }[] }[] = [
    { label: t('beranda'), href: '/' },
    { label: t('profile'), subMenus: [
      { label: t('profile_sambutan'), href: '/profil/sambutan-visi-misi' },
      { label: t('profile_sejarah'), href: '/profil/sejarah' },
      { label: t('profile_struktur'), href: '/profil/struktur' },
      { label: t('profile_personalia'), href: '/profil/personalia' },
    ]},
    { label: t('hcdp'), href: '/hcdp' },
    { label: t('berita'), href: '/berita' },
    { label: t('kursus'), href: '/courses' },
    { label: t('kms'), href: '/kms' },
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
            <span className="font-bold text-xl text-foreground">{appName}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) =>
              item.subMenus ? (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`${linkClass()} flex items-center gap-1 cursor-pointer`}
                  >
                    {item.label}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border py-2 backdrop-blur-xl bg-card border-border">
                      {item.subMenus.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-4 py-2.5 text-sm transition-colors text-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.href} href={item.href!} className={linkClass()}>
                  {item.label}
                </Link>
              )
            )}

            <LanguageSwitcher />
            <ThemeToggleCompact />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span className="max-w-[120px] truncate">{userName || 'User'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border py-2 backdrop-blur-xl">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors text-foreground hover:bg-muted cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) =>
                item.subMenus ? (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{item.label}</span>
                    <div className="pl-3 flex flex-col gap-2">
                      {item.subMenus.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`text-sm ${mobileLinkClass()}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={mobileLinkClass()}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {isLoggedIn ? (
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium px-1">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span>{userName || 'User'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 px-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <LanguageSwitcher />
                  <ThemeToggleCompact />
                  <Link
                    href="/login"
                    className="flex-1 text-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
