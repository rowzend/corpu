'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCourses } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { useTranslations } from 'next-intl';


export default function CoursesPage({ basePath = '/courses' }: { basePath?: string }) {
  const router = useRouter();
  const t = useTranslations();

  const levelLabels: Record<string, string> = {
    all: t('courses_page.all'),
    beginner: t('courses_page.beginner'),
    intermediate: t('courses_page.intermediate'),
    advanced: t('courses_page.advanced'),
  };
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses({ page_size: 50 });
      setCourses(data?.results || []);
    } catch (error) {
      console.error('Error:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(
    courses
      .map(c => c.category?.name)
      .filter(Boolean)
  )] as string[];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLevel, selectedCategory, selectedRating, perPage]);

  const filteredCourses = courses.filter((course) => {
    const searchMatch = !searchTerm || course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
    const categoryMatch = selectedCategory === 'all' || course.category?.name === selectedCategory;
    let ratingMatch = true;
    if (selectedRating !== 'all') {
      const minRating = parseInt(selectedRating);
      ratingMatch = (course.rating_avg || 0) >= minRating;
    }
    return searchMatch && levelMatch && categoryMatch && ratingMatch;
  });

  const totalPages = Math.ceil(filteredCourses.length / perPage);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                {t('courses_page.program_badge')}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('courses_page.page_title')}</h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              {t('courses_page.page_subtitle')}
            </p>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{courses.length}+</div>
                <div className="text-sm text-primary-foreground/80">{t('courses_page.stats_courses')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{courses.reduce((s, c) => s + (c.enrolled_count || 0), 0)}+</div>
                <div className="text-sm text-primary-foreground/80">{t('courses_page.stats_participants')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">
                  {courses.length > 0
                    ? (courses.reduce((s, c) => s + (c.rating_avg || 0), 0) / courses.length).toFixed(1)
                    : '0.0'}/5
                </div>
                <div className="text-sm text-primary-foreground/80">{t('courses_page.stats_rating')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-muted">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-card rounded-xl shadow-md p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h2 className="text-xl font-bold text-card-foreground">{t('courses_page.filter')}</h2>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('courses_page.search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 text-sm border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-muted"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  {t('courses_page.level')}
                </h3>
                <div className="space-y-2">
                  {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                    <label key={level} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="level"
                        value={level}
                        checked={selectedLevel === level}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-4 h-4 text-primary focus:ring-ring"
                      />
                      <span className="ml-2 text-sm text-foreground group-hover:text-primary transition-colors">
                        {levelLabels[level]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  {t('courses_page.category')}
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="kategori"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-foreground group-hover:text-primary">{t('courses_page.all_categories')}</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="kategori"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 text-primary focus:ring-ring"
                      />
                      <span className="ml-2 text-sm text-foreground group-hover:text-primary" dangerouslySetInnerHTML={{ __html: cat }}></span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  {t('courses_page.rating')}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      value="all"
                      checked={selectedRating === 'all'}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-ring"
                    />
                    <span className="ml-2 text-foreground group-hover:text-primary">{t('courses_page.all')}</span>
                  </label>
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="rating"
                        value={rating.toString()}
                        checked={selectedRating === rating.toString()}
                        onChange={(e) => setSelectedRating(e.target.value)}
                        className="w-4 h-4 text-primary focus:ring-ring"
                      />
                      <span className="ml-2 flex items-center text-foreground group-hover:text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-muted-foreground'}>★</span>
                        ))}
                        {rating === 5 ? '' : ' ' + t('courses_page.and_above')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-card-foreground mb-2">{t('courses_page.course_list')}</h2>
                <p className="text-muted-foreground">{t('courses_page.showing')} <span className="font-semibold text-primary">{filteredCourses.length}</span> {t('courses_page.courses_count')}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('courses_page.show') + ':'}</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-card text-foreground text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('courses_page.sort') + ':'}</span>
                  <select className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-card text-foreground text-sm">
                    <option>{t('courses_page.newest')}</option>
                    <option>{t('courses_page.popular')}</option>
                    <option>{t('courses_page.highest_rating')}</option>
                    <option>{t('courses_page.a_z')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {paginatedCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="group bg-card rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`${basePath}/${course.slug}`)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail */}
                    <div className="md:w-80 h-64 md:h-auto bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-9xl flex-shrink-0 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <span className="transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 text-8xl opacity-60">
                          🎓
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary">
                        {levelLabels[course.level] || course.level}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          {course.category?.name && (
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full" dangerouslySetInnerHTML={{ __html: course.category.name }}>
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: course.short_description || course.description }}>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xl ${i < Math.round(course.rating_avg || 0) ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground font-medium">
                            {(course.rating_avg || 0).toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">({course.rating_count || 0})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {course.lesson_count || 0} {t('courses_page.lessons')}
                          </span>
                          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center gap-2">
                            <span>{course.duration_minutes || 0} {t('courses_page.minutes')}</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {t('courses_page.previous')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === currentPage
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'border border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {t('courses_page.next')}
                </button>
              </div>
            )}

            {filteredCourses.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl shadow-md">
                <div className="text-8xl mb-4">🎓</div>
                <h3 className="text-2xl font-bold text-card-foreground mb-2">{t('courses_page.no_results')}</h3>
                <p className="text-muted-foreground text-lg mb-6">{t('courses_page.no_results_desc')}</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLevel('all');
                    setSelectedCategory('all');
                    setSelectedRating('all');
                  }}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  {t('courses_page.reset_filter')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
