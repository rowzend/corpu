import type { Metadata } from 'next';
import './globals.css';
import DynamicFavicon from '@/components/DynamicFavicon';

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
  const favicon = settings.favicon || '/favicon.ico';
  const logo = settings.logo || '';
  const appName = settings.app_name || 'ASN Academy';
  const appDesc = settings.app_description || 'Platform pembelajaran digital untuk pengembangan kompetensi Aparatur Sipil Negara';

  return {
    title: appName,
    description: appDesc,
    icons: {
      apple: logo || favicon,
    },
    openGraph: {
      title: appName,
      description: appDesc,
      images: logo ? [{ url: logo }] : [],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased" suppressHydrationWarning>
        <DynamicFavicon />
        {children}
      </body>
    </html>
  );
}
