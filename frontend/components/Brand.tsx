'use client';

import { useState, useEffect } from 'react';

interface BrandData {
  logo: string;
  logo_small: string;
  app_name: string;
  app_description: string;
  [key: string]: string;
}

export default function Brand() {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/apicorpu/public/1.0/settings/`
      : '/apicorpu/public/1.0/settings/';

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setBrand(json.data as BrandData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !brand) return null;

  const logoUrl = brand.logo;
  const isBase64 = logoUrl?.startsWith('data:');
  const isFilePath = logoUrl && !isBase64;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {logoUrl ? (
            <div className="mb-6">
              {isBase64 || isFilePath ? (
                <img
                  src={logoUrl}
                  alt={brand.app_name || 'Brand'}
                  className="max-h-24 w-auto"
                />
              ) : null}
            </div>
          ) : null}

          {brand.app_name && (
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {brand.app_name}
            </h2>
          )}

          {brand.app_description && (
            <p className="text-gray-600 max-w-2xl">
              {brand.app_description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
