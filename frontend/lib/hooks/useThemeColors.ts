/**
 * Custom hook for theme-aware colors
 * Provides easy access to theme colors from any component
 */

import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  brandColors, 
  semanticColors, 
  statusColors,
  getHeaderBackground,
  getGlowOverlay,
  getIconBackground,
  getIconColor,
  getHeadingColor,
  getBodyTextColor
} from '@/lib/colors';

export function useThemeColors() {
  const { actualTheme } = useTheme();
  
  const isDark = actualTheme === 'dark';

  return {
    isDark,
    actualTheme,

    background: 'hsl(var(--background))',
    backgroundGradient: 'hsl(var(--background))',
    
    card: {
      bg: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
      hover: 'hsl(var(--accent))',
      bgClass: 'bg-card',
      borderClass: 'border-border',
      hoverClass: 'hover:bg-muted',
    },

    text: {
      primary: 'hsl(var(--foreground))',
      secondary: 'hsl(var(--muted-foreground))',
      muted: 'hsl(var(--muted-foreground))',
      primaryClass: 'text-foreground',
      secondaryClass: 'text-muted-foreground',
      mutedClass: 'text-muted-foreground',
    },

    semantic: semanticColors,
    status: statusColors,
    brand: brandColors,

    header: {
      background: getHeaderBackground(isDark),
      glowOverlay: getGlowOverlay(isDark),
    },
    icon: {
      background: (opacity?: number) => getIconBackground(isDark, opacity),
      color: getIconColor(isDark),
    },
    heading: {
      color: getHeadingColor(isDark),
    },
    body: {
      color: getBodyTextColor(isDark),
    },
  };
}
