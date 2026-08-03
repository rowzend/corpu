'use client';

import { useEffect, useRef, useState } from 'react';

// KMS Category Types
interface KMSCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent: number | null;
  order_index: number;
  is_active: boolean;
  article_count: number;
  full_path: string;
  created_at: string;
  updated_at: string;
}

// Helper function to get correct base URL
function getPublicBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return '/apicorpu/public/1.0';
}

// Get KMS Categories
async function getKMSCategories(): Promise<KMSCategory[]> {
  const res = await fetch(`${getPublicBaseURL()}/knowledge/categories/`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch KMS categories');
  }
  
  const json = await res.json();
  
  // Handle different response formats
  // If response has 'results' key (paginated), use that
  if (json.results && Array.isArray(json.results)) {
    return json.results;
  }
  // If response has 'data' key, use that
  if (json.data && Array.isArray(json.data)) {
    return json.data;
  }
  // If response is already an array, use it directly
  if (Array.isArray(json)) {
    return json;
  }
  
  // If none of the above, return empty array
  console.error('Unexpected API response format:', json);
  return [];
}

export default function Features() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [kmsCategories, setKmsCategories] = useState<KMSCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fallback hardcoded features with colors and icons
  const fallbackFeatures = [
    {
      icon: '🎯',
      title: 'Pengembangan Mandiri',
      description: 'Self Led Development',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-600',
      hoverColor: 'group-hover:from-blue-600 group-hover:to-blue-700',
    },
    {
      icon: '💻',
      title: 'Pengembangan Terprogram',
      description: 'Programmed Development',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-600',
      hoverColor: 'group-hover:from-green-600 group-hover:to-green-700',
    },
    {
      icon: '📚',
      title: 'Berbagi Pengetahuan',
      description: 'Knowledge Sharing',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500',
      hoverColor: 'group-hover:from-yellow-600 group-hover:to-yellow-700',
    },
    {
      icon: '🎥',
      title: 'Webinar',
      description: 'Webinar',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-600',
      hoverColor: 'group-hover:from-red-600 group-hover:to-red-700',
    },
    {
      icon: '📖',
      title: 'MOOC',
      description: 'Massive Open Online Course',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-600',
      hoverColor: 'group-hover:from-orange-600 group-hover:to-orange-700',
    },
  ];

  // Color schemes for categories
  const colorSchemes = [
    { bgColor: 'bg-blue-600', color: 'from-blue-500 to-blue-600' },
    { bgColor: 'bg-green-600', color: 'from-green-500 to-green-600' },
    { bgColor: 'bg-yellow-500', color: 'from-yellow-500 to-yellow-600' },
    { bgColor: 'bg-red-600', color: 'from-red-500 to-red-600' },
    { bgColor: 'bg-orange-600', color: 'from-orange-500 to-orange-600' },
    { bgColor: 'bg-purple-600', color: 'from-purple-500 to-purple-600' },
    { bgColor: 'bg-indigo-600', color: 'from-indigo-500 to-indigo-600' },
    { bgColor: 'bg-pink-600', color: 'from-pink-500 to-pink-600' },
  ];

  // Icons for categories
  const categoryIcons = ['📚', '💻', '🎯', '🎥', '📖', '🔬', '🏛️', '⚖️'];

  useEffect(() => {
    const fetchKMSCategories = async () => {
      try {
        const data = await getKMSCategories();
        
        console.log('Fetched KMS categories:', data); // Debug log
        
        // Ensure data is an array before filtering
        if (!Array.isArray(data)) {
          console.error('KMS categories data is not an array:', data);
          setLoading(false);
          return;
        }
        
        // Filter only parent categories (no parent) and active ones, limit to 8
        const parentCategories = data
          .filter(cat => cat.parent === null && cat.is_active)
          .sort((a, b) => a.order_index - b.order_index)
          .slice(0, 8);
        
        console.log('Filtered parent categories:', parentCategories); // Debug log
        setKmsCategories(parentCategories);
      } catch (error) {
        console.error('Error fetching KMS categories:', error);
        // Keep empty array, will use fallback
      } finally {
        setLoading(false);
      }
    };

    fetchKMSCategories();
  }, []);

  // Use KMS categories if available, otherwise fallback
  const features = kmsCategories.length > 0 
    ? kmsCategories.map((category, index) => ({
        icon: categoryIcons[index % categoryIcons.length],
        title: category.name,
        description: category.description || `${category.article_count} artikel`,
        color: colorSchemes[index % colorSchemes.length].color,
        bgColor: colorSchemes[index % colorSchemes.length].bgColor,
        articleCount: category.article_count,
        slug: category.slug,
      }))
    : fallbackFeatures;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index]);
              }, index * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [features]);

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-muted p-6 rounded-2xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                  <div>
                    <div className="w-20 h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="w-16 h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Animated Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-3xl transform rotate-12 opacity-30 animate-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-10 w-24 h-24 bg-purple-200 rounded-2xl transform -rotate-12 opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Top Category Tabs with Enhanced Hover */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group ${feature.bgColor} text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer relative overflow-hidden ${
                visibleCards.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl transform transition-all duration-500 ${
                  hoveredCard === index ? 'scale-125 rotate-12' : 'scale-100 rotate-0'
                }`}>
                  {feature.icon}
                </div>
                <div>
                  <div 
                    className="font-bold text-sm" 
                    dangerouslySetInnerHTML={{ __html: feature.title }}
                  />
                  <div className="text-xs opacity-90">{feature.description}</div>
                  {feature.articleCount !== undefined && (
                    <div className="text-xs opacity-75 mt-1">{(feature as any).articleCount} artikel</div>
                  )}
                </div>
              </div>
              
              {/* Pulse Ring on Hover */}
              {hoveredCard === index && (
                <div className="absolute inset-0 border-2 border-white rounded-2xl animate-ping opacity-75"></div>
              )}
            </div>
          ))}
        </div>

        {/* Main Title with Animated Underline */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4 relative inline-block">
            Akademi
            <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
          </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Berbagai program pembelajaran untuk pengembangan kompetensi ASN
          </p>
        </div>

        {/* Akademi Cards with 3D Effect */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: '👥',
              title: 'Kesejahteraan Sosial, Daya Saing Masyarakat dan Tata Kelola Pemerintahan',
              color: 'from-blue-400 to-blue-500',
              index: 0,
            },
            {
              icon: '🏗️',
              title: 'Pembangunan dan Perekonomian Akademi',
              color: 'from-green-400 to-green-500',
              index: 1,
            },
            {
              icon: '📋',
              title: 'Administrasi Umum dan Pengembangan SDM Pemerintahan',
              color: 'from-orange-400 to-orange-500',
              index: 2,
            },
          ].map((akademi) => (
            <div
              key={akademi.index}
              className={`group bg-card rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-4 hover:rotate-1 overflow-hidden cursor-pointer ${
                visibleCards.includes(akademi.index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${akademi.index * 100}ms` }}
            >
              <div className="p-8 text-center relative">
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${akademi.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className={`relative w-24 h-24 bg-gradient-to-br ${akademi.color} rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`}>
                  <span className="transform group-hover:scale-110 transition-transform duration-300">
                    {akademi.icon}
                  </span>
                  {/* Pulse Ring */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-current opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500"></div>
                </div>
                
                <h3 className="text-lg font-bold text-card-foreground mb-3 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                  {akademi.title}
                </h3>
                
                {/* Hover Arrow */}
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <svg className="w-6 h-6 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
