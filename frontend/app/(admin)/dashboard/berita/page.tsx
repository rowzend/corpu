'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Calendar, Newspaper, TrendingUp, Users, FileText } from 'lucide-react';
import { newsService } from '@/lib/services';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

export default function AdminBeritaPage() {
    const router = useRouter();
    const [news, setNews] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNews(1, 100);
            setNews(res?.data || []);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Berita');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await showConfirm(`Yakin ingin menghapus "${title}"?`, 'Hapus Berita', 'Hapus', 'Batal');
        if (!confirmed) return;
        try {
            await newsService.deleteNews(id);
            showToast('Berita berhasil dihapus', 'success');
            fetchNews();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus');
        }
    };

    const filtered = news.filter(n =>
        n.title?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: news.length,
        published: news.filter(n => n.status === 'published').length,
        draft: news.filter(n => n.status === 'draft').length,
        totalViews: news.reduce((s, n) => s + (n.views || 0), 0),
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Newspaper className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Kelola Berita</h1>
                                <p className="text-blue-100 text-sm">Publikasi dan kelola konten berita</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/berita/create')}
                            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> Tulis Berita
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Berita', value: stats.total, icon: Newspaper, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Published', value: stats.published, icon: FileText, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Draft', value: stats.draft, icon: EyeOff, color: 'bg-yellow-400/20 text-yellow-200' },
                            { label: 'Total Dilihat', value: stats.totalViews, icon: TrendingUp, color: 'bg-purple-400/20 text-purple-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-blue-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari berita..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                    />
                </div>
            </div>

            {/* News List */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                            {item.status === 'published' ? (
                                                <Badge className="bg-green-100 text-green-700 border-0 flex-shrink-0">
                                                    <Eye className="w-3 h-3 mr-1" />Published
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-700 border-0 flex-shrink-0">
                                                    <EyeOff className="w-3 h-3 mr-1" />Draft
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{item.excerpt || item.content?.substring(0, 150)}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                            {item.category && (
                                                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                                                    {item.category}
                                                </Badge>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {item.views || 0} dilihat
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => router.push(`/dashboard/berita/${item.id}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.title)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {news.length === 0 ? 'Belum ada berita' : 'Berita tidak ditemukan'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {news.length === 0
                            ? 'Mulai dengan menulis berita pertama Anda'
                            : 'Coba ubah kata kunci pencarian Anda'}
                    </p>
                    {news.length === 0 && (
                        <button
                            onClick={() => router.push('/dashboard/berita/create')}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" /> Tulis Berita Pertama
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
