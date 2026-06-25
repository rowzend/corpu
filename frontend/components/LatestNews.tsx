'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar, Eye, ArrowRight, Newspaper } from 'lucide-react';
import { newsService } from '@/lib/services';

const categoryColors: Record<string, string> = {
    Program: 'bg-blue-100 text-blue-700',
    Kerjasama: 'bg-green-100 text-green-700',
    Event: 'bg-purple-100 text-purple-700',
    Pengumuman: 'bg-yellow-100 text-yellow-700',
};

const defaultNews = [
    { id: 1, title: 'Peluncuran Program Pelatihan Digital Leadership 2024', excerpt: 'ASN Academy meluncurkan program pelatihan kepemimpinan digital untuk meningkatkan kompetensi ASN di era transformasi digital.', category: 'Program', image: '📢' },
    { id: 2, title: 'Kerjasama dengan Kementerian PANRB', excerpt: 'Penandatanganan MoU dengan Kementerian PANRB untuk pengembangan kurikulum pelatihan ASN yang lebih komprehensif.', category: 'Kerjasama', image: '🤝' },
    { id: 3, title: 'Webinar: Inovasi Pelayanan Publik', excerpt: 'Ikuti webinar gratis tentang inovasi pelayanan publik dengan narasumber dari berbagai instansi pemerintah.', category: 'Event', image: '🎤' },
];

export default function LatestNews() {
    const [news, setNews] = useState<any[]>(defaultNews);
    const [hoveredNews, setHoveredNews] = useState<number | null>(null);

    useEffect(() => {
        newsService.getLatestNews(3).then(res => {
            if (res?.data?.length) {
                setNews(res.data.map((n: any) => ({
                    ...n,
                    image: n.thumbnail || getCategoryIcon(n.category),
                })));
            }
        }).catch(() => {});
    }, []);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            Program: '📢', Kerjasama: '🤝', Event: '🎤', Pengumuman: '📋',
        };
        return icons[category] || '📰';
    };

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <div className="inline-block mb-2">
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full">
                                📰 Informasi Terbaru
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Berita Terkini</h2>
                        <p className="text-xl text-gray-600">Update terbaru seputar program dan kegiatan ASN Academy</p>
                    </div>
                    <Link
                        href="/berita"
                        className="hidden md:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold group"
                    >
                        Lihat Semua
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <article
                            key={item.id}
                            onMouseEnter={() => setHoveredNews(item.id)}
                            onMouseLeave={() => setHoveredNews(null)}
                            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-48 flex items-center justify-center text-8xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className={`transform transition-all duration-500 ${hoveredNews === item.id ? 'scale-110' : ''}`}>
                                    {item.image}
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                                        {item.category}
                                    </span>
                                    {item.published_at && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 mb-4 line-clamp-3">{item.excerpt || item.content?.substring(0, 200)}</p>
                                <Link
                                    href={`/berita/${item.slug || item.id}`}
                                    className="group/link inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                >
                                    Baca Selengkapnya
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-2 transition-transform duration-300" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="text-center mt-8 md:hidden">
                    <Link href="/berita" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Lihat Semua Berita →
                    </Link>
                </div>
            </div>
        </section>
    );
}
