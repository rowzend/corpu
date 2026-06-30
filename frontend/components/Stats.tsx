'use client';

import { useEffect, useState, useRef } from 'react';

export default function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    // Generate particles only on client side
    setParticles(
      [...Array(15)].map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2,
      }))
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      icon: '👥',
      value: 10000,
      suffix: '+',
      label: 'ASN Terdaftar',
      color: 'from-blue-400 to-blue-500',
    },
    {
      icon: '📚',
      value: 150,
      suffix: '+',
      label: 'Kursus Tersedia',
      color: 'from-green-400 to-green-500',
    },
    {
      icon: '🎓',
      value: 5000,
      suffix: '+',
      label: 'Sertifikat Diterbitkan',
      color: 'from-purple-400 to-purple-500',
    },
    {
      icon: '⭐',
      value: 4.8,
      suffix: '/5',
      label: 'Rating Kepuasan',
      color: 'from-pink-400 to-pink-500',
      decimals: 1,
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 relative overflow-hidden">
      {/* Animated Background Circles with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute top-20 right-20 w-80 h-80 bg-purple-400/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        {/* Floating Particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-gradient bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent bg-[length:200%_auto]">
            ASN Yang sudah Bergabung
          </h2>
          <p className="text-xl text-blue-100">
            ASN yang sudah mulai Ekplorasi untuk Pengembangan Kompetensinya
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Enhanced Stat Card Component
function StatCard({
  icon,
  value,
  suffix,
  label,
  color,
  index,
  isVisible,
  decimals = 0
}: {
  icon: string;
  value: number;
  suffix: string;
  label: string;
  color: string;
  index: number;
  isVisible: boolean;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isVisible, value, hasAnimated]);

  return (
    <div
      className={`group bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transform transition-all duration-700 hover:scale-110 hover:bg-white/20 border border-white/20 cursor-pointer relative overflow-hidden ${isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'
        }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      {/* Icon with Pulse */}
      <div className={`relative w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`}>
        <span className="relative z-10">{icon}</span>
        <div className="absolute inset-0 rounded-2xl border-4 border-white opacity-0 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500"></div>
      </div>

      {/* Counter */}
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">
        {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
      </div>

      {/* Label */}
      <div className="text-blue-100 font-medium text-sm group-hover:text-white transition-colors duration-300">
        {label}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-2000 ease-out`}
          style={{
            width: isVisible ? '100%' : '0%',
            transitionDelay: `${index * 100}ms`
          }}
        ></div>
      </div>
    </div>
  );
}
