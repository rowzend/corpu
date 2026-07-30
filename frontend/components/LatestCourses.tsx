'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LatestCourses() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const courses = [
    {
      id: 1,
      title: 'Manajemen Kinerja ASN',
      category: 'Manajemen',
      duration: '4 Minggu',
      level: 'Pemula',
      participants: 245,
      image: '🎯',
    },
    {
      id: 2,
      title: 'Pelayanan Publik Digital',
      category: 'Teknologi',
      duration: '3 Minggu',
      level: 'Menengah',
      participants: 189,
      image: '💻',
    },
    {
      id: 3,
      title: 'Kepemimpinan Transformasional',
      category: 'Leadership',
      duration: '6 Minggu',
      level: 'Lanjutan',
      participants: 312,
      image: '👔',
    },
    {
      id: 4,
      title: 'Analisis Kebijakan Publik',
      category: 'Kebijakan',
      duration: '5 Minggu',
      level: 'Menengah',
      participants: 156,
      image: '📋',
    },
  ];

  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 dark:bg-blue-900/30 rounded-full filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/30 rounded-full filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="inline-block mb-2">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1 rounded-full">
                📚 Pembelajaran Terkini
              </span>
            </div>
            <h2 className="text-4xl font-bold text-card-foreground mb-4">
              Kursus Terbaru
            </h2>
            <p className="text-xl text-muted-foreground">
              Pilihan kursus terbaik untuk pengembangan kompetensi Anda
            </p>
          </div>
          <Link
            href="/courses"
            className="hidden md:flex items-center gap-2 text-primary hover:text-primary font-semibold group"
          >
            Lihat Semua
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onMouseEnter={() => setHoveredCard(course.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-48 flex items-center justify-center text-8xl relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <span className={`transform transition-transform duration-500 ${hoveredCard === course.id ? 'scale-125 rotate-12' : ''}`}>
                  {course.image}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{course.level}</span>
                </div>
                <h3 className="text-lg font-bold text-card-foreground mb-3">
                  {course.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>⏱️ {course.duration}</span>
                  <span>👥 {course.participants}</span>
                </div>
                <Link
                  href="/courses"
                  className="group/btn block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                >
                  <span className="inline-flex items-center">
                    Lihat Detail
                    <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link
            href="/courses"
            className="text-primary hover:text-primary font-semibold"
          >
            Lihat Semua Kursus →
          </Link>
        </div>
      </div>
    </section>
  );
}
