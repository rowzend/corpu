import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests for development
  allowedDevOrigins: [
    '192.1.6.6',      // IP server ethernet
    '192.168.1.12',   // IP server wifi
    '192.1.6.43',     // IP lain di network
    '192.1.6.21',     // Laptop access
    'localhost',
    '127.0.0.1'
  ],

  // Use webpack for production build (Turbopack causes global-error prerender issue)
  // turbopack removed for stable build

  output: 'standalone',

  // Skip type checking and linting during production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove Django template rewrites - Pure Next.js now
  async rewrites() {
    return [
      // All API calls go to Django backend
      {
        source: '/apicorpu/:path*',
        destination: 'http://asncorpu_backend:8000/apicorpu/:path*',
      },
      // Health check
      {
        source: '/health',
        destination: 'http://asncorpu_backend:8000/health/',
      },
      // Django admin (for backend management)
      {
        source: '/admin-backend/:path*',
        destination: 'http://asncorpu_backend:8000/admin/:path*',
      },
      // Static and media files
      {
        source: '/static/:path*',
        destination: 'http://asncorpu_backend:8000/static/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://asncorpu_backend:8000/media/:path*',
      },
    ];
  },

  // Redirect configuration
  async redirects() {
    return [
      // Redirect old Django routes to Next.js equivalents
      {
        source: '/accounts/login',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
