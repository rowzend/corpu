'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getPublicSettings } from '@/lib/api/profilePublic';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const t = useTranslations('footer');
  const tnav = useTranslations('nav');

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => {});
  }, []);

  const appName = settings.app_name || 'ASN Academy';
  const appDesc = settings.app_description || 'Platform pembelajaran digital untuk pengembangan kompetensi Aparatur Sipil Negara';
  const logo = settings.logo || '';
  const contactEmail = settings.contact_email || 'info@asnacademy.go.id';
  const contactPhone = settings.contact_phone || '(021) 1234-5678';
  const contactAddress = settings.contact_address || 'Jakarta, Indonesia';

  const socialLinks: { key: string; label: string }[] = [
    { key: 'social_facebook', label: 'FB' },
    { key: 'social_instagram', label: 'IG' },
    { key: 'social_youtube', label: 'YT' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={appName} className="h-10 w-auto" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-bold text-lg">{appName.charAt(0)}</span>
                </div>
              )}
              <span className="text-card-foreground font-bold text-lg">{appName}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{appDesc}</p>
          </div>

          {/* Menu */}
          <div>
            <h3 className="text-card-foreground font-semibold mb-4">{t('menu')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: tnav('beranda'), href: '/' },
                { label: tnav('kursus'), href: '/courses' },
                { label: tnav('berita'), href: '/berita' },
                { label: tnav('kms'), href: '/kms' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h3 className="text-card-foreground font-semibold mb-4">{t('bantuan')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: t('faq'), href: '/faq' },
                { label: t('panduan'), href: '/panduan' },
                { label: t('kontak'), href: '/kontak' },
                { label: t('syarat'), href: '/syarat-ketentuan' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
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
            {socialLinks.map(({ key, label }) => {
              const url = settings[key];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 border border-border hover:border-primary/30"
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
