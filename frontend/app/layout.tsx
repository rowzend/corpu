import type { Metadata } from 'next';
import './globals.css';
import DynamicFavicon from '@/components/DynamicFavicon';
import I18nProvider from '@/components/I18nProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_BASE = typeof window === 'undefined'
  ? 'http://asncorpu-nginx/apicorpu/public/1.0'
  : `${window.location.origin}/apicorpu/public/1.0`;

async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/settings/`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
  } catch {}
  return {};
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const favicon = settings.favicon || '/favicon.png';
  const logo = settings.logo || '';
  const appName = settings.app_name || 'ASN Academy';
  const appDesc = settings.app_description || 'Platform pembelajaran digital untuk pengembangan kompetensi Aparatur Sipil Negara';

  return {
    title: appName,
    description: appDesc,
    icons: {
      icon: favicon,
      apple: logo || favicon,
    },
    openGraph: {
      title: appName,
      description: appDesc,
      images: logo ? [{ url: logo }] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const serverLocale = cookieStore.get('NEXT_LOCALE')?.value || 'id';

  return (
    <html lang={serverLocale} dir={serverLocale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'auto') {
                    localStorage.setItem('theme', 'system');
                    theme = 'system';
                  }
                  
                  var isDark = false;
                  if (theme === 'dark') {
                    isDark = true;
                  } else if (theme === 'system' || !theme) {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <I18nProvider serverLocale={serverLocale}>
            <DynamicFavicon />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
