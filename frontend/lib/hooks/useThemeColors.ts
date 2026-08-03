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
  const { actualTheme, getBackground, getBackgroundGradient, getTextColor, getCardBg, getBorderColor } = useTheme();
  
  const isDark = actualTheme === 'dark';

  return {
    // Theme state
    isDark,
    actualTheme,

    // Background colors
    background: getBackground(),
    backgroundGradient: getBackgroundGradient(),
    
    // Card colors
    card: {
      bg: getCardBg(),
      border: getBorderColor(),
      hover: isDark ? brandColors.neutral[800] : brandColors.neutral[100],
      bgClass: isDark ? 'bg-gray-900 dark:bg-gray-900' : 'bg-white dark:bg-gray-900',
      borderClass: isDark ? 'border-gray-800 dark:border-gray-800' : 'border-gray-200 dark:border-gray-800',
      hoverClass: isDark ? 'hover:bg-gray-800 dark:hover:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
    },

    // Text colors
    text: {
      primary: getTextColor(),
      secondary: isDark ? brandColors.neutral[400] : brandColors.neutral[600],
      muted: isDark ? brandColors.neutral[500] : brandColors.neutral[500],
      primaryClass: isDark ? 'text-gray-100 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100',
      secondaryClass: isDark ? 'text-gray-300 dark:text-gray-300' : 'text-gray-600 dark:text-gray-300',
      mutedClass: isDark ? 'text-gray-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400',
    },

    // Semantic colors (always the same regardless of theme)
    semantic: semanticColors,
    status: statusColors,

    // Brand colors
    brand: brandColors,

    // Helper functions for common patterns
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
