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

  // Dark mode specific - MIDNIGHT BLUE THEME
  dark: {
    navy: '#0a1f44',      // Midnight blue base (dari gambar 2)
    midnight: '#0a1f44',  // Midnight blue (bukan black)
    deepMidnight: '#0d2757', // Deeper midnight blue untuk variasi
    cardMidnight: '#0f2847', // Card background midnight blue
    glow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59, 130, 246, 0.15), transparent 70%)', // Blue glow untuk midnight theme
    slate: {
      800: '#16304F',  // Muted midnight blue
      900: '#0f2847',  // Deep midnight blue
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
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/30',
    hex: '#10B981',
  },
  warning: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    hex: '#F59E0B',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    hex: '#EF4444',
  },
  info: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    hex: '#3B82F6',
  },
};

// ─── CATEGORY COLORS (for tags, badges, labels) ──────────────────────────────
export const categoryColors = {
  program: 'bg-primary/10 text-primary border-primary/30',
  kerjasama: 'bg-accent/10 text-accent border-accent/30',
  berita: 'bg-secondary/10 text-secondary border-secondary/30',
  pengumuman: 'bg-destructive/10 text-destructive border-destructive/30',
  event: 'bg-primary/5 text-primary border-primary/20',
  lainnya: 'bg-muted text-muted-foreground border-border',
};

// ─── STATUS COLORS ────────────────────────────────────────────────────────────
export const statusColors = {
  online: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    dot: 'bg-accent',
    hex: '#10B981',
  },
  offline: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
    hex: '#EF4444',
  },
  idle: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    dot: 'bg-primary',
    hex: '#F59E0B',
  },
  pending: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
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
    bg: 'bg-accent/10',
    text: 'text-accent',
    hex: '#10B981',
  },
  intermediate: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    hex: '#3B82F6',
  },
  advanced: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    hex: '#8B5CF6',
  },
  expert: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    hex: '#DC2626',
  },
};

// ─── CONTENT TYPE COLORS ──────────────────────────────────────────────────────
export const contentTypeColors = {
  article: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    hex: '#3B82F6',
  },
  video: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    hex: '#8B5CF6',
  },
  document: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    hex: '#10B981',
  },
  link: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    hex: '#F97316',
  },
  quiz: {
    bg: 'bg-primary/5',
    text: 'text-primary',
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
  
  // Dark mode background - MIDNIGHT BLUE style (bukan X Organizations cyan)
  darkHorizon: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59, 130, 246, 0.15), transparent 70%)',
};

// ─── SPECIAL EFFECTS ──────────────────────────────────────────────────────────
export const effects = {
  // Light mode blue glow effect (applied as overlay) - disesuaikan dengan midnight blue theme
  lightGlowOverlay: 'radial-gradient(circle at top center, rgba(37, 99, 235, 0.08), transparent 70%)',
  
  // Dark mode midnight blue glow effect
  darkGlowOverlay: 'radial-gradient(circle at top center, rgba(59, 130, 246, 0.15), transparent 70%)',
  
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
export function getHeaderBackground(_isDark: boolean) {
  return {
    background: 'hsl(var(--card))',
  };
}

/**
 * Get glow overlay style (for card headers, hero sections, etc.)
 */
export function getGlowOverlay(_isDark: boolean) {
  return {
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.15), transparent 70%)',
    filter: 'blur(60px)',
    backgroundRepeat: 'no-repeat',
  };
}

/**
 * Get icon/badge background color with theme awareness
 */
export function getIconBackground(_isDark: boolean, opacity: number = 0.15) {
  return `hsla(var(--primary) / ${opacity})`;
}

/**
 * Get icon color with theme awareness
 */
export function getIconColor(_isDark: boolean) {
  return 'hsl(var(--primary))';
}

/**
 * Get heading text color
 */
export function getHeadingColor(_isDark: boolean) {
  return 'hsl(var(--foreground))';
}

/**
 * Get body text color
 */
export function getBodyTextColor(_isDark: boolean) {
  return 'hsl(var(--muted-foreground))';
}
