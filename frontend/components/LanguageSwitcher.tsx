'use client';

import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;
    setOpen(false);
    window.dispatchEvent(new Event('localechange'));
  };

  const current = locales.find(l => l.code === locale) || locales[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-muted"
        title="Ganti Bahasa"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-44 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
          {locales.map(l => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors cursor-pointer ${
                locale === l.code
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
