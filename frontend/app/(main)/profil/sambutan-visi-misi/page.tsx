'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getProfileSections, type ProfileSection } from '@/lib/api/profilePublic';

export default function SambutanVisiMisiPage() {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileSections()
      .then(data => setSections(data.filter(s => ['sambutan', 'visi_misi'].includes(s.key))))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center py-12">Memuat...</div>;

  const sambutan = sections.find(s => s.key === 'sambutan');
  const visiMisi = sections.find(s => s.key === 'visi_misi');

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-card-foreground mb-8">Sambutan & Visi Misi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sambutan && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">{sambutan.title}</h2>
              <div
                className="text-foreground leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sambutan.content }}
              />
            </CardContent>
          </Card>
        )}
        {visiMisi && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">{visiMisi.title}</h2>
              <div
                className="text-foreground leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: visiMisi.content }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
