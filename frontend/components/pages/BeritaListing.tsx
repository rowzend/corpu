'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Eye, ArrowRight, Newspaper, Search, Loader2 } from 'lucide-react';
import { newsService } from '@/lib/services';

const categoryColors: Record<string, string> = {
    Program: 'bg-blue-100 text-blue-700',
    Kerjasama: 'bg-green-100 text-green-700',
    Event: 'bg-purple-100 text-purple-700',
    Pengumuman: 'bg-yellow-100 text-yellow-700',
};

export default function BeritaPage({ basePath = '/berita' }: { basePath?: string }) {
    const [news, setNews] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const perPage = 9;

    useEffect(() => {
        fetchNews();
    }, [page]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNews(page, perPage);
            setNews(res?.data || []);
            setTotal(res?.total || 0);
        } catch {
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = search
        ? news.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()))
        : news;

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                            <Newspaper className="w-4 h-4" />
                            <span>Informasi Terbaru</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Berita & Informasi</h1>
                        <p className="text-xl text-blue-100 mb-8">
                            Update terbaru seputar program, kegiatan, dan pengumuman ASN Academy
                        </p>
                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari berita..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada berita</h3>
                        <p className="text-gray-500">Belum ada berita yang dipublikasikan saat ini.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.map((item) => (
                                <Link
                                    key={item.id}
                                     href={`${basePath}/${item.slug || item.id}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl relative overflow-hidden">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <Newspaper className="w-16 h-16 text-white/40" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : item.created_at}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                {item.views || 0} dilihat
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                            {item.excerpt || item.content?.substring(0, 200)}
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                                            Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-12">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${
                                            p === page
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
