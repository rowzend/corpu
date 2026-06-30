'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import idMessages from '../messages/id.json';
import enMessages from '../messages/en.json';
import arMessages from '../messages/ar.json';

const messagesMap: Record<string, Record<string, unknown>> = {
  id: idMessages as unknown as Record<string, unknown>,
  en: enMessages as unknown as Record<string, unknown>,
  ar: arMessages as unknown as Record<string, unknown>,
};

export default function I18nProvider({ children, serverLocale }: { children: ReactNode; serverLocale: string }) {
  const [locale, setLocale] = useState(serverLocale);

  const currentMessages = messagesMap[locale] || messagesMap.id;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;

    const onLocaleChange = () => {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      const newLoc = match && ['id', 'en', 'ar'].includes(match[1]) ? match[1] : 'id';
      if (newLoc !== locale) {
        setLocale(newLoc);
        document.documentElement.lang = newLoc;
        document.documentElement.dir = newLoc === 'ar' ? 'rtl' : 'ltr';
      }
    };

    window.addEventListener('localechange', onLocaleChange);
    return () => window.removeEventListener('localechange', onLocaleChange);
  }, [locale, dir]);

  return (
    <NextIntlClientProvider locale={locale} messages={currentMessages} timeZone="Asia/Jakarta">
      {children}
    </NextIntlClientProvider>
  );
}
