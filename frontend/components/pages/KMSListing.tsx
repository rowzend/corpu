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
import { useTranslations } from 'next-intl';

function CategoryNode({
  category,
  level,
  selectedKategori,
  onSelect,
}: {
  category: Category;
  level: number;
  selectedKategori: string;
  onSelect: (name: string, id: number) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true); // Auto-expand by default
  
  // Strip HTML for comparison and display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const categoryNameClean = stripHtml(category.name).toLowerCase();
  const categoryNameDisplay = stripHtml(category.name);
  const isSelected = selectedKategori === categoryNameClean;

  const handleClick = () => {
    console.log('Category clicked:', {
      categoryId: category.id,
      categoryNameOriginal: category.name,
      categoryNameClean,
      articleCount: category.article_count,
      parent: category.parent
    });
    onSelect(categoryNameClean, category.id);
  };

  // Check if text is truncated
  const isTruncated = categoryNameDisplay.length > (level > 0 ? 25 : 35);

  return (
    <>
      <button
        onClick={handleClick}
        className={`w-full text-left rounded-lg transition-all duration-300 flex items-center gap-2 group relative ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
        } ${level > 0 ? 'text-xs' : 'text-sm font-medium'} ${level > 0 ? 'py-2' : 'py-2.5'}`}
        style={{ paddingLeft: `${level * 16 + 12}px`, paddingRight: '12px' }}
        title={categoryNameDisplay} // Native browser tooltip as fallback
      >
        {/* Expand/Collapse Icon for parent categories */}
        {hasChildren && level === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 hover:scale-110 transition-transform"
          >
            <span className={`transition-transform duration-200 inline-block ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
        )}
        
        {/* Tree connector for child categories */}
        {level > 0 && (
          <span className={`w-2 h-px ${isSelected ? 'bg-white' : 'bg-gray-300'} flex-shrink-0`} />
        )}
        
        {/* Category Name with smart wrapping */}
        <span className={`flex-1 min-w-0 ${level > 0 && isTruncated ? 'line-clamp-2' : 'truncate'}`}>
          {categoryNameDisplay}
        </span>
        
        {/* Article Count Badge */}
        {category.article_count > 0 && (
          <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
            isSelected ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {category.article_count}
          </span>
        )}
        
        {/* Enhanced Tooltip - only show if text is truncated */}
        {isTruncated && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block lg:block z-50 pointer-events-none animate-fadeIn">
            <div className="relative">
              {/* Tooltip Arrow */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
              {/* Tooltip Content */}
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 shadow-2xl max-w-xs ml-1">
                <div className="font-semibold mb-1">{categoryNameDisplay}</div>
                {category.article_count > 0 && (
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {category.article_count} artikel
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </button>
      
      {/* Children with collapse animation */}
      {hasChildren && isExpanded && (
        <div className="overflow-hidden transition-all duration-300">
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

export default function KMSPage({ basePath = '/kms' }: { basePath?: string }) {
  const t = useTranslations();
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
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
      // Load ALL articles without pagination
      const [articlesResponse, categoriesResponse, statsResponse] = await Promise.all([
        getPublicArticles({ status: 'published', per_page: 1000, ordering: '-id' }),  // Load all, order by newest
        getPublicCategories(),
        getPublicKnowledgeStats().catch(() => null) // Don't fail if stats unavailable
      ]);

      const articlesData: Article[] = articlesResponse?.results || [];
      const categoriesData: Category[] = categoriesResponse?.results || [];
      const statsData = statsResponse && 'total_articles' in statsResponse ? statsResponse : ((statsResponse as any)?.data || {});

      // Debug logging
      console.log('=== KMS DATA DEBUG ===');
      console.log('Total articles:', articlesData.length);
      
      // Group articles by categoryId
      const articlesByCategory = articlesData.reduce((acc: any, article: any) => {
        const catId = article.category?.id || 'no-category';
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(article.title);
        return acc;
      }, {});
      
      console.log('Articles grouped by categoryId:', articlesByCategory);
      
      console.log('Articles with details:', articlesData.map(a => ({
        id: a.id,
        title: a.title,
        categoryId: a.category?.id,
        categoryName: a.category?.name,
        categoryParent: a.category?.parent
      })));
      console.log('Categories with details:', categoriesData.map(c => ({
        id: c.id,
        name: c.name,
        parent: c.parent,
        article_count: c.article_count
      })));

      // Find child categories of category 3
      const category3Children = categoriesData.filter(c => c.parent === 3);
      console.log('Children of category 3 (KOMPETENSI UMUM):', category3Children.map(c => ({
        id: c.id,
        name: c.name,
        article_count: c.article_count
      })));
      
      // Find articles in category 6 (ASN Maju)
      const articlesInCategory6 = articlesData.filter((a: any) => a.category?.id === 6);
      console.log('Articles in category 6 (ASN Maju):', articlesInCategory6.map((a: any) => ({
        id: a.id,
        title: a.title,
        categoryId: a.category?.id,
        categoryName: a.category?.name
      })));

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

  // Filter out LMS categories from KMS display
  const KMS_ONLY_CATEGORY_IDS = [38];
  const kmsCategories = categories.filter(c => !KMS_ONLY_CATEGORY_IDS.includes(c.id));

  const categoryTree = buildCategoryTree(kmsCategories);

  // Helper to get all category IDs including children
  const getAllCategoryIds = (categoryId: number): number[] => {
    const ids: number[] = [categoryId];
    
    const findChildren = (cats: Category[], parentId: number) => {
      cats.forEach(cat => {
        if (cat.parent === parentId) {
          ids.push(cat.id);
          findChildren(categories, cat.id); // Find children of this child
        }
      });
    };
    
    findChildren(categories, categoryId);
    return ids;
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedKategori, searchQuery, sortBy]);

  const filteredArticles = articles.filter((article) => {
    if (!article) return false;

    // Category filter using ID
    let kategoriMatch = selectedKategori === 'semua';
    
    if (!kategoriMatch && selectedCategoryId !== null && article.category) {
      const allowedCategoryIds = getAllCategoryIds(selectedCategoryId);
      kategoriMatch = allowedCategoryIds.includes(article.category.id);
      
      // Debug logging
      console.log('Filter Debug:', {
        selectedKategori,
        selectedCategoryId,
        allowedCategoryIds,
        articleTitle: article.title,
        articleCategoryId: article.category.id,
        articleCategoryName: article.category.name,
        match: kategoriMatch
      });
    }

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

  const totalPages = Math.ceil(sortedArticles.length / perPage);
  const paginatedArticles = sortedArticles.slice((currentPage - 1) * perPage, currentPage * perPage);

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
      <div className="min-h-screen bg-muted">
        <div className="animate-pulse">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-96"></div>
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-muted rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
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
                🧠 {t('kms_page.page_title')}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('kms_page.hero_title')}</h1>
            <p className="text-xl text-purple-100 mb-8">
              {t('kms_page.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('kms_page.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pr-14 rounded-xl text-card-foreground placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
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
                <div className="text-sm text-purple-100">{t('kms_page.title')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{kmsCategories.length}+</div>
                <div className="text-sm text-purple-100">{t('kms_page.categories')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{Math.floor(stats.total_views / 1000)}K+</div>
                <div className="text-sm text-purple-100">{t('common.views')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.total_likes}+</div>
                <div className="text-sm text-purple-100">{t('common.likes')}</div>
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
            <div className="bg-card rounded-xl shadow-md p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-card-foreground">{t('kms_page.filter')}</h2>
              </div>

              {/* Categories */}
              <div className="space-y-1 mb-6">
                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <span>{t('kms_page.categories')}</span>
                  <span className="text-xs text-muted-foreground font-normal">({allCategoryNames.length})</span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedKategori('semua');
                    setSelectedCategoryId(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium ${
                    selectedKategori === 'semua'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {t('kms_page.all_categories')}
                </button>
                {categoryTree.map(cat => (
                  <CategoryNode
                    key={cat.id}
                    category={cat}
                    level={0}
                    selectedKategori={selectedKategori}
                    onSelect={(name, id) => {
                      setSelectedKategori(name);
                      setSelectedCategoryId(id);
                    }}
                  />
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-card-foreground mb-4">{t('kms_page.quick_actions')}</h3>
                <div className="space-y-2">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
                    ➕ {t('kms_page.contribute')}
                  </Button>
                  <Button variant="outline" className="w-full">
                    📊 {t('kms_page.view_stats')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Items Grid */}
          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-card-foreground mb-2">{t('kms_page.knowledge_base')}</h2>
                <p className="text-muted-foreground">
                  {t('kms_page.showing_articles', { count: sortedArticles.length, total: articles.length })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('kms_page.per_page')}:</span>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-3 py-2 border border-border rounded-lg bg-card text-card-foreground text-sm"
                  >
                    {[5, 10, 15, 20, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-muted-foreground">{t('kms_page.sort')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-card"
                >
                  <option value="newest">{t('kms_page.newest')}</option>
                  <option value="popular">{t('kms_page.popular')}</option>
                  <option value="liked">{t('kms_page.most_liked')}</option>
                  <option value="commented">{t('kms_page.most_commented')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {paginatedArticles.map((article) => (
                <div
                  key={article.id}
                  className="group bg-card rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
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
                            <Badge className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
                              <span dangerouslySetInnerHTML={{ __html: article.category.name }} />
                            </Badge>
                          )}
                          <Badge className="text-xs font-semibold text-muted-foreground bg-muted">
                            {article.content_type}
                          </Badge>
                          {article.is_featured && (
                            <Badge className="text-xs font-semibold text-yellow-600 bg-yellow-50">
                              ⭐ {t('kms_page.featured')}
                            </Badge>
                          )}
                        </div>
                        <button className="text-muted-foreground hover:text-red-500 dark:text-red-400 transition-colors">
                          <Heart className="w-6 h-6" />
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {/* Removed author display */}
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
                          href={`${basePath}/${article.slug}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
                        >
                          {t('kms_page.read_more')} →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedArticles.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl shadow-md">
                <div className="text-8xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-card-foreground mb-2">
                  {searchQuery || selectedKategori !== 'semua' ? t('kms_page.no_results') : t('kms_page.no_articles')}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {searchQuery || selectedKategori !== 'semua'
                    ? t('kms_page.no_results_desc')
                    : t('kms_page.no_articles_desc')
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKategori('semua');
                    setSelectedCategoryId(null);
                  }}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  {t('kms_page.reset_filter')}
                </button>
              </div>
            )}

            {/* Pagination */}
            {sortedArticles.length > 0 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t('kms_page.page_info', {
                    start: (currentPage - 1) * perPage + 1,
                    end: Math.min(currentPage * perPage, sortedArticles.length),
                    total: sortedArticles.length
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'border border-border bg-card hover:bg-muted text-card-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}