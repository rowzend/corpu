'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { authService } from '@/lib/services';
import { LogOut, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const profileSubMenus = [
  { label: 'Sambutan & Visi Misi', href: '/profil/sambutan-visi-misi' },
  { label: 'Sejarah Corpu', href: '/profil/sejarah' },
  { label: 'Struktur Organisasi', href: '/profil/struktur' },
  { label: 'Personalia', href: '/profil/personalia' },
];

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

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

  const appName = settings.app_name || 'ASN Academy';
  const logo = settings.logo || '';

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  const menuItems: { label: string; href?: string; subMenus?: { label: string; href: string }[] }[] = [
    { label: 'Beranda', href: '/' },
    { label: 'Profile', subMenus: profileSubMenus },
    { label: 'HCDP', href: '/hcdp' },
    { label: 'Berita', href: '/berita' },
    { label: 'Kursus', href: '/courses' },
    { label: 'KMS', href: '/kms' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {logo ? (
              <img src={logo} alt={appName} className="h-10 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">{appName.charAt(0)}</span>
              </div>
            )}
            <span className="text-xl font-bold text-gray-800">{appName}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) =>
              item.subMenus ? (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(item.label === 'Profile' ? !isProfileDropdownOpen : false);
                    }}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1"
                  >
                    {item.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {item.label === 'Profile' && isProfileDropdownOpen && (
                    <div ref={profileDropdownRef} className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      {item.subMenus.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Auth section */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{userName || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) =>
                item.subMenus ? (
                  <div key={item.label} className="space-y-2">
                    <span className="text-gray-700 font-medium block">{item.label}</span>
                    <div className="pl-4 flex flex-col space-y-2">
                      {item.subMenus.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="text-gray-600 hover:text-blue-600 transition-colors"
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
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {isLoggedIn ? (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700 font-medium px-1">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
                    className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2 px-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/login');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-center transition-colors duration-200 w-full cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
