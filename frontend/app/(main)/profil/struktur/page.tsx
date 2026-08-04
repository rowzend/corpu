'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getProfileSections, photoUrl, type ProfileSection } from '@/lib/api/profilePublic';
import { useTranslations } from 'next-intl';

export default function StrukturPage() {
  const t = useTranslations('profile'); const tc = useTranslations('common');
  const [section, setSection] = useState<ProfileSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileSections()
      .then(data => setSection(data.find(s => s.key === 'struktur_organisasi') || null))
      .catch(() => setSection(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center py-12">{tc('loading')}</div>;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-card-foreground mb-8">{t('struktur')}</h1>

      {section ? (
        <Card>
          <CardContent className="p-6">
            {section.image && (
              <div className="mb-6">
                <img
                  src={photoUrl(section.image)}
                  alt={t('struktur')}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
            <div
              className="text-foreground leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">{tc('no_data')}</p>
      )}
    </main>
  );
}
