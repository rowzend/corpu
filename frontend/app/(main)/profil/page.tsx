'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

const sectionLabels: Record<string, string> = {
  sambutan: 'Sambutan',
  visi_misi: 'Visi & Misi',
  sejarah: 'Sejarah Corpu',
  struktur_organisasi: 'Struktur Organisasi',
};

export default function PublicProfilPage() {
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
        <div className="text-center py-12">Memuat...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Instansi</h1>
      <p className="text-gray-600 mb-8">Informasi tentang Lembaga Manajemen ASN CORPU</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.filter(s => s.is_active).map(section => (
          <Link key={section.id} href={sectionLinks[section.key] || '#'}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{sectionIcons[section.key] || '📄'}</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {sectionLabels[section.key] || section.title}
                </h2>
                <div
                  className="text-gray-600 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: section.content.substring(0, 200) }}
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pengajar</h2>
          <Link
            href="/profil/personalia"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personalia.filter(p => p.is_active).slice(0, 4).map(person => (
            <Card key={person.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-200">
                  {person.photo ? (
                    <img
                      src={photoUrl(person.photo)}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                      {person.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{person.name}</h3>
                <p className="text-sm text-blue-600 mt-1">{person.position}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
