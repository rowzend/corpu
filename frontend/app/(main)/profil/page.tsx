'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { getProfileSections, getPersonalia, photoUrl, type ProfileSection, type PersonaliaItem } from '@/lib/api/profilePublic';

const sectionIcons: Record<string, string> = {
  sambutan: '👋',
  visi_misi: '🎯',
  sejarah: '📜',
  struktur_organisasi: '🏛️',
};

const sectionLinks: Record<string, string> = {
  sambutan: '/profil/sambutan-visi-misi',
  visi_misi: '/profil/sambutan-visi-misi',
  sejarah: '/profil/sejarah',
  struktur_organisasi: '/profil/struktur',
};

const sectionLabelMap: Record<string, string> = {
  sambutan: 'sambutan',
  visi_misi: 'sambutan',
  sejarah: 'sejarah',
  struktur_organisasi: 'struktur',
};

export default function PublicProfilPage() {
  const t = useTranslations('profile');
  const tnav = useTranslations('nav');
  const tc = useTranslations('common');
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [personalia, setPersonalia] = useState<PersonaliaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfileSections(),
      getPersonalia()
    ])
      .then(([sections, personalia]) => {
        setSections(sections);
        setPersonalia(personalia);
      })
      .catch(() => {
        setSections([]);
        setPersonalia([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">{tc('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
        <main className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">{t('page_title')}</h1>
          <p className="text-muted-foreground mb-8">{t('page_desc')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.filter(s => s.is_active).map(section => (
              <Link key={section.id} href={sectionLinks[section.key] || '#'}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{sectionIcons[section.key] || '📄'}</div>
                    <h2 className="text-xl font-semibold text-card-foreground mb-2">
                      {t(sectionLabelMap[section.key] || section.key) || section.title}
                    </h2>
                    <div
                      className="text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: section.content.substring(0, 200) }}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-card-foreground">{t('instructors')}</h2>
              <Link
                href="/profil/personalia"
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                {t('view_all')} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {personalia.filter(p => p.is_active).slice(0, 4).map(person => (
                <Card key={person.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-muted">
                      {person.photo ? (
                        <img
                          src={photoUrl(person.photo)}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
                          {person.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-card-foreground">{person.name}</h3>
                    <p className="text-sm text-primary mt-1">{person.position}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
