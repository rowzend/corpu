'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/1.0`;
  }
  return '/apicorpu/1.0';
}

interface RatingItem {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  course_title?: string;
}

export default function TestimonialsPage() {
  const t = useTranslations();
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getBaseURL()}/learning/ratings/?ordering=-created_at`)
      .then(r => r.json())
      .then(json => {
        const list = json.results ?? json.data ?? (Array.isArray(json) ? json : []);
        const filtered = list.filter((r: any) => r.comment && r.rating >= 4);
        setRatings(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Beranda
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Testimonial</h1>
        <p className="text-muted-foreground mb-10">Apa kata mereka tentang program pengembangan kompetensi ASN Corpu</p>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Memuat...</div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Belum ada testimonial</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {ratings.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {r.user_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-card-foreground">{r.user_name}</div>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-muted-foreground'}>★</span>
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
