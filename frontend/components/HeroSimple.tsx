'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HeroSimple() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className={`inline-block mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              ✨ Platform Pembelajaran ASN Modern
            </span>
          </div>

          {/* Heading */}
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 leading-tight transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Pesisir Selatan
            <br />
            <span className="text-yellow-300 inline-block hover:scale-110 transition-transform duration-300">
              Corporate University
            </span>
          </h1>

          {/* Description */}
          <p className={`text-xl md:text-2xl mb-8 text-blue-100 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Platform pembelajaran digital untuk pengembangan kapasitas
            Aparatur Sipil Negara yang profesional dan berintegritas
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              href="/courses"
              className="group bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 transform"
            >
              <span className="inline-flex items-center">
                Jelajahi Kursus
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/profile"
              className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 transform"
            >
              Tentang Kami
            </Link>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-yellow-300">1000+</div>
              <div className="text-blue-100 mt-2">Peserta Aktif</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-yellow-300">50+</div>
              <div className="text-blue-100 mt-2">Kursus Tersedia</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-yellow-300">95%</div>
              <div className="text-blue-100 mt-2">Tingkat Kepuasan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}