'use client';

import { useEffect, useState } from 'react';
import { getBrands, type BrandItem } from '@/lib/api/profilePublic';

// Helper function to get correct image URL
function imageUrl(path: string | null): string | null {
  if (!path) return null;
  
  // Handle both full URLs and relative paths
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const url = new URL(path);
      // Extract path and rebuild with correct origin
      const relativePath = url.pathname;
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}${relativePath}`;
    } else {
      // Already a relative path
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}${path}`;
    }
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
}

export default function BrandSection() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands();
        
        // Filter active brands and sort by order
        const activeBrands = data
          .filter(brand => brand.is_active)
          .sort((a, b) => a.order - b.order);
        
        setBrands(activeBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
    setIsVisible(true);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center gap-16 md:gap-20 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60 bg-white/20 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className={`text-center transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-blue-100">Brand institusi akan ditampilkan di sini</div>
      </div>
    );
  }

  // Take first 3 brands for display
  const displayBrands = brands.slice(0, 3);

  return (
    <div className={`flex justify-center gap-16 md:gap-20 max-w-6xl mx-auto transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {displayBrands.map((brand, index) => {
        const imgUrl = imageUrl(brand.image_url);
        
        return (
          <div 
            key={brand.id} 
            className="group hover:scale-110 transition-all duration-500 cursor-pointer flex items-center justify-center"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={brand.name}
                className="w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60 object-contain filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
                onError={(e) => {
                  // Hide broken image, show nothing (brands section will be empty if all fail)
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60 bg-white/30 rounded-lg flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg">
                {brand.name.charAt(0)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}