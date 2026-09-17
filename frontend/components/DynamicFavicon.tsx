'use client';

import { useEffect } from 'react';
import { getPublicSettings } from '@/lib/api/profilePublic';

const DEFAULT_FAVICON = '/favicon.png';

export default function DynamicFavicon() {
  useEffect(() => {
    getPublicSettings().then(settings => {
      const favicon = settings.favicon;
      if (!favicon) return;

      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      const isPng = favicon.startsWith('data:image/png');
      link.href = favicon;
      if (isPng) {
        link.type = 'image/png';
        link.sizes = '';
      }

      // Handle apple touch icon
      let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (!appleLink && settings.logo && !settings.logo.includes('image.png')) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      if (appleLink && settings.logo && !settings.logo.includes('image.png')) {
        appleLink.href = settings.logo;
      }

      // Handle error loading (fallback to default favicon)
      link.onerror = () => {
        link.href = DEFAULT_FAVICON;
        link.type = 'image/png';
      };
      if (appleLink) {
        appleLink.onerror = () => {
          appleLink?.remove();
        };
      }
    }).catch(() => {
      // Silently fail
    });
  }, []);

  return null;
}
