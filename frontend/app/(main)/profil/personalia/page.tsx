'use client';

import { useState, useEffect } from 'react';
import { getPersonalia, getPositions, photoUrl, type PersonaliaItem, type PositionItem } from '@/lib/api/profilePublic';
import { useTranslations } from 'next-intl';

function TreeNode({
  position,
  personaliaMap,
  level = 0,
}: {
  position: PositionItem;
  personaliaMap: Map<number, PersonaliaItem[]>;
  level?: number;
}) {
  const t = useTranslations('profile');
  const people = personaliaMap.get(position.id) || [];
  const hasChildren = position.children && position.children.length > 0;

  return (
    <div className="relative">
      <div className="flex flex-col items-center">
        {level > 0 && (
          <div className="w-px h-6 bg-border" />
        )}
        {people.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4">
            {people.map(person => (
              <div
                key={person.id}
                className="w-56 bg-card border border-border rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-muted ring-2 ring-border">
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
                <h3 className="font-semibold text-card-foreground text-sm leading-tight">{person.name}</h3>
                <p className="text-xs text-primary font-medium mt-1.5">{position.name}</p>
                {person.nip && (
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">{t('nip_prefix')}{person.nip}</p>
                )}
                {person.unit_kerja && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{person.unit_kerja}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-56 bg-muted/30 border border-dashed border-border/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground italic">{position.name}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{t('no_assignment')}</p>
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="relative mt-4">
          <div className="absolute left-1/2 top-0 w-px h-4 -translate-x-1/2 bg-border" />
          <div className="relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-border" />
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {position.children.map(child => (
                <TreeNode
                  key={child.id}
                  position={child}
                  personaliaMap={personaliaMap}
                  level={level + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonaliaPage() {
  const t = useTranslations('profile'); const tc = useTranslations('common');
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [personalia, setPersonalia] = useState<PersonaliaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPositions(), getPersonalia()])
      .then(([pos, pers]) => {
        setPositions(pos);
        setPersonalia(pers);
      })
      .catch(() => {
        setPositions([]);
        setPersonalia([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const personaliaMap = new Map<number, PersonaliaItem[]>();
  personalia.filter(p => p.is_active).forEach(person => {
    const pid = person.position_fk ?? person.position_id;
    if (pid !== null && pid !== undefined) {
      if (!personaliaMap.has(pid)) personaliaMap.set(pid, []);
      personaliaMap.get(pid)!.push(person);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">{tc('loading')}</div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
          <main className="container mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">{t('members')}</h1>
            <p className="text-muted-foreground">{t('page_desc')}</p>
            {personalia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {personalia.filter(p => p.is_active).map(person => (
                  <div key={person.id} className="bg-card border border-border rounded-xl p-5 text-center shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-muted ring-2 ring-border">
                      {person.photo ? (
                        <img src={photoUrl(person.photo)} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
                          {person.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-card-foreground">{person.name}</h3>
                    <p className="text-sm text-primary font-medium mt-1">{person.position}</p>
                    {person.nip && <p className="text-xs text-muted-foreground mt-1 font-mono">{t('nip_prefix')}{person.nip}</p>}
                    {person.unit_kerja && <p className="text-xs text-muted-foreground mt-0.5">{person.unit_kerja}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">{t('no_data')}</p>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">{t('members')}</h1>
            <p className="text-muted-foreground">{t('page_desc')}</p>
          </div>

          <div className="flex flex-col items-center gap-4 overflow-x-auto pb-8">
            {positions.filter(p => p.is_active).map(root => (
              <TreeNode
                key={root.id}
                position={root}
                personaliaMap={personaliaMap}
                level={0}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
