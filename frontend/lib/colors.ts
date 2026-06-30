/**
 * Brand Colors & Design System
 * Centralized color definitions for ASN Corpu
 */

// ─── PRIMARY BRAND COLORS ─────────────────────────────────────────────────────
export const brandColors = {
  primary: {
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',  // Main brand blue
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',  // Accent teal (from light mode background)
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
  },

  secondary: {
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',  // Emphasis red (CTA buttons)
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',  // Warm accent
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',  // Success green
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
  },

  // Dark mode specific
  dark: {
    navy: '#0d1a36',      // Dark mode accent (from dark mode background)
    midnight: '#000000',  // Pure black base
    glow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%)', // X Organizations top glow
    slate: {
      800: '#1e293b',
      900: '#0f172a',
    },
  },

  // Neutral palette
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// ─── SEMANTIC COLORS ──────────────────────────────────────────────────────────
export const semanticColors = {
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    hex: '#10B981',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    hex: '#F59E0B',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    hex: '#EF4444',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    hex: '#3B82F6',
  },
};

// ─── CATEGORY COLORS (for tags, badges, labels) ──────────────────────────────
export const categoryColors = {
  program: 'bg-blue-100 text-blue-700 border-blue-300',
  kerjasama: 'bg-green-100 text-green-700 border-green-300',
  berita: 'bg-purple-100 text-purple-700 border-purple-300',
  pengumuman: 'bg-orange-100 text-orange-700 border-orange-300',
  event: 'bg-pink-100 text-pink-700 border-pink-300',
  lainnya: 'bg-gray-100 text-gray-700 border-gray-300',
};

// ─── STATUS COLORS ────────────────────────────────────────────────────────────
export const statusColors = {
  online: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    dot: 'bg-green-500',
    hex: '#10B981',
  },
  offline: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    dot: 'bg-red-500',
    hex: '#EF4444',
  },
  idle: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    dot: 'bg-yellow-500',
    hex: '#F59E0B',
  },
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-500',
    hex: '#6B7280',
  },
};

// ─── ROLE COLORS (for user roles) ────────────────────────────────────────────
export const roleColors = {
  superadmin: {
    gradient: 'from-red-500 to-pink-600',
    bg: 'bg-red-100',
    text: 'text-red-700',
    hex: '#DC2626',
  },
  admin: {
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hex: '#8B5CF6',
  },
  instructor: {
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hex: '#3B82F6',
  },
  student: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-100',
    text: 'text-green-700',
    hex: '#10B981',
  },
  user: {
    gradient: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    hex: '#6B7280',
  },
};

// ─── COURSE LEVEL COLORS ──────────────────────────────────────────────────────
export const levelColors = {
  beginner: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    hex: '#10B981',
  },
  intermediate: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hex: '#3B82F6',
  },
  advanced: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hex: '#8B5CF6',
  },
  expert: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hex: '#DC2626',
  },
};

// ─── CONTENT TYPE COLORS ──────────────────────────────────────────────────────
export const contentTypeColors = {
  article: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    hex: '#3B82F6',
  },
  video: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    hex: '#8B5CF6',
  },
  document: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    hex: '#10B981',
  },
  link: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    hex: '#F97316',
  },
  quiz: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    hex: '#F59E0B',
  },
};

// ─── PRESET TAG COLORS ────────────────────────────────────────────────────────
export const presetTagColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#6B7280', // Gray
];

// ─── GRADIENT PRESETS ─────────────────────────────────────────────────────────
export const gradients = {
  brand: 'from-blue-600 via-teal-500 to-emerald-500',
  sunset: 'from-orange-500 via-red-500 to-pink-500',
  ocean: 'from-blue-500 via-cyan-500 to-teal-500',
  forest: 'from-green-500 via-emerald-500 to-teal-500',
  royal: 'from-purple-500 via-indigo-500 to-blue-500',
  fire: 'from-red-500 via-orange-500 to-yellow-500',
  
  // Light mode background - White base
  lightGlow: '#ffffff',
  
  // Dark mode background - X Organizations style
  darkHorizon: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%)',
};

// ─── SPECIAL EFFECTS ──────────────────────────────────────────────────────────
export const effects = {
  // Light mode teal glow effect (applied as overlay)
  lightGlowOverlay: 'radial-gradient(circle at top center, rgba(56, 193, 182, 0.5), transparent 70%)',
  
  // Blur amount for glow effects
  glowBlur: '80px',
};

// ─── BORDER COLORS (for decorative purposes) ─────────────────────────────────
export const decorativeBorders = [
  'border-blue-600',
  'border-green-600',
  'border-red-600',
  'border-purple-600',
  'border-orange-600',
  'border-pink-600',
  'border-cyan-600',
  'border-indigo-600',
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get color class for a given category
 */
export function getCategoryColor(category: string): string {
  const normalized = category.toLowerCase();
  return categoryColors[normalized as keyof typeof categoryColors] || categoryColors.lainnya;
}

/**
 * Get status color based on status string
 */
export function getStatusColor(status: string) {
  const normalized = status.toLowerCase();
  return statusColors[normalized as keyof typeof statusColors] || statusColors.pending;
}

/**
 * Get role color based on role string
 */
export function getRoleColor(role: string) {
  const normalized = role.toLowerCase();
  return roleColors[normalized as keyof typeof roleColors] || roleColors.user;
}

/**
 * Get level color based on level string
 */
export function getLevelColor(level: string) {
  const normalized = level.toLowerCase();
  return levelColors[normalized as keyof typeof levelColors] || levelColors.beginner;
}

/**
 * Get content type color
 */
export function getContentTypeColor(type: string) {
  const normalized = type.toLowerCase();
  return contentTypeColors[normalized as keyof typeof contentTypeColors] || contentTypeColors.article;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get random gradient from presets
 */
export function getRandomGradient(): string {
  const gradientKeys = Object.keys(gradients).filter(
    key => !['lightGlow', 'darkHorizon'].includes(key)
  );
  const randomKey = gradientKeys[Math.floor(Math.random() * gradientKeys.length)];
  return gradients[randomKey as keyof typeof gradients] as string;
}

/**
 * Get header background style (for card headers, hero sections, etc.)
 */
export function getHeaderBackground(isDark: boolean) {
  return {
    background: isDark ? brandColors.dark.midnight : gradients.lightGlow,
  };
}

/**
 * Get glow overlay style (for card headers, hero sections, etc.)
 */
export function getGlowOverlay(isDark: boolean) {
  return {
    background: isDark ? gradients.darkHorizon : effects.lightGlowOverlay,
    filter: isDark ? 'none' : `blur(${effects.glowBlur})`,
    backgroundRepeat: 'no-repeat',
  };
}

/**
 * Get icon/badge background color with theme awareness
 */
export function getIconBackground(isDark: boolean, opacity: number = 0.15) {
  return isDark 
    ? 'rgba(255, 255, 255, 0.1)' 
    : `rgba(56, 193, 182, ${opacity})`;
}

/**
 * Get icon color with theme awareness
 */
export function getIconColor(isDark: boolean) {
  return isDark ? brandColors.primary.blue[400] : brandColors.primary.teal[700];
}

/**
 * Get heading text color
 */
export function getHeadingColor(isDark: boolean) {
  return isDark ? brandColors.neutral[100] : brandColors.neutral[900];
}

/**
 * Get body text color
 */
export function getBodyTextColor(isDark: boolean) {
  return isDark ? brandColors.neutral[400] : brandColors.neutral[600];
}
