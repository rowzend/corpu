'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getProfileSections, photoUrl, type ProfileSection } from '@/lib/api/profilePublic';

export default function StrukturPage() {
  const [section, setSection] = useState<ProfileSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileSections()
      .then(data => setSection(data.find(s => s.key === 'struktur_organisasi') || null))
      .catch(() => setSection(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center py-12">Memuat...</div>;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Struktur Organisasi</h1>

      {section ? (
        <Card>
          <CardContent className="p-6">
            {section.image && (
              <div className="mb-6">
                <img
                  src={photoUrl(section.image)}
                  alt="Struktur Organisasi"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
            <div
              className="text-gray-700 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-500">Belum ada data struktur organisasi.</p>
      )}
    </main>
  );
}
