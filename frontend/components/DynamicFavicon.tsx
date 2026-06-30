'use client';

import { useEffect } from 'react';
import { getPublicSettings } from '@/lib/api/profilePublic';

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

      // Handle error loading (add onerror handler)
      link.onerror = () => {
        // If favicon fails to load, remove it
        link?.remove();
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
