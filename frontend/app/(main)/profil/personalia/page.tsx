'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPersonalia, photoUrl, type PersonaliaItem } from '@/lib/api/profilePublic';

export default function PersonaliaPage() {
  const [personalia, setPersonalia] = useState<PersonaliaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalia()
      .then(data => setPersonalia(data))
      .catch(() => setPersonalia([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center py-12">Memuat...</div>;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-card-foreground mb-2">Personalia</h1>
      <p className="text-muted-foreground mb-8">Struktur Personalia Lembaga Manajemen ASN CORPU</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personalia.filter(p => p.is_active).map(person => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                {person.photo ? (
                  <img
                    src={photoUrl(person.photo)}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl font-bold">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{person.name}</h3>
              {person.nip && (
                <p className="text-sm text-muted-foreground mt-1">NIP. {person.nip}</p>
              )}
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">{person.position}</p>
              {person.unit_kerja && (
                <p className="text-sm text-muted-foreground mt-1">{person.unit_kerja}</p>
              )}
              {person.description && (
                <div
                  className="text-sm text-muted-foreground mt-3"
                  dangerouslySetInnerHTML={{ __html: person.description }}
                />
              )}
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="text-sm text-blue-500 hover:underline block mt-2"
                >
                  {person.email}
                </a>
              )}
              {person.phone && (
                <p className="text-sm text-muted-foreground mt-1">{person.phone}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {personalia.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Belum ada data personalia.</p>
      )}
    </main>
  );
}
