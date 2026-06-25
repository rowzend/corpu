'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { getPublicArticles, getPublicCategories, getPublicKnowledgeStats, type Article, type Category } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';

function CategoryNode({
  category,
  level,
  selectedKategori,
  onSelect,
}: {
  category: Category;
  level: number;
  selectedKategori: string;
  onSelect: (k: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedKategori === category.name.toLowerCase();

  return (
    <>
      <button
        onClick={() => onSelect(category.name.toLowerCase())}
        className={`w-full text-left rounded-lg transition-all duration-300 flex items-center gap-2 ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
        } ${level > 0 ? 'text-sm' : 'text-sm font-medium'}`}
        style={{ padding: '8px 12px', paddingLeft: `${level * 20 + 12}px` }}
      >
        {level > 0 && (
          <span className="w-3 h-px bg-gray-300 flex-shrink-0" />
        )}
        <span className="truncate">{category.name}</span>
        {category.article_count > 0 && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
            isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {category.article_count}
          </span>
        )}
      </button>
      {hasChildren && (
        <div>
          {category.children!.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedKategori={selectedKategori}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function KMSPage() {
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    total_articles: 0,
    published_articles: 0,
    total_views: 0,
    total_likes: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch published articles, categories, and stats
      const [articlesResponse, categoriesResponse, statsResponse] = await Promise.all([
        getPublicArticles({ status: 'published', per_page: 50 }),
        getPublicCategories(),
        getPublicKnowledgeStats().catch(() => null) // Don't fail if stats unavailable
      ]);

      const articlesData: Article[] = articlesResponse?.results || [];
      const categoriesData: Category[] = categoriesResponse?.results || [];
      const statsData = statsResponse && 'total_articles' in statsResponse ? statsResponse : ((statsResponse as any)?.data || {});

      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setStats({
        total_articles: statsData.total_articles || articlesData.length || 0,
        published_articles: statsData.published_articles || articlesData.length || 0,
        total_views: statsData.total_views || 0,
        total_likes: statsData.total_likes || 0,
      });
    } catch (error) {
      console.error('Failed to fetch data:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Build category tree for hierarchical display
  const buildCategoryTree = (items: Category[]): Category[] => {
    const map = new Map<number, Category>();
    const roots: Category[] = [];
    items.forEach(item => map.set(item.id, { ...item, children: [] }));
    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent && map.has(item.parent)) {
        const parent = map.get(item.parent)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => a.order_index - b.order_index);
  };

  const categoryTree = buildCategoryTree(categories);

  const flattenCategoryNames = (tree: Category[]): string[] => {
    const names: string[] = [];
    const walk = (nodes: Category[]) => {
      nodes.forEach(n => {
        names.push(n.name);
        if (n.children?.length) walk(n.children);
      });
    };
    walk(tree);
    return names;
  };

  const allCategoryNames = flattenCategoryNames(categoryTree);

  const filteredArticles = articles.filter((article) => {
    if (!article) return false;

    const kategoriMatch = selectedKategori === 'semua' ||
      (article.category && article.category.name.toLowerCase() === selectedKategori.toLowerCase());

    const searchMatch = searchQuery === '' ||
      (article.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());

    return kategoriMatch && searchMatch;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.view_count || 0) - (a.view_count || 0);
      case 'liked':
        return (b.like_count || 0) - (a.like_count || 0);
      case 'commented':
        return (b.comment_count || 0) - (a.comment_count || 0);
      case 'newest':
      default:
        return new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime();
    }
  });

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'link': return '🔗';
      default: return '📝';
    }
  };

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'video': return 'from-red-500 to-pink-500';
      case 'document': return 'from-blue-500 to-indigo-500';
      case 'link': return 'from-green-500 to-teal-500';
      default: return 'from-purple-500 to-indigo-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-96"></div>
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                🧠 Knowledge Management System
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">KMS ASN Academy</h1>
            <p className="text-xl text-purple-100 mb-8">
              Pusat pengetahuan, best practice, dan inovasi untuk pengembangan ASN yang berkelanjutan
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari pengetahuan, best practice, atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pr-14 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.published_articles}+</div>
                <div className="text-sm text-purple-100">Artikel</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{categories.length}+</div>
                <div className="text-sm text-purple-100">Kategori</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{Math.floor(stats.total_views / 1000)}K+</div>
                <div className="text-sm text-purple-100">Views</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.total_likes}+</div>
                <div className="text-sm text-purple-100">Likes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F9FAFB" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar Categories */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Filter</h2>
              </div>

              {/* Categories */}
              <div className="space-y-1 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>Kategori</span>
                  <span className="text-xs text-gray-400 font-normal">({allCategoryNames.length})</span>
                </h3>
                <button
                  onClick={() => setSelectedKategori('semua')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium ${
                    selectedKategori === 'semua'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  Semua Kategori
                </button>
                {categoryTree.map(cat => (
                  <CategoryNode
                    key={cat.id}
                    category={cat}
                    level={0}
                    selectedKategori={selectedKategori}
                    onSelect={setSelectedKategori}
                  />
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
                    ➕ Kontribusi Pengetahuan
                  </Button>
                  <Button variant="outline" className="w-full">
                    📊 Lihat Statistik
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Items Grid */}
          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h2>
                <p className="text-gray-600">
                  Menampilkan <span className="font-semibold text-indigo-600">{sortedArticles.length}</span> dari {articles.length} artikel
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="newest">Terbaru</option>
                  <option value="popular">Terpopuler</option>
                  <option value="liked">Paling Disukai</option>
                  <option value="commented">Paling Banyak Komentar</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {sortedArticles.map((article) => (
                <div
                  key={article.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="flex">
                    {/* Icon/Cover */}
                    <div className={`w-48 flex-shrink-0 bg-gradient-to-br ${getContentTypeColor(article.content_type)} flex items-center justify-center text-7xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                        {getContentTypeIcon(article.content_type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {article.category && (
                            <Badge className="text-xs font-semibold text-indigo-600 bg-indigo-50">
                              {article.category.name}
                            </Badge>
                          )}
                          <Badge className="text-xs font-semibold text-gray-600 bg-gray-100">
                            {article.content_type}
                          </Badge>
                          {article.is_featured && (
                            <Badge className="text-xs font-semibold text-yellow-600 bg-yellow-50">
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-6 h-6" />
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {article.excerpt || article.content}
                      </p>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{article.author?.name || article.author?.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(article.published_at || article.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.view_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{article.like_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{article.comment_count || 0}</span>
                          </div>
                        </div>

                        <Link
                          href={`/kms/${article.slug}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
                        >
                          Baca Selengkapnya →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedArticles.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md">
                <div className="text-8xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery || selectedKategori !== 'semua' ? 'Tidak Ada Hasil' : 'Belum Ada Artikel'}
                </h3>
                <p className="text-gray-500 text-lg">
                  {searchQuery || selectedKategori !== 'semua'
                    ? 'Tidak ada artikel yang sesuai dengan pencarian Anda'
                    : 'Artikel sedang dalam proses persiapan'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKategori('semua');
                  }}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}