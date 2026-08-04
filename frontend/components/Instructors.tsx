'use client';

import { useState, useEffect } from 'react';

interface Personalia {
  id: number;
  name: string;
  nip: string | null;
  position: string;
  description: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  unit_kerja: string | null;
  order: number;
  is_active: boolean;
}

// Helper function to get correct base URL
function getPublicBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return '/apicorpu/public/1.0';
}

// Helper function to get correct image URL
function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const url = new URL(path);
      const relativePath = url.pathname;
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}${relativePath}`;
    } else {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}${path}`;
    }
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
}

// Get Personalia data
async function getPersonalia(): Promise<Personalia[]> {
  const res = await fetch(`${getPublicBaseURL()}/profile/personalia/`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch personalia');
  }
  
  const json = await res.json();
  
  // Handle different response formats
  if (json.results && Array.isArray(json.results)) {
    return json.results;
  }
  if (json.data && Array.isArray(json.data)) {
    return json.data;
  }
  if (Array.isArray(json)) {
    return json;
  }
  
  console.error('Unexpected API response format:', json);
  return [];
}

export default function Instructors() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [personalia, setPersonalia] = useState<Personalia[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback instructors
  const fallbackInstructors = [
    {
      id: 1,
      name: 'Dr. Ahmad Wijaya, M.Pd.',
      position: 'Spesialis Manajemen Kepemimpinan dan Kebijakan Publik',
      photo: null,
      borderColor: 'border-blue-600',
    },
    {
      id: 2,
      name: 'Prof. Siti Nurhaliza, Ph.D.',
      position: 'Ahli Administrasi Publik dan Reformasi Birokrasi',
      photo: null,
      borderColor: 'border-blue-600',
    },
    {
      id: 3,
      name: 'Drs. Budi Santoso, M.Si.',
      position: 'Praktisi Pelayanan Publik dan Inovasi Pemerintahan',
      photo: null,
      borderColor: 'border-red-600',
    },
    {
      id: 4,
      name: 'Dr. Ir. Dewi Lestari, M.T.',
      position: 'Spesialis Transformasi Digital dan E-Government',
      photo: null,
      borderColor: 'border-blue-600',
    },
  ];

  const borderColors = ['border-blue-600', 'border-green-600', 'border-red-600', 'border-purple-600', 'border-orange-600'];

  useEffect(() => {
    const fetchPersonalia = async () => {
      try {
        const data = await getPersonalia();
        
        console.log('Fetched personalia:', data);
        
        if (!Array.isArray(data)) {
          console.error('Personalia data is not an array:', data);
          setLoading(false);
          return;
        }
        
        // Filter active personalia and sort by order
        const activePersonalia = data
          .filter(p => p.is_active)
          .sort((a, b) => a.order - b.order);
        
        console.log('Active personalia:', activePersonalia);
        setPersonalia(activePersonalia);
      } catch (error) {
        console.error('Error fetching personalia:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalia();
  }, []);

  // Use personalia if available, otherwise fallback
  const instructors = personalia.length > 0 
    ? personalia.map((p, index) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        photo: getImageUrl(p.photo),
        borderColor: borderColors[index % borderColors.length],
        unit_kerja: p.unit_kerja,
      }))
    : fallbackInstructors;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % instructors.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + instructors.length) % instructors.length);
  };

  // Calculate visible instructors based on screen size and available data
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return Math.min(4, instructors.length);
    const availableCount = instructors.length;
    if (window.innerWidth < 768) return Math.min(1, availableCount);
    if (window.innerWidth < 1024) return Math.min(2, availableCount);
    return Math.min(4, availableCount);
  };

  const visibleCount = typeof window !== 'undefined' ? getVisibleCount() : Math.min(4, instructors.length);
  
  // Only show the actual instructors without looping if we have fewer than visibleCount
  const visibleInstructors = instructors.length <= visibleCount
    ? instructors
    : Array.from({ length: visibleCount }, (_, i) => 
        instructors[(currentIndex + i) % instructors.length]
      );

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
              Profil Pengajar
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-3xl shadow-lg p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-2xl mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (instructors.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
            Profil Pengajar
          </h2>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          {instructors.length > visibleCount && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 -ml-4"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 -mr-4"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Instructors Grid */}
          <div className={`grid gap-6 px-8 ${
            instructors.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
            instructors.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
            instructors.length === 3 ? 'md:grid-cols-3 max-w-4xl mx-auto' :
            'md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {visibleInstructors.map((instructor, index) => (
              <div
                key={`${instructor.id}-${index}`}
                className="group bg-card rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
              >
                {/* Image Container with Decorative Frame */}
                <div className={`relative p-4 border-8 ${instructor.borderColor} rounded-3xl m-4 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden`}>
                  {/* Decorative Corner Elements */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-2 left-2 w-16 h-16 border-l-4 border-t-4 border-yellow-400 rounded-tl-2xl"></div>
                    <div className="absolute top-2 right-2 w-16 h-16 border-r-4 border-t-4 border-green-500 rounded-tr-2xl"></div>
                    <div className="absolute bottom-2 left-2 w-16 h-16 border-l-4 border-b-4 border-red-500 rounded-bl-2xl"></div>
                    <div className="absolute bottom-2 right-2 w-16 h-16 border-r-4 border-b-4 border-blue-400 rounded-br-2xl"></div>
                  </div>
                  
                  {/* Profile Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    {instructor.photo ? (
                      <img 
                        src={instructor.photo} 
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-6xl">👤</div>';
                        }}
                      />
                    ) : (
                      <div className="text-8xl">👤</div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">
                    {instructor.name}
                  </h3>
                  {(instructor as any).unit_kerja && (
                    <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                      {(instructor as any).unit_kerja}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {instructor.position}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          {instructors.length > visibleCount && (
            <div className="flex justify-center gap-2 mt-8">
              {instructors.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-blue-600 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
